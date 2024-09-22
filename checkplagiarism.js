require('dotenv').config();
const apiKey = process.env.API_KEY;
const searchId = process.env.SEARCH_ENGINE_ID;

//PROCESS:
//1. Get the text from the HTML scraper
//2. Split the text into sentences
//3. Search google for the sentences using the custom search API
//3. Check the search result snippets for similarity to original sentence
//4. If over a certain percentage, flag the sentence as plagiarized
//5. Return the flagged sentences

const data = getHTML();
const text = splitText(data);
if(text != 0){
    // Create map of sentences to their respective links and snippets
    text.forEach(sentence => {
        if(checkSimilarity(sentence) != 0){
            //If the sentence is plagiarised, add it to the map
            //map = {sentence: [link, snippet]}
        };
    });
    //Return the map    
}


async function checkSimilarity(text) {
    const data = await searchGoogle(text);
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

async function searchGoogle(query) {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchId}:omuauf_lfve&q=${query}`;
    const response = await fetch(url);
    const data = await response.json();
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
}

