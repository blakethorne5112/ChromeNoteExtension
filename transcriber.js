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




if(btn) {
    try {        
        btn.addEventListener("click", async () => {

            try {
                let lines = '';
                chrome.tabs.query({currentWindow: true, active: true}, async function(tabs){
                    
                    var url = tabs[0].url;
        
                    //Await the treanscript fetching to resolve the promise
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
                    console.error(`Error: The video is no longer available.`);
                    alert(`Error: The video is no longer available.`);
                } else if (error instanceof YoutubeTranscriptDisabledError) {
                    console.error(`Error: Transcript is disabled on this video.`);
                    alert(`Error: Transcript is disabled on this video.`);
                } else if (error instanceof YoutubeTranscriptNotAvailableError) {
                    console.error(`Error: No transcripts are available for this video.`);
                    alert(`Error: No transcripts are available for this video.`);
                } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
                    console.error(`Error: No transcripts available in the selected language.`);
                    alert(`Error: No transcripts available in the selected language.`);
                } else {
                    console.error("Error fetching transcript:", error);
                    alert("An unexpected error occurred while fetching the transcript.");
                }

                console.error("Error fetching transcript");
                alert("An unexpected error occurred. Please try again.");

            }

        })

    } catch (error) {

        console.error("Error fetching transcript:", error);

    }

} else {
    console.error("There is no button found!")
}