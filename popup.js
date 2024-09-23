document.addEventListener("DOMContentLoaded", function () {
    const summarizeButton = document.getElementById("summarizeButton");
    const summaryDiv = document.getElementById("summary");

    summarizeButton.addEventListener("click", () => {
        // Query the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

            const activeTab = tabs[0];
            const url = activeTab.url;
            
            // Check if URL is restricted
            if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
                summaryDiv.textContent = "Error: Cannot execute script on this page.";
                return;
            }


            if (tabs && tabs[0]) {
                const tabId = tabs[0].id;

                // Try to execute script on the active tab
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabId },
                        function: () => document.body.innerText // Extract the page content
                    },
                    (result) => {
                        if (chrome.runtime.lastError) {
                            console.error("Runtime error:", chrome.runtime.lastError);
                            summaryDiv.textContent = "Error: Unable to execute script.";
                            return;
                        }

                        // Check if result is available
                        if (result && result[0] && result[0].result) {
                            const pageContent = result[0].result;
                            console.log("Page content:", pageContent);

                            // Send the content to the background script for summarization
                            chrome.runtime.sendMessage(
                                { action: "summarizePage", content: pageContent },
                                (response) => {
                                    if (response && response.summary) {
                                        summaryDiv.textContent = response.summary;
                                    } else {
                                        summaryDiv.textContent = "Error: Unable to get summary.";
                                    }
                                }
                            );
                        } else {
                            summaryDiv.textContent = "Error: No content retrieved from the page.";
                        }
                    }
                );
            } else {
                summaryDiv.textContent = "Error: No active tab found.";
            }
        });
    });
});
