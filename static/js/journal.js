document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Check if user is logged in
    fetchUserData()
        .then(userData => {
            // Initialize components with user data
            initTasks(userData.tasks || []);
            initNotes(userData.notes || []);
            initNavigation();
            initThemeToggle(userData.theme || 'light');
            updateStats(); // Initial stats update
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            // Fallback to local storage if fetch fails
            initTasks(JSON.parse(localStorage.getItem('tasks')) || []);
            initNotes(JSON.parse(localStorage.getItem('notes')) || []);
            initNavigation();
            initThemeToggle();
            updateStats(); // Initial stats update even with local data
        });
}

// Navigation with improved handling for Home link
function initNavigation() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = {
        'Tasks': document.getElementById('tasks-section'),
        'Notes': document.getElementById('notes-section'),
        'Stats': document.getElementById('stats-section')
    };

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        if (link.id !== 'theme-toggle') {
            link.addEventListener('click', function(e) {
                // Get the link text
                const sectionName = this.textContent.trim();
                
                // If it's the Home link, allow normal navigation (don't prevent default)
                if (sectionName === 'Home') {
                    return; // Let the browser handle the redirect
                }
                
                // For other links, prevent default and handle with JS
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Hide all sections
                Object.values(sections).forEach(section => {
                    if (section) {
                        section.style.display = 'none';
                    }
                });
                
                // Show the corresponding section
                if (sections[sectionName]) {
                    sections[sectionName].style.display = 'block';
                    
                    // Always refresh stats when Stats tab is clicked
                    if (sectionName === 'Stats') {
                        updateStats();
                    }
                }
            });
        }
    });
}

// Fetch user data from backend
async function fetchUserData() {
    try {
        const response = await fetch('/api/user-data');
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Save data to backend
async function saveUserData(dataType, data) {
    try {
        const endpoint = dataType === 'productivityStatsHistory' 
            ? '/api/save-productivity-history' 
            : '/api/save-user-data';
        
        const requestBody = dataType === 'productivityStatsHistory' 
            ? data  // Direct data for productivity history
            : {
                type: dataType,
                data: data
            };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Failed to save ${dataType}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error saving ${dataType}:`, error);
        // Fallback to local storage
        localStorage.setItem(dataType, JSON.stringify(data));
        return data;
    }
}

// Tasks functionality
function initTasks(initialTasks = []) {
    // DOM elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const taskSearch = document.getElementById('task-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyTasksEl = document.getElementById('empty-tasks');
    const emptyTaskBtn = emptyTasksEl.querySelector('.empty-action-btn');
    
    // State
    let tasks = initialTasks;
    
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString() // Added updatedAt for tracking
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
        
        // Handle edit button click
        if (e.target.classList.contains('task-edit-btn') || e.target.closest('.task-edit-btn')) {
            // Future implementation
            alert('Edit feature coming soon!');
        }
    }
    
    // Toggle task complete status
    function toggleTaskComplete(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { 
                    ...task, 
                    completed: !task.completed,
                    updatedAt: new Date().toISOString() // Update timestamp when status changes
                };
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
    
    // Save tasks to backend and localStorage
    function saveTasks() {
        saveUserData('tasks', tasks)
            .then(() => {
                localStorage.setItem('tasks', JSON.stringify(tasks));
                updateStats(); // Update stats whenever tasks change
            })
            .catch(error => {
                console.error('Error saving tasks:', error);
                // Still update local stats on error
                updateStats();
            });
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
function initNotes(initialNotes = []) {
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
    let notes = initialNotes;
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
            'purple': '#e1bee7',
            'default': '#ffffff'
        };
        
        return colorMap[color] || colorMap['default'];
    }
    
    // Save notes to backend and localStorage
    function saveNotes() {
        saveUserData('notes', notes)
            .then(() => {
                localStorage.setItem('notes', JSON.stringify(notes));
                updateStats(); // Update stats whenever notes change
            })
            .catch(error => {
                console.error('Error saving notes:', error);
                // Still update local stats on error
                updateStats();
            });
    }
}

// Theme toggle function with backend save
function initThemeToggle(initialTheme = 'light') {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return; // Exit if theme toggle doesn't exist
    
    const icon = themeToggle.querySelector('i');
    if (!icon) return; // Exit if icon doesn't exist
    
    // Set initial theme
    let currentTheme = initialTheme;
    document.body.classList.toggle('dark-mode', currentTheme === 'dark');
    
    // Update icon based on theme
    icon.classList.toggle('fa-moon', currentTheme === 'light');
    icon.classList.toggle('fa-sun', currentTheme === 'dark');
    
    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Toggle theme
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-mode');
        
        // Update icon
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
        
        // Save theme to backend and localStorage
        saveUserData('theme', currentTheme)
            .then(() => {
                localStorage.setItem('theme', currentTheme);
            })
            .catch(error => {
                console.error('Error saving theme:', error);
            });
    });
}

// Update overall stats and track historical data
function updateStats() {
    try {
        // Get latest data directly from memory or localStorage
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const totalNotes = notes.length;
        
        // Update the UI stats elements
        const statTotalTasks = document.getElementById('stat-total-tasks');
        const statCompletedTasks = document.getElementById('stat-completed-tasks');
        const statCompletionRate = document.getElementById('stat-completion-rate');
        const statTotalNotes = document.getElementById('stat-total-notes');
        
        if (statTotalTasks) statTotalTasks.textContent = totalTasks;
        if (statCompletedTasks) statCompletedTasks.textContent = completedTasks;
        if (statCompletionRate) statCompletionRate.textContent = `${completionRate}%`;
        if (statTotalNotes) statTotalNotes.textContent = totalNotes;
        
        // Also update the task section stats
        const totalTasksEl = document.getElementById('total-tasks');
        const completedTasksEl = document.getElementById('completed-tasks');
        const activeTasksEl = document.getElementById('active-tasks');
        
        if (totalTasksEl) totalTasksEl.textContent = totalTasks;
        if (completedTasksEl) completedTasksEl.textContent = completedTasks;
        if (activeTasksEl) activeTasksEl.textContent = totalTasks - completedTasks;
        
        // Track productivity history
        let productivityStatsHistory = JSON.parse(localStorage.getItem('productivityStatsHistory')) || [];
        
        // Create new stats entry
        const today = new Date().toDateString();
        const newStatsEntry = {
            date: new Date().toISOString(),
            totalTasks,
            completedTasks,
            completionRate,
            totalNotes,
            activeTasks: tasks.filter(task => !task.completed).length,
            newTasksToday: tasks.filter(task => 
                new Date(task.createdAt).toDateString() === today
            ).length,
            completedTasksToday: tasks.filter(task => 
                task.completed && 
                new Date(task.updatedAt || task.createdAt).toDateString() === today
            ).length
        };
        
        // Add new entry or update today's entry in stats history
        const todayEntryIndex = productivityStatsHistory.findIndex(entry => 
            new Date(entry.date).toDateString() === today
        );
        
        if (todayEntryIndex >= 0) {
            // Update today's entry
            productivityStatsHistory[todayEntryIndex] = newStatsEntry;
        } else {
            // Add new entry
            productivityStatsHistory.push(newStatsEntry);
            // Limit to last 30 entries
            if (productivityStatsHistory.length > 30) {
                productivityStatsHistory.shift();
            }
        }
        
        // Save productivity stats history
        saveUserData('productivityStatsHistory', productivityStatsHistory)
            .then(() => {
                localStorage.setItem('productivityStatsHistory', JSON.stringify(productivityStatsHistory));
            })
            .catch(error => {
                console.error('Error saving productivity stats history:', error);
                localStorage.setItem('productivityStatsHistory', JSON.stringify(productivityStatsHistory));
            });
            
    } catch (error) {
        console.error('Error in updateStats:', error);
    }
}