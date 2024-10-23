// Finds author 
function findAuthor() {
    
    // Limits author name to 2 words (scuffed function lol)
    function wordLimit(text) {
        return text
            .trim()
            .replace(/^by\s+|written by\s+|author:\s+/i, '') // Remove common prefixes
            .split(/\s+/) // Split into words
            .slice(0, 2) // Take first two words
            .join(' ') // Join back together
            .trim();
    }

    // Another scuffed function that just rmoves numbers, seperate from previous function cause twitter and reddit names
    // can have numbers but authors on news sites etc. should not
    function removeNumbers(text) {
        return text
            .replace(/\d+/g, '') // Remove all numbers
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    }

    // Twitter check
    if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
        // Try to get author
        const tweetAuthor = document.querySelector('[data-testid="User-Name"]')?.textContent ||
                           document.querySelector('[data-testid="tweet"] a[role="link"]')?.textContent ||
                           document.querySelector('article [dir="ltr"]')?.textContent;
        
        if (tweetAuthor) {
            return wordLimit(tweetAuthor.split('@')[0]); // removes the @
        }
    }

    // Reddit check
    if (window.location.hostname.includes('reddit.com')) {
       // Targets exact element
       const redditAuthor = document.querySelector('a.author-name[href^="/user/"]')?.textContent;
       
       if (redditAuthor) {
           let authorText = redditAuthor
               .trim()
               .replace(/^u\//, ''); // Removes the /u
           
           return authorText;
       }
    }

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
            return removeNumbers(wordLimit(metaTag.content.trim()));
        }
    }

    // Check schema for author tag
    const schemaNode = document.querySelector('[itemtype*="schema.org/Article"], [itemtype*="schema.org/NewsArticle"]');
    if (schemaNode) {
        const authorNode = schemaNode.querySelector('[itemprop="author"]');
        if (authorNode) {
            return removeNumbers(wordLimit(authorNode.textContent.trim()));
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
                return removeNumbers(wordLimit(authorText.replace(/^by\s+|written by\s+|author:\s+/i, '').trim()));
            }
        }
    }

    // Check for "by" or "written by" in page
    const paragraphs = document.querySelectorAll('p');
    for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
        const text = paragraphs[i].textContent;
        const byMatch = text.match(/(?:by|written by)\s+([^.|\n]+)/i);
        if (byMatch) {
            return removeNumbers(wordLimit(byMatch[1].trim()));
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

function findTitle() {
    // Get browser tab title
    let title = document.title;

    // Common separators in page titles
    const separators = [' | ', ' - ', ' – ', ' — ', ' » '];
    
    // Finds content before seperator (for example if source is Reddit thread it removes "- Reddit" or w/e)
    for (let separator of separators) {
        if (title.includes(separator)) {
            title = title.split(separator)[0].trim();
            break;
        }
    }

    return title || 'Untitled Page';
}

// Generates citation based on fromat
function generateCitation(style) {
    const title = findTitle();
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
                citation: 'Error generating citation.',
                error: error.message
            });
        }
    }
    return false;
});