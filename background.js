// This service worker is responsible for capturing the screen when the icon is clicked.

chrome.action.onClicked.addListener(async (tab) => {
    
    // --- 1. Get Screen and Window Dimensions ---
    const screen = await new Promise(resolve => chrome.system.display.getInfo(resolve));
    const primaryDisplay = screen[0].bounds;

    // Define the desired size for the popup window
    const WINDOW_WIDTH = 420; // Set width larger than content (380px) for margin
    const WINDOW_HEIGHT = 650; 
    
    // Calculate the X position to place the window near the top-right corner
    // We use primaryDisplay.width (screen width) - WINDOW_WIDTH - 20 (small margin)
    const xPosition = primaryDisplay.width - WINDOW_WIDTH - 20; 
    const yPosition = 50; // Place it 50px from the top

    // 2. Capture the visible area of the active tab
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
        if (chrome.runtime.lastError) {
            console.error("Screenshot failed:", chrome.runtime.lastError.message);
            return;
        }
        
        // 3. Open the analysis UI in a custom-positioned, app-like window
        chrome.windows.create({
            url: chrome.runtime.getURL("analyzer.html"),
            type: "popup", // This makes it an app-like window without browser controls
            width: WINDOW_WIDTH, 
            height: WINDOW_HEIGHT,
            left: xPosition,     // <-- NEW: Custom X position
            top: yPosition,      // <-- NEW: Custom Y position
            focused: true
        }, (newWindow) => {
            // Give the new window a moment to load
            setTimeout(() => {
                // 4. Send the image data to the window's script
                if (newWindow && newWindow.tabs && newWindow.tabs[0]) {
                    chrome.tabs.sendMessage(newWindow.tabs[0].id, { 
                        action: "analyzeScreenshot", 
                        dataUrl: dataUrl 
                    });
                }
            }, 300); 
        });
    });
});