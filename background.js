// Scraping handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true;

        case 'generateCitation':
            generateCitation(sendResponse);
            return true;

        case 'checkPlagiarism':
            {
                chrome.storage.local.get(['apiKeyPlagiarism', 'searchEngineIdPlagiarism'], (data) => {
                    // If the key exists in storage, it will log it, otherwise log a placeholder
                    if (data.apiKeyPlagiarism && data.searchEngineIdPlagiarism) {
                        console.log('Plagiarism API Key:', data.apiKeyPlagiarism);
                        console.log('Plagiarism Search Engine Id:', data.searchEngineIdPlagiarism);
                        let apiKey = data.apiKeyPlagiarism;
                        let searchId = data.searchEngineIdPlagiarism;
                        const query = message.note;
                        console.log("Query Retrieved:", query);
                        try {
                            if (!query || query.trim() === "") {
                                throw new Error("InvalidNoteError");
                            }
                            (async () => {
                                console.log(`API Key: ${apiKey}, Search Engine ID: ${searchId}`);
                                const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchId}&q=${encodeURIComponent(query)}`;
                                const response = await fetch(url);
                                console.log('Response:', response);
                                if (!response.ok) {
                                    throw new Error(`Error: ${response.status} - ${response.statusText}`);
                                }
                
                                const plagiarismResults = await response.json();
        
                                console.log('plagiarismResults:', plagiarismResults);
                                // Check if items exist in the response
                                if (plagiarismResults.items && plagiarismResults.items.length > 0) {
                                    // Send the results back as a response
                                    let plagiarisedText = "";
                                    plagiarismResults.items.forEach(item => {
                                        const { mostSimilarChunk, highestSimilarity } = extractSimilarChunks(query, item.snippet);
                                        console.log(`Similarity: ${highestSimilarity}% for chunk: "${mostSimilarChunk}" compared to snippet: "${item.snippet}"`);
                                        if(highestSimilarity > 90){
                                            //If the sentence is plagiarised, return the link to the website it was found at and the snippet
                                            plagiarisedText += `
                                                <strong>Plagiarism found at:</strong> 
                                                <a href="${item.link}" target="_blank" style="color: blue;">${item.link}</a>
                                                <br>
                                                <strong>Snippet:</strong> ${item.snippet}
                                                <br>
                                                <strong>Similarity:</strong> 
                                                <span style="color: red; font-weight: bold;">${(highestSimilarity).toFixed(2)}%</span>
                                                <br><br>`;
                                            console.log(`Plagiarism found at: ${item.link} with snippet: ${item.snippet}. Similarity: ${highestSimilarity}%`);
                                        }
                                    });
                                    sendResponse({ plagiarism: plagiarisedText });
                                } else {
                                    // No results found
                                    sendResponse({ error: 'No results found for the given query' });
                                }
                            })();
                        } catch (error) {
                            if(error = "InvalidNoteError"){
                                sendResponse({ error: 'You must be writing or editing a note to check plagiarism!' });
                            }
                            else{
                                console.error('Error:', error);
                                sendResponse({ error: 'Failed to check plagiarism' });                        
                            }
                        }
                    } else {
                        console.log('Keys not set yet.');
                        sendResponse({ error: 'Failed to check plagiarism' });
                    }
                });
                return true;
            }
        default:
            console.log(`Unrecognized action: ${message.action}`);
    }
});

// Scrapes page
function scrapePageContent(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        // Ensure content.js is injected
        ensureContentScriptInjected(tabId, () => {
            chrome.tabs.sendMessage(tabId, { action: "generateCitation" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error generating citation:", chrome.runtime.lastError.message);
                    callback({ error: 'Could not generate citation.' });
                } else if (response && response.citation) {
                    callback({ citation: response.citation });
                } else {
                    callback({ error: 'Could not generate citation.' });
                }
            });
        });
    });
}
