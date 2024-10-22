// Finds author 
function findAuthor() {
    // Check meta tags first
    const metaSelectors = [
        'meta[name="author"]',
        'meta[property="article:author"]',
        'meta[name="dc.creator"]',
        'meta[property="og:author"]',
        'meta[name="twitter:creator"]'
    ];

    for (let selector of metaSelectors) {
        const metaTag = document.querySelector(selector);
        if (metaTag?.content) {
            return metaTag.content.trim();
        }
    }

    // Check schema for author tag
    const schemaNode = document.querySelector('[itemtype*="schema.org/Article"], [itemtype*="schema.org/NewsArticle"]');
    if (schemaNode) {
        const authorNode = schemaNode.querySelector('[itemprop="author"]');
        if (authorNode) {
            return authorNode.textContent.trim();
        }
    }

    // Checks for author classes
    const authorSelectors = [
        '.author',
        '#author',
        '.byline',
        '.writer',
        '.article-author',
        '[rel="author"]',
        '.contributor-name',
        '.post-author',
        '.entry-author'
    ];

    for (let selector of authorSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const clone = element.cloneNode(true);
            const links = clone.getElementsByTagName('a');
            for (let link of links) {
                link.remove();
            }
            const authorText = clone.textContent.trim();
            if (authorText) {
                return authorText.replace(/^by\s+|written by\s+|author:\s+/i, '').trim();
            }
        }
    }

    // Check for "by" or "written by" in page
    const paragraphs = document.querySelectorAll('p');
    for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
        const text = paragraphs[i].textContent;
        const byMatch = text.match(/(?:by|written by)\s+([^.|\n]+)/i);
        if (byMatch) {
            return byMatch[1].trim();
        }
    }

    return "Unknown";
}

// Finds publication date
function findPublicationDate() {
    const dateSelectors = [
        'meta[name="publication_date"]',
        'meta[property="article:published_time"]',
        'meta[name="date"]',
        'time[datetime]',
        'meta[property="og:published_time"]'
    ];

    for (let selector of dateSelectors) {
        const element = document.querySelector(selector);
        const dateStr = element?.content || element?.getAttribute('datetime');
        if (dateStr) {
            try {
                const date = new Date(dateStr);
                if (!isNaN(date)) {
                    return date.toISOString().split('T')[0];
                }
            } catch (e) {
                console.error("Could not find date:", e);
            }
        }
    }

    return new Date().toISOString().split('T')[0];
}

// Determines content type
function determineContentType() {
    const url = window.location.href;
    const domain = window.location.hostname;

    if (domain.includes('books.google.com')) {
        return 'book';
    } else if (domain.includes('doi.org') || document.querySelector('meta[name="citation_journal_title"]')) {
        return 'journal';
    } else if (domain.includes('news') || document.querySelector('meta[property="og:type"][content="article"]')) {
        return 'news';
    }
    return 'webpage';
}

// Generates citation based on fromat
function generateCitation(style) {
    const title = document.title;
    const url = window.location.href;
    const author = findAuthor();
    const date = findPublicationDate();
    const domain = window.location.hostname;
    const type = determineContentType();
    const accessDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    let citation;
    switch (style) {
        case 'APA7':
            switch (type) {
                case 'journal':
                    citation = `${author}. (${date}). ${title}. ${domain}. https://doi.org/${url.split('doi.org/')[1]}`;
                    break;
                case 'news':
                    citation = `${author}. (${date}). ${title}. ${domain}. ${url}`;
                    break;
                default:
                    citation = `${author}. (${date}). ${title}. ${url}`;
            }
            break;

        case 'Harvard':
            switch (type) {
                case 'journal':
                    citation = `${author} (${date.split('-')[0]}) '${title}', ${domain}. Available at: ${url} (Accessed: ${accessDate}).`;
                    break;
                default:
                    citation = `${author} (${date.split('-')[0]}) ${title} [online]. Available at: ${url} (Accessed: ${accessDate}).`;
            }
            break;

        case 'MLA':
            switch (type) {
                case 'news':
                    citation = `${author}. "${title}." ${domain}, ${date}, ${url}. Accessed ${accessDate}.`;
                    break;
                case 'journal':
                    citation = `${author}. "${title}." ${domain}, ${date}, ${url}.`;
                    break;
                default:
                    citation = `${author}. "${title}." ${domain}, ${url}. Accessed ${accessDate}.`;
            }
            break;

        case 'Chicago':
            switch (type) {
                case 'news':
                    citation = `${author}. "${title}." ${domain}, ${date}. ${url}.`;
                    break;
                case 'journal':
                    citation = `${author}. "${title}." ${domain} (${date}). ${url}.`;
                    break;
                default:
                    citation = `${author}. "${title}." ${domain}. Last modified ${date}. ${url}.`;
            }
            break;

        default:
            citation = `Citation style not supported: ${style}`;
    }

    console.log(`Generated ${style} citation for ${type}`);
    return citation;
}

// Listener for citation generation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    if (request.action === "generateCitation") {
        try {
            // Generate citation
            const citation = generateCitation(request.style || 'APA7');
            console.log('Generated citation:', citation);
            
            // Send response
            sendResponse({citation: citation});
        } catch (error) {
            console.error('Error generating citation:', error);
            sendResponse({
                citation: 'Error generating citation. Please try again.',
                error: error.message
            });
        }
    }
    return false;
});