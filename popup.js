chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "summarize") {
        document.getElementById('summary').innerText = message.summary;
    }
});

// Trigger the content script when the popup is opened
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
    });
});
