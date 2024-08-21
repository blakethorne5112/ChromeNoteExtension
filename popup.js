// JS for the note taking Popup window 

document.getElementById("saveNote").addEventListener("click", function() {
    const note = document.getElementById("note").value;
    
    // Store the note in local storage (or sync storage if needed)
    chrome.storage.local.set({ "userNote": note }, function() {
      console.log("Note saved!");
    });
    
    // Optionally close the popup after saving
    window.close();
  });
  