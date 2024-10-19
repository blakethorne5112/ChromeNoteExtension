import { YoutubeTranscript } from "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js";
const btn = document.getElementById("transcribe-youtube-video");


let youtubeLink;


// Function to sanitize transcription text
function sanitiseText(transcription) {
    return transcription
        .replace(/&amp;#39;/g, "'") // Replace &amp;#39; with '
        .replace(/&amp;/g, '&')      // Replace &amp; with &
        .replace(/&#39;/g, "'")      // Replace any remaining &#39; with '
        .replace(/&apos;/g, "'")     // Replace &apos; with '
        .replace(/&quot;/g, '"')    // Replace &quot; with "
        .replace(/&lt;i&gt;/g, '')    // Replace &lt;i&gt; with ''
        .replace(/&lt;\/i&gt;/g, '')  // Replace &lt;/i&gt; with ''
        .replace(/<\/?[^>]+(>|$)/g, '');  // Remove any remaining HTML tags

    }

// Function to check if a link is a valid YouTube link
function isYouTubeLink(link) {
    // Regular expression to match YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

    // Test the link against the regex and return the result
    return youtubeRegex.test(link);
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.youtubeLink) {
        console.log("Received YouTube Link:", message.youtubeLink);
        // You can now use youtubeLink here as needed
        youtubeLink = message.youtubeLink;
        
        
        if(isYouTubeLink(youtubeLink) === false) {
            console.log("No Embedded Youtube Videos detected");

            const newHeading = document.createElement("h2");

            // and give it some content
            const newContent = document.createTextNode("No Youtube Videos detected");

            newHeading.id = "No-Youtube-Videos-Message";

            // add the text node to the newly created div
            newHeading.appendChild(newContent);

            // add the newly created element and its content into the DOM
            const currentDiv = document.getElementById("videoList");

            const transcriberTextArea = document.getElementById("output");

            transcriberTextArea.innerHTML = "No Youtube Videos detected";
        
            /* document.body.appendChild(newHeading);
            document.body.insertBefore(newHeading, currentDiv); */
        } 

        else {
            btn.addEventListener("click", async () => {transcribe(youtubeLink)});
        

            const newButton = document.createElement("button");

            // and give it some content
            const newContent = document.createTextNode("Video 1");

            newButton.id = "selectableButton";

            // add the text node to the newly created div
            newButton.appendChild(newContent);

            // add the newly created element and its content into the DOM
            const currentDiv = document.getElementById("videoList");
        
            document.body.appendChild(newButton);
            document.body.insertBefore(newButton, currentDiv);
        }


        

    }

});



async function transcribe(youtubeLink) {
    const transcriptArr = await YoutubeTranscript.fetchTranscript(youtubeLink); 

    console.log(transcriptArr);

    let lines = '';

    // Iterate over each line of the transcript
    transcriptArr.forEach((transcriptLine) => {
        console.log(transcriptLine.text);                        
        const sanitizedLine = sanitiseText(transcriptLine.text); // Sanitize before adding to lines
        lines += sanitizedLine + "\n\n"; // Add sanitized line to the output                       
        
    });


    const p = document.getElementById("output");
    p.innerHTML = lines;
    console.log(youtubeLink);

}

function detectYouTubeVideos() {

    console.log('detectYoutubeVideos function called');

    const videos = Array.from(document.querySelectorAll('iframe[src*="youtube.com"]'));

    let youtubeLink;

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var url = tabs[0].url;

        console.log("Are we on a youtube url", isYouTubeLink(url));

        if(isYouTubeLink(url) === true) {

            btn.addEventListener("click", async () => {
                transcriptionOnYouTubeSite(url);
            })

        }

        else {

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                
                function: () => {
                    // This runs in the context of the active tab (webpage)
                    const youtubeVideo = document.querySelector('iframe');

                    const allYoutubeVideos = document.querySelectorAll('iframe');

                    console.log(allYoutubeVideos);

                    if(youtubeVideo) {
        
                        let youtubeLink = youtubeVideo.getAttribute('src');
        
                        // If src is not available, check nitro-og-src
                        if (!youtubeLink) {
                            youtubeLink = youtubeVideo.getAttribute('nitro-og-src');
                            
                        }
        
                        // If nitro-og-src is also not available, check nitro-lazy-src
                        if (!youtubeLink) {
                            youtubeLink = youtubeVideo.getAttribute('nitro-lazy-src');
                        }

                        console.log("YouTube Link", youtubeLink);
                        chrome.runtime.sendMessage({ youtubeLink: youtubeLink });

                    }
        
                    else {
                        console.log("No Youtube Video Detected");
                        //Add this message to the trascription textarea
                    }                
                    
                }

            })

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


