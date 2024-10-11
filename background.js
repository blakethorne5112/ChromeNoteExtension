// TODO for future. Running background tasks

chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
  });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            console.log(message.data);
            scrapePageContent(sendResponse);
            return true; // Indicates async response

        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});


// Listener for YouTube videos found
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'youtubeViddeosFound') {
        console.log('YouTube videos found:', message.data);
        // Optionally send a response back
        sendResponse({ success: true });
    }

    console.log("YOUR MUM");
});


//function to scrape page content
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


