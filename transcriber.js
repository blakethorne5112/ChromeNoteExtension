import { YoutubeTranscript, YoutubeTranscriptDisabledError, 
    YoutubeTranscriptError, 
    YoutubeTranscriptNotAvailableError, 
    YoutubeTranscriptNotAvailableLanguageError, 
    YoutubeTranscriptTooManyRequestError, 
    YoutubeTranscriptVideoUnavailableError 

} from "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js";


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
    console.log(message.youtubeLinks);

    if(message.youtubeLinks) {
        console.log("Arrays");
        console.log(message.youtubeLinks);

        message.youtubeLinks.forEach((youtubeLink, index) => {

            const selectedTranscription = document.createElement("button");
            const buttonContent = document.createTextNode(`Transcribe Video ${index + 1}`);

            selectedTranscription.id = `selectableButton${index}`;
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

    else if (message.youtubeLink) {
        /* console.log("Received YouTube Link:", message.youtubeLink); */
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

            transcriberTextArea.innerText = "No Embedded Youtube Videos detected";
        
            ///document.body.appendChild(newHeading);
            //document.body.insertBefore(newHeading, currentDiv);
        } 

        /*else {
            
            // Was for single transcriptions
            /* btn.addEventListener("click", async () => {
                transcribe(youtubeLink)
            }); */

            /* const selectedTranscription = document.createElement("button");

            // and give it some content
            const newContent = document.createTextNode("Video Transcription");

            selectedTranscription.id = "selectableButton";

            // add the text node to the newly created div
            selectedTranscription.appendChild(newContent);

            // add the newly created element and its content into the DOM
            const currentDiv = document.getElementById("videoList");
        
            document.body.appendChild(selectedTranscription);
            document.body.insertBefore(selectedTranscription, currentDiv);

            selectedTranscription.addEventListener("click", async () => {
                transcribe(youtubeLink)
            }); 
        }*/


        

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
        } else {
            console.error("Error fetching transcript:", error);
            alert("An unexpected error occurred while fetching the transcript.");
        }
    }

}

function detectYouTubeVideos() {

    console.log('detectYoutubeVideos function called');

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

                            youtubeLinks.push(youtubeLink);
    
                            
                            /* chrome.runtime.sendMessage({ youtubeLink: youtubeLink });
                            chrome.runtime.sendMessage({ youtubeLinks: youtubeLinks}); */

                            
                            /* chrome.runtime.sendMessage({ done: done}); */
                            console.log("jsljsdl");
                            console.log(i);

                            if(i == totalVidsTraversed - 1) {
                                console.log("if condition ");
                                chrome.runtime.sendMessage({ youtubeLink: youtubeLink });
                                chrome.runtime.sendMessage({ youtubeLinks: youtubeLinks});
                            }



                            i += 1;
                        }
            
                        else {
                            console.log("No Youtube Video Detected");
                            //Add this message to the trascription textarea
                        }
                    })

                    /* if(youtubeVideo) {
        
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
                    } */                
                    
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