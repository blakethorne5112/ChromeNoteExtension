function findAuthor() {
    // check for meta tags
    let author = document.querySelector('meta[name="author"]')?.content ||
                 document.querySelector('meta[property="article:author"]')?.content ||
                 document.querySelector('meta[name="dc.creator"]')?.content;

    if (author) return author;

    // check for schema.org markup
    let schemaNode = document.querySelector('[itemtype="http://schema.org/Article"]');
    if (schemaNode) {
        author = schemaNode.querySelector('[itemprop="author"]')?.textContent;
        if (author) return author.trim();
    }

    // check for common author class names or IDs
    const authorSelectors = [
        '.author', '#author', '.byline', '.writer', '.article-author',
        '[rel="author"]', '.contributor-name'
    ];
    for (let selector of authorSelectors) {
        author = document.querySelector(selector)?.textContent;
        if (author) return author.trim();
    }

    // check for author in the first few paragraphs
    const paragraphs = document.querySelectorAll('p');
    for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
        const text = paragraphs[i].textContent;
        if (text.toLowerCase().includes('by ')) {
            author = text.split('by ')[1].split('.')[0];
            return author.trim();
        }
    }

    return "Unknown";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);
    if (request.action === "generateCitation") {
        const title = document.title;
        const url = window.location.href;
        const author = findAuthor();
        const date = new Date().toISOString().split('T')[0];

        const citation = `${author}. (${date}). ${title}. Retrieved from ${url}`;
        
        console.log("Generated citation:", citation);
        sendResponse({citation: citation});
    }
    return true;
});