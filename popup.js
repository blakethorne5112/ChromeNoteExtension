editingIndex = -1; // This will track if the user is editing an existing note
let isSummarising = false; // Flag to prevent multiple clicks
let isRequestInProgress = false; // Flag to check if a request is in progress
const delayTime = 3000; // Delay time in milliseconds for debounce
let countdownTime = delayTime / 1000; // Countdown time in seconds

var quill; 

// Summary Variables
var summariseButton;
var timerMessage; 
var summaryDiv; 

// Function to save or update a note
document.addEventListener('DOMContentLoaded', () => {
    quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Enter your notes here...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image']
            ]
        }
    });
    
    // Check if the element exists before adding the event listener
    const saveNoteButton = document.getElementById("saveNote");
    const saveTranscriptButton = document.getElementById("save-transcript");

    if (saveNoteButton) {
        saveNoteButton.addEventListener("click", function() {
            const note = quill.root.innerHTML;

            chrome.storage.local.get({userNotes: []}, function(result) {
                const notes = result.userNotes;

                if (editingIndex >= 0) {
                    notes[editingIndex] = note;
                    editingIndex = -1;
                } else {
                    notes.push(note);
                }

                chrome.storage.local.set({userNotes: notes}, function() {
                    console.log("Note saved!");
                    displaySavedNotes();
                });
            });

            quill.root.innerHTML = ''; // Clear editor after saving
        });
    } 

    if(saveTranscriptButton) {
        console.log("saveTranscriptButton");
        saveTranscriptButton.addEventListener("click", function() {
            const transcriptionText = document.getElementById("output");
            appendTextToQuill(transcriptionText.innerHTML);
            const note = quill.root.innerHTML;

            chrome.storage.local.get({userNotes: []}, function(result) {
                const notes = result.userNotes;

                if (editingIndex >= 0) {
                    notes[editingIndex] = note;
                    editingIndex = -1;
                } else {
                    notes.push(note);
                }

                chrome.storage.local.set({userNotes: notes}, function() {
                    console.log("Note saved!");
                    displaySavedNotes();
                });
            });
        });
    }

    else {
        console.error("Save Note button not found!");
    }

    displaySavedNotes();
    scrapePageContent();

    // Event listener for citation generation
    const generateCitationButton = document.getElementById("generateCitation");
    if (generateCitationButton) {
        generateCitationButton.addEventListener("click", generateCitation);
    } else {
        console.error("Generate Citation button not found!");
    }
});

// Function to append text to the Quill editor
function appendTextToQuill(text) {
    if (quill) {
        var currentLength = quill.getLength();  // Get current content length
        quill.insertText(currentLength, text);  // Append text at the end
    } else {
        console.error("Quill editor is not initialized.");
    }
}

// Function to display saved notes
function displaySavedNotes() {
    chrome.storage.local.get({userNotes: []}, function(result) {
        const notesList = document.getElementById("notesList");
        notesList.innerHTML = '';

        result.userNotes.forEach((note, index) => {
            const noteItem = document.createElement("div");
            noteItem.className = "noteItem";

            const noteText = document.createElement("div");
            noteText.className = "noteText";
            noteText.innerHTML = note; // Render saved notes as HTML

            const editButton = document.createElement("button");
            editButton.className = "icon-button edit";
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.addEventListener("click", function(event) {
                event.stopPropagation();
                editNote(index);
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "icon-button delete";
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.addEventListener("click", function(event) {
                event.stopPropagation();
                deleteNote(index);
            });

            noteItem.appendChild(noteText);
            noteItem.appendChild(editButton);
            noteItem.appendChild(deleteButton);
            notesList.appendChild(noteItem);
        });
    });
}

// Function to edit a note
function editNote(index) {
    chrome.storage.local.get({userNotes: []}, function(result) {
        const notes = result.userNotes;
        quill.root.innerHTML = notes[index];
        editingIndex = index; // Set the index for the note being edited
    });
}

// Function to delete a note
function deleteNote(index) {
    chrome.storage.local.get({userNotes: []}, function(result) {
        const notes = result.userNotes;
        notes.splice(index, 1);

        chrome.storage.local.set({userNotes: notes}, function() {
            console.log("Note deleted!");
            displaySavedNotes();
        });
    });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    displaySavedNotes(); // function needs to be defined for displaying saved notes
    scrapePageContent(); // Add this to pre-fill the note input with page content
});


// Display saved notes when the popup opens
document.addEventListener('DOMContentLoaded', displaySavedNotes);


document.addEventListener("DOMContentLoaded", function () {

    const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (speechRecognition) {
        console.log("Your Browser supports speech Recognition");

        const micBtn = document.getElementById("microphone-button");
        const micIcon = micBtn.querySelector("i");

        const recognition = new speechRecognition();
        recognition.continuous = true;

        micBtn.addEventListener("click", micBtnClick);
        function micBtnClick() {
            if (micIcon.classList.contains("fa-microphone")) {
                // Start Speech Recognition

                recognition.start();
            }

            else {
                // Stop speech recongition
                recognition.stop();

                console.log(recognition);

            }
        }

        recognition.addEventListener("start", startSpeechRecognition);
        function startSpeechRecognition() {
            micIcon.classList.remove("fa-microphone");
            micIcon.classList.add("fa-microphone-slash");
            console.log("Speech Recognition Active")
        }

        recognition.addEventListener("end", endSpeechRecognition);
        function endSpeechRecognition() {
            micIcon.classList.remove("fa-microphone-slash");
            micIcon.classList.add("fa-microphone")
            console.log("Speech Recognition Inactive")
        }

        recognition.addEventListener("result", resultOfSpeechRecognition);
        function resultOfSpeechRecognition(event) {
            console.log(event);
            const currentResultIndex = event.resultIndex;
            const transcript = event.results[currentResultIndex][0].transcript;
            appendTextToQuill(transcript);
        }

        recognition.addEventListener("error", (event) => {
            console.log("Speech recognition error: ", event.error);
        });
    }

    else {
        console.log("Your Browser does not support speech Recognition");
    }

})


document.getElementById('copy-transcription').addEventListener('click', function () {
    // Get the output textarea element
    const outputTextarea = document.getElementById('output');

    // Select the text inside the textarea
    outputTextarea.select();
    outputTextarea.setSelectionRange(0, 99999); // For mobile devices

    // Copy the selected text to the clipboard
    document.execCommand('copy');

    // Optional: Alert the user that text was copied
    alert('Transcription copied to clipboard!');
});



// Function to scrape the text content of the current page from specific elements
function scrapePageContent() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        // Helper function to filter out unwanted elements
        function isExcluded(element) {
          const excludedClassesOrIds = ['toolbar', 'header']; // Add more as needed
          const hasExcludedClass = excludedClassesOrIds.some(classOrId =>
            element.classList.contains(classOrId) || element.id === classOrId
          );
          return hasExcludedClass;
        }

        // Function to extract text only from desired elements like <p> and <a>
        function extractTextFromElements() {
          let extractedText = [];

          // Select the desired elements and exclude unwanted ones
          document.querySelectorAll('p, a').forEach(element => {
            if (!isExcluded(element)) {
              // Add the innerText of the element if it's not excluded
              extractedText.push(element.innerText.trim());
            }
          });

          return extractedText.filter(Boolean); // Remove empty strings
        }

        return extractTextFromElements();
      }
    }, (results) => {
      if (results && results[0].result) {
        // Store the scraped content as an array of strings (words)
        let scrapedContent = results[0].result;
        console.log("Scraped Content: ", scrapedContent);

        // Store or send the scraped content to be used by other features
        storeScrapedContent(scrapedContent);
      } else {
        console.error('Scraping failed or no content found.');
      }
    });
  });
}

// Function to store scraped content
function storeScrapedContent(contentList) {
  // Add your logic to store or process the content here
  console.log("Stored content:", contentList);
}

// Citation generator
function generateCitation() {
    const style = document.getElementById('citationStyle')?.value || 'APA7';
    const citationResult = document.getElementById('citationResult');
    
    // Loading
    citationResult.textContent = 'Making citation';

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]?.id) {
            citationResult.textContent = 'Couldnt access page';
            return;
        }

        // Makes sure script is loaded first
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
        }, () => {
            // Send message to content script
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "generateCitation", style: style },
                function(response) {
                    if (chrome.runtime.lastError) {
                        console.error("Citation error:", chrome.runtime.lastError);
                        citationResult.textContent = 'Error: Please refresh the page and try again';
                        return;
                    }

                    if (response && response.citation) {
                        citationResult.textContent = response.citation;
                    } else {
                        citationResult.textContent = "Could not generate citation.";
                    }
                }
            );
        });
    });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    displaySavedNotes();
    scrapePageContent();

    // Add event listener for citation generation
    const generateButton = document.getElementById('generateCitation');
    if (generateButton) {
        generateButton.addEventListener('click', generateCitation);
    }

    // Ensure citation style selector exists
    const styleSelector = document.getElementById('citationStyle');
    if (!styleSelector) {
        console.error('Citation style selector not found');
    }
    
    //AI detection function
    document.getElementById('detectBtn').addEventListener('click', async () => {
        chrome.storage.local.get('scrapedContent', (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving scraped content:", chrome.runtime.lastError);
            } else if (result.scrapedContent) {
                const textToAnalyze = result.scrapedContent;
                console.log("Scraped content retrieved:", textToAnalyze);
                // Continue using textToAnalyze// Call the background script to make the API request
        chrome.runtime.sendMessage({ text: textToAnalyze, action: "aiDetection" }, function (response) {
          if (response && response.result) {
            const score = response.result.score; // Your score
            console.log("AI Score (0-1):", response.result.score);
            // Calculate percentage
            const percentage = score * 100;
            document.getElementById('aiResult').textContent = 
              `Likelihood of AI Text: ${percentage.toFixed(2)}%`;
          } else {
            document.getElementById('aiResult').textContent = 
              'Error detecting AI content';
          }
        });
            } else {
                console.log("No scraped content found.");
            }
         });
        
    });

    // Event listener for summarising page
    summariseButton = document.getElementById('summariseButton');
    timerMessage = document.getElementById('timerMessage');
    summaryDiv = document.getElementById('summary');
    if (summariseButton) {
        summariseButton.addEventListener('click', debounce(() => {
            if (isSummarising || isRequestInProgress) {
                timerMessage.textContent = `Please wait ${countdownTime} seconds before trying again.`;
                return;
            }
            isSummarising = true; // Set flag to prevent multiple clicks
            isRequestInProgress = true; // Set flag to indicate a request is in progress
            summariseButton.disabled = true; // Disable the button during the process
            timerMessage.textContent = ""; // Clear previous messages

            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
                if (chrome.runtime.lastError || tabs.length === 0) {
                    summaryDiv.textContent = "No active tab found. Please open a textual web page.";
                    resetState();
                    return;
                }

                handleTab(tabs[0]);
            });
        }, 1000));
    }

    // Event listener for plagiarism check
    const plagiarismButton = document.getElementById("checkPlagiarism");
    if (plagiarismButton) {
        plagiarismButton.addEventListener("click", function() {
            const note = quill.root.textContent;

            document.getElementById("plagiarismResult").textContent = "Running Plagiarism Check...";
            chrome.runtime.sendMessage({ 
                action: 'checkPlagiarism',
                note: note
             }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error generating plagiarism result:", chrome.runtime.lastError.message);
                    document.getElementById("plagiarismResult").textContent = "Could not generate plagiarism.";
                } else if (response && response.plagiarism) {
                    let plagiarisedText = "";
                    plagiarisedText = response.plagiarism;
                    if(plagiarisedText == ""){
                        plagiarisedText = "No plagiarism found.";
                    }
                    document.getElementById("plagiarismResult").innerHTML = plagiarisedText;
                } else if (response.error && response.error == 'You must be writing or editing a note to check plagiarism!') {
                    document.getElementById("plagiarismResult").textContent = response.error;
                } 
                else {
                    document.getElementById("plagiarismResult").textContent = "Plagiarism not found in note content.";
                }
            });
        });
    }

    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', filterNotes);
    }

    displaySavedNotes();
});

function handleTab(tab) {
    summaryDiv.textContent = "Processing...";

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: getPageContent // Use a separate function for clarity
        },
        (results) => {
            if (chrome.runtime.lastError || !results || results.length === 0) {
                console.error(chrome.runtime.lastError);
                summaryDiv.textContent = "Error: Unable to retrieve page content.";
                resetState();
                return;
            }

            const pageContent = results[0].result; // Retrieved content from active tab

            // Send the page content to the background script for summarization
            chrome.runtime.sendMessage({ action: "summarisePage", content: pageContent }, (response) => {
                isSummarizing = false; // Reset summarizing flag
                isRequestInProgress = false; // Reset request flag

                if (response && response.summary) {
                    summaryDiv.textContent = response.summary || "Error: Unable to summarise the page.";
                } else {
                    summaryDiv.textContent = "Error: No summary received.";
                }
            });
        }
    );

    startCountdown(); // Start countdown immediately after requesting content
}

// Function to get the page content
function getPageContent() {
    let content = "";
    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(el => {
        content += el.innerText + " "; 
    });
    return content.trim(); // Return trimmed content
}

// Countdown timer function
function startCountdown() {
    let timeLeft = countdownTime;
    timerMessage.textContent = `Please wait ${timeLeft} seconds before trying again.`; 

    const interval = setInterval(() => {
        timeLeft -= 1;
        timerMessage.textContent = `Please wait ${timeLeft} seconds before trying again.`; 

        if (timeLeft <= 0) {
            clearInterval(interval);
            resetState(); 
            timerMessage.textContent = ""; 
        }
    }, 1000); // Update every second
}

function resetState() {
    isSummarizing = false; // Reset flag
    isRequestInProgress = false; // Reset request flag
    summariseButton.disabled = false; // Re-enable the button
}

// Debounce function to limit rapid function calls
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Function to display filtered notes based on search input
function filterNotes() {
    const searchTerm = document.getElementById("searchBar").value.toLowerCase();

    chrome.storage.local.get({ userNotes: [] }, function(result) {
        const notesList = document.getElementById("notesList");
        notesList.innerHTML = '';

        result.userNotes.forEach((note, index) => {
            if (note.toLowerCase().includes(searchTerm)) {
                const noteItem = document.createElement("div");
                noteItem.className = "noteItem";

                const noteText = document.createElement("div");
                noteText.className = "noteText";
                noteText.innerHTML = note;

                const editButton = document.createElement("button");
                editButton.className = "icon-button edit";
                editButton.innerHTML = '<i class="fas fa-edit"></i>';
                editButton.addEventListener("click", function(event) {
                    event.stopPropagation(); // Prevent triggering other actions
                    editNote(index);
                });

                const deleteButton = document.createElement("button");
                deleteButton.className = "icon-button delete";
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteButton.addEventListener("click", function(event) {
                    event.stopPropagation(); // Prevent triggering other actions
                    deleteNote(index);
                });

                noteItem.appendChild(noteText);
                noteItem.appendChild(editButton);
                noteItem.appendChild(deleteButton);
                notesList.appendChild(noteItem);
            }
        });
    });
}

// Function to store the scraped content
function storeScrapedContent(contentArray) {
  // Store in local storage (or send it to background.js for further handling)
  chrome.storage.local.set({ scrapedContent: contentArray }, () => {
    console.log('Scraped content saved.');
  });
}

// Automatically run the scrapePageContent function when the content script is injected
scrapePageContent();
