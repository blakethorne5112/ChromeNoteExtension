chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
 
    // Manage API Keys -- DONT COMMIT YOUR ACTUAL KEYS TO GITHUB
   
    // Ai Summary API Key and Search Engine ID
    chrome.storage.local.set({
        apiKeySummary: 'add here',
        apiUrlSummary: 'add here',
    }, () => {
        console.log('Summary API Key Updated.');
    });
});

