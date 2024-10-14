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
        console.log("Received style:", request.style);  // Add this line
        const citation = generateCitation(request.style);
        console.log("Generated citation:", citation);
        sendResponse({citation: citation});
    }
    return true;
});

function generateCitation(style) {
    const title = document.title;
    const url = window.location.href;
    const author = findAuthor();
    const date = findPublicationDate();
    const domain = window.location.hostname;

    console.log("Generating citation with style:", style);  // Add this line

    switch (style) {
        case 'APA7':
            return `APA7: ${author}. (${date}). ${title}. ${domain}. ${url}`;
        case 'Harvard':
            return `Harvard: ${author}, ${date}. ${title}. [online] Available at: <${url}> [Accessed ${new Date().toDateString()}].`;
        case 'MLA':
            return `MLA: ${author}. "${title}." ${domain}, ${date}, ${url}. Accessed ${new Date().toDateString()}.`;
        case 'Chicago':
            return `Chicago: ${author}. "${title}." ${domain}. Last modified ${date}. ${url}.`;
        default:
            return `Citation style not supported: ${style}`;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);
    if (request.action === "generateCitation") {
        const citation = generateCitation(request.style);
        console.log("Generated citation:", citation);
        sendResponse({citation: citation});
    }
    return true;
});