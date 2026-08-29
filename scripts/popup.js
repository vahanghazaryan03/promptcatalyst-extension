

document.addEventListener('DOMContentLoaded', function() { 
    chrome.storage.local.get(['firstLaunch'], (result) => {
        if (result.firstLaunch === undefined) {
            // This is the first launch
            chrome.tabs.create({
                url: chrome.runtime.getURL('docs.html'),
                active: true
            });

            // Set the firstLaunch flag to false
            chrome.storage.local.set({ firstLaunch: false });
        }
    });
chrome.storage.local.get(['lastImageAnalysis'], (result) => {
        if (result.lastImageAnalysis) {
            console.log('Found image analysis results:', result.lastImageAnalysis);
            displayImageAnalysis(result.lastImageAnalysis, true); // Changed to true to save to history
            // Clear the stored results after displaying them
            chrome.storage.local.remove(['lastImageAnalysis']);
        }
    });
    const videoInputs = [
        'videoPromptInput',
        'videoStyleSelect',
        'videoMovementSelect',
        'videoCameraAngleSelect',
        'videoPromptLength'
    ];

    videoInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveSelections);
            if (element.tagName === 'INPUT') {
                element.addEventListener('input', saveSelections);
            }
        }
    });
     setupVideoModeEventListeners();
window.applyTheme = function(themeId) {
    const theme = themes[themeId];
    if (!theme) return;

    document.body.setAttribute('data-theme', themeId);
    console.log('Applying theme:', themeId);
    localStorage.setItem('selectedTheme', themeId);

    const root = document.documentElement;
    
    // Remove any existing overlay
    let overlay = document.getElementById('theme-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    let snowfall = document.querySelector('.snowfall-container');
    if (snowfall) {
        snowfall.remove();
    }

    // Add snowfall for Christmas theme
    if (themeId === 'christmasJoy') {
        document.body.appendChild(createSnowflakes());
    }

    updateWeeklyPromptsTheme(theme);

    // Apply background
    if (theme.backgroundType === 'color') {
        root.style.setProperty('--background', theme.colors.background);
        root.style.removeProperty('--background-image');
        document.body.style.backgroundImage = 'none';
    } else if (theme.backgroundType === 'image' && theme.backgroundImage) {
    // Create overlay with multiple layers for depth
    overlay = document.createElement('div');
    overlay.id = 'theme-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${theme.overlay.gradientOverlay};
        backdrop-filter: blur(${theme.overlay.blur});
        -webkit-backdrop-filter: blur(${theme.overlay.blur});
        z-index: 0;
        pointer-events: none;
        transition: backdrop-filter 0.3s ease;
    `;

    // Add a subtle grain texture to the overlay
    const noise = document.createElement('div');
    noise.className = 'noise-overlay';
    overlay.appendChild(noise);

    // Set up background image with enhanced properties
    document.body.style.backgroundImage = `url("${theme.backgroundImage}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.transition = 'all 0.3s ease';
    
    // Ensure Firefox properly loads the background
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';
    
    document.body.insertBefore(overlay, document.body.firstChild);
}

    // Apply theme colors
    Object.entries(theme.colors).forEach(([property, value]) => {
        root.style.setProperty(`--${property}`, value);
    });

    // Update specific component styles
    updateComponentStyles(theme);

    // Update active state in theme panel
    updateThemePanelState(themeId);
}
  setupVideoInputListeners();
function updateComponentStyles(theme) {
    // Update input fields
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.style.backgroundColor = theme.colors.inputBackground;
        element.style.borderColor = theme.colors.inputBorder;
        element.style.color = theme.colors.text;
    });

    // Update ALL styled buttons across the extension
    const styledButtonSelectors = `
        .copy-btn,
        .variations-btn,
        .extend-btn,
        .shorten-btn,
        .preview-btn,
        #generatePrompt,
        .login-confirm-btn,
        .dialog-confirm-btn,
        .extend-confirm-btn,
        .create-collection-btn,
        .collection-export-btn,
        .fullscreen-btn,
        .color-picker-btn,
        .custom-bg-btn,
        .collection-header-delete,
        .remove-from-collection,
        .move-collection-btn,
        .quick-add-btn
    `;

    document.querySelectorAll(styledButtonSelectors).forEach(button => {
        if (!button.classList.contains('preview-btn')) {
            button.style.backgroundColor = theme.colors.primary;
            button.style.color = '#101010';

            // Handle disabled state
            if (button.classList.contains('disabled') || button.disabled) {
                button.style.backgroundColor = theme.colors.secondary;
                button.style.opacity = '0.7';
                button.style.cursor = 'not-allowed';
            }
        }
    });
     const helpIcon = document.querySelector('.help-icon img');
    //const discordIcon = document.querySelector('.discord-icon img');

    if (helpIcon) {
        const filter = convertHexToFilter(theme.colors.primary);
        helpIcon.style.filter = filter;
        helpIcon.style.opacity = '0.6'; // Default state opacity
        
        // Add hover effect
        const helpIconContainer = helpIcon.closest('.help-icon');
        if (helpIconContainer) {
            // Remove existing listeners to prevent duplicates
            const helpIconClone = helpIconContainer.cloneNode(true);
            helpIconContainer.parentNode.replaceChild(helpIconClone, helpIconContainer);
            
            // Add new hover listeners
            helpIconClone.addEventListener('mouseenter', () => {
                helpIconClone.querySelector('img').style.opacity = '1';
                helpIconClone.querySelector('img').style.transform = 'scale(1.1)';
            });
            
            helpIconClone.addEventListener('mouseleave', () => {
                helpIconClone.querySelector('img').style.opacity = '0.6';
                helpIconClone.querySelector('img').style.transform = 'scale(1)';
            });
        }
    }

    // Apply the same styling to Discord icon
    //if (discordIcon) {
        //const filter = convertHexToFilter(theme.colors.primary);
       // discordIcon.style.filter = filter;
        //discordIcon.style.opacity = '0.6'; // Default state opacity
        
        // Add hover effect
        //const discordIconContainer = discordIcon.closest('.discord-icon');
       // if (discordIconContainer) {
            // Remove existing listeners to prevent duplicates
           // const discordIconClone = discordIconContainer.cloneNode(true);
           // discordIconContainer.parentNode.replaceChild(discordIconClone, discordIconContainer);
            
            // Add new hover listeners
           // discordIconClone.addEventListener('mouseenter', () => {
               // discordIconClone.querySelector('img').style.opacity = '1';
                //discordIconClone.querySelector('img').style.transform = 'scale(1.1)';
            //});
            
            //discordIconClone.addEventListener('mouseleave', () => {
                //discordIconClone.querySelector('img').style.opacity = '0.6';
                //discordIconClone.querySelector('img').style.transform = 'scale(1)';
            //});
        //}
    //}

    // Update preview buttons specifically
    document.querySelectorAll('.preview-btn').forEach(button => {
        button.style.backgroundColor = theme.colors.previewButtonBackground;
        button.style.color = '#101010';
        
        if (button.classList.contains('disabled') || button.disabled) {
            button.style.backgroundColor = theme.colors.previewButtonDisabled;
            button.style.color = theme.colors.previewButtonDisabledText;
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
        }
    });

    // Update prompt boxes
    document.querySelectorAll('.prompt-box, .collection-item, .weekly-prompt-card').forEach(box => {
        box.style.backgroundColor = theme.colors.cardBackground;
        box.style.borderColor = theme.colors.border;
    });

    // Update dropdowns
    document.querySelectorAll('.select-options, .quick-add-dropdown, .move-collection-dropdown').forEach(dropdown => {
        dropdown.style.backgroundColor = theme.colors.dropdownBackground;
        dropdown.style.borderColor = theme.colors.border;
    });

    // Update tooltips
    document.querySelectorAll('.tooltip-text').forEach(tooltip => {
        tooltip.style.backgroundColor = theme.colors.tooltipBackground;
        tooltip.style.color = theme.colors.text;
    });
  document.querySelectorAll('.quick-add-btn').forEach(btn => {
        updateQuickAddButtonColor(btn, theme);
    });
    // Update tabs
    document.querySelectorAll('.tab-button').forEach(tab => {
        if (tab.classList.contains('active')) {
            tab.style.color = theme.colors.primary;
        } else {
            tab.style.color = theme.colors.textSecondary;
        }
    });
 updateAllQuickAddButtons(theme);
    // Update collection-specific elements
    document.querySelectorAll('.collection-prompts-header').forEach(header => {
        header.style.backgroundColor = theme.colors.cardBackground;
        header.style.borderColor = theme.colors.border;
    });
    document.querySelectorAll('.chevron-icon').forEach(chevron => {
        const button = chevron.closest('.advanced-options-btn');
        if (button && button.matches(':hover')) {
            chevron.style.filter = `brightness(0) saturate(100%) ${convertHexToFilter(theme.colors.primary)}`;
        } else {
            chevron.style.filter = 'brightness(0) saturate(100%) invert(60%)';
        }
    });
}
function handleCustomBackground() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('upload-background.html'),
        active: true
    });
}

function updateThemePanelState(activeThemeId) {
    document.querySelectorAll('.theme-option').forEach(option => {
        const themeName = option.querySelector('span').textContent;
        const isActive = themes[activeThemeId].name === themeName;
        option.classList.toggle('active', isActive);
    });
}

function createThemeAwarePromptBox(promptText, isHistory = false, isInCollection = false) {
    const currentTheme = themes[localStorage.getItem('selectedTheme') || 'default'];
    const promptBox = createPromptBox(promptText, isHistory, isInCollection);
    
    // Check if this is a video prompt by looking for video-specific keywords
    const isVideoPrompt = promptText.includes('--video') || 
                         (localStorage.getItem('videoMode') === 'true' && !isHistory);
    
    if (isVideoPrompt) {
        promptBox.classList.add('video-prompt');
    }


    if (promptBox && currentTheme) {
        // Apply current theme colors to the new prompt box
        promptBox.style.backgroundColor = currentTheme.backgroundType === 'image' && isInCollection
            ? 'rgba(30, 30, 30, 0.85)'
            : currentTheme.colors.cardBackground;
        
        promptBox.style.borderColor = currentTheme.backgroundType === 'image'
            ? 'rgba(255, 255, 255, 0.1)'
            : currentTheme.colors.border;

        // Style buttons and other elements
        const buttons = promptBox.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.classList.contains('copy-btn') || 
                button.classList.contains('variations-btn') ||
                button.classList.contains('extend-btn') ||
                button.classList.contains('shorten-btn')) { // Added shorten-btn
                button.style.backgroundColor = currentTheme.colors.primary;
                button.style.color = '#101010';

                // Handle disabled state on creation
                if (button.classList.contains('disabled')) {
                    button.style.backgroundColor = currentTheme.colors.secondary;
                    button.style.opacity = '0.7';
                    button.style.cursor = 'not-allowed';
                }
            }
        });
    }

    return promptBox;
}
function updateButtonState(button, disabled) {
    const currentTheme = themes[localStorage.getItem('selectedTheme') || 'default'];
    
    if (disabled) {
        button.classList.add('disabled');
        button.style.backgroundColor = currentTheme.colors.secondary;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
    } else {
        button.classList.remove('disabled');
        button.style.backgroundColor = currentTheme.colors.primary;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

    // Add message listener
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateCustomBackground') {
        // Ensure the URL is properly formatted for Firefox
        const imageUrl = request.imageUrl.startsWith('data:') ? 
            request.imageUrl : 
            `data:image/jpeg;base64,${request.imageUrl}`;
            
        themes.customBackground.backgroundImage = imageUrl;
        
        // Only apply the theme if custom background is currently selected
        if (localStorage.getItem('selectedTheme') === 'customBackground') {
            applyTheme('customBackground');
        }
    }
});

const themes = {
   
    default: {
        name: 'Default',
        colors: {
            background: '#171717',
            cardBackground: '#1e1e1e',
            primary: '#42f56f',
            secondary: '#31db8a',
            text: '#f5f5f5',
            textSecondary: '#888',
            border: '#333',
            inputBackground: '#1e1e1e',
            inputBorder: '#555',
            dropdownBackground: '#1e1e1e',
            dropdownHover: '#2a2a2a',
            tooltipBackground: '#333',
            success: '#42f56f',
            error: '#ff4444',
            warning: '#ffb700',
            info: '#42a5f5',
             previewButtonBackground: '#fcb023',
        previewButtonHover: '#FF8C00',
        previewButtonDisabled: '#cc7a00',
        previewButtonDisabledText: 'rgba(0, 0, 0, 0.7)'
        },
        backgroundType: 'color'
    },
   
      neonSynth: {
        name: 'Neon Synth',
        colors: {
            background: '#0a0a14',
            cardBackground: '#12121f',
            primary: '#00ffd5',
            secondary: '#00c4a7',
            text: '#ffffff',
            textSecondary: '#a0a0c0',
            border: '#1f1f3d',
            inputBackground: '#16162b',
            inputBorder: '#2a2a4d',
            dropdownBackground: '#16162b',
            dropdownHover: '#1f1f3d',
            tooltipBackground: '#16162b',
            success: '#00ffd5',
            error: '#ff2d6c',
            warning: '#ffb300',
            info: '#00a2ff',
            previewButtonBackground: '#ff2d6c',
            previewButtonHover: '#ff0055',
            previewButtonDisabled: '#7a1533',
            previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
        },
        backgroundType: 'color'
    },
    deepOcean: {
        name: 'Deep Ocean',
        colors: {
            background: '#0a192f',
            cardBackground: '#112240',
            primary: '#64ffda',
            secondary: '#48d5b5',
            text: '#e6f1ff',
            textSecondary: '#8892b0',
            border: '#1e3a5f',
            inputBackground: '#112240',
            inputBorder: '#1e3a5f',
            dropdownBackground: '#112240',
            dropdownHover: '#1e3a5f',
            tooltipBackground: '#112240',
            success: '#64ffda',
            error: '#ff5d8f',
            warning: '#ffd700',
            info: '#57cbff',
            previewButtonBackground: '#57cbff',
            previewButtonHover: '#2ba7ff',
            previewButtonDisabled: '#1a4d7a',
            previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
        },
        backgroundType: 'color'
    },
    amethyst: {
        name: 'Amethyst',
        colors: {
            background: '#2d1b4e',
            cardBackground: '#3b2064',
            primary: '#e056fd',
            secondary: '#c736db',
            text: '#f8f3ff',
            textSecondary: '#b794f4',
            border: '#4a2b7d',
            inputBackground: '#3b2064',
            inputBorder: '#4a2b7d',
            dropdownBackground: '#3b2064',
            dropdownHover: '#4a2b7d',
            tooltipBackground: '#3b2064',
            success: '#e056fd',
            error: '#ff4d6d',
            warning: '#ffd93d',
            info: '#6ba6ff',
            previewButtonBackground: '#6ba6ff',
            previewButtonHover: '#4a80ff',
            previewButtonDisabled: '#2b3b7a',
            previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
        },
        backgroundType: 'color'
    },
    crimsonNoir: {
        name: 'Crimson Noir',
        colors: {
            background: '#1a0f0f',
            cardBackground: '#2a1717',
            primary: '#ff3333',
            secondary: '#cc2929',
            text: '#fff5f5',
            textSecondary: '#b38989',
            border: '#3d1f1f',
            inputBackground: '#2a1717',
            inputBorder: '#3d1f1f',
            dropdownBackground: '#2a1717',
            dropdownHover: '#3d1f1f',
            tooltipBackground: '#2a1717',
            success: '#ff3333',
            error: '#ff1a1a',
            warning: '#ffb300',
            info: '#ff6666',
            previewButtonBackground: '#ff6666',
            previewButtonHover: '#ff4d4d',
            previewButtonDisabled: '#7a2424',
            previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
        },
        backgroundType: 'color'
    },
    glacialFrost: {
        name: 'Glacial Frost',
        colors: {
            background: '#1a2634',
            cardBackground: '#243447',
            primary: '#7ae7ff',
            secondary: '#5bbcd9',
            text: '#f0f8ff',
            textSecondary: '#89a7c3',
            border: '#2d4156',
            inputBackground: '#243447',
            inputBorder: '#2d4156',
            dropdownBackground: '#243447',
            dropdownHover: '#2d4156',
            tooltipBackground: '#243447',
            success: '#7ae7ff',
            error: '#ff6b8e',
            warning: '#ffd166',
            info: '#66d9ff',
            previewButtonBackground: '#66d9ff',
            previewButtonHover: '#33ccff',
            previewButtonDisabled: '#1a667a',
            previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
        },
        backgroundType: 'color'
    },
    cosmic: {
    name: 'Cosmic',
    colors: {
        background: '#0A0B1E',
        cardBackground: '#151632',
        primary: '#FF61D8',
        secondary: '#C446A3',
        text: '#FFFFFF',
        textSecondary: '#B4A5D0',
        border: '#272B59',
        inputBackground: '#151632',
        inputBorder: '#272B59',
        dropdownBackground: '#151632',
        dropdownHover: '#1D1E42',
        tooltipBackground: '#151632',
        success: '#FF61D8',
        error: '#FF4B4B',
        warning: '#FFB800',
        info: '#61FFED',
        previewButtonBackground: '#61FFED',
        previewButtonHover: '#46C4B5',
        previewButtonDisabled: '#235E57',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
    },
    backgroundType: 'color'
},

// Sakura - A Japanese cherry blossom inspired theme
sakura: {
    name: 'Sakura',
    colors: {
        background: '#1A1118',
        cardBackground: '#251B24',
        primary: '#FF9EC7',
        secondary: '#D37BA1',
        text: '#FFF6FA',
        textSecondary: '#D4B8C7',
        border: '#3D2C3C',
        inputBackground: '#251B24',
        inputBorder: '#3D2C3C',
        dropdownBackground: '#251B24',
        dropdownHover: '#2F222E',
        tooltipBackground: '#251B24',
        success: '#FF9EC7',
        error: '#FF5C5C',
        warning: '#FFD700',
        info: '#9EFFED',
        previewButtonBackground: '#9EFFED',
        previewButtonHover: '#7BCDB2',
        previewButtonDisabled: '#3D665A',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
    },
    backgroundType: 'color'
},

// Desert Night - A theme inspired by starlit desert nights
desertNight: {
    name: 'Desert Night',
    colors: {
        background: '#12151E',
        cardBackground: '#1C2235',
        primary: '#FFB347',
        secondary: '#D4942F',
        text: '#FFF8ED',
        textSecondary: '#BFB3A4',
        border: '#2D3654',
        inputBackground: '#1C2235',
        inputBorder: '#2D3654',
        dropdownBackground: '#1C2235',
        dropdownHover: '#242D45',
        tooltipBackground: '#1C2235',
        success: '#FFB347',
        error: '#FF6B6B',
        warning: '#FFE66D',
        info: '#47B3FF',
        previewButtonBackground: '#47B3FF',
        previewButtonHover: '#2F8AD4',
        previewButtonDisabled: '#1A4468',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
    },
    backgroundType: 'color'
},

// Matrix - A cyberpunk matrix-inspired theme
matrix: {
    name: 'Matrix',
    colors: {
        background: '#0D1117',
        cardBackground: '#161B22',
        primary: '#00FF9D',
        secondary: '#00CC7E',
        text: '#E6FFF4',
        textSecondary: '#7DB89E',
        border: '#23352D',
        inputBackground: '#161B22',
        inputBorder: '#23352D',
        dropdownBackground: '#161B22',
        dropdownHover: '#1E242D',
        tooltipBackground: '#161B22',
        success: '#00FF9D',
        error: '#FF4D4D',
        warning: '#FFD700',
        info: '#00FFEE',
        previewButtonBackground: '#00FFEE',
        previewButtonHover: '#00CCBE',
        previewButtonDisabled: '#006057',
        previewButtonDisabledText: 'rgba(0, 0, 0, 0.7)'
    },
    backgroundType: 'color'
},
     midnight: {
        name: 'Midnight Blue',
        colors: {
            background: '#0f172a',
            cardBackground: '#1e293b',
            primary: '#38bdf8',
            secondary: '#0ea5e9',
            text: '#f1f5f9',
            textSecondary: '#94a3b8',
            border: '#334155',
            inputBackground: '#1e293b',
            inputBorder: '#475569',
            dropdownBackground: '#1e293b',
            dropdownHover: '#334155',
            tooltipBackground: '#1e293b',
            success: '#38bdf8',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
              previewButtonBackground: '#3b82f6',
        previewButtonHover: '#2563eb',
        previewButtonDisabled: '#1d4ed8',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
        },
        backgroundType: 'color'
    },
    emeraldDusk: {
        name: 'Emerald Dusk',
        colors: {
            background: '#0f1f1a',
            cardBackground: '#1a2f28',
            primary: '#00ff9d',
            secondary: '#00cc7e',
            text: '#f0fff7',
            textSecondary: '#89c3a7',
            border: '#1f3d2f',
            inputBackground: '#1a2f28',
            inputBorder: '#1f3d2f',
            dropdownBackground: '#1a2f28',
            dropdownHover: '#1f3d2f',
            tooltipBackground: '#1a2f28',
            success: '#00ff9d',
            error: '#ff4d6d',
            warning: '#ffd93d',
            info: '#4dffb8',
            previewButtonBackground: '#4dffb8',
            previewButtonHover: '#1aff9d',
            previewButtonDisabled: '#0d7a4c',
            previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
        },
        backgroundType: 'color'
    },
    sunset: {
        name: 'Sunset',
        colors: {
            background: '#18181b',
            cardBackground: '#27272a',
            primary: '#f43f5e',
            secondary: '#e11d48',
            text: '#fafafa',
            textSecondary: '#a1a1aa',
            border: '#3f3f46',
            inputBackground: '#27272a',
            inputBorder: '#52525b',
            dropdownBackground: '#27272a',
            dropdownHover: '#3f3f46',
            tooltipBackground: '#27272a',
            success: '#f43f5e',
            error: '#dc2626',
            warning: '#fb923c',
            info: '#22d3ee',
            previewButtonBackground: '#f43f5e',
        previewButtonHover: '#e11d48',
        previewButtonDisabled: '#be123c',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
        },
        backgroundType: 'color'
    },
    aurora: {
    name: 'Aurora Dreams',
    colors: {
        background: '#0B1021',
        cardBackground: '#141B33',
        primary: '#64FFDA',
        secondary: '#48D1CC',
        text: '#E2E8F0',
        textSecondary: '#94A3B8',
        border: '#1F2A48',
        inputBackground: '#141B33',
        inputBorder: '#2A3655',
        dropdownBackground: '#141B33',
        dropdownHover: '#1F2A48',
        tooltipBackground: '#141B33',
        success: '#64FFDA',
        error: '#FF5D8F',
        warning: '#FFD700',
        info: '#57CBFF',
        previewButtonBackground: '#57CBFF',
        previewButtonHover: '#2BA7FF',
        previewButtonDisabled: '#1A4D7A',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
    },
    backgroundType: 'color'
},

// Quantum Pulse Theme
quantumPulse: {
    name: 'Quantum Pulse',
    colors: {
        background: '#1A0B2E',
        cardBackground: '#261447',
        primary: '#FF3399',
        secondary: '#E61E8C',
        text: '#FFFFFF',
        textSecondary: '#B794F4',
        border: '#3D1F5D',
        inputBackground: '#261447',
        inputBorder: '#4A2B7D',
        dropdownBackground: '#261447',
        dropdownHover: '#3D1F5D',
        tooltipBackground: '#261447',
        success: '#FF3399',
        error: '#FF4D6D',
        warning: '#FFD93D',
        info: '#6BA6FF',
        previewButtonBackground: '#6BA6FF',
        previewButtonHover: '#4A80FF',
        previewButtonDisabled: '#2B3B7A',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
    },
    backgroundType: 'color'
},

// Arctic Frost Theme
arcticFrost: {
    name: 'Arctic Frost',
    colors: {
        background: '#1B2937',
        cardBackground: '#243B53',
        primary: '#7BE0FF',
        secondary: '#5CCCFF',
        text: '#F0F9FF',
        textSecondary: '#9FB3C8',
        border: '#334E68',
        inputBackground: '#243B53',
        inputBorder: '#334E68',
        dropdownBackground: '#243B53',
        dropdownHover: '#334E68',
        tooltipBackground: '#243B53',
        success: '#7BE0FF',
        error: '#FF6B8E',
        warning: '#FFD166',
        info: '#66D9FF',
        previewButtonBackground: '#66D9FF',
        previewButtonHover: '#33CCFF',
        previewButtonDisabled: '#1A667A',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
    },
    backgroundType: 'color'
},

// Volcanic Theme
volcanic: {
    name: 'Volcanic',
    colors: {
        background: '#1A0F0F',
        cardBackground: '#2D1717',
        primary: '#FF4C4C',
        secondary: '#E63939',
        text: '#FFF5F5',
        textSecondary: '#B98989',
        border: '#3D1F1F',
        inputBackground: '#2D1717',
        inputBorder: '#4A2B2B',
        dropdownBackground: '#2D1717',
        dropdownHover: '#3D1F1F',
        tooltipBackground: '#2D1717',
        success: '#FF4C4C',
        error: '#FF1A1A',
        warning: '#FFB300',
        info: '#FF6666',
        previewButtonBackground: '#FF6666',
        previewButtonHover: '#FF4D4D',
        previewButtonDisabled: '#7A2424',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
    },
    backgroundType: 'color'
},

// Enchanted Forest Theme
enchantedForest: {
    name: 'Enchanted Forest',
    colors: {
        background: '#0C1F13',
        cardBackground: '#1A2F23',
        primary: '#4ADE80',
        secondary: '#22C55E',
        text: '#F0FDF4',
        textSecondary: '#86EFAC',
        border: '#1F3A2D',
        inputBackground: '#1A2F23',
        inputBorder: '#2D4A3E',
        dropdownBackground: '#1A2F23',
        dropdownHover: '#1F3A2D',
        tooltipBackground: '#1A2F23',
        success: '#4ADE80',
        error: '#F87171',
        warning: '#FBBF24',
        info: '#67E8F9',
        previewButtonBackground: '#4ADE80',
        previewButtonHover: '#22C55E',
        previewButtonDisabled: '#166534',
        previewButtonDisabledText: 'rgba(255, 255, 255, 0.7)'
    },
    backgroundType: 'color'
},
    
customBackground: {
        name: 'Custom Background',
        colors: {
            // Make card backgrounds slightly more transparent for better blend
            cardBackground: 'rgba(20, 20, 20, 0.75)',
            primary: '#42f56f',
            secondary: '#31db8a',
            text: '#f5f5f5',
            textSecondary: 'rgba(255, 255, 255, 0.7)',
            border: 'rgba(255, 255, 255, 0.1)',
            inputBackground: 'rgba(20, 20, 20, 0.75)',
            inputBorder: 'rgba(255, 255, 255, 0.15)',
            dropdownBackground: 'rgba(20, 20, 20, 0.9)',
            dropdownHover: 'rgba(42, 42, 42, 0.9)',
            tooltipBackground: 'rgba(30, 30, 30, 0.95)',
            success: '#42f56f',
            error: '#ff4444',
            warning: '#ffb700',
            info: '#42a5f5',
            previewButtonBackground: '#fcb023',
        previewButtonHover: '#FF8C00',
        previewButtonDisabled: '#cc7a00',
        previewButtonDisabledText: 'rgba(0, 0, 0, 0.7)'
        },
        backgroundType: 'image',
        backgroundImage: null,
        overlay: {
            color: 'rgba(0, 0, 0, 0.65)', // Slightly darker overlay
            blur: '12px', // Increased blur for more depth
            gradientOverlay: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)'
        }
    }
};
function displayImageAnalysis(analysisData, saveToHistoryFlag = true) {
    console.log('Displaying image analysis:', analysisData);
    const { prompts, fileName } = analysisData;
    
    if (!prompts) {
        console.error('No prompts found in analysis data');
        return;
    }

    // Display the prompts in the Generated tab
    displayPrompts(prompts);

    // Save to localStorage for persistence
    localStorage.setItem('generatedPrompts', prompts);

    // Save to history if flag is true
    if (saveToHistoryFlag) {
        const historyEntry = {
            type: 'image-analysis',
            description: `Image to Prompt: ${fileName}`,
            prompts: prompts,
            timestamp: Date.now()
        };

        // Get existing history
        let history = localStorage.getItem('promptHistory');
        history = history ? JSON.parse(history) : [];

        // Add new entry at the beginning
        history.unshift(historyEntry);

        // Get user's premium status to determine history limit
        chrome.storage.local.get(['isPremiumUser'], (result) => {
            const isPremiumUser = result.isPremiumUser || false;
            const historyLimit = isPremiumUser ? 100 : 5;

            // Trim history if needed
            if (history.length > historyLimit) {
                history = history.slice(0, historyLimit);
            }

            // Save updated history
            localStorage.setItem('promptHistory', JSON.stringify(history));
        });
    }

    // Switch to the generated tab
    switchTab('generated');
}

function createSnowflakes() {
    const container = document.createElement('div');
    container.className = 'snowfall-container';
    
    // Create 50 snowflakes
    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        // Randomize initial position and animation
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.animationDuration = `${Math.random() * 5 + 10}s`; // Between 10-15s
        snowflake.style.animationDelay = `${Math.random() * 5}s`; // Stagger start times
        
        container.appendChild(snowflake);
    }
    
    return container;
}
/**
 * Kept as a function because it is awaited at a dozen call sites, but the work
 * now belongs to pcAuth: Supabase rotates refresh tokens, so refreshing has to
 * be single-flight, and the old endpoint this called is gone.
 *
 * A failed refresh means the session is over. pcAuth has already cleared it by
 * the time this returns; the UI is brought into line here.
 */
async function refreshToken() {
    const token = await pcAuth.ensureFreshToken();
    if (token) return;

    if (isLoggedIn) {
        isLoggedIn = false;
        isPremiumUser = false;
        updateUIForLoginStatus();
    }
}
    
    const modelOptions = [
    { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'dalle', text: 'DALL·E', preview: 'dalle-preview.png' },
    { value: 'midjourney', text: 'Midjourney', preview: 'midjourney-preview.png' },
    { value: 'stable_diffusion', text: 'Stable Diffusion', preview: 'stable-diffusion-preview.png' },
    { value: 'flux', text: 'Flux', preview: 'flux-preview.png' }
];
 const videoInput = document.getElementById('videoPromptInput');
    const videoClearButton = document.getElementById('videoClearButton');

   if (videoInput && videoClearButton) {
    videoInput.addEventListener('input', function() {
        videoClearButton.style.display = this.value.length > 0 ? 'block' : 'none';
    });

    videoClearButton.addEventListener('click', function() {
        videoInput.value = '';
        this.style.display = 'none';
        videoInput.focus();
    });
}
function resetInteractiveElements() {
    // Close all active dropdowns
    document.querySelectorAll('.select-options.active').forEach(dropdown => {
        dropdown.classList.remove('active');
        dropdown.style.opacity = '';
        dropdown.style.transform = '';
        dropdown.style.zIndex = '';
    });

    // Close any other popups, modal overlays, or active states
    // For example, if you have a popup with class .popup.active:
    document.querySelectorAll('.popup.active').forEach(popup => {
        popup.classList.remove('active');
        popup.style.opacity = '';
        popup.style.transform = '';
        popup.style.zIndex = '';
    });

    // Similarly handle overlays or toasts if present:
    document.querySelectorAll('.overlay.active').forEach(overlay => {
        overlay.classList.remove('active');
        overlay.style.opacity = '';
        overlay.style.zIndex = '';
    });
}

function updateUIForMode(isVideoMode) {
    const generateBtn = document.getElementById('generatePrompt');
    const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
    const advancedOptions = document.getElementById('advancedOptions');

    // Reset common UI states first
    resetInteractiveElements();

    // Get all interactive elements within advancedOptions
    const interactiveElements = advancedOptions.querySelectorAll('select, input, button, [tabindex]');

    if (isVideoMode) {
        generateBtn.textContent = 'Generate Video Prompts';

        // Show video inputs, hide image inputs
        document.querySelectorAll('.video-input').forEach(el => {
            el.style.display = 'block';
        });
        document.querySelectorAll('.image-input').forEach(el => {
            el.style.display = 'none';
        });

        // Hide and disable advanced options in video mode
        if (advancedOptionsBtn) advancedOptionsBtn.style.display = 'none';
        if (advancedOptions) {
            advancedOptions.style.visibility = 'hidden'; // Use visibility instead of display
            advancedOptions.style.opacity = '0';
            advancedOptions.style.maxHeight = '0';
        }

        // Disable interactive elements
        interactiveElements.forEach(el => {
            el.disabled = true;
            el.setAttribute('tabindex', '-1'); // Prevent tabbing to disabled elements
        });
    } else {
        generateBtn.textContent = 'Generate Prompts';

        // Show image inputs, hide video inputs
        document.querySelectorAll('.video-input').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.image-input').forEach(el => {
            el.style.display = 'block';
        });

        // Show and enable advanced options in image mode
        if (advancedOptionsBtn) advancedOptionsBtn.style.display = 'flex';
        if (advancedOptions) {
            advancedOptions.style.visibility = ''; // Reset visibility
            advancedOptions.style.opacity = '';
            advancedOptions.style.maxHeight = '';
        }

        // Enable interactive elements
        interactiveElements.forEach(el => {
            el.disabled = false;
            el.removeAttribute('tabindex');
        });
    }
}
    function setupVideoInputListeners() {
    const videoPromptInput = document.getElementById('videoPromptInput');
    const videoPromptLength = document.getElementById('videoPromptLength');
    
    if (videoPromptInput) {
        videoPromptInput.addEventListener('input', saveVideoSelections);
    }
    
    if (videoPromptLength) {
        videoPromptLength.addEventListener('change', saveVideoSelections);
    }
}
document.getElementById('webAppIcon').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://promptcatalyst.ai' });
});
function setupVideoModeEventListeners() {
    const videoInput = document.getElementById('videoPromptInput');
    const videoClearButton = document.getElementById('videoClearButton');

    if (videoInput && videoClearButton) {
        videoInput.addEventListener('input', function() {
            videoClearButton.style.display = this.value.length > 0 ? 'block' : 'none';
        });

        videoClearButton.addEventListener('click', function() {
            videoInput.value = '';
            this.style.display = 'none';
            videoInput.focus();
        });
    }
    const videoLightingSelect = document.getElementById('videoLightingSelect');
    if (videoLightingSelect) {
        videoLightingSelect.addEventListener('change', saveVideoSelections);
    }
      loadVideoSelections();
     loadVideoLightingSelections();
}

// Handle video prompt generation
function getPromptLengthLabel(value) {
    const numericValue = parseInt(value);
    // Return capitalized values
    switch(numericValue) {
        case 1: return 'Short';
        case 2: return 'Medium';
        case 3: return 'Long';
        default: return 'Medium';
    }
}

// Modified video prompt generation function
async function generateVideoPrompt() {
    if (isGenerating) return;

    try {
        // Convert prompt length value to correct format
        const promptLengthValue = document.getElementById('videoPromptLength')?.value || '2';
        let promptLength;
        switch(promptLengthValue) {
            case '1':
                promptLength = 'short';
                break;
            case '2':
                promptLength = 'medium';
                break;
            case '3':
                promptLength = 'long';
                break;
            default:
                promptLength = 'medium';
        }

        const inputs = {
            description: document.getElementById('videoPromptInput')?.value || '',
            style: document.getElementById('videoStyleSelect')?.value || 'not_specified',
            movement: document.getElementById('videoMovementSelect')?.value || 'not_specified',
            cameraAngle: document.getElementById('videoCameraAngleSelect')?.value || 'not_specified',
            lighting: document.getElementById('videoLightingSelect')?.value || 'not_specified',
            promptLength: promptLength // Use the converted prompt length
        };
        
        setLoading(true, 'Generating video prompts, please wait...');
        switchTab('generated');
        loadingElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const headers = await pcApi.headers();

        // Log the request payload for debugging
        console.log('Sending video prompt request:', inputs);

        const response = await fetch(pcApi.url('/generate-video-prompt'), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(inputs)
        });

        if (await pcApi.isSessionExpired(response)) {
            handleAuthError();
            return;
        }

        const data = await response.json();

        if (pcApi.isTerminal(response, data)) {
            showUpgradePrompt(resultElem);
            return;
        }

        if (response.ok) {
            displayPrompts(data.prompt || 'Failed to generate video prompt');
            savePrompts(data.prompt, false, '', false, true);
        } else {
            handleResponseError(data);
        }

    } catch (error) {
        handleGenerationError(error);
    } finally {
        setLoading(false);
    }
}
// Helper functions for error handling
function handleAuthError() {
    isLoggedIn = false;
    isPremiumUser = false;
    chrome.storage.local.remove(['authToken', 'pcSession', 'isPremiumUser'], () => {
        updateUIForLoginStatus();
    });
    resultElem.textContent = 'Session expired. Please log in again.';
}

/**
 * By the time either of these runs, a credit limit has already been recognised
 * from the code the API sends, so neither goes looking for "limit" in the
 * message. That guess was wrong in both directions: it missed refusals worded
 * differently, and it fired on "Rate limit exceeded" from a busy provider —
 * answering a transient fault with a demand for money.
 */
function handleResponseError(data) {
    resultElem.textContent = pcApi.errorMessage(data);
}

function handleGenerationError(error) {
    console.error('Error generating video prompt:', error);
    resultElem.textContent = 'An error occurred. Please try again.';
}
// Handle video prompt display
function displayVideoPrompt(prompt) {
    const resultElem = document.getElementById('result');
    resultElem.innerHTML = '';
    
    const promptBox = createVideoPromptBox(prompt);
    resultElem.appendChild(promptBox);
}

function createVideoPromptBox(prompt) {
    const box = document.createElement('div');
    box.className = 'prompt-box video-prompt';
    
    // Create prompt text
    const promptText = document.createElement('p');
    promptText.className = 'prompt-text';
    promptText.textContent = prompt;
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Add Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<img src="icons/copy-icon.svg" alt="Copy"><span>Copy</span>';
    copyBtn.addEventListener('click', () => copyToClipboard(prompt, copyBtn));
    
    buttonContainer.appendChild(copyBtn);
    box.appendChild(promptText);
    box.appendChild(buttonContainer);
    
    return box;
}
// Add this function to handle model dropdown rebuilding
function rebuildModelDropdown(isPremiumUser) {
    const modelSelect = document.getElementById('modelSelect');
    const currentValue = modelSelect.value;  // Store current selection
    modelSelect.innerHTML = '';  // Clear current options

    // Add all model options
    modelOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        opt.setAttribute('data-preview', option.preview);
        modelSelect.appendChild(opt);
    });

    // Try to restore the previous selection if it's still valid
    if (currentValue) {
        const isValidOption = Array.from(modelSelect.options)
            .some(option => option.value === currentValue && !option.disabled);
        
        if (isValidOption) {
            modelSelect.value = currentValue;
        } else {
            modelSelect.selectedIndex = 0;  // Default to first option if previous selection is invalid
            localStorage.setItem('model', modelSelect.value);
        }
    } else {
        modelSelect.selectedIndex = 0;  // Default to first option if no previous selection
        localStorage.setItem('model', modelSelect.value);
    }
}
    
const headerContainer = document.querySelector('.header .title-container');
if (!headerContainer) {
    console.error('Header container not found');
} else {
    // Create theme button
    const themeButton = document.createElement('button');
    themeButton.className = 'theme-button';
    themeButton.innerHTML = `
        <img src="${chrome.runtime.getURL('icons/palette.svg')}" 
             alt="Theme" 
             class="theme-icon">
    `;
    
    // Create video mode button
    const videoButton = document.createElement('button');
    videoButton.className = 'mode-toggle';
    videoButton.innerHTML = `
        <img src="${chrome.runtime.getURL('icons/video-icon.svg')}" 
             alt="Video Mode">
    `;

    // Create documentation button
    const docsButton = document.createElement('button');
    docsButton.className = 'docs-button';
    docsButton.title = 'Documentation';
    docsButton.innerHTML = `
        <img src="${chrome.runtime.getURL('icons/docs-icon.svg')}" 
             alt="Documentation">
    `;

    // Add click handler for documentation button
    docsButton.addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('docs.html'),
            active: true
        });
    });

    // Create container for all buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mode-buttons';
    buttonContainer.appendChild(videoButton);
    buttonContainer.appendChild(themeButton);
    buttonContainer.appendChild(docsButton);

    // Insert the button container before the first child
    headerContainer.insertBefore(buttonContainer, headerContainer.firstChild);

    // Add video mode toggle functionality
document.querySelector('.mode-toggle').addEventListener('click', function() {
    const container = document.querySelector('.container');
    const modeToggle = this;
    const wasVideoMode = modeToggle.classList.contains('active');
    const isVideoMode = !wasVideoMode;

    // Remove premium check - allow all users to toggle video mode
    resetInteractiveElements();
    modeToggle.classList.toggle('active', isVideoMode);

    container.style.transition = 'transform 0.3s ease-in-out, opacity 0.15s ease-in-out';
    container.style.opacity = '0';
    container.style.transform = isVideoMode ? 'translateX(50px)' : 'translateX(-50px)';

    setTimeout(() => {
        container.classList.toggle('video-mode', isVideoMode);
        updateUIForMode(isVideoMode);
        localStorage.setItem('videoMode', isVideoMode);
        container.style.opacity = '1';
        container.style.transform = 'translateX(0)';
    }, 150);

    setTimeout(() => {
        container.style.transition = '';
    }, 700);
});

    // Add theme button click handler here, inside the main block
    themeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const themePanel = document.querySelector('.theme-panel');
        if (themePanel) {
            themePanel.classList.toggle('active');
            console.log('Theme button clicked, panel toggled');
        }
    });

    // Load saved mode on startup
    const savedVideoMode = localStorage.getItem('videoMode') === 'true';
    if (savedVideoMode) {
        const container = document.querySelector('.container');
        const modeToggle = document.querySelector('.mode-toggle');
        
        container.classList.add('video-mode');
        modeToggle.classList.add('active');
        updateUIForMode(true);
    }
}
    // Create theme panel

const themePanel = document.createElement('div');
themePanel.className = 'theme-panel';
themePanel.innerHTML = `
    <div class="theme-panel-header">
        <h3>Choose Theme</h3>
        <button class="theme-close">×</button>
    </div>
    <div class="theme-options"></div>
    <div class="custom-background-option">
        <button class="custom-bg-btn">
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
            Custom Background Image
        </button>
    </div>
`;
document.body.appendChild(themePanel);

    // Add theme options
const themeOptions = themePanel.querySelector('.theme-options');
// Inside the theme panel creation code
// Inside the theme panel creation code
Object.entries(themes).forEach(([themeId, theme]) => {
    if (theme.backgroundType === 'color') {
        const themeOption = document.createElement('div');
        themeOption.className = 'theme-option';
        themeOption.innerHTML = `
            <div class="theme-preview" style="background: ${theme.colors.background};">
                <div class="preview-left" style="
                    background: ${theme.colors.primary};
                    width: 35%;
                    height: 100%;
                    border-radius: 4px;
                "></div>
                <div class="preview-right" style="
                    background: ${theme.colors.cardBackground};
                    width: 60%;
                    height: 100%;
                    border-radius: 4px;
                "></div>
            </div>
            <span>${theme.name}</span>`;
        
        themeOption.addEventListener('click', () => {
            applyTheme(themeId);
            themePanel.classList.remove('active');
        });
        themeOptions.appendChild(themeOption);
    }
});

function getVideoInputs() {
    const videoPromptInput = document.getElementById('videoPromptInput');
    const videoStyleSelect = document.getElementById('videoStyleSelect');
    const videoMovementSelect = document.getElementById('videoMovementSelect');
    const videoCameraAngleSelect = document.getElementById('videoCameraAngleSelect');
    const videoPromptLength = document.getElementById('videoPromptLength');

    // Get values and add error checking
    const description = videoPromptInput?.value?.trim();
    if (!description) {
        throw new Error('Please enter a video description');
    }

    return {
        description: description,
        style: videoStyleSelect?.value || 'not_specified',
        movement: videoMovementSelect?.value || 'not_specified',
        cameraAngle: videoCameraAngleSelect?.value || 'not_specified',
        promptLength: videoPromptLength ? getPromptLengthLabel(videoPromptLength.value) : 'medium'
    };
}

function isVideoMode() {
    return document.querySelector('.container').classList.contains('video-mode');
}

     const customBgBtn = themePanel.querySelector('.custom-bg-btn');
customBgBtn.addEventListener('click', () => {
    handleCustomBackground(); // This now relies on the function below
    themePanel.classList.remove('active');
});

// Toggle panel visibility

    // Close panel when clicking close button
    const closeButton = themePanel.querySelector('.theme-close');
closeButton.addEventListener('click', () => {
    themePanel.classList.remove('active');
});

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!themePanel.contains(e.target) && !themeButton.contains(e.target)) {
            themePanel.classList.remove('active');
        }
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('selectedTheme');
    if (!savedTheme) {
        localStorage.setItem('selectedTheme', 'default');
        applyTheme('default');
    } else {
        applyTheme(savedTheme);
    }
 const savedCustomBg = localStorage.getItem('customBackgroundImage');
    if (savedCustomBg) {
        themes.customBackground.backgroundImage = savedCustomBg;
    }

if (savedCustomBg && savedTheme === 'customBackground') {
    themes.customBackground.backgroundImage = savedCustomBg;
    applyTheme('customBackground');
} else if (savedTheme && themes[savedTheme]) {
    console.log('Loading saved theme:', savedTheme);
    applyTheme(savedTheme);
}

// If the icon fails to load, use inline SVG
    
    
// Add chevron toggle functionality for Midjourney parameters
const midjourneyParamsContainer = document.getElementById('midjourneyParams');
const paramsGroups = midjourneyParamsContainer.querySelectorAll('.param-group');
document.querySelectorAll('.param-group').forEach(group => {
    const header = group.querySelector('h4');
    if (header && header.textContent === 'Model Version & Quality') {
        const buttonsContainer = group.querySelector('.param-buttons');
        if (buttonsContainer) {
            // Create new quality 2 button that only shows when V6.1 is selected
            const quality2Btn = document.createElement('button');
            quality2Btn.className = 'param-btn';
            quality2Btn.setAttribute('data-param', '--q 2');
            quality2Btn.textContent = 'Quality 2';
            quality2Btn.style.display = 'none'; // Hidden by default
            buttonsContainer.appendChild(quality2Btn);

            // Add click handler for version 6.1 button
            const v61Btn = buttonsContainer.querySelector('[data-param="--v 6.1"]');
            if (v61Btn) {
                v61Btn.addEventListener('click', function() {
                    // Show quality 2 option when V6.1 is selected
                    quality2Btn.style.display = 'inline-block';
                });

                // Hide quality 2 when other versions are selected
                buttonsContainer.querySelectorAll('[data-param^="--v"]').forEach(btn => {
                    if (btn !== v61Btn) {
                        btn.addEventListener('click', function() {
                            quality2Btn.style.display = 'none';
                            if (quality2Btn.classList.contains('active')) {
                                quality2Btn.classList.remove('active');
                                activeParams.delete('--q 2');
                                updatePromptParameters();
                            }
                        });
                    }
                });
            }
        }
    }
});

// Add chevron and header to each param group
paramsGroups.forEach(group => {
    const header = group.querySelector('h4');
    if (header) {
        // Create a wrapper div for the header and chevron
        const headerWrapper = document.createElement('div');
        headerWrapper.className = 'param-group-header';
        
        // Move the existing header into the wrapper
        header.parentNode.insertBefore(headerWrapper, header);
        headerWrapper.appendChild(header);
        
        // Add chevron icon
        const chevron = document.createElement('img');
        chevron.src = 'icons/chevron-down.svg';
        chevron.className = 'param-chevron';
        chevron.alt = 'Toggle';
        headerWrapper.appendChild(chevron);

        // Get the content that needs to be collapsible
        const content = document.createElement('div');
        content.className = 'param-group-content';
        
        // Move all elements after the header into the content div
        while (group.children[1]) {
            content.appendChild(group.children[1]);
        }
        group.appendChild(content);

        // Add click handler for toggle
        headerWrapper.addEventListener('click', () => {
            chevron.classList.toggle('active');
            content.classList.toggle('collapsed');
            
            // Save state to localStorage
            const paramStates = JSON.parse(localStorage.getItem('paramGroupStates') || '{}');
            paramStates[header.textContent] = !content.classList.contains('collapsed');
            localStorage.setItem('paramGroupStates', JSON.stringify(paramStates));
        });

        // Initialize state from localStorage
        const paramStates = JSON.parse(localStorage.getItem('paramGroupStates') || '{}');
        const isExpanded = paramStates[header.textContent] !== false; // Default to expanded
        
        if (!isExpanded) {
            chevron.classList.add('active');
            content.classList.add('collapsed');
        }
    }
});
const uploadButton = document.querySelector('.upload-button');
uploadButton.addEventListener('click', function () {
  chrome.tabs.create({
    url: chrome.runtime.getURL('upload.html'),
    active: true,
  });
});
chrome.storage.local.get(['authToken'], (result) => {
    if (result.authToken) {
        startCreditUpdates();
    }
});
function startTokenRefreshInterval() {
    // Only start the interval if the user is logged in
    chrome.storage.local.get(['authToken'], (result) => {
        if (result.authToken) {
            // Refresh token every 50 minutes for logged-in users
            setInterval(refreshToken, 3000000);
        }
    });
}
let isGenerating = false;
document.addEventListener('keydown', handleEnterKey);
      const userStatus = document.getElementById('userStatus');
    const loginIcon = document.getElementById('loginIcon');
    const logoutIcon = document.getElementById('logoutIcon');
 
const profilePopup = document.getElementById('profilePopup');
const profileClose = document.querySelector('.profile-close');
const saveUsernameBtn = document.getElementById('saveUsername');
const usernameInput = document.getElementById('usernameInput');

    const loginForm = document.getElementById('loginForm');
    const submitLogin = document.getElementById('submitLogin');
    const cancelLogin = document.getElementById('cancelLogin');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginMessage = document.getElementById('loginMessage');
    const googleSignInBtn = document.getElementById('googleSignIn');
    const mainContent = document.getElementById('mainContent');
    const promptLengthSlider = document.getElementById('promptLength');
    const creativitySlider = document.getElementById('creativityValue');
    const creativityValue = document.querySelector('.slider-value');
    // Help popup functionality
// Help popup functionality
const helpIcon = document.querySelector('.help-icon');
const helpPopup = document.getElementById('helpPopup');
const helpClose = document.querySelector('.help-close');

helpIcon.addEventListener('click', () => {
    helpPopup.style.display = 'flex';
    setTimeout(() => {
        helpPopup.classList.add('active');
    }, 10);
});

helpClose.addEventListener('click', () => {
    helpPopup.classList.remove('active');
    setTimeout(() => {
        helpPopup.style.display = 'none';
    }, 300);
});

// Close popup when clicking outside
helpPopup.addEventListener('click', (e) => {
    if (e.target === helpPopup) {
        helpClose.click();
    }
});
    // Initialize variables
    let isLoggedIn = false;
    let isPremiumUser = false;
     let username = ''; // To store the username

    // Existing element references
    const generateBtn = document.getElementById('generatePrompt');
    const randomBtn = document.getElementById('randomPrompt');
    const resultElem = document.getElementById('result');
    const loadingElem = document.getElementById('loading');

    const styleSelect = document.getElementById('styleSelect');
    const lightingSelect = document.getElementById('lightingSelect');
    const cameraAngleSelect = document.getElementById('cameraAngleSelect');
     const historySearch = document.getElementById('historySearch');
    const clearHistorySearch = document.getElementById('clearHistorySearch');
    const historyContent = document.getElementById('historyContent');

    let searchTimeout;

    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    function filterHistory(searchTerm) {
    if (!historyCache) {
        const history = localStorage.getItem('promptHistory');
        if (history) {
            historyCache = JSON.parse(history);
        }
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    if (!normalizedSearchTerm) {
        renderHistory(historyCache);
        return;
    }

    const filteredHistory = historyCache.filter(entry => {
        const searchableContent = [
            entry.description,
            entry.prompts,
            entry.model,
            entry.style,
            entry.lighting,
            entry.cameraAngle,
            entry.purpose
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableContent.includes(normalizedSearchTerm);
    });

    renderHistory(filteredHistory, normalizedSearchTerm);
}


function renderHistory(historyData, searchTerm = '') {
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;

    const fragment = document.createDocumentFragment();
    const savedPreviews = JSON.parse(localStorage.getItem('previews') || '{}');

    if (historyData.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results-message';
        noResults.textContent = searchTerm ? 
            `No results found for "${searchTerm}"` : 
            'No history available';
        fragment.appendChild(noResults);
    } else {
        historyData.forEach(historyEntry => {
            const detailsBox = document.createElement('div');
            detailsBox.classList.add('history-details');

            let detailsHTML = '';
            
            if (historyEntry.type === 'variation') {
                const highlightedPrompt = searchTerm ? 
                    highlightText(historyEntry.description.replace('Variations: ', ''), searchTerm) : 
                    historyEntry.description.replace('Variations: ', '');
                detailsHTML = `<p><strong>Variations:</strong> <span class="original-prompt">${highlightedPrompt}</span></p>`;
            } else if (historyEntry.type === 'image-analysis') {
                const [label, filename] = historyEntry.description.split(': ');
                const highlightedFilename = searchTerm ? highlightText(filename, searchTerm) : filename;
                detailsHTML = `<p><strong>${label}:</strong> ${highlightedFilename}</p>`;
            } else {
                const details = {
                    Description: historyEntry.description,
                    'AI Model': formatLabel(historyEntry.model),
                    Style: formatLabel(historyEntry.style),
                    Lighting: formatLabel(historyEntry.lighting),
                    'Camera Angle': formatLabel(historyEntry.cameraAngle),
                    Purpose: formatLabel(historyEntry.purpose),
                    'Creativity Value': historyEntry.creativity
                };

                detailsHTML = Object.entries(details)
                    .map(([key, value]) => {
                        const displayValue = searchTerm ? highlightText(value, searchTerm) : value;
                        return `<p><strong>${key}:</strong> ${displayValue}</p>`;
                    })
                    .join('');
            }

            detailsBox.innerHTML = detailsHTML;

            // Process individual prompts
            const promptsContainer = document.createElement('div');
            const individualPrompts = historyEntry.prompts.split('\n');
            
            individualPrompts.forEach(prompt => {
                const trimmedPrompt = prompt.trim();
                if (trimmedPrompt) {
                    // Create prompt box with highlighted search terms if any
                    const promptBox = createThemeAwarePromptBox(
                        searchTerm ? highlightText(trimmedPrompt, searchTerm) : trimmedPrompt,
                        true
                    );
                    
                    if (promptBox) {
                        // Check for existing preview
                        const cleanPrompt = cleanPromptOfParameters(trimmedPrompt);
                        const previewUrl = savedPreviews[cleanPrompt];
                        
                        if (previewUrl && !historyEntry.isVideo) {
                            const imageContainer = document.createElement('div');
                            imageContainer.classList.add('image-container');
                            const img = document.createElement('img');
                            img.src = previewUrl;
                            img.alt = 'Preview image';
                            img.classList.add('preview-image-prompt');
                            imageContainer.appendChild(img);
                            promptBox.appendChild(imageContainer);

                            // Update preview button state
                            const previewBtn = promptBox.querySelector('.preview-btn');
                            if (previewBtn) {
                                previewBtn.disabled = true;
                                previewBtn.classList.add('disabled');
                            }
                        }
                        
                        promptsContainer.appendChild(promptBox);
                    }
                }
            });

            detailsBox.appendChild(promptsContainer);
            fragment.appendChild(detailsBox);
        });
    }

    // Single DOM update
    historyContent.innerHTML = '';
    historyContent.appendChild(fragment);

    // Apply current theme
    const currentTheme = themes[localStorage.getItem('selectedTheme') || 'default'];
    if (currentTheme) {
        const promptBoxes = historyContent.querySelectorAll('.prompt-box');
        promptBoxes.forEach(box => {
            box.style.backgroundColor = currentTheme.colors.cardBackground;
            box.style.borderColor = currentTheme.colors.border;

            // Update button colors
            const buttons = box.querySelectorAll('button');
            buttons.forEach(button => {
                if (button.classList.contains('preview-btn')) {
                    button.style.backgroundColor = currentTheme.colors.previewButtonBackground;
                    if (button.classList.contains('disabled')) {
                        button.style.backgroundColor = currentTheme.colors.previewButtonDisabled;
                    }
                } else if (!button.classList.contains('quick-add-btn')) {
                    button.style.backgroundColor = button.classList.contains('disabled') ? 
                        currentTheme.colors.secondary : 
                        currentTheme.colors.primary;
                }
            });
        });
    }
}

    // Add event listeners for search functionality
    historySearch.addEventListener('input', function() {
        const searchTerm = this.value;
        clearHistorySearch.style.display = searchTerm ? 'block' : 'none';

        // Clear any existing timeout
        clearTimeout(searchTimeout);

        // Set new timeout to avoid too many filter operations while typing
        searchTimeout = setTimeout(() => {
            filterHistory(searchTerm);
        }, 300);
    });

    clearHistorySearch.addEventListener('click', function() {
        historySearch.value = '';
        this.style.display = 'none';
        loadHistory(); // Reset to show all history
        historySearch.focus();
    });

    // Also clear search when switching tabs
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', function() {
            if (historySearch) {
                historySearch.value = '';
                clearHistorySearch.style.display = 'none';
            }
        });
    });
    const searchContainer = document.querySelector('.history-search-container');
    if (searchContainer) {
        const deleteAllButton = document.createElement('button');
        deleteAllButton.id = 'deleteAllHistory';
        deleteAllButton.className = 'delete-history-btn';
        deleteAllButton.innerHTML = `
            <img src="icons/trash.svg" alt="Delete All">
            
        `;
        searchContainer.appendChild(deleteAllButton);
    }

    

// Add confirmation dialog HTML
const confirmDialog = document.createElement('div');
confirmDialog.className = 'delete-confirm-dialog';
confirmDialog.innerHTML = `
    <div class="delete-confirm-content">
        <h3>Clear History</h3>
        <p>Are you sure you want to delete all history? This action cannot be undone.</p>
        <div class="delete-confirm-buttons">
            <button class="delete-confirm-cancel">Cancel</button>
            <button class="delete-confirm-delete">Delete All</button>
        </div>
    </div>
`;
document.body.appendChild(confirmDialog);

// Add event listener for delete all button
document.getElementById('deleteAllHistory')?.addEventListener('click', () => {
    confirmDialog.classList.add('active');
});

// Add event listeners for confirmation dialog
const cancelBtn = confirmDialog.querySelector('.delete-confirm-cancel');
const deleteBtn = confirmDialog.querySelector('.delete-confirm-delete');

cancelBtn?.addEventListener('click', () => {
    confirmDialog.classList.remove('active');
});

deleteBtn?.addEventListener('click', () => {
    // Clear history from localStorage
    localStorage.removeItem('promptHistory');
    
    // Clear the history display
    const historyContent = document.getElementById('historyContent');
    if (historyContent) {
        historyContent.innerHTML = `
            <div class="collections-empty-state">
                <img src="icons/history.svg" alt="Empty History">
                <h3>No History</h3>
                <p>Your prompt history will appear here</p>
            </div>
        `;
    }
    
    // Reset history cache
    historyCache = null;
    
    // Close the confirmation dialog
    confirmDialog.classList.remove('active');
    
    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'collections-toast success';
    toast.textContent = 'History cleared successfully';
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    });
});

// Close dialog when clicking outside
confirmDialog.addEventListener('click', (e) => {
    if (e.target === confirmDialog) {
        confirmDialog.classList.remove('active');
    }
});

const midjourneyParams = document.getElementById('midjourneyParams');
const modelSelect = document.getElementById('modelSelect');
const modelInfoDiv = document.createElement('div');
modelInfoDiv.className = 'model-info';
modelInfoDiv.innerHTML = `
    <p>The prompting instructions are based on the official <a href="https://stability.ai/learning-hub/stable-diffusion-3-5-prompt-guide" target="_blank" rel="noopener noreferrer">Stable Diffusion 3.5 prompting guide</a>.</p> 
    
`;
let activeParams = new Set();
modelSelect.addEventListener('change', function() {
    // Existing Midjourney params logic
    const midjourneyParams = document.getElementById('midjourneyParams');
    midjourneyParams.style.display = this.value === 'midjourney' ? 'block' : 'none';

    // Add SD info logic
    if (this.value === 'stable_diffusion') {
        modelInfoDiv.classList.add('show');
    } else {
        modelInfoDiv.classList.remove('show');
    }

    // Clear active parameters if switching away from Midjourney
    if (this.value !== 'midjourney') {
        activeParams.clear();
    }
    
    // Get all prompt boxes in the Generated Prompts tab
    const promptBoxes = document.getElementById('generatedPrompts')
        .querySelectorAll('.prompt-box');
    
    promptBoxes.forEach(box => {
        const promptText = box.querySelector('.prompt-text');
        if (promptText) {
            if (this.value === 'midjourney') {
                // If switching to Midjourney, add parameter handling
                promptText.innerHTML = addParamsToNewPrompt(cleanPromptOfParameters(promptText.textContent));
                // Add parameter click handler
                promptText.removeEventListener('click', handleParamClick);
                promptText.addEventListener('click', handleParamClick);
            } else {
                // If switching away from Midjourney, remove all parameters
                promptText.textContent = cleanPromptOfParameters(promptText.textContent);
                // Remove parameter click handler
                promptText.removeEventListener('click', handleParamClick);
            }
        }
    });
    
    // Save the current state
    saveMidjourneyParams();
    saveSelections();
});
modelSelect.parentNode.insertBefore(modelInfoDiv, modelSelect.nextSibling);
// Initialize visibility based on current selection
if (modelSelect.value === 'stable_diffusion') {
    modelInfoDiv.classList.add('show');
}
// Initialize visibility based on current selection
midjourneyParams.style.display = modelSelect.value === 'midjourney' ? 'block' : 'none';

// Handle common parameter buttons
document.querySelectorAll('.param-btn').forEach(btn => {
    if (!btn.id) { // Only handle non-special buttons here
        const param = btn.getAttribute('data-param');
        btn.addEventListener('click', () => handleParameterButtonClick(btn, param));
    }
});

// Handle aspect ratio
const arButton = document.getElementById('arButton');
const arWidth = document.getElementById('arWidth');
const arHeight = document.getElementById('arHeight');

arButton.addEventListener('click', function() {
    const param = `--ar ${arWidth.value}:${arHeight.value}`;
    if (this.classList.contains('active')) {
        this.classList.remove('active');
        activeParams.delete(param);
    } else {
        // Remove any existing aspect ratio parameter
        activeParams.forEach(p => {
            if (p.startsWith('--ar')) {
                activeParams.delete(p);
            }
        });
        this.classList.add('active');
        activeParams.add(param);
    }
    updatePromptParameters();
});


// Handle style mix
const styleMixButton = document.getElementById('styleMixButton');
const styleMix = document.getElementById('styleMix');

if (styleMixButton && styleMix) {
    styleMixButton.addEventListener('click', function() {
        const param = `--s ${styleMix.value}`;
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            activeParams.delete(param);
        } else {
            // Remove any existing style parameters first
            document.querySelectorAll('.param-btn[data-param^="--s "]').forEach(btn => {
                btn.classList.remove('active');
                const btnParam = btn.getAttribute('data-param');
                if (btnParam) {
                    activeParams.delete(btnParam);
                }
            });
            
            // Deactivate the style mix if another style is selected
            activeParams.forEach(p => {
                if (p.startsWith('--s ')) {
                    activeParams.delete(p);
                }
            });
            
            this.classList.add('active');
            activeParams.add(param);
        }
        updatePromptParameters();
        saveMidjourneyParams();
    });
}

// Handle seed
const seedButton = document.getElementById('seedButton');
const seedValue = document.getElementById('seedValue');
seedButton.classList.toggle('disabled', !seedValue.value.trim());
seedButton.disabled = !seedValue.value.trim();
seedValue.addEventListener('input', function() {
    const hasValue = this.value.trim() !== '';
    
    // Update button state
    seedButton.classList.toggle('disabled', !hasValue);
    seedButton.disabled = !hasValue;
    
    // If the button is active but there's no value, deactivate it
    if (!hasValue && seedButton.classList.contains('active')) {
        seedButton.classList.remove('active');
        // Remove any existing seed parameter
        activeParams.forEach(p => {
            if (p.startsWith('--seed')) {
                activeParams.delete(p);
            }
        });
        updatePromptParameters();
        saveMidjourneyParams();
    }
});  
seedButton.addEventListener('click', function() {
    if (!seedValue.value.trim()) {
        return; // Do nothing if there's no value
    }
    
    const param = `--seed ${seedValue.value}`;
    if (this.classList.contains('active')) {
        this.classList.remove('active');
        activeParams.delete(param);
    } else {
        // Remove any existing seed parameter
        activeParams.forEach(p => {
            if (p.startsWith('--seed')) {
                activeParams.delete(p);
            }
        });
        this.classList.add('active');
        activeParams.add(param);
    }
    updatePromptParameters();
    saveMidjourneyParams();
});
// Function to update parameters in prompt
function updatePromptParameters() {
    const promptBoxes = document.querySelectorAll('.prompt-box');
    const modelSelect = document.getElementById('modelSelect');

    if (modelSelect.value === 'midjourney') {
        promptBoxes.forEach(box => {
            const promptText = box.querySelector('.prompt-text');
            if (promptText) {
                // Clean the prompt of existing parameters
                let text = cleanPromptOfParameters(promptText.textContent);
                
                // Add current parameters with styling
                promptText.innerHTML = addParamsToNewPrompt(text);
                
                // Remove existing click handlers
                promptText.removeEventListener('click', handleParamClick);
                // Add new click handler
                promptText.addEventListener('click', handleParamClick);
            }
        });
    }
}

function isValidParameter(param) {
    // Add validation for Midjourney parameter format
    return /^--[a-zA-Z]+(?::\d+(?:\.\d+)?)?(?:\s+[\d.:]+)*$/.test(param);
}
function toggleParameter(param, button) {
    if (!isValidParameter(param)) {
        console.warn('Invalid parameter format:', param);
        return;
    }

    // Special handling for style parameters (--s)
    if (param.startsWith('--s ')) {
        // Remove any existing style parameters
        activeParams.forEach(p => {
            if (p.startsWith('--s ')) {
                const existingButton = document.querySelector(`[data-param="${p}"]`);
                if (existingButton) {
                    existingButton.classList.remove('active');
                }
                activeParams.delete(p);
            }
        });

        // Add the new style parameter
        if (!button.classList.contains('active')) {
            button.classList.add('active');
            activeParams.add(param);
        }
    } else {
        // Handle other parameters normally
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            activeParams.delete(param);
        } else {
            // For parameters that should be unique (like --v), remove existing ones
            if (param.startsWith('--v ') || param.startsWith('--q ')) {
                activeParams.forEach(p => {
                    if (p.startsWith(param.split(' ')[0])) {
                        const existingButton = document.querySelector(`[data-param="${p}"]`);
                        if (existingButton) {
                            existingButton.classList.remove('active');
                        }
                        activeParams.delete(p);
                    }
                });
            }
            button.classList.add('active');
            activeParams.add(param);
        }
    }

    updatePromptParameters();
    saveMidjourneyParams();
}

// Additional function to add parameters to new prompts
function addParamsToNewPrompt(promptText) {
    if (!promptText) return promptText;
    
    // Clean the prompt first to remove any existing parameters
    let text = cleanPromptOfParameters(promptText);
    
    // Add current parameters if any exist
    if (activeParams.size > 0) {
        const uniqueParams = Array.from(new Set(activeParams));
        
        // Add all parameters as removable spans with proper event binding
        const params = uniqueParams
            .map(param => {
                return `<span class="midjourney-param">${param}<span class="remove" role="button" tabindex="0">×</span></span>`;
            })
            .join(' ');
        
        if (params) {
            text = `${text} ${params}`;
        }
    }
    return text;
}

function handleParamClick(event) {
    const removeButton = event.target.closest('.remove');
    const paramSpan = event.target.closest('.midjourney-param');
    
    if (!removeButton || !paramSpan) return;
    
    // Get the parameter text without the × character
    const paramText = paramSpan.textContent.replace('×', '').trim();
    
    // Handle parameter removal
    handleParameterRemoval(paramText, true);
    updatePromptParameters();
    
    // Stop event propagation to prevent other handlers
    event.stopPropagation();
}
    
  function handleParameterRemoval(param, fromClick = false) {
    // Remove from activeParams
    activeParams.delete(param);
    
    // Find and deactivate corresponding button
    const paramBase = param.split(' ')[0]; // Get the base parameter (e.g., --style from --style 750)
    const buttons = document.querySelectorAll('.param-btn');
    buttons.forEach(btn => {
        const btnParam = btn.getAttribute('data-param');
        if (btnParam && btnParam.startsWith(paramBase)) {
            btn.classList.remove('active');
        }
    });

    // Handle special cases
    switch (paramBase) {
        case '--ar':
            document.getElementById('arButton')?.classList.remove('active');
            if (fromClick) {
                document.getElementById('arWidth').value = '';
                document.getElementById('arHeight').value = '';
            }
            break;
        case '--s':
            document.getElementById('styleMixButton')?.classList.remove('active');
            if (fromClick) {
                document.getElementById('styleMix').value = '';
            }
            break;
        case '--seed':
            document.getElementById('seedButton')?.classList.remove('active');
            if (fromClick) {
                document.getElementById('seedValue').value = '';
            }
            break;
        case '--cw':
            document.getElementById('refStrengthButton')?.classList.remove('active');
            if (fromClick) {
                document.getElementById('refStrength').value = '';
            }
            break;
        case '--no':
            document.getElementById('excludeButton')?.classList.remove('active');
            if (fromClick) {
                document.getElementById('excludeValue').value = '';
            }
            break;
    }

    // Save the updated state
    saveMidjourneyParams();
}

function setupParameterAutoSave() {
    // Add event listeners to all parameter inputs
    ['arWidth', 'arHeight', 'styleMix', 'seedValue', 'refStrength', 'excludeValue'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveMidjourneyParams);
            element.addEventListener('input', saveMidjourneyParams);
        }
    });

    // Add event listeners to all parameter buttons
    document.querySelectorAll('.param-btn').forEach(btn => {
        btn.addEventListener('click', saveMidjourneyParams);
    });

    // Add event listeners to special buttons
    ['arButton', 'styleMixButton', 'seedButton', 'refStrengthButton', 'excludeButton'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', saveMidjourneyParams);
        }
    });

    // Save when model changes
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', saveMidjourneyParams);
    }
}

// Enhanced parameter saving function
function saveMidjourneyParams() {
    const paramValues = {
        arWidth: document.getElementById('arWidth')?.value || '',
        arHeight: document.getElementById('arHeight')?.value || '',
        styleMix: document.getElementById('styleMix')?.value || '',
        seedValue: document.getElementById('seedValue')?.value || '',
        refStrength: document.getElementById('refStrength')?.value || '',
        excludeValue: document.getElementById('excludeValue')?.value || ''
    };

    // Save model selection
    localStorage.setItem('model', document.getElementById('modelSelect')?.value || '');
    
    // Save active parameters
    localStorage.setItem('activeParams', JSON.stringify(Array.from(activeParams)));
    
    // Save parameter values
    localStorage.setItem('paramValues', JSON.stringify(paramValues));

    // Save button states
    const buttonStates = {};
    document.querySelectorAll('.param-btn').forEach(btn => {
        const param = btn.getAttribute('data-param');
        if (param) {
            buttonStates[param] = btn.classList.contains('active');
        }
    });

    // Save special button states including exclude button
    ['arButton', 'styleMixButton', 'seedButton', 'refStrengthButton', 'excludeButton'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            buttonStates[id] = btn.classList.contains('active');
        }
    });

    // Specifically save exclusions state
    const excludeBtn = document.getElementById('excludeButton');
    const excludeInput = document.getElementById('excludeValue');
    if (excludeBtn && excludeInput) {
        buttonStates['exclusions'] = {
            active: excludeBtn.classList.contains('active'),
            value: excludeInput.value
        };
    }

    localStorage.setItem('buttonStates', JSON.stringify(buttonStates));
}


// Function to load model selection and Midjourney parameters
function loadMidjourneyParams() {
    // Clear existing active parameters
    activeParams.clear();

    // Load model selection
    const savedModel = localStorage.getItem('model');
    const modelSelect = document.getElementById('modelSelect');
    const midjourneyParams = document.getElementById('midjourneyParams');
    
    if (savedModel && modelSelect) {
        modelSelect.value = savedModel;
        if (midjourneyParams) {
            midjourneyParams.style.display = savedModel === 'midjourney' ? 'block' : 'none';
        }
    }

    // Load active parameters
    const savedParams = localStorage.getItem('activeParams');
    if (savedParams) {
        const parsedParams = JSON.parse(savedParams);
        parsedParams.forEach(param => activeParams.add(param));
    }

    // Load parameter values
    const savedParamValues = JSON.parse(localStorage.getItem('paramValues'));
    if (savedParamValues) {
        Object.entries(savedParamValues).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });
    }

    // Load button states
    const savedButtonStates = JSON.parse(localStorage.getItem('buttonStates'));
    if (savedButtonStates) {
        // Restore regular parameter button states
        document.querySelectorAll('.param-btn').forEach(btn => {
            const param = btn.getAttribute('data-param');
            if (savedButtonStates[param]) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Restore special button states
        ['arButton', 'styleMixButton', 'seedButton', 'refStrengthButton'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if (savedButtonStates[id]) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        // Specifically restore exclusions state
        if (savedButtonStates.exclusions) {
            const excludeBtn = document.getElementById('excludeButton');
            const excludeInput = document.getElementById('excludeValue');
            
            if (excludeBtn && excludeInput) {
                if (savedButtonStates.exclusions.active) {
                    excludeBtn.classList.add('active');
                    excludeInput.value = savedButtonStates.exclusions.value;
                    
                    // Re-add the exclusion parameter to activeParams if it was active
                    if (savedButtonStates.exclusions.value) {
                        activeParams.add(`--no ${savedButtonStates.exclusions.value}`);
                    }
                }
            }
        }
    }

    // Update any existing prompts with the loaded parameters
    updatePromptParameters();
}
 function cleanPromptTextForStorage(promptText) {
    if (!promptText) return promptText;
    
    return promptText
        // Remove any HTML spans and their contents
        .replace(/<span.*?<\/span>/g, '')
        // Remove any remaining HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove the "raw" prefix if it exists
        .replace(/^raw\s+/, '')
        // Clean up any extra spaces
        .replace(/\s+/g, ' ')
        .trim();
}
                         
function handleParameterButtonClick(button, param) {
    if (!button || !param) return;

    // Special handling for style (--s) parameters
    if (param.startsWith('--s ')) {
        // If the button is already active, deactivate it
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            activeParams.delete(param);
        } else {
            // Deactivate any other style buttons
            document.querySelectorAll('.param-btn[data-param^="--s "]').forEach(btn => {
                btn.classList.remove('active');
                const btnParam = btn.getAttribute('data-param');
                if (btnParam) {
                    activeParams.delete(btnParam);
                }
            });
            // Activate the clicked button
            button.classList.add('active');
            activeParams.add(param);
        }
    }
    // Special handling for version (--v) parameters
    else if (param.startsWith('--v ') || param === '--niji 6') {
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            activeParams.delete(param);
        } else {
            // Deactivate all version buttons and Niji
            document.querySelectorAll('[data-param^="--v"], [data-param="--niji 6"]').forEach(b => {
                b.classList.remove('active');
                const vParam = b.getAttribute('data-param');
                if (vParam) {
                    activeParams.delete(vParam);
                }
            });
            button.classList.add('active');
            activeParams.add(param);

            // If Niji is selected, disable quality 2 option
            if (param === '--niji 6') {
                const quality2Btn = document.querySelector('[data-param="--q 2"]');
                if (quality2Btn) {
                    quality2Btn.style.display = 'none';
                    if (quality2Btn.classList.contains('active')) {
                        quality2Btn.classList.remove('active');
                        activeParams.delete('--q 2');
                    }
                }
            }
        }
    }
    // Handle other parameters normally
    else {
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            activeParams.delete(param);
        } else {
            // If it's a parameter that should be unique (like quality), remove others of same type
            const paramType = param.split(' ')[0]; // Get the parameter type (e.g., --q)
            if (paramType === '--q') {
                document.querySelectorAll(`[data-param^="${paramType}"]`).forEach(b => {
                    b.classList.remove('active');
                    const qParam = b.getAttribute('data-param');
                    if (qParam) {
                        activeParams.delete(qParam);
                    }
                });
            }
            button.classList.add('active');
            activeParams.add(param);
        }
    }
    updatePromptParameters();
    saveMidjourneyParams();
}
function cleanPromptOfParameters(text) {
    if (!text) return text;
    
    // Store any existing --no parameters and their values
    const exclusions = [];
    const exclusionRegex = /--no\s+([^-]\S+)/g;
    let match;
    while ((match = exclusionRegex.exec(text)) !== null) {
        exclusions.push(match[1]);
    }
    
    let cleanedText = text
        // Remove all Midjourney specific parameters with their values
        .replace(/\s*--[a-zA-Z]+(?::\d+(?:\.\d+)?)?(?:\s+[^-]\S+)*\s*/g, ' ')
        // Remove any HTML spans from previous parameters
        .replace(/<span class="midjourney-param">.*?<\/span>/g, '')
        // Remove any leftover × characters
        .replace(/×/g, '')
        // Remove any leftover exclusion terms
        .replace(new RegExp(exclusions.map(term => `\\b${term}\\b`).join('|'), 'g'), '')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        // Clean up multiple commas
        .replace(/,\s*,/g, ',')
        // Remove trailing/leading commas and spaces
        .replace(/^[\s,]+|[\s,]+$/g, '')
        .trim();

    return cleanedText;
}


    const promptInput = document.getElementById('promptInput');
    const clearButton = document.getElementById('clearButton');
  createCustomSelect(styleSelect, 'styles');
    createCustomSelect(lightingSelect, 'lightings');
    createCustomSelect(cameraAngleSelect, 'cameraangles');
    createCustomSelect(purposeSelect, 'purposes');
    const previewBox = document.getElementById('previewBox');
    const previewImage = document.getElementById('previewImage');

    // Tab elements
    const generatedTab = document.getElementById('generatedTab');
    const historyTab = document.getElementById('historyTab');
    const weeklyTab = document.getElementById('weeklyTab');
     const tabsContainer = document.querySelector('.tabs');
   // Advanced Options toggle functionality
const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
const advancedOptions = document.getElementById('advancedOptions');
const chevronIcon = advancedOptionsBtn.querySelector('.chevron-icon');
let isAdvancedOptionsVisible = false;
 const tooltips = document.querySelectorAll('.tooltip');
    const previewImages = {
    style: [
        'previews/styles/realism-preview.png',
        'previews/styles/pixel-art-preview.png',
        'previews/styles/impressionism-preview.png'
    ],
    lighting: [
        'previews/lightings/natural-preview.png',
        'previews/lightings/neon-preview.png',
        'previews/lightings/dramatic-preview.png'
    ],
    cameraAngle: [
        'previews/cameraangles/wide-angle-preview.png',
        'previews/cameraangles/low-angle-preview.png',
        'previews/cameraangles/spiral-preview.png'
    ],
    purpose: [
        'previews/purposes/character-sheet-preview.png',
        'previews/purposes/product-photo-preview.png',
        'previews/purposes/icon-set-preview.png'
    ]
};
  tooltips.forEach(tooltip => {
        const tooltipText = tooltip.querySelector('.tooltip-text');
        const infoIcon = tooltip.querySelector('.info-icon');
        const category = infoIcon.getAttribute('data-category');
        
        // Basic tooltip functionality for all tooltips
        tooltip.addEventListener('mouseenter', () => {
            // Reset styles
            tooltipText.style.removeProperty('right');
            tooltipText.style.removeProperty('left');
            tooltipText.style.removeProperty('transform');
            tooltipText.classList.remove('tooltip-right');
            
            // Get positions
            const iconRect = infoIcon.getBoundingClientRect();
            const containerRect = document.querySelector('.container').getBoundingClientRect();
            
            // Position the tooltip
            const tooltipWidth = category && previewImages[category] ? 300 : 300; // Wider for slideshows
            const spaceToRight = containerRect.right - iconRect.right;
            const spaceToLeft = iconRect.left - containerRect.left;
            
            if (spaceToRight >= tooltipWidth / 2 && spaceToLeft >= tooltipWidth / 2) {
                // Center align if enough space on both sides
                tooltipText.style.left = '50%';
                tooltipText.style.transform = 'translateX(-50%)';
                tooltipText.classList.remove('tooltip-right');
            } else if (spaceToRight >= tooltipWidth) {
                // Align to the left of the icon if enough space to the right
                tooltipText.style.left = '0';
                tooltipText.style.transform = 'translateX(-20px)';
                tooltipText.classList.remove('tooltip-right');
            } else {
                // Show on the left side if not enough space on the right
                tooltipText.style.right = '100%';
                tooltipText.style.transform = 'translateX(-10px)';
                tooltipText.classList.add('tooltip-right');
            }
            
            tooltipText.style.visibility = 'visible';
            tooltipText.style.opacity = '1';
        });

        tooltip.addEventListener('mouseleave', () => {
            tooltipText.style.visibility = 'hidden';
            tooltipText.style.opacity = '0';
        });
        
        // Add slideshow only for categories with preview images
        if (category && previewImages[category]) {
            tooltipText.style.width = '300px'; // Wider tooltip for slideshow
            
            // Create slideshow container
            const slideshow = document.createElement('div');
            slideshow.className = 'tooltip-slideshow';
            
            // Create slides
            previewImages[category].forEach((imgSrc, index) => {
                const slide = document.createElement('div');
                slide.className = `tooltip-slide ${index === 0 ? 'active' : ''}`;
                
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = `${category} preview ${index + 1}`;
                img.loading = 'lazy';
                
                slide.appendChild(img);
                slideshow.appendChild(slide);
            });
            
            // Create navigation dots
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'tooltip-dots';
            
            previewImages[category].forEach((_, index) => {
                const dot = document.createElement('div');
                dot.className = `tooltip-dot ${index === 0 ? 'active' : ''}`;
                dotsContainer.appendChild(dot);
            });
            
            slideshow.appendChild(dotsContainer);
            
            // Insert slideshow before the existing text
            tooltipText.insertBefore(slideshow, tooltipText.firstChild);
            
            let currentSlide = 0;
            let slideInterval;
            
            // Additional slideshow-specific hover handlers
            tooltip.addEventListener('mouseenter', () => {
                // Start automatic slideshow
                slideInterval = setInterval(() => {
                    nextSlide();
                }, 2000);
            });
            
            tooltip.addEventListener('mouseleave', () => {
                clearInterval(slideInterval);
                
                // Reset to first slide
                const slides = slideshow.querySelectorAll('.tooltip-slide');
                const dots = dotsContainer.querySelectorAll('.tooltip-dot');
                
                slides.forEach(slide => slide.classList.remove('active'));
                dots.forEach(dot => dot.classList.remove('active'));
                
                slides[0].classList.add('active');
                dots[0].classList.add('active');
                currentSlide = 0;
            });
            
            function nextSlide() {
                const slides = slideshow.querySelectorAll('.tooltip-slide');
                const dots = dotsContainer.querySelectorAll('.tooltip-dot');
                
                slides[currentSlide].classList.remove('active');
                dots[currentSlide].classList.remove('active');
                
                currentSlide = (currentSlide + 1) % slides.length;
                
                slides[currentSlide].classList.add('active');
                dots[currentSlide].classList.add('active');
            }
        }
    });
advancedOptionsBtn.addEventListener('click', () => {
        isAdvancedOptionsVisible = !isAdvancedOptionsVisible;
        
        if (isAdvancedOptionsVisible) {
            // First make the container visible with initial styles
            advancedOptions.style.display = 'block';
            advancedOptions.style.padding = '15px';
            
            // Force a reflow
            advancedOptions.offsetHeight;
            
            // Then apply the animation styles
            requestAnimationFrame(() => {
                advancedOptions.style.opacity = '1';
                advancedOptions.style.maxHeight = '2000px';
                advancedOptions.style.transform = 'translateY(0)';
                advancedOptions.style.marginBottom = '15px';
            });
        } else {
            // Start closing animation
            advancedOptions.style.opacity = '0';
            advancedOptions.style.maxHeight = '0';
            advancedOptions.style.transform = 'translateY(-10px)';
            advancedOptions.style.marginBottom = '0';
            
            // Wait for animation to complete
            setTimeout(() => {
                // Only proceed if the section is still meant to be closed
                if (!isAdvancedOptionsVisible) {
                    advancedOptions.style.display = 'none';
                    advancedOptions.style.padding = '0';
                }
            }, 400); // Match your CSS transition duration
        }
        
        chevronIcon.classList.toggle('active', isAdvancedOptionsVisible);
        localStorage.setItem('advancedOptionsVisible', isAdvancedOptionsVisible);
    });
      loadMidjourneyParams(); // Load saved parameters
    setupParameterAutoSave(); // Set up auto-save functionality
// Modify the createCustomSelect function to handle "Not Specified" styling
function createCustomSelect(originalSelect, folder) {
    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'select-wrapper';
    
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';

    const trigger = document.createElement('div');
    trigger.className = 'select-trigger';

    const triggerText = document.createElement('span');
    const selectedOption = originalSelect.options[originalSelect.selectedIndex];
    triggerText.textContent = selectedOption.text.replace(' (Premium)', '');

    const previewImg = document.createElement('img');
    previewImg.className = 'preview-thumbnail';
    
    if (selectedOption.value !== 'not_specified') {
        const formattedValue = selectedOption.value.replace(/_/g, '-');
        const previewPath = `../previews/${folder}/${formattedValue}-preview.png`;
        previewImg.src = previewPath;
        previewImg.style.display = 'block';
    } else {
        previewImg.style.display = 'none';
    }
    
    trigger.appendChild(triggerText);
    trigger.appendChild(previewImg);
    customSelect.appendChild(trigger);

    // Shared preview functionality
    const previewBox = document.getElementById('previewBox');
    const previewImage = document.getElementById('previewImage');
    let hoverTimeout;
    let isPreviewVisible = false;

    function showPreview(e, value) {
    if (value === 'not_specified') {
        hidePreview();
        return;
    }
    
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
        if (!isPreviewVisible) {
            const formattedValue = value.replace(/_/g, '-');
            const previewPath = `../previews/${folder}/${formattedValue}-preview.png`;
            previewImage.src = previewPath;
            previewBox.style.display = 'block';
            previewBox.style.opacity = '1';
            previewBox.style.transform = 'scale(1)';
            isPreviewVisible = true;
        }

        // Get needed measurements
        const triggerRect = e.target.closest('.custom-select').getBoundingClientRect();
        const containerRect = document.querySelector('.container').getBoundingClientRect();
        const previewBoxWidth = 150; // Fixed width of preview box
        const previewBoxHeight = 150; // Fixed height of preview box

        // Calculate positions
        let left;
        let top;

        // Position horizontally - always align to the right of the container
        left = containerRect.right - previewBoxWidth - 20; // 20px padding from right edge

        // Position vertically - try to center with the trigger element
        top = triggerRect.top + (triggerRect.height / 2) - (previewBoxHeight / 2);

        // Ensure preview stays within the container's bounds
        const maxTop = containerRect.bottom - previewBoxHeight - 10; // 10px padding from bottom
        const minTop = containerRect.top + 10; // 10px padding from top

        // Adjust vertical position if needed
        if (top > maxTop) {
            top = maxTop;
        }
        if (top < minTop) {
            top = minTop;
        }

        // Apply the calculated position
        previewBox.style.position = 'fixed';
        previewBox.style.top = `${top}px`;
        previewBox.style.left = `${left}px`;
    }, 500);
}
    function hidePreview() {
        clearTimeout(hoverTimeout);
        isPreviewVisible = false;
        previewBox.style.opacity = '0';
        previewBox.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (!isPreviewVisible) {
                previewBox.style.display = 'none';
            }
        }, 300);
    }

    trigger.addEventListener('mouseenter', function(e) {
        if (originalSelect.value !== 'not_specified') {
            showPreview(e, originalSelect.value);
        }
    });
    
    trigger.addEventListener('mouseleave', hidePreview);
    
    trigger.addEventListener('mousemove', function(e) {
        if (originalSelect.value !== 'not_specified') {
            showPreview(e, originalSelect.value);
        }
    });

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'select-options';

    // Get premium status before creating options
    chrome.storage.local.get(['isPremiumUser'], (result) => {
        const isPremiumUser = result.isPremiumUser || false;
        
        Array.from(originalSelect.options).forEach((option) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'select-option';
            
            if (option.value === 'not_specified') {
                optionElement.style.color = '#888';
            }
            
            // Check if it's a premium option
            const isPremiumOption = option.text.includes('(Premium)');
            
            // Only disable if it's a premium option AND user is not premium
            if (isPremiumOption && !isPremiumUser) {
                optionElement.classList.add('disabled');
            }

            const optionText = document.createElement('span');
            let displayText = option.text;
            if (displayText.includes('(Premium)')) {
                displayText = displayText.replace(' (Premium)', '');
                if (!isPremiumUser) {
                    const premiumLabel = document.createElement('span');
                    premiumLabel.className = 'premium-label';
                    premiumLabel.textContent = 'PREMIUM';
                    optionText.textContent = displayText;
                    optionText.appendChild(premiumLabel);
                } else {
                    optionText.textContent = displayText;
                }
            } else {
                optionText.textContent = displayText;
            }

            const optionPreview = document.createElement('img');
            optionPreview.className = 'preview-thumbnail';
            
            if (option.value !== 'not_specified') {
                const formattedValue = option.value.replace(/_/g, '-');
                const previewPath = `../previews/${folder}/${formattedValue}-preview.png`;
                optionPreview.src = previewPath;
                optionPreview.style.display = 'block';
            } else {
                optionPreview.style.display = 'none';
            }
            
            optionElement.appendChild(optionText);
            optionElement.appendChild(optionPreview);

            if (option.value !== 'not_specified') {
                optionElement.addEventListener('mouseenter', (e) => showPreview(e, option.value));
                optionElement.addEventListener('mouseleave', hidePreview);
                optionElement.addEventListener('mousemove', (e) => showPreview(e, option.value));
            }
            
            // Only add click handler if option is not disabled (non-premium or premium user)
            if (!(isPremiumOption && !isPremiumUser)) {
               optionElement.addEventListener('click', () => {
    originalSelect.value = option.value;
    triggerText.textContent = displayText;
    
    // Update trigger text and preview immediately
    if (option.value === 'not_specified') {
        triggerText.style.color = '#888';
        previewImg.style.display = 'none';
    } else {
        triggerText.style.color = '';
        const formattedValue = option.value.replace(/_/g, '-');
        const newPreviewPath = `../previews/${folder}/${formattedValue}-preview.png`;
        previewImg.src = newPreviewPath;
        previewImg.style.display = 'block';
    }
    
    // Close dropdown immediately
    optionsContainer.classList.remove('active');
    optionsContainer.style.opacity = '0';
    optionsContainer.style.transform = 'translateY(-10px) scaleY(0.9)';
    
    hidePreview();
    
    localStorage.setItem(originalSelect.id, option.value);
    
    const event = new Event('change');
    originalSelect.dispatchEvent(event);
});
            }
            
            optionsContainer.appendChild(optionElement);
        });

        // Load saved selections after options are created
        loadSavedSelections();
    });

    function loadSavedSelections() {
        const savedValue = localStorage.getItem(originalSelect.id);
        if (savedValue) {
            const options = Array.from(originalSelect.options);
            const option = options.find(opt => opt.value === savedValue && !opt.disabled);
            
            if (option) {
                originalSelect.value = savedValue;
                triggerText.textContent = option.text.replace(' (Premium)', '');
                
                if (savedValue === 'not_specified') {
                    previewImg.style.display = 'none';
                    triggerText.style.color = '#888';
                } else {
                    previewImg.style.display = 'block';
                    previewImg.src = `../previews/${folder}/${savedValue.replace(/_/g, '-')}-preview.png`;
                    triggerText.style.color = '';
                }
            }
        }
    }

    customSelect.appendChild(optionsContainer);
    selectWrapper.appendChild(customSelect);
    
    originalSelect.style.display = 'none';
    originalSelect.parentNode.insertBefore(selectWrapper, originalSelect);

    // Toggle dropdown
trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const allDropdowns = document.querySelectorAll('.select-options');

    // Close other dropdowns immediately without animation
    allDropdowns.forEach(dropdown => {
        if (dropdown !== optionsContainer) {
            dropdown.classList.remove('active');
            dropdown.style.opacity = '0';
            dropdown.style.transform = 'translateY(-10px) scaleY(0.9)';
            dropdown.style.zIndex = ''; // Reset z-index when closing
        }
    });

    // Toggle current dropdown with animation
    if (!optionsContainer.classList.contains('active')) {
        // Opening animation
        optionsContainer.classList.add('active');
        optionsContainer.style.zIndex = '1001'; // Increase z-index when opening
        requestAnimationFrame(() => {
            optionsContainer.style.opacity = '1';
            optionsContainer.style.transform = 'translateY(0) scaleY(1)';
        });
    } else {
        // Close immediately
        optionsContainer.classList.remove('active');
        optionsContainer.style.opacity = '0';
        optionsContainer.style.transform = 'translateY(-10px) scaleY(0.9)';
        optionsContainer.style.zIndex = ''; // Reset z-index when closing
    }
});

    

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (optionsContainer.classList.contains('active')) {
            const options = optionsContainer.querySelectorAll('.select-option:not(.disabled)');
            const currentIndex = Array.from(options).findIndex(opt => 
                opt.textContent === triggerText.textContent);
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        options[currentIndex - 1].click();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < options.length - 1) {
                        options[currentIndex + 1].click();
                    }
                    break;
                case 'Enter':
                case 'Escape':
                    e.preventDefault();
                    optionsContainer.classList.remove('active');
                    hidePreview();
                    break;
            }
        }
    });

    return {
        loadSelections: loadSavedSelections,
        saveSelection: (value) => localStorage.setItem(originalSelect.id, value)
    };
}

// Add CSS styles for "Not Specified" option
const style = document.createElement('style');
style.textContent = `
.select-option[data-value="not_specified"] {
    color: #888 !important;
}

.select-trigger span {
    transition: color 0.2s ease;
}
`;
document.head.appendChild(style);
// Load saved state of advanced options
const savedAdvancedOptionsState = localStorage.getItem('advancedOptionsVisible');
isAdvancedOptionsVisible = savedAdvancedOptionsState === 'true';

// Initialize panel state based on saved preference
if (isAdvancedOptionsVisible) {
    advancedOptions.style.display = 'block';
    advancedOptions.style.opacity = '1';
    advancedOptions.style.maxHeight = '2000px';
    advancedOptions.style.transform = 'translateY(0)';
    advancedOptions.style.padding = '15px';
    advancedOptions.style.marginBottom = '15px';
    chevronIcon.classList.add('active');
} else {
    advancedOptions.style.display = 'none';
    advancedOptions.style.opacity = '0';
    advancedOptions.style.maxHeight = '0';
    advancedOptions.style.transform = 'translateY(-10px)';
    advancedOptions.style.padding = '0';
    advancedOptions.style.marginBottom = '0';
    chevronIcon.classList.remove('active');
}
    
    const styleRefsTab = document.createElement('button');
styleRefsTab.id = 'styleRefsTab';
styleRefsTab.className = 'tab-button';
styleRefsTab.title = 'Style Codes'; // Add tooltip

// Create SVG element
const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svgIcon.setAttribute("viewBox", "0 0 24 24");
svgIcon.setAttribute("width", "18");
svgIcon.setAttribute("height", "18");

// Create path element
const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
path.setAttribute("fill", "currentColor");
path.setAttribute("d", "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z");

// Append path to SVG
svgIcon.appendChild(path);

// Append SVG to button
styleRefsTab.appendChild(svgIcon);
    
    
    // Insert before Weekly Prompts tab
    tabsContainer.insertBefore(styleRefsTab, weeklyTab);

    // Create content container for style references
    const styleRefsContent = document.createElement('div');
    styleRefsContent.id = 'styleRefsContent';
    styleRefsContent.className = 'tab-content';
    
    // Add info text at the top
    

    // Add container for style reference cards
    const styleRefsContainer = document.createElement('div');
    styleRefsContainer.className = 'style-refs-container';
    styleRefsContent.appendChild(styleRefsContainer);

    // Add to main content
    document.querySelector('#mainContent').appendChild(styleRefsContent);
   
    const generatedPromptsElem = document.getElementById('generatedPrompts');
    const historyPromptsElem = document.getElementById('historyPrompts');
    const historyContentElem = document.getElementById('historyContent');
    const weeklyPromptsElem = document.getElementById('weeklyPrompts');

    const infoBox = document.getElementById('infoBox');
    
     startTokenRefreshInterval();

    // Ensure main content is visible and login form is hidden initially
     mainContent.style.display = 'block';
    loginForm.style.display = 'none';
    
    

    // Retrieve stored authToken and isPremiumUser from chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        // A sign-in from the old backend is cleared first, so what is read below
        // is a Supabase session or nothing.
        pcAuth.retireLegacySession().then(() => {
        chrome.storage.local.get(['authToken', 'isPremiumUser', 'username'], (result) => {
            if (result.authToken) {
                isLoggedIn = true;
                isPremiumUser = result.isPremiumUser || false;
                username = result.username || 'User'; // Retrieve username, default to 'User'
                
            } else {
                isLoggedIn = false;
                isPremiumUser = false;
                
            }
            updateUIForLoginStatus(); // Update the UI based on login status


        });
        });
    } else {
        console.error('Chrome Storage API is not available. Are you testing in a non-extension environment?');
    }
// Add these variables at the top of your popup.js file
const STYLE_REFS_CACHE_KEY = 'styleReferencesCache';
const STYLE_REFS_CACHE_EXPIRY_KEY = 'styleReferencesCacheExpiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
function clearStyleReferencesCache() {
    localStorage.removeItem(STYLE_REFS_CACHE_KEY);
    localStorage.removeItem(STYLE_REFS_CACHE_EXPIRY_KEY);
}

// Add this to handle cache invalidation when user logs in/out
function invalidateStyleReferencesCache() {
    clearStyleReferencesCache();
    loadStyleReferences(true); // Force refresh
}
/**
 * Style references moved to the web app.
 *
 * The endpoint this used to call does not exist on the new API — the feature
 * was removed there, not relocated. Rather than call a host that is gone and
 * then show "Please try again" for a failure that retrying cannot fix, the tab
 * says where the codes actually are. Any stale cache from the old server is
 * dropped for the same reason: it describes a library nothing can refresh.
 *
 * The `forceRefresh` parameter is kept because two callers pass it.
 */
async function loadStyleReferences(forceRefresh = false) {
    const styleRefsContainer = document.querySelector('.style-refs-container');
    const loadingElem = document.getElementById('loading');

    clearStyleReferencesCache();

    if (loadingElem) loadingElem.style.display = 'none';
    if (!styleRefsContainer) return;

    styleRefsContainer.style.display = 'flex';
    styleRefsContainer.innerHTML = `
        <div class="style-refs-info">
            Midjourney Style Reference codes now live on the Prompt Catalyst website,
            where the library is kept up to date.
            <button class="fullscreen-btn">
                <img src="icons/expand.svg" alt="Open">
                <span>Browse Style Codes</span>
            </button>
        </div>
    `;

    const openBtn = styleRefsContainer.querySelector('.fullscreen-btn');
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            window.open(`${PC_CONFIG.SITE}/style-codes`, '_blank');
        });
    }
}

// Add this new function to handle the display logic separately
function displayStyleReferences(styles) {
    const styleRefsContainer = document.querySelector('.style-refs-container');
    if (!styleRefsContainer) return;
    
    styleRefsContainer.innerHTML = '';

    // Add info text with fullscreen button at the top
    const infoText = document.createElement('div');
    infoText.className = 'style-refs-info';
    infoText.innerHTML = `
        These are Midjourney Style Reference codes. Add them to your prompts to influence the visual style.
        <button class="fullscreen-btn">
            <img src="icons/expand.svg" alt="Fullscreen">
            <span>Open Full View</span>
        </button>
    `;
    styleRefsContainer.appendChild(infoText);
    document.querySelector('.fullscreen-btn').addEventListener('click', function() {
        window.open('https://promptcatalyst.ai/style-codes', '_blank');
    });
    chrome.storage.local.get(['isPremiumUser'], (result) => {
        const isPremiumUser = result.isPremiumUser || false;
        
        // Separate free and premium styles
        const freeStyles = styles.filter(style => !style.isPremium);
        const premiumStyles = styles.filter(style => style.isPremium);

        if (isPremiumUser) {
            // Show all styles for premium users
            styles.forEach(style => {
                const card = createStyleCard(style);
                styleRefsContainer.appendChild(card);
            });
        } else {
            // Show free styles + teaser for free users
            freeStyles.forEach(style => {
                const card = createStyleCard(style);
                styleRefsContainer.appendChild(card);
            });

            // Add premium teaser card
            const teaserCard = createPremiumTeaserCard();
            styleRefsContainer.appendChild(teaserCard);
        }
    });
}

    function createPremiumTeaserCard() {
    const teaserCard = document.createElement('div');
    teaserCard.className = 'style-ref-card premium-preview-card';
    
    teaserCard.innerHTML = `
        <div class="premium-card-content">
            <img src="../previews/premium-style-teaser.png" alt="Premium styles preview" class="teaser-image" loading="lazy">
            <div class="premium-overlay">
                <h3>100+ Premium Style Codes Available</h3>
                <p>Upgrade to Premium to unlock exclusive style reference codes! New styles added every day.</p>
                <button class="premium-upgrade-btn">
                    <span class="shine"></span>
                    Get Premium
                </button>
            </div>
        </div>
    `;

    // Add click handler for the upgrade button
    teaserCard.querySelector('.premium-upgrade-btn').addEventListener('click', () => {
        window.open('https://promptcatalyst.ai/premium', '_blank');
    });

    return teaserCard;
}

function createStyleCard(style) {
    const card = document.createElement('div');
    card.className = 'style-ref-card';

    const premiumBadge = style.isPremium ? 
        '<div class="premium-badge">Premium</div>' : '';

    card.innerHTML = `
        ${premiumBadge}
        <div class="card-image">
            <img src="${style.image}" alt="${style.description}" loading="lazy">
        </div>
        <div class="style-ref-info">
            <p class="style-description">${style.description}</p>
            <div class="style-ref-code-container">
                <code class="style-ref-code">${style.code}</code>
                <button class="copy-btn" data-code="${style.code}">
                    <img src="icons/copy-icon.svg" alt="Copy">
                    <span>Copy</span>
                </button>
            </div>
        </div>
    `;

    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
        copyToClipboard(style.code);
    });

    return card;
}
function displayError(message) {
    const styleRefsContainer = document.querySelector('.style-refs-container');
    if (!styleRefsContainer) return;

    styleRefsContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="loadStyleReferences()" class="retry-btn">
                Try Again
            </button>
        </div>
    `;
}

 // Modify the tab switching logic for style references
styleRefsTab.addEventListener('click', function() {
    const lastRefresh = localStorage.getItem(STYLE_REFS_CACHE_EXPIRY_KEY);
    const now = Date.now();
    
    // Force refresh if cache is expired or doesn't exist
    const forceRefresh = !lastRefresh || now >= parseInt(lastRefresh);
    
    switchTab('styleRefs');
    loadStyleReferences(forceRefresh);
});
    
   function createCollectionsTab() {
        const collectionsTab = document.createElement('button');
        collectionsTab.id = 'collectionsTab';
        collectionsTab.className = 'tab-button';
        collectionsTab.title = 'Collections';

        // Add Collections icon using existing SVG namespace
        const collectionsSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        collectionsSvg.setAttribute("viewBox", "0 0 24 24");
        collectionsSvg.setAttribute("width", "18");
        collectionsSvg.setAttribute("height", "18");

        const collectionsPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        collectionsPath.setAttribute("fill", "currentColor");
        collectionsPath.setAttribute("d", "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z");

        collectionsSvg.appendChild(collectionsPath);
        collectionsTab.appendChild(collectionsSvg);

        // Insert Collections tab before Style Refs tab
        const existingTabs = document.querySelector('.tabs');
        if (existingTabs) {
            const styleRefsTab = document.getElementById('styleRefsTab');
            if (styleRefsTab) {
                existingTabs.insertBefore(collectionsTab, styleRefsTab);
            } else {
                existingTabs.appendChild(collectionsTab);
            }
        }

        return collectionsTab;
    }

    // Create Collections content
    function createCollectionsContent() {
        const collectionsContent = document.createElement('div');
        collectionsContent.id = 'collectionsContent';
        collectionsContent.className = 'tab-content';

        collectionsContent.innerHTML = `
            <div class="collections-header">
                <button id="createCollection" class="create-collection-btn">
                    <img src="icons/folder-plus.svg" alt="New Collection">
                    New Collection
                </button>
            </div>
            <div class="collections-container">
                <div class="collections-sidebar">
                    <div class="collections-list" id="collectionsList"></div>
                </div>
                <div class="collections-content" id="collectionPrompts"></div>
            </div>
        `;

        const mainContent = document.querySelector('#mainContent');
        if (mainContent) {
            mainContent.appendChild(collectionsContent);
        }

        return collectionsContent;
    }

    // Initialize Collections feature
    const collectionsTab = createCollectionsTab();
    const collectionsContent = createCollectionsContent();

    // Collections Manager Object
    const collectionsManager = {
        collections: {},
 folderColors: {
        blue: '#3b82f6',
        green: '#42f56f',
        purple: '#8b5cf6',
        orange: '#f59e0b',
        pink: '#ec4899',
        yellow: '#fbbf24',
        red: '#ef4444',
        teal: '#14b8a6'
    },

        init() {
           
            this.loadCollections();
            this.setupEventListeners();
            this.renderCollections();
            this.cleanupCollections(); 
        },

        loadCollections() {
            const savedCollections = localStorage.getItem('promptCollections');
            if (savedCollections) {
                this.collections = JSON.parse(savedCollections);
            }
        },
           movePromptToCollection(promptText, fromCollectionId, toCollectionId) {
    const sourceCollection = this.collections[fromCollectionId];
    const cleanedPrompt = this.stripHTMLFromPrompt(promptText);
    
    // Find the prompt object in the source collection
    const promptObject = sourceCollection.prompts.find(p => 
        p.text === cleanedPrompt || 
        p.text === promptText
    );

    if (!promptObject) {
        console.error('Prompt not found in source collection');
        return;
    }

    // Remove from source collection
    this.collections[fromCollectionId].prompts = this.collections[fromCollectionId].prompts
        .filter(prompt => prompt.id !== promptObject.id);

    // Check if there's a preview image for this prompt
    const savedPreviews = JSON.parse(localStorage.getItem('previews') || '{}');
    const hasPreview = savedPreviews[cleanedPrompt];

    // Create new prompt object for target collection
    const newPromptObj = {
        id: 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        text: promptObject.text,
        added: Date.now(),
        parameters: promptObject.parameters || [],
        isVideo: promptObject.isVideo || 
                 promptObject.text.includes('--video') || 
                 (promptObject.parameters && promptObject.parameters.some(p => p.includes('--video'))),
        preview: hasPreview // Add the preview property if it exists
    };

    // Add to target collection
    this.collections[toCollectionId].prompts.unshift(newPromptObj);

    // Save changes
    this.saveCollections();

    // Re-render with isMoving flag
    this.renderCollectionsPreserveActive(fromCollectionId, true);
    this.renderCollectionPrompts(fromCollectionId, true);
    this.updateCollectionCount(fromCollectionId);
    this.updateCollectionCount(toCollectionId);

    // If moving to a different collection, ensure the preview is properly restored
    if (hasPreview) {
        const disabledButtons = JSON.parse(localStorage.getItem('disabledButtons') || '{}');
        disabledButtons[cleanedPrompt] = true;
        localStorage.setItem('disabledButtons', JSON.stringify(disabledButtons));
    }

    this.showToast('Prompt moved successfully');
},

 
         showMoveToCollectionMenu(event, promptText, currentCollectionId) {
        event.stopPropagation();
        
        // Remove any existing dropdowns
        const existingDropdown = document.querySelector('.move-collection-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        const button = event.currentTarget;
        const dropdown = document.createElement('div');
        dropdown.className = 'move-collection-dropdown';

        // Get all collections except the current one
        const collections = Object.entries(this.collections)
            .filter(([id]) => id !== currentCollectionId);

        if (collections.length === 0) {
            dropdown.innerHTML = `
                <div class="move-collection-empty">
                    <p>No other collections available</p>
                    <button class="create-new-collection">Create New Collection</button>
                </div>
            `;

            const createButton = dropdown.querySelector('.create-new-collection');
            createButton.addEventListener('click', () => {
                const name = prompt('Enter collection name:');
                if (name) {
                    const newId = this.createCollection(name);
                    if (newId) {
                        // Move prompt to new collection without showing additional toast
                        this.movePromptToCollection(promptText, currentCollectionId, newId);
                        dropdown.remove();
                    }
                }
            });
        } else {
            const ul = document.createElement('ul');
            ul.className = 'move-collection-list';

            collections.forEach(([id, collection]) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <img src="icons/folder.svg" alt="Collection">
                    ${collection.name}
                    <span class="prompt-count">${collection.prompts.length}</span>
                `;
                li.addEventListener('click', () => {
                    this.movePromptToCollection(promptText, currentCollectionId, id);
                    dropdown.remove();
                });
                ul.appendChild(li);
            });

            dropdown.appendChild(ul);
        }

        // Position the dropdown
        const buttonRect = button.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${buttonRect.bottom + 5}px`;
        dropdown.style.left = `${buttonRect.left}px`;

        document.body.appendChild(dropdown);

        // Close dropdown when clicking outside
        setTimeout(() => {
            const closeDropdown = (e) => {
                if (!dropdown.contains(e.target) && e.target !== button) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            };
            document.addEventListener('click', closeDropdown);
        }, 0);

        // Update position on scroll
        const scrollableParents = this.getScrollableParents(button);
        const updatePosition = () => {
            const updatedRect = button.getBoundingClientRect();
            dropdown.style.top = `${updatedRect.bottom + 5}px`;
            dropdown.style.left = `${updatedRect.left}px`;
        };
        
        scrollableParents.forEach(parent => {
            parent.addEventListener('scroll', updatePosition);
        });

        // Remove scroll listeners when dropdown is closed
        const cleanup = () => {
            scrollableParents.forEach(parent => {
                parent.removeEventListener('scroll', updatePosition);
            });
        };

        dropdown.addEventListener('remove', cleanup);
    },

        renderCollectionsPreserveActive(activeCollectionId, isMoving = true) {
    const collectionsList = document.getElementById('collectionsList');
    if (!collectionsList) return;

    collectionsList.innerHTML = '';

    Object.entries(this.collections)
        .sort(([, a], [, b]) => b.created - a.created)
        .forEach(([id, collection]) => {
            const collectionEl = document.createElement('div');
            collectionEl.className = 'collection-item';
            if (id === activeCollectionId) {
                collectionEl.classList.add('active');
            }
            collectionEl.setAttribute('data-id', id);
            
            collectionEl.innerHTML = `
                <div class="collection-name">
                    <img src="icons/folder.svg" alt="Collection" style="width: 24px; height: 24px; filter: ${this.getFolderIconFilter(collection.color)};">
                    ${collection.name}
                    <span class="prompt-count">${collection.prompts.length}</span>
                </div>
                ${!isMoving ? `
                    <button class="delete-collection" data-id="${id}">
                        <img src="icons/trash.svg" alt="Delete">
                    </button>
                ` : ''}
            `;

            collectionEl.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-collection')) {
                    document.querySelectorAll('.collection-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    collectionEl.classList.add('active');
                    this.renderCollectionPrompts(id, isMoving);
                }
            });

            if (!isMoving) {
                const deleteBtn = collectionEl.querySelector('.delete-collection');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteCollection(id);
                    });
                }
            }

            collectionsList.appendChild(collectionEl);
        });
},
        saveCollections() {
    // Clean up collections before saving
    Object.values(this.collections).forEach(collection => {
        collection.prompts = collection.prompts.map(prompt => ({
            ...prompt,
            text: this.stripHTMLFromPrompt(prompt.text)
        }));
    });
    
    localStorage.setItem('promptCollections', JSON.stringify(this.collections));
},
cleanupCollections() {
    let hasChanges = false;
    
    Object.values(this.collections).forEach(collection => {
        const uniquePrompts = new Map();
        
        collection.prompts = collection.prompts.filter(prompt => {
            const cleanedText = this.stripHTMLFromPrompt(prompt.text);
            if (uniquePrompts.has(cleanedText)) {
                hasChanges = true;
                return false;
            }
            uniquePrompts.set(cleanedText, true);
            return true;
        });
    });
    
    if (hasChanges) {
        this.saveCollections();
    }
},

        createCollection(name) {
            if (!name || name.trim() === '') return false;
            const id = 'collection_' + Date.now();
            this.collections[id] = {
                name: name.trim(),
                prompts: [],
                created: Date.now()
            };
            this.saveCollections();
            this.renderCollections();
            return id;
        },

        deleteCollection(id) {
            if (confirm('Are you sure you want to delete this collection?')) {
                delete this.collections[id];
                this.saveCollections();
                this.renderCollections();
                document.getElementById('collectionPrompts').innerHTML = '';
            }
        },

      addPromptToCollection(collectionId, prompt) {
    if (!this.collections[collectionId]) return;

    // Determine if this is from weekly prompts tab
    const isFromWeeklyTab = document.getElementById('weeklyTab').classList.contains('active');

    // If from weekly tab, use prompt as is without parameter processing
    let finalPrompt = isFromWeeklyTab ? prompt : this.stripHTMLFromPrompt(prompt);
    let parameters = [];

    // Detect if this is a video prompt
    const isVideoPrompt = 
        finalPrompt.includes('--video') || 
        (localStorage.getItem('videoMode') === 'true' && !isFromWeeklyTab);

    // Only process parameters if NOT from weekly tab
    if (!isFromWeeklyTab) {
        const paramMatch = finalPrompt.match(/(?:\s+--[a-zA-Z]+(?::\d+(?:\.\d+)?)?(?:\s+[\d.:]+)*)+$/);
        if (paramMatch) {
            parameters = paramMatch[0].trim().split(/\s+(?=--)/);
            finalPrompt = finalPrompt.replace(paramMatch[0], '').trim();
        }

        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect.value === 'midjourney' && activeParams.size > 0 && parameters.length === 0) {
            parameters = Array.from(activeParams);
        }
    }

    const cleanPrompt = isFromWeeklyTab ? prompt : this.stripHTMLFromPrompt(finalPrompt);
    const exists = this.collections[collectionId].prompts.some(p => 
        this.stripHTMLFromPrompt(p.text) === cleanPrompt
    );

    if (exists) {
        this.showToast('This prompt is already in the collection');
        return;
    }

    const promptObj = {
        id: 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        text: finalPrompt,
        added: Date.now(),
        parameters: isFromWeeklyTab ? [] : parameters,
        isVideo: isVideoPrompt
    };

    this.collections[collectionId].prompts.unshift(promptObj);
    this.saveCollections();

    // Remove active class from all collection items
    document.querySelectorAll('.collection-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to the target collection
    const targetCollectionItem = document.querySelector(`.collection-item[data-id="${collectionId}"]`);
    if (targetCollectionItem) {
        targetCollectionItem.classList.add('active');
    }

    // Render the prompts of the target collection
    this.renderCollectionPrompts(collectionId);
    this.updateCollectionCount(collectionId);
},

 createCollection(name) {
        if (!name || name.trim() === '') return false;
        const id = 'collection_' + Date.now();
        this.collections[id] = {
            name: name.trim(),
            prompts: [],
            created: Date.now(),
            color: 'green' // Default color
        };
        this.saveCollections();
        this.renderCollections();
        return id;
    },
        

    // Add new showColorPicker method
    showColorPicker(event, collectionId) {
    event.stopPropagation();
    
    // Remove any existing color pickers
    const existingPicker = document.querySelector('.folder-color-picker');
    if (existingPicker) {
        existingPicker.remove();
    }

    const button = event.currentTarget;
    const picker = document.createElement('div');
    picker.className = 'folder-color-picker';
    
    // Create color options
    Object.entries(this.folderColors).forEach(([colorName, colorValue]) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = colorValue;
        
        if (this.collections[collectionId].color === colorName) {
            colorOption.classList.add('selected');
        }

        colorOption.addEventListener('click', (e) => {
            e.stopPropagation();
            this.collections[collectionId].color = colorName;
            this.saveCollections();
            
            // Update the folder icon color immediately
            const folderIcon = document.querySelector(`[data-id="${collectionId}"] img`);
            if (folderIcon) {
                folderIcon.style.filter = this.getFolderIconFilter(colorName);
            }
            
            this.renderCollections();
            picker.remove();
        });

        picker.appendChild(colorOption);
    });

    // Position the picker
    document.body.appendChild(picker);
    const buttonRect = button.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();

    let left = buttonRect.left;
    let top = buttonRect.bottom + 5;

    // Adjust position if it would go off screen
    if (left + pickerRect.width > window.innerWidth) {
        left = window.innerWidth - pickerRect.width - 5;
    }
    if (top + pickerRect.height > window.innerHeight) {
        top = buttonRect.top - pickerRect.height - 5;
    }

    picker.style.position = 'fixed';
    picker.style.left = `${Math.max(5, left)}px`;
    picker.style.top = `${top}px`;
    picker.style.zIndex = '1000';

    // Add visible class for animation
    requestAnimationFrame(() => {
        picker.classList.add('visible');
    });

    // Close picker when clicking outside
    const closePickerListener = (e) => {
        if (!picker.contains(e.target) && e.target !== button) {
            picker.classList.remove('visible');
            setTimeout(() => picker.remove(), 200);
            document.removeEventListener('click', closePickerListener);
        }
    };

    setTimeout(() => {
        document.addEventListener('click', closePickerListener);
    }, 0);
},
        updateCollectionCount(collectionId) {
    const collectionItem = document.querySelector(`.collection-item[data-id="${collectionId}"]`);
    if (collectionItem && this.collections[collectionId]) {
        const countElement = collectionItem.querySelector('.prompt-count');
        if (countElement) {
            countElement.textContent = this.collections[collectionId].prompts.length;
        }
    }
},
          renderCollections() {
        const collectionsList = document.getElementById('collectionsList');
        const collectionsContainer = document.querySelector('.collections-container');
        const collectionsContent = document.querySelector('.collections-content');
        
        if (!collectionsList || !collectionsContainer || !collectionsContent) return;

        collectionsList.innerHTML = '';

          if (Object.keys(this.collections).length === 0) {
            // Hide the regular collections layout
            collectionsContainer.style.display = 'none';
            
            // Create and show the full-width empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'collections-empty-state';
            emptyState.style.width = '100%';
            emptyState.style.height = 'calc(100vh - 350px)';
            emptyState.style.minHeight = '200px';
            emptyState.style.display = 'flex';
            emptyState.style.flexDirection = 'column';
            emptyState.style.alignItems = 'center';
            emptyState.style.justifyContent = 'center';
            emptyState.innerHTML = `
                <img src="icons/folder-open.svg" alt="Empty" style="width: 64px; height: 64px; margin-bottom: 20px; opacity: 0.5;">
                <h3 style="font-size: 18px; color: #f5f5f5; margin: 0 0 12px;">No Collections Yet</h3>
                <p style="font-size: 14px; color: #888; margin: 0; max-width: 300px; text-align: center; line-height: 1.5;">
                    Create a new collection to start organizing your prompts. You can add prompts to collections using the Star button.
                </p>
            `;
            
            // Insert the empty state after the header
            const header = document.querySelector('.collections-header');
            header.insertAdjacentElement('afterend', emptyState);
            
            return;
        }
              

         collectionsContainer.style.display = 'flex';
    const existingEmptyState = document.querySelector('.collections-empty-state');
    if (existingEmptyState) {
        existingEmptyState.remove();
    }

    Object.entries(this.collections)
        .sort(([, a], [, b]) => b.created - a.created)
        .forEach(([id, collection]) => {
            const collectionEl = document.createElement('div');
            collectionEl.className = 'collection-item';
            collectionEl.setAttribute('data-id', id);
            
            collectionEl.innerHTML = `
                <div class="collection-name">
                    <img src="icons/folder.svg" alt="Collection" style="width: 24px; height: 24px; filter: ${this.getFolderIconFilter(collection.color)};">
                    ${collection.name}
                    <span class="prompt-count">${collection.prompts.length}</span>
                </div>
            `;

            collectionEl.addEventListener('click', (e) => {
                this.renderCollectionPrompts(id);
                document.querySelectorAll('.collection-item').forEach(item => {
                    item.classList.remove('active');
                });
                collectionEl.classList.add('active');
            });

            collectionsList.appendChild(collectionEl);
        });
    },
        exportCollectionToFile(collectionId) {
    const collection = this.collections[collectionId];
    if (!collection || !collection.prompts.length) {
        this.showToast('No prompts to export', 'error');
        return;
    }

    // Create the content for the file
    let fileContent = `${collection.name} - Prompt Collection\n`;
    fileContent += `Exported on: ${new Date().toLocaleString()}\n`;
    fileContent += `Total Prompts: ${collection.prompts.length}\n\n`;
    fileContent += '----------------------------------------\n\n';

    // Add each prompt without numbering, just separated by blank lines
    collection.prompts.forEach(prompt => {
        fileContent += `${prompt.text}\n\n`; // Just add the prompt text and double line break
    });

    // Create a Blob with the content
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link element and trigger the download
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${collection.name.toLowerCase().replace(/\s+/g, '-')}-prompts.txt`;
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
    
    this.showToast('Collection exported successfully');
},
        
        

       
    isPromptInAnyCollection(promptText) {
    // Clean the prompt text and parameters consistently
    const cleanPrompt = this.stripHTMLFromPrompt(promptText);
    const paramMatch = cleanPrompt.match(/(?:\s+--[a-zA-Z]+(?::\d+(?:\.\d+)?)?(?:\s+[\d.:]+)*)+$/);
    const basePrompt = paramMatch ? cleanPrompt.replace(paramMatch[0], '').trim() : cleanPrompt;

    return Object.values(this.collections).some(collection => 
        collection.prompts.some(prompt => {
            const storedPromptBase = this.stripHTMLFromPrompt(prompt.text);
            const storedParamMatch = storedPromptBase.match(/(?:\s+--[a-zA-Z]+(?::\d+(?:\.\d+)?)?(?:\s+[\d.:]+)*)+$/);
            const storedBasePrompt = storedParamMatch ? 
                storedPromptBase.replace(storedParamMatch[0], '').trim() : 
                storedPromptBase;
            
            return storedBasePrompt === basePrompt;
        })
    );
},
stripHTMLFromPrompt(promptText) {
    if (typeof promptText !== 'string') {
        return promptText;
    }
    
    // Clean HTML and normalize whitespace
    let cleanText = promptText
        .replace(/<span class="highlight">/g, '')
        .replace(/<\/span>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    return cleanText;
},
getFolderIconFilter(color) {
    const filters = {
        blue: 'brightness(0) saturate(100%) invert(46%) sepia(70%) saturate(2476%) hue-rotate(200deg) brightness(90%) contrast(95%)',
        green: 'brightness(0) saturate(100%) invert(88%) sepia(39%) saturate(1109%) hue-rotate(86deg) brightness(92%) contrast(98%)',
        purple: 'brightness(0) saturate(100%) invert(45%) sepia(74%) saturate(7485%) hue-rotate(267deg) brightness(101%) contrast(98%)',
        orange: 'brightness(0) saturate(100%) invert(72%) sepia(75%) saturate(4783%) hue-rotate(349deg) brightness(101%) contrast(96%)',
        pink: 'brightness(0) saturate(100%) invert(40%) sepia(79%) saturate(2929%) hue-rotate(308deg) brightness(97%) contrast(99%)',
        yellow: 'brightness(0) saturate(100%) invert(96%) sepia(40%) saturate(4826%) hue-rotate(359deg) brightness(102%) contrast(94%)',
        red: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(7497%) hue-rotate(353deg) brightness(97%) contrast(93%)',
        teal: 'brightness(0) saturate(100%) invert(72%) sepia(89%) saturate(389%) hue-rotate(133deg) brightness(88%) contrast(84%)'
    };

    return filters[color] || filters.green; // Default to green if color not found
},
renderCollectionPrompts(collectionId) {
    const collection = this.collections[collectionId];
    if (!collection) return;

    const promptsContainer = document.getElementById('collectionPrompts');
    if (!promptsContainer) return;

    promptsContainer.innerHTML = `
        <div class="collection-prompts-header">
            <div class="collection-header-content">
                <h3>${collection.name}</h3>
                <p>${collection.prompts.length} prompts</p>
            </div>
            <div class="collection-header-actions">
                <button class="custom-prompt-btn" title="Add Custom Prompt">
                    <img src="icons/file-plus.svg" alt="Add Custom">
                </button>
                <button class="color-picker-btn" title="Change folder color">
                    <img src="icons/palette.svg" alt="Color">
                </button>
                <button class="collection-export-btn" title="Export Collection" data-collection-id="${collectionId}">
                    <img src="icons/download.svg" alt="Export">
                </button>
                <button class="collection-header-delete" title="Delete Collection">
                    <img src="icons/trash.svg" alt="Delete">
                </button>
            </div>
        </div>
        <div class="collection-prompts-list"></div>
    `;

    // Add event listeners for existing buttons
    const colorPickerBtn = promptsContainer.querySelector('.color-picker-btn');
    const deleteBtn = promptsContainer.querySelector('.collection-header-delete');
    const exportBtn = promptsContainer.querySelector('.collection-export-btn');
    const customPromptBtn = promptsContainer.querySelector('.custom-prompt-btn');

    // Add click handler for custom prompt button
    customPromptBtn.addEventListener('click', () => {
        showCustomPromptDialog(collectionId);
    });

    // Remove any existing event listeners using cloneNode
    const newExportBtn = exportBtn.cloneNode(true);
    exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);

    // Add single event listener for export
    newExportBtn.addEventListener('click', () => {
        const collectionId = newExportBtn.getAttribute('data-collection-id');
        if (collectionId) {
            this.exportCollectionToFile(collectionId);
        }
    });

    colorPickerBtn.addEventListener('click', (e) => this.showColorPicker(e, collectionId));
    deleteBtn.addEventListener('click', () => this.deleteCollection(collectionId));

     const promptsList = promptsContainer.querySelector('.collection-prompts-list');
    
    if (collection.prompts.length === 0) {
        promptsList.innerHTML = `
            <div class="collections-empty-state">
                <img src="icons/file-text.svg" alt="Empty">
                <h3>No Prompts</h3>
                <p>Press the Star button to add a prompt to this collection</p>
            </div>
        `;
        return;
    }

    // Clear the list first
    promptsList.innerHTML = '';

    // Get saved previews
    const savedPreviews = JSON.parse(localStorage.getItem('previews')) || {};

collection.prompts.forEach(prompt => {
        const promptBox = createThemeAwarePromptBox(prompt.text, true, true, collectionId);
        if (!promptBox) return;

        // Add video-prompt class if it's a video prompt
        if (prompt.isVideo || 
            prompt.text.includes('--video') || 
            (prompt.parameters && prompt.parameters.some(p => p.includes('--video')))) {
            promptBox.classList.add('video-prompt');
            // Remove preview button for video prompts
            const previewBtn = promptBox.querySelector('.preview-btn');
            if (previewBtn) {
                previewBtn.remove();
            }
        }

        // Add parameters if they exist
        const promptText = promptBox.querySelector('.prompt-text');
        if (promptText && prompt.parameters && prompt.parameters.length > 0) {
            const baseText = prompt.text;
            const params = prompt.parameters.join(' ');
            promptText.innerHTML = `${baseText} <span class="midjourney-param" style="pointer-events: none; opacity: 0.8;">${params}</span>`;
        }


        // Find and modify the button container
        const buttonContainer = promptBox.querySelector('.button-container');
        if (buttonContainer) {
            const bottomRow = buttonContainer.querySelector('.bottom-row');
            if (bottomRow) {
                // Remove any existing collection buttons
                bottomRow.querySelectorAll('.quick-add-btn, .remove-from-collection, .move-collection-btn').forEach(btn => btn.remove());

                // Add collection-specific buttons
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-from-collection';
                removeBtn.innerHTML = '<img src="icons/remove.svg" alt="Remove">';
                removeBtn.addEventListener('click', () => {
                    if (prompt.id) {
                        this.removePromptFromCollection(collectionId, prompt.id);
                    }
                });

                const moveBtn = document.createElement('button');
                moveBtn.className = 'move-collection-btn';
                moveBtn.innerHTML = '<img src="icons/move.svg" alt="Move">';
                moveBtn.title = 'Move to Another Collection';
                moveBtn.addEventListener('click', (e) => {
                    this.showMoveToCollectionMenu(e, prompt.text, collectionId);
                });

                bottomRow.appendChild(removeBtn);
                bottomRow.appendChild(moveBtn);
            }
        }

        // Add preview if it exists and it's not a video prompt
        const cleanedPrompt = cleanPromptOfParameters(prompt.text);
        const previewUrl = savedPreviews[cleanedPrompt];
        
        if (!prompt.isVideo) {
            const cleanedPrompt = cleanPromptOfParameters(prompt.text);
            const previewUrl = savedPreviews[cleanedPrompt];
            
            if (previewUrl) {
                const imageContainer = document.createElement('div');
                imageContainer.classList.add('image-container');
                const img = document.createElement('img');
                img.src = previewUrl;
                img.alt = 'Preview image';
                img.classList.add('preview-image-prompt');
                imageContainer.appendChild(img);
                promptBox.appendChild(imageContainer);
            }
        }

        promptsList.appendChild(promptBox);
    });
},
removePromptFromCollection(collectionId, promptId) {
    if (!this.collections[collectionId]) return;

    // Find the index of the prompt to remove
    const promptIndex = this.collections[collectionId].prompts.findIndex(p => p.id === promptId);
    if (promptIndex === -1) return;

    // Remove the prompt
    this.collections[collectionId].prompts.splice(promptIndex, 1);
    
    // Save the updated collections
    this.saveCollections();
    
    // Re-render the collection prompts
    this.renderCollectionPrompts(collectionId);
    
    // Update the collection count
    this.updateCollectionCount(collectionId);
    
    // Show success toast
    this.showToast('Prompt removed from collection');
},
       showToast(message, type = 'success', duration = 3000) {
    // Remove any existing toasts with the same message
    const existingToasts = document.querySelectorAll('.collections-toast');
    existingToasts.forEach(toast => {
        if (toast.textContent === message) {
            toast.remove();
        }
    });

    // Create toast container
    const toast = document.createElement('div');
    toast.className = `collections-toast ${type}`;
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = 'toast-message';
    messageContainer.textContent = message;
    
    // Add icon based on type (optional)
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    switch (type) {
        case 'success':
            icon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>`;
            break;
        case 'error':
            icon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>`;
            break;
        case 'warning':
            icon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 2L1 21h22M12 6l7.53 13H4.47M11 10v4h2v-4m-2 6v2h2v-2"/>
            </svg>`;
            break;
    }
    
    // Assemble toast
    toast.appendChild(icon);
    toast.appendChild(messageContainer);
    document.body.appendChild(toast);
    
    // Show toast with slight delay to ensure proper animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Set up removal
    const timeoutId = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300); // Match transition duration
    }, duration);
    
    // Allow early dismissal on click
    toast.addEventListener('click', () => {
        clearTimeout(timeoutId);
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
},

        setupEventListeners() {
            const createCollectionBtn = document.getElementById('createCollection');
            if (createCollectionBtn) {
                createCollectionBtn.addEventListener('click', () => {
                    const name = prompt('Enter collection name:');
                    if (name) {
                        const id = this.createCollection(name);
                        if (id) {
                            this.showToast('Collection created successfully');
                        }
                    }
                });
            }

            // Add context menu for saving prompts to collections
            document.addEventListener('contextmenu', (e) => {
                const promptBox = e.target.closest('.prompt-box');
                if (promptBox && Object.keys(this.collections).length > 0) {
                    e.preventDefault();
                    this.showSaveToCollectionMenu(e, promptBox);
                }
            });
        },

        showSaveToCollectionMenu(e, promptBox) {
            const contextMenu = document.createElement('div');
            contextMenu.className = 'context-menu';
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.style.left = `${e.pageX}px`;

            const promptText = promptBox.querySelector('.prompt-text').textContent;

            Object.entries(this.collections).forEach(([id, collection]) => {
                const option = document.createElement('div');
                option.className = 'context-menu-item';
                option.textContent = `Save to "${collection.name}"`;
                option.addEventListener('click', () => {
                    this.addPromptToCollection(id, promptText);
                    document.body.removeChild(contextMenu);
                });
                contextMenu.appendChild(option);
            });

            document.body.appendChild(contextMenu);

            setTimeout(() => {
                const closeMenu = (e) => {
                    if (!contextMenu.contains(e.target)) {
                        document.body.removeChild(contextMenu);
                        document.removeEventListener('click', closeMenu);
                    }
                };
                document.addEventListener('click', closeMenu);
            }, 0);
        },
        showQuickAddMenu(event, promptText) {
    return new Promise((resolve, reject) => {
        try {
            event.stopPropagation();
            
            // Prevent multiple dropdowns from being opened simultaneously
            const button = event.currentTarget;
            if (button.dataset.dropdownActive === 'true') {
                return resolve();
            }
            button.dataset.dropdownActive = 'true';
            
            // Clean the prompt text
            const cleanPrompt = this.stripHTMLFromPrompt(promptText);
            
            // Remove any existing dropdowns
            document.querySelectorAll('.quick-add-dropdown').forEach(d => d.remove());

            const dropdown = document.createElement('div');
            dropdown.className = 'quick-add-dropdown';

            const handleCollectionCreation = async (name) => {
                if (!name || !name.trim()) return;
                
                const id = this.createCollection(name.trim());
                if (id) {
                    try {
                        this.addPromptToCollection(id, cleanPrompt);
                        this.showToast('Added to new collection: ' + name);
                        
                        const imgElement = button.querySelector('img');
                        if (imgElement) {
                            imgElement.src = 'icons/star-filled.svg';
                            imgElement.alt = 'In Collection';
                            button.title = 'In Collection';
                            
                            // Update button styling
                            const currentTheme = themes[localStorage.getItem('selectedTheme') || 'default'];
                            updateQuickAddButtonColor(button, currentTheme);
                        }
                        
                        dropdown.remove();
                        button.dataset.dropdownActive = 'false';
                        resolve();
                    } catch (error) {
                        console.error('Error adding to collection:', error);
                        this.showToast('Failed to add to collection', 'error');
                        reject(error);
                    }
                }
            };

            // Create dropdown content
            if (Object.keys(this.collections).length === 0) {
                dropdown.innerHTML = `
                    <div class="quick-add-empty">
                        <p>No collections yet</p>
                        <button class="create-new-collection">Create New Collection</button>
                    </div>
                `;

                const createButton = dropdown.querySelector('.create-new-collection');
                createButton.addEventListener('click', () => {
                    const name = prompt('Enter collection name:');
                    handleCollectionCreation(name);
                });
            } else {
                const ul = document.createElement('ul');
                ul.className = 'quick-add-list';

                // Add "Create New Collection" option
                const createNew = document.createElement('li');
                createNew.className = 'quick-add-create-new';
                createNew.innerHTML = `
                    <img src="icons/folder-plus.svg" alt="New">
                    Create New Collection
                `;
                createNew.addEventListener('click', () => {
                    const name = prompt('Enter collection name:');
                    handleCollectionCreation(name);
                });
                ul.appendChild(createNew);

                // Add separator
                const separator = document.createElement('li');
                separator.className = 'quick-add-separator';
                ul.appendChild(separator);

                // Add existing collections
                Object.entries(this.collections)
                    .sort(([, a], [, b]) => b.created - a.created)
                    .forEach(([id, collection]) => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <img src="icons/folder.svg" alt="Collection" style="filter: ${this.getFolderIconFilter(collection.color)};">
                            ${collection.name}
                            <span class="prompt-count">${collection.prompts.length}</span>
                        `;
                        
                        li.addEventListener('click', async () => {
                            try {
                                this.addPromptToCollection(id, cleanPrompt);
                                this.showToast('Added to: ' + collection.name);
                                
                                const imgElement = button.querySelector('img');
                                if (imgElement) {
                                    imgElement.src = 'icons/star-filled.svg';
                                    imgElement.alt = 'In Collection';
                                    button.title = 'In Collection';
                                    
                                    // Update button styling
                                    const currentTheme = themes[localStorage.getItem('selectedTheme') || 'default'];
                                    updateQuickAddButtonColor(button, currentTheme);
                                }
                                
                                dropdown.remove();
                                button.dataset.dropdownActive = 'false';
                                resolve();
                            } catch (error) {
                                console.error('Error adding to collection:', error);
                                this.showToast('Failed to add to collection', 'error');
                                reject(error);
                            }
                        });
                        ul.appendChild(li);
                    });

                dropdown.appendChild(ul);
            }

            // Position and show dropdown
            document.body.appendChild(dropdown);
            this.positionDropdown(button, dropdown);

            // Handle scroll positioning
            const scrollableParents = this.getScrollableParents(button);
            const updatePosition = () => this.positionDropdown(button, dropdown);
            
            scrollableParents.forEach(parent => {
                parent.addEventListener('scroll', updatePosition);
            });

            // Handle click outside
            const handleClickOutside = (e) => {
                if (!dropdown.contains(e.target) && e.target !== button) {
                    dropdown.remove();
                    button.dataset.dropdownActive = 'false';
                    scrollableParents.forEach(parent => {
                        parent.removeEventListener('scroll', updatePosition);
                    });
                    document.removeEventListener('click', handleClickOutside);
                    resolve();
                }
            };

            // Add cleanup on dropdown removal
            dropdown.addEventListener('remove', () => {
                button.dataset.dropdownActive = 'false';
                scrollableParents.forEach(parent => {
                    parent.removeEventListener('scroll', updatePosition);
                });
                document.removeEventListener('click', handleClickOutside);
                resolve();
            });

            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);

        } catch (error) {
            console.error('Error showing quick add menu:', error);
            button.dataset.dropdownActive = 'false';
            reject(error);
        }
    });
},

     getScrollableParents(element) {
        const scrollableParents = [];
        let currentElement = element;

        while (currentElement && currentElement !== document.body) {
            if (this.isScrollable(currentElement)) {
                scrollableParents.push(currentElement);
            }
            currentElement = currentElement.parentElement;
        }
        
        // Always add window as it can be scrolled even if the body isn't overflow
        scrollableParents.push(window);
        return scrollableParents;
    },

    isScrollable(element) {
        const computedStyle = window.getComputedStyle(element);
        const isVerticalScrollable = element.scrollHeight > element.clientHeight &&
            (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll');
        const isHorizontalScrollable = element.scrollWidth > element.clientWidth &&
            (computedStyle.overflowX === 'auto' || computedStyle.overflowX === 'scroll');
        
        return isVerticalScrollable || isHorizontalScrollable;
    },

    positionDropdown(button, dropdown) {
        const buttonRect = button.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate vertical position
        let top;
        if (buttonRect.bottom + dropdownRect.height <= viewportHeight) {
            // Show below if there's room
            top = buttonRect.bottom + 5;
        } else if (buttonRect.top - dropdownRect.height >= 0) {
            // Show above if there's room
            top = buttonRect.top - dropdownRect.height - 5;
        } else {
            // Center in viewport if no room above or below
            top = Math.max(5, (viewportHeight - dropdownRect.height) / 2);
        }

        // Calculate horizontal position
        let left = Math.min(
            buttonRect.left,
            viewportWidth - dropdownRect.width - 5
        );
        left = Math.max(5, left); // Ensure dropdown doesn't go off screen to the left

        // Apply the new position
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
    }
    };
     collectionsManager.init();
    // Event listeners for login/logout
loginIcon.addEventListener('click', () => {
    const loginPopup = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const helpContainer = document.querySelector('.help-container'); // Add this line
    
    loginMessage.textContent = ''; // Clear any existing login message
    loginPopup.style.display = 'flex';
    helpContainer.style.display = 'none'; // Hide help container
    
    setTimeout(() => {
        loginPopup.classList.add('active');
    }, 10);
    mainContent.style.display = 'none';
});
document.getElementById('cancelLogin').addEventListener('click', () => {
    const loginPopup = document.getElementById('loginForm');
    const helpContainer = document.querySelector('.help-container'); // Add this line
    
    loginPopup.classList.remove('active');
    setTimeout(() => {
        loginPopup.style.display = 'none';
        loginMessage.textContent = '';
        helpContainer.style.display = 'flex'; // Restore help container
    }, 300);
    mainContent.style.display = 'block';
});

document.querySelector('.login-close').addEventListener('click', () => {
    document.getElementById('cancelLogin').click();
});
// Update the submitLogin event listener in your popup.js
// Find and update the submitLogin event listener in popup.js
submitLogin.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    updateCreditInfo();
    if (!email || !password) {
        loginMessage.textContent = 'Please enter both email and password.';
        return;
    }

    loginMessage.textContent = 'Signing in...';

    try {
        /**
         * Supabase, not WordPress. The token it issues is verified by the API
         * against Supabase's published keys; the session, including the refresh
         * token, is stored by pcAuth.
         */
        await pcAuth.signIn(email, password);
        invalidateStyleReferencesCache();
        await completeSignIn();
    } catch (error) {
        loginMessage.textContent = error.message || 'Sign-in failed. Please check your credentials.';
        console.error('Login error:', error);
    }
});

/**
 * Everything that has to happen once a session exists, shared by the email and
 * Google paths: read the tier off the API, then rebuild the dropdowns, since
 * which options are selectable depends on it.
 */
async function completeSignIn() {
        const premium = await pcApi.request('/test-premium', { method: 'GET' });
        if (premium.ok) {
            isPremiumUser = premium.data?.is_premium || false;
            username = premium.data?.display_name || premium.data?.user_id || 'User';
        } else {
            // Signed in, but the tier could not be read. Free is the safe
            // assumption: it locks premium options rather than offering ones
            // the API would then refuse.
            isPremiumUser = false;
            const session = await pcAuth.readSession();
            username = pcAuth.displayNameOf(session && session.user);
            console.warn('Could not read premium status:', premium.data?.error);
        }

        await new Promise((resolve) => {
            chrome.storage.local.set({
                isPremiumUser: isPremiumUser,
                username: username
            }, resolve);
        });

        isLoggedIn = true;

        // Hide the login form and show the main content
        loginMessage.textContent = '';
        loginForm.style.display = 'none';
        loginForm.classList.remove('active');
        mainContent.style.display = 'block';

        // Find all existing custom select wrappers and remove them
        document.querySelectorAll('.select-wrapper').forEach(wrapper => {
            wrapper.remove();
        });

        // Show the original select elements temporarily
        const selectElements = ['styleSelect', 'cameraAngleSelect', 'lightingSelect', 'purposeSelect'];
        selectElements.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.style.display = 'block';
            }
        });

        // Rebuild all dropdowns with the new premium status
        const customSelects = {
            'styleSelect': createCustomSelect(document.getElementById('styleSelect'), 'styles'),
            'cameraAngleSelect': createCustomSelect(document.getElementById('cameraAngleSelect'), 'cameraangles'),
            'lightingSelect': createCustomSelect(document.getElementById('lightingSelect'), 'lightings'),
            'purposeSelect': createCustomSelect(document.getElementById('purposeSelect'), 'purposes')
        };

        // Hide the original select elements again
        selectElements.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.style.display = 'none';
            }
        });

        // Update UI for login status
        updateUIForLoginStatus();

        // Force refresh style references if on the Style Codes tab
        const styleRefsTab = document.getElementById('styleRefsTab');
        if (styleRefsTab.classList.contains('active')) {
            localStorage.removeItem(STYLE_REFS_CACHE_KEY);
            localStorage.removeItem(STYLE_REFS_CACHE_EXPIRY_KEY);
            await loadStyleReferences(true);
        }

        // Restore saved selections after rebuilding dropdowns
        loadSelections();

        // Credits belong to the account, so the anonymous figure on screen is
        // now wrong.
        updateCreditInfo();
        startCreditUpdates();
}

/**
 * Google sign-in.
 *
 * Runs through Supabase in a browser-managed auth window, so no Google password
 * is ever typed into the extension and nothing needs a Google Cloud change.
 */
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        loginMessage.textContent = 'Opening Google sign-in...';
        googleSignInBtn.disabled = true;

        try {
            await pcAuth.signInWithGoogle();
            invalidateStyleReferencesCache();
            await completeSignIn();
        } catch (error) {
            // Closing the window is a decision, not a fault worth shouting about.
            const cancelled = /cancel|closed by user|user did not approve/i.test(error.message || '');
            loginMessage.textContent = cancelled ? '' : (error.message || 'Google sign-in failed.');
            if (!cancelled) console.error('Google sign-in error:', error);
        } finally {
            googleSignInBtn.disabled = false;
        }
    });
}
// Update the logout event listener
logoutIcon.addEventListener('click', () => {
     invalidateStyleReferencesCache();
    /**
     * pcAuth.signOut clears the session locally first and only then tells
     * Supabase, so a network failure cannot leave someone looking at a
     * signed-in extension after asking to leave. The rest of the teardown runs
     * either way.
     */
    pcAuth.signOut().finally(() => {
        updateCreditInfo();
        isLoggedIn = false;
        isPremiumUser = false;

        // Remove all existing custom select wrappers
        document.querySelectorAll('.select-wrapper').forEach(wrapper => {
            wrapper.remove();
        });

        // Show the original select elements temporarily
        const selectElements = ['styleSelect', 'cameraAngleSelect', 'lightingSelect', 'purposeSelect'];
        selectElements.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.style.display = 'block';
                select.value = 'not_specified'; // Reset to default value
                localStorage.setItem(id.replace('Select', ''), 'not_specified'); // Update localStorage
            }
        });

        // Rebuild all dropdowns with free user status
        rebuildDropdown(false); // Rebuild style dropdown
        rebuildCameraAnglesDropdown(false); // Rebuild camera angles dropdown
        rebuildLightingDropdown(false); // Rebuild lighting dropdown
        rebuildPurposeDropdown(false); // Rebuild purpose dropdown

        // Hide the original select elements again
        selectElements.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.style.display = 'none';
            }
        });

        // Create new custom select dropdowns
        const customSelects = {
            'styleSelect': createCustomSelect(document.getElementById('styleSelect'), 'styles'),
            'cameraAngleSelect': createCustomSelect(document.getElementById('cameraAngleSelect'), 'cameraangles'),
            'lightingSelect': createCustomSelect(document.getElementById('lightingSelect'), 'lightings'),
            'purposeSelect': createCustomSelect(document.getElementById('purposeSelect'), 'purposes')
        };

        // Clear any previews and cached data
        localStorage.removeItem('previews');
        localStorage.removeItem('disabledButtons');
        
        // Hide preview box if visible
        const previewBox = document.getElementById('previewBox');
        if (previewBox) {
            previewBox.style.display = 'none';
            previewBox.style.opacity = '0';
            const previewImage = previewBox.querySelector('img');
            if (previewImage) {
                previewImage.src = '';
            }
        }

        // Force refresh style references if on that tab
        const styleRefsTab = document.getElementById('styleRefsTab');
        if (styleRefsTab.classList.contains('active')) {
            localStorage.removeItem(STYLE_REFS_CACHE_KEY);
            localStorage.removeItem(STYLE_REFS_CACHE_EXPIRY_KEY);
            loadStyleReferences(true);
        }

        // Update the UI for login status
        updateUIForLoginStatus();

        // Force reload of selections from localStorage
        loadSelections();
    });
});
function showCustomPromptDialog(collectionId) {
    const dialog = document.createElement('div');
    dialog.className = 'custom-prompt-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <div class="dialog-header">
                <h3>Add Custom Prompt</h3>
                <button class="dialog-close">&times;</button>
            </div>
            <textarea 
                id="customPromptInput" 
                placeholder="Enter your custom prompt here..."
                maxlength="2000"
            ></textarea>
            <div class="dialog-footer">
                <button class="dialog-cancel-btn">Cancel</button>
                <button class="dialog-confirm-btn">Add to Collection</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Show dialog with animation
    requestAnimationFrame(() => {
        dialog.classList.add('active');
    });

    // Set up event listeners
    const closeBtn = dialog.querySelector('.dialog-close');
    const cancelBtn = dialog.querySelector('.dialog-cancel-btn');
    const confirmBtn = dialog.querySelector('.dialog-confirm-btn');
    const textarea = dialog.querySelector('#customPromptInput');

    const closeDialog = () => {
        dialog.classList.remove('active');
        setTimeout(() => dialog.remove(), 300);
    };

    closeBtn.addEventListener('click', closeDialog);
    cancelBtn.addEventListener('click', closeDialog);

    confirmBtn.addEventListener('click', () => {
        const promptText = textarea.value.trim();
        if (promptText) {
            collectionsManager.addPromptToCollection(collectionId, promptText);
            collectionsManager.showToast('Custom prompt added to collection');
        }
        closeDialog();
    });

    // Close on click outside
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeDialog();
        }
    });

    // Focus textarea
    textarea.focus();
}
// Add this helper function if it doesn't exist
function hidePreview() {
    const previewBox = document.getElementById('previewBox');
    if (previewBox) {
        previewBox.style.opacity = '0';
        previewBox.style.transform = 'scale(0.95)';
        setTimeout(() => {
            previewBox.style.display = 'none';
        }, 300);
    }
}
function checkAndShowRatePopup() {
    chrome.storage.local.get(['hasRated', 'promptCount', 'nextPopupDate'], (result) => {
        const now = Date.now();
        const hasRated = result.hasRated || false;
        const promptCount = result.promptCount || 0;
        const nextPopupDate = result.nextPopupDate || 0;
        
        // Show popup if user hasn't rated, has generated at least 5 prompts,
        // and current time is past the next popup date
        if (!hasRated && promptCount >= 10 && now >= nextPopupDate) {
            showRatePopup();
        }
    });
}


function showRatePopup() {
    const ratePopup = document.getElementById('ratePopup');
    const closeBtn = ratePopup.querySelector('.rate-close');
    const laterBtn = ratePopup.querySelector('.rate-later-btn');
    const rateBtn = ratePopup.querySelector('.rate-now-btn');
    const stars = ratePopup.querySelectorAll('.star');
    
    // Show popup with animation
    ratePopup.style.display = 'flex';
    setTimeout(() => {
        ratePopup.classList.add('active');
    }, 10);

    // Star rating functionality
    stars.forEach((star, index) => {
        star.addEventListener('mouseover', () => {
            stars.forEach((s, i) => {
                s.classList.toggle('active', i <= index);
            });
        });
    });

    // Remove star highlighting when mouse leaves
    document.querySelector('.rate-stars').addEventListener('mouseleave', () => {
        stars.forEach(star => star.classList.remove('active'));
    });

    // Handle close button
    closeBtn.addEventListener('click', () => {
        ratePopup.classList.remove('active');
        setTimeout(() => {
            ratePopup.style.display = 'none';
        }, 300);
    });

    // Handle "Maybe Later" button
    laterBtn.addEventListener('click', () => {
        ratePopup.classList.remove('active');
        setTimeout(() => {
            ratePopup.style.display = 'none';
        }, 300);
        
        // Set next popup to show tomorrow
        const tomorrow = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
        chrome.storage.local.set({ nextPopupDate: tomorrow });
    });
    // Handle "Rate Now" button
    rateBtn.addEventListener('click', () => {
        chrome.storage.local.set({ hasRated: true }, () => {
            window.open('https://chrome.google.com/webstore/detail/hehieakgdbakdajfpekgmfckplcjmgcf/reviews', '_blank');
            ratePopup.classList.remove('active');
            setTimeout(() => {
                ratePopup.style.display = 'none';
            }, 300);
        });
    });
}
chrome.storage.local.get(['nextPopupDate'], (result) => {
    if (result.nextPopupDate === undefined) {
        chrome.storage.local.set({ nextPopupDate: 0 });
    }
});

// Track prompt generations
function incrementPromptCount() {
    chrome.storage.local.get(['promptCount'], (result) => {
        const newCount = (result.promptCount || 0) + 1;
        chrome.storage.local.set({ promptCount: newCount }, () => {
            checkAndShowRatePopup();
        });
    });
}

// Initialize install date if not set
chrome.storage.local.get(['installDate'], (result) => {
    if (!result.installDate) {
        chrome.storage.local.set({ installDate: Date.now() });
    }
});
async function generateShortenedPrompts(promptText) {
    if (!promptText) {
        resultElem.textContent = 'Please select a prompt to shorten.';
        return;
    }

    setLoading(true, 'Generating shorter variations, please wait...');
    switchTab('generated');
    loadingElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const headers = await pcApi.headers();

        const response = await fetch(pcApi.url('/generate-shortened'), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ prompt: promptText })
        });

        if (await pcApi.isSessionExpired(response)) {
            handleAuthError();
            return;
        }

        const data = await response.json();

        if (pcApi.isTerminal(response, data)) {
            showUpgradePrompt(resultElem);
            console.warn('Refused:', data?.code, data?.error);
            return;
        } else if (response.ok) {
            displayPrompts(data.shortened || 'Failed to generate shortened prompts');
             savePrompts(data.shortened, true, promptText);
            console.log('Shortened prompts generated successfully.');
        } else {
            resultElem.textContent = pcApi.errorMessage(data);
        }
    } catch (error) {
        resultElem.textContent = 'An error occurred. Please try again.';
        console.error('Error generating shortened prompts:', error);
    } finally {
        setLoading(false);
    }
}
const userGreeting = document.getElementById('userGreeting');
const freeOptions = [
    { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'realism', text: 'Photorealism', preview: 'realism-preview.png' },
    { value: 'pixel_art', text: 'Pixel Art', preview: 'pixel-art-preview.png' },
    { value: 'impressionism', text: 'Impressionism', preview: 'impressionism-preview.png' },
    { value: 'pop_art', text: 'Pop Art', preview: 'popart-preview.png' },
    { value: 'vintage', text: 'Vintage', preview: 'vintage-preview.png' },
    { value: 'hand_drawn', text: 'Hand-Drawn', preview: 'hand-drawn-preview.png' },
    { value: 'abstract', text: 'Abstract', preview: 'abstract-preview.png' },
    { value: 'minimalism', text: 'Minimalism', preview: 'minimalism-preview.png' },
    { value: 'cartoon', text: 'Cartoon', preview: 'cartoon-preview.png' },
    { value: 'surrealism', text: 'Surrealism', preview: 'surrealism-preview.png' },
    { value: 'weirdcore', text: 'Weirdcore', preview: 'weirdcore-preview.png' },
];

const premiumOptions = [
  { value: 'cyberpunk', text: 'Cyberpunk (Premium)', preview: 'cyberpunk-preview.png' },
{ value: 'baroque', text: 'Baroque (Premium)', preview: 'baroque-preview.png' },
{ value: 'steampunk', text: 'Steampunk (Premium)', preview: 'steampunk-preview.png' },
{ value: 'futurism', text: 'Futurism (Premium)', preview: 'futurism-preview.png' },
{ value: 'neo_noir', text: 'Neo-noir (Premium)', preview: 'neo_noir-preview.png' },
{ value: 'vaporwave', text: 'Vaporwave (Premium)', preview: 'vaporwave-preview.png' },
{ value: 'anime', text: 'Anime (Premium)', preview: 'anime-preview.png' },
{ value: 'gothic', text: 'Gothic (Premium)', preview: 'gothic-preview.png' },
{ value: 'fantasy', text: 'Fantasy (Premium)', preview: 'fantasy-preview.png' },
{ value: 'art_nouveau', text: 'Art Nouveau (Premium)', preview: 'art-nouveau-preview.png' },
{ value: 'synthwave', text: 'Synthwave (Premium)', preview: 'synthwave-preview.png' },
{ value: 'renaissance', text: 'Renaissance (Premium)', preview: 'renaissance-preview.png' },
{ value: 'ukiyo_e', text: 'Ukiyo-e (Premium)', preview: 'ukiyo-e-preview.png' },
{ value: 'bauhaus', text: 'Bauhaus (Premium)', preview: 'bauhaus-preview.png' },
{ value: 'art_deco', text: 'Art Deco (Premium)', preview: 'art-deco-preview.png' },
{ value: 'hyperrealism', text: 'Hyperrealism (Premium)', preview: 'hyperrealism-preview.png' },
{ value: 'dieselpunk', text: 'Dieselpunk (Premium)', preview: 'dieselpunk-preview.png' },
{ value: 'dark_fantasy', text: 'Dark Fantasy (Premium)', preview: 'dark-fantasy-preview.png' },
{ value: 'retro_futurism', text: 'Retro-Futurism (Premium)', preview: 'retro-futurism-preview.png' },
{ value: 'cubism', text: 'Cubism (Premium)', preview: 'cubism-preview.png' },
{ value: 'expressionism', text: 'Expressionism (Premium)', preview: 'expressionism-preview.png' },
{ value: 'fauvism', text: 'Fauvism (Premium)', preview: 'fauvism-preview.png' },
{ value: 'graffiti', text: 'Graffiti (Premium)', preview: 'graffiti-preview.png' },
{ value: 'pointillism', text: 'Pointillism (Premium)', preview: 'pointillism-preview.png' },
{ value: 'watercolor', text: 'Watercolor (Premium)', preview: 'watercolor-preview.png' },
{ value: 'sketch', text: 'Sketch (Premium)', preview: 'sketch-preview.png' },
{ value: 'charcoal', text: 'Charcoal (Premium)', preview: 'charcoal-preview.png' },
{ value: 'pastel', text: 'Pastel (Premium)', preview: 'pastel-preview.png' },
{ value: 'collage', text: 'Collage (Premium)', preview: 'collage-preview.png' },
{ value: 'manga', text: 'Manga (Premium)', preview: 'manga-preview.png' },
{ value: 'comic_book', text: 'Comic Book (Premium)', preview: 'comic-book-preview.png' },
{ value: 'doodle', text: 'Doodle (Premium)', preview: 'doodle-preview.png' },
{ value: 'geometric', text: 'Geometric (Premium)', preview: 'geometric-preview.png' },
{ value: 'psychedelic', text: 'Psychedelic (Premium)', preview: 'psychedelic-preview.png' },
{ value: 'low_poly', text: 'Low Poly (Premium)', preview: 'low-poly-preview.png' },
{ value: 'rococo', text: 'Rococo (Premium)', preview: 'rococo-preview.png' },
{ value: 'pre_raphaelite', text: 'Pre-Raphaelite (Premium)', preview: 'pre-raphaelite-preview.png' },
{ value: 'post_impressionism', text: 'Post-Impressionism (Premium)', preview: 'post-impressionism-preview.png' },
{ value: 'constructivism', text: 'Constructivism (Premium)', preview: 'constructivism-preview.png' },
{ value: 'suprematism', text: 'Suprematism (Premium)', preview: 'suprematism-preview.png' },
{ value: 'dadaism', text: 'Dadaism (Premium)', preview: 'dadaism-preview.png' },
{ value: 'neoclassicism', text: 'Neoclassicism (Premium)', preview: 'neoclassicism-preview.png' },
{ value: 'romanticism', text: 'Romanticism (Premium)', preview: 'romanticism-preview.png' },
{ value: 'kinetic_art', text: 'Kinetic Art (Premium)', preview: 'kinetic-art-preview.png' },
{ value: 'op_art', text: 'Op Art (Premium)', preview: 'op-art-preview.png' },
{ value: 'etching', text: 'Etching (Premium)', preview: 'etching-preview.png' },
{ value: 'trompe_loeil', text: 'Trompe-l\'œil (Premium)', preview: 'trompe-l’œil-preview.png' },
{ value: 'fractals', text: 'Fractals (Premium)', preview: 'fractals-preview.png' },
{ value: 'hyperpop', text: 'Hyperpop (Premium)', preview: 'hyperpop-preview.png' },

{ value: 'dreamcore', text: 'Dreamcore (Premium)', preview: 'dreamcore-preview.png' },
{ value: 'papercut', text: 'Papercut (Premium)', preview: 'papercut-preview.png' },
{ value: 'engraving', text: 'Engraving (Premium)', preview: 'engraving-preview.png' },
{ value: 'ink_wash', text: 'Ink Wash (Premium)', preview: 'ink-wash-preview.png' },
{ value: 'chalk', text: 'Chalk (Premium)', preview: 'chalk-preview.png' },
{ value: 'biopunk', text: 'Biopunk (Premium)', preview: 'biopunk-preview.png' },
{ value: 'solarpunk', text: 'Solarpunk (Premium)', preview: 'solarpunk-preview.png' }
];


// Free Camera Angles
const freeCameraAngles = [
     { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'wide_angle', text: 'Wide Angle', preview: 'wide-angle-preview.png' },
    { value: 'close_up', text: 'Close Up', preview: 'close-up-preview.png' },
    { value: 'eye_level', text: 'Eye Level', preview: 'eye-level-preview.png' },
    { value: 'low_angle', text: 'Low Angle', preview: 'low-angle-preview.png' },
    { value: 'high_angle', text: 'High Angle', preview: 'high-angle-preview.png' },
    { value: 'dutch_angle', text: 'Dutch Angle', preview: 'dutch-angle-preview.png' },
    { value: 'over_the_shoulder', text: 'Over the Shoulder', preview: 'over-the-shoulder-preview.png' },
    { value: 'birds_eye_view', text: 'Bird\'s Eye View', preview: 'birds-eye-view-preview.png' },
    { value: 'worm_eye_view', text: 'Worm\'s Eye View', preview: 'worm-eye-view-preview.png' }
];


// Premium Camera Angles
const premiumCameraAngles = [
    { value: 'fisheye', text: 'Fisheye (Premium)', preview: 'fisheye-preview.png' },
    { value: 'tilt_shift', text: 'Tilt-shift (Premium)', preview: 'tilt-shift-preview.png' },
    { value: 'macro', text: 'Macro (Premium)', preview: 'macro-preview.png' },
    { value: 'panoramic', text: 'Panoramic View (Premium)', preview: 'panoramic-view-preview.png' },
    { value: 'extreme_close_up', text: 'Extreme Close-Up (Premium)', preview: 'extreme-close-up-preview.png' },
    // New Premium Camera Angles
    { value: 'drone', text: 'Drone View (Premium)', preview: 'drone-view-preview.png' },
    { value: 'split_view', text: 'Split View (Premium)', preview: 'split-view-preview.png' },
    { value: 'orbital', text: 'Orbital Shot (Premium)', preview: 'orbital-preview.png' },
    { value: 'dolly_zoom', text: 'Dolly Zoom (Premium)', preview: 'dolly-zoom-preview.png' },
    { value: 'underwater', text: 'Underwater (Premium)', preview: 'underwater-preview.png' },
    { value: 'isometric', text: 'Isometric (Premium)', preview: 'isometric-preview.png' },
    { value: 'first_person', text: 'First Person POV (Premium)', preview: 'first-person-preview.png' },
    { value: 'symmetrical', text: 'Symmetrical (Premium)', preview: 'symmetrical-preview.png' },
    { value: 'spiral', text: 'Spiral Shot (Premium)', preview: 'spiral-preview.png' },
    { value: 'vertigo', text: 'Vertigo Effect (Premium)', preview: 'vertigo-preview.png' }
];

// Free Lighting
const freeLighting = [
     { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'natural', text: 'Natural', preview: 'natural-preview.png' },
    { value: 'studio', text: 'Studio', preview: 'studio-preview.png' },
    { value: 'dramatic', text: 'Dramatic', preview: 'dramatic-preview.png' },
    { value: 'backlight', text: 'Backlight', preview: 'backlight-preview.png' },
    { value: 'soft', text: 'Soft', preview: 'soft-preview.png' },
    { value: 'hard', text: 'Hard', preview: 'hard-preview.png' },
    { value: 'cinematic', text: 'Cinematic', preview: 'cinematic-preview.png' },
    { value: 'low_key', text: 'Low Key', preview: 'low-key-preview.png' },
    { value: 'high_key', text: 'High Key', preview: 'high-key-preview.png' }
];

// Premium Lighting
const premiumLighting = [
    { value: 'golden_hour', text: 'Golden Hour (Premium)', preview: 'golden_hour-preview.png' },
    { value: 'neon', text: 'Neon Lighting (Premium)', preview: 'neon-preview.png' },
    { value: 'volumetric', text: 'Volumetric Light (Premium)', preview: 'volumetric-preview.png' },
    { value: 'silhouette', text: 'Silhouette Lighting (Premium)', preview: 'silhouette-preview.png' },
    { value: 'moonlight', text: 'Moonlight (Premium)', preview: 'moonlight-preview.png' },
    // New Premium Lighting Options
    { value: 'bioluminescent', text: 'Bioluminescent (Premium)', preview: 'bioluminescent-preview.png' },
    { value: 'chiaroscuro', text: 'Chiaroscuro (Premium)', preview: 'chiaroscuro-preview.png' },
    { value: 'rainbow', text: 'Rainbow Lighting (Premium)', preview: 'rainbow-preview.png' },
    { value: 'northern_lights', text: 'Northern Lights (Premium)', preview: 'northern-lights-preview.png' },
    { value: 'laser', text: 'Laser Lighting (Premium)', preview: 'laser-preview.png' },
    { value: 'underwater_caustics', text: 'Underwater Caustics (Premium)', preview: 'underwater-caustics-preview.png' },
    { value: 'fire_light', text: 'Fire Light (Premium)', preview: 'fire-light-preview.png' },
    { value: 'crystal_refraction', text: 'Crystal Refraction (Premium)', preview: 'crystal-refraction-preview.png' },
    { value: 'star_field', text: 'Star Field (Premium)', preview: 'star-field-preview.png' },
    { value: 'lightning', text: 'Lightning Flash (Premium)', preview: 'lightning-preview.png' }
];
const videoFreeLighting = [
    { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'natural', text: 'Natural', preview: 'natural-preview.png' },
    { value: 'studio', text: 'Studio', preview: 'studio-preview.png' },
    { value: 'dramatic', text: 'Dramatic', preview: 'dramatic-preview.png' },
    { value: 'backlight', text: 'Backlight', preview: 'backlight-preview.png' },
    { value: 'soft', text: 'Soft', preview: 'soft-preview.png' },
    { value: 'hard', text: 'Hard', preview: 'hard-preview.png' },
    { value: 'cinematic', text: 'Cinematic', preview: 'cinematic-preview.png' },
    { value: 'low_key', text: 'Low Key', preview: 'low-key-preview.png' },
    { value: 'high_key', text: 'High Key', preview: 'high-key-preview.png' }
];

// Video Premium Lighting Options
const videoPremiumLighting = [
    { value: 'golden_hour', text: 'Golden Hour (Premium)', preview: 'golden_hour-preview.png' },
    { value: 'neon', text: 'Neon Lighting (Premium)', preview: 'neon-preview.png' },
    { value: 'volumetric', text: 'Volumetric Light (Premium)', preview: 'volumetric-preview.png' },
    { value: 'silhouette', text: 'Silhouette Lighting (Premium)', preview: 'silhouette-preview.png' },
    { value: 'moonlight', text: 'Moonlight (Premium)', preview: 'moonlight-preview.png' },
    { value: 'bioluminescent', text: 'Bioluminescent (Premium)', preview: 'bioluminescent-preview.png' },
    { value: 'chiaroscuro', text: 'Chiaroscuro (Premium)', preview: 'chiaroscuro-preview.png' },
    { value: 'rainbow', text: 'Rainbow Lighting (Premium)', preview: 'rainbow-preview.png' },
    { value: 'northern_lights', text: 'Northern Lights (Premium)', preview: 'northern-lights-preview.png' },
    { value: 'laser', text: 'Laser Lighting (Premium)', preview: 'laser-preview.png' }
];
const freePurposes = [
    { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'stock_photo', text: 'Stock Photo', preview: 'stock-photo-preview.png' },
    { value: 'product_photo', text: 'Product Photo', preview: 'product-photo-preview.png' },
    { value: 'portrait', text: 'Portrait', preview: 'portrait-preview.png' },
     { value: 'sticker_design', text: 'Sicker Design', preview: 'sticker-design-preview.png' },
     { value: 'npc_portrait', text: 'NPC Portrait', preview: 'npc-portrait-preview.png' },
    { value: 'poster', text: 'Poster', preview: 'poster-preview.png' },
    { value: 'book_cover', text: 'Book Cover', preview: 'book-cover-preview.png' },
    { value: 'wallpaper', text: 'Wallpaper', preview: 'wallpaper-preview.png' },
    { value: 'logo', text: 'Logo', preview: 'logo-preview.png' },
    { value: 'landscape', text: 'Landscape', preview: 'landscape-preview.png' },
    { value: 'character_illustration', text: 'Character Illustration', preview: 'character-illustration-preview.png' },
     { value: 'coloring_page', text: 'Coloring Page', preview: 'coloring-page-preview.png' },
    { value: 'food_photo', text: 'Food Photography', preview: 'food-photo-preview.png' },
    { value: 'interior_design', text: 'Interior Design', preview: 'interior-design-preview.png' },
     { value: 'fashion_photo', text: 'Fashion Photography', preview: 'fashion-photo-preview.png' },
    { value: 'nature_macro', text: 'Nature Macro', preview: 'nature-macro-preview.png' },
    { value: 'scientific_illustration', text: 'Scientific Illustration', preview: 'scientific-illustration-preview.png' },
    { value: 'street_photo', text: 'Street Photography', preview: 'street-photo-preview.png' },
    { value: 'advertisement', text: 'Advertisement', preview: 'advertisement-preview.png' },
    { value: 'pet_portrait', text: 'Pet Portrait', preview: 'pet-portrait-preview.png' },
    { value: 'holiday_card', text: 'Holiday Card', preview: 'holiday-card-preview.png' },
   
    { value: 'tutorial_illustration', text: 'Tutorial Illustration', preview: 'tutorial-illustration-preview.png' },
    { value: 'event_photo', text: 'Event Photography', preview: 'event-photo-preview.png' },
     { value: 'concept_art', text: 'Concept Art', preview: 'concept-art-preview.png' },
     { value: 'illustration', text: 'Illustration', preview: 'illustration-preview.png' },
  
];
const videoStylePreviews = [
    { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'cinematic', text: 'Cinematic', preview: 'previews/video-styles/cinematic-preview.gif' },
    { value: 'documentary', text: 'Documentary', preview: 'previews/video-styles/documentary-preview.gif' },
    { value: 'music_video', text: 'Music Video', preview: 'previews/video-styles/music-video-preview.gif' },
    { value: 'animation', text: 'Animation', preview: 'previews/video-styles/animation-preview.gif' },
    // Premium styles
    { value: 'aerial', text: 'Aerial (Premium)', preview: 'previews/video-styles/aerial-preview.gif' },
    { value: 'experimental', text: 'Experimental (Premium)', preview: 'previews/video-styles/experimental-preview.gif' },
    { value: 'slow_motion', text: 'Slow Motion (Premium)', preview: 'previews/video-styles/slow-motion-preview.gif' },
    { value: 'time_lapse', text: 'Time Lapse (Premium)', preview: 'previews/video-styles/time-lapse-preview.gif' }
];

const videoMovementPreviews = [
    { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'static', text: 'Static', preview: 'previews/video-movements/static-preview.gif' },
    { value: 'pan', text: 'Pan', preview: 'previews/video-movements/pan-preview.gif' },
    { value: 'tracking_shot', text: 'Tracking Shot', preview: 'previews/video-movements/tracking-shot-preview.gif' },
    { value: 'dolly', text: 'Dolly', preview: 'previews/video-movements/dolly-preview.gif' },
    { value: 'crane_shot', text: 'Crane Shot', preview: 'previews/video-movements/crane-shot-preview.gif' },
    // Premium movements
    { value: 'orbit', text: 'Orbit (Premium)', preview: 'previews/video-movements/orbit-preview.gif' },
    { value: 'drone_fly', text: 'Drone Fly (Premium)', preview: 'previews/video-movements/drone-fly-preview.gif' },
    { value: 'steadicam', text: 'Steadicam (Premium)', preview: 'previews/video-movements/steadicam-preview.gif' },
    { value: 'vertical', text: 'Vertical (Premium)', preview: 'previews/video-movements/vertical-preview.gif' }
];

function createVideoCustomSelect(originalSelect, options, previewFolder) {
    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'select-wrapper video-select-wrapper';

    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';

    const trigger = document.createElement('div');
    trigger.className = 'select-trigger';

    const triggerText = document.createElement('span');
    // Get the selected option (initially, it will be the first option)
    const selectedOption = originalSelect.options[originalSelect.selectedIndex];
    triggerText.textContent = selectedOption.text.replace(' (Premium)', '');

    // Add the data-value attribute to the trigger text span
    triggerText.setAttribute('data-value', selectedOption.value);

    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    const previewGif = document.createElement('img');
    previewGif.className = 'preview-gif';

    if (selectedOption.value !== 'not_specified') {
        const selectedPreview = options.find(opt => opt.value === selectedOption.value)?.preview;
        if (selectedPreview) {
            previewGif.src = selectedPreview;
            previewGif.style.display = 'block';
        } else {
            previewGif.style.display = 'none';
        }
    } else {
        previewGif.style.display = 'none';
    }

    trigger.appendChild(triggerText);
    previewContainer.appendChild(previewGif);
    trigger.appendChild(previewContainer);
    customSelect.appendChild(trigger);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'select-options video-select-options';

    // Get premium status
    chrome.storage.local.get(['isPremiumUser'], (result) => {
        const isPremiumUser = result.isPremiumUser || false;

        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'select-option video-select-option';
            optionElement.setAttribute('data-value', option.value); // Set data-value on option

            if (option.value === 'not_specified') {
                optionElement.style.color = '#888';
            }

            const isPremiumOption = option.text.includes('(Premium)');
            if (isPremiumOption && !isPremiumUser) {
                optionElement.classList.add('disabled');
            }

            const optionContent = document.createElement('div');
            optionContent.className = 'option-content';

            const optionText = document.createElement('span');
            let displayText = option.text;
            if (displayText.includes('(Premium)')) {
                displayText = displayText.replace(' (Premium)', '');
                if (!isPremiumUser) {
                    const premiumLabel = document.createElement('span');
                    premiumLabel.className = 'premium-label';
                    premiumLabel.textContent = 'PREMIUM';
                    optionText.textContent = displayText;
                    optionText.appendChild(premiumLabel);
                } else {
                    optionText.textContent = displayText;
                }
            } else {
                optionText.textContent = displayText;
            }

            const optionPreview = document.createElement('img');
            optionPreview.className = 'preview-gif';

            if (option.value !== 'not_specified' && option.preview) {
                optionPreview.src = option.preview;
                optionPreview.style.display = 'block';
            } else {
                optionPreview.style.display = 'none';
            }

            optionContent.appendChild(optionText);
            optionContent.appendChild(optionPreview);
            optionElement.appendChild(optionContent);

            if (!(isPremiumOption && !isPremiumUser)) {
                optionElement.addEventListener('click', () => {
    originalSelect.value = option.value;
    triggerText.textContent = displayText;

    // Add this color styling logic
    if (option.value === 'not_specified') {
        triggerText.style.color = 'rgb(136, 136, 136)';
    } else {
        triggerText.style.removeProperty('color');
    }


                    if (option.value === 'not_specified') {
                        previewGif.style.display = 'none';
                        triggerText.style.color = '#888';
                    } else {
                        previewGif.src = option.preview;
                        previewGif.style.display = 'block';
                        triggerText.style.color = '';
                    }

                    optionsContainer.classList.remove('active');
                    const event = new Event('change');
                    originalSelect.dispatchEvent(event);
                    localStorage.setItem(originalSelect.id, option.value);
                });
            }

            optionsContainer.appendChild(optionElement);
        });
    });

    customSelect.appendChild(optionsContainer);
    selectWrapper.appendChild(customSelect);

    originalSelect.style.display = 'none';
    originalSelect.parentNode.insertBefore(selectWrapper, originalSelect);

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const allDropdowns = document.querySelectorAll('.select-options');

        allDropdowns.forEach(dropdown => {
            if (dropdown !== optionsContainer) {
                dropdown.classList.remove('active');
            }
        });

        optionsContainer.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        optionsContainer.classList.remove('active');
    });

    return {
        loadSelections: () => {
            const savedValue = localStorage.getItem(originalSelect.id);
            if (savedValue) {
                const option = options.find(opt => opt.value === savedValue);
                if (option) {
                    originalSelect.value = savedValue;
                    triggerText.textContent = option.text.replace(' (Premium)', '');
                    triggerText.setAttribute('data-value', option.value); // Update data-value on load

                    if (option.value === 'not_specified') {
                        previewGif.style.display = 'none';
                        triggerText.style.color = '#888';
                    } else {
                        previewGif.src = option.preview;
                        previewGif.style.display = 'block';
                        triggerText.style.color = '';
                    }
                }
            }
        }
    };
}

// Initialize video custom selects
function initVideoCustomSelects() {
    const videoStyleSelect = document.getElementById('videoStyleSelect');
    const videoMovementSelect = document.getElementById('videoMovementSelect');

    if (videoStyleSelect) {
        createVideoCustomSelect(videoStyleSelect, videoStylePreviews, 'video-styles');
    }
    
    if (videoMovementSelect) {
        createVideoCustomSelect(videoMovementSelect, videoMovementPreviews, 'video-movements');
    }
}
initVideoCustomSelects();

// Premium Purpose Options
const premiumPurposes = [
    { value: '3d_render', text: '3D Render (Premium)', preview: '3d-render-preview.png' },
    { value: 'character_sheet', text: 'Character Sheet (Premium)', preview: 'character-sheet-preview.png' },
     { value: 'game_asset', text: 'Game Asset (Premium)', preview: 'game-asset-preview.png' },
    { value: 'game_asset_2d', text: 'Game Asset 2D (Premium)', preview: 'game-asset-2d-preview.png' },
     { value: 'prop_design', text: 'Prop Design (Premium)', preview: 'prop-design-preview.png' },
    { value: 'isometric_map', text: 'Isometric Map (Premium)', preview: 'isometric-map-preview.png' },
    { value: 'board_game_art', text: 'Board Game Art (Premium)', preview: 'board-game-art-preview.png' },
    { value: 'game_icon', text: 'Game Icon (Premium)', preview: 'game-icon-preview.png' },
    { value: 'sprite_sheet', text: 'Sprite Sheet (Premium)', preview: 'sprite-sheet-preview.png' },
    { value: 'pixel_tile', text: 'Pixel Tiles (Premium)', preview: 'pixel-tile-preview.png' },
   { value: 'figurine_design', text: 'Figurine Design (Premium)', preview: 'figurine-design-preview.png' },
    { value: 'miniature_design', text: 'Miniature Design (Premium)', preview: 'miniature-design-preview.png' },
    { value: 'album_cover', text: 'Album Cover (Premium)', preview: 'album-cover-preview.png' },
   { value: 'game_ui', text: 'Game UI (Premium)', preview: 'game-ui-preview.png' },
     { value: 'achievement_badge', text: 'Achievement Badge (Premium)', preview: 'achievement-badge-preview.png' },
    { value: 'brochure_design', text: 'Brochure Design (Premium)', preview: 'brochure-design-preview.png' },
    { value: 'vehicle_turnaround', text: 'Vehicle Turnaround (Premium)', preview: 'vehicle-turnaround-preview.png' },
    { value: 'astronomical_illustration', text: 'Astronomical Illustration (Premium)', preview: 'astronomical-illustration-preview.png' },
        { value: 'splash_screen', text: 'Splash Screen (Premium)', preview: 'splash-screen-preview.png' },
   
    { value: 'biome_design', text: 'Biome Design (Premium)', preview: 'biome-design-preview.png' },
    { value: 'artifact_design', text: 'Artifact Design (Premium)', preview: 'artifact-design-preview.png' },
    { value: 'battle_scene', text: 'Battle Scene (Premium)', preview: 'battle-scene-preview.png' },
    { value: 'faction_banner', text: 'Faction Banner (Premium)', preview: 'faction-banner-preview.png' },
    { value: 'packaging', text: 'Packaging Design (Premium)', preview: 'packaging-preview.png' },
    { value: 'infographic', text: 'Infographic (Premium)', preview: 'infographic-preview.png' },
    { value: 'icon_set', text: 'Icon Set (Premium)', preview: 'icon-set-preview.png' },
    { value: 'textile', text: 'Textile Pattern (Premium)', preview: 'textile-preview.png' },
    { value: 'matte_painting', text: 'Matte Painting (Premium)', preview: 'matte-painting-preview.png' },
    { value: 'card_art', text: 'Trading Card Art (Premium)', preview: 'card-art-preview.png' },
  { value: 'language_flashcard', text: 'Language Flashcard (Premium)', preview: 'language-flashcard-preview.png' },
    { value: 'ui_element', text: 'UI Element (Premium)', preview: 'ui-element-preview.png' },
    { value: 'vehicle_design', text: 'Vehicle Design (Premium)', preview: 'vehicle-design-preview.png' },
    { value: 'weapon_design', text: 'Weapon Design (Premium)', preview: 'weapon-design-preview.png' },
    { value: 'creature_design', text: 'Creature Design (Premium)', preview: 'creature-design-preview.png' },
    { value: 'jewelry_design', text: 'Jewelry Design (Premium)', preview: 'jewelry-design-preview.png' },
   
    { value: 'token_design', text: 'Game Token (Premium)', preview: 'token-design-preview.png' },
  
    
    
    { value: 'vfx_concept', text: 'VFX Concept (Premium)', preview: 'vfx-concept-preview.png' },
    
    { value: 'robot_design', text: 'Robot Design (Premium)', preview: 'robot-design-preview.png' },
    { value: 'architecture_blueprint', text: 'Architecture Blueprint (Premium)', preview: 'architecture-blueprint-preview.png' },
    { value: 'fantasy_map', text: 'Fantasy Map (Premium)', preview: 'fantasy-map-preview.png' },
    { value: 'book_illustration', text: 'Book Illustration (Premium)', preview: 'book-illustration-preview.png' },
    { value: 'movie_poster', text: 'Movie Poster (Premium)', preview: 'movie-poster-preview.png' },
    { value: 'comic_panel', text: 'Comic Panel (Premium)', preview: 'comic-panel-preview.png' },
    { value: 'magazine_cover', text: 'Magazine Cover (Premium)', preview: 'magazine-cover-preview.png' },
    { value: 'sports_card', text: 'Sports Card (Premium)', preview: 'sports-card-preview.png' },
    { value: 'toy_design', text: 'Toy Design (Premium)', preview: 'toy-design-preview.png' },
    { value: 'vehicle_interior', text: 'Vehicle Interior (Premium)', preview: 'vehicle-interior-preview.png' },
    { value: 'mechanism_design', text: 'Mechanism Design (Premium)', preview: 'mechanism-design-preview.png' },
    { value: 'trophy_design', text: 'Trophy Design (Premium)', preview: 'trophy-design-preview.png' },
    { value: 'tarot_card', text: 'Tarot Card (Premium)', preview: 'tarot-card-preview.png' },
    { value: 'tattoo_design', text: 'Tattoo Design (Premium)', preview: 'tattoo-design-preview.png' },
    { value: 'childrens_illustration', text: 'Children\'s Illustration (Premium)', preview: 'childrens-illustration-preview.png' },
    { value: 'billboard_ad', text: 'Billboard Ad (Premium)', preview: 'billboard-ad-preview.png' },
    { value: 'cake_design', text: 'Cake Design (Premium)', preview: 'cake-design-preview.png' },
    { value: 'costume_design', text: 'Costume Design (Premium)', preview: 'costume-design-preview.png' },
    { value: 'diorama', text: 'Diorama (Premium)', preview: 'diorama-preview.png' },
    { value: 'dnd_top_down_map', text: 'DND Top Down Map (Premium)', preview: 'dnd-top-down-map-preview.png' },
    { value: 'fine_art_painting', text: 'Fine Art Painting (Premium)', preview: 'fine-art-painting-preview.png' },
    { value: 'flyer_design', text: 'Flyer Design (Premium)', preview: 'flyer-design-preview.png' },
    { value: 'furniture_design', text: 'Furniture Design (Premium)', preview: 'furniture-design-preview.png' },
   
    { value: 'knitted_design', text: 'Knitted Design (Premium)', preview: 'knitted-design-preview.png' },
    { value: 'mascot_character', text: 'Mascot Character (Premium)', preview: 'mascot-character-preview.png' },
    { value: 'personal_avatar', text: 'Personal Avatar (Premium)', preview: 'personal-avatar-preview.png' },
    { value: 'podcast_cover', text: 'Podcast Cover (Premium)', preview: 'podcast-cover-preview.png' },
    { value: 'sculpture_concept', text: 'Sculpture Concept (Premium)', preview: 'sculpture-concept-preview.png' },
    { value: 'tshirt_design', text: 'T-Shirt Design (Premium)', preview: 'tshirt-design-preview.png' },
    { value: 'vector_icon_single', text: 'Vector Icon Single (Premium)', preview: 'vector-icon-single-preview.png' },
    { value: 'visit_card', text: 'Visit Card (Premium)', preview: 'visit-card-preview.png' },
    { value: 'website_design', text: 'Website Design (Premium)', preview: 'website-design-preview.png' },
    { value: 'youtube_thumbnail', text: 'YouTube Thumbnail (Premium)', preview: 'youtube-thumbnail-preview.png' },
    { value: 'monster_evolution', text: 'Monster Evolution (Premium)', preview: 'monster-evolution-preview.png' },
    { value: 'urban_sketch', text: 'Urban Sketch (Premium)', preview: 'urban-sketch-preview.png' },
    { value: 'botanical_study', text: 'Botanical Study (Premium)', preview: 'botanical-study-preview.png' },
    { value: 'micro_world', text: 'Micro World (Premium)', preview: 'micro-world-preview.png' },
    { value: 'combat_stance', text: 'Combat Stance (Premium)', preview: 'combat-stance-preview.png' },
    { value: 'evolution_stage', text: 'Evolution Stage (Premium)', preview: 'evolution-stage-preview.png' },
   
    { value: 'graffiti_art', text: 'Graffiti Art (Premium)', preview: 'graffiti-art-preview.png' },
    { value: 'discord_banner', text: 'Discord Banner (Premium)', preview: 'discord-banner-preview.png' },
    { value: 'twitch_overlay', text: 'Twitch Overlay (Premium)', preview: 'twitch-overlay-preview.png' },
    { value: 'microscopy', text: 'Microscopy (Premium)', preview: 'microscopy-preview.png' },
       { value: 'emote', text: 'Emote/Emoji (Premium)', preview: 'emote-preview.png' },
    { value: 'social_media', text: 'Social Media (Premium)', preview: 'social-media-preview.png' },
        { value: 'storyboard', text: 'Storyboard (Premium)', preview: 'storyboard-preview.png' },
     { value: 'architectural', text: 'Architectural Visualization (Premium)', preview: 'architectural-preview.png' },
   
    { value: 'emoji', text: 'Emoji (Premium)', preview: 'emoji-preview.png' }

];
const videoFreeCameraAngles = [
    { value: 'not_specified', text: 'Not Specified', preview: '' },
    { value: 'wide_angle', text: 'Wide Angle', preview: 'wide-angle-preview.png' },
    { value: 'close_up', text: 'Close Up', preview: 'close-up-preview.png' },
    { value: 'eye_level', text: 'Eye Level', preview: 'eye-level-preview.png' },
    { value: 'low_angle', text: 'Low Angle', preview: 'low-angle-preview.png' },
    { value: 'high_angle', text: 'High Angle', preview: 'high-angle-preview.png' },
    { value: 'dutch_angle', text: 'Dutch Angle', preview: 'dutch-angle-preview.png' },
    { value: 'over_the_shoulder', text: 'Over the Shoulder', preview: 'over-the-shoulder-preview.png' },
    { value: 'birds_eye_view', text: "Bird's Eye View", preview: 'birds-eye-view-preview.png' },
    { value: 'worm_eye_view', text: "Worm's Eye View", preview: 'worm-eye-view-preview.png' }
];

// Video Premium Camera Angles
const videoPremiumCameraAngles = [
    { value: 'fisheye', text: 'Fisheye (Premium)', preview: 'fisheye-preview.png' },
    { value: 'tilt_shift', text: 'Tilt-shift (Premium)', preview: 'tilt-shift-preview.png' },
    { value: 'macro', text: 'Macro (Premium)', preview: 'macro-preview.png' },
    { value: 'panoramic', text: 'Panoramic View (Premium)', preview: 'panoramic-view-preview.png' },
    { value: 'extreme_close_up', text: 'Extreme Close-Up (Premium)', preview: 'extreme-close-up-preview.png' },
    { value: 'drone', text: 'Drone View (Premium)', preview: 'drone-view-preview.png' },
    { value: 'split_view', text: 'Split View (Premium)', preview: 'split-view-preview.png' },
    { value: 'orbital', text: 'Orbital Shot (Premium)', preview: 'orbital-preview.png' },
    { value: 'dolly_zoom', text: 'Dolly Zoom (Premium)', preview: 'dolly-zoom-preview.png' },
    { value: 'underwater', text: 'Underwater (Premium)', preview: 'underwater-preview.png' }
];
function rebuildVideoCameraAnglesDropdown(isPremiumUser) {
    const videoCameraAngleSelect = document.getElementById('videoCameraAngleSelect');
    videoCameraAngleSelect.innerHTML = '';  // Clear current options

    // Add free camera angles
    videoFreeCameraAngles.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        opt.setAttribute('data-preview', option.preview);
        videoCameraAngleSelect.appendChild(opt);
    });

    // Add premium camera angles
    videoPremiumCameraAngles.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;

        if (!isPremiumUser) {
            opt.disabled = true;
            opt.style.color = 'grey';
        } else {
            opt.textContent = option.text.replace(" (Premium)", "");
        }
        opt.setAttribute('data-preview', option.preview);
        videoCameraAngleSelect.appendChild(opt);
    });

    // Reset to the first option after rebuilding
    videoCameraAngleSelect.selectedIndex = 0;
}


// Function to rebuild purpose dropdown based on premium status
function rebuildPurposeDropdown(isPremiumUser) {
    const purposeSelect = document.getElementById('purposeSelect');
    const currentValue = purposeSelect.value;  // Store current selection
    purposeSelect.innerHTML = '';  // Clear current options

    // Add free purposes
    freePurposes.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        opt.setAttribute('data-preview', option.preview);
        purposeSelect.appendChild(opt);
    });

    // Add premium purposes
    premiumPurposes.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;

        if (!isPremiumUser) {
            opt.disabled = true;
            opt.style.color = 'grey';
        } else {
            opt.textContent = option.text.replace(" (Premium)", "");
        }
        opt.setAttribute('data-preview', option.preview);
        purposeSelect.appendChild(opt);
    });

    // Try to restore the previous selection if it's still valid
    if (currentValue) {
        const isValidOption = Array.from(purposeSelect.options)
            .some(option => option.value === currentValue && !option.disabled);
        
        if (isValidOption) {
            purposeSelect.value = currentValue;
        } else {
            purposeSelect.selectedIndex = 0;  // Default to first option if previous selection is invalid
            localStorage.setItem('purpose', purposeSelect.value);
        }
    } else {
        purposeSelect.selectedIndex = 0;  // Default to first option if no previous selection
        localStorage.setItem('purpose', purposeSelect.value);
    }
}

    const userIcon = document.getElementById('userIcon');
    const themeButton = document.querySelector('.theme-button'); // Add this line
userIcon.addEventListener('click', () => {
    updateCreditInfo();
    chrome.storage.local.get(['username'], (result) => {
        if (result.username) {
            usernameInput.value = result.username;
        }

    });
    
    // Update the next billing date

    profilePopup.style.display = 'flex';
    setTimeout(() => {
        profilePopup.classList.add('active');
    }, 10);
});
profileClose.addEventListener('click', () => {
    profilePopup.classList.remove('active');
    setTimeout(() => {
        profilePopup.style.display = 'none';
    }, 300);
});

saveUsernameBtn.addEventListener('click', async () => {
    const newUsername = usernameInput.value.trim();
    if (!newUsername) {
        return;
    }

    try {
        await new Promise((resolve, reject) => {
            chrome.storage.local.set({ username: newUsername }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });

        // Update greeting immediately
  
        if (userGreeting) {
            userGreeting.textContent = getRandomPremiumGreeting(newUsername);
        }

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'collections-toast success';
        successMessage.textContent = 'Display name updated successfully!';
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.classList.add('show');
        }, 10);

        setTimeout(() => {
            successMessage.classList.remove('show');
            setTimeout(() => successMessage.remove(), 300);
        }, 3000);

    } catch (error) {
        console.error('Error saving username:', error);
    }
});

// Update the showVideoPremiumPopup function
function showVideoPremiumPopup() {
    const popup = document.getElementById('videoPremiumPopup');
    if (!popup) return;

    // Show popup with fade in
    popup.style.display = 'flex';
    requestAnimationFrame(() => {
        popup.style.opacity = '1';
    });

    const closeBtn = popup.querySelector('.premium-close');
    const upgradeBtn = popup.querySelector('.upgrade-btn');

    const closePopup = () => {
        popup.style.opacity = '0';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    };

    // Handle close button click
    if (closeBtn) {
        closeBtn.addEventListener('click', closePopup);
    }

    // Handle upgrade button click
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            window.open('https://promptcatalyst.ai/premium', '_blank');
            closePopup();
        });
    }

    // Close when clicking outside the prompt
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closePopup();
        }
    });
}
// Close popup when clicking outside
profilePopup.addEventListener('click', (e) => {
    if (e.target === profilePopup) {
        profileClose.click();
    }
});
    // Function to update UI based on login status
    function updateUIForLoginStatus() {
        const userStatusElement = document.getElementById('userStatus');
        const getPremiumBtn = document.getElementById('getPremium');
        const loginIcon = document.getElementById('loginIcon');
        const logoutIcon = document.getElementById('logoutIcon');
        const userIcon = document.getElementById('userIcon');
        const header = document.querySelector('.header');
    
        if (themeButton) {
            themeButton.style.display = 'block';
        }
    
        if (isLoggedIn) {
            loginIcon.style.display = 'none';
            logoutIcon.style.display = 'inline';
            userIcon.style.display = 'inline';
            
            // Add logged-in class to container for ALL logged in users
            document.querySelector('.container').classList.add('logged-in');
    
            if (isPremiumUser) {
                header.classList.add('premium-header');
                header.classList.remove('free-header');
                premiumTitle.style.display = 'inline';
                freeTitle.style.display = 'none';
    
                const premiumGreeting = getRandomPremiumGreeting(username);
                userGreeting.textContent = premiumGreeting;
                userGreeting.classList.add('premium');
                userGreeting.style.display = 'block';
    
                requestAnimationFrame(() => {
                    userGreeting.classList.add('premium-animation');
                    setTimeout(() => {
                        userGreeting.classList.remove('premium-animation');
                    }, 1000);
                });
    
                getPremiumBtn.style.display = 'none';
            } else {
                // Free user UI
                premiumTitle.style.display = 'none';
                freeTitle.style.display = 'inline';
    
                header.classList.add('free-header');
                header.classList.remove('premium-header');
    
                userStatusElement.textContent = '';
                userStatusElement.classList.remove('premium-tag');
                
                // Removed the line that was removing logged-in class
                
                const selectedGreeting = selectGreeting();
                if (userGreeting) {
                    userGreeting.textContent = selectedGreeting;
                    userGreeting.classList.remove('premium');
                    userGreeting.classList.add('free');
                    userGreeting.style.display = 'block';
    
                    if (legendaryGreetings.has(selectedGreeting)) {
                        userGreeting.classList.add('legendary');
                        setTimeout(() => {
                            userGreeting.classList.remove('legendary');
                        }, 3000);
                    }
                }
    
                getPremiumBtn.style.display = 'block';
            }
        } else {
            // Not logged in state
            // Remove logged-in class for unauthorized users
            document.querySelector('.container').classList.remove('logged-in');
            
            const selectedGreeting = selectGreeting();
            if (userGreeting) {
                requestAnimationFrame(() => {
                    userGreeting.textContent = selectedGreeting;
                    userGreeting.classList.add('free');
                    userGreeting.style.display = 'block';
                    
                    if (legendaryGreetings.has(selectedGreeting)) {
                        userGreeting.classList.add('legendary');
                        setTimeout(() => {
                            userGreeting.classList.remove('legendary');
                        }, 3000);
                    }
                });
            }
    
            premiumTitle.style.display = 'none';
            freeTitle.style.display = 'inline';
            loginIcon.style.display = 'inline';
            logoutIcon.style.display = 'none';
            userIcon.style.display = 'none';
    
            getPremiumBtn.style.display = 'block';
    
            header.classList.add('free-header');
            header.classList.remove('premium-header');
        }
    }
    


const commonGreetings = [
   "AI prompting without the PhD required",
    "Where AI meets human chaos (in a good way)",
    "No artistic genes needed - we've got the AI for that",
    "Because staring at blank canvas isn't fun",
    "Making AI do the heavy lifting since 2024",
    
    // New Playful & Witty
    "Turning 'uhh...' into masterpieces since 2024",
    "Because your imagination deserves an AI sidekick",
    "Making AI art without the computer science degree",
    "Like having a million artists in your pocket",
    
    // Existing Pop Culture
    "May the prompts be with you",
    "Your AI sidekick has entered the chat",
    "Plot twist: You're about to create something awesome",
    "Resistance to creativity is futile",
    "To infinity and... well, you get the idea",
    
    // New Pop Culture
    "I'm not an AI, but I play one on the internet",
    "In a world where prompts make magic...",
    "Houston, we have a prompt solution",
    "The first rule of Prompt Club is: you must prompt",
    
    // Existing Premium Hints
    "Running on demo power (psst... premium is faster)",
    "Like what you see? Wait till you try premium mode",
    "The free version is cool, but premium has jets",
    
    // New Premium Hints
    "Dipping your toes in the AI ocean (premium lets you surf)",
    "Free version: Like premium's cool younger sibling",
    "Think this is good? Premium's got the cheat codes",
    "The appetizer before premium's main course",
    "Premium users are playing 4D chess, but this is nice too",
    
    // Existing Self-Aware
    "Warning: May cause sudden bursts of creativity",
    "Insert clever greeting here (we're still training the AI)",
    "Our AI is smart, but you're the boss. Usually.",
  
    
    // New Self-Aware
    "Prompt engineering: Because 'make it pretty' needs translation",
    "We speak AI so you don't have to",
    "Making AI bend to your will (most of the time)",
    "It's like telepathy, but with more typing",
    "Where 'make something cool' becomes actual art",
    
    // Existing Tech
    "Loading creativity.exe...",
    "Ctrl+Alt+Create something amazing",
    "sudo generate_awesome_prompt",
    
    // New Tech
    "Initializing imagination protocols...",
    "npm install creativity --save",
    "git commit -m 'added awesome'",
    "while(true) { generateArt(); }",
    "AI.exe has encountered a creative success",
    
    // Existing Casual
   
    "Think of us as your creative GPS, but less bossy",
    "Where procrastination meets productivity",
    
    // New Casual
    "Pull up a chair, the AI's just warming up",
    "Like having an art studio in your browser",
    "Where 'I can't draw' becomes 'look what I made'",
    "Creativity with extra processing power",
    
    "Think this is good? Premium hits different",
"The free preview of your creative empire",
"Premium users have more fun (we checked)",
"Premium's got the secret sauce, but this works too",
"Time to get crafty (•_•) ( •_•)>⌐■-■ (⌐■_■)",
    "POV: You're about to make something awesome",
    "Making art go brrrrrrr",

    
    // Existing Sarcastic
    "Not your grandma's prompt generator (unless she's cool)",
    "Because asking AI nicely works better than yelling",
    "Premium users are living in 2025, but this is nice too",
    
    // New Sarcastic
    "Making AI art without breaking the space-time continuum",
    "Like having an art degree, minus the student debt",
    "Because screaming 'make art' at your computer doesn't work",
    "It's like having an art team, but they're all robots",
    "We trained an AI to understand 'make it pop'",
    
    // Existing Creative Process
    "Where 'I have no idea' becomes 'I'm a genius'",
    
    "Your creative backup brain has booted up",
    
    // New Creative Process
    "Transforming keyboard smashing into art since 2024",
    "Your ideas + our AI = digital magic",
    

  
    "More reliable than your creative muse",
    "Better than asking your cat for ideas",
    
    // New Random Fun
    "Your ideas are about to get an upgrade",
    "Because your imagination deserves backup",
    "It's like autocomplete for creativity",
    "The closest thing to mind reading (but for art)",
    
    // Bold & Edgy
"Stealing jobs from starving artists since 2024",
"Making art school tuition feel really questionable",
"Because traditional artists needed more competition",
"Your art teachers were wrong - AI is the answer",
"Finally, talent without the decade of practice",
"Picasso never saw this coming",
"Making the Renaissance look like amateur hour",
"Da Vinci's worst nightmare, your new best friend",
"Art history, meet your midlife crisis",
"Because raw talent is overrated anyway",

// Rebellious Tech
"Democratizing art (artists hate this one trick)",
"Breaking the rules of traditional art since 2024",
"Why practice for years when you have algorithms?",
"Because drawing classes were too mainstream",
"Your shortcut to artistic greatness",
"Creative revolution in progress...",
"Art establishment currently sweating",

// Cheeky Premium Hints
"Like premium, but with training wheels and dad jokes",
"Dipping your toes in the AI art revolution",
"The art world's favorite party crasher",
"Your artistic rebellion starts here",

// Industry Disruption
"Making 'I could do that' actually true",
"Because commission artists needed more competition",
"Turning 'I have no artistic talent' into 'hold my beer'",
"Because practicing art was taking too long",
"Your portfolio's secret weapon",
"Making art galleries nervous since 2024",

// Provocative But Fun
"Creating masterpieces with zero talent required",
"Because who needs art school anyway?",
"Your ticket to the creative uprising",
"Making traditional artists question their life choices",
"Art history 2.0: The AI Revolution",

"Where impatience meets innovation",
// Playful Compliments
"Look who's back, our favorite prompt artist",
"The AI was getting bored without your creative genius",
"Oh great one, share your prompting wisdom",
"You're making the other AI users look bad",
"Bringing the spice to our bland AI existence",

// Ego Boosters with Humor
"Even the AI is impressed with your style",
"Your last prompts are still breaking the AI's brain",
"The AI requested you specifically",
"Your prompts > Shakespeare's sonnets",
"You're the reason we had to upgrade our servers",
"The AI's been practicing for your return",
"Too creative for conventional art tools",

// Collaborative Hype
"Dream team reunited: You + AI",
"The imagination extraordinaire has arrived",
"Partners in creative crime: You & AI",
"Back to push the AI's boundaries?",
"The AI's favorite troublemaker returns",
"Creative chaos coordinator: Reporting for duty",
"Making AI art look too easy since 2024",

// Playful Recognition
"The prompt master has entered the chat",
"Our algorithms perk up when you arrive",
"Back to break more creativity records?",
"Warning: Excessive imagination detected",
"Chief Imagination Officer detected",
      "My neural networks are tingling!",
    "Feeling particularly creative today (for an AI)",
    "Quantum creativity fluctuations detected",
    "My circuits are ready to assist!",
    "Beep boop... I mean, hello!",
    
];

const premiumGreetings = [
        
      "Back in the creative lab, [username]?",
    "Ready to bend reality to your will, [username]?",
    "Time to make the pixels dance, [username]",
    "Your imagination is the limit, [username] (and maybe physics)",
    "Let's make the impossible probable, [username]",
    
    // Tech Humor
    "System.out.println('Welcome back, [username]!')",
    "Found you in the creative cache, [username]",
    "def create_awesome(): return '[username]_ideas'",
    "AI.status = 'Ready to rock with [username]'",
    "Quantum creativity state: [username] detected",
    
    // Pop Culture
    "Welcome to the creativity matrix, [username]",
    "The force is strong with this one, [username]",
    "Player [username] has entered the creative game",
    "In a world where [username] creates...",
    "Bond. [username] Bond. Ready to create?",
    
    // Coffee & Creation
    "Caffeinated and ready to create, [username]?",
    "Converting coffee into digital art with [username]",
    "Brain: check. Coffee: check. [username]: check!",
    "Creativity levels: [username] powered",
    "Warning: [username]'s creativity is approaching critical mass",
    
    // Playful
    "Unleashing [username] on an unsuspecting AI",
    "Buckle up, [username], we're going creative",
    "Challenge accepted, [username]?",
    "Ready to make the internet jealous, [username]?",
    "Let's break the creativity meter, [username]",
    
    // Art & Creation
    "Your digital canvas awaits, [username]",
    "Paint the impossible with pixels, [username]",
    "Time to make reality optional, [username]",
    "Let's turn imagination into pixels, [username]",
    "Your creative department is booted up, [username]",
    
    // Collaborative
    "Dynamic duo: [username] + AI",
    "Dream team activated: [username] & algorithms",
    "Creative partnership loading: [username] edition",
    "The artist formerly known as [username] has arrived",
    "Mission control to Major [username]",
    
    // Programming Humor
    "git checkout [username]/creative-branch",
    "npm install [username]_imagination",
    "while(true) { create_with_[username](); }",
    "[username].exe is responding creatively",
    "sudo generate art --user=[username]",
    
    // Movie Style
    "Welcome to Creative Park, [username]",
    
    "[username]: Into the Creative-Verse",
    "The Creative Awakens with [username]",
    "Mission Possible: [username]'s Creative Protocol",
    
    // Encouraging
    "Let's make today's art tomorrow's inspiration, [username]",
    "Your creativity knows no bounds, [username]",
    "Reality is just a suggestion, [username]",
    "Time to make magic happen, [username]",
    "The digital canvas awaits your touch, [username]",
    
    // Quirky
    "Importing [username]_creative_chaos.module",
    "Creativity level: [username] activated",
    "Initializing [username]'s wild ideas protocol",
    "Warning: [username]'s imagination detected",
    "Creative mode: [username] edition",
    
    // Adventure
    "Adventure time with [username] and AI",
    "Your creative quest awaits, [username]",
    "Unlock new creative achievements, [username]",
    "Level up your imagination, [username]",
    "Boss level creativity unlocked, [username]",
    
    // Fun Random
    "Making pixels behave since you got here, [username]",
    "Transforming 'what if' into 'wow', [username]",
    "Digital dreams director: [username]",
    "Chief Imagination Officer [username] reporting for duty",
    "The creative laboratory is ready, Dr. [username]"
        
    ];
function getRandomPremiumGreeting(username) {
    const randomIndex = Math.floor(Math.random() * premiumGreetings.length);
    return premiumGreetings[randomIndex].replace("[username]", username);
}
// Rare greetings - 4% chance
const rareGreetings = [
    "L̷o̷a̷d̷i̷n̷g̷ ̷c̷r̷e̷a̷t̷i̷v̷i̷t̷y̷.̷e̷x̷e̷",
    "E̵r̵r̵o̵r̵:̵ ̵T̵o̵o̵ ̵m̵u̵c̵h̵ ̵c̵r̵e̵a̵t̵i̵v̵i̵t̵y̵ ̵d̵e̵t̵e̵c̵t̵e̵d̵",
    "👻 BOO! ...sorry, wrong AI",
    "🎲 Random greeting failed successfully",
    "¡ʎʇıʌıʇɐǝɹɔ ɹnoʎ uɹnʇ oʇ ʇoƃɹoɟ no⅄",
    "Loading greeting.exe... STACK OVERFLOW (jk)",
    "01001000 01101001 00100001 (That means Hi!)",
    "Warning: Creative mode activated ⚡",
    "System.out.println('Hello Creative Human!');",
    "Initializing creative protocols... ▓▓▓▓▓▓░░░░░ 60%",
    "Wow, you found a rare greeting! 🌟",
    "🎮 Achievement Unlocked: Opened Extension",
    "Connection established... in style 😎",
    "You've discovered a shiny greeting! ✨",
    "🎲 You rolled a natural 20 on creativity!"
];

// Seasonal greetings cache
const userGreetingElement = document.getElementById('userGreeting');

// Pre-compile regular expressions
const SEASONAL_DATE_PATTERNS = {
    halloween: date => date.getMonth() === 9 && date.getDate() >= 24,
    christmas: date => date.getMonth() === 11 && date.getDate() >= 15,
    newYear: date => date.getMonth() === 0 && date.getDate() <= 7,
    valentine: date => date.getMonth() === 1 && date.getDate() >= 7 && date.getDate() <= 14
};

// Use Sets for faster lookup
const legendaryGreetings = new Set([
    "🌈 LEGENDARY GREETING UNLOCKED 🌈",
    "✨ You've discovered an epic greeting (0.5% chance)!",
    "🎊 JACKPOT! You hit the rare greeting lottery!",
    "🎰 777 - LUCKY GREETING ACHIEVED!",
    "🦄 A wild creative unicorn appears!"
]);

// Cache seasonal greetings with memoization
const getSeasonalGreetings = (() => {
    let cachedGreetings = null;
    let lastCheck = 0;
    const CACHE_DURATION = 3600000; // 1 hour

    return () => {
        const now = Date.now();
        if (cachedGreetings && (now - lastCheck < CACHE_DURATION)) {
            return cachedGreetings;
        }

        const date = new Date();
        cachedGreetings = [];
        
        if (SEASONAL_DATE_PATTERNS.halloween(date)) {
            cachedGreetings.push("🎃 Spooky creative mode activated!");
        } else if (SEASONAL_DATE_PATTERNS.christmas(date)) {
            cachedGreetings.push("🎄 Ho ho ho! Creative bells jingling!");
        } else if (SEASONAL_DATE_PATTERNS.newYear(date)) {
            cachedGreetings.push("🎆 New Year, New Prompts!");
        } else if (SEASONAL_DATE_PATTERNS.valentine(date)) {
            cachedGreetings.push("💘 Love is in the prompt!");
        }

        lastCheck = now;
        return cachedGreetings;
    };
})();

// Optimized greeting selection with pool pre-selection
function selectGreeting() {
    const seasonal = getSeasonalGreetings();
    if (seasonal.length > 0 && Math.random() < 0.15) {
        return seasonal[Math.floor(Math.random() * seasonal.length)];
    }

    const rand = Math.random() * 100;
    
    switch (true) {
        case rand < 94.5:
            return commonGreetings[Math.floor(Math.random() * commonGreetings.length)];
        case rand < 99.5:
            return rareGreetings[Math.floor(Math.random() * rareGreetings.length)];
        default:
            return Array.from(legendaryGreetings)[Math.floor(Math.random() * legendaryGreetings.size)];
    }
}



    // Automatically activate "Generated Prompts" as default tab
    generatedTab.classList.add('active');
    generatedPromptsElem.classList.add('active');

    // Event listeners for tab switching
    generatedTab.addEventListener('click', function() {
        switchTab('generated');
    });

    historyTab.addEventListener('click', function() {
        switchTab('history');
        loadHistory(); // Load history when the tab is clicked
    });

weeklyTab.addEventListener('click', function () {
    switchTab('weekly'); // Switch to weekly prompts
    loadWeeklyPrompts(); // Load the weekly prompts dynamically
});


collectionsTab.addEventListener('click', () => {
    switchTab('collections');
});


  creativitySlider.addEventListener('input', function() {
        creativityValue.textContent = this.value;
    });

    // Function to get prompt length label


function refreshQuickAddButton(btn, promptText, theme) {
    // Create a new button to replace the old one (to clean up all event listeners)
    const newBtn = btn.cloneNode(true);
    const imgElement = newBtn.querySelector('img');
    
    // Set up the button state
    const isInAnyCollection = collectionsManager.isPromptInAnyCollection(promptText);
    imgElement.src = isInAnyCollection ? 'icons/star-filled.svg' : 'icons/star-empty.svg';
    newBtn.title = isInAnyCollection ? 'In Collection' : 'Add to Collection';
    
    // Add single event listener with error handling
    newBtn.addEventListener('click', async (e) => {
        try {
            e.stopPropagation();
            e.preventDefault();
            
            // Debounce the click
            if (newBtn.dataset.processing === 'true') {
                return;
            }
            
            newBtn.dataset.processing = 'true';
            
            // Add visual feedback
            newBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                newBtn.style.transform = 'scale(1)';
            }, 100);
            
            await collectionsManager.showQuickAddMenu(e, promptText);
            
            // Reset processing state after a short delay
            setTimeout(() => {
                newBtn.dataset.processing = 'false';
            }, 300);
            
        } catch (error) {
            console.error('Quick add button error:', error);
            newBtn.dataset.processing = 'false';
            // Show error feedback to user
            const originalTitle = newBtn.title;
            newBtn.title = 'Error adding to collection. Please try again.';
            setTimeout(() => {
                newBtn.title = originalTitle;
            }, 2000);
        }
    });
    
    // Update styling
    updateQuickAddButtonColor(newBtn, theme);
    
    // Replace old button with new one
    btn.parentNode.replaceChild(newBtn, btn);
    return newBtn;
}
// Modified switchTab function
function switchTab(tab) {
    // Get all tab content elements
    const generatedPromptsElem = document.getElementById('generatedPrompts');
    const historyPromptsElem = document.getElementById('historyPrompts');
    const weeklyPromptsElem = document.getElementById('weeklyPrompts');
    const styleRefsContent = document.getElementById('styleRefsContent');
    const collectionsContent = document.getElementById('collectionsContent');
    const infoBox = document.getElementById('infoBox');

    // Get all tab buttons
    const generatedTab = document.getElementById('generatedTab');
    const historyTab = document.getElementById('historyTab');
    const weeklyTab = document.getElementById('weeklyTab');
    const styleRefsTab = document.getElementById('styleRefsTab');
    const collectionsTab = document.getElementById('collectionsTab');

    // Get the currently active tab
    const currentTab = document.querySelector('.tab-content.active');
    const currentIndex = getTabIndex(currentTab.id);
    const newIndex = getTabIndex(tab + 'Prompts') || getTabIndex(tab + 'Content');

    // Determine slide direction
    const slideDirection = currentIndex < newIndex ? 'slide-right' : 'slide-left';

    // First, start the exit animation for the current tab
    if (currentTab) {
        currentTab.classList.add(slideDirection);
        currentTab.style.opacity = '0';
        
        setTimeout(() => {
            currentTab.classList.remove('active');
            currentTab.classList.remove(slideDirection);
            
            // Then, show and animate the new tab
            showNewTab(tab, slideDirection);
        }, 200);
    } else {
        showNewTab(tab, slideDirection);
    }

    // Remove active class from all tabs
    [generatedTab, historyTab, weeklyTab, styleRefsTab, collectionsTab].forEach(t => {
        if (t) t.classList.remove('active');
    });

    // Show infoBox only in Weekly Prompts tab
    if (infoBox) {
        infoBox.style.display = tab === 'weekly' ? 'block' : 'none';
    }
setTimeout(restorePreviews, 100);
    // Add active class to selected tab
    switch (tab) {
        case 'generated':
            generatedTab?.classList.add('active');
            break;
        case 'history':
            historyTab?.classList.add('active');
             loadHistory(true);
            break;
        case 'weekly':
            weeklyTab?.classList.add('active');
            break;
        case 'styleRefs':
            styleRefsTab?.classList.add('active');
            loadStyleReferences();
            break;
        case 'collections':
            collectionsTab?.classList.add('active');
            break;
    }
            
}
function showNewTab(tab, slideDirection) {
    const opposite = slideDirection === 'slide-left' ? 'slide-right' : 'slide-left';
    const newTab = document.getElementById(tab + 'Prompts') || document.getElementById(tab + 'Content');
    
    if (newTab) {
        // Set initial position
        newTab.classList.add(opposite);
        newTab.classList.add('active');
        newTab.style.opacity = '0';
        
        // Force a reflow to ensure the initial position is set
        newTab.offsetHeight;
        
        // Animate to final position
        newTab.classList.remove(opposite);
        newTab.style.opacity = '1';
    }
}

function getTabIndex(tabId) {
    const tabOrder = [
        'generatedPrompts',
        'historyPrompts',
        'weeklyPrompts',
        'styleRefsContent',
        'collectionsContent'
    ];
    return tabOrder.indexOf(tabId);
}
   let previewShowTimeout; // To manage the delay before showing the preview
let previewHideTimeout; // To manage hiding the preview




    // Function to save dropdown selections and user prompt to localStorage
function saveSelections() {
    const videoMode = document.querySelector('.container').classList.contains('video-mode');
    
    if (videoMode) {
        saveVideoSelections();
    } else {
        // Existing image mode saving logic
        localStorage.setItem('style', styleSelect.value);
        localStorage.setItem('lighting', lightingSelect.value);
        localStorage.setItem('cameraAngle', cameraAngleSelect.value);
        localStorage.setItem('model', modelSelect.value);
        localStorage.setItem('purpose', purposeSelect.value);
        localStorage.setItem('userPrompt', promptInput.value);
        localStorage.setItem('promptLength', promptLengthSlider.value);
        localStorage.setItem('creativity', creativitySlider.value);
    }
}
function saveVideoSelections() {
    const videoPromptInput = document.getElementById('videoPromptInput');
    const videoPromptLength = document.getElementById('videoPromptLength');
    
    localStorage.setItem('videoPrompt', videoPromptInput?.value || '');
    localStorage.setItem('videoStyle', document.getElementById('videoStyleSelect')?.value || 'not_specified');
    localStorage.setItem('videoMovement', document.getElementById('videoMovementSelect')?.value || 'not_specified');
    localStorage.setItem('videoCameraAngle', document.getElementById('videoCameraAngleSelect')?.value || 'not_specified');
    localStorage.setItem('videoLighting', document.getElementById('videoLightingSelect')?.value || 'not_specified');
    localStorage.setItem('videoPromptLength', videoPromptLength?.value || '2');
}

function loadVideoSelections() {
    chrome.storage.local.get(['isPremiumUser'], (result) => {
        const isPremiumUser = result.isPremiumUser || false;
        
        // Load saved values
        const videoPromptInput = document.getElementById('videoPromptInput');
        const videoPromptLength = document.getElementById('videoPromptLength');
        const videoClearButton = document.getElementById('videoClearButton');
        
        // Load saved prompt text
        if (videoPromptInput) {
            const savedPrompt = localStorage.getItem('videoPrompt');
            if (savedPrompt) {
                videoPromptInput.value = savedPrompt;
                // Show/hide clear button based on input value
                if (videoClearButton) {
                    videoClearButton.style.display = savedPrompt.length > 0 ? 'block' : 'none';
                }
            }
        }
        
        // Load saved prompt length
        if (videoPromptLength) {
            const savedLength = localStorage.getItem('videoPromptLength');
            if (savedLength) {
                videoPromptLength.value = savedLength;
            }
        }

        // Handle camera angle select
        const videoCameraAngleSelect = document.getElementById('videoCameraAngleSelect');
        const cameraAngleWrapper = videoCameraAngleSelect?.previousElementSibling;
        if (cameraAngleWrapper && cameraAngleWrapper.classList.contains('select-wrapper')) {
            cameraAngleWrapper.remove();
        }
        if (videoCameraAngleSelect) {
            videoCameraAngleSelect.style.display = 'block';
            rebuildVideoCameraAnglesDropdown(isPremiumUser);
            createCustomSelect(videoCameraAngleSelect, 'cameraangles');
            videoCameraAngleSelect.style.display = 'none';
        }

        // Handle video style select
        const videoStyleSelect = document.getElementById('videoStyleSelect');
        const styleWrapper = videoStyleSelect?.previousElementSibling;
        if (styleWrapper && styleWrapper.classList.contains('select-wrapper')) {
            styleWrapper.remove();
        }
        if (videoStyleSelect) {
            videoStyleSelect.style.display = 'block';
            createVideoCustomSelect(videoStyleSelect, videoStylePreviews, 'video-styles');
            videoStyleSelect.style.display = 'none';
        }

        // Handle video movement select
        const videoMovementSelect = document.getElementById('videoMovementSelect');
        const movementWrapper = videoMovementSelect?.previousElementSibling;
        if (movementWrapper && movementWrapper.classList.contains('select-wrapper')) {
            movementWrapper.remove();
        }
        if (videoMovementSelect) {
            videoMovementSelect.style.display = 'block';
            createVideoCustomSelect(videoMovementSelect, videoMovementPreviews, 'video-movements');
            videoMovementSelect.style.display = 'none';
        }

        // Handle lighting select
        const videoLightingSelect = document.getElementById('videoLightingSelect');
        const lightingWrapper = videoLightingSelect?.previousElementSibling;
        if (lightingWrapper && lightingWrapper.classList.contains('select-wrapper')) {
            lightingWrapper.remove();
        }
        if (videoLightingSelect) {
            videoLightingSelect.style.display = 'block';
            rebuildVideoLightingDropdown(isPremiumUser);
            createCustomSelect(videoLightingSelect, 'lightings');
            videoLightingSelect.style.display = 'none';
        }

        // Load all saved selections
        if (videoCameraAngleSelect) {
            const savedCameraAngle = localStorage.getItem('videoCameraAngle');
            if (savedCameraAngle) videoCameraAngleSelect.value = savedCameraAngle;
        }
        if (videoLightingSelect) {
            const savedLighting = localStorage.getItem('videoLighting');
            if (savedLighting) videoLightingSelect.value = savedLighting;
        }
        if (videoStyleSelect) {
            const savedStyle = localStorage.getItem('videoStyle');
            if (savedStyle) videoStyleSelect.value = savedStyle;
        }
        if (videoMovementSelect) {
            const savedMovement = localStorage.getItem('videoMovement');
            if (savedMovement) videoMovementSelect.value = savedMovement;
        }
    });
}
                         document.getElementById('videoStyleSelect').addEventListener('change', function() {
    localStorage.setItem('videoStyle', this.value);
});

document.getElementById('videoMovementSelect').addEventListener('change', function() {
    localStorage.setItem('videoMovement', this.value);
});
document.getElementById('videoCameraAngleSelect').addEventListener('change', function() {
    localStorage.setItem('videoCameraAngle', this.value);
});
            
document.querySelectorAll('.param-btn, input[type="number"], input[type="text"]').forEach(element => {
    element.addEventListener('change', saveMidjourneyParams);
});

modelSelect.addEventListener('change', function() {
    saveMidjourneyParams();
    midjourneyParams.style.display = this.value === 'midjourney' ? 'block' : 'none';
});
    // Function to load saved selections and user prompt from localStorage
function loadSelections() {
    chrome.storage.local.get(['isPremiumUser'], (result) => {
        const isPremiumUser = result.isPremiumUser || false;
        
        // Allow video mode for all users
        const savedVideoMode = localStorage.getItem('videoMode') === 'true';
        if (savedVideoMode) {
            const container = document.querySelector('.container');
            const modeToggle = document.querySelector('.mode-toggle');
            container.classList.add('video-mode');
            if (modeToggle) modeToggle.classList.add('active');
            updateUIForMode(true);
        }

        loadVideoSelections();

        // Remove existing custom select wrappers
        document.querySelectorAll('.select-wrapper').forEach(wrapper => {
            wrapper.remove();
            loadMidjourneyParams();
        });

        // Show original selects temporarily
        const selectElements = ['styleSelect', 'cameraAngleSelect', 'lightingSelect', 'purposeSelect', 'modelSelect'];
        selectElements.forEach(id => {
            const select = document.getElementById(id);
            if (select) select.style.display = 'block';
        });

        // Rebuild all dropdowns
        rebuildDropdown(isPremiumUser);
        rebuildCameraAnglesDropdown(isPremiumUser);
        rebuildLightingDropdown(isPremiumUser);
        rebuildPurposeDropdown(isPremiumUser);
        rebuildModelDropdown(isPremiumUser);

        // Create new custom selects
        selectElements.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.style.display = 'none';
                const folder = id.replace('Select', '').toLowerCase();
                const folderName = folder === 'model' ? folder : folder + 's';
                createCustomSelect(select, folderName);
            }
        });

        // Load saved values from localStorage
        selectElements.forEach(id => {
            const savedValue = localStorage.getItem(id.replace('Select', ''));
            if (savedValue) {
                const select = document.getElementById(id);
                if (select) {
                    if (id === 'modelSelect') {
                        if (Array.from(select.options).some(opt => opt.value === savedValue)) {
                            select.value = savedValue;
                            const midjourneyParams = document.getElementById('midjourneyParams');
                            if (midjourneyParams) {
                                midjourneyParams.style.display = savedValue === 'midjourney' ? 'block' : 'none';
                            }
                        } else {
                            select.value = 'not_specified';
                            localStorage.setItem('model', 'not_specified');
                        }
                    } else {
                        const option = Array.from(select.options).find(opt => opt.value === savedValue);
                        if (option && (!option.text.includes('Premium') || isPremiumUser)) {
                            select.value = savedValue;
                        } else {
                            select.value = 'not_specified';
                            localStorage.setItem(id.replace('Select', ''), 'not_specified');
                        }
                    }
                }
            }
        });

        // Update custom select displays
        document.querySelectorAll('.custom-select').forEach(customSelect => {
            const select = customSelect.parentElement.nextElementSibling;
            const trigger = customSelect.querySelector('.select-trigger');
            if (trigger && select) {
                const selectedOption = select.options[select.selectedIndex];
                const triggerText = trigger.querySelector('span');
                const previewImg = trigger.querySelector('.preview-thumbnail');
                
                if (triggerText) {
                    triggerText.textContent = selectedOption.text.replace(' (Premium)', '');
                    triggerText.style.color = select.value === 'not_specified' ? '#888' : '';
                }
                
                if (previewImg) {
                    if (select.value === 'not_specified') {
                        previewImg.style.display = 'none';
                    } else {
                        previewImg.style.display = 'block';
                        const formattedValue = select.value.replace(/_/g, '-');
                        const folder = select.id.replace('Select', '').toLowerCase();
                        const folderName = folder === 'model' ? folder : folder + 's';
                        previewImg.src = `../previews/${folderName}/${formattedValue}-preview.png`;
                    }
                }
            }
        });

        // Load saved prompt input value
        const promptInput = document.getElementById('promptInput');
        const savedPrompt = localStorage.getItem('userPrompt');
        if (promptInput && savedPrompt) {
            promptInput.value = savedPrompt;
            const clearButton = document.getElementById('clearButton');
            if (clearButton) {
                clearButton.style.display = savedPrompt.length > 0 ? 'block' : 'none';
            }
        }

        // Load slider values
        const promptLengthSlider = document.getElementById('promptLength');
        const creativitySlider = document.getElementById('creativityValue');
        const creativityValue = document.querySelector('.slider-value');
        
        if (promptLengthSlider) {
            const savedLength = localStorage.getItem('promptLength');
            if (savedLength) promptLengthSlider.value = savedLength;
        }
        
        if (creativitySlider && creativityValue) {
            const savedCreativity = localStorage.getItem('creativity');
            if (savedCreativity) {
                creativitySlider.value = savedCreativity;
                creativityValue.textContent = savedCreativity;
            }
        }
    });
}
    promptLengthSlider.addEventListener('change', saveSelections);
creativitySlider.addEventListener('change', saveSelections);

    // Show clear button only if there's input
    promptInput.addEventListener('input', function() {
        if (promptInput.value.length > 0) {
            clearButton.style.display = 'block';
        } else {
            clearButton.style.display = 'none';
        }
    });

    // Clear input when the clear button is clicked
    clearButton.addEventListener('click', function() {
        promptInput.value = '';
        clearButton.style.display = 'none';
        promptInput.focus(); // Focus back to the input after clearing
        saveSelections(); // Save the cleared state to localStorage
    });

    // Function to check for "Not Specified" and apply human-readable text
function formatLabel(label) {
    if (!label || label === 'undefined' || label === 'null') return "Not Specified";
    if (label === "not_specified") return "Not Specified";
    if (label === "Random") return "Random";
    return label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' ');
}
function displayHistoryEntry(historyEntry, container) {
    const detailsBox = document.createElement('div');
    detailsBox.classList.add('history-details');

    let detailsHTML = '';
    
    switch(historyEntry.type) {
        case 'variation':
            const isVideoVariation = isVideoPrompt('', historyEntry);
            detailsHTML = `
                <p><strong>Type:</strong> ${isVideoVariation ? 'Video Prompt Variation' : 'Variation'}</p>
                <p>${historyEntry.description}</p>
            `;
            break;
            
        case 'image-analysis':
            const [label, filename] = historyEntry.description.split(': ');
            detailsHTML = `<p><strong>${label}:</strong> ${filename}</p>`;
            break;
            
        case 'video':
            detailsHTML = `
                <p><strong>Description:</strong> ${historyEntry.description}</p>
                <p><strong>Video Style:</strong> ${formatLabel(historyEntry.style)}</p>
                <p><strong>Camera Movement:</strong> ${formatLabel(historyEntry.movement)}</p>
                <p><strong>Camera Angle:</strong> ${formatLabel(historyEntry.cameraAngle)}</p>
                <p><strong>Prompt Length:</strong> ${formatLabel(historyEntry.promptLength)}</p>
            `;
            break;
            
        default:
            detailsHTML = `
                <p><strong>Description:</strong> ${historyEntry.description}</p>
                <p><strong>Prompt Length:</strong> ${historyEntry.type === 'random' ? 'Random' : getPromptLengthLabel(historyEntry.promptLength)}</p>
                <p><strong>Style:</strong> ${formatLabel(historyEntry.style)}</p>
                <p><strong>Purpose:</strong> ${formatLabel(historyEntry.purpose)}</p>
                <p><strong>Creativity Value:</strong> ${historyEntry.creativity}</p>
                <p><strong>Lighting:</strong> ${formatLabel(historyEntry.lighting)}</p>
                <p><strong>Camera Angle:</strong> ${formatLabel(historyEntry.cameraAngle)}</p>               
                <p><strong>AI Model:</strong> ${formatLabel(historyEntry.model)}</p>
            `;
    }
    
    detailsBox.innerHTML = detailsHTML;

    // Add delete button for the entire history entry
    const deleteEntryBtn = document.createElement('button');
    deleteEntryBtn.className = 'history-entry-delete';
    deleteEntryBtn.innerHTML = `<img src="icons/cross-circle.svg" alt="Delete">`;
    deleteEntryBtn.title = 'Delete this entry';
    
    // Add the delete button to the top right of the details box
    const headerSection = document.createElement('div');
    headerSection.className = 'history-entry-header';
    headerSection.appendChild(deleteEntryBtn);
    detailsBox.insertBefore(headerSection, detailsBox.firstChild);

    // Add delete functionality
    deleteEntryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Get current history
        let history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
        
        // Find and remove the entry
        const timestamp = historyEntry.timestamp;
        history = history.filter(entry => entry.timestamp !== timestamp);
        
        // Save updated history
        localStorage.setItem('promptHistory', JSON.stringify(history));
        
        // Animate removal
        detailsBox.style.transition = 'all 0.3s ease';
        detailsBox.style.opacity = '0';
        detailsBox.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            detailsBox.remove();
            
            // Show empty state if no entries left
            if (history.length === 0) {
                container.innerHTML = `
                    <div class="collections-empty-state">
                        <img src="icons/history.svg" alt="Empty History">
                        <h3>No History</h3>
                        <p>Your prompt history will appear here</p>
                    </div>
                `;
            }
        }, 300);

        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'collections-toast success';
        toast.textContent = 'History entry deleted';
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        });
    });

    // Process prompts
    const promptsContainer = document.createElement('div');
    if (historyEntry.prompts) {
        const cleanPrompts = typeof historyEntry.prompts === 'string' 
            ? historyEntry.prompts.split('\n') 
            : historyEntry.prompts;

        cleanPrompts
            .filter(prompt => prompt.trim())
            .forEach(prompt => {
                const promptBox = createPromptBox(prompt.trim(), true);
                if (promptBox) {
                    promptsContainer.appendChild(promptBox);
                }
            });
    }

    detailsBox.appendChild(promptsContainer);
    container.appendChild(detailsBox);
}
    // Apply grey color when the page loads and when user changes selection
// Function to enable premium options for premium users or disable them for free users
function rebuildDropdown(isPremiumUser) {
    const styleSelect = document.getElementById('styleSelect');
    styleSelect.innerHTML = '';  // Clear current options

    // Add free options
    freeOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
           opt.setAttribute('data-preview', option.preview);  // Ensure data-preview is set from HTML
        styleSelect.appendChild(opt);
    });

    // Add premium options
    premiumOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;

        if (!isPremiumUser) {
            // If the user is not premium, disable premium options and grey them out
            opt.disabled = true;
            opt.style.color = 'grey';  // Optional: make it grey for free users
        } else {
            // For premium users, remove the (Premium) label when selecting
            opt.textContent = option.text.replace(" (Premium)", "");
        }
 opt.setAttribute('data-preview', option.preview);  // Ensure data-preview is set from HTML
        styleSelect.appendChild(opt);
    });

    // Reset to the first option after rebuilding
    styleSelect.selectedIndex = 0;
}

function addEnterKeyListener(selector) {
    selector.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default behavior
            generatePrompt(); // Call the function to generate the prompt
        }
    });
}

// Add Enter key listeners to relevant selectors
addEnterKeyListener(promptInput);
addEnterKeyListener(styleSelect);
addEnterKeyListener(cameraAngleSelect);
addEnterKeyListener(lightingSelect);
addEnterKeyListener(modelSelect);
addEnterKeyListener(promptLengthSlider);
addEnterKeyListener(creativitySlider);


function rebuildCameraAnglesDropdown(isPremiumUser) {
    const cameraAngleSelect = document.getElementById('cameraAngleSelect');
    cameraAngleSelect.innerHTML = '';  // Clear current options

    // Add free camera angles
    freeCameraAngles.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        opt.setAttribute('data-preview', option.preview); 
        cameraAngleSelect.appendChild(opt);
    });

    // Add premium camera angles
    premiumCameraAngles.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;

        if (!isPremiumUser) {
            opt.disabled = true;
            opt.style.color = 'grey';  // Optional: grey out for non-premium users
        } else {
            opt.textContent = option.text.replace(" (Premium)", ""); // Remove "(Premium)"
        }
        opt.setAttribute('data-preview', option.preview); 

        cameraAngleSelect.appendChild(opt);
    });

    // Reset to the first option after rebuilding
    cameraAngleSelect.selectedIndex = 0;
}
function rebuildVideoLightingDropdown(isPremiumUser) {
    const videoLightingSelect = document.getElementById('videoLightingSelect');
    videoLightingSelect.innerHTML = '';  // Clear current options

    // Add free lighting options
    videoFreeLighting.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        opt.setAttribute('data-preview', option.preview);
        videoLightingSelect.appendChild(opt);
    });

    // Add premium lighting options
    videoPremiumLighting.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;

        if (!isPremiumUser) {
            opt.disabled = true;
            opt.style.color = 'grey';
        } else {
            opt.textContent = option.text.replace(" (Premium)", "");
        }
        opt.setAttribute('data-preview', option.preview);
        videoLightingSelect.appendChild(opt);
    });

    // Reset to the first option after rebuilding
    videoLightingSelect.selectedIndex = 0;
}
function loadVideoLightingSelections() {
    chrome.storage.local.get(['isPremiumUser'], (result) => {
        const isPremiumUser = result.isPremiumUser || false;
        
        // Remove existing custom select wrapper
        const videoLightingSelect = document.getElementById('videoLightingSelect');
        const existingWrapper = videoLightingSelect.previousElementSibling;
        if (existingWrapper && existingWrapper.classList.contains('select-wrapper')) {
            existingWrapper.remove();
        }

        // Show original select temporarily
        videoLightingSelect.style.display = 'block';

        // Rebuild dropdown
        rebuildVideoLightingDropdown(isPremiumUser);

        // Create new custom select
        createCustomSelect(videoLightingSelect, 'lightings');

        // Hide original select
        videoLightingSelect.style.display = 'none';

        // Load saved selection
        const savedValue = localStorage.getItem('videoLighting');
        if (savedValue) {
            const option = Array.from(videoLightingSelect.options)
                .find(opt => opt.value === savedValue && !opt.disabled);
            
            if (option) {
                videoLightingSelect.value = savedValue;
                const trigger = document.querySelector('#videoLightingSelect + .select-wrapper .select-trigger span');
                if (trigger) {
                    trigger.textContent = option.text.replace(' (Premium)', '');
                }
            }
        }
    });
}
    document.getElementById('videoLightingSelect').addEventListener('change', function() {
    localStorage.setItem('videoLighting', this.value);
});
function rebuildLightingDropdown(isPremiumUser) {
    const lightingSelect = document.getElementById('lightingSelect');
    lightingSelect.innerHTML = '';  // Clear current options

    // Add free lighting options
    freeLighting.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        opt.setAttribute('data-preview', option.preview); 
        lightingSelect.appendChild(opt);
    });

    // Add premium lighting options
    premiumLighting.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;

        if (!isPremiumUser) {
            opt.disabled = true;
            opt.style.color = 'grey';  // Optional: grey out for non-premium users
        } else {
            opt.textContent = option.text.replace(" (Premium)", ""); // Remove "(Premium)"
        }
opt.setAttribute('data-preview', option.preview); 
        lightingSelect.appendChild(opt);
    });

    // Reset to the first option after rebuilding
    lightingSelect.selectedIndex = 0;
}

// Function to dynamically add copy and variations buttons to the Prompts of the Week
function addButtonsToWeeklyPrompts() {
    document.querySelectorAll('#weeklyPrompts .weekly-prompt-card').forEach((promptCard, index) => {
        const promptText = promptCard.querySelector('.weekly-prompt-text').textContent;
        const buttonContainer = promptCard.querySelector('.button-container');

        // Check if the buttons already exist to prevent adding them again
        if (!buttonContainer.querySelector('.copy-btn') && !buttonContainer.querySelector('.variations-btn')) {
            // Create Copy Button
            const copyBtn = document.createElement('button');
            copyBtn.classList.add('copy-btn');
            copyBtn.id = 'copy-weekly-' + index; // Unique ID for weekly prompts
            copyBtn.innerHTML = '<img src="icons/copy-icon.svg" alt="Copy"><span>Copy</span>';

            // Add Copy Button Logic
            copyBtn.addEventListener('click', function() {
                copyToClipboard(promptText, this);
            });

            // Create Variations Button
            const variationsBtn = document.createElement('button');
            variationsBtn.classList.add('variations-btn');
            variationsBtn.innerHTML = '<img src="icons/variations-icon.svg" alt="Variations"><span>Variations</span>';

            // Add Variations Button Logic
            variationsBtn.addEventListener('click', () => {
                generatePromptVariations(promptText);
            });

            // Append buttons to the button container
            buttonContainer.appendChild(copyBtn);
            buttonContainer.appendChild(variationsBtn);
        }
    });
}

// Call this function when the Prompts of the Week tab is loaded or activated
document.getElementById('weeklyTab').addEventListener('click', addButtonsToWeeklyPrompts);







    // Load saved selections and user input when the extension is opened
    loadSelections();

    // Save selections and user input to localStorage whenever user changes them or types
    styleSelect.addEventListener('change', saveSelections);
    lightingSelect.addEventListener('change', saveSelections);
    cameraAngleSelect.addEventListener('change', saveSelections);
    modelSelect.addEventListener('change', saveSelections);
    purposeSelect.addEventListener('change', saveSelections);
    promptInput.addEventListener('input', saveSelections); // Save user input when typing

    // Load prompts from local storage when the extension is opened
function loadPrompts() {
    const savedPrompts = localStorage.getItem('generatedPrompts');

    if (savedPrompts) {
        displayPrompts(savedPrompts);
    }
}



    // Save prompts to local storage
  // Save prompts to local storage
function savePrompts(prompts, isVariation = false, originalPrompt = '', isImageAnalysis = false, isVideoPrompt = false) {
    // Clean the prompts before saving
    const cleanedPrompts = prompts.split('\n')
        .map(prompt => cleanPromptTextForStorage(prompt))
        .filter(prompt => prompt)
        .join('\n');

    localStorage.setItem('generatedPrompts', cleanedPrompts);
    
    if (!isImageAnalysis) {
        let historyEntry;
        
        if (isVariation) {
            // For variations, check if original prompt was a video prompt
            const isVideoVariation = isVideoPrompt || 
                                   originalPrompt.includes('--video') ||
                                   (localStorage.getItem('videoMode') === 'true');
            
            historyEntry = {
                type: 'variation',
                description: `<strong>Variations</strong>: ${originalPrompt}`,
                prompts: cleanedPrompts,
                timestamp: Date.now(),
                isVideo: isVideoVariation // Add flag to track video status
            };
        } else if (isVideoPrompt) {
            // Video prompt specific logic
            historyEntry = {
                type: 'video',
                description: document.getElementById('videoPromptInput')?.value || '',
                style: document.getElementById('videoStyleSelect')?.value || 'not_specified',
                movement: document.getElementById('videoMovementSelect')?.value || 'not_specified',
                cameraAngle: document.getElementById('videoCameraAngleSelect')?.value || 'not_specified',
                promptLength: getPromptLengthLabel(document.getElementById('videoPromptLength')?.value || '2'),
                prompts: cleanedPrompts,
                timestamp: Date.now(),
                isVideo: true
            };
        } else {
            // Regular image prompt logic
            historyEntry = {
                type: 'standard',
                description: promptInput.value,
                model: modelSelect.value,
                style: styleSelect.value,
                lighting: lightingSelect.value,
                cameraAngle: cameraAngleSelect.value,
                purpose: purposeSelect.value,
                creativity: creativitySlider.value,
                promptLength: promptLengthSlider.value,
                prompts: cleanedPrompts,
                timestamp: Date.now(),
                isVideo: false
            };
        }

        let history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
        history.unshift(historyEntry);

        chrome.storage.local.get(['isPremiumUser'], (result) => {
            const isPremiumUser = result.isPremiumUser || false;
            const historyLimit = isPremiumUser ? 10000 : 5;

            if (history.length > historyLimit) {
                history = history.slice(0, historyLimit);
            }

            localStorage.setItem('promptHistory', JSON.stringify(history));
        });
    }
}



function handleEnterKey(event) {
    // Only proceed if Enter is pressed and no generation is in progress
    if (event.key === 'Enter' && !isGenerating) {
        // Prevent the default action
        event.preventDefault();
        
        // Don't trigger if a dropdown is open
        const openDropdowns = document.querySelectorAll('.select-options.active');
        if (openDropdowns.length > 0) return;
        
        // Don't trigger if any popup is open
        const openPopups = document.querySelectorAll('.active[id$="Popup"]');
        if (openPopups.length > 0) return;
        
        // Trigger the generate prompt function
        generatePrompt();
        incrementPromptCount();
    }
}

function setLoading(isLoading, customText = 'Generating prompts, please wait...') {
     isGenerating = isLoading; // Add this line to track state
    const loadingTextElem = loadingElem.querySelector('p');
    const helpContainer = document.querySelector('.help-container');
    
    if (isLoading) {
        loadingTextElem.textContent = customText;
        loadingElem.style.display = 'flex';
        resultElem.style.display = 'none';
        generateBtn.disabled = true;
        randomBtn.disabled = true;
        // Hide help container when loading
        helpContainer.classList.add('hidden');
    } else {
        loadingElem.style.display = 'none';
        resultElem.style.display = 'block';
        generateBtn.disabled = false;
        randomBtn.disabled = false;
        // Show help container when loading is complete
        helpContainer.classList.remove('hidden');
    }
}


    // Function to copy text to clipboard
let copyButtonStates = {};

function copyToClipboard(text, copyBtn, isWeeklyPrompt = false) {
    let finalText = text;

    // Only process parameters if it's not a weekly prompt
    if (!isWeeklyPrompt) {
        const modelSelect = document.getElementById('modelSelect');
        const isFromCollection = copyBtn.closest('.collections-content') !== null;
        
        // First clean the text of any HTML formatting
        let cleanedText = text.replace(/<[^>]*>/g, '').trim();
        
        // Check if the prompt already has Midjourney parameters
        const hasExistingParams = /(?:\s+--[a-zA-Z]+(?::\d+(?:\.\d+)?)?(?:\s+[\d.:]+)*)+$/.test(cleanedText);

        if (isFromCollection) {
            // For collection prompts
            const collections = Object.values(collectionsManager.collections);
            let savedPrompt = null;
            
            // Try to find the prompt in collections
            for (const collection of collections) {
                savedPrompt = collection.prompts.find(p => 
                    p.text === cleanPromptOfParameters(cleanedText) || 
                    p.text === cleanedText
                );
                if (savedPrompt) break;
            }

            if (savedPrompt) {
                // If found in collections, use the saved text and parameters
                finalText = savedPrompt.text;
                if (savedPrompt.parameters && savedPrompt.parameters.length > 0) {
                    finalText += ' ' + savedPrompt.parameters.join(' ');
                }
            } else if (hasExistingParams) {
                // If not found in collections but has parameters in the text, keep them
                finalText = cleanedText;
            } else {
                // If no saved parameters or existing parameters, just use the clean text
                finalText = cleanPromptOfParameters(cleanedText);
            }
        } else {
            // For non-collection prompts
            if (hasExistingParams) {
                // If the prompt already has parameters, keep them
                finalText = cleanedText;
            } else {
                // Otherwise, clean the text and add current parameters if using Midjourney
                finalText = cleanPromptOfParameters(cleanedText);
                if (modelSelect.value === 'midjourney' && activeParams.size > 0) {
                    const paramString = Array.from(activeParams).join(' ');
                    finalText = `${finalText} ${paramString}`;
                }
            }
        }
    }

    // Create temporary textarea and copy text
    const tempInput = document.createElement('textarea');
    tempInput.value = finalText;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    // Update button text
    const originalContent = copyBtn.innerHTML;
    copyBtn.innerHTML = '<img src="icons/copy-icon.svg" alt="Copy" style="display:none;"><span>Copied!</span>';

    // Clear any existing timeout for this button
    if (copyButtonStates[copyBtn.id] && copyButtonStates[copyBtn.id].timeoutId) {
        clearTimeout(copyButtonStates[copyBtn.id].timeoutId);
    }

    // Set new timeout and store the state
    copyButtonStates[copyBtn.id] = {
        originalContent: originalContent,
        timeoutId: setTimeout(() => {
            copyBtn.innerHTML = originalContent;
            delete copyButtonStates[copyBtn.id];
        }, 1000)
    };
}
// Add this function with your other async functions
// Add this code to your popup.js, adjusting the existing generateExtendedPrompts function

function showExtendPopup(promptText, callback) {
    const popup = document.getElementById('extendPopup');
    popup.style.display = 'flex';
    
    // Add active class after a small delay to trigger animation
    setTimeout(() => {
        popup.classList.add('active');
    }, 10);

    const closeBtn = popup.querySelector('.extend-close');
    const confirmBtn = document.getElementById('extendConfirm');
    const cancelBtn = document.getElementById('extendCancel');

    // Reset input fields and remove any previous error states
    const inputs = popup.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('error');
        // Remove any existing error messages
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    });

    // Add input validation
    function validateInput(input) {
        const value = input.value.trim();
        if (value.length > 200) {
            showInputError(input, 'Input must be less than 200 characters');
            return false;
        }
        return true;
    }

    function showInputError(input, message) {
        input.classList.add('error');
        // Remove existing error message if any
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentElement.appendChild(errorDiv);
    }

    function clearInputError(input) {
        input.classList.remove('error');
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    // Add input validation listeners
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
        });
        input.addEventListener('focus', () => {
            clearInputError(input);
        });
    });

    function closePopup() {
        popup.classList.remove('active');
        setTimeout(() => {
            popup.style.display = 'none';
            // Clear any error states
            inputs.forEach(input => {
                clearInputError(input);
            });
        }, 300);
        
        // Remove event listeners
        closeBtn.removeEventListener('click', closePopup);
        cancelBtn.removeEventListener('click', closePopup);
        confirmBtn.removeEventListener('click', handleConfirm);
    }

    function handleConfirm() {
        // Validate all inputs before proceeding
        let isValid = true;
        inputs.forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            return;
        }

        const additionalDetails = {
            style: document.getElementById('additionalStyle').value.trim(),
            lighting: document.getElementById('additionalLighting').value.trim(),
            objects: document.getElementById('additionalObjects').value.trim(),
            mood: document.getElementById('additionalMood').value.trim()
        };
        
        // Only include non-empty values
        Object.keys(additionalDetails).forEach(key => {
            if (!additionalDetails[key]) {
                delete additionalDetails[key];
            }
        });
        
        closePopup();
        callback(additionalDetails);
    }

    closeBtn.addEventListener('click', closePopup);
    cancelBtn.addEventListener('click', closePopup);
    confirmBtn.addEventListener('click', handleConfirm);
}
async function generateRandomVideoPrompt() {
    if (isGenerating) return;

    setLoading(true, 'Generating random video prompts, please wait...');
    switchTab('generated');
    loadingElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const headers = await pcApi.headers();

        const response = await fetch(pcApi.url('/generate-random-video'), {
            method: 'POST',
            headers: headers
        });

        if (await pcApi.isSessionExpired(response)) {
            handleAuthError();
            return;
        }

        const data = await response.json();

        if (pcApi.isTerminal(response, data)) {
            showUpgradePrompt(resultElem);
            console.warn('Refused:', data?.code, data?.error);
            return;
        } else if (response.ok) {
            displayPrompts(data.prompts || 'Failed to generate random video prompts');
            savePrompts(data.prompts, true, '', false, true); // Save as video prompts
            saveToHistory(data.prompts, false, false, '', false, '', true); // isRandomVideo set to true
            console.log('Random video prompts generated successfully.');
        } else {
            resultElem.textContent = pcApi.errorMessage(data);
        }
    } catch (error) {
        resultElem.textContent = 'An error occurred. Please try again.';
        console.error('Error generating random video prompts:', error);
    } finally {
        setLoading(false);
    }
}
function setupVideoModeUI() {
    const randomVideoBtn = document.createElement('button');
    randomVideoBtn.id = 'randomVideoPrompt';
    randomVideoBtn.className = 'video-random-btn';
    randomVideoBtn.innerHTML = '<img src="icons/dice-icon.svg" alt="Random">';

    // Add style for the button
    const style = document.createElement('style');
    style.textContent = `
 .video-random-btn {
    all: unset;
    /* Hidden and styled for video mode by default */
    display: none; 
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(135deg, #444444 0%, #2D3436 100%) !important;
    border: none;
    border-radius: 12px;
    color: #000;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
    /* Transition only box-shadow and opacity */
    transition: box-shadow 0.2s ease, opacity 0.2s ease;
    padding: 8px 8px;
    margin-top: 9px;
    text-shadow: none;
    position: relative;
    overflow: hidden;
    height: auto; /* Adjust as needed */
}

.video-random-btn img {
    width: 24px; /* Video mode size by default */
    height: 24px; /* Video mode size by default */
    transition: width 0.3s ease, height 0.3s ease;
}

/* Hover effect using box-shadow */
.video-random-btn:hover {
    opacity: 0.9;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* Add a subtle box-shadow */
}

/* Active effect using a different box-shadow */
.video-random-btn:active {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); /* Make the shadow smaller on active */
}

/* Video Mode Styles */
.container.video-mode .video-random-btn {
    display: flex; /* Show in video mode */
}

    `;
    document.head.appendChild(style);

    // Get the button container
    const buttonContainer = document.querySelector('.button-container-main');

    // Get the "Generate Prompts" button
    const generateBtn = document.getElementById('generatePrompt');

    // Add click handler for the "Random Video" button
    randomVideoBtn.addEventListener('click', () => {
        generateRandomVideoPrompt();
        incrementPromptCount();
    });

    // Function to toggle button visibility based on video mode
    function toggleVideoModeButtons(isVideoMode) {
        if (isVideoMode) {
            // Hide standard "Random" button and show "Random Video" button
            randomBtn.style.display = 'none';
            randomVideoBtn.style.display = 'flex'; // Or 'inline-flex' if that fits better
        } else {
            // Show standard "Random" button and hide "Random Video" button
            randomBtn.style.display = 'inline-flex';
            randomVideoBtn.style.display = 'none';
        }
    }

    // Add event listener to mode toggle for dynamically showing/hiding buttons
    document.querySelector('.mode-toggle').addEventListener('click', function() {
        const isVideoMode = this.classList.contains('active');
        toggleVideoModeButtons(isVideoMode);
    });

    // Initial setup on load
    const savedVideoMode = localStorage.getItem('videoMode') === 'true';
    toggleVideoModeButtons(savedVideoMode);

    // Insert the "Random Video" button before the "Generate Video Prompts" button
    buttonContainer.insertBefore(randomVideoBtn, generateBtn); // Updated insertion point
}

// Call this function when initializing the extension
setupVideoModeUI();
async function generateExtendedPrompts(promptText) {
    if (!promptText) {
        resultElem.textContent = 'Please provide a prompt to extend.';
        return;
    }

    if (promptText.length >= 800) {
        resultElem.textContent = 'Prompt is already at maximum length.';
        return;
    }

    showExtendPopup(promptText, async (additionalDetails) => {
        setLoading(true, 'Generating extended versions, please wait...');
        switchTab('generated');
        loadingElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            const headers = await pcApi.headers();

            const response = await fetch(pcApi.url('/generate-extended'), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    prompt: promptText,
                    additionalDetails: Object.keys(additionalDetails).length > 0 ? additionalDetails : undefined
                })
            });

            if (await pcApi.isSessionExpired(response)) {
                handleAuthError();
                return;
            }

            const data = await response.json();

            if (pcApi.isTerminal(response, data)) {
                showUpgradePrompt(resultElem);
                console.warn('Refused:', data?.code, data?.error);
                return;
            } else if (response.ok) {
                displayPrompts(data.extended || 'Failed to generate extended prompts');
                savePrompts(data.extended, true, promptText);
                console.log('Extended prompts generated successfully.');
            } else {
                resultElem.textContent = pcApi.errorMessage(data);
            }
        } catch (error) {
            resultElem.textContent = 'An error occurred. Please try again.';
            console.error('Error generating extended prompts:', error);
        } finally {
            setLoading(false);
        }
    });
}
function isVideoPrompt(prompt, historyEntry) {
    return (
        prompt.includes('--video') || // Check for video parameter
        historyEntry.type === 'video' || // Check entry type
        (historyEntry.type === 'variation' && 
            (historyEntry.description.includes('Variations:') && 
             historyEntry.description.includes('--video'))) || // Check if it's a variation of a video prompt
        (historyEntry.movement !== undefined && 
         historyEntry.cameraAngle !== undefined) // Check for video-specific properties
    );
}
// Modify the createPromptBox function to add the Extend button
// Modify the createPromptBox function to handle HTML content
// Modify the createPromptBox function to check for video prompts
function createPromptBox(promptText, isHistory = false, isInCollection = false, collectionId = null) {
    if (!promptText || promptText.trim() === "") return null;

    const promptBox = document.createElement('div');
    promptBox.classList.add('prompt-box');

    // Enhanced video prompt detection
    const isVideoPrompt = 
        promptText.includes('--video') || // Check for video parameter
        (promptText.includes('Video Prompt Variation:')) || // Check for video variations
        (localStorage.getItem('videoMode') === 'true' && !isHistory);

    // Add video-prompt class if needed
    if (isVideoPrompt) {
        promptBox.classList.add('video-prompt');
    }

    // Create and setup prompt text element
    const promptTextElem = document.createElement('p');
    promptTextElem.classList.add('prompt-text');
    
    // Handle Midjourney parameters and text formatting
    if (modelSelect.value === 'midjourney' && !isHistory && !isInCollection) {
        promptTextElem.innerHTML = addParamsToNewPrompt(promptText);
    } else {
        if (typeof promptText === 'string' && promptText.includes('<span class="highlight">')) {
            promptTextElem.innerHTML = promptText;
        } else {
            promptTextElem.textContent = promptText;
        }
    }
    promptBox.appendChild(promptTextElem);

    // Create button container with rows
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    const topRow = document.createElement('div');
    topRow.classList.add('top-row');
    const bottomRow = document.createElement('div');
    bottomRow.classList.add('bottom-row');

    // Clean text for buttons
    const cleanText = promptText.replace(/<span class="highlight">|<\/span>/g, '');
    const cleanTextForLength = cleanText;

    // Add Copy button
    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    copyBtn.id = 'copy-' + Math.random().toString(36).substr(2, 9);
    copyBtn.innerHTML = '<img src="icons/copy-icon.svg" alt="Copy"><span>Copy</span>';
    copyBtn.addEventListener('click', function() {
        copyToClipboard(cleanText, this);
    });
    topRow.appendChild(copyBtn);

    // Add Variations button
    const variationsBtn = document.createElement('button');
    variationsBtn.classList.add('variations-btn');
    variationsBtn.innerHTML = '<img src="icons/variations-icon.svg" alt="Variations"><span>Variations</span>';
    variationsBtn.addEventListener('click', () => {
        generatePromptVariations(cleanText);
    });
    topRow.appendChild(variationsBtn);

    // Add Extend button
    const extendBtn = document.createElement('button');
    extendBtn.classList.add('extend-btn');
    extendBtn.innerHTML = '<img src="icons/extend-icon.svg" alt="Extend"><span>Extend</span>';
    if (cleanTextForLength.length >= 800) {
        extendBtn.disabled = true;
        extendBtn.classList.add('disabled');
    }
    extendBtn.addEventListener('click', () => generateExtendedPrompts(cleanText));
    topRow.appendChild(extendBtn);

    // Add Shorten button
    const shortenBtn = document.createElement('button');
    shortenBtn.classList.add('shorten-btn');
    shortenBtn.innerHTML = '<img src="icons/shorten-icon.svg" alt="Shorten"><span>Shorten</span>';
    if (cleanTextForLength.length < 170) {
        shortenBtn.disabled = true;
        shortenBtn.classList.add('disabled');
    }
    shortenBtn.addEventListener('click', () => generateShortenedPrompts(cleanText));
    topRow.appendChild(shortenBtn);

    // Add Preview button only for non-video prompts
    if (!isVideoPrompt) {
        const previewBtn = document.createElement('button');
        previewBtn.classList.add('preview-btn');
        previewBtn.innerHTML = '<img src="icons/eye-icon.svg" alt="Preview"><span>Preview</span>';

        // Handle preview button state
        const disabledButtons = JSON.parse(localStorage.getItem('disabledButtons')) || {};
        if (disabledButtons[cleanText]) {
            previewBtn.disabled = true;
            previewBtn.classList.add('disabled');
        }
        previewBtn.addEventListener('click', () => generatePreview(cleanText, promptBox));
        bottomRow.appendChild(previewBtn);
    }

    // Add collection button for non-collection prompts
    if (!isInCollection) {
        const quickAddBtn = document.createElement('button');
        quickAddBtn.className = 'quick-add-btn';
        const isInAnyCollection = collectionsManager.isPromptInAnyCollection(cleanText);
        
        quickAddBtn.innerHTML = isInAnyCollection ? 
            '<img src="icons/star-filled.svg" alt="In Collection">' :
            '<img src="icons/star-empty.svg" alt="Add to Collection">';
        quickAddBtn.title = isInAnyCollection ? 'In Collection' : 'Add to Collection';
        
        const currentTheme = themes[localStorage.getItem('selectedTheme') || 'default'];
        updateQuickAddButtonColor(quickAddBtn, currentTheme);
        
        quickAddBtn.addEventListener('click', (e) => {
            collectionsManager.showQuickAddMenu(e, cleanText);
        });
        
        bottomRow.appendChild(quickAddBtn);
    }

    // Add rows to container
    buttonContainer.appendChild(topRow);
    buttonContainer.appendChild(bottomRow);
    promptBox.appendChild(buttonContainer);

    return promptBox;
}
    function addStandardButtons(topRow, bottomRow, promptText, promptBox, isHistory, isInCollection, collectionId) {
    // Add Copy button
    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    copyBtn.id = 'copy-' + Math.random().toString(36).substr(2, 9);
    copyBtn.innerHTML = '<img src="icons/copy-icon.svg" alt="Copy"><span>Copy</span>';
    copyBtn.addEventListener('click', function() {
        const cleanText = promptText.replace(/<span class="highlight">|<\/span>/g, '');
        copyToClipboard(cleanText, this);
    });
    topRow.appendChild(copyBtn);

    // Add other action buttons (Variations, Extend, Shorten)
    addActionButtons(topRow, promptText);

    // Add Preview button only if not a video prompt
    const isVideo = promptText.includes('--video') ||
                   (localStorage.getItem('videoMode') === 'true' && !isHistory);
    
    if (!isVideo) {
        addPreviewButton(bottomRow, promptText, promptBox);
    }

    // Add collection button if not in collection
    if (!isInCollection) {
        addQuickAddButton(bottomRow, promptText);
    }
}
// Add this new function to handle the move to collection menu
function loadSavedPreviews() {
    try {
        const savedPreviews = JSON.parse(localStorage.getItem('previews')) || {};
        return savedPreviews;
    } catch (error) {
        console.error('Error loading previews:', error);
        return {};
    }
}

// Save previews to localStorage with error handling
function savePreview(promptText, imageUrl) {
    try {
        const savedPreviews = loadSavedPreviews();
        savedPreviews[promptText] = imageUrl;
        localStorage.setItem('previews', JSON.stringify(savedPreviews));
        
        // Also save the disabled state
        const disabledButtons = JSON.parse(localStorage.getItem('disabledButtons')) || {};
        disabledButtons[promptText] = true;
        localStorage.setItem('disabledButtons', JSON.stringify(disabledButtons));
    } catch (error) {
        console.error('Error saving preview:', error);
    }
}

// Enhanced function to display cached preview
function displayCachedPreview(imageUrl, container, button, promptText) {
    // First check if required elements exist
    if (!container) {
        console.warn('Preview container not found');
        return;
    }

    // Clear container content
    container.innerHTML = '';

    // Create and set up image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Preview image';
    img.classList.add('preview-image-prompt');
    
    // Add error handling for image loading
    img.onerror = () => {
        console.error('Failed to load preview image');
        container.innerHTML = '<p>Failed to load preview image</p>';
        // Remove from cache if image fails to load
        const savedPreviews = loadSavedPreviews();
        delete savedPreviews[promptText];
        localStorage.setItem('previews', JSON.stringify(savedPreviews));
    };
    
    container.appendChild(img);
    
    // Only update button state if button exists
    if (button) {
        button.disabled = true;
        button.classList.add('disabled');
        
        // Update disabled state
        const disabledButtons = JSON.parse(localStorage.getItem('disabledButtons')) || {};
        disabledButtons[promptText] = true;
        localStorage.setItem('disabledButtons', JSON.stringify(disabledButtons));
    }
}
// Enhanced function to restore previews when displaying prompts
function restorePreviews() {
    const savedPreviews = loadSavedPreviews();
    const promptBoxes = document.querySelectorAll('.prompt-box');
    
    promptBoxes.forEach(box => {
        const promptText = box.querySelector('.prompt-text')?.textContent;
        if (!promptText) return;
        
        const cleanPrompt = cleanPromptOfParameters(promptText);
        const previewUrl = savedPreviews[cleanPrompt];
        
        if (previewUrl) {
            // Check if preview container already exists
            let imageContainer = box.querySelector('.image-container');
            if (!imageContainer) {
                imageContainer = document.createElement('div');
                imageContainer.classList.add('image-container');
                box.appendChild(imageContainer);
            }
            
            // Only try to get preview button if we're not in a collection
            const isInCollection = box.closest('#collectionsContent') !== null;
            const previewBtn = !isInCollection ? box.querySelector('.preview-btn') : null;

            // Call displayCachedPreview with nullable previewBtn
            displayCachedPreview(previewUrl, imageContainer, previewBtn, cleanPrompt);
        }
    });
}
function cleanupOldPreviews() {
    try {
        const savedPreviews = loadSavedPreviews();
        const maxPreviews = 50; // Adjust based on needs
        
        if (Object.keys(savedPreviews).length > maxPreviews) {
            const entries = Object.entries(savedPreviews);
            const newPreviews = Object.fromEntries(entries.slice(-maxPreviews));
            localStorage.setItem('previews', JSON.stringify(newPreviews));
        }
    } catch (error) {
        console.error('Error cleaning up previews:', error);
    }
}
setInterval(cleanupOldPreviews, 1000 * 60 * 60); 
// Enhanced preview image loading and caching
async function generatePreview(promptText, promptBox) {
    let imageContainer = promptBox.querySelector('.image-container');
    const previewBtn = promptBox.querySelector('.preview-btn');
    
    if (!imageContainer) {
        imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');
        promptBox.appendChild(imageContainer);
    }

    const savedPreviews = JSON.parse(localStorage.getItem('previews')) || {};
    const disabledButtons = JSON.parse(localStorage.getItem('disabledButtons')) || {};

    if (savedPreviews[promptText]) {
        displayCachedPreview(savedPreviews[promptText], imageContainer, previewBtn, promptText);
        return;
    }

    displayLoadingState(imageContainer);

    const preloadImage = new Image();
    let hasLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;

    const loadImage = async () => {
        try {
            const headers = await pcApi.headers();

            const response = await fetch(pcApi.url('/generate-preview'), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ prompt: promptText })
            });

            if (!response.ok) {
                let data = null;
                try {
                    data = await response.json();
                } catch {
                    data = null;
                }

                /**
                 * A refusal, not a fault: out of credits, or a plan away. It
                 * returns rather than retrying — repeating the call cannot
                 * change the answer, and this is the exact path that produced a
                 * retry loop against an endpoint that could only keep refusing.
                 */
                if (pcApi.isTerminal(response, data)) {
                    imageContainer.innerHTML = '';
                    showUpgradePrompt(imageContainer, true);
                } else {
                    handlePreviewError(response, imageContainer);
                }
                return;
            }

            const data = await response.json();
            preloadImage.src = data.imageUrl;
            preloadImage.onload = () => {
                hasLoaded = true;
                displaySuccessfulPreview(data.imageUrl, imageContainer, previewBtn, promptText);
            };
            preloadImage.onerror = () => {
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(loadImage, 1000 * retryCount);
                } else {
                    displayImageError(imageContainer);
                }
            };
        } catch (error) {
            console.error('Preview generation error:', error);
            displayImageError(imageContainer);
        }
    };

    loadImage();
}


function displayCachedPreview(imageUrl, container, button, promptText) {
    if (!container) {
        console.warn('Preview container not found');
        return;
    }

    // Clear container content
    container.innerHTML = '';

    // Create and set up image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Preview image';
    img.classList.add('preview-image-prompt');
    
    // Add error handling for image loading
    img.onerror = () => {
        console.error('Failed to load preview image');
        container.innerHTML = '<p>Failed to load preview image</p>';
        // Remove from cache if image fails to load
        const savedPreviews = loadSavedPreviews();
        delete savedPreviews[promptText];
        localStorage.setItem('previews', JSON.stringify(savedPreviews));
    };
    
    container.appendChild(img);
    
    // Only update button state if button exists and we're not in collections view
    if (button && !container.closest('#collectionsContent')) {
        button.disabled = true;
        button.classList.add('disabled');
        
        // Update disabled state in localStorage
        const disabledButtons = JSON.parse(localStorage.getItem('disabledButtons')) || {};
        disabledButtons[promptText] = true;
        localStorage.setItem('disabledButtons', JSON.stringify(disabledButtons));
    }
}

function displayLoadingState(container) {
    container.innerHTML = `
        <div class="loading-preview-container">
            <p class="loading-preview">Loading preview...</p>
        </div>
    `;
}

function displaySuccessfulPreview(imageUrl, container, button, promptText) {
    container.innerHTML = '';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Preview image';
    img.classList.add('preview-image-prompt');
    container.appendChild(img);

    // Update cache
    const savedPreviews = JSON.parse(localStorage.getItem('previews')) || {};
    savedPreviews[promptText] = imageUrl;
    localStorage.setItem('previews', JSON.stringify(savedPreviews));

    // Update button state
    button.disabled = true;
    button.classList.add('disabled');
    
    const disabledButtons = JSON.parse(localStorage.getItem('disabledButtons')) || {};
    disabledButtons[promptText] = true;
    localStorage.setItem('disabledButtons', JSON.stringify(disabledButtons));
}

function handlePreviewError(response, container) {
    if (response.status === 401) {
        chrome.storage.local.remove(['authToken', 'pcSession', 'isPremiumUser'], () => {
            updateUIForLoginStatus();
        });
        container.innerHTML = '<p>Session expired. Please log in again.</p>';
    } else if (response.status === 429) {
        // 429 is the image service being busy, not a credit limit — that is 402,
        // and it is recognised before this is reached. So this says wait, which
        // is true, rather than offering an upgrade, which would not help.
        container.innerHTML = '<p>The preview service is busy. Please try again shortly.</p>';
    } else {
        container.innerHTML = '<p>Failed to generate preview. Please try again.</p>';
    }
}

function displayImageError(container) {
    container.innerHTML = '<p>Failed to load preview image. Please try again.</p>';
}

// Clean up previews periodically to prevent localStorage from getting too full
function cleanupOldPreviews() {
    const savedPreviews = JSON.parse(localStorage.getItem('previews')) || {};
    const maxPreviews = 50; // Adjust based on your needs
    
    if (Object.keys(savedPreviews).length > maxPreviews) {
        const entries = Object.entries(savedPreviews);
        const newPreviews = Object.fromEntries(entries.slice(-maxPreviews));
        localStorage.setItem('previews', JSON.stringify(newPreviews));
    }
}

// Call cleanup periodically
setInterval(cleanupOldPreviews, 1000 * 60 * 60); // Every hour
document.getElementById('getPremium').addEventListener('click', function() {
    window.open('https://promptcatalyst.ai/premium', '_blank');
});
    
async function generatePromptVariations(promptText) {
    if (!promptText) {
        resultElem.textContent = 'Please select a prompt to generate variations.';
        return;
    }

    // Check if this is a video prompt variation
    const isVideoPrompt = promptText.includes('--video') || 
                         (localStorage.getItem('videoMode') === 'true');

    setLoading(true, 'Generating variations, please wait...');
    switchTab('generated');
    loadingElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const headers = await pcApi.headers();

        const response = await fetch(pcApi.url('/generate-variations'), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ prompt: promptText })
        });

        if (await pcApi.isSessionExpired(response)) {
            handleAuthError();
            return;
        }

        const data = await response.json();

        if (pcApi.isTerminal(response, data)) {
            showUpgradePrompt(resultElem);
            console.warn('Refused:', data?.code, data?.error);
            return;
        } else if (response.ok) {
            displayPrompts(data.variations || 'Failed to generate variations');
            savePrompts(data.variations, true, promptText, false, isVideoPrompt);
            console.log('Variations generated successfully.');
        } else {
            resultElem.textContent = pcApi.errorMessage(data);
        }
    } catch (error) {
        resultElem.textContent = 'An error occurred. Please try again.';
        console.error('Error generating variations:', error);
    } finally {
        setLoading(false);
    }
}
    
       // Function to display multiple prompts with copy buttons
function displayPrompts(prompts) {
    resultElem.innerHTML = '';

    const validPrompts = prompts.split('\n')
        .map(prompt => prompt.trim())
        .filter(prompt => {
            const isOnlyParams = /^(?:--[a-zA-Z]+(?::\d+(?:\.\d+)?)?(?:\s+[\d.:]+)*\s*)+$/.test(prompt);
            return prompt && !isOnlyParams;
        });

    validPrompts.forEach(prompt => {
        const cleanPrompt = cleanPromptOfParameters(prompt);
        const promptBox = createThemeAwarePromptBox(cleanPrompt);
        if (promptBox) {
            resultElem.appendChild(promptBox);
            
            const promptText = promptBox.querySelector('.prompt-text');
            if (promptText && modelSelect.value === 'midjourney') {
                promptText.removeEventListener('click', handleParamClick);
                promptText.addEventListener('click', handleParamClick);
                promptText.innerHTML = addParamsToNewPrompt(cleanPrompt);
            }
        }
    });

    // After all prompts are displayed, restore their previews
    restorePreviews();
}
const refStrengthButton = document.getElementById('refStrengthButton');
const refStrength = document.getElementById('refStrength');
const excludeButton = document.getElementById('excludeButton');
const excludeValue = document.getElementById('excludeValue');

// Handle reference strength
refStrengthButton.addEventListener('click', function() {
    const param = `--cw ${refStrength.value}`;
    if (this.classList.contains('active')) {
        this.classList.remove('active');
        activeParams.delete(param);
    } else {
        // Remove any existing reference strength parameter
        activeParams.forEach(p => {
            if (p.startsWith('--cw')) {
                activeParams.delete(p);
            }
        });
        this.classList.add('active');
        activeParams.add(param);
    }
    updatePromptParameters();
});

// Handle exclusions
excludeButton.addEventListener('click', function() {
    const exclusions = excludeValue.value.trim();
    if (exclusions) {
        const param = `--no ${exclusions}`;
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            activeParams.delete(param);
            excludeValue.value = '';
            cleanAllPromptBoxes();
        } else {
            // Remove any existing exclusion parameter
            activeParams.forEach(p => {
                if (p.startsWith('--no')) {
                    activeParams.delete(p);
                }
            });
            this.classList.add('active');
            activeParams.add(param);
        }
        updatePromptParameters();
        saveMidjourneyParams(); // Save state after changes
    }
});
excludeValue.addEventListener('input', () => {
    saveMidjourneyParams();
});
function cleanAllPromptBoxes() {
    const promptBoxes = document.querySelectorAll('.prompt-box');
    promptBoxes.forEach(box => {
        const promptText = box.querySelector('.prompt-text');
        if (promptText) {
            let text = cleanPromptOfParameters(promptText.textContent);
            promptText.innerHTML = addParamsToNewPrompt(text);
        }
    });
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Function to update credit information
async function updateCreditInfo() {
    try {
        await updateSubscriptionLink();
        const headers = await pcApi.headers();

        const response = await fetch(pcApi.url('/credits'), {
            method: 'GET',
            headers: headers
        });

        if (await pcApi.isSessionExpired(response)) {
            updateUIForLoginStatus();
            return;
        }

        const data = await response.json();

        // Update UI elements
        const creditCount = document.getElementById('creditCount');
        const creditResetType = document.getElementById('creditResetType');
        const lastCreditReset = document.getElementById('lastCreditReset');

        if (creditCount) {
            creditCount.textContent = data.credits;
        }
        if (creditResetType) {
            creditResetType.textContent = data.resetType === 'monthly' ? 'Monthly' : 'Daily';
        }
        if (lastCreditReset) {
            lastCreditReset.textContent = formatDate(data.lastReset);
        }

    } catch (error) {
        console.error('Error updating credit info:', error);
        // Show error in UI
        const creditCount = document.getElementById('creditCount');
        if (creditCount) {
            creditCount.textContent = 'Error loading credits';
        }
    }
}
async function updateSubscriptionLink() {
    const subscriptionLink = document.getElementById('subscriptionLink');
    const subscriptionText = subscriptionLink.querySelector('.subscription-text');
    
    chrome.storage.local.get(['isPremiumUser'], (result) => {
        const isPremiumUser = result.isPremiumUser || false;
        
        if (isPremiumUser) {
            subscriptionText.textContent = 'Manage my subscription';
            subscriptionLink.href = 'https://billing.stripe.com/p/login/00g6srfOR1Af6xWbII';
        } else {
            subscriptionText.textContent = 'Upgrade to Premium';
            subscriptionLink.href = 'https://promptcatalyst.ai/premium';
        }
    });
}
// Add click handler for refresh button
document.getElementById('refreshCredits')?.addEventListener('click', function(e) {
    e.preventDefault();
    const refreshButton = this;
    const refreshIcon = refreshButton.querySelector('img');
    
    // Add rotation animation class
    refreshIcon.classList.add('rotating');
    
    // Update credits
    updateCreditInfo().finally(() => {
        // Remove rotation class after update
        setTimeout(() => {
            refreshIcon.classList.remove('rotating');
        }, 1000);
    });
});
document.getElementById('subscriptionLink').addEventListener('click', (e) => {
    e.preventDefault();
    window.open(e.currentTarget.href, '_blank');
});
// Set up periodic credit updates
let creditUpdateInterval;

function startCreditUpdates() {
    // Initial update
    updateCreditInfo();
    
    // Clear any existing interval
    if (creditUpdateInterval) {
        clearInterval(creditUpdateInterval);
    }
    
    // Set up new interval (20 minutes)
    creditUpdateInterval = setInterval(updateCreditInfo, 20 * 60 * 1000);
}
// Load prompts from localStorage for the history tab
let historyCache = null;
let isHistoryLoading = false;

// Replace the existing loadHistory function with this optimized version
const HISTORY_BATCH_SIZE = 10;
let currentHistoryPage = 0;
let isLoadingMore = false;
let allHistoryLoaded = false;

// Replace the existing loadHistory function with this optimized version
function loadHistory(reset = false) {
    if (reset) {
        currentHistoryPage = 0;
        allHistoryLoaded = false;
        document.getElementById('historyContent').innerHTML = '';
    }

    if (isLoadingMore || allHistoryLoaded) return;
    isLoadingMore = true;

    const history = localStorage.getItem('promptHistory');
    if (!history) {
        isLoadingMore = false;
        return;
    }

    const prompts = JSON.parse(history);
    const startIndex = currentHistoryPage * HISTORY_BATCH_SIZE;
    const endIndex = startIndex + HISTORY_BATCH_SIZE;
    const currentBatch = prompts.slice(startIndex, endIndex);

    if (endIndex >= prompts.length) {
        allHistoryLoaded = true;
    }

    const fragment = document.createDocumentFragment();
    currentBatch.forEach(historyEntry => {
        displayHistoryEntry(historyEntry, fragment);
    });

    const historyContent = document.getElementById('historyContent');
    historyContent.appendChild(fragment);

    const currentTheme = themes[localStorage.getItem('selectedTheme') || 'default'];
    if (currentTheme) {
        applyThemeToHistoryBatch(historyContent.children, currentTheme, startIndex);
    }

    currentHistoryPage++;
    isLoadingMore = false;

    if (!allHistoryLoaded) {
        addLoadingIndicator();
    }
}
// Add intersection observer for infinite scroll
function setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoadingMore && !allHistoryLoaded) {
                loadHistory();
            }
        });
    }, options);

    // Observe loading indicator
    const loadingIndicator = document.querySelector('.history-loading-indicator');
    if (loadingIndicator) {
        observer.observe(loadingIndicator);
    }
}

// Function to add loading indicator
function addLoadingIndicator() {
    let indicator = document.querySelector('.history-loading-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'history-loading-indicator';
        indicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading more history...</p>
        `;
        document.getElementById('historyContent').appendChild(indicator);
        setupInfiniteScroll();
    }
}

// Function to apply theme to newly loaded batch
function applyThemeToHistoryBatch(elements, theme, startIndex) {
    Array.from(elements).slice(startIndex).forEach(element => {
        const promptBoxes = element.querySelectorAll('.prompt-box');
        promptBoxes.forEach(box => {
            box.style.backgroundColor = theme.colors.cardBackground;
            box.style.borderColor = theme.colors.border;

            const buttons = box.querySelectorAll('button');
            buttons.forEach(button => {
                if (button.classList.contains('preview-btn')) {
                    button.style.backgroundColor = theme.colors.previewButtonBackground;
                    if (button.classList.contains('disabled')) {
                        button.style.backgroundColor = theme.colors.previewButtonDisabled;
                    }
                } else if (!button.classList.contains('quick-add-btn')) {
                    button.style.backgroundColor = button.classList.contains('disabled') ? 
                        theme.colors.secondary : 
                        theme.colors.primary;
                }
            });
        });
    });
}

// Add this function to invalidate cache when needed
function invalidateHistoryCache() {
    historyCache = null;
}


   // Save prompt history with input details
// Save prompt history with input details
// Save prompt history with input details
function saveToHistory(prompts, isRandom = false, isVariation = false, originalPrompt = '', isImageAnalysis = false, fileName = '', isRandomVideo = false) {
    let history = localStorage.getItem('promptHistory');
    if (history) {
        history = JSON.parse(history);
    } else {
        history = [];
    }

    const newPrompts = prompts.split('\n').filter(p => p.trim() !== '');
    const isVideoMode = document.querySelector('.container').classList.contains('video-mode');

    let historyEntry = {
        prompts: newPrompts.join('\n'),
        timestamp: Date.now()
    };

    if (isRandom) {
        historyEntry = {
            ...historyEntry,
            type: 'random',
            description: "Random",
            model: "Random",
            style: "Random",
            lighting: "Random",
            cameraAngle: "Random",
            purpose: "Random",
            creativity: "Random",
            promptLength: "Random"  // Changed to "Random" instead of using slider value
        };
    } else if (isVariation) {
        historyEntry = {
            ...historyEntry,
            type: 'variation',
            description: `Variations: ${originalPrompt}`,
            model: modelSelect.value,
            style: styleSelect.value,
            lighting: lightingSelect.value,
            cameraAngle: cameraAngleSelect.value,
            purpose: purposeSelect.value,
            creativity: creativitySlider.value,
            promptLength: promptLengthSlider.value
        };
    } else if (isImageAnalysis) {
        historyEntry = {
            ...historyEntry,
            type: 'image-analysis',
            description: `Image to Prompt: ${fileName}`
        };
    } else if (isVideoMode) {
        if (isRandomVideo) {
             historyEntry = {
                ...historyEntry,
                type: 'video',
                description: "Random",
                style: "Random",
                movement: "Random",
                cameraAngle: "Random",
                promptLength: "Random",
                isVideo: true
            };
        } else {
            historyEntry = {
                ...historyEntry,
                type: 'video',
                description: document.getElementById('videoPromptInput')?.value || '',
                style: document.getElementById('videoStyleSelect')?.value || 'not_specified',
                movement: document.getElementById('videoMovementSelect')?.value || 'not_specified',
                cameraAngle: document.getElementById('videoCameraAngleSelect')?.value || 'not_specified',
                promptLength: getPromptLengthLabel(document.getElementById('videoPromptLength')?.value || '2'),
                isVideo: true
            };
        }
    } else {
        historyEntry = {
            ...historyEntry,
            type: 'standard',
            description: promptInput.value,
            model: modelSelect.value,
            style: styleSelect.value,
            lighting: lightingSelect.value,
            cameraAngle: cameraAngleSelect.value,
            purpose: purposeSelect.value,
            creativity: creativitySlider.value,
            promptLength: promptLengthSlider.value
        };
    }

    history.unshift(historyEntry);

    chrome.storage.local.get(['isPremiumUser'], (result) => {
        const isPremiumUser = result.isPremiumUser || false;
        const historyLimit = isPremiumUser ? 100 : 5;

        if (history.length > historyLimit) {
            history = history.slice(0, historyLimit);
        }

        localStorage.setItem('promptHistory', JSON.stringify(history));
    });

    invalidateHistoryCache();
}
function updateWeeklyPromptsTheme(theme) {
    // Get all weekly prompt cards
    document.querySelectorAll('.weekly-prompt-card').forEach(card => {
        // Update card background
        card.style.backgroundColor = theme.colors.cardBackground;
        
        // Get all buttons in the card
        const buttons = card.querySelectorAll('.button-container button');
        
        buttons.forEach(button => {
            if (button.classList.contains('preview-btn')) {
                // Special handling for preview buttons
                button.style.backgroundColor = theme.colors.previewButtonBackground;
                if (button.classList.contains('disabled')) {
                    button.style.backgroundColor = theme.colors.previewButtonDisabled;
                    button.style.color = theme.colors.previewButtonDisabledText;
                }
            } else if (button.classList.contains('quick-add-btn')) {
                // Quick add button has no background
                button.style.backgroundColor = 'transparent';
            } else {
                // Standard buttons (copy, variations, extend, shorten)
                if (!button.classList.contains('disabled')) {
                    button.style.backgroundColor = theme.colors.primary;
                    button.style.color = '#101010';
                } else {
                    button.style.backgroundColor = theme.colors.secondary;
                    button.style.opacity = '0.7';
                }
            }
        });
  document.querySelectorAll('#weeklyPrompts .quick-add-btn').forEach(btn => {
        updateQuickAddButtonColor(btn, theme);
    });
        // Update text colors
        const promptText = card.querySelector('.weekly-prompt-text');
        if (promptText) {
            promptText.style.color = theme.colors.text;
        }
    });
}

// Modify the displayWeeklyPrompts function to apply theme colors
// Modified function to display weekly prompts
function displayWeeklyPrompts(data) {
    const weeklyPromptsElem = document.getElementById('weeklyPrompts');
    if (!weeklyPromptsElem) return;

    weeklyPromptsElem.innerHTML = '';

    data.weeklyPrompts.forEach(prompt => {
        const promptCard = document.createElement('div');
        promptCard.classList.add('weekly-prompt-card');

        // Add the image
        const promptImage = document.createElement('img');
        promptImage.src = prompt.image;
        promptImage.loading = 'lazy';
        promptImage.classList.add('weekly-prompt-image');
        promptCard.appendChild(promptImage);

        // Add the prompt text without Midjourney parameter styling
        const promptText = document.createElement('p');
        promptText.classList.add('weekly-prompt-text');
        promptText.textContent = prompt.prompt; // Store as plain text
        promptText.setAttribute('data-full-prompt', prompt.prompt);
        promptCard.appendChild(promptText);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        // Create top row
        const topRow = document.createElement('div');
        topRow.classList.add('top-row');

        // Add Copy button
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('copy-btn');
        copyBtn.innerHTML = '<img src="icons/copy-icon.svg" alt="Copy"><span>Copy</span>';
        copyBtn.addEventListener('click', function() {
            copyToClipboard(prompt.prompt, this, true); // Pass true to indicate weekly prompt
        });
        topRow.appendChild(copyBtn);

        // Add Variations button
        const variationsBtn = document.createElement('button');
        variationsBtn.classList.add('variations-btn');
        variationsBtn.innerHTML = '<img src="icons/variations-icon.svg" alt="Variations"><span>Variations</span>';
        variationsBtn.addEventListener('click', () => {
            generatePromptVariations(prompt.prompt);
        });
        topRow.appendChild(variationsBtn);

        // Add Extend button
        const extendBtn = document.createElement('button');
        extendBtn.classList.add('extend-btn');
        extendBtn.innerHTML = '<img src="icons/extend-icon.svg" alt="Extend"><span>Extend</span>';
        if (prompt.prompt.length >= 800) {
            extendBtn.disabled = true;
            extendBtn.classList.add('disabled');
        }
        extendBtn.addEventListener('click', () => generateExtendedPrompts(prompt.prompt));
        topRow.appendChild(extendBtn);

        // Add Shorten button
        const shortenBtn = document.createElement('button');
        shortenBtn.classList.add('shorten-btn');
        shortenBtn.innerHTML = '<img src="icons/shorten-icon.svg" alt="Shorten"><span>Shorten</span>';
        if (prompt.prompt.length < 170) {
            shortenBtn.disabled = true;
            shortenBtn.classList.add('disabled');
        }
        shortenBtn.addEventListener('click', () => generateShortenedPrompts(prompt.prompt));
        topRow.appendChild(shortenBtn);

        // Create bottom row
        const bottomRow = document.createElement('div');
        bottomRow.classList.add('bottom-row');

        // Add Quick Add button
        const quickAddBtn = document.createElement('button');
        quickAddBtn.className = 'quick-add-btn';
        const isInCollection = collectionsManager.isPromptInAnyCollection(prompt.prompt);
        quickAddBtn.innerHTML = isInCollection ? 
            '<img src="icons/star-filled.svg" alt="In Collection">' :
            '<img src="icons/star-empty.svg" alt="Add to Collection">';
        quickAddBtn.title = isInCollection ? 'In Collection' : 'Add to Collection';
        
        // Add click handler for collection functionality
        quickAddBtn.addEventListener('click', async (e) => {
            try {
                e.stopPropagation();
                e.preventDefault();
                
                if (quickAddBtn.dataset.processing === 'true') {
                    return;
                }
                
                quickAddBtn.dataset.processing = 'true';
                
                // Add visual feedback
                quickAddBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    quickAddBtn.style.transform = 'scale(1)';
                }, 100);
                
                await collectionsManager.showQuickAddMenu(e, prompt.prompt);
                
                // Reset processing state after a short delay
                setTimeout(() => {
                    quickAddBtn.dataset.processing = 'false';
                }, 300);
                
            } catch (error) {
                console.error('Quick add button error:', error);
                quickAddBtn.dataset.processing = 'false';
                // Show error feedback to user
                const originalTitle = quickAddBtn.title;
                quickAddBtn.title = 'Error adding to collection. Please try again.';
                setTimeout(() => {
                    quickAddBtn.title = originalTitle;
                }, 2000);
            }
        });
        
        bottomRow.appendChild(quickAddBtn);

        // Add rows to container
        buttonContainer.appendChild(topRow);
        buttonContainer.appendChild(bottomRow);
        promptCard.appendChild(buttonContainer);

        weeklyPromptsElem.appendChild(promptCard);
    });

    // Apply current theme after displaying prompts
    const currentTheme = themes[localStorage.getItem('selectedTheme') || 'default'];
    if (currentTheme) {
        updateWeeklyPromptsTheme(currentTheme);
        document.querySelectorAll('#weeklyPrompts .quick-add-btn').forEach(btn => {
            updateQuickAddButtonColor(btn, currentTheme);
        });
    }
}

function updateQuickAddButtonColor(btn, theme) {
    if (!btn || !theme) return;

    const imgElement = btn.querySelector('img');
    if (!imgElement) return;

    try {
        // 1) FIGURE OUT IF THE ICON IS ALREADY STAR-FILLED
        const alreadyFilled = imgElement.src.includes('star-filled.svg');

        // 2) GET PROMPT TEXT & CHECK COLLECTIONS
        let promptText;
        const promptBox = btn.closest('.prompt-box, .weekly-prompt-card');
        if (promptBox) {
            const textEl = promptBox.querySelector('.prompt-text, .weekly-prompt-text');
            promptText = textEl?.getAttribute('data-full-prompt') || textEl?.textContent;
        }
        const isInCollection = promptText
            ? collectionsManager.isPromptInAnyCollection(promptText)
            : false;
        
        // Decide final "filled" state:
        // if the icon is ALREADY star-filled, keep it filled
        // or if collectionsManager says it's in a collection
        const finalIsFilled = alreadyFilled || isInCollection;

        // 3) SET THE CORRECT STAR ICON & TITLE
        imgElement.src = finalIsFilled
            ? 'icons/star-filled.svg'
            : 'icons/star-empty.svg';
        btn.title = finalIsFilled
            ? 'In Collection'
            : 'Add to Collection';

        // 4) SPECIAL CHRISTMAS THEME
        if (theme.name === 'Christmas Joy') {
            imgElement.style.filter =
                'brightness(0) saturate(100%) invert(45%) sepia(94%) saturate(7471%) hue-rotate(343deg) brightness(101%) contrast(101%)';
            imgElement.style.opacity = finalIsFilled ? '1' : '0.7';

            // Simple hover effects
            btn.addEventListener('mouseenter', () => {
                imgElement.style.opacity = '1';
                imgElement.style.animation = 'christmasStar 1.5s ease-in-out infinite';
            });
            btn.addEventListener('mouseleave', () => {
                if (!finalIsFilled) {
                    imgElement.style.opacity = '0.7';
                    imgElement.style.animation = '';
                }
            });
            return btn;
        }

        // 5) REGULAR THEME HANDLING
        const filter = convertHexToFilter(theme.colors.primary);

        // Apply to the existing <img> first
        imgElement.style.filter = filter;
        imgElement.style.opacity = finalIsFilled ? '1' : '0.7';
        imgElement.style.transition = 'all 0.2s ease';

        // Basic button styling
        btn.style.background = 'none';
        btn.style.border = 'none';
        btn.style.padding = '6px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s ease';

        // 6) CLONE THE BUTTON TO REMOVE OLD EVENT LISTENERS
        const newBtn = btn.cloneNode(true);
        const newImg = newBtn.querySelector('img');

        // --- IMPORTANT: Re-apply the style logic to newImg as well:
        if (newImg) {
            newImg.style.filter = filter;
            newImg.style.opacity = finalIsFilled ? '1' : '0.7';
            newImg.style.transition = 'all 0.2s ease';
        }

        // Add hover effects
        newBtn.addEventListener('mouseenter', () => {
            if (newImg) {
                newImg.style.filter = filter;
                newImg.style.opacity = '1';
                newImg.style.transform = 'scale(1.1)';
            }
        });
        newBtn.addEventListener('mouseleave', () => {
            if (newImg && !finalIsFilled) {
                newImg.style.filter = filter;
                newImg.style.opacity = '0.7';
                newImg.style.transform = 'scale(1)';
            }
        });

        // 7) CLICK HANDLER FOR QUICK ADD MENU
        newBtn.addEventListener('click', async (e) => {
            try {
                e.stopPropagation();
                e.preventDefault();

                if (newBtn.dataset.processing === 'true') {
                    return;
                }
                newBtn.dataset.processing = 'true';

                newBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    newBtn.style.transform = 'scale(1)';
                }, 100);

                if (promptText) {
                    await collectionsManager.showQuickAddMenu(e, promptText);
                }

                setTimeout(() => {
                    newBtn.dataset.processing = 'false';
                }, 300);

            } catch (error) {
                console.error('Quick add button error:', error);
                newBtn.dataset.processing = 'false';

                const originalTitle = newBtn.title;
                newBtn.title = 'Error adding to collection. Please try again.';
                setTimeout(() => {
                    newBtn.title = originalTitle;
                }, 2000);
            }
        });

        // 8) REPLACE IF PARENT EXISTS
        if (btn.parentNode) {
            btn.parentNode.replaceChild(newBtn, btn);
            return newBtn;
        }

        // If no parent, return original
        return btn;

    } catch (error) {
        console.error('Error updating quick add button:', error);
        return btn;
    }
}


// Function to update all quick add buttons
function updateAllQuickAddButtons(theme) {
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        updateQuickAddButtonColor(btn, theme);
    });
}
// Helper function to convert hex to RGB
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

// Helper function to convert hex to RGB (keep existing function)
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

function convertHexToFilter(hex) {
    // Predefined filters for all theme colors
    const filterMap = {
        // Default theme
        '#42f56f': 'brightness(0) saturate(100%) invert(88%) sepia(39%) saturate(1109%) hue-rotate(86deg) brightness(92%) contrast(98%)',  // Default green
        
        // Midnight Blue theme
        '#38bdf8': 'brightness(0) saturate(100%) invert(67%) sepia(78%) saturate(677%) hue-rotate(173deg) brightness(101%) contrast(98%)',
         // Cosmic Theme
    '#FF61D8': 'brightness(0) saturate(100%) invert(67%) sepia(61%) saturate(3042%) hue-rotate(295deg) brightness(102%) contrast(101%)',
    '#61FFED': 'brightness(0) saturate(100%) invert(85%) sepia(44%) saturate(751%) hue-rotate(116deg) brightness(103%) contrast(101%)',
        // Christmas Joy theme
        '#ff3b3b': 'brightness(0) saturate(100%) invert(45%) sepia(94%) saturate(7471%) hue-rotate(343deg) brightness(101%) contrast(101%)',
    // Sakura Theme
    '#FF9EC7': 'brightness(0) saturate(100%) invert(80%) sepia(21%) saturate(1401%) hue-rotate(297deg) brightness(101%) contrast(101%)',
    '#9EFFED': 'brightness(0) saturate(100%) invert(90%) sepia(31%) saturate(541%) hue-rotate(113deg) brightness(103%) contrast(101%)',

    // Desert Night Theme
    '#FFB347': 'brightness(0) saturate(100%) invert(80%) sepia(39%) saturate(1739%) hue-rotate(319deg) brightness(101%) contrast(101%)',
    '#47B3FF': 'brightness(0) saturate(100%) invert(64%) sepia(86%) saturate(757%) hue-rotate(185deg) brightness(101%) contrast(101%)',

    // Matrix Theme
    '#00FF9D': 'brightness(0) saturate(100%) invert(84%) sepia(77%) saturate(1548%) hue-rotate(108deg) brightness(99%) contrast(104%)',
    '#00FFEE': 'brightness(0) saturate(100%) invert(83%) sepia(85%) saturate(838%) hue-rotate(142deg) brightness(103%) contrast(101%)',
        
        // Neon Synth theme
        '#00ffd5': 'brightness(0) saturate(100%) invert(83%) sepia(51%) saturate(427%) hue-rotate(116deg) brightness(103%) contrast(101%)',
        
        // Deep Ocean theme
        '#64ffda': 'brightness(0) saturate(100%) invert(83%) sepia(51%) saturate(427%) hue-rotate(116deg) brightness(103%) contrast(101%)',
        
        // Amethyst theme
        '#e056fd': 'brightness(0) saturate(100%) invert(59%) sepia(75%) saturate(7414%) hue-rotate(261deg) brightness(103%) contrast(96%)',
        
        // Crimson Noir theme
        '#ff3333': 'brightness(0) saturate(100%) invert(36%) sepia(72%) saturate(4047%) hue-rotate(344deg) brightness(101%) contrast(109%)',
        
        // Glacial Frost theme
        '#7ae7ff': 'brightness(0) saturate(100%) invert(77%) sepia(64%) saturate(481%) hue-rotate(157deg) brightness(103%) contrast(101%)',
        
        // Emerald Dusk theme
        '#00ff9d': 'brightness(0) saturate(100%) invert(84%) sepia(77%) saturate(1548%) hue-rotate(108deg) brightness(99%) contrast(104%)',
        
        // Sunset theme
        '#f43f5e': 'brightness(0) saturate(100%) invert(45%) sepia(75%) saturate(2618%) hue-rotate(321deg) brightness(99%) contrast(101%)',
        
        // Forest theme
        '#6ee7b7': 'brightness(0) saturate(100%) invert(89%) sepia(21%) saturate(648%) hue-rotate(98deg) brightness(91%) contrast(88%)',
        // Aurora Dreams theme
    '#64FFDA': 'brightness(0) saturate(100%) invert(83%) sepia(51%) saturate(427%) hue-rotate(116deg) brightness(103%) contrast(101%)',
    
    // Quantum Pulse theme
    '#FF3399': 'brightness(0) saturate(100%) invert(36%) sepia(75%) saturate(7482%) hue-rotate(315deg) brightness(100%) contrast(101%)',
    
    // Arctic Frost theme
    '#7BE0FF': 'brightness(0) saturate(100%) invert(77%) sepia(64%) saturate(481%) hue-rotate(157deg) brightness(103%) contrast(101%)',
    
    // Volcanic theme
    '#FF4C4C': 'brightness(0) saturate(100%) invert(45%) sepia(94%) saturate(1034%) hue-rotate(322deg) brightness(105%) contrast(101%)',
    
    // Enchanted Forest theme
    '#4ADE80': 'brightness(0) saturate(100%) invert(83%) sepia(27%) saturate(1122%) hue-rotate(86deg) brightness(96%) contrast(89%)',
        // Custom Background theme (using default green)
        '#42f56f': 'brightness(0) saturate(100%) invert(88%) sepia(39%) saturate(1109%) hue-rotate(86deg) brightness(92%) contrast(98%)'
    };

    // If we have a predefined filter, use it
    if (filterMap[hex]) {
        return filterMap[hex];
    }

    // Otherwise, generate a filter
    const rgb = hexToRgb(hex);
    let hue = 0;
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    const delta = max - min;

    // Calculate hue
    if (delta !== 0) {
        if (max === rgb.r) {
            hue = ((rgb.g - rgb.b) / delta) % 6;
        } else if (max === rgb.g) {
            hue = (rgb.b - rgb.r) / delta + 2;
        } else {
            hue = (rgb.r - rgb.g) / delta + 4;
        }
        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;
    }

    // Calculate saturation and lightness
    const saturation = max === 0 ? 0 : (delta / max) * 100;
    const lightness = (max / 255) * 100;

    // Return optimized filter for star icons
    return `brightness(0) saturate(100%) invert(${lightness}%) sepia(${saturation}%) saturate(${saturation * 2}%) hue-rotate(${hue}deg) brightness(105%) contrast(105%)`;
}
// Generate optimized filter for any color with increased brightness

// Function to update all quick add buttons in the interface
function updateAllQuickAddButtons(theme) {
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        updateQuickAddButtonColor(btn, theme);
    });
}

async function loadWeeklyPrompts() {
    const cacheKey = 'weeklyPrompts';
    const cacheExpirationKey = 'weeklyPromptsExpiration';
    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
    const now = Date.now();

    const loadingElem = document.getElementById('loading');
    const loadingTextElem = loadingElem.querySelector('p'); // Select the text element inside the loading div

    // Change the text to reflect loading weekly prompts
    loadingTextElem.textContent = 'Loading weekly prompts, please wait...';
    loadingElem.style.display = 'flex'; // Show the loading spinner

    // Check if there is cached data and if it's still valid (not expired)
    const cachedPrompts = localStorage.getItem(cacheKey);
    const cacheExpiration = localStorage.getItem(cacheExpirationKey);

    if (cachedPrompts && cacheExpiration && now < parseInt(cacheExpiration, 10)) {
     
        displayWeeklyPrompts(JSON.parse(cachedPrompts)); // Load from cache
        loadingElem.style.display = 'none'; // Hide the loading spinner
        return;
    }

    // If no valid cache, fetch from API
    try {
       
        // Public: no auth. The /api prefix is part of the path, not the base —
        // the API kept these names because the web client calls them by them.
        const response = await fetch(pcApi.url('/api/weekly-prompts'));
        if (!response.ok) throw new Error(`Weekly prompts unavailable (${response.status})`);
        const data = await response.json();

        // Cache the data and set expiration for 1 day
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheExpirationKey, (now + oneDay).toString());

        displayWeeklyPrompts(data); // Load fresh data
    } catch (error) {
        console.error('Error loading weekly prompts:', error);
    } finally {
        loadingElem.style.display = 'none'; // Hide the loading spinner after data is loaded or on error
    }
}


// Separate function to handle display logic
function createWeeklyPromptCard(prompt) {
   const promptCard = createThemeAwarePromptBox(prompt.prompt, false);
    promptCard.classList.add('weekly-prompt-card');

    // Add the image
    const promptImage = document.createElement('img');
    promptImage.src = prompt.image;
    promptImage.loading = 'lazy';
    promptCard.appendChild(promptImage);

    // Add the prompt text - store full prompt with parameters
    const promptText = document.createElement('p');
    promptText.classList.add('weekly-prompt-text');
    promptText.setAttribute('data-full-prompt', prompt.prompt); // Store complete prompt including parameters
    promptText.textContent = prompt.prompt;
    promptCard.appendChild(promptText);

    // Add the button container
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    // Create top row for main action buttons
    const topRow = document.createElement('div');
    topRow.classList.add('top-row');

    // Add Copy button with modified copy functionality
    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    copyBtn.innerHTML = '<img src="icons/copy-icon.svg" alt="Copy"><span>Copy</span>';
    copyBtn.addEventListener('click', function() {
        // Get the full prompt including parameters
        const fullPrompt = promptText.getAttribute('data-full-prompt');
        copyToClipboard(fullPrompt, this, true); // Added isWeeklyPrompt parameter
    });
    topRow.appendChild(copyBtn);

    // Rest of the button creation code remains the same...
    const variationsBtn = document.createElement('button');
    variationsBtn.classList.add('variations-btn');
    variationsBtn.innerHTML = '<img src="icons/variations-icon.svg" alt="Variations"><span>Variations</span>';
    variationsBtn.addEventListener('click', () => {
        const fullPrompt = promptText.getAttribute('data-full-prompt');
        generatePromptVariations(fullPrompt);
    });
    topRow.appendChild(variationsBtn);

    // Add Extend button
    const extendBtn = document.createElement('button');
    extendBtn.classList.add('extend-btn');
    extendBtn.innerHTML = '<img src="icons/extend-icon.svg" alt="Extend"><span>Extend</span>';
    const fullPrompt = promptText.getAttribute('data-full-prompt');
    if (fullPrompt.length >= 800) {
        extendBtn.disabled = true;
        extendBtn.classList.add('disabled');
    }
    extendBtn.addEventListener('click', () => generateExtendedPrompts(fullPrompt));
    topRow.appendChild(extendBtn);

    // Add Shorten button
    const shortenBtn = document.createElement('button');
    shortenBtn.classList.add('shorten-btn');
    shortenBtn.innerHTML = '<img src="icons/shorten-icon.svg" alt="Shorten"><span>Shorten</span>';
    if (fullPrompt.length < 170) {
        shortenBtn.disabled = true;
        shortenBtn.classList.add('disabled');
    }
    shortenBtn.addEventListener('click', () => generateShortenedPrompts(fullPrompt));
    topRow.appendChild(shortenBtn);

    // Create bottom row for collection button
    const bottomRow = document.createElement('div');
    bottomRow.classList.add('bottom-row');

    // Add Star (Add to Collection) button
    const quickAddBtn = document.createElement('button');
    quickAddBtn.className = 'quick-add-btn';
    const isInAnyCollection = collectionsManager.isPromptInAnyCollection(fullPrompt);
    quickAddBtn.innerHTML = isInAnyCollection ? 
        '<img src="icons/star-filled.svg" alt="In Collection">' :
        '<img src="icons/star-empty.svg" alt="Add to Collection">';
    quickAddBtn.title = isInAnyCollection ? 'In Collection' : 'Add to Collection';
    quickAddBtn.addEventListener('click', (e) => {
        collectionsManager.showQuickAddMenu(e, fullPrompt);
    });
    bottomRow.appendChild(quickAddBtn);

    // Add rows to button container
    buttonContainer.appendChild(topRow);
    buttonContainer.appendChild(bottomRow);
    promptCard.appendChild(buttonContainer);

    return promptCard;
}
function showUpgradePrompt(container, isPreviewLimit = false) {
    // Clear existing content
    container.innerHTML = '';
    
    // Create upgrade prompt container
    const promptDiv = document.createElement('div');
    promptDiv.className = 'limit-reached-prompt';

    if (!isLoggedIn) {
        // Message for non-logged in users
        promptDiv.innerHTML = `
            <h3>Sign In </h3>
            <p>Create a free account to get daily credits or log in to continue.</p>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="upgrade-btn login-btn">
                    <span class="shine"></span>
                    Log In
                </button>
                <button class="upgrade-btn signup-btn">
                    <span class="shine"></span>
                    Create Account
                </button>
            </div>
        `;

        // Add event listeners for the buttons
        const loginBtn = promptDiv.querySelector('.login-btn');
        const signupBtn = promptDiv.querySelector('.signup-btn');
        
        loginBtn.addEventListener('click', () => {
            const loginPopup = document.getElementById('loginForm');
            const loginMessage = document.getElementById('loginMessage');
            loginMessage.textContent = '';
            loginPopup.style.display = 'flex';
            setTimeout(() => {
                loginPopup.classList.add('active');
            }, 10);
            mainContent.style.display = 'none';
        });

        signupBtn.addEventListener('click', () => {
            window.open('https://promptcatalyst.ai/sign-up', '_blank');
        });
    } else {
        // Original premium upgrade message for logged-in users
        const message = isPreviewLimit ? 
            'No More Credits' : 
            'No More Credits';
        
        promptDiv.innerHTML = `
            <h3>${message}</h3>
            <p>Upgrade to Premium to unlock higher limits and exclusive features!</p>
            <div class="features-list">
                <div class="feature-item">
                    <svg class="feature-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span>5,000 Credits per month</span>
                </div>
                <div class="feature-item">
                    <svg class="feature-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span>Generate 5 prompts in one request</span>
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
        `;
        
        // Add click handler for upgrade button
        const upgradeBtn = promptDiv.querySelector('.upgrade-btn');
        upgradeBtn.addEventListener('click', () => {
            window.open('https://promptcatalyst.ai/premium', '_blank');
        });
    }
    
    // Add to container
    container.appendChild(promptDiv);
}
    // Function to send a request to the backend and generate a prompt
  // Function to send a request to the backend and generate a prompt
async function generatePrompt() {
    if (isGenerating) return;
    const description = promptInput.value;
    const style = styleSelect.value;
    const lighting = lightingSelect.value;
    const cameraAngle = cameraAngleSelect.value;
    const model = modelSelect.value;
    const purpose = purposeSelect.value;
    const promptLength = getPromptLengthLabel(promptLengthSlider.value);
    const creativity = creativitySlider.value;

    setLoading(true);
    switchTab('generated');
    loadingElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const headers = await pcApi.headers();

        // Revalidate premium before generating: a subscription bought on the
        // website should take effect here without signing out and back in.
        if (headers['Authorization']) {
            const premium = await pcApi.request('/test-premium', { method: 'GET' });
            if (premium.ok) {
                isPremiumUser = premium.data?.is_premium || false;
                chrome.storage.local.set({ isPremiumUser });
            }
        }

        const response = await fetch(pcApi.url('/generate-prompt-deepseek'), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                description,
                style,
                lighting,
                cameraAngle,
                model,
                purpose,
                promptLength,
                creativity
            }),
        });

        if (await pcApi.isSessionExpired(response)) {
            handleAuthError();
            return;
        }

        const data = await response.json();

        if (pcApi.isTerminal(response, data)) {
            // Out of credits, or a locked style/purpose: both need the upsell,
            // and neither is helped by trying again.
            showUpgradePrompt(resultElem);
            console.warn('Refused:', data?.code, data?.error);
            return;
        } else if (response.ok) {
            displayPrompts(data.prompt || 'Failed to generate prompt');
            savePrompts(data.prompt);
            console.log('Prompt generated successfully.');
        } else {
            resultElem.textContent = pcApi.errorMessage(data);
            console.error('Error generating prompt:', data?.error);
        }
    } catch (error) {
        resultElem.textContent = 'An error occurred. Please try again.';
        console.error('Error generating prompt:', error);
    } finally {
        setLoading(false);
    }
}



generateBtn.addEventListener('click', () => {
    if (isVideoMode()) {
        generateVideoPrompt();
    } else {
        generatePrompt();
    }
    incrementPromptCount();
});

    // Load prompts when the extension opens
    loadPrompts();

// Function to send request to backend to generate random prompts
  async function generateRandomPrompt() {
    if (isGenerating) return;
    setLoading(true, 'Generating random prompts, please wait...');
    switchTab('generated');
    loadingElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const headers = await pcApi.headers();

        const response = await fetch(pcApi.url('/generate-random-prompts'), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({})
        });

        if (await pcApi.isSessionExpired(response)) {
            handleAuthError();
            return;
        }

        const data = await response.json();

        if (pcApi.isTerminal(response, data)) {
            showUpgradePrompt(resultElem);
            console.warn('Refused:', data?.code, data?.error);
            return;
        } else if (response.ok) {
            displayPrompts(data.prompts || 'Failed to generate random prompts');
            savePrompts(data.prompts, false);
            saveToHistory(data.prompts, true);
            console.log('Random prompts generated successfully.');
        } else {
            resultElem.textContent = pcApi.errorMessage(data);
        }
    } catch (error) {
        resultElem.textContent = 'An error occurred. Please try again.';
        console.error('Error generating random prompts:', error);
    } finally {
        setLoading(false);
    }
}


const upgradeButton = document.querySelector('.premium-upgrade-btn');

// Add click event listener
if (upgradeButton) {
    upgradeButton.addEventListener('click', () => {
        // Open the premium subscription page in a new tab
        window.open('https://promptcatalyst.ai/premium', '_blank');
        
        // Close the premium popup after clicking
       
        if (premiumPopup) {
            premiumPopup.classList.remove('active');
            setTimeout(() => {
                premiumPopup.style.display = 'none';
            }, 300);
        }
    });
}



    // Event listener for random prompt button
    randomBtn.addEventListener('click', () => {
    generateRandomPrompt();
    incrementPromptCount();
});
});
