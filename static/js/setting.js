// Self-executing function to avoid global namespace pollution
(function() {
    // Apply theme early, before DOM content loaded
    applySavedThemeEarly();
    
    document.addEventListener('DOMContentLoaded', function() {
        // Get modal elements
        const modal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('close-modal');
        const saveButton = document.querySelector('.save-button');
        const colorOptions = document.querySelectorAll('.color-option');
        
        // Close modal when close button is clicked
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Close modal when clicking outside of it
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Handle color option selection
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all color options
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                this.classList.add('selected');
                
                // Get theme name from data attribute
                const theme = this.getAttribute('data-theme');
                
                // Apply theme immediately
                applyTheme(theme);
            });
        });
        
        // Handle save button
        saveButton.addEventListener('click', function() {
            let selectedTheme = 'light'; // Default theme
            
            // Find selected theme
            colorOptions.forEach(option => {
                if (option.classList.contains('selected')) {
                    selectedTheme = option.getAttribute('data-theme');
                }
            });
            
            // Save selected theme with a consistent key across all pages
            localStorage.setItem('siteTheme', selectedTheme);
            
            // Close modal
            modal.style.display = 'none';
            
            // Display a success message
            showToast("Theme saved successfully!");
        });
        
        // Load saved theme on page load
        loadSavedTheme();
    });
    
    // Function to apply theme early before DOM is fully loaded
    function applySavedThemeEarly() {
        const savedTheme = localStorage.getItem('siteTheme');
        if (savedTheme) {
            // Remove all theme classes from document root
            document.documentElement.classList.remove(
                'theme-light', 
                'theme-softred', 
                'theme-focus', 
                'theme-nature',
                'theme-sun'
            );
            
            // Apply basic theme class early to avoid flash of default theme
            document.documentElement.classList.add(`theme-${savedTheme}`);
            
            // Apply theme colors
            const themeColors = getThemeColors(savedTheme);
            applyThemeColors(themeColors);
        }
    }
    
    // Apply theme based on theme name
    function applyTheme(theme) {
        // Remove all theme classes from document root
        document.documentElement.classList.remove(
            'theme-light', 
            'theme-softred', 
            'theme-focus', 
            'theme-nature',
            'theme-sun'
        );
        
        // Add selected theme class to document root (not body)
        document.documentElement.classList.add(`theme-${theme}`);
        
        // Apply theme colors based on theme name
        const themeColors = getThemeColors(theme);
        applyThemeColors(themeColors);
    }
    
    // Get theme colors based on theme name
    function getThemeColors(theme) {
        const themeMap = {
            'light': { 
                primary: '#ecc86e', 
                secondary: '#c49a3f', 
                background: '#f9e5b8',  // Lighter than primary
                text: '#4a3e2a',
                card: '#ffffff',
                logo: '#2c3e50',
                button: '#2c3e50'
            },
            'softred': { 
                primary: '#d86f6f',  // Warm muted red
                secondary: '#f2a1a1',  // Soft pastel red
                background: '#f8dada',  // Very light pinkish-red
                text: '#732626',  // Deep red-brown for readability
                card: '#ffffff',  // Clean white cards
                logo: '#d86f6f',  // Matches primary color
                button: '#b85656'  // Slightly darker red for contrast
            },
            'focus': { 
                primary: '#5a3f72',       // Deep lavender
                secondary: '#b89ccf',     // Soft pastel lavender
                background: '#d8c4e6',    // Light lavender background
                text: '#2e2e2e',          // Dark gray for contrast and readability
                card: '#ffffff',          // Slightly darker than secondary for depth
                logo: '#b89ccf',          // Matches secondary
                button: '#5a3f72' 
            },
            'nature': { 
                primary: '#2d4a22', 
                secondary: '#a0cf95', 
                background: '#5a7f58',  // Lighter than primary
                text: '#333333',
                card: '#ffffff',
                logo: '#a0cf95',
                button: '#2d4a22'
            },
            'sun': { 
                primary: '#2c3e50', 
                secondary: '#bdc3c7', 
                background: '#546e87',  // Lighter than primary
                text: '#2d3436',
                card: '#ffffff',
                logo: '#f39c12',
                button: '#2c3e50'
            }
        };
        
        
        return themeMap[theme] || themeMap['sun']; // Default to light theme if theme not found
    }
    
    // Apply theme colors to CSS variables
    function applyThemeColors(colors) {
        document.documentElement.style.setProperty('--primary-color', colors.primary);
        document.documentElement.style.setProperty('--secondary-color', colors.secondary);
        document.documentElement.style.setProperty('--background-color', colors.background);
        document.documentElement.style.setProperty('--text-color', colors.text);
        document.documentElement.style.setProperty('--card-bg', colors.card);
    }
    
    // Function to show the settings modal
    window.showSettingsModal = function() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Select the current theme when opening modal
            const savedTheme = localStorage.getItem('siteTheme') || 'light';
            const colorOptions = document.querySelectorAll('.color-option');
            
            colorOptions.forEach(option => {
                if (option.getAttribute('data-theme') === savedTheme) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }
    };
    
    // Function to show toast notification
    function showToast(message) {
        // Check if toast container exists
        let toastContainer = document.getElementById('toast-container');
        
        // Create it if it doesn't exist
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.left = '50%';
            toastContainer.style.transform = 'translateX(-50%)';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = message;
        toast.style.backgroundColor = 'var(--primary-color)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.marginTop = '10px';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show the toast
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // Hide and remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Load saved theme on page load
    function loadSavedTheme() {
        // Check for theme in localStorage
        const savedTheme = localStorage.getItem('siteTheme');
        
        if (savedTheme) {
            // Apply saved theme
            applyTheme(savedTheme);
            
            // Update color option selection in modal
            const colorOptions = document.querySelectorAll('.color-option');
            colorOptions.forEach(option => {
                if (option.getAttribute('data-theme') === savedTheme) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        } else {
            // Set default theme if no saved theme
            applyTheme('light');
            
            // Select light theme option in modal
            const colorOptions = document.querySelectorAll('.color-option');
            colorOptions.forEach(option => {
                if (option.getAttribute('data-theme') === 'light') {
                    option.classList.add('selected');
                }
            });
        }
    }
})();
// Add this to your existing DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', function() {
    const settingsLink = document.getElementById('settings-link');
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Use the globally defined showSettingsModal function
            if (typeof window.showSettingsModal === 'function') {
                window.showSettingsModal();
            } else {
                console.error('showSettingsModal function not found');
                // Fallback if function is missing
                const modal = document.getElementById('settings-modal');
                if (modal) modal.style.display = 'block';
            }
        });
    }
    
    // Fix home link (optional if you want direct navigation to work)
    const homeLink = document.querySelector('a[href="\\templates\\home.html"]');
    if (homeLink) {
        // Fix the href attribute
        homeLink.setAttribute('href', '/templates/home.html');
        
        // Optional: Add click handler if you want to do something special
        homeLink.addEventListener('click', function(e) {
            // If you want the browser to handle navigation normally,
            // no need to prevent default
            // e.preventDefault();
            // window.location.href = '/templates/home.html';
        });
    }
    
    // Check login status and update UI
    updateLoginStatus();
});

// Function to update login status display
function updateLoginStatus() {
    const loginStatusElement = document.getElementById('login-status');
    
    // Check if user is logged in (based on session)
    fetch('/api/user-data')
        .then(response => {
            if (response.status === 401) {
                // User is not logged in
                loginStatusElement.innerHTML = `
                    <p>You are currently using the app as a guest.</p>
                    <div class="auth-buttons">
                        <a href="/login" class="auth-btn login-btn">Log In</a>
                        <a href="/signup" class="auth-btn signup-btn">Sign Up</a>
                    </div>
                `;
            } else {
                // User is logged in
                return response.json().then(data => {
                    loginStatusElement.innerHTML = `
                        <p>Logged in</p>
                        <div class="auth-buttons">
                            <a href="/logout" class="auth-btn logout-btn">Log Out</a>
                        </div>
                    `;
                });
            }
        })
        .catch(error => {
            console.error('Error checking login status:', error);
            // Default to guest view if there's an error
            loginStatusElement.innerHTML = `
                <p>You are currently using the app as a guest.</p>
                <div class="auth-buttons">
                    <a href="/login" class="auth-btn login-btn">Log In</a>
                    <a href="/signup" class="auth-btn signup-btn">Sign Up</a>
                </div>
            `;
        });
}