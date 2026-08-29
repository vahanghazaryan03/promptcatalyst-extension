document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const selectButton = document.getElementById('select-file-button');
    const statusDiv = document.getElementById('status');

    function updateStatus(message, type) {
        statusDiv.className = `active ${type}`;
        if (type === 'loading') {
            statusDiv.innerHTML = `<span class="spinner"></span>${message}`;
        } else {
            statusDiv.textContent = message;
        }
    }

    async function handleFile(file) {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            updateStatus('Invalid file type. Only JPG, PNG and WebP images are allowed.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            updateStatus('File too large. Maximum size is 5MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async function(e) {
            const dataUrl = e.target.result;
            updateStatus('Setting background...', 'loading');

            try {
                // Update localStorage first
                localStorage.setItem('customBackgroundImage', dataUrl);
                localStorage.setItem('selectedTheme', 'customBackground');

                // Send message to background script
                await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        action: 'updateCustomBackground',
                        imageUrl: dataUrl
                    }, response => {
                        if (chrome.runtime.lastError) {
                            // Instead of throwing an error, we'll just log it and continue
                            console.log('Warning: Message port closed, but proceeding with update');
                        }
                        resolve();
                    });
                });

                updateStatus('Background set successfully!', 'success');
                
                // Close the tab after a short delay
                setTimeout(() => {
                    try {
                        window.close();
                    } catch (error) {
                        chrome.tabs.getCurrent(tab => {
                            if (tab) {
                                chrome.tabs.remove(tab.id);
                            }
                        });
                    }
                }, 1500);

            } catch (error) {
                console.error('Error setting background:', error);
                updateStatus('Error setting background. Please try again.', 'error');
            }
        };
    }

    // Event Listeners
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragging');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    selectButton.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });
});