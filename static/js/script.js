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

    // DOM Elements
const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const pauseBtn = document.getElementById('pause-btn');
const addTimeBtn = document.getElementById('add-time-btn');
const finishBtn = document.getElementById('finish-btn');
const sessionTypeLabel = document.getElementById('session-type');
const breakTimeDisplay = document.getElementById('break-time');
const themeToggle = document.getElementById('theme-toggle');
const settingsLink = document.getElementById('settings-link');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.getElementById('close-modal');
const cancelSettings = document.getElementById('cancel-settings');
const saveSettings = document.getElementById('save-settings');
const currentSessionDisplay = document.getElementById('current-session');
const totalSessionsDisplay = document.getElementById('total-sessions');

// Timer settings
let timerSettings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4
};

// Load settings from localStorage if available
loadSettings();

// Timer state
let isRunning = false;
let timerInterval = null;
let currentSession = 1;
let currentMode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
let timeRemaining = timerSettings.focusDuration * 60; // in seconds
let originalTime = timeRemaining;
let completedSessions = 0;

// Update total sessions display
totalSessionsDisplay.textContent = timerSettings.sessionsBeforeLongBreak;

// Initialize timer display
updateTimerDisplay();

// Event listeners
pauseBtn.addEventListener('click', toggleTimer);
addTimeBtn.addEventListener('click', addMoreTime);
finishBtn.addEventListener('click', finishEarly);
themeToggle.addEventListener('click', toggleTheme);
settingsLink.addEventListener('click', openSettings);
closeModal.addEventListener('click', closeSettings);
cancelSettings.addEventListener('click', closeSettings);
saveSettings.addEventListener('click', saveTimerSettings);

// Check for saved theme preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
}

// Functions
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
        pauseBtn.textContent = 'Resume';
    } else {
        startTimer();
        pauseBtn.textContent = 'Pause';
    }
}

function startTimer() {
    isRunning = true;
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        updateProgressBar();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            completeSession();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.title = `${timerDisplay.textContent} - Pomodoro Timer`;
    
    // Update break time display
    if (currentMode === 'focus') {
        breakTimeDisplay.textContent = timerDisplay.textContent;
    }
}

function updateProgressBar() {
    const percentComplete = 100 - ((timeRemaining / originalTime) * 100);
    progressBar.style.width = `${percentComplete}%`;
}

function addMoreTime() {
    timeRemaining += 5 * 60; // Add 5 minutes
    updateTimerDisplay();
}

function finishEarly() {
    if (confirm("Are you sure you want to finish this session early?")) {
        clearInterval(timerInterval);
        completeSession();
    }
}

function completeSession() {
    // Play notification sound (browser may block if no user interaction)
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play();
    } catch (error) {
        console.log("Could not play notification sound", error);
    }

    if (currentMode === 'focus') {
        // Completed a focus session
        completedSessions++;
        
        // Determine if we need a long break or short break
        if (completedSessions % timerSettings.sessionsBeforeLongBreak === 0) {
            // Time for a long break
            currentMode = 'longBreak';
            timeRemaining = timerSettings.longBreakDuration * 60;
            sessionTypeLabel.textContent = 'Long Break';
            progressBar.style.backgroundColor = 'var(--secondary-color)';
        } else {
            // Time for a short break
            currentMode = 'shortBreak';
            timeRemaining = timerSettings.shortBreakDuration * 60;
            sessionTypeLabel.textContent = 'Short Break';
            progressBar.style.backgroundColor = 'var(--secondary-color)';
        }
        
        // Update session counter
        currentSession = (completedSessions % timerSettings.sessionsBeforeLongBreak) + 1;
        if (currentSession > timerSettings.sessionsBeforeLongBreak) {
            currentSession = 1;
        }
        currentSessionDisplay.textContent = currentSession;
        
    } else {
        // Completed a break session
        currentMode = 'focus';
        timeRemaining = timerSettings.focusDuration * 60;
        sessionTypeLabel.textContent = 'Focus Session';
        progressBar.style.backgroundColor = 'var(--primary-color)';
    }
    
    // Reset timer state
    originalTime = timeRemaining;
    isRunning = false;
    pauseBtn.textContent = 'Start';
    progressBar.style.width = '0%';
    updateTimerDisplay();
    
    // Add animation to show session completed
    timerDisplay.classList.add('timer-complete');
    setTimeout(() => {
        timerDisplay.classList.remove('timer-complete');
    }, 3000);
    
    // Save stats to localStorage
    saveStats();
}

function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDarkMode);
}

function openSettings() {
    // Populate settings fields with current values
    document.getElementById('focus-input').value = timerSettings.focusDuration;
    document.getElementById('short-break-input').value = timerSettings.shortBreakDuration;
    document.getElementById('long-break-input').value = timerSettings.longBreakDuration;
    document.getElementById('sessions-input').value = timerSettings.sessionsBeforeLongBreak;
    
    settingsModal.style.display = 'flex';
}

function closeSettings() {
    settingsModal.style.display = 'none';
}

function saveTimerSettings() {
    // Get values from form
    const focusDuration = parseInt(document.getElementById('focus-input').value);
    const shortBreakDuration = parseInt(document.getElementById('short-break-input').value);
    const longBreakDuration = parseInt(document.getElementById('long-break-input').value);
    const sessionsBeforeLongBreak = parseInt(document.getElementById('sessions-input').value);
    
    // Validate values
    if (focusDuration < 1 || shortBreakDuration < 1 || longBreakDuration < 1 || sessionsBeforeLongBreak < 1) {
        alert("All values must be greater than 0");
        return;
    }
    
    // Update settings
    timerSettings = {
        focusDuration,
        shortBreakDuration,
        longBreakDuration,
        sessionsBeforeLongBreak
    };
    
    // Save to localStorage
    localStorage.setItem('timerSettings', JSON.stringify(timerSettings));
    
    // Update timer display and session counter
    if (currentMode === 'focus') {
        timeRemaining = timerSettings.focusDuration * 60;
    } else if (currentMode === 'shortBreak') {
        timeRemaining = timerSettings.shortBreakDuration * 60;
    } else {
        timeRemaining = timerSettings.longBreakDuration * 60;
    }
    
    originalTime = timeRemaining;
    updateTimerDisplay();
    progressBar.style.width = '0%';
    
    // Update total sessions display
    totalSessionsDisplay.textContent = timerSettings.sessionsBeforeLongBreak;
    
    // Reset timer if running
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        pauseBtn.textContent = 'Start';
    }
    
    // Close modal
    closeSettings();
}

function loadSettings() {
    const savedSettings = localStorage.getItem('timerSettings');
    if (savedSettings) {
        timerSettings = JSON.parse(savedSettings);
    }
}

function saveStats() {
    let stats = JSON.parse(localStorage.getItem('pomodoroStats')) || {
        focusSessionsCompleted: 0,
        breakSessionsCompleted: 0,
        totalFocusTime: 0,  // in minutes
        totalBreakTime: 0   // in minutes
    };
    
    if (currentMode === 'focus') {
        stats.breakSessionsCompleted++;
        stats.totalBreakTime += currentMode === 'longBreak' ? 
            timerSettings.longBreakDuration : timerSettings.shortBreakDuration;
    } else {
        stats.focusSessionsCompleted++;
        stats.totalFocusTime += timerSettings.focusDuration;
    }
    
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// Add notification support
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// Call this when the page loads
requestNotificationPermission();

// Function to show notification when session completes
function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: 'https://example.com/pomodoro-icon.png' // Replace with your icon URL
        });
    }
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

//journal
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app
    initApp();
});

function initApp() {
    // Initialize tasks
    initTasks();
    
    // Initialize notes
    initNotes();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize theme toggler
    initThemeToggle();
    
    // Update statistics
    updateStats();
}

// Tasks functionality
function initTasks() {
    // DOM elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const taskSearch = document.getElementById('task-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyTasksEl = document.getElementById('empty-tasks');
    const emptyTaskBtn = emptyTasksEl.querySelector('.empty-action-btn');
    
    // Load tasks from storage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Render initial tasks
    renderTasks();
    
    // Event Listeners
    taskForm.addEventListener('submit', addTask);
    taskList.addEventListener('click', handleTaskAction);
    taskSearch.addEventListener('input', filterTasks);
    filterBtns.forEach(btn => btn.addEventListener('click', applyFilter));
    emptyTaskBtn.addEventListener('click', () => {
        taskInput.focus();
    });
    
    // Add task function
    function addTask(e) {
        e.preventDefault();
        
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        
        const newTask = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        
        taskInput.value = '';
        taskInput.focus();
    }
    
    // Handle task actions (complete, edit, delete)
    function handleTaskAction(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;
        
        // Handle checkbox click
        if (e.target.classList.contains('task-checkbox')) {
            toggleTaskComplete(taskId);
        }
        
        // Handle delete button click
        if (e.target.classList.contains('task-delete-btn') || e.target.closest('.task-delete-btn')) {
            deleteTask(taskId);
        }
        
        // Handle edit button click (future feature)
        if (e.target.classList.contains('task-edit-btn') || e.target.closest('.task-edit-btn')) {
            // Future implementation
            alert('Edit feature coming soon!');
        }
    }
    
    // Toggle task complete status
    function toggleTaskComplete(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
    }
    
    // Delete a task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
    
    // Filter tasks based on search input
    function filterTasks() {
        const searchTerm = taskSearch.value.toLowerCase();
        renderTasks(searchTerm);
    }
    
    // Apply filter (All, Active, Completed)
    function applyFilter(e) {
        const filterType = e.target.dataset.filter;
        
        // Update active filter button
        filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        renderTasks(taskSearch.value.toLowerCase(), filterType);
    }
    
    // Render tasks to the DOM
    function renderTasks(searchTerm = '', filterType = 'all') {
        // Filter tasks based on search term and filter type
        let filteredTasks = tasks;
        
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filterType === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (filterType === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        // Clear task list
        taskList.innerHTML = '';
        
        // Show or hide empty state
        if (filteredTasks.length === 0) {
            if (tasks.length === 0) {
                emptyTasksEl.style.display = 'block';
            } else {
                emptyTasksEl.style.display = 'none';
            }
        } else {
            emptyTasksEl.style.display = 'none';
        }
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskEl = document.createElement('li');
            taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskEl.dataset.id = task.id;
            
            taskEl.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                </div>
                <div class="task-actions">
                    <button class="task-edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            taskList.appendChild(taskEl);
        });
        
        // Update task stats
        updateTaskStats();
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateStats();
    }
    
    // Update task statistics
    function updateTaskStats() {
        const totalTasksEl = document.getElementById('total-tasks');
        const completedTasksEl = document.getElementById('completed-tasks');
        const activeTasksEl = document.getElementById('active-tasks');
        
        const completedCount = tasks.filter(task => task.completed).length;
        const totalCount = tasks.length;
        const activeCount = totalCount - completedCount;
        
        totalTasksEl.textContent = totalCount;
        completedTasksEl.textContent = completedCount;
        activeTasksEl.textContent = activeCount;
    }
}

// Notes functionality
function initNotes() {
    // DOM elements
    const notesContainer = document.getElementById('notes-container');
    const addNoteBtn = document.getElementById('add-note-btn');
    const noteEditor = document.getElementById('note-editor');
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const saveNoteBtn = document.getElementById('save-note');
    const closeEditorBtn = document.getElementById('close-editor');
    const noteSearch = document.getElementById('note-search');
    const colorOptions = document.querySelectorAll('.color-option');
    const emptyNotesEl = document.getElementById('empty-notes');
    const emptyNoteBtn = emptyNotesEl.querySelector('.empty-action-btn');
    
    // State
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let currentNoteId = null;
    let selectedColor = 'default';
    
    // Render initial notes
    renderNotes();
    
    // Event Listeners
    addNoteBtn.addEventListener('click', openNewNote);
    saveNoteBtn.addEventListener('click', saveNote);
    closeEditorBtn.addEventListener('click', closeEditor);
    noteSearch.addEventListener('input', filterNotes);
    emptyNoteBtn.addEventListener('click', openNewNote);
    
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedColor = option.dataset.color;
            
            // Update selected state
            colorOptions.forEach(opt => opt.style.border = 'none');
            option.style.border = '2px solid var(--primary-color)';
        });
    });
    
    // Functions
    function openNewNote() {
        currentNoteId = null;
        noteTitle.value = '';
        noteContent.value = '';
        selectedColor = 'default';
        
        // Reset color selection
        colorOptions.forEach(opt => opt.style.border = 'none');
        colorOptions[0].style.border = '2px solid var(--primary-color)';
        
        noteEditor.classList.add('active');
        noteTitle.focus();
    }
    
    function openEditNote(id) {
        const note = notes.find(note => note.id === id);
        if (!note) return;
        
        currentNoteId = id;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        selectedColor = note.color || 'default';
        
        // Update color selection
        colorOptions.forEach(opt => {
            if (opt.dataset.color === selectedColor) {
                opt.style.border = '2px solid var(--primary-color)';
            } else {
                opt.style.border = 'none';
            }
        });
        
        noteEditor.classList.add('active');
        noteTitle.focus();
    }
    
    function closeEditor() {
        noteEditor.classList.remove('active');
    }
    
    function saveNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (content === '') return;
        
        if (currentNoteId) {
            // Update existing note
            notes = notes.map(note => {
                if (note.id === currentNoteId) {
                    return {
                        ...note,
                        title: title || 'Untitled',
                        content,
                        color: selectedColor,
                        updatedAt: new Date().toISOString()
                    };
                }
                return note;
            });
        } else {
            // Create new note
            const newNote = {
                id: Date.now().toString(),
                title: title || 'Untitled',
                content,
                color: selectedColor,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            notes.push(newNote);
        }
        
        saveNotes();
        renderNotes();
        closeEditor();
    }
    
    function deleteNote(id) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        renderNotes();
    }
    
    function filterNotes() {
        const searchTerm = noteSearch.value.toLowerCase();
        renderNotes(searchTerm);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    function renderNotes(searchTerm = '') {
        // Insert add note button
        notesContainer.innerHTML = '';
        notesContainer.appendChild(addNoteBtn);
        
        // Filter notes based on search term
        let filteredNotes = notes;
        if (searchTerm) {
            filteredNotes = notes.filter(note => 
                note.title.toLowerCase().includes(searchTerm) || 
                note.content.toLowerCase().includes(searchTerm)
            );
        }
        
        // Show or hide empty state
        if (notes.length === 0) {
            emptyNotesEl.style.display = 'block';
        } else {
            emptyNotesEl.style.display = 'none';
        }
        
        // Render each note
        filteredNotes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = `note-card ${note.color ? `color-${note.color}` : ''}`;
            noteEl.dataset.id = note.id;
            
            if (note.color && note.color !== 'default') {
                noteEl.style.backgroundColor = getColorValue(note.color);
            }
            
            noteEl.innerHTML = `
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <div class="note-options">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                </div>
                <div class="note-content">${note.content}</div>
                <div class="note-footer">
                    <span class="note-date">${formatDate(note.updatedAt)}</span>
                </div>
            `;
            
            // Add event listeners to the note
            noteEl.addEventListener('click', (e) => {
                // Don't open if clicking on options
                if (e.target.closest('.note-options')) {
                    return;
                }
                
                openEditNote(note.id);
            });
            
            // Add options menu functionality
            const optionsBtn = noteEl.querySelector('.note-options');
            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Simple confirmation for delete
                if (confirm('Delete this note?')) {
                    deleteNote(note.id);
                }
            });
            
            notesContainer.appendChild(noteEl);
        });
    }
    
    function getColorValue(color) {
        const colorMap = {
            'red': '#ffcdd2',
            'orange': '#ffe0b2',
            'yellow': '#fff9c4',
            'green': '#c8e6c9',
            'blue': '#bbdefb',
            'purple': '#e1bee7'
        };
        
        return colorMap[color] || '';
    }
    
    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
        updateStats();
    }
}

// Navigation
function initNavigation() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = {
        'Tasks': document.getElementById('tasks-section'),
        'Notes': document.getElementById('notes-section'),
        'Stats': document.getElementById('stats-section')
    };

// Add click event listeners to navigation links (except theme toggle)
    navLinks.forEach(link => {
        if (link.id !== 'theme-toggle') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Hide all sections
                Object.values(sections).forEach(section => {
                    section.style.display = 'none';
                });
                
                // Show the corresponding section
                const sectionName = this.textContent.trim();
                sections[sectionName].style.display = 'block';
            });
        }
    });
}

// Theme toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or use preferred color scheme
    const currentTheme = localStorage.getItem('theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    
    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Toggle theme
        document.body.classList.toggle('dark-mode');
        
        // Update icon
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Update overall stats
function updateStats() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalNotes = notes.length;
    
    // Update stats in the Stats section
    document.getElementById('stat-total-tasks').textContent = totalTasks;
    document.getElementById('stat-completed-tasks').textContent = completedTasks;
    document.getElementById('stat-completion-rate').textContent = `${completionRate}%`;
    document.getElementById('stat-total-notes').textContent = totalNotes;
}
