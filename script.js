// DOM Elements
const userNameInput = document.getElementById('userName');
const userEmailInput = document.getElementById('userEmail');
const createUserBtn = document.getElementById('createUserBtn');
const calendarSelect = document.getElementById('calendarSelect');
const newCalendarNameInput = document.getElementById('newCalendarName');
const createCalendarBtn = document.getElementById('createCalendarBtn');
const shareUserEmailInput = document.getElementById('shareUserEmail');
const shareCalendarBtn = document.getElementById('shareCalendarBtn');
const taskInput = document.getElementById('taskInput');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const prioritySelect = document.getElementById('prioritySelect');
const categorySelect = document.getElementById('categorySelect');
const addButton = document.getElementById('addButton');
const remindersList = document.getElementById('remindersList');
const emptyState = document.getElementById('emptyState');
const totalRemindersEl = document.getElementById('totalReminders');
const todayRemindersEl = document.getElementById('todayReminders');
const sharedUsersEl = document.getElementById('sharedUsers');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentUser = null;
let currentCalendar = null;
let currentFilter = 'all';

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadCalendars();
    requestNotificationPermission();
});

// Event Listeners
createUserBtn.addEventListener('click', createUser);
createCalendarBtn.addEventListener('click', createCalendar);
shareCalendarBtn.addEventListener('click', shareCalendar);
addButton.addEventListener('click', addReminder);
calendarSelect.addEventListener('change', handleCalendarChange);

// Filter button event listeners
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Set current filter
        currentFilter = button.dataset.filter;
        
        // Reload reminders with filter
        if (currentCalendar) {
            loadReminders(currentCalendar.id);
        }
    });
});

// Handle Calendar Change
function handleCalendarChange(e) {
    const calendarId = e.target.value;
    if (calendarId) {
        const calendars = JSON.parse(localStorage.getItem('calendars')) || [];
        currentCalendar = calendars.find(c => c.id === calendarId);
        
        // Enable reminder form
        taskInput.disabled = false;
        dateInput.disabled = false;
        timeInput.disabled = false;
        prioritySelect.disabled = false;
        categorySelect.disabled = false;
        addButton.disabled = false;
        
        // Load reminders
        loadReminders(calendarId);
        
        // Update stats
        updateStats();
    } else {
        // Disable reminder form
        taskInput.disabled = true;
        dateInput.disabled = true;
        timeInput.disabled = true;
        prioritySelect.disabled = true;
        categorySelect.disabled = true;
        addButton.disabled = true;
        currentCalendar = null;
        
        // Clear reminders list
        remindersList.innerHTML = '';
        emptyState.style.display = 'block';
        
        // Reset stats
        totalRemindersEl.textContent = '0';
        todayRemindersEl.textContent = '0';
        sharedUsersEl.textContent = '0';
    }
}

// Create User
function createUser() {
    const name = userNameInput.value.trim();
    const email = userEmailInput.value.trim();
    
    if (!name || !email) {
        alert('Please enter both name and email');
        return;
    }
    
    // Create user object
    currentUser = {
        id: 'user_' + Date.now(),
        name,
        email,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users.push(currentUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update UI
    userNameInput.disabled = true;
    userEmailInput.disabled = true;
    createUserBtn.disabled = true;
    createCalendarBtn.disabled = false;
    
    alert(`User ${name} created successfully!`);
}

// Load Users
function loadUsers() {
    // In a real app, this would load from backend
    // For now, we'll just check localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users;
}

// Create Calendar
function createCalendar() {
    if (!currentUser) {
        alert('Please create a user first');
        return;
    }
    
    const name = newCalendarNameInput.value.trim();
    
    if (!name) {
        alert('Please enter a calendar name');
        return;
    }
    
    // Create calendar object
    const calendar = {
        id: 'cal_' + Date.now(),
        name,
        ownerId: currentUser.id,
        sharedWith: [],
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    let calendars = JSON.parse(localStorage.getItem('calendars')) || [];
    calendars.push(calendar);
    localStorage.setItem('calendars', JSON.stringify(calendars));
    
    // Set as current calendar
    currentCalendar = calendar;
    
    // Add to calendar select
    const option = document.createElement('option');
    option.value = calendar.id;
    option.textContent = calendar.name;
    calendarSelect.appendChild(option);
    calendarSelect.value = calendar.id;
    
    // Enable reminder form
    taskInput.disabled = false;
    dateInput.disabled = false;
    timeInput.disabled = false;
    prioritySelect.disabled = false;
    categorySelect.disabled = false;
    addButton.disabled = false;
    
    // Clear input
    newCalendarNameInput.value = '';
    
    // Load reminders for this calendar
    loadReminders(calendar.id);
    
    // Update stats
    updateStats();
    
    alert(`Calendar "${name}" created successfully!`);
}

// Load Calendars
function loadCalendars() {
    const calendars = JSON.parse(localStorage.getItem('calendars')) || [];
    
    // Clear select
    calendarSelect.innerHTML = '<option value="">Select a calendar</option>';
    
    // Add calendars to select
    calendars.forEach(calendar => {
        const option = document.createElement('option');
        option.value = calendar.id;
        option.textContent = calendar.name;
        calendarSelect.appendChild(option);
    });
}

// Share Calendar
function shareCalendar() {
    if (!currentCalendar) {
        alert('Please select a calendar first');
        return;
    }
    
    const email = shareUserEmailInput.value.trim();
    
    if (!email) {
        alert('Please enter a user email to share with');
        return;
    }
    
    // In a real app, we would look up the user by email
    // For this demo, we'll just simulate sharing
    try {
        // Add to sharedWith array
        let calendars = JSON.parse(localStorage.getItem('calendars')) || [];
        const calendarIndex = calendars.findIndex(c => c.id === currentCalendar.id);
        if (calendarIndex !== -1) {
            if (!calendars[calendarIndex].sharedWith.includes(email)) {
                calendars[calendarIndex].sharedWith.push(email);
                localStorage.setItem('calendars', JSON.stringify(calendars));
                
                // Update current calendar reference
                currentCalendar.sharedWith = calendars[calendarIndex].sharedWith;
            }
        }
        
        // Update shared users count
        sharedUsersEl.textContent = currentCalendar.sharedWith ? currentCalendar.sharedWith.length : 0;
        
        // Clear input
        shareUserEmailInput.value = '';
        
        alert(`Calendar shared with ${email}!`);
    } catch (error) {
        console.error('Error sharing calendar:', error);
        alert('Error sharing calendar');
    }
}

// Load reminders from localStorage
function loadReminders(calendarId) {
    const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    
    // Filter by calendar
    const calendarReminders = reminders.filter(r => r.calendarId === calendarId);
    
    // Clear the list
    remindersList.innerHTML = '';
    
    // Filter reminders based on current filter
    let filteredReminders = calendarReminders;
    if (currentFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filteredReminders = calendarReminders.filter(reminder => {
            const reminderDate = reminder.date || today;
            return reminderDate === today;
        });
    }
    
    // Show empty state if no reminders
    if (filteredReminders.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Add each reminder to the list
    filteredReminders.forEach(reminder => {
        addReminderToList(reminder);
    });
    
    // Update stats
    updateStats(calendarReminders);
}

// Add a new reminder
function addReminder() {
    if (!currentCalendar) {
        showNotification('Please select a calendar first', 'error');
        return;
    }
    
    const task = taskInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const priority = prioritySelect.value;
    const category = categorySelect.value;
    
    // Validation
    if (!validateForm(task, date, time)) {
        return;
    }
    
    // Create reminder object
    const reminder = {
        id: 'rem_' + Date.now(),
        task,
        date: date || getCurrentDate(),
        time,
        priority,
        category,
        calendarId: currentCalendar.id,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    reminders.push(reminder);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    
    // Add to the list
    addReminderToList(reminder);
    
    // Clear inputs
    taskInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    prioritySelect.value = 'medium';
    categorySelect.value = 'personal';
    
    // Hide empty state
    emptyState.style.display = 'none';
    
    // Update stats
    updateStats();
    
    // Show success notification
    showNotification('Reminder added successfully!', 'success');
}

// Validate form inputs
function validateForm(task, date, time) {
    // Validate task
    if (!task) {
        showNotification('Please enter a task description', 'error');
        taskInput.focus();
        return false;
    }
    
    if (task.length > 100) {
        showNotification('Task description is too long (max 100 characters)', 'error');
        taskInput.focus();
        return false;
    }
    
    // Validate time
    if (!time) {
        showNotification('Please select a time for the reminder', 'error');
        timeInput.focus();
        return false;
    }
    
    // If date is provided, validate it
    if (date) {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            showNotification('Cannot set a reminder for a past date', 'error');
            dateInput.focus();
            return false;
        }
    }
    
    return true;
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add a reminder to the list
function addReminderToList(reminder) {
    const li = document.createElement('li');
    li.className = 'reminder-item new';
    li.dataset.id = reminder.id;
    
    const timeObj = new Date();
    const [hours, minutes] = reminder.time.split(':');
    timeObj.setHours(hours);
    timeObj.setMinutes(minutes);
    
    // Format the date for display
    const formattedDate = reminder.date ? formatDate(reminder.date) : 'No date';
    
    li.innerHTML = `
        <div class="reminder-details">
            <div class="reminder-header">
                <span class="reminder-task">${reminder.task}</span>
                <span class="reminder-priority ${getPriorityClass(reminder.priority)}">
                    <i class="${getCategoryIcon(reminder.category)}"></i>
                    ${reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                </span>
            </div>
            <div class="reminder-info">
                <span class="reminder-date">
                    <i class="fas fa-calendar"></i> ${formattedDate}
                </span>
                <span class="reminder-time">
                    <i class="fas fa-clock"></i> ${formatTime(timeObj)}
                </span>
            </div>
        </div>
        <div class="reminder-actions">
            <button class="delete-btn" onclick="deleteReminder('${reminder.id}')">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </div>
    `;
    
    remindersList.appendChild(li);
    
    // Remove the 'new' class after animation completes
    setTimeout(() => {
        li.classList.remove('new');
    }, 2000);
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format time for display
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// Get priority class for styling
function getPriorityClass(priority) {
    const priorityClasses = {
        'low': 'priority-low',
        'medium': 'priority-medium',
        'high': 'priority-high',
        'urgent': 'priority-urgent'
    };
    return priorityClasses[priority] || 'priority-medium';
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'work': 'fas fa-briefcase',
        'personal': 'fas fa-user',
        'health': 'fas fa-heartbeat',
        'shopping': 'fas fa-shopping-cart',
        'other': 'fas fa-tag'
    };
    return icons[category] || 'fas fa-tag';
}

// Delete a reminder
function deleteReminder(id) {
    // Remove from localStorage
    let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    reminders = reminders.filter(reminder => reminder.id !== id);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    
    // Remove from the UI
    const reminderElement = document.querySelector(`.reminder-item[data-id="${id}"]`);
    if (reminderElement) {
        reminderElement.remove();
    }
    
    // Show empty state if no reminders
    const remindersCount = document.querySelectorAll('.reminder-item').length;
    if (remindersCount === 0 && currentFilter === 'all') {
        emptyState.style.display = 'block';
    }
    
    // Update stats
    updateStats();
}

// Set up notifications for all reminders
function setupNotifications(reminders) {
    reminders.forEach(reminder => {
        setupNotification(reminder);
    });
}

// Set up notification for a single reminder
function setupNotification(reminder) {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return;
    }
    
    // Only set up notification if permission is granted
    if (Notification.permission === 'granted') {
        scheduleNotification(reminder);
    }
}

// Request notification permission
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return;
    }
    
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                // Reload reminders to set up notifications
                if (currentCalendar) {
                    loadReminders(currentCalendar.id);
                }
            }
        });
    }
}

// Schedule a notification for a reminder
function scheduleNotification(reminder) {
    const now = new Date();
    const reminderTime = new Date();
    const [hours, minutes] = reminder.time.split(':');
    reminderTime.setHours(hours);
    reminderTime.setMinutes(minutes);
    reminderTime.setSeconds(0);
    
    // If the reminder time is in the past, set it for tomorrow
    if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime - now;
    
    setTimeout(() => {
        // Show notification
        new Notification('Reminder', {
            body: `Time to: ${reminder.task}`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>'
        });
        
        // Play sound
        playNotificationSound();
        
        // Show alert as fallback
        alert(`Reminder: ${reminder.task}`);
    }, timeUntilReminder);
}

// Play notification sound
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, 500);
    } catch (e) {
        console.log('Could not play sound:', e);
    }
}

// Update statistics
function updateStats(reminders = null) {
    // If no reminders provided, get all reminders for current calendar
    if (!reminders && currentCalendar) {
        const allReminders = JSON.parse(localStorage.getItem('reminders')) || [];
        reminders = allReminders.filter(r => r.calendarId === currentCalendar.id);
    }
    
    // Update total reminders
    const remindersCount = reminders ? reminders.length : document.querySelectorAll('.reminder-item').length;
    totalRemindersEl.textContent = remindersCount;
    
    // Update today's reminders
    if (reminders) {
        const today = new Date().toISOString().split('T')[0];
        const todaysReminders = reminders.filter(reminder => {
            const reminderDate = reminder.date || today;
            return reminderDate === today;
        });
        
        todayRemindersEl.textContent = todaysReminders.length;
    }
    
    // Update shared users count
    if (currentCalendar) {
        sharedUsersEl.textContent = currentCalendar.sharedWith ? currentCalendar.sharedWith.length : 0;
    }
}