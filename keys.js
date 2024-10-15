chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
 
    // Manage API Keys -- DONT COMMIT YOUR ACTUAL KEYS TO GITHUB
    
    // Plagiarism Checker API Key and Search Engine ID
    chrome.storage.local.set({
        apiKeyPlagiarism: 'key',
        searchEngineIdPlagiarism: 'id'
    }, () => {
        console.log('Plagiarism API Key Updated.');
    });

});