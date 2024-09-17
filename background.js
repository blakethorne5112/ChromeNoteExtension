//to do for further

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarizePage") {
        // Send message to the content script to extract the text
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getText" }, (response) => {
                if (response) {
                    // Process the extracted text here
                    const summarizedText = summarizeText(response.pageText); // can change this with summarization logic
                    sendResponse({ summary: summarizedText });
                }
            });
        });
        return true;  // Required to use sendResponse asynchronously
    }
});

// Placeholder for summarization logic
function summarizeText(text) {
    // This is a very basic summary logic, replace it with actual summarization algorithm
    const words = text.split(' ');
    const first50Words = words.slice(0, 50).join(' ');  // Return the first 50 words as a summary
    return `${first50Words}...`;
}




// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "extractText") {
//         const pageText = message.text;

//         // Call the backend server to summarize the text
//         fetch('http://localhost:5000/summarize', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ text: pageText })
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.summary) {
//                 chrome.runtime.sendMessage({
//                     action: "summarize",
//                     summary: data.summary
//                 });
//             } else {
//                 chrome.runtime.sendMessage({
//                     action: "summarize",
//                     summary: "Error: Could not summarize the text."
//                 });
//             }
//         })
//         .catch(error => {
//             console.error("Error calling backend:", error);
//         });
//     }
// });
