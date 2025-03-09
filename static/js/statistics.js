// Task Distribution Pie Chart using Chart.js
document.addEventListener('DOMContentLoaded', function() {
    // Create a container for the pie chart
    const statsSection = document.getElementById('stats-section');
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.style.width = '100%';
    chartContainer.style.maxWidth = '500px';
    chartContainer.style.margin = '20px auto';
    chartContainer.style.height = '300px';
    statsSection.appendChild(chartContainer);
    
    // Create canvas element for the chart
    const canvas = document.createElement('canvas');
    canvas.id = 'taskDistributionChart';
    chartContainer.appendChild(canvas);
    
    // Add a title for the chart
    const chartTitle = document.createElement('h2');
    chartTitle.textContent = 'Task Distribution';
    chartTitle.style.textAlign = 'center';
    chartTitle.style.marginBottom = '10px';
    chartContainer.insertBefore(chartTitle, canvas);
    
    // Initialize and render the chart
    initTaskDistributionChart();
    
    // Set an interval to update the chart regularly
    setInterval(updateTaskDistributionChart, 5000);
});

// Initialize the pie chart
function initTaskDistributionChart() {
    // Get task data from localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    
    // Load Chart.js from CDN if not already loaded
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js';
        script.onload = function() {
            createTaskChart(completedTasks, pendingTasks);
        };
        document.head.appendChild(script);
    } else {
        createTaskChart(completedTasks, pendingTasks);
    }
}

// Create the task distribution chart
function createTaskChart(completedTasks, pendingTasks) {
    const ctx = document.getElementById('taskDistributionChart').getContext('2d');
    
    // Check if chart already exists and destroy it
    if (window.taskChart) {
        window.taskChart.destroy();
    }
    
    // Create new chart
    window.taskChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Completed Tasks', 'Pending Tasks'],
            datasets: [{
                data: [completedTasks, pendingTasks],
                backgroundColor: [
                    '#4ade80', // Green for completed
                    '#f87171'  // Red for pending
                ],
                borderColor: [
                    '#ffffff',
                    '#ffffff'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Display a message if there are no tasks
    if (completedTasks === 0 && pendingTasks === 0) {
        const noTasksMessage = document.createElement('div');
        noTasksMessage.id = 'noTasksMessage';
        noTasksMessage.textContent = 'No tasks available. Add some tasks to see the distribution.';
        noTasksMessage.style.position = 'absolute';
        noTasksMessage.style.top = '50%';
        noTasksMessage.style.left = '50%';
        noTasksMessage.style.transform = 'translate(-50%, -50%)';
        noTasksMessage.style.textAlign = 'center';
        noTasksMessage.style.color = '#6b7280';
        noTasksMessage.style.fontSize = '14px';
        document.querySelector('.chart-container').appendChild(noTasksMessage);
    } else {
        const existingMessage = document.getElementById('noTasksMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
}

// Update the chart with the latest data
function updateTaskDistributionChart() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    
    if (window.taskChart) {
        window.taskChart.data.datasets[0].data = [completedTasks, pendingTasks];
        window.taskChart.update();
        
        // Update no tasks message if needed
        if (completedTasks === 0 && pendingTasks === 0) {
            if (!document.getElementById('noTasksMessage')) {
                const noTasksMessage = document.createElement('div');
                noTasksMessage.id = 'noTasksMessage';
                noTasksMessage.textContent = 'No tasks available. Add some tasks to see the distribution.';
                noTasksMessage.style.position = 'absolute';
                noTasksMessage.style.top = '50%';
                noTasksMessage.style.left = '50%';
                noTasksMessage.style.transform = 'translate(-50%, -50%)';
                noTasksMessage.style.textAlign = 'center';
                noTasksMessage.style.color = '#6b7280';
                noTasksMessage.style.fontSize = '14px';
                document.querySelector('.chart-container').appendChild(noTasksMessage);
            }
        } else {
            const existingMessage = document.getElementById('noTasksMessage');
            if (existingMessage) {
                existingMessage.remove();
            }
        }
    } else {
        // If chart doesn't exist, initialize it
        initTaskDistributionChart();
    }
}