let apiKey, searchId;

chrome.storage.local.get(['apiKey', 'searchEngineId'], (result) => {
    apiKey = result.apiKey;
    searchId = result.searchEngineId;
});

//PROCESS:
//1. Get the text from the HTML scraper
//2. Split the text into sentences
//3. Search google for the sentences using the custom search API
//3. Check the search result snippets for similarity to original sentence
//4. If over a certain percentage, flag the sentence as plagiarized
//5. Return the flagged sentences


// Send message to background.js to check plagiarism for button clicks 
document.addEventListener('DOMContentLoaded', () => {
    const plagiarismButton = document.getElementById("checkPlagiarism");
    
    if (plagiarismButton) {
        plagiarismButton.addEventListener("click", function() {
            chrome.runtime.sendMessage({ action: 'checkPlagiarism' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error generating plagerism result:", chrome.runtime.lastError.message);
                    document.getElementById("plagiarismResult").textContent = "Could not generate plagiarism.";
                } else if (response && response.citation) {
                    document.getElementById("plagiarismResult").textContent = response.citation;
                } else {
                    document.getElementById("plagiarismResult").textContent = "Could not generate plagiarism.";
                }
            });
        });
    }
});

// Listens for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'checkPlagiarismJS':
            sendResponse({ plagiarism: "TESTS"});
        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});

function checkPlagiarism() {
    console.log("Checking plagiarism...");
    const data = getHTML();
    const text = splitText(data);
    if(text != 0){
        // Create map of paragraphs to their respective links and snippets
        const plagiarisedText = new Map();
        text.forEach(paragraph => {
            var sim = checkSimilarity(paragraph)
            if(sim != 0){
                // print to console sim
                console.log(sim);
                //If the paragraph is plagiarised, add it to the map
                //map = {paragraph: [link, snippet]}
                const similarityText = sim.split(',');
                const link = similarityText[0];
                const snippet = similarityText[1];
                plagiarisedText.set(link, snippet);
            };
        });
        return plagiarisedText;    
    }
}

function checkSimilarity(text) {
    const data = searchGoogle(text);
    // Google returns a JSON of search results that are stored as 'items'
    const items = data.items;
    // These items have fields such as 'snippet' which contain a brief snippet from the webpage 
    // that is most relevant to the search query
    items.forEach(item => {
        if(compareText(text, item.snippet) > 75){
            //If the sentence is plagiarised, return the link to the website it was found at and the snippet
            return `${item.link},${item.snippet}`;
        }
    });
    return 0;
}

function searchGoogle(query) {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchId}:omuauf_lfve&q=${query}`;
    const response =  fetch(url);
    const data =  response.json();
    return data;
}

//write a function that compares the text with the items and returns the percentage of similarity
function compareText(text, snippets) {
    // Split strings into words
    const words1 = new Set(text.toLowerCase().split(/\W+/));
    const words2 = new Set(snippets.toLowerCase().split(/\W+/));

    // Find common words
    const commonWords = [...words1].filter(word => words2.has(word));

    // Calculate similarity based on the ratio of common words to total words
    const totalWords = new Set([...words1, ...words2]).size;
    const similarity = commonWords.length / totalWords;
    return similarity * 100;
}


async function getHTML(data){
    return 'Death Note (stylized in all caps) is a Japanese manga series written by Tsugumi Ohba and illustrated by Takeshi Obata. It was serialized in Shueishas shōnen manga magazine Weekly Shōnen Jump from December 2003 to May 2006, with its chapters collected in 12 tankōbon volumes. The story follows Light Yagami, a genius high school student who discovers a mysterious notebook: the "Death Note", which belonged to the shinigami Ryuk, and grants the user the supernatural ability to kill anyone whose name is written in its pages.'
    //Get text from HTML scraper for query
}

function splitText(text){
    // The text is split into sentences by splitting it at every period, and trimmed for whitespace.
    const sentences = text.split('.').map(sentence => sentence.trim());
    if(sentences.length == 0){
        //If the text is empty, return an error message
        return 0;
    }
    else if(sentences.length > 50){
        // A limit of 50 sentences to avoid overloading the search engine
        sentences = sentences.slice(0, 50);
    }
    let paragraphs = [];
    for (let i = 0; i < sentences.length; i += 3) {
        // Join every 3 sentences back into one substring (paragraph)
        paragraphs.push(sentences.slice(i, i + 3).join('. ') + '.');
        // This results in less search queries and more coherent search results
    }
    return paragraphs;
}