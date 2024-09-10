// Extract text content from the current page
function extractTextFromPage() {
    const bodyText = document.body.innerText;
    return bodyText;
}

// Send extracted text to the background script for processing
chrome.runtime.sendMessage({
    action: "extractText",
    text: extractTextFromPage()
});
