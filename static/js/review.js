// review.js - Handles Pomodoro Session Review Page Functionality

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const elements = {
        // Summary statistics
        focusTime: document.getElementById('focus-time'),
        completedTasks: document.getElementById('completed-tasks'),
        focusSessions: document.getElementById('focus-sessions'),
        interruptions: document.getElementById('interruptions'),
        sessionDate: document.getElementById('session-date'),
        sessionDetails: document.getElementById('session-details'),
        
        // Task list
        reviewTaskList: document.getElementById('review-task-list'),
        noTasksMessage: document.getElementById('no-tasks-message'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        
        // Productivity score
        productivityScore: document.getElementById('productivity-score'),
        productivityMessage: document.getElementById('productivity-message'),
        
        // Buttons
        backHomeBtn: document.getElementById('back-home-btn'),
        startNewSessionBtn: document.getElementById('start-new-session-btn')
    };
    
    // Add event listener for beforeunload to clear data when session ends
    window.addEventListener('beforeunload', clearReviewSessionData);
    
    // Function to clear localStorage when session ends
    function clearReviewSessionData() {
        // Clear session-specific data
        localStorage.removeItem('currentSessionData');
        localStorage.removeItem('currentSessionTasks');
    }
    
    // Session Review Data Management
    const SessionReview = {
        // Retrieve session data from local storage
        getSessionData() {
            return JSON.parse(localStorage.getItem('currentSessionData') || '{}');
        },
        
        // Retrieve tasks from local storage
        getSessionTasks() {
            return JSON.parse(localStorage.getItem('currentSessionTasks') || '[]');
        },

        // Calculate productivity score based on session metrics
        calculateProductivityScore(sessionData) {
            const { 
                interruptions = 0, 
                totalFocusTime = 0, 
                pauseCount = 0,
                completedTasks = 0,
                addedTimeInstances = 0
            } = sessionData;
            
            // Base score
            let score = 70;
            
            // Deduct points for interruptions
            score -= (interruptions * 5);
            
            // Deduct points for excessive pauses
            if (pauseCount > 2) {
                score -= ((pauseCount - 2) * 3);
            }
            
            // Add points for focus time (1 point per 5 minutes, up to 20 points)
            score += Math.min(totalFocusTime / 5, 20);
            
            // Add points for completed tasks (3 points per task, up to 15 points)
            score += Math.min(completedTasks * 3, 15);
            
            // Deduct points for added time
            score -= (addedTimeInstances * 2);
            
            // Ensure score is within 0-100 range
            return Math.min(Math.max(Math.round(score), 0), 100);
        },

        // Generate productivity message based on score
        generateProductivityMessage(score) {
            if (score >= 90) return "Outstanding! You were extremely productive today.";
            if (score >= 80) return "Great job! You were very productive today.";
            if (score >= 70) return "Good work! You had a productive session.";
            if (score >= 50) return "You had a decent session. Consider minimizing interruptions next time.";
            return "Try to improve your focus in your next session by reducing distractions.";
        },

        // Format time display
        // Format time display
        formatTime(minutes) {
            // Convert to number and handle any falsy values
            const mins = Number(minutes) || 0;
            return Math.round(mins).toString();
        },
        
        // Format date display
        formatDate(dateString) {
            if (!dateString) return new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            return new Date(dateString).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        },
        
        // Generate session details HTML
        generateSessionDetailsHTML(sessionData) {
            const { 
                startTime, 
                endTime,
                focusSessionsCompleted,
                shortBreaksCompleted,
                longBreaksCompleted,
                totalFocusTime,
                totalBreakTime,
                pauseCount,
                earlyFinish,
                timeRemaining
            } = sessionData;
            
            const start = startTime ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const end = endTime ? new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            
            let detailsHTML = `
                <p><strong>Session Time:</strong> ${start} - ${end}</p>
                <p><strong>Focus Sessions:</strong> ${focusSessionsCompleted || 0}</p>
                <p><strong>Short Breaks:</strong> ${shortBreaksCompleted || 0}</p>
                <p><strong>Long Breaks:</strong> ${longBreaksCompleted || 0}</p>
                <p><strong>Total Focus Time:</strong> ${this.formatTime(totalFocusTime)} minutes</p>
                <p><strong>Total Break Time:</strong> ${this.formatTime(totalBreakTime)} minutes</p>
                <p><strong>Pauses:</strong> ${pauseCount || 0}</p>
            `;
            
            if (earlyFinish) {
                const remainingMinutes = Math.floor(timeRemaining / 60);
                const remainingSeconds = timeRemaining % 60;
                detailsHTML += `<p><strong>Early Finish:</strong> Yes (${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')} remaining)</p>`;
            }
            
            return detailsHTML;
        }
    };

    // UI Update Functions
    const UI = {
        // Populate review page with session data
        populateReviewPage() {
            const sessionData = SessionReview.getSessionData();
            const sessionTasks = SessionReview.getSessionTasks();
            console.log("Session Data:", sessionData);
            console.log("Session Tasks:", sessionTasks);
            
            // Update date
            elements.sessionDate.textContent = SessionReview.formatDate(sessionData.startTime);
            
            // Update summary statistics
            elements.focusTime.textContent = SessionReview.formatTime(sessionData.totalFocusTime || 0);
            elements.completedTasks.textContent = sessionData.completedTasks || 0;
            elements.focusSessions.textContent = sessionData.focusSessionsCompleted || 0;
            elements.interruptions.textContent = sessionData.interruptions || 0;
            
            // Update session details
            elements.sessionDetails.innerHTML = SessionReview.generateSessionDetailsHTML(sessionData);
            
            // Calculate and update productivity score
            const score = SessionReview.calculateProductivityScore(sessionData);
            elements.productivityScore.textContent = `${score}%`;
            elements.productivityMessage.textContent = SessionReview.generateProductivityMessage(score);
            
            // Populate task list
            this.populateTaskList(sessionTasks);
            
            // Setup event listeners
            this.setupEventListeners();
        },
        
        // Populate task list
        populateTaskList(tasks) {
            if (!tasks || tasks.length === 0) {
                elements.noTasksMessage.style.display = 'block';
                return;
            }
            
            elements.noTasksMessage.style.display = 'none';
            elements.reviewTaskList.innerHTML = '';
            
            tasks.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.classList.add('task-item');
                taskItem.dataset.id = task.id;
                
                if (task.completed) {
                    taskItem.classList.add('completed');
                }
                
                taskItem.textContent = task.text;
                elements.reviewTaskList.appendChild(taskItem);
            });
        },
        
        // Filter tasks
        filterTasks(filter) {
            const taskItems = elements.reviewTaskList.querySelectorAll('.task-item');
            
            taskItems.forEach(item => {
                switch(filter) {
                    case 'active':
                        item.style.display = !item.classList.contains('completed') ? 'list-item' : 'none';
                        break;
                    case 'completed':
                        item.style.display = item.classList.contains('completed') ? 'list-item' : 'none';
                        break;
                    default: // 'all'
                        item.style.display = 'list-item';
                }
            });
        },
        
        // Setup event listeners
        setupEventListeners() {
            // Filter buttons
            elements.filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    elements.filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.filterTasks(btn.dataset.filter);
                });
            });
            
            // Back to timer button
            elements.backHomeBtn.addEventListener('click', () => {
                // Clear data when navigating away
                clearReviewSessionData();
                window.location.href = '/';
            });
            
            // Start new session button
            elements.startNewSessionBtn.addEventListener('click', () => {
                // Clear current session data
                clearReviewSessionData();
                window.location.href = '/';
            });
        }
    };

    // Initialize review page
    UI.populateReviewPage();
});