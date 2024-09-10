chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generateCitation") {
        const title = document.title;
        const url = window.location.href;
        const author = document.querySelector('meta[name="author"]')?.content || "Unknown";
        const date = new Date().toISOString().split('T')[0];

        const citation = `${author}. (${date}). ${title}. Retrieved from ${url}`;
        
        sendResponse({citation: citation});
    }
    return true;
});