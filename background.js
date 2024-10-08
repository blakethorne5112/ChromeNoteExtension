// Function to ensure content script is injected
function ensureContentScriptInjected(tabId, callback) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']  // Make sure content.js is the correct file to inject
    }, () => {
        if (callback) callback();
    });
}

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

let contentList = []; 

chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Indicates async response
        
        case 'getScrapedContent':
            sendResponse({ contentList });
            return true;

        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});
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
