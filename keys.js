chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
 
    
    
    // Store the API key and Search Engine ID in chrome storage
    chrome.storage.local.set({
        

        // KEY 1: 
        // USER NEEDS TO ENTER THEIR OWN API KEY AND SEARCH ENGINE ID
        apiKeyOpenAI: 'Fill in key',
        searchEngineId: 'Fill in search engine id'
    }, () => {
        console.log('API Key and Search Engine ID have been stored.');
    });
});
 