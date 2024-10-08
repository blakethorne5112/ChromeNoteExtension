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

// Function to scrape the text content of the current page
function scrapePageContent() {
    chrome.runtime.sendMessage({ action: 'scrapePage' }, (response) => {
        if (response && response.contentList) {
            console.log('Scraped Content:', response.contentList);
            storeScrapedContent(response.contentList);
        } else {
            console.error('Scraping failed or no content found.');
        }
    });
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
