// Background script for handling page scraping
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Indicates async response

        default:
            console.log(`Unrecognized action: ${message.action}`);
    }
});

// Scrape page content
function scrapePageContent(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => document.body.innerText
        }, (results) => {
            const content = (results && results[0] && results[0].result) || 'Failed to scrape content.';
            callback({ content });
        });
    });
}