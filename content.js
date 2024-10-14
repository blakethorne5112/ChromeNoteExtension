console.log('Content script loaded');

function detectYouTubeVideos() {
    const videos = Array.from(document.querySelectorAll('iframe[src*="youtube.com"]'));
    if (videos.length > 0) {
        console.log('Detected YouTube videos:', videos);
        // Send the message to the background script
        chrome.runtime.sendMessage({
            action: 'youtubeVideosFound',
            data: videos.map(video => video.src) // Send the source URLs or relevant data
        });
    } else {
        console.log('No YouTube videos found.');
    }
}

// Call this function when your content script is loaded
detectYouTubeVideos();
