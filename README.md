## Overview

The extension's action icon opens a page that allows you to create new notes, save them, edit them and delete them. 

## Watch the Demo Video here
[![Note-Taking Google Chrome Extension](https://img.youtube.com/vi/PKNFIc6VL-A/0.jpg)](https://www.youtube.com/watch?v=PKNFIc6VL-A)

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click on the action icon.
4. An extension page will open.

## Implementation Notes

Listeners are added for all events, so the table automatically updates when data in the reading list changes.\



USER To Update API Key -- > TODO: Seperate file for keys 
1. background.js -> 
2. chrome.runtime.onInstalled.addListener
        // USER NEEDS TO ENTER THEIR OWN API KEY AND SEARCH ENGINE ID
        apiKey: 'insert-api-key-here',
        searchEngineId: 'insert-search-engine-id-here'
