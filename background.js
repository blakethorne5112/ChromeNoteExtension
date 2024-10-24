// Listener for messages from content scripts or popup
importScripts('keys.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarizePage") {
        const pageContent = request.content;
        // Use the fallback algorithm first
        const fallbackResult = fallbackToAlgorithm(pageContent);
        // Trim the summary to 200 words before sending it to the external API
        const trimmedSummary = trimToWordLimit(fallbackResult.summary, 200);
        
        summarizeText(trimmedSummary)
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
        return true; // Keep message channel open for asynchronous response
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Indicates async response

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
                    
                    summarizeText(trimmedSummary, data.apiKeySummary, data.apiUrlSummary)
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

// Fallback algorithm for keyword extraction and summarization
function fallbackToAlgorithm(content) {
    const keywords = getKeywords(content);
    const summary = summarizeContent(content);
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

function summarizeContent(text, maxSentences = 3) {
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

function summarizeText(summary, apiKey, apiUrl) {

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
