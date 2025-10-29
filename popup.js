// ** IMPORTANT: REPLACE 'YOUR_GEMINI_API_KEY_HERE' WITH YOUR ACTUAL KEY **
const GEMINI_API_KEY = 'AIzaSyA9S0qmIoPfC70UkO9i8dULsdD4TdF_QHY'; 
const API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=';

// --- Global Variables ---
const submitButton = document.getElementById('submit-button');
const imagePreview = document.getElementById('image-preview');
const resultArea = document.getElementById('result-area');
const resultContainer = document.getElementById('result-container');
const loadingIndicator = document.getElementById('loading-indicator');
// Reference to the instruction message element
const instructionMessage = document.getElementById('instruction-message'); 
let base64ImageData = null; 
let mimeType = 'image/png'; 

// Define your fixed prompt here
const fixedPrompt = 'if the item in the image is a food product or consumable, evaluate its healthiness for human consumption. If it is a non-consumable product (e.g., cleaner, shampoo), evaluate its functionality for its intended purpose. Provide a score out of 100 on a new line, formatted as "Health Score: [score]/100". Then, write a single, concise paragraph explaining the evaluation. Do not use any headings, bolding, bullet points, or other special formatting. Do not mention taste or other subjective qualities.';

// Helper function to show/hide elements
const toggleVisibility = (element, show) => {
    element.style.display = show ? (element === loadingIndicator ? 'flex' : 'block') : 'none';
};

// --- Screenshot and Analysis Logic ---

const captureAndAnalyze = async () => {
    // 1. Show the immediate loading state while capturing the screen
    submitButton.disabled = true;
    submitButton.textContent = 'Capturing...';
    toggleVisibility(loadingIndicator, true);
    toggleVisibility(resultContainer, false);
    resultArea.textContent = '';

    try {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });

        if (!dataUrl || dataUrl.startsWith('data:,')) {
             throw new Error("Capture returned empty data.");
        }
        
        // Split DataURL to get Base64 data and MIME type
        const parts = dataUrl.split(',');
        mimeType = parts[0].match(/:(.*?);/)[1];
        base64ImageData = parts[1];

        // Display the image in the preview
        imagePreview.src = dataUrl;
        
        // **NEW LOGIC POSITION:** Hide the instruction message once the screenshot is loaded
        if (instructionMessage) {
            instructionMessage.style.display = 'none';
        }

        // 2. Once captured, change button to "Analyze" and enable it
        submitButton.textContent = 'Analyze Image';
        submitButton.disabled = false;
        toggleVisibility(loadingIndicator, false);

    } catch (error) {
        console.error("Capture failed:", error);
        submitButton.textContent = 'Capture Failed';
        resultArea.textContent = `Failed to capture screen. Ensure your extension has the 'activeTab' permission. Error: ${error.message}`;
        toggleVisibility(resultContainer, true);
        toggleVisibility(loadingIndicator, false);
        return;
    }
};

// Main function to handle the API call
const analyzeImage = async () => {
    if (GEMINI_API_KEY === 'AIzaSy...[Your actual 39-character key]...') {
        // Re-enable button so user can see the message
        submitButton.disabled = false;
        toggleVisibility(resultContainer, true);
        resultArea.textContent = 'ERROR: Please replace the placeholder API key in popup.js with your actual key.';
        return;
    }
    
    // **OLD LOGIC REMOVED HERE:** The message is now hidden when the image loads, not when analysis starts.

    // Show loading state for analysis
    submitButton.disabled = true;
    submitButton.textContent = 'Analyzing...';
    toggleVisibility(loadingIndicator, true);
    
    try {
        const payload = {
            contents: [{
                role: "user",
                parts: [
                    { text: fixedPrompt },
                    { inlineData: { mimeType, data: base64ImageData } }
                ]
            }],
        };
        
        const response = await fetch(API_URL_BASE + GEMINI_API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }); 

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
        }
        
        let result = await response.json();
        
        // Process the API response
        if (result && result.candidates && result.candidates.length > 0) {
            resultArea.textContent = result.candidates[0].content.parts[0].text;
        } else {
            resultArea.textContent = 'Could not get a valid response from the API.';
        }
    } catch (error) {
        resultArea.textContent = `Failed to analyze the image: ${error.message}.`;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Analyze Image';
        toggleVisibility(loadingIndicator, false);
        toggleVisibility(resultContainer, true);
    }
};

// --- Initialization ---

// 1. Run the capture function immediately when the popup opens
captureAndAnalyze();

// 2. Attach click listener to the button (to run the analysis after capture)
submitButton.addEventListener('click', analyzeImage);
