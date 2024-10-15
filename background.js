// Function to ensure content script is injected
function ensureContentScriptInjected(tabId, callback) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']  
    }, () => {
        if (callback) callback();
    });
}

// Function to ensure checkplagiarism script is injected
function ensureCheckPlagiarismScriptInjected(tabId, callback) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['checkplagiarism.js'] 
    }, () => {
        if (callback) callback();
    });
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');

    // Store the API key and Search Engine ID in chrome storage
    chrome.storage.local.set({
        // USER NEEDS TO ENTER THEIR OWN API KEY AND SEARCH ENGINE ID
        apiKey: 'key',
        searchEngineId: 'id'
    }, () => {
        console.log('API Key and Search Engine ID have been stored.');
    });
});



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Indicates async response

        case 'getScrapedContent':
            sendResponse({ contentList });
            return true;

        case 'generateCitation':
            generateCitation(sendResponse);
            return true;

        case 'checkPlagiarism':
            {
                let apiKey = 'key';
                let searchId = 'id';
                const query = 'Death Note (stylized in all caps) is a Japanese manga series written by Tsugumi Ohba and illustrated by Takeshi Obata. It was serialized in Shueishas shōnen manga magazine Weekly Shōnen Jump from December 2003 to May 2006'
        
                try {
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
                                if(compareText(query, item.snippet) > 60){
                                    //If the sentence is plagiarised, return the link to the website it was found at and the snippet
                                    plagiarisedText += `Plagiarism found at: ${item.link} with snippet: ${item.snippet}`;
                                    console.log(plagiarisedText);
                                }
                            });
                            sendResponse({ plagiarism: plagiarisedText });
                        } else {
                            // No results found
                            sendResponse({ error: 'No results found for the given query' });
                        }
                    })();
                } catch (error) {
                    console.error('Error:', error);
                    sendResponse({ error: 'Failed to check plagiarism' });
                }
                return true;
            }
        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});

function compareText(text, snippet) {
    // Split strings into words
    const words1 = new Set(text.toLowerCase().split(/\W+/));
    const words2 = new Set(snippet.toLowerCase().split(/\W+/));

    // Find common words
    const commonWords = [...words1].filter(word => words2.has(word));

    // Calculate similarity based on the ratio of common words to total words
    const totalWords = new Set([...words1, ...words2]).size;
    const similarity = commonWords.length / totalWords;
    return similarity * 100;
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

        // Ensure checkPlagiarism.js is injected
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
