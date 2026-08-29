// upload.js
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const selectButton = document.getElementById('select-file-button');
    const statusDiv = document.getElementById('status');
    const instructions = document.getElementById('instructions');

 function updateStatus(message, type) {
        statusDiv.className = `active ${type}`;
        
        if (type === 'loading') {
            statusDiv.innerHTML = `<span class="spinner"></span>${message}`;
        } else {
            statusDiv.textContent = message;
        }
    }


    function handleFile(file) {
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

    updateStatus('Analyzing image, please wait...', 'loading');

    reader.onload = function(e) {
        const dataUrl = e.target.result;

  chrome.runtime.sendMessage(
    {
        action: 'analyzeImage',
        dataUrl: dataUrl,
        fileName: file.name,
        fileType: file.type,
    },
    function(response) {
        if (chrome.runtime.lastError) {
            updateStatus('Error: Could not analyze image.', 'error');
            return;
        }

        if (response.showUpgrade) { // Changed from response.error
            // Show premium upsell message
            const uploadArea = document.getElementById('upload-area');
            uploadArea.style.display = 'none';

            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = `
                <div class="limit-reached-prompt">
                    <h3>Image Analysis Limit Reached for Today</h3>
                    <p>Upgrade to Premium to unlock higher limits and exclusive features!</p>
                    <div class="features-list">
                        <div class="feature-item">
                            <svg class="feature-icon" viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                            <span>10,000 prompt and preview generations per month</span>
                        </div>
                        <div class="feature-item">
                            <svg class="feature-icon" viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                            <span>Higher quality image analysis</span>
                        </div>
                        <div class="feature-item">
                            <svg class="feature-icon" viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                            <span>More Styles, Camera Angles, Lightings and Purposes</span>
                        </div>
                    </div>
                    <button class="upgrade-btn">
                        <span class="shine"></span>
                        Upgrade to Premium
                    </button>
                </div>
            `;
            statusDiv.className = 'active';

            // Add click handler for upgrade button
            const upgradeBtn = statusDiv.querySelector('.upgrade-btn');
            upgradeBtn.addEventListener('click', () => {
                window.open('https://promptcatalyst.ai/premium', '_blank');
            });
        } else if (response.error) {
            updateStatus(response.error, 'error');
        } else {
            updateStatus('Image analyzed successfully! Check the extension for results.', 'success');
        }
    }
);
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