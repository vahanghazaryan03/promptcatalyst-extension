/**
 * Chrome runs this as a service worker, where importScripts is how the shared
 * modules get loaded. Firefox runs it as an event page, which has no
 * importScripts — there the same three files are listed in the manifest's
 * background.scripts and are already loaded by the time this runs.
 */
if (typeof importScripts === 'function') {
    importScripts('pc-config.js', 'pc-auth.js', 'pc-api.js');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeImage') {
        handleAnalyzeImage(request, sendResponse);
        return true; // Keep the messaging channel open for async response
    } else if (request.action === 'updateCustomBackground') {
        // Forward the message to all extension pages
        chrome.runtime.sendMessage(request);
        // Store in local storage
        chrome.storage.local.set({
            customBackgroundImage: request.imageUrl
        }, () => {
            // Send response after storage is complete
            sendResponse({ success: true });
        });
        return true; // Keep the messaging channel open for async response
    }
});
function dataURLToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid Data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('upload-background.html')) {
        // Inject necessary scripts
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['upload-background.js']
        }).catch(err => console.error('Script injection error:', err));
    }
});

async function handleAnalyzeImage(request, sendResponse) {
    try {
        // Extract data from the request
        const dataUrl = request.dataUrl;
        const fileName = request.fileName;
        const fileType = request.fileType;

        // Convert Data URL to Blob
        const blob = dataURLToBlob(dataUrl);

        // Create a new File object
        const file = new File([blob], fileName, { type: fileType });

        // Revalidate premium status, but only when there is a session to check:
        // /test-premium refuses anonymous callers, and image analysis is open to
        // them on the daily allowance.
        if (await pcAuth.isSignedIn()) {
            const premium = await pcApi.request('/test-premium', { method: 'GET' });
            if (premium.ok) {
                const isPremiumUser = premium.data?.is_premium || false;
                chrome.storage.local.set({ isPremiumUser });
            } else if (await pcApi.isSessionExpired(premium.response)) {
                sendResponse({ error: 'Session expired. Please log in again.' });
                return;
            }
        }

        // Create FormData and append the file. Field name must be "image".
        const formData = new FormData();
        formData.append('image', file);

        const { response, data: responseData } = await pcApi.request('/analyze-image', {
            method: 'POST',
            multipart: true,
            body: formData
        });

        if (await pcApi.isSessionExpired(response)) {
            sendResponse({ error: 'Session expired. Please log in again.' });
            return;
        }

        /**
         * Out of credits, or a plan away. Both are answered with the upsell and
         * no error text: they are not failures, and the upload page shows its
         * own panel for them.
         */
        if (pcApi.isTerminal(response, responseData)) {
            console.warn('Image analysis refused:', responseData?.code, responseData?.error);
            sendResponse({
                showUpgrade: true,
                error: null,
                message: pcApi.errorMessage(
                    responseData,
                    'Image analysis limit reached. Upgrade for higher limits.'
                )
            });
            return;
        }

        if (!response.ok) {
            throw new Error(pcApi.errorMessage(responseData, 'Failed to analyze image'));
        }


        // Success case - use the stored response data
        sendResponse({ 
            prompts: responseData.prompts, 
            message: responseData.message,
            success: true 
        });

        // Store the results immediately
        chrome.storage.local.set({
            lastImageAnalysis: {
                prompts: responseData.prompts,
                fileName: request.fileName,
                timestamp: Date.now()
            }
        });

     } catch (error) {
        /**
         * Anything reaching here is a genuine failure. A credit limit is
         * recognised above, by the code the API sends; it is not guessed at by
         * looking for "limit" in the message, which used to be how this worked
         * and which fires on "Rate limit exceeded" from a busy provider — a
         * transient fault answered with a demand for money.
         */
        console.error('Error processing image:', error);
        sendResponse({
            error: error.message || 'Error: Could not analyze image.',
            success: false
        });
    }
}
/**
 * Refreshing lives in pcAuth now, and happens automatically whenever a token is
 * handed out. The hand-rolled version that stood here called an endpoint that no
 * longer exists, and on failure called updateUIForLoginStatus() — a popup
 * function that does not exist in a service worker, so the catch block itself
 * threw.
 */


// Function to send a message to the popup
function sendMessageToPopup(message) {
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            // Popup is not open, which is fine
            console.log('No popup open to receive message.');
        } else {
            console.log('Message sent to popup successfully.');
        }
    });
}