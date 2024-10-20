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

    // Fetch and log the apiKeyPlagiarism from local storage correctly
    chrome.storage.local.get('apiKeyPlagiarism', (data) => {
        // If the key exists in storage, it will log it, otherwise log a placeholder
        if (data.apiKeyPlagiarism) {
            console.log('Plagiarism API Key:', data.apiKeyPlagiarism);
        } else {
            console.log('Plagiarism API Key is not set yet.');
        }
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
            console.log("Checking plagiarism...");
            checkPlagiarism(sendResponse);
            return true;

        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});

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
