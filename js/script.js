// script.js
// Enhanced events data for TANTRA
const events = [
    {
        id: 1,
        name: "Code Wars",
        department: "Computer Science",
        category: "technical",
        description: "A competitive programming challenge where participants solve complex algorithmic problems under time constraints. Show your coding prowess!",
        date: "2024-10-15",
        time: "10:00 AM",
        venue: "CS Lab, Block A",
        coordinator: "Dr. Smith",
        coordinatorPhone: "+1 234 567 8901",
        price: 50,
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
        participants: 120,
        duration: "3 hours"
    },
    {
        id: 2,
        name: "Robo Soccer",
        department: "Robotics",
        category: "robotics",
        description: "Build and program autonomous robots to compete in a mini soccer tournament. Show off your robotics skills and team strategy!",
        date: "2024-10-16",
        time: "2:00 PM",
        venue: "Main Auditorium",
        coordinator: "Prof. Johnson",
        coordinatorPhone: "+1 234 567 8902",
        price: 100,
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
        participants: 80,
        duration: "4 hours"
    },
    {
        id: 3,
        name: "AI Hackathon",
        department: "Artificial Intelligence",
        category: "ai",
        description: "24-hour hackathon focused on developing innovative AI solutions for real-world problems. Innovate and create the future!",
        date: "2024-10-17",
        time: "9:00 AM",
        venue: "AI Research Center",
        coordinator: "Dr. Williams",
        coordinatorPhone: "+1 234 567 8903",
        price: 0,
        image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
        participants: 200,
        duration: "24 hours"
    },
    {
        id: 4,
        name: "Circuit Design Challenge",
        department: "Electronics",
        category: "technical",
        description: "Design and build electronic circuits to solve specific challenges. Test your electronics knowledge and innovation!",
        date: "2024-10-18",
        time: "11:00 AM",
        venue: "Electronics Lab, Block B",
        coordinator: "Prof. Brown",
        coordinatorPhone: "+1 234 567 8904",
        price: 30,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
        participants: 60,
        duration: "2 hours"
    },
    {
        id: 5,
        name: "Machine Learning Workshop",
        department: "AI/ML",
        category: "workshop",
        description: "Hands-on workshop covering fundamental ML concepts and practical implementation. Perfect for beginners and enthusiasts!",
        date: "2024-10-16",
        time: "10:00 AM",
        venue: "Tech Hub, Block C",
        coordinator: "Dr. Davis",
        coordinatorPhone: "+1 234 567 8905",
        price: 0,
        image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
        participants: 150,
        duration: "6 hours"
    },
    {
        id: 6,
        name: "Drone Racing",
        department: "Aeronautics",
        category: "robotics",
        description: "High-speed drone racing competition through obstacle courses. Test your piloting skills and reaction time!",
        date: "2024-10-17",
        time: "3:00 PM",
        venue: "Sports Ground",
        coordinator: "Prof. Miller",
        coordinatorPhone: "+1 234 567 8906",
        price: 75,
        image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
        participants: 40,
        duration: "3 hours"
    }
];

// DOM Elements
const eventsContainer = document.getElementById('events-container');
const filterTabs = document.querySelectorAll('.filter-tab');
const registrationModal = document.getElementById('registration-modal');
const registrationForm = document.getElementById('registration-form');
const eventNameInput = document.getElementById('event-name');
const closeModal = document.querySelector('.close-modal');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

// Initialize the application
function init() {
    renderEvents();
    setupEventListeners();
    setupSmoothScrolling();
}

// Render events based on current filter
function renderEvents(filter = 'all') {
    eventsContainer.innerHTML = '';
    
    const filteredEvents = filter === 'all' 
        ? events 
        : events.filter(event => event.category === filter);
    
    filteredEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsContainer.appendChild(eventCard);
    });
}

// Create event card element
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-category', event.category);
    
    const priceText = event.price === 0 ? 'FREE' : `₹${event.price}`;
    
    card.innerHTML = `
        <img src="${event.image}" alt="${event.name}" class="event-image">
        <div class="event-content">
            <div class="event-header">
                <span class="event-department">${event.department}</span>
                <span class="event-price">${priceText}</span>
            </div>
            <h3 class="event-title">${event.name}</h3>
            <p class="event-description">${event.description}</p>
            
            <div class="event-details">
                <div class="event-detail">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(event.date)}</span>
                </div>
                <div class="event-detail">
                    <i class="fas fa-clock"></i>
                    <span>${event.time}</span>
                </div>
                <div class="event-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.venue}</span>
                </div>
                <div class="event-detail">
                    <i class="fas fa-users"></i>
                    <span>${event.participants} Participants</span>
                </div>
            </div>
            
            <button class="register-btn" data-event-id="${event.id}">
                <span>Register Now</span>
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
    
    return card;
}

// Format date for display
function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Setup event listeners
function setupEventListeners() {
    // Filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderEvents(tab.dataset.filter);
        });
    });
    
    // Event registration buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.register-btn')) {
            const eventId = e.target.closest('.register-btn').dataset.eventId;
            openRegistrationModal(eventId);
        }
    });
    
    // Modal close
    closeModal.addEventListener('click', closeRegistrationModal);
    registrationModal.addEventListener('click', (e) => {
        if (e.target === registrationModal) {
            closeRegistrationModal();
        }
    });
    
    // Form submission
    registrationForm.addEventListener('submit', handleRegistration);
    
    // Navigation toggle
    navToggle.addEventListener('click', toggleNavigation);
    
    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
        });
    });
}

// Setup smooth scrolling for navigation links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Open registration modal
function openRegistrationModal(eventId) {
    const event = events.find(e => e.id == eventId);
    if (event) {
        eventNameInput.value = event.name;
        registrationModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add entrance animation
        setTimeout(() => {
            registrationModal.classList.add('active');
        }, 10);
    }
}

// Close registration modal
function closeRegistrationModal() {
    registrationModal.classList.remove('active');
    setTimeout(() => {
        registrationModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

// Handle form submission
function handleRegistration(e) {
    e.preventDefault();
    
    const formData = {
        event: eventNameInput.value,
        name: document.getElementById('participant-name').value,
        email: document.getElementById('participant-email').value,
        phone: document.getElementById('participant-phone').value,
        college: document.getElementById('participant-college').value,
        branch: document.getElementById('participant-branch').value,
        year: document.getElementById('participant-year').value,
        transactionId: document.getElementById('transaction-id').value
    };
    
    // Show loading state
    const submitBtn = registrationForm.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // In a real application, you would send this data to your server
        console.log('Registration submitted:', formData);
        
        // Show success message
        showNotification('Registration successful! Check your email for confirmation.', 'success');
        
        // Reset form and close modal
        registrationForm.reset();
        closeRegistrationModal();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// Toggle mobile navigation
function toggleNavigation() {
    navMenu.classList.toggle('open');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles for notification
    if (!document.querySelector('.notification-styles')) {
        const styles = document.createElement('style');
        styles.className = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--card-bg);
                border: 1px solid var(--card-border);
                border-radius: 10px;
                padding: 1rem 1.5rem;
                color: var(--text-primary);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 3000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 400px;
            }
            
            .notification.success {
                border-left: 4px solid var(--accent-green);
            }
            
            .notification.info {
                border-left: 4px solid var(--accent-cyan);
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .notification i {
                font-size: 1.2rem;
            }
            
            .notification.success i {
                color: var(--accent-green);
            }
            
            .notification.info i {
                color: var(--accent-cyan);
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add scroll effects
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const scrollY = window.scrollY;
    
    if (scrollY > 100) {
        header.style.background = 'rgba(10, 10, 26, 0.98)';
        header.style.backdropFilter = 'blur(20px)';
    } else {
        header.style.background = 'rgba(10, 10, 26, 0.95)';
        header.style.backdropFilter = 'blur(20px)';
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);