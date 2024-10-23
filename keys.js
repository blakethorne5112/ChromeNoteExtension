chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
 
    // Manage API Keys -- DONT COMMIT YOUR ACTUAL KEYS TO GITHUB
    
    // AI Checker API Key
    chrome.storage.local.set({
        apiKeyAIDetect: 'apikey',
    }, () => {
        console.log('AI Checker API Key Updated.');
    });


});