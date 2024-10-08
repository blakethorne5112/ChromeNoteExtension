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
const apiKey = "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";
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

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data?.choices?.length && data.choices[0]?.message?.content) {
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

