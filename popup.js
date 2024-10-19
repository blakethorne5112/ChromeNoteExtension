let editingIndex = -1; // This will track if the user is editing an existing note

// Function to save or update a note
document.getElementById("saveNote").addEventListener("click", function () {
    const note = document.getElementById("note").value;

    chrome.storage.local.get({ userNotes: [] }, function (result) {
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
        chrome.storage.local.set({ userNotes: notes }, function () {
            console.log("Note saved!");
            displaySavedNotes();
        });
    });

    // Clear the note input after saving
    document.getElementById("note").value = '';
});

// Function to display saved notes
function displaySavedNotes() {
    chrome.storage.local.get({ userNotes: [] }, function (result) {
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
            editButton.addEventListener("click", function (event) {
                event.stopPropagation(); // Prevent triggering other actions
                editNote(index);
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "icon-button delete";
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.addEventListener("click", function (event) {
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
    chrome.storage.local.get({ userNotes: [] }, function (result) {
        const notes = result.userNotes;
        document.getElementById("note").value = notes[index];
        editingIndex = index; // Set the index for the note being edited
    });
}

// Function to delete a note
function deleteNote(index) {
    chrome.storage.local.get({ userNotes: [] }, function (result) {
        const notes = result.userNotes;
        notes.splice(index, 1);

        chrome.storage.local.set({ userNotes: notes }, function () {
            console.log("Note deleted!");
            displaySavedNotes();
        });
    });
}

// Function to scrape the page content and pre-fill the note input
function scrapePageContent() {
    chrome.runtime.sendMessage({ action: 'scrapePage' }, (response) => {
        if (response && response.content) {
            document.getElementById("note").value = response.content;
        } else {
            document.getElementById("note").value = "Could not scrape content.";
        }
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

    const voiceInput = document.getElementById("note");

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
            voiceInput.focus();
            console.log("Speech Recognition Active")
        }

        recognition.addEventListener("end", endSpeechRecognition);
        function endSpeechRecognition() {
            micIcon.classList.remove("fa-microphone-slash");
            micIcon.classList.add("fa-microphone")
            voiceInput.focus();
            console.log("Speech Recognition Inactive")
        }

        recognition.addEventListener("result", resultOfSpeechRecognition);
        function resultOfSpeechRecognition(event) {
            console.log(event);
            const currentResultIndex = event.resultIndex;
            const transcript = event.results[currentResultIndex][0].transcript;
            voiceInput.value += transcript;
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



