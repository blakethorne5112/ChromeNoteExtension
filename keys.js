chrome.runtime.onInstalled.addListener(() => {
    console.log('Note Taking Extension Installed');
    // Plagiarism Checker API Key and Search Engine ID
    chrome.storage.local.set({
        apiKeyPlagiarism: 'key here',
        searchEngineIdPlagiarism: 'key here'
    }, () => {
        console.log('Plagiarism API Key Updated.');
    });
});