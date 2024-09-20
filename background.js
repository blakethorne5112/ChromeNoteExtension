// TODO for future. Running background tasks
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
            sendResponse({ contentList }); // Assuming contentList is stored globally
            return true;
            
        // Place for other actions

        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});
//function to scrape page content
function scrapePageContent(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => document.body.innerText
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error('Error scraping page:', chrome.runtime.lastError);
                callback({ contentList: [], error: 'Could not scrape content.' });
                return;
            }

            const content = (results && results[0] && results[0].result) || 'Failed to scrape content.';
            console.log('Raw Scraped Content:', content); // Log for debugging

            // Process the content (split lines, filter out empty)
            contentList = content.split('\n').filter(line => line.trim() !== "");
            console.log('Processed Content List:', contentList);

            // Return the processed content list
            callback({ contentList });
        });
    });
}

let contentList = []; 

// Fired when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
});

// Listener for incoming messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Keep the message channel open for async response

        case 'getScrapedContent':
            sendResponse({ contentList }); // Send the scraped content to popup
            return true;
            
        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});

