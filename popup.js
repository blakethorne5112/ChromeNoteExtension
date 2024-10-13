editingIndex = -1; // This will track if the user is editing an existing note

// Function to save or update a note
document.addEventListener('DOMContentLoaded', () => {
    // Check if the element exists before adding the event listener
    const saveNoteButton = document.getElementById("saveNote");
    
    if (saveNoteButton) {
        saveNoteButton.addEventListener("click", function() {
            const note = document.getElementById("note").value;

            chrome.storage.local.get({userNotes: []}, function(result) {
                const notes = result.userNotes;

                if (editingIndex >= 0) {
                    // If editing an existing note, update it
                    notes[editingIndex] = note;
                    editingIndex = -1; // Reset the editing index after saving
                } else {
                    // Otherwise, add a new note
                    notes.push(note);
                }

                // Save the updated notes array
                chrome.storage.local.set({userNotes: notes}, function() {
                    console.log("Note saved!");
                    displaySavedNotes();
                });
            });

            // Clear the note input after saving
            document.getElementById("note").value = '';
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
            noteText.textContent = note;

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
        });
    });
}

// Function to edit a note
function editNote(index) {
    chrome.storage.local.get({userNotes: []}, function(result) {
        const notes = result.userNotes;
        document.getElementById("note").value = notes[index];
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

// Function to generate citation
function generateCitation() {
    chrome.runtime.sendMessage({ action: 'generateCitation' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error generating citation:", chrome.runtime.lastError.message);
            document.getElementById("citationResult").textContent = "Could not generate citation.";
        } else if (response && response.citation) {
            document.getElementById("citationResult").textContent = response.citation;
        } else {
            document.getElementById("citationResult").textContent = "Could not generate citation.";
        }
    });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    displaySavedNotes();
    scrapePageContent();

    // Event listener for citation generation
    document.getElementById("generateCitation").addEventListener("click", generateCitation);


    const plagiarismButton = document.getElementById("checkPlagiarism");
    if (plagiarismButton) {
        plagiarismButton.addEventListener("click", function() {
            chrome.runtime.sendMessage({ action: 'checkPlagiarism' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error generating plagerism result:", chrome.runtime.lastError.message);
                    document.getElementById("plagiarismResult").textContent = "Could not generate plagiarism.";
                } else if (response && response.plagiarism) {
                    document.getElementById("plagiarismResult").textContent = response.plagiarism;
                } else {
                    document.getElementById("plagiarismResult").textContent = "Could not generate plagiarism.";
                }
            });
        });
    }
});

// Function to store the scraped content
function storeScrapedContent(contentArray) {
  // Store in local storage (or send it to background.js for further handling)
  chrome.storage.local.set({ scrapedContent: contentArray }, () => {
    console.log('Scraped content saved.');
  });
}

// Automatically run the scrapePageContent function when the content script is injected
scrapePageContent();
