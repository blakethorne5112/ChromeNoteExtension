let isSummarizing = false; // Flag to prevent multiple clicks
let isRequestInProgress = false; // Flag to check if a request is in progress
const delayTime = 3000; // Delay time in milliseconds for debounce
let countdownTime = delayTime / 1000; // Countdown time in seconds

const timerMessage = document.getElementById('timerMessage');
const summarizeButton = document.getElementById('summarizeButton');
const summaryDiv = document.getElementById('summary');

summarizeButton.addEventListener('click', debounce(() => {
    if (isSummarizing || isRequestInProgress) {
        timerMessage.textContent = `Please wait ${countdownTime} seconds before trying again.`;
        return;
    }

    isSummarizing = true; // Set flag to prevent multiple clicks
    isRequestInProgress = true; // Set flag to indicate a request is in progress
    summarizeButton.disabled = true; // Disable the button during the process
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
            chrome.runtime.sendMessage({ action: "summarizePage", content: pageContent }, (response) => {
                isSummarizing = false; // Reset summarizing flag
                isRequestInProgress = false; // Reset request flag

                if (response && response.summary) {
                    summaryDiv.textContent = response.summary || "Error: Unable to summarize the page.";
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
    summarizeButton.disabled = false; // Re-enable the button
}

// Debounce function to limit rapid function calls
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}
