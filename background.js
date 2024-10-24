// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarizePage") {
        const pageContent = request.content;
        // Use the fallback algorithm first
        const fallbackResult = fallbackToAlgorithm(pageContent);
        // Trim the summary to 200 words before sending it to the external API
        const trimmedSummary = trimToWordLimit(fallbackResult.summary, 200);
        
        summarizeText(trimmedSummary)
            .then(data => {
                const apiSummary = data.result || 'No summary returned';
                console.log(apiSummary);
                sendResponse({ 
                    summary: apiSummary, 
                    keywords: fallbackResult.keywords 
                });
            })
            .catch(error => {
                console.error('Error fetching summary:', error);
                sendResponse({ 
                    error: error.message, 
                    keywords: fallbackResult.keywords 
                });
            });
        return true; // Keep message channel open for asynchronous response
    }
});

// Fallback algorithm for keyword extraction and summarization
function fallbackToAlgorithm(content) {
    const keywords = getKeywords(content);
    const summary = summarizeContent(content);
    return { keywords, summary };
}

function getKeywords(text, numKeywords = 10) {
    const sentences = text.split('. ');
    const wordFrequency = {};
    const documentFrequency = {};

    // Calculate word frequency and document frequency
    sentences.forEach(sentence => {
        const words = sentence.toLowerCase().split(/\W+/);
        const uniqueWords = new Set(words);
        uniqueWords.forEach(word => {
            if (word.length > 3) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                documentFrequency[word] = (documentFrequency[word] || 0) + 1;
            }
        });
    });

    const numSentences = sentences.length;
    const keywordScores = {};

    // Calculate TF-IDF scores
    for (const word in wordFrequency) {
        const tf = wordFrequency[word];
        const idf = Math.log(numSentences / (documentFrequency[word] || 1));
        keywordScores[word] = tf * idf;
    }

    // Return top keywords
    return Object.keys(keywordScores)
        .sort((a, b) => keywordScores[b] - keywordScores[a])
        .slice(0, numKeywords);
}

function summarizeContent(text, maxSentences = 3) {
    const sentences = text.split('. ');
    const wordFrequency = {};

    // Calculate word frequency
    sentences.forEach(sentence => {
        const words = sentence.toLowerCase().split(/\W+/);
        words.forEach(word => {
            if (word.length > 3) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });
    });

    // Score sentences based on word frequency
    const sentenceScores = sentences.map(sentence => {
        const words = sentence.toLowerCase().split(/\W+/);
        let score = 0;
        words.forEach(word => {
            if (wordFrequency[word]) {
                score += wordFrequency[word];
            }
        });
        return { sentence, score };
    });

    // Sort sentences by score and return the top ones
    return sentenceScores
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSentences)
        .map(item => item.sentence)
        .join('. ');
}

// Trims the summary to a maximum of 200 words
function trimToWordLimit(text, maxWords = 200) {
    const words = text.split(/\s+/);  // Split text by spaces
    if (words.length > maxWords) {
        return words.slice(0, maxWords).join(' ') + '...';  // Return first 200 words
    }
    return text;  // If fewer than 200 words, return the original text
}

function summarizeText(summary) {


    console.log(summary);

    const requestBody = {
        key: apiKey,
        text: summary
    };

    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    });
}
