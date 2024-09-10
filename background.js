chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractText") {
        const pageText = message.text;

        // Call the backend server to summarize the text
        fetch('http://localhost:5000/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: pageText })
        })
        .then(response => response.json())
        .then(data => {
            if (data.summary) {
                chrome.runtime.sendMessage({
                    action: "summarize",
                    summary: data.summary
                });
            } else {
                chrome.runtime.sendMessage({
                    action: "summarize",
                    summary: "Error: Could not summarize the text."
                });
            }
        })
        .catch(error => {
            console.error("Error calling backend:", error);
        });
    }
});
