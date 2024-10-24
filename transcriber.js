import { YoutubeTranscript, YoutubeTranscriptDisabledError, 
    YoutubeTranscriptError, 
    YoutubeTranscriptNotAvailableError, 
    YoutubeTranscriptNotAvailableLanguageError, 
    YoutubeTranscriptTooManyRequestError, 
    YoutubeTranscriptVideoUnavailableError 

} from "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js";


/* const btn = document.getElementById("transcribe-youtube-video"); */


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
    
    console.log(message.titles);

    if(message.youtubeLinks.length == 0) {
        const p = document.getElementById("output");
        p.innerHTML = "No Embedded Youtube Videos detected";

    }

    else if(message.youtubeLinks) {

        console.log("Arrays");
        console.log(message.youtubeLinks);

        // Create the main dropdown button for transcribing videos
        const transcriberOptions = document.createElement("button");
        const buttonContent = document.createTextNode(` Transcribe Videos`);

        const icon = document.createElement("i");  // Use <i> for FontAwesome icons
        icon.className = "fa fa-youtube-play";

        transcriberOptions.id = `selectableButton`;
        transcriberOptions.style.backgroundColor = 'red';
        transcriberOptions.style.color = 'white';
        transcriberOptions.style.padding = '10px';

        transcriberOptions.appendChild(icon);
        transcriberOptions.appendChild(buttonContent);

        // Create the dropdown container (initially hidden)
        const dropdownMenu = document.createElement("div");
        dropdownMenu.style.display = 'none';  // Hidden initially
        dropdownMenu.style.position = 'absolute';
        dropdownMenu.style.backgroundColor = '#f1f1f1';
        dropdownMenu.style.minWidth = '160px';

        // Insert the button into the DOM
        const currentDiv = document.getElementById("transcriber-section.videoList");
        document.body.insertBefore(transcriberOptions, currentDiv);
        document.body.insertBefore(dropdownMenu, currentDiv);

        // Toggle dropdown menu visibility on button click
        transcriberOptions.addEventListener("click", () => {
            dropdownMenu.style.display = (dropdownMenu.style.display === 'none') ? 'block' : 'none';
        });

        // Loop through the YouTube links and create transcription buttons for each video
        message.youtubeLinks.forEach((youtubeLink, index) => {

            const selectedTranscription = document.createElement("button");
            const buttonContent = document.createTextNode(`Transcribe Video ${index + 1}`);

            selectedTranscription.id = ` selectableButton${index}`;
            selectedTranscription.style.backgroundColor = 'red';
            selectedTranscription.style.color = 'white';
            selectedTranscription.style.border = 'none';
            selectedTranscription.style.width = '100%';  // Make buttons full-width in the dropdown
            selectedTranscription.style.display = 'block';  // Make sure buttons are block-level elements
            selectedTranscription.style.textAlign = 'middle';  // Align text to the left for dropdown style

            selectedTranscription.appendChild(buttonContent);

            // Append each button to the dropdown menu
            dropdownMenu.appendChild(selectedTranscription);

            // Event listener for individual video transcription
            selectedTranscription.addEventListener("click", async () => {
                console.log(`Transcribing video ${index + 1}:`, youtubeLink);
                await transcribe(youtubeLink);  // Assuming transcribe is a valid function that handles the transcription process
            });
        });

        // Hide dropdown menu when clicking outside of it
        window.addEventListener("click", (event) => {
            if (!transcriberOptions.contains(event.target)) {
                dropdownMenu.style.display = 'none';
            }
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

        chrome.runtime.sendMessage({ done: "yes" });
        
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
                        const links = document.querySelectorAll('a');
                        
                        // Select all <a> elements with the class ytp-youtube-button
                        const youtubeLinks = document.querySelectorAll('a.ytp-youtube-button.ytp-button.yt-uix-sessionlink');
                        console.log(youtubeLinks);
                        
                        console.log("++++++++++++++++++++")
                        // Loop through each link and log the href attribute
                        links.forEach((link, index) => {
                            console.log(`YouTube Link ${index + 1}:`, link.getAttribute('href'));
                        });

                        console.log("++++++++++++++++++++")

                        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
                        

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

    /* 
    const selectedTranscription = document.createElement("button");
    const currentDiv = document.getElementById("videoList");
    document.body.insertBefore(selectedTranscription, currentDiv); */

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
            const currentDiv = document.getElementById("transcriber-section.videoList");
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

                /* const transcriberOptions = document.createElement("button");
                const buttonContent = document.createTextNode(` Transcribe Videos`);
                
                const icon = document.createElement("icon");
                icon.className="fa fa-youtube-play"

                transcriberOptions.id = `selectableButton`;
                transcriberOptions.style.backgroundColor = 'red';
                transcriberOptions.style.color = 'white';
                
                transcriberOptions.appendChild(icon);
                transcriberOptions.appendChild(buttonContent);

                // Insert the button into the DOM
                const currentDiv = document.getElementById("videoList");
                document.body.insertBefore(transcriberOptions, currentDiv);


                transcriberOptions.addEventListener("click", () => {console.log("SLJFSKlks")}); */

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                
                function: () => {

                    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;


                    const allYoutubeVideos = document.querySelectorAll('iframe');
                    const youtubeLinks = []; // Array to store YouTube links
                    const titles = [];
                  
                    
                    let i = 0;
                    let j = 0;

                    const totalVidsTraversed = allYoutubeVideos.length;
                    

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
                                if(currentVid.title) {
                                    titles.push(currentVid.title);
                                } 

                                else {
                                    titles.push("no-name-provided-for-video");
                                }
                                j++;
                            }

                            if(i == totalVidsTraversed - 1) {
                                /* chrome.runtime.sendMessage({ youtubeLink: youtubeLink }); */
                                chrome.runtime.sendMessage({ youtubeLinks: youtubeLinks, titles: titles});
                                
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
                    console.log(transcriptLine);
                    const sanitizedLine = sanitiseText(transcriptLine.text);
                    lines += sanitizedLine + "\n\n"; 
                });

            } catch (error) {
                if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
                    console.log("Attempting to fetch transcript with 'en-US'...");
                    try {
                        let transcriptArr = await YoutubeTranscript.fetchTranscript(url, { lang: 'en-US' });

                        transcriptArr.forEach((transcriptLine) => {
                            console.log(transcriptLine);
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


detectYouTubeVideos();