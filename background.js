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
//The following does not work yet, needs to be worked on further
/*
import './App.css';

import { useEffect } from 'react';
import { Sapling } from "@saplingai/sapling-js/observer";

function App() {
  useEffect(() => {
    Sapling.init({
      endpointHostname: 'http://127.0.0.1:5000',
      saplingPathPrefix: '/sapling',
    });

    const editor = document.getElementById('editor');
    Sapling.observe(editor);

    const button = document.getElementById('ai-detect-btn');
    button.addEventListener('click', () => {
      Sapling.checkOnce(editor, {aiDetect: true});
    });
  });

  return (
    <>
      <div
        id="editor"
        sapling-ignore="true"
        contentEditable="true"
        style={{
          margin: '40px auto',
          padding: '10px',
          border: '2px solid black',
          width: '500px',
        }}>
        Phone chargers are essential accessories that have become an integral part of modern life. These devices are designed to replenish the battery life of our smartphones and other electronic gadgets, enabling us to stay connected and productive throughout the day. With advancements in technology, phone chargers have evolved significantly, offering various types such as wired, wireless, fast-charging, and portable chargers.
        <br/><br/>
        The convenience and versatility of phone chargers have revolutionized the way we use our devices, ensuring we can always stay powered up and connected in our fast-paced, digital world. Portable phone chargers, also known as power banks, have become a lifesaver for people on the go. These compact, battery-powered devices store electrical energy that can be used to charge our phones when an outlet is unavailable. Whether traveling, camping, or during emergencies, power banks ensure we are never left stranded with a dead phone battery.
      </div>
      <button id="ai-detect-btn" style={{
          padding: '10px',
          border: '2px solid black',
          width: '500px',
          height: '40px',
          cursor: 'pointer',
        }}>Check AI</button>
    </>
  );
}

export default App;
*/
