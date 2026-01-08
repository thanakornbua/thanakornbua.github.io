// Global variables
let facultyData = null;
let currentFaculty = 'general';
let countdownInterval = null;

// Load faculty data from JSON
async function loadFacultyData() {
    try {
        const response = await fetch('data.json');
        facultyData = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Error loading faculty data:', error);
        document.getElementById('activities-list').innerHTML = 
            '<p class="error">Error loading data. Please refresh the page.</p>';
    }
}

// Initialize the application
function initializeApp() {
    // Set up faculty dropdown event listener
    const dropdown = document.getElementById('faculty-dropdown');
    dropdown.addEventListener('change', handleFacultyChange);
    
    // Load initial faculty data
    updateFacultyDisplay();
    startCountdown();
}

// Handle faculty selection change
function handleFacultyChange(event) {
    currentFaculty = event.target.value;
    updateFacultyDisplay();
    
    // Restart countdown with new target date
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    startCountdown();
}

// Update display for selected faculty
function updateFacultyDisplay() {
    const faculty = facultyData.faculties[currentFaculty];
    
    // Update faculty name
    document.getElementById('faculty-name').textContent = faculty.name;
    
    // Update target date display
    const targetDate = new Date(faculty.targetDate);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('target-date').textContent = 
        `Target Date: ${targetDate.toLocaleDateString('en-US', options)}`;
    
    // Update activities list
    displayActivities(faculty.activities);
}

// Display activities in the sidebar
function displayActivities(activities) {
    const activitiesList = document.getElementById('activities-list');
    activitiesList.innerHTML = '';
    
    activities.forEach(monthData => {
        const monthSection = document.createElement('div');
        monthSection.className = 'month-section';
        
        const monthDate = new Date(monthData.month + '-01');
        const monthName = monthDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
        
        const monthTitle = document.createElement('h5');
        monthTitle.className = 'month-title';
        monthTitle.textContent = monthName;
        monthSection.appendChild(monthTitle);
        
        const itemsList = document.createElement('ul');
        itemsList.className = 'activity-items';
        
        monthData.items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item;
            itemsList.appendChild(listItem);
        });
        
        monthSection.appendChild(itemsList);
        activitiesList.appendChild(monthSection);
    });
}

// Start the countdown timer
function startCountdown() {
    const faculty = facultyData.faculties[currentFaculty];
    const targetDate = new Date(faculty.targetDate);
    
    // Update countdown immediately
    updateCountdown(targetDate);
    
    // Update countdown every second
    countdownInterval = setInterval(() => {
        updateCountdown(targetDate);
    }, 1000);
}

// Update countdown display
function updateCountdown(targetDate) {
    const now = new Date();
    const difference = targetDate - now;
    
    if (difference <= 0) {
        // Countdown has ended
        clearInterval(countdownInterval);
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        
        // Display completion message
        document.getElementById('faculty-name').textContent = 'TCAS70 Has Started!';
        return;
    }
    
    // Calculate time units
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    // Update display with zero-padding
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadFacultyData);
