// DOM Elements for Welcome Page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the welcome page
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const guestBtn = document.getElementById('guest-btn');
    
    if (loginBtn && signupBtn && guestBtn) {
        // Event Listeners for Welcome Page
        loginBtn.addEventListener('click', () => {
            // In a real app with Flask, this would redirect to login page or show modal
            window.location.href = '/login';
        });

        signupBtn.addEventListener('click', () => {
            // In a real app with Flask, this would redirect to signup page or show modal
            window.location.href = '/signup';
        });

        guestBtn.addEventListener('click', () => {
            window.location.href = '/home';
        });
    }
    const form = document.getElementById('signup-form');
    if (form) {
      // Remove any existing event listeners and let the form submit normally
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      console.log('Form event listeners cleared');
    }
    //settings
    
    // Home page card functionality
    const pomodoroCard = document.getElementById('pomodoro-card');
    const journalCard = document.getElementById('journal-card');
    const statsCard = document.getElementById('stats-card');
    
    if (pomodoroCard && journalCard && statsCard) {
        // Card click handlers for Home Page
        pomodoroCard.addEventListener('click', function() {
            // Redirect to timer page
            window.location.href = '/timer';
        });

        journalCard.addEventListener('click', function() {
            // Redirect to journal page
            window.location.href = '/journal';
        });

        statsCard.addEventListener('click', function() {
            // Redirect to stats page
            window.location.href = '/statistics';
        });
    }

});

// Theme toggle function (can be connected to settings later)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}
// DOM Elements for Signup Page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the signup page
    const signupForm = document.getElementById('signup-form');
    
    if (signupForm) {
        // Event Listener for Signup Form
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            // Validate form data
            if (!name || !email || !password || !confirmPassword) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showMessage('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 8) {
                showMessage('Password must be at least 8 characters long', 'error');
                return;
            }
            
            // Create form data for submission
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('confirm_password', confirmPassword);
            
            // Submit form data
            fetch('/signup', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.message) {
                    showMessage(data.message, data.status);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('An error occurred. Please try again.', 'error');
            });
        });
    }
    
    // Helper function to show messages
    function showMessage(message, type) {
        // Check if flash message container exists, if not, create one
        let flashContainer = document.querySelector('.flash-messages');
        if (!flashContainer) {
            flashContainer = document.createElement('div');
            flashContainer.className = 'flash-messages';
            document.body.insertBefore(flashContainer, document.body.firstChild);
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `flash-message ${type}`;
        messageElement.textContent = message;
        
        // Add close button
        const closeButton = document.createElement('span');
        closeButton.className = 'close-btn';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = function() {
            flashContainer.removeChild(messageElement);
        };
        messageElement.appendChild(closeButton);
        
        // Add message to container
        flashContainer.appendChild(messageElement);
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode === flashContainer) {
                flashContainer.removeChild(messageElement);
            }
        }, 5000);
    }
});

