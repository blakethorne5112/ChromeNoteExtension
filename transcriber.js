import { YoutubeTranscript } from "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js";
const btn = document.getElementById("transcribe-youtube-video");

// Function to sanitize transcription text
function sanitiseText(transcription) {
    return transcription
        .replace(/&amp;#39;/g, "'") // Replace &amp;#39; with '
        .replace(/&amp;/g, '&')      // Replace &amp; with &
        .replace(/&#39;/g, "'")      // Replace any remaining &#39; with '
        .replace(/&apos;/g, "'")     // Replace &apos; with '
        .replace(/&quot;/g, '"');    // Replace &quot; with "
}

// Function to check if a link is a valid YouTube link
function isYouTubeLink(link) {
    // Regular expression to match YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

    // Test the link against the regex and return the result
    return youtubeRegex.test(link);
}


function detectYouTubeVideos() {

    console.log('detectYoutubeVideos function called');

    const videos = Array.from(document.querySelectorAll('iframe[src*="youtube.com"]'));

    let youtubeLink;

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var url = tabs[0].url;
        console.log("AAA", url);
    
        console.log("BBB", tabs[0]);


        console.log("Are we on a youtube url", isYouTubeLink(url));

        if(isYouTubeLink(url) === true) {


            btn.addEventListener("click", async () => {

                transcriptionOnYouTubeSite(url);
            })

        }

        else {

            transcriptionOnNonYoutubeSite(url);


       
        }

    });
    
    console.log("Linofersiojoijfosfjiok", youtubeLink);


}




function transcriptionOnNonYoutubeSite(url) {
    
    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
            // This runs in the context of the active tab (webpage)

            const youtubeVideo = document.querySelector('iframe');
            
            if(youtubeVideo) {
                console.log("Element inside the page:", youtubeVideo);

                let youtubeLink = youtubeVideo.getAttribute('src');

                // If src is not available, check nitro-og-src
                if (!youtubeLink) {
                    youtubeLink = youtubeVideo.getAttribute('nitro-og-src');
                    console.log("ASS");
                }

                // If nitro-og-src is also not available, check nitro-lazy-src
                if (!youtubeLink) {
                    youtubeLink = youtubeVideo.getAttribute('nitro-lazy-src');
                }

                console.log("YouTube Link", youtubeLink);

                
            }

            /* else {
                console.log("No Youtube Video Detected");
                //Add this message to the trascription textarea
            }   */              
            
        }

    });

}

function transcriptionOnYouTubeSite(url) {

    try {
        let lines = '';

        chrome.tabs.query({ currentWindow: true, active: true }, async function (tabs) {
            var url = tabs[0].url;
            
            // Await the transcript fetching to resolve the promise
            const transcriptArr = await YoutubeTranscript.fetchTranscript(url); 

            // Iterate over each line of the transcript
            transcriptArr.forEach((transcriptLine) => {
                console.log(transcriptLine.text);                        
                const sanitizedLine = sanitiseText(transcriptLine.text); // Sanitize before adding to lines
                lines += sanitizedLine + "\n\n"; // Add sanitized line to the output                       
                
            });

            const p = document.getElementById("output");
            p.innerHTML = lines;
        });

    } catch (error) {
        // Handle specific errors
        if (error instanceof YoutubeTranscriptTooManyRequestError) {
            console.error("Error: Too many requests to YouTube. Please solve the CAPTCHA.");
            alert("Error: Too many requests to YouTube. Please solve the CAPTCHA.");
        } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
            console.error("Error: The video is no longer available.");
            alert("Error: The video is no longer available.");
        } else if (error instanceof YoutubeTranscriptDisabledError) {
            console.error("Error: Transcript is disabled on this video.");
            alert("Error: Transcript is disabled on this video.");
        } else if (error instanceof YoutubeTranscriptNotAvailableError) {
            console.error("Error: No transcripts are available for this video.");
            alert("Error: No transcripts are available for this video.");
        } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
            console.error("Error: No transcripts available in the selected language.");
            alert("Error: No transcripts available in the selected language.");
        } else {
            console.error("Error fetching transcript:", error);
            alert("An unexpected error occurred while fetching the transcript.");
        }
    }

}

detectYouTubeVideos();

/* btn.addEventListener("click", async () => {
    try {
        let lines = '';

        chrome.tabs.query({ currentWindow: true, active: true }, async function (tabs) {
            var url = tabs[0].url;
            
            // Await the transcript fetching to resolve the promise
            const transcriptArr = await YoutubeTranscript.fetchTranscript(url); 

            // Iterate over each line of the transcript
            transcriptArr.forEach((transcriptLine) => {
                console.log(transcriptLine.text);                        
                const sanitizedLine = sanitiseText(transcriptLine.text); // Sanitize before adding to lines
                lines += sanitizedLine + "\n\n"; // Add sanitized line to the output                       
                
            });

            const p = document.getElementById("output");
            p.innerHTML = lines;
        });

    } catch (error) {
        // Handle specific errors
        if (error instanceof YoutubeTranscriptTooManyRequestError) {
            console.error("Error: Too many requests to YouTube. Please solve the CAPTCHA.");
            alert("Error: Too many requests to YouTube. Please solve the CAPTCHA.");
        } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
            console.error("Error: The video is no longer available.");
            alert("Error: The video is no longer available.");
        } else if (error instanceof YoutubeTranscriptDisabledError) {
            console.error("Error: Transcript is disabled on this video.");
            alert("Error: Transcript is disabled on this video.");
        } else if (error instanceof YoutubeTranscriptNotAvailableError) {
            console.error("Error: No transcripts are available for this video.");
            alert("Error: No transcripts are available for this video.");
        } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
            console.error("Error: No transcripts available in the selected language.");
            alert("Error: No transcripts available in the selected language.");
        } else {
            console.error("Error fetching transcript:", error);
            alert("An unexpected error occurred while fetching the transcript.");
        }
    }
}); */


