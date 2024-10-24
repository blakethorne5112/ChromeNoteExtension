importScripts('keys.js');

// Function to ensure content script is injected
function ensureContentScriptInjected(tabId, callback) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']  
    }, () => {
        if (callback) callback();
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Indicates async response

        case 'summarisePage':
            chrome.storage.local.get(['apiKeySummary', 'apiUrlSummary'], (data) => {
                // If the key exists in storage, it will log it, otherwise log a placeholder
                if (data.apiKeySummary && data.apiUrlSummary) {
                    console.log('Summary API Key:', data.apiKeySummary);
                    console.log('Summary API URL:', data.apiUrlSummary);
                    const pageContent = request.content;
                    // Use the fallback algorithm first
                    const fallbackResult = fallbackToAlgorithm(pageContent);
                    // Trim the summary to 200 words before sending it to the external API
                    const trimmedSummary = trimToWordLimit(fallbackResult.summary, 200);
                    
                    summariseText(trimmedSummary, data.apiKeySummary, data.apiUrlSummary)
                        .then(data => {
                            const apiSummary = data.result || 'No summary returned';
                            console.log(apiSummary);
                            sendResponse({ 
                                summary: apiSummary, 
                                keywords: fallbackResult.keywords 
                            });
                        })
                        .catch(error => {
                            console.error('Error fetching summary:', error);
                            sendResponse({ 
                                error: error.message, 
                                keywords: fallbackResult.keywords 
                            });
                        });
                }
            });
            return true; // Keep message channel open for asynchronous response

        case 'aiDetection':

            chrome.storage.local.get(['apiKeyAIDetect'], (data) => {
                // If the key exists in storage, it will log it, otherwise log a placeholder
                if (data.apiKeyAIDetect) {
                    const apiKeyAIDetect = data.apiKeyAIDetect;
                    try {
                        (async () => {
                            const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    key: apiKeyAIDetect,
                                    text: message.text.toString()
                                })
                            });

                            const result = await response.json();
                            sendResponse({ result: result });
                        })();
                    } catch (error) {
                        console.error('Error:', error);
                        sendResponse({ error: 'Failed to detect AI content' });
                    }
                }

            });
            return true;

        case 'getScrapedContent':
            sendResponse({ contentList });
            return true;

        case 'generateCitation':
            generateCitation(sendResponse);
            return true;

        case 'checkPlagiarism':
            {
                chrome.storage.local.get(['apiKeyPlagiarism', 'searchEngineIdPlagiarism'], (data) => {
                    // If the key exists in storage, it will log it, otherwise log a placeholder
                    if (data.apiKeyPlagiarism && data.searchEngineIdPlagiarism) {
                        console.log('Plagiarism API Key:', data.apiKeyPlagiarism);
                        console.log('Plagiarism Search Engine Id:', data.searchEngineIdPlagiarism);
                        let apiKey = data.apiKeyPlagiarism;
                        let searchId = data.searchEngineIdPlagiarism;
                        const query = message.note;
                        console.log("Query Retrieved:", query);
                        try {
                            if (!query || query.trim() === "") {
                                throw new Error("InvalidNoteError");
                            }
                            (async () => {
                                console.log(`API Key: ${apiKey}, Search Engine ID: ${searchId}`);
                                const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchId}&q=${encodeURIComponent(query)}`;
                                const response = await fetch(url);
                                console.log('Response:', response);
                                if (!response.ok) {
                                    throw new Error(`Error: ${response.status} - ${response.statusText}`);
                                }
                
                                const plagiarismResults = await response.json();
        
                                console.log('plagiarismResults:', plagiarismResults);
                                // Check if items exist in the response
                                if (plagiarismResults.items && plagiarismResults.items.length > 0) {
                                    // Send the results back as a response
                                    let plagiarisedText = "";
                                    plagiarismResults.items.forEach(item => {
                                        const { mostSimilarChunk, highestSimilarity } = extractSimilarChunks(query, item.snippet);
                                        console.log(`Similarity: ${highestSimilarity}% for chunk: "${mostSimilarChunk}" compared to snippet: "${item.snippet}"`);
                                        if(highestSimilarity > 90){
                                            //If the sentence is plagiarised, return the link to the website it was found at and the snippet
                                            plagiarisedText += `
                                                <strong>Plagiarism found at:</strong> 
                                                <a href="${item.link}" target="_blank" style="color: blue;">${item.link}</a>
                                                <br>
                                                <strong>Snippet:</strong> ${item.snippet}
                                                <br>
                                                <strong>Similarity:</strong> 
                                                <span style="color: red; font-weight: bold;">${(highestSimilarity).toFixed(2)}%</span>
                                                <br><br>`;
                                            console.log(`Plagiarism found at: ${item.link} with snippet: ${item.snippet}. Similarity: ${highestSimilarity}%`);
                                        }
                                    });
                                    sendResponse({ plagiarism: plagiarisedText });
                                } else {
                                    // No results found
                                    sendResponse({ error: 'No results found for the given query' });
                                }
                            })();
                        } catch (error) {
                            if(error = "InvalidNoteError"){
                                sendResponse({ error: 'You must be writing or editing a note to check plagiarism!' });
                            }
                            else{
                                console.error('Error:', error);
                                sendResponse({ error: 'Failed to check plagiarism' });                        
                            }
                        }
                    } else {
                        console.log('Keys not set yet.');
                        sendResponse({ error: 'Failed to check plagiarism' });
                    }
                });
                return true;
            }
        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});

function extractSimilarChunks(note, snippet, windowSize = 5) {
    // Break the note into words
    const noteWords = note.split(/\s+/);
    const snippetLength = snippet.split(/\s+/).length;

    let mostSimilarChunk = "";
    let highestSimilarity = 0;

    // Iterate through the note in a sliding window fashion
    for (let i = 0; i <= noteWords.length - snippetLength; i++) {
        // Extract a chunk of the note with a similar word count to the snippet
        const chunk = noteWords.slice(i, i + snippetLength).join(" ");
        
        // Calculate similarity between this chunk and the snippet
        const similarity = compareText(chunk, snippet);

        // Keep track of the most similar chunk
        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            mostSimilarChunk = chunk;
        }
    }

    return { mostSimilarChunk, highestSimilarity };
}

function levenshtein(a, b) {
    const matrix = [];

    // Create the initial matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // Substitution
                    matrix[i][j - 1] + 1,     // Insertion
                    matrix[i - 1][j] + 1      // Deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function compareText(query, snippet) {
    // Normalize and remove non-word characters
    query = query.toLowerCase().replace(/\W+/g, ' ').trim();
    snippet = snippet.toLowerCase().replace(/\W+/g, ' ').trim();

    const distance = levenshtein(query, snippet);
    const maxLen = Math.max(query.length, snippet.length);

    // Calculate similarity as a percentage
    const similarity = ((maxLen - distance) / maxLen) * 100;
    return similarity;
}

// Function to generate citation
function generateCitation(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        // Ensure content.js is injected
        ensureContentScriptInjected(tabId, () => {
            chrome.tabs.sendMessage(tabId, { action: "generateCitation" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error generating citation:", chrome.runtime.lastError.message);
                    callback({ error: 'Could not generate citation.' });
                } else if (response && response.citation) {
                    callback({ citation: response.citation });
                } else {
                    callback({ error: 'Could not generate citation.' });
                }
            });
        });
    });
}

// Function to check plagiarism
async function checkPlagiarism(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        ensureCheckPlagiarismScriptInjected(tabId, () => {
            chrome.tabs.sendMessage(tabId, { action: "checkPlagiarism" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error generating plagiarism result:", chrome.runtime.lastError.message);
                    callback({ error: 'Could not generate plagiarism.' });
                } else if (response && response.plagiarism) {
                    callback({ plagiarism: response.plagiarism }); // Consistent response key
                } else {
                    callback({ error: 'Could not generate plagiarism.' });
                }
            });
        });
    });
}


let contentList = []; 
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^https?:/.test(tab.url)) {
    // Inject the content script when the tab is updated and fully loaded
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['popup.js']  // Inject the modified popup.js that contains scrapePageContent
    });
  }
});

// Function to scrape page content
function scrapePageContent(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => {
                // Get the main content of the page
                const bodyText = document.body.innerText;
                return bodyText.split('\n').filter(line => line.trim() !== ""); // Split and filter
            }
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error('Error scraping page:', chrome.runtime.lastError);
                callback({ contentList: [], error: 'Could not scrape content.' });
                return;
            }

            const content = (results && results[0] && results[0].result) || [];
            console.log('Scraped Content:', content); // Log for debugging
            contentList = content; // Store the scraped content

            // Return the processed content list
            callback({ contentList });
        });
    });
}

// Fallback algorithm for keyword extraction and summarization
function fallbackToAlgorithm(content) {
    const keywords = getKeywords(content);
    const summary = summariseContent(content);
    return { keywords, summary };
}

function getKeywords(text, numKeywords = 10) {
    const sentences = text.split('. ');
    const wordFrequency = {};
    const documentFrequency = {};

    // Calculate word frequency and document frequency
    sentences.forEach(sentence => {
        const words = sentence.toLowerCase().split(/\W+/);
        const uniqueWords = new Set(words);
        uniqueWords.forEach(word => {
            if (word.length > 3) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                documentFrequency[word] = (documentFrequency[word] || 0) + 1;
            }
        });
    });

    const numSentences = sentences.length;
    const keywordScores = {};

    // Calculate TF-IDF scores
    for (const word in wordFrequency) {
        const tf = wordFrequency[word];
        const idf = Math.log(numSentences / (documentFrequency[word] || 1));
        keywordScores[word] = tf * idf;
    }

    // Return top keywords
    return Object.keys(keywordScores)
        .sort((a, b) => keywordScores[b] - keywordScores[a])
        .slice(0, numKeywords);
}

function summariseContent(text, maxSentences = 3) {
    const sentences = text.split('. ');
    const wordFrequency = {};

    // Calculate word frequency
    sentences.forEach(sentence => {
        const words = sentence.toLowerCase().split(/\W+/);
        words.forEach(word => {
            if (word.length > 3) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });
    });

    // Score sentences based on word frequency
    const sentenceScores = sentences.map(sentence => {
        const words = sentence.toLowerCase().split(/\W+/);
        let score = 0;
        words.forEach(word => {
            if (wordFrequency[word]) {
                score += wordFrequency[word];
            }
        });
        return { sentence, score };
    });

    // Sort sentences by score and return the top ones
    return sentenceScores
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSentences)
        .map(item => item.sentence)
        .join('. ');
}

// Trims the summary to a maximum of 200 words
function trimToWordLimit(text, maxWords = 200) {
    const words = text.split(/\s+/);  // Split text by spaces
    if (words.length > maxWords) {
        return words.slice(0, maxWords).join(' ') + '...';  // Return first 200 words
    }
    return text;  // If fewer than 200 words, return the original text
}

function summariseText(summary, apiKey, apiUrl) {

    console.log(summary);

    const requestBody = {
        key: apiKey,
        text: summary
    };

    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    });
}