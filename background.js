chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarizePage") {
        const pageContent = request.content;

        // Call the summarization function (API logic)
        summarizePageContent(pageContent, sendResponse);

        // Return true to allow async response
        return true;
    }
});


// Define your OpenAI API key
const apiKey = 'sk-KKaahTFwrirLnFBj53poQkoswy8c3nfJgontEpvKwoT3BlbkFJjyKHUqKZi87k3XRtbkXQKKaNAJ9z6xVmftdAbYIBkA';
async function summarizePageContent(pageContent, sendResponse) {

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Summarize the following content." },
                    { role: "user", content: pageContent }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (data?.choices?.length) {
            const summary = data.choices[0].message.content;
            sendResponse({ summary });
        } else {
            sendResponse({ summary: "Error: No summary available." });
        }
    } catch (error) {
        console.error('Error:', error);
        sendResponse({ summary: "Error summarizing page." });
    }
}

