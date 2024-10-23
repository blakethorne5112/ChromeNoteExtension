editingIndex = -1; // This will track if the user is editing an existing note
var quill; 

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
    } else {
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

    // Event listener for plagiarism check
    const plagiarismButton = document.getElementById("checkPlagiarism");
    if (plagiarismButton) {
        plagiarismButton.addEventListener("click", function() {
            const note = quill.root.innerHTML;

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
                    document.getElementById("plagiarismResult").textContent = "Could not generate plagiarism.";
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
