// TODO for future. Running background tasks

chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
  });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Indicates async response

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
            const content = (results && results[0] && results[0].result) || 'Failed to scrape content.';
            const contentList = content.split('\n').filter(line => line.trim() !== "");
            callback({ contentList });
        });
    });
}
