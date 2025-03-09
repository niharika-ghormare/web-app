document.addEventListener('DOMContentLoaded', () => {
    // DOM Element Selectors
    const elements = {
        timer: document.getElementById('timer'),
        progressBar: document.getElementById('progress-bar'),
        pauseBtn: document.getElementById('pause-btn'),
        addTimeBtn: document.getElementById('add-time-btn'),
        finishBtn: document.getElementById('finish-btn'),
        sessionTypeLabel: document.getElementById('session-type'),
        settingsLink: document.getElementById('settings-link'),
        settingsModal: document.getElementById('settings-modal'),
        closeModal: document.getElementById('close-modal'),
        cancelSettings: document.getElementById('cancel-settings'),
        saveSettings: document.getElementById('save-settings'),
        focusInput: document.getElementById('focus-input'),
        shortBreakInput: document.getElementById('short-break-input'),
        longBreakInput: document.getElementById('long-break-input'),
        sessionsInput: document.getElementById('sessions-input'),
        taskForm: document.getElementById('task-form'),
        taskInput: document.getElementById('task-input'),
        taskList: document.getElementById('task-list'),
        emptyState: document.getElementById('empty-tasks'),
        totalTasksDisplay: document.getElementById('total-tasks'),
        completedTasksDisplay: document.getElementById('completed-tasks'),
        activeTasksDisplay: document.getElementById('active-tasks'),
        taskFilterBtns: document.querySelectorAll('.filter-btn'),
    };

    // Add event listener for when the window is about to unload
    window.addEventListener('beforeunload', clearPomodoroLocalStorage);

    function clearPomodoroLocalStorage() {
        // Clear all Pomodoro app-related items from localStorage
        localStorage.removeItem('tasks');
        localStorage.removeItem('timerSettings');
        localStorage.removeItem('sessionCount');
        localStorage.removeItem('currentMode');
    }

    // Task Management Class
    class TaskManager {
        constructor() {
            this.tasks = [];
            this.loadTasks();
            this.setupEventListeners();
            this.updateTaskStats();
        }

        setupEventListeners() {
            if (elements.taskForm) {
                elements.taskForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTask();
                });
            }

            elements.taskFilterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    elements.taskFilterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.filterTasks(btn.dataset.filter);
                });
            });

            elements.taskList.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (!taskItem) return;

                if (e.target.classList.contains('task-delete-btn')) {
                    this.deleteTask(taskItem.dataset.id);
                } else if (e.target.classList.contains('task-checkbox')) {
                    this.toggleTaskCompletion(taskItem.dataset.id);
                }
            });
        }

        loadTasks() {
            const savedTasks = localStorage.getItem('pomodoroTasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                this.renderTasks();
            }
        }

        saveTasks() {
            localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
            this.updateTaskStats();
            
            // Dispatch custom event for task completion tracking
            if (this.tasks.some(t => t.completed)) {
                document.dispatchEvent(new CustomEvent('taskCompleted'));
            }
        }

        addTask() {
            const taskText = elements.taskInput.value.trim();
            if (!taskText) return;

            const newTask = {
                id: Date.now().toString(),
                text: taskText,
                completed: false
            };

            this.tasks.push(newTask);
            this.saveTasks();
            this.renderTasks();
            elements.taskInput.value = '';
        }

        deleteTask(taskId) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
        }

        toggleTaskCompletion(taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                this.saveTasks();
                this.renderTasks();
            }
        }

        filterTasks(filter) {
            const taskItems = elements.taskList.querySelectorAll('.task-item');
            taskItems.forEach(item => {
                const task = this.tasks.find(t => t.id === item.dataset.id);
                switch(filter) {
                    case 'active':
                        item.style.display = !task.completed ? 'flex' : 'none';
                        break;
                    case 'completed':
                        item.style.display = task.completed ? 'flex' : 'none';
                        break;
                    default: // 'all'
                        item.style.display = 'flex';
                }
            });
        }

        updateTaskStats() {
            const totalTasks = this.tasks.length;
            const completedTasks = this.tasks.filter(t => t.completed).length;
            const activeTasks = totalTasks - completedTasks;

            elements.totalTasksDisplay.textContent = totalTasks;
            elements.completedTasksDisplay.textContent = completedTasks;
            elements.activeTasksDisplay.textContent = activeTasks;

            elements.emptyState.style.display = totalTasks === 0 ? 'flex' : 'none';
        }

        renderTasks() {
            if (!elements.taskList) return;

            elements.taskList.innerHTML = '';

            this.tasks.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.classList.add('task-item');
                taskItem.dataset.id = task.id;

                if (task.completed) {
                    taskItem.classList.add('completed');
                }

                taskItem.innerHTML = `
                    <div class="task-content">
                        <input 
                            type="checkbox" 
                            class="task-checkbox task-complete-btn" 
                            ${task.completed ? 'checked' : ''}
                        >
                        <span class="task-text">${task.text}</span>
                    </div>
                    <div class="task-actions">
                        <button class="task-delete-btn">🗑️</button>
                    </div>
                `;

                elements.taskList.appendChild(taskItem);
            });

            this.updateTaskStats();
        }
    }

    // Timer Management Class
    class TimerManager {
        constructor() {
            this.settings = {
                focusDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                sessionsBeforeLongBreak: 4
            };

            // Enhanced state tracking
            this.state = {
                isRunning: false,
                currentSession: 1,
                currentMode: 'focus',
                timeRemaining: 0,
                originalTime: 0,
                completedSessions: 0,
                timerInterval: null,
                // Session metrics
                sessionData: {
                    startTime: new Date(),
                    focusSessionsCompleted: 0,
                    shortBreaksCompleted: 0,
                    longBreaksCompleted: 0,
                    totalFocusTime: 0,  // in minutes
                    totalBreakTime: 0,  // in minutes
                    pauseCount: 0,
                    interruptions: 0,
                    completedTasks: 0,
                    addedTimeInstances: 0
                }
            };

            this.taskManager = new TaskManager();
            this.init();
        }

        async init() {
            console.log('Initializing Timer');
            console.log('Elements:', elements);
            await this.loadSettings();
            this.setupEventListeners();
            this.trackTaskCompletion();
            this.updateDisplay();
            console.log('Timer Initialization Complete');
        }

        setupEventListeners() {
            if (!elements.pauseBtn) {
                console.error('Pause button not found');
                return;
            }

            elements.pauseBtn.addEventListener('click', () => this.toggleTimer());
            elements.addTimeBtn.addEventListener('click', () => this.addMoreTime());
            elements.finishBtn.addEventListener('click', () => this.finishEarly());
            elements.settingsLink.addEventListener('click', () => this.openSettings());
            elements.closeModal.addEventListener('click', () => this.closeSettings());
            elements.cancelSettings.addEventListener('click', () => this.closeSettings());
            elements.saveSettings.addEventListener('click', () => this.saveTimerSettings());
            
            // Mode buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from all buttons
                    document.querySelectorAll('.mode-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    
                    // Add active class to clicked button
                    btn.classList.add('active');
                    
                    // Switch timer mode
                    const mode = btn.dataset.mode;
                    this.switchTimerMode(mode);
                });
            });
        }
        
        switchTimerMode(mode) {
            // Stop the current timer if it's running
            if (this.state.isRunning) {
                this.pauseTimer();
                elements.pauseBtn.textContent = 'Start';
            }
            
            // Reset the timer based on the selected mode
            switch(mode) {
                case 'focus':
                    this.state.timeRemaining = this.settings.focusDuration * 60;
                    this.state.originalTime = this.state.timeRemaining;
                    this.state.currentMode = 'focus';
                    elements.sessionTypeLabel.textContent = 'Focus Session';
                    elements.progressBar.style.backgroundColor = 'var(--primary-color)';
                    break;
                case 'shortBreak':
                    this.state.timeRemaining = this.settings.shortBreakDuration * 60;
                    this.state.originalTime = this.state.timeRemaining;
                    this.state.currentMode = 'shortBreak';
                    elements.sessionTypeLabel.textContent = 'Short Break';
                    elements.progressBar.style.backgroundColor = 'var(--secondary-color)';
                    break;
                case 'longBreak':
                    this.state.timeRemaining = this.settings.longBreakDuration * 60;
                    this.state.originalTime = this.state.timeRemaining;
                    this.state.currentMode = 'longBreak';
                    elements.sessionTypeLabel.textContent = 'Long Break';
                    elements.progressBar.style.backgroundColor = 'var(--secondary-color)';
                    break;
            }
            
            // Update the display
            this.updateTimerDisplay();
            this.updateProgressBar();
        }

        async loadSettings() {
            const localSettings = localStorage.getItem('timerSettings');
            if (localSettings) {
                this.settings = JSON.parse(localSettings);
            }

            this.resetTimer();
            this.updateDisplay();
        }

        resetTimer() {
            this.state.timeRemaining = this.settings.focusDuration * 60;
            this.state.originalTime = this.state.timeRemaining;
            this.state.currentMode = 'focus';
            this.state.isRunning = false;
            
            elements.pauseBtn.textContent = 'Start';
            elements.sessionTypeLabel.textContent = 'Focus Session';
        }

        toggleTimer() {
            if (this.state.isRunning) {
                this.pauseTimer();
                elements.pauseBtn.textContent = 'Resume';
            } else {
                this.startTimer();
                elements.pauseBtn.textContent = 'Pause';
            }
        }

        startTimer() {
            this.state.isRunning = true;
            this.state.timerInterval = setInterval(() => {
                this.state.timeRemaining--;
                this.updateTimerDisplay();
                this.updateProgressBar();
                
                if (this.state.timeRemaining <= 0) {
                    clearInterval(this.state.timerInterval);
                    this.completeSession();
                }
            }, 1000);
        }

        pauseTimer() {
            this.state.isRunning = false;
            clearInterval(this.state.timerInterval);
            // Track pauses as potential interruptions
            this.state.sessionData.pauseCount++;
            if (this.state.currentMode === 'focus') {
                this.state.sessionData.interruptions++;
            }
        }

        updateTimerDisplay() {
            const minutes = Math.floor(this.state.timeRemaining / 60);
            const seconds = this.state.timeRemaining % 60;
            const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            elements.timer.textContent = displayTime;
            document.title = `${displayTime} - Pomodoro Timer`;
        }

        updateProgressBar() {
            const percentComplete = 100 - ((this.state.timeRemaining / this.state.originalTime) * 100);
            elements.progressBar.style.width = `${percentComplete}%`;
        }

        addMoreTime() {
            this.state.timeRemaining += 5 * 60; // Add 5 minutes
            this.state.originalTime = this.state.timeRemaining;
            this.state.sessionData.addedTimeInstances++;
            this.updateTimerDisplay();
            this.updateProgressBar();
        }

        finishEarly() {
            console.log("Finish early button clicked");
            
            if (confirm("Are you sure you want to finish this session early?")) {
                console.log("User confirmed early finish");
                
                // Clear interval
                clearInterval(this.state.timerInterval);
                
                // IMPORTANT: Calculate time spent before resetting anything
                const originalTimeInSeconds = this.state.originalTime;
                const timeRemainingInSeconds = this.state.timeRemaining;
                const currentMode = this.state.currentMode;
                
                console.log("Original time (seconds):", originalTimeInSeconds);
                console.log("Time remaining (seconds):", timeRemainingInSeconds);
                
                // Calculate actual time spent in minutes
                const timeSpentInSeconds = originalTimeInSeconds - timeRemainingInSeconds;
                const timeSpentInMinutes = timeSpentInSeconds / 60;
                
                console.log("Time spent (minutes):", timeSpentInMinutes);
                
                // Update the appropriate time counter
                if (currentMode === 'focus') {
                    this.state.sessionData.totalFocusTime += timeSpentInMinutes;
                    this.state.sessionData.focusSessionsCompleted += 1; // Count this as a completed session
                    console.log("Updated total focus time:", this.state.sessionData.totalFocusTime);
                } else if (currentMode === 'shortBreak') {
                    this.state.sessionData.totalBreakTime += timeSpentInMinutes;
                    this.state.sessionData.shortBreaksCompleted += 1;
                } else if (currentMode === 'longBreak') {
                    this.state.sessionData.totalBreakTime += timeSpentInMinutes;
                    this.state.sessionData.longBreaksCompleted += 1;
                }
                
                // DIRECTLY save to localStorage instead of going through saveSessionData
                // This bypasses the server API call that's failing
                const currentSessionData = JSON.stringify(this.state.sessionData);
                const currentTasks = JSON.stringify(this.taskManager.tasks);
                
                console.log("Saving directly to localStorage");
                localStorage.setItem('currentSessionData', currentSessionData);
                localStorage.setItem('currentSessionTasks', currentTasks);
                
                // Also save to session history if needed
                try {
                    const historyData = JSON.parse(localStorage.getItem('pomodoroSessionHistory') || '[]');
                    historyData.push(this.state.sessionData);
                    localStorage.setItem('pomodoroSessionHistory', JSON.stringify(historyData));
                } catch (e) {
                    console.error("Error saving to session history:", e);
                }
                
                console.log("Saved session data:", currentSessionData);
                
                // NOW reset the timer after data is safely saved
                this.resetTimer();
                this.updateTimerDisplay();
                this.updateProgressBar();
                
                console.log("About to redirect to postreview page...");
                window.location.href = '/postreview';
            } else {
                console.log("User cancelled early finish");
            }
        }

        // Save all session data
        saveSessionData() {
            // Count completed tasks
            this.state.sessionData.completedTasks = 
                this.taskManager.tasks.filter(t => t.completed).length;
            
            // Add end time if not already set
            if (!this.state.sessionData.endTime) {
                this.state.sessionData.endTime = new Date();
            }
            
            // Save to localStorage for immediate use
            localStorage.setItem('currentSessionData', JSON.stringify(this.state.sessionData));
            
            // Send data to server for MongoDB storage
            this.sendSessionDataToServer();
        }
        
        // Send data to MongoDB
        async sendSessionDataToServer() {
            try {
                const response = await fetch('/api/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.state.sessionData)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to save session data');
                }
                
                console.log('Session data saved to MongoDB');
            } catch (error) {
                console.error('Error saving session data:', error);
                // Fallback: Store more data in localStorage
                try {
                    const historyData = JSON.parse(localStorage.getItem('pomodoroSessionHistory') || '[]');
                    historyData.push(this.state.sessionData);
                    localStorage.setItem('pomodoroSessionHistory', JSON.stringify(historyData));
                } catch (e) {
                    console.error("Error in fallback storage:", e);
                }
            }
        }

        // Redirect to post-review page with session data
        redirectToPostReview() {
            // First save the current session data to localStorage
            localStorage.setItem('currentSessionData', JSON.stringify(this.state.sessionData));
            
            // Also save task data for the review page
            localStorage.setItem('currentSessionTasks', JSON.stringify(this.taskManager.tasks));
            
            // Redirect to post-review page
            window.location.href = '/postreview';
        }

        startShortBreak() {
            this.state.currentMode = 'shortBreak';
            this.state.timeRemaining = this.settings.shortBreakDuration * 60;
            this.state.originalTime = this.state.timeRemaining;
            
            elements.sessionTypeLabel.textContent = 'Short Break';
            elements.progressBar.style.backgroundColor = 'var(--secondary-color)';
            
            this.updateTimerDisplay();
        }

        startLongBreak() {
            this.state.currentMode = 'longBreak';
            this.state.timeRemaining = this.settings.longBreakDuration * 60;
            this.state.originalTime = this.state.timeRemaining;
            
            elements.sessionTypeLabel.textContent = 'Long Break';
            elements.progressBar.style.backgroundColor = 'var(--secondary-color)';
            
            this.updateTimerDisplay();
        }

        startFocusSession() {
            this.state.currentMode = 'focus';
            this.state.timeRemaining = this.settings.focusDuration * 60;
            this.state.originalTime = this.state.timeRemaining;
            
            elements.sessionTypeLabel.textContent = 'Focus Session';
            elements.progressBar.style.backgroundColor = 'var(--primary-color)';
            
            this.updateTimerDisplay();
        }

        completeSession() {
            // Calculate time spent in this session
            const sessionDurationMinutes = 
                (this.state.originalTime - this.state.timeRemaining) / 60;
            
            if (this.state.currentMode === 'focus') {
                this.state.completedSessions++;
                this.state.sessionData.focusSessionsCompleted++;
                this.state.sessionData.totalFocusTime += sessionDurationMinutes;
                
                if (this.state.completedSessions % this.settings.sessionsBeforeLongBreak === 0) {
                    this.startLongBreak();
                } else {
                    this.startShortBreak();
                }
            } else if (this.state.currentMode === 'shortBreak') {
                this.state.sessionData.shortBreaksCompleted++;
                this.state.sessionData.totalBreakTime += sessionDurationMinutes;
                this.startFocusSession();
            } else if (this.state.currentMode === 'longBreak') {
                this.state.sessionData.longBreaksCompleted++;
                this.state.sessionData.totalBreakTime += sessionDurationMinutes;
                this.startFocusSession();
            }
        
            this.saveSessionData();
            this.animateTimerComplete();
        }

        // Track task completion
        trackTaskCompletion() {
            // Listen for task completion events from task manager
            document.addEventListener('taskCompleted', () => {
                this.state.sessionData.completedTasks++;
                this.saveSessionData();
            });
        }

        openSettings() {
            elements.focusInput.value = this.settings.focusDuration;
            elements.shortBreakInput.value = this.settings.shortBreakDuration;
            elements.longBreakInput.value = this.settings.longBreakDuration;
            elements.sessionsInput.value = this.settings.sessionsBeforeLongBreak;
            
            elements.settingsModal.style.display = 'flex';
        }

        closeSettings() {
            elements.settingsModal.style.display = 'none';
        }

        saveTimerSettings() {
            const focusDuration = parseInt(elements.focusInput.value);
            const shortBreakDuration = parseInt(elements.shortBreakInput.value);
            const longBreakDuration = parseInt(elements.longBreakInput.value);
            const sessionsBeforeLongBreak = parseInt(elements.sessionsInput.value);
            
            if (focusDuration < 1 || shortBreakDuration < 1 || longBreakDuration < 1 || sessionsBeforeLongBreak < 1) {
                alert("All values must be greater than 0");
                return;
            }
            
            this.settings = {
                focusDuration,
                shortBreakDuration,
                longBreakDuration,
                sessionsBeforeLongBreak
            };
            
            localStorage.setItem('timerSettings', JSON.stringify(this.settings));
            
            this.resetTimer();
            this.closeSettings();
        }

        updateDisplay() {
            this.updateTimerDisplay();
            this.updateProgressBar();
        }

        animateTimerComplete() {
            this.state.isRunning = false;
            elements.pauseBtn.textContent = 'Start';
            elements.progressBar.style.width = '0%';
            
            elements.timer.classList.add('timer-complete');
            setTimeout(() => {
                elements.timer.classList.remove('timer-complete');
            }, 3000);
        }
    }

    // Initialize the Timer
    new TimerManager();
});