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
