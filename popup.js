let editingIndex = -1; // This will track if the user is editing an existing note

// Function to save or update a note
document.getElementById("saveNote").addEventListener("click", function() {
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

// Display saved notes when the popup opens
document.addEventListener('DOMContentLoaded', displaySavedNotes);
