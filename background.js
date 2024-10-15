//    Algorithm for fallback - 02

// Function to get a summary from OpenAI
async function getSummaryFromOpenAI(content, sendResponse) {
    // Replace with your OpenAI API key
    const apiKey = ''; // Add your OpenAI API key here

    try {
        // Send request to OpenAI API to get the summary of the content
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // Authorization with API key
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Use GPT-3.5 Turbo model
                messages: [{
                    role: "user",
                    content: `Summarize the following content:\n\n${content}` // Pass the content to summarize
                }],
                temperature: 0.7, // Creativity of the model's response
                max_tokens: 150 // Limit the length of the response
            })
        });

        // If response is successful
        if (response.ok) {
            const data = await response.json();

            // If the response contains valid summary data
            if (data.choices && data.choices.length > 0) {
                sendResponse({ action: "summaryResponse", summary: data.choices[0].message.content }); // Send the summary back
            } else {
                fallbackToAlgorithm(content, sendResponse); // Fallback to custom algorithm if no response from OpenAI
            }
        } else {
            fallbackToAlgorithm(content, sendResponse); // Fallback on API error
        }
    } catch (error) {
        fallbackToAlgorithm(content, sendResponse); // Fallback on network or other errors
    }
}

// Fallback function for summarization and keyword extraction if OpenAI API fails
function fallbackToAlgorithm(content, sendResponse) {
    console.log('Fallback to advanced word frequency algorithm.');

    // Function to get keywords using TF-IDF method
    function getKeywords(text, numKeywords = 10) {
        const sentences = text.split('. '); // Split content into sentences
        const wordFrequency = {}; // Term frequency
        const tfidf = {}; // Document frequency

        // Loop through each sentence
        sentences.forEach((sentence) => {
            const words = sentence.toLowerCase().split(/\W+/); // Split sentence into words
            const uniqueWords = new Set(words); // Get unique words

            // Loop through each word and calculate frequency
            uniqueWords.forEach((word) => {
                if (word.length > 3) { // Ignore short words
                    wordFrequency[word] = (wordFrequency[word] || 0) + 1; // Count occurrences of each word
                    tfidf[word] = (tfidf[word] || 0) + 1; // Count document frequency
                }
            });
        });

        // Calculate TF-IDF scores
        const numSentences = sentences.length;
        const keywordScores = {};
        for (const word in wordFrequency) {
            const tf = wordFrequency[word]; // Term Frequency
            const idf = Math.log(numSentences / (tfidf[word] || 1)); // Inverse Document Frequency
            keywordScores[word] = tf * idf; // TF-IDF score for each word
        }

        // Sort and return top keywords based on scores
        return Object.keys(keywordScores).sort((a, b) => keywordScores[b] - keywordScores[a]).slice(0, numKeywords);
    }

    // Function to summarize content based on sentence importance
    function summarizeContent(text, numSentences = 5) {
        const sentences = text.split('. '); // Split content into sentences
        const wordFrequency = {}; // Word frequency map

        // Loop through each sentence to count word frequency
        sentences.forEach((sentence) => {
            const words = sentence.toLowerCase().split(/\W+/); // Split sentence into words
            words.forEach((word) => {
                if (word.length > 3) { // Ignore short words
                    wordFrequency[word] = (wordFrequency[word] || 0) + 1; // Count word occurrences
                }
            });
        });

        // Score each sentence based on word frequency
        const sentenceScores = sentences.map((sentence) => {
            const words = sentence.toLowerCase().split(/\W+/); // Split sentence into words
            const score = words.reduce((acc, word) => acc + (wordFrequency[word] || 0), 0); // Sum up word frequencies
            return { sentence, score }; // Return sentence with its score
        });

        // Sort sentences by score and select top ones
        const topSentences = sentenceScores.sort((a, b) => b.score - a.score).slice(0, numSentences);
        return topSentences.map(item => item.sentence).join('. ') + '...'; // Concatenate top sentences into a summary
    }

    // Get keywords and summary
    const keywords = getKeywords(content); // Extract keywords from content
    const summary = summarizeContent(content); // Summarize content

    // Send response back with summary and keywords
    sendResponse({ action: "summaryResponse", summary, keywords });
}

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarizePage") {
        const pageContent = request.content;
        getSummaryFromOpenAI(pageContent, sendResponse); // Try OpenAI first for summary
    }

    return true; // Keep message channel open for asynchronous response
});




