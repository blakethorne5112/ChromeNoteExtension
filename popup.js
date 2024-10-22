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
        document.getElementById("note").value = notes[index];
        editingIndex = index;
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

// Function to generate citation
function generateCitation() {
    const style = document.getElementById('citationStyle')?.value || 'APA7';
    const citationResult = document.getElementById('citationResult');
    
    // Set loading state
    citationResult.textContent = 'Generating citation...';

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]?.id) {
            citationResult.textContent = 'Error: Cannot access this page';
            return;
        }

        // Execute content script to make sure it's loaded
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

// Popup
document.addEventListener('DOMContentLoaded', () => {
    // Display existing notes
    displaySavedNotes();
    
    // Citation lsietener
    const generateButton = document.getElementById('generateCitation');
    if (generateButton) {
        generateButton.addEventListener('click', generateCitation);
    }

    // Finds style selector first for debugging
    const styleSelector = document.getElementById('citationStyle');
    if (!styleSelector) {
        console.error('Citation style selector not found');
    }
});
