import { YoutubeTranscript, YoutubeTranscriptDisabledError, 
    YoutubeTranscriptError, 
    YoutubeTranscriptNotAvailableError, 
    YoutubeTranscriptNotAvailableLanguageError, 
    YoutubeTranscriptTooManyRequestError, 
    YoutubeTranscriptVideoUnavailableError 

} from "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js";


const btn = document.getElementById("transcribe-youtube-video");


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

/* function getYouTubeVideoIDfromEmbedded(link) {
    // Regular expression to match and capture the YouTube video ID from embed URLs
    const videoIDRegex = /youtube\.com\/embed\/([^?]+)/;

    // Test the link against the regex
    const match = link.match(videoIDRegex);

    // If a match is found, return the video ID
    if (match && match[1]) {
        return match[1]; // The video ID
    }

    // Return null if no video ID is found
    return null;
} */

function getYouTubeVideoID(link) {
    // Regular expression to match and capture the YouTube video ID from 'watch?v=' URLs
    const videoIDRegex = /youtube\.com\/watch\?v=([^&]+)/;

    // Test the link against the regex
    const match = link.match(videoIDRegex);

    // If a match is found, return the video ID
    if (match && match[1]) {
        return match[1]; // The video ID
    }

    // Return null if no video ID is found
    return null;
}






chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    //  const url = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";
    //  const videoID = getYouTubeVideoID(url);
    //  console.log("Video ID", videoID);    
    

    if(message.youtubeLinks.length == 0) {
        const p = document.getElementById("output");
        p.innerHTML = "No Embedded Youtube Videos detected";

    }

    else if(message.youtubeLinks) {
        console.log("Arrays");
        console.log(message.youtubeLinks);

        message.youtubeLinks.forEach((youtubeLink, index) => {

            const selectedTranscription = document.createElement("button");
            const buttonContent = document.createTextNode(` Transcribe YouTube Video ${index + 1}`);
            
            const icon = document.createElement("icon");
            icon.className="fa fa-youtube-play"

            selectedTranscription.id = `selectableButton${index}`;
            selectedTranscription.style.backgroundColor = 'red';
            selectedTranscription.style.color = 'white';
            
            selectedTranscription.appendChild(icon);
            selectedTranscription.appendChild(buttonContent);

            // Insert the button into the DOM
            const currentDiv = document.getElementById("videoList");
            document.body.insertBefore(selectedTranscription, currentDiv);

            selectedTranscription.addEventListener("click", async () => {
                console.log(`Transcribing video ${index + 1}:`, youtubeLink);
                await transcribe(youtubeLink)
            });

        });

        
    }


});


async function transcribe(youtubeLink) {
    let lines = '';
    const fallbackLanguages = ['en-US']; // Only fallback to 'en-US'

    console.log("Transcription on non youtube web page");

    let transcriptArr = null;

    try {
        // First attempt with 'en'
        transcriptArr = await YoutubeTranscript.fetchTranscript(youtubeLink, { lang: 'en' });

        // If no transcript is available in 'en', try fallback languages
        if (!transcriptArr || transcriptArr.length === 0) {
            console.log("Transcript in 'en' not found. Trying fallback languages...");
            
            // Iterate through fallback languages
            for (let lang of fallbackLanguages) {
                try {
                    transcriptArr = await YoutubeTranscript.fetchTranscript(youtubeLink, { lang });
                    if (transcriptArr && transcriptArr.length > 0) {
                        console.log(`Transcript found in '${lang}'`);
                        break; // Exit loop if a transcript is found
                    }
                } catch (error) {
                    console.log(`Error fetching transcript in '${lang}':`, error);
                    // Continue to the next language if an error occurs
                }
            }
        }

        // Process the transcript if found
        if (transcriptArr && transcriptArr.length > 0) {
            transcriptArr.forEach((transcriptLine) => {
                console.log(transcriptLine.text);                        
                const sanitizedLine = sanitiseText(transcriptLine.text); // Sanitize before adding to lines
                lines += sanitizedLine + "\n\n"; // Add sanitized line to the output
            });

            const p = document.getElementById("output");
            p.innerHTML = lines;
            console.log("Final YouTube link:", youtubeLink);
        } else {
            console.error("No transcript available in any of the attempted languages.");
            alert("No transcript is available for this video in the selected languages.");
        }
    } catch (error) {

        if (error instanceof YoutubeTranscriptTooManyRequestError) {
            console.error("Error: Too many requests to YouTube. Please solve the CAPTCHA.");
            alert("Error: Too many requests to YouTube. Please solve the CAPTCHA.");
        } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
            console.error("Error: The video is no longer available.");
            alert("Error: The video is no longer available.");
        } else if (error instanceof YoutubeTranscriptDisabledError) {
            /* console.error("Error: Transcript is disabled on this video."); */
            /* alert("Error: Transcript is disabled on this video."); */
            const p = document.getElementById("output");
            p.innerHTML = "No transcript available for this video";
        } else if (error instanceof YoutubeTranscriptNotAvailableError) {
            console.error("Error: No transcripts are available for this video.");
            alert("Error: No transcripts are available for this video.");
        } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
            console.error("Error: No transcripts available in the selected language.");
            alert("Error: No transcripts available in the selected language.");
        } else if(error instanceof YoutubeTranscriptError) {
            console.log("Error for this ...............");


            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                var url = tabs[0].url;

                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    
                    function: () => {


                        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

                        
                        // This runs in the context of the active tab (webpage)
                        const iFrames = document.querySelectorAll('iframe');
                        
                        const aLinks = document.querySelectorAll('a');

                        const youtubeButtons = document.getElementsByClassName(".ytp-youtube-button ytp-button yt-uix-sessionlink");

                        console.log(youtubeButtons);
                        
                        youtubeButtons.forEach((currentLink) => {

                            console.log(currentLink);
                            
                        
                        })


                    }

                    
                })

            });
        
            console.log("AJSLJSDLK");

        } 
        else {
            console.error("Error fetching transcript:", error);
            alert("An unexpected error occurred while fetching the transcript.");
        }
    }

}

function detectYouTubeVideos() {

    console.log('detectYoutubeVideos function called');

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var url = tabs[0].url;

        console.log("Are we on a youtube url", isYouTubeLink(url));

        if(isYouTubeLink(url) === true) {

            console.log("url", url);
            const selectedTranscription = document.createElement("button");
            const buttonContent = document.createTextNode(` Transcribe YouTube Video`);

            const icon = document.createElement("icon");
            icon.className="fa fa-youtube-play"

            selectedTranscription.id = ` Transcribe YouTube Video`;
            selectedTranscription.style.backgroundColor = 'red';
            selectedTranscription.style.color = 'white';
            
            selectedTranscription.appendChild(icon);
            selectedTranscription.appendChild(buttonContent);

            // Insert the button into the DOM
            const currentDiv = document.getElementById("videoList");
            document.body.insertBefore(selectedTranscription, currentDiv);

            selectedTranscription.addEventListener("click", async () => {
                console.log(`Transcribing video`, url);
                await transcriptionOnYouTubeSite(url);
            });

            /* btn.addEventListener("click", async () => {
                transcriptionOnYouTubeSite(url);
            }) */

        }

        else {

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                
                function: () => {

                    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

                    // This runs in the context of the active tab (webpage)
                    const youtubeVideo = document.querySelector('iframe');
                    
                    const allYoutubeVideos = document.querySelectorAll('iframe');
                    const youtubeLinks = []; // Array to store YouTube links
                    let done = false;
                    
                    let i = 0;
                    const totalVidsTraversed = allYoutubeVideos.length;

                    console.log(totalVidsTraversed);
                    

                    allYoutubeVideos.forEach((currentVid) => {
                        console.log(currentVid);

                        if(currentVid) {
        
                            let youtubeLink = currentVid.getAttribute('src');
            
                            // If src is not available, check nitro-og-src
                            if (!youtubeLink) {
                                youtubeLink = currentVid.getAttribute('nitro-og-src');
                                
                            }
            
                            // If nitro-og-src is also not available, check nitro-lazy-src
                            if (!youtubeLink) {
                                youtubeLink = currentVid.getAttribute('nitro-lazy-src');
                            }
                            
                            if(youtubeRegex.test(youtubeLink)) {
                                console.log(youtubeLink, "Certified Link");
                                youtubeLinks.push(youtubeLink);

                            }

                            if(i == totalVidsTraversed - 1) {
                                /* chrome.runtime.sendMessage({ youtubeLink: youtubeLink }); */
                                chrome.runtime.sendMessage({ youtubeLinks: youtubeLinks});
                            }

                            i += 1;
                        }
            
                        else {
                            console.log("No Youtube Video Detected");
                            //Add this message to the trascription textarea
                        }
                    })   
                    
                    if(allYoutubeVideos.length == 0) 
                    {
                        chrome.runtime.sendMessage({ youtubeLinks: youtubeLinks});
                    }

                }

                

            })

        }

    });
    

}

async function transcriptionOnYouTubeSite() {
    try {
        let lines = '';
        console.log("Transcription on Youtube web page");
        
        chrome.tabs.query({ currentWindow: true, active: true }, async function (tabs) {
            var url = tabs[0].url;

            try {
                // Try fetching the transcript in 'en'
                let transcriptArr = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });

                // If no transcript is available in 'en', try 'en-US'
                if (!transcriptArr || transcriptArr.length === 0) {
                    throw new YoutubeTranscriptNotAvailableLanguageError('en', ['en-US'], url);
                }

                // Process the transcript
                transcriptArr.forEach((transcriptLine) => {
                    console.log(transcriptLine.text);
                    const sanitizedLine = sanitiseText(transcriptLine.text);
                    lines += sanitizedLine + "\n\n"; 
                });

            } catch (error) {
                if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
                    console.log("Attempting to fetch transcript with 'en-US'...");
                    try {
                        let transcriptArr = await YoutubeTranscript.fetchTranscript(url, { lang: 'en-US' });

                        transcriptArr.forEach((transcriptLine) => {
                            console.log(transcriptLine.text);
                            const sanitizedLine = sanitiseText(transcriptLine.text);
                            lines += sanitizedLine + "\n\n";
                        });
                    } catch (error) {
                        console.error("Error fetching transcript with 'en-US':", error);
                        throw error;
                    }

                
                }

                else if (error instanceof YoutubeTranscriptTooManyRequestError) {
                    console.error("Error: Too many requests to YouTube. Please solve the CAPTCHA.");
                    alert("Error: Too many requests to YouTube. Please solve the CAPTCHA.");
                } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
                    console.error("Error: The video is no longer available.");
                    alert("Error: The video is no longer available.");
                } else if (error instanceof YoutubeTranscriptDisabledError) {
                    /* console.error("Error: Transcript is disabled on this video."); */
                    /* alert("Error: Transcript is disabled on this video."); */
                    const p = document.getElementById("output");
                    p.innerHTML = "No transcript available for this video";
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

            const p = document.getElementById("output");
            p.innerHTML = lines;
        });
    } catch (error) {
        // Handle errors here
        console.error("Error:", error);
        alert("An error occurred: " + error.message);
    }
}

/* function transcriptionOnYouTubeSite(url) {

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

} */


/* async function transcribe(youtubeLink) {
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

} */


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


detectYouTubeVideos();