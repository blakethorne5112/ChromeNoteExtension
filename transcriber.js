import { YoutubeTranscript } from "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js";

const btn = document.getElementById("transcribe-youtube-video");


/* btn.addEventListener("click", () => {

    YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=ZJMi3m8spJA').then(
        
        (transcriptArr) => {
            let i = 0;
            while(i < transcriptArr.length) {
                console.log(transcriptArr[i].text);
                i += 1;
            }

        }

    );

}); */




if(btn) {
    try {
        
        btn.addEventListener("click", async () => {

            try {

                let lines = '';

                console.log(lines);

                chrome.tabs.query({currentWindow: true, active: true}, async function(tabs){
        
                    var url = tabs[0].url;
        
                    //Await the treanscript fetching to resolve the promise
                    const transcriptArr = await YoutubeTranscript.fetchTranscript(url); 
                
                    // Iterate over each line of the transcript
                    transcriptArr.forEach((transcriptLine) => {
                        
                        
                        lines += transcriptLine.text;
                        
                        lines += "\n\n";
                        
                        
                        
                    });
                    
                    const p = document.getElementById("output");
                    p.innerHTML = lines;
                    console.log(lines);

                
                })

            } catch (error) {

                console.error("Error fetching transcript");

            }

        })

    } catch (error) {

        console.error("Error fetching transcript:", error);

    }
}

else {
    console.error("There is no button found!")
}