// TODO for future. Running background tasks

chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
  });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'scrapePage':
            scrapePageContent(sendResponse);
            return true; // Indicates async response

        // Place for other actions

        default:
            console.warn(`Unhandled action: ${message.action}`);
    }
});
//function to scrape page content
function scrapePageContent(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => document.body.innerText
        }, (results) => {
            const content = (results && results[0] && results[0].result) || 'Failed to scrape content.';
            callback({ content });
        });
    });
}

  
// Implementation of AI text detection API (Sapling.ai) TO DO
//The following should work, but needs Node.js setup and axiom. Additionally, it only uses the terminal, so it must be changed to take input and give output to the extension UI
/*
// Import the axios library for making HTTP requests
const axios = require('axios');

// Function to check if the text is AI-generated using Sapling API
async function checkForAIContent(text) {
  try {
    // Send a POST request to Sapling's AI detection API
    const response = await axios.post(
      'https://api.sapling.ai/api/v1/aidetect',
      {
        key: '<your-api-key>',  // Replace with your API key
        text: text  // Text to analyze
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse and log the response data
    const { status, data } = response;
    console.log(`Status: ${status}`);
    console.log('AI Detection Result:', JSON.stringify(data, null, 4));
  } catch (err) {
    // Handle errors
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

// Sample text to be analyzed for AI content
const sampleText = 'This text is an example.';

// Call the function to check AI content in the sample text
checkForAIContent(sampleText);

*/
