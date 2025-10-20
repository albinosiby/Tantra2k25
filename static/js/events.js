// Global variables
let events = [];
let departments = [];
let festivalInfo = {};
let currentDepartment = 'all';

// DOM Elements
let eventsContainer, registrationModal, registrationForm, eventNameInput, closeModal, navToggle, navMenu;

// Initialize DOM Elements
function initializeDOMElements() {
    eventsContainer = document.getElementById('events-container');
    registrationModal = document.getElementById('registration-modal');
    registrationForm = document.getElementById('registration-form');
    eventNameInput = document.getElementById('event-name');
    closeModal = document.querySelector('.close-modal');
    navToggle = document.querySelector('.nav-toggle');
    navMenu = document.querySelector('.nav-menu');

    console.log('DOM Elements initialized:');
    console.log('- eventsContainer:', eventsContainer);
    console.log('- registrationModal:', registrationModal);
    console.log('- registrationForm:', registrationForm);
    console.log('- eventNameInput:', eventNameInput);
    console.log('- closeModal:', closeModal);
}

// Debug functions
function testModal() {
    console.log('=== TESTING MODAL ===');
    console.log('Registration modal:', registrationModal);
    console.log('Event name input:', eventNameInput);
    console.log('Available events:', events);

    if (events.length > 0) {
        console.log('Opening modal with event:', events[0]);
        openRegistrationModal(events[0].id);
    } else {
        console.log('No events found, using test data');
        if (eventNameInput) {
            eventNameInput.value = "Test Event - Code Wars";
        }
        if (registrationModal) {
            registrationModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                registrationModal.classList.add('active');
            }, 10);
        }
    }
}

function testEvents() {
    console.log('=== TESTING EVENTS ===');
    console.log('Events loaded:', events);
    console.log('Departments loaded:', departments);
    console.log('Events container:', eventsContainer);

    renderEvents();
}

function testData() {
    console.log('=== TESTING DATA ===');
    console.log('Festival Info:', festivalInfo);
    console.log('All Events:', events);
    console.log('All Departments:', departments);
    console.log('Current Department:', currentDepartment);
}

function inspectEventCards() {
    console.log('=== INSPECTING EVENT CARDS ===');
    const eventCards = document.querySelectorAll('.event-card');
    console.log('Total event cards found:', eventCards.length);

    eventCards.forEach((card, index) => {
        const registerBtn = card.querySelector('.register-btn');
        const eventTitle = card.querySelector('.event-title')?.textContent;
        const dataEventId = registerBtn?.getAttribute('data-event-id');

        console.log(`Card ${index + 1}:`, {
            eventName: eventTitle,
            registerButtonExists: !!registerBtn,
            dataEventId: dataEventId,
            dataEventIdType: typeof dataEventId,
            buttonHTML: registerBtn?.outerHTML
        });

        // Also log the entire card HTML for deep inspection
        console.log(`Card ${index + 1} full HTML:`, card.outerHTML);
    });
}

// Make functions globally available
window.testModal = testModal;
window.testEvents = testEvents;
window.testData = testData;
window.inspectEventCards = inspectEventCards;

// Load data from server or fallback to static JSON, then defaults
async function loadData() {
    try {
        let data = null;

        // Try server API first
        try {
            const response = await fetch('/api/data');
            if (response && response.ok) {
                data = await response.json();
            }
        } catch (err) {
            // server not available or network error; we'll try static JSON next
            data = null;
        }

        // If server data not available, try static JSON (works when opened via file://)
        if (!data) {
            try {
                const resp = await fetch('data/data.json');
                if (resp && resp.ok) {
                    data = await resp.json();
                }
            } catch (err) {
                data = null;
            }
        }

        // If still no data, use built-in defaults
        if (!data) {
            console.log('No remote/static data found — using builtin defaults');
            events = getDefaultEvents();
            departments = getDefaultDepartments();
            festivalInfo = getDefaultFestivalInfo();
            return { events, departments, festivalInfo };
        }

        // Assign normalized fields (support both festivalInfo and festival_info)
        events = data.events || [];
        departments = data.departments || [];
        festivalInfo = data.festivalInfo || data.festival_info || {};

        console.log('Data loaded successfully:');
        console.log('- Events:', events.length);
        console.log('- Departments:', departments.length);

        return data;
    } catch (error) {
        console.error('Unexpected error loading data:', error);
        events = getDefaultEvents();
        departments = getDefaultDepartments();
        festivalInfo = getDefaultFestivalInfo();
        return { events, departments, festivalInfo };
    }
}

// Default data in case JSON fails to load
function getDefaultEvents() {
    return [
        {
            id: 1, // Ensure this is a number
            name: "Code Wars",
            department: "computer-science",
            category: "technical",
            description: "A competitive programming challenge where participants solve complex algorithmic problems under time constraints.",
            date: "2025-10-24",
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
            id: 2, // Ensure this is a number
            name: "Robo Wars",
            department: "mechanical-engineering",
            category: "technical",
            description: "Battle of the bots where participants design and build combat robots to compete in an arena.",
            date: "2025-10-25",
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
            id: 3, // Ensure this is a number
            name: "Circuit Design Challenge",
            department: "electronics-communication",
            category: "technical",
            description: "Design and implement innovative electronic circuits to solve real-world problems.",
            date: "2025-10-26",
            time: "11:00 AM",
            venue: "Electronics Lab",
            coordinator: "Dr. Williams",
            coordinatorPhone: "+1 234 567 8903",
            price: 75,
            image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
            participants: 60,
            duration: "5 hours"
        }
    ];
}

function getDefaultDepartments() {
    return [
        {
            id: "applied-electronics-instrumentation",
            name: "Applied Electronics & Instrumentation Engineering",
            icon: "fas fa-microchip",
            description: "Sensors, instrumentation, embedded systems, and control technologies",
            color: "#ff6f00"
        },
        {
            id: "civil-engineering",
            name: "Civil Engineering",
            icon: "fas fa-building",
            description: "Structural design, surveying, geotechnical, and construction engineering projects",
            color: "#8d99ae"
        },
        {
            id: "cse-cyber-security",
            name: "Computer Science and Engineering (Cyber Security)",
            icon: "fas fa-shield-alt",
            description: "Network defense, ethical hacking, cryptography, and cyber forensics challenges",
            color: "#ff0054"
        },
        {
            id: "computer-science-design",
            name: "Computer Science & Design",
            icon: "fas fa-paint-brush",
            description: "UI/UX, design thinking, creative computing, and human–computer interaction",
            color: "#ff9e00"
        },
        {
            id: "electrical-electronics",
            name: "Electrical & Electronics Engineering",
            icon: "fas fa-bolt",
            description: "Power systems, circuits, renewable energy, and electrical automation",
            color: "#ffd60a"
        },
        {
            id: "ai-data-science",
            name: "Artificial Intelligence and Data Science",
            icon: "fas fa-brain",
            description: "Machine learning, neural networks, data analytics, and AI-driven innovations",
            color: "#00b4d8"
        },
        {
            id: "cse-business-systems",
            name: "Computer Science and Engineering (Business Systems)",
            icon: "fas fa-briefcase",
            description: "Technology management, data-driven decision making, and business analytics",
            color: "#6a4c93"
        },
        {
            id: "computer-science-engineering",
            name: "Computer Science and Engineering",
            icon: "fas fa-laptop-code",
            description: "Software development, data structures, algorithms, and computing systems",
            color: "#00f5ff"
        },
        {
            id: "electronics-communication",
            name: "Electronics & Communication Engineering",
            icon: "fas fa-satellite-dish",
            description: "Analog and digital communication, VLSI, signal processing, and IoT systems",
            color: "#00b8a9"
        },
        {
            id: "mechanical-engineering",
            name: "Mechanical Engineering",
            icon: "fas fa-cogs",
            description: "Thermodynamics, design, manufacturing, and mechanical innovation projects",
            color: "#e63946"
        }
    ];
}

// Update page content with loaded data
function updatePageContent() {
    console.log('Updating page content...');

    // Check if we're on main page or events page
    const isEventsPage = window.location.pathname.includes('events.html');
    console.log('Is events page:', isEventsPage);

    if (isEventsPage) {
        // Events page - render department tabs and events
        console.log('Rendering events page content');
        renderDepartmentTabs();
        renderEvents();
    } else {
        // Main page - render featured events and departments
        console.log('Rendering main page content');
        if (typeof renderFeaturedEvents === 'function') {
            renderFeaturedEvents();
        }
        if (typeof renderDepartments === 'function') {
            renderDepartments();
        }
    }
}

// Render department tabs for events page
function renderDepartmentTabs() {
    const filterTabs = document.getElementById('filter-tabs');
    const filterToggle = document.getElementById('filter-toggle-btn');
    if (!filterTabs) {
        console.error('Filter tabs container not found');
        return;
    }
    filterTabs.innerHTML = '';
    // Add "All Events" tab
    const allTab = document.createElement('button');
    allTab.className = `department-tab ${currentDepartment === 'all' ? 'active' : ''}`;
    allTab.setAttribute('data-filter', 'all');
    allTab.innerHTML = `
        <i class="fas fa-th-large"></i>
        All Events
    `;
    allTab.addEventListener('click', () => {
        currentDepartment = 'all';
        updateURLParameter('department', 'all');
        renderDepartmentTabs();
        renderEvents();
        resetPageTitle();
        if (window.innerWidth <= 600 && filterTabs) filterTabs.style.display = 'none';
    });
    filterTabs.appendChild(allTab);
    // Add department tabs
    departments.forEach(dept => {
        const tab = document.createElement('button');
        tab.className = `department-tab ${currentDepartment === dept.id ? 'active' : ''}`;
        tab.setAttribute('data-filter', dept.id);
        tab.innerHTML = `
            <i class="${dept.icon}"></i>
            ${dept.name}
        `;
        tab.addEventListener('click', () => {
            currentDepartment = dept.id;
            updateURLParameter('department', dept.id);
            renderDepartmentTabs();
            renderEvents();
            updatePageTitle(dept.name);
            if (window.innerWidth <= 600 && filterTabs) filterTabs.style.display = 'none';
        });
        filterTabs.appendChild(tab);
    });
    // Responsive: hide/show filter tabs on phone
    if (filterToggle) {
        if (window.innerWidth <= 600) {
            filterTabs.style.display = 'none';
            filterToggle.style.display = 'inline-flex';
            filterToggle.onclick = () => {
                filterTabs.style.display = filterTabs.style.display === 'none' ? 'flex' : 'none';
            };
        } else {
            filterTabs.style.display = 'flex';
            filterToggle.style.display = 'none';
        }
    }
}
function updateURLParameter(key, value) {
    const url = new URL(window.location);
    if (value === 'all' || !value) {
        url.searchParams.delete(key);
    } else {
        url.searchParams.set(key, value);
    }
    window.history.replaceState({}, '', url);
}

// Add function to reset page title when showing all events
function resetPageTitle() {
    document.title = 'All Events - TANTRA 2025';

    const heroTitle = document.querySelector('.section-title');
    if (heroTitle) {
        heroTitle.innerHTML = 'ALL <span>EVENTS</span>';
    }

    const subtitle = document.querySelector('.section-subtitle');
    if (subtitle) {
        subtitle.textContent = 'Explore the complete lineup of TANTRA 2025 events';
    }
}
function updatePageTitle(departmentName) {
    if (departmentName && departmentName !== 'all') {
        document.title = `${departmentName} Events - TANTRA 2025`;

        // Also update the hero section title if it exists
        const heroTitle = document.querySelector('.section-title');
        if (heroTitle) {
            const span = heroTitle.querySelector('span');
            if (span) {
                heroTitle.innerHTML = `${departmentName} <span>EVENTS</span>`;
            }
        }

        // Update the subtitle to show filtered view
        const subtitle = document.querySelector('.section-subtitle');
        if (subtitle) {
            subtitle.textContent = `Explore ${departmentName} events in TANTRA 2025`;
        }
    }
}
// Render events based on current department
function renderEvents() {
    if (!eventsContainer) {
        console.error('Events container not found');
        return;
    }

    console.log('Rendering events for department:', currentDepartment);
    console.log('Total events available:', events.length);

    const filteredEvents = currentDepartment === 'all'
        ? events
        : events.filter(event => {
            const matches = event.department === currentDepartment;
            console.log(`Event: ${event.name}, Department: ${event.department}, Matches: ${matches}`);
            return matches;
        });

    console.log('Filtered events count:', filteredEvents.length);

    // When filtered by department, show only the events grid (no department card/header)
    if (currentDepartment !== 'all' && filteredEvents.length > 0) {
        eventsContainer.innerHTML = `
            <div class="events-grid" id="events-grid-content">
                <!-- Events will be loaded here -->
            </div>
        `;

        // Populate grid with filtered events
        const eventsGrid = document.getElementById('events-grid-content');
        if (eventsGrid) {
            filteredEvents.forEach(event => {
                const eventCard = createEventCard(event);
                eventsGrid.appendChild(eventCard);
            });
        }

    // Animate the cards after they're rendered
    try { animateEventCards(); } catch (err) { console.warn('animateEventCards immediate call failed', err); }
    setTimeout(animateEventCards, 100);
        console.log('Filtered department events rendered successfully (no department card)');
        return;
    }

    // Default rendering for "All Events"
    if (filteredEvents.length === 0) {
        eventsContainer.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-times"></i>
                <h3>No events found</h3>
                <p>${currentDepartment === 'all' ? 'Check back later for events' : 'No events found for this department. Try selecting a different department.'}</p>
            </div>
        `;
        return;
    }

    eventsContainer.innerHTML = '';

    filteredEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsContainer.appendChild(eventCard);
    });

    // Animate the cards after they're rendered (call immediately and schedule fallback)
    try { animateEventCards(); } catch (err) { console.warn('animateEventCards immediate call failed', err); }
    setTimeout(animateEventCards, 100);
    console.log('Events rendered successfully');
}

// Create event card element - FIXED VERSION
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-category', event.category);

    const priceText = event.price === 0 ? 'FREE' : `₹${event.price}`;
    const department = departments.find(dept => dept.id === event.department);

    // IMPORTANT: Ensure event.id is properly handled
    const eventId = event.id;

    console.log('Creating event card for:', event.name, 'with ID:', eventId, 'Type:', typeof eventId);

    const isOpen = event.status === 'open';
    card.classList.add('flip-card');
    // Use event.image_url if present, else event.image, else fallback
    const eventImageUrl = event.image_url && event.image_url.trim() !== '' ? event.image_url : (event.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80');
    card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <img src="${eventImageUrl}" alt="${event.name}" class="event-image" loading="eager"
                        onerror="this.src='https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'">
                    <div class="event-content">
                        <h3 class="event-title">${event.name}</h3>
                        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                            <span class="event-group"><i class="fas fa-users"></i> ${event.category}</span>
                            <span class="event-price">${priceText}</span>
                        </div>
                        <div class="event-actions" style="display:flex;gap:8px;">
                            ${isOpen
            ? `<button class="register-btn" data-event-id="${eventId}">
                                        <span>Register Now</span>
                                        <i class="fas fa-arrow-right"></i>
                                    </button>`
            : `<button class="register-btn" data-event-id="${eventId}" disabled style="background:#aaa;cursor:not-allowed;">
                                        <span>Registration Closed</span>
                                        <i class="fas fa-lock"></i>
                                    </button>`
                            }
                            <button class="details-btn">Details</button>
                        </div>
                    </div>
                </div>
               <div class="flip-card-back" style="
  background: linear-gradient(145deg, rgba(18,20,40,0.95), rgba(26,28,46,0.95)), 
              url('${eventImageUrl}'); 
  background-size: cover;
  background-position: center;
  color: #ffffff;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.45), inset 0 0 10px rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);
">

  <!-- 📋 Grid Section -->
  <div class="event-grid" style="
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
    font-size: 0.9rem;
    color: #c8c8e5;
    margin-bottom: 10px;
  ">

    <!-- 🎖 Prize -->
    <span style="
      grid-column: span 2;
      justify-self: center;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.08);
      padding: 6px 14px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;s
      color: #ffe066;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">
      <i class="fas fa-trophy" style="color: #ffd700;"></i>
      Prize: ${event.prize || '—'}
    </span>

    <!-- 👤 Coordinator -->
    <div style="display: flex; flex-direction: column; gap: 6px;">
      <span style="display: flex; align-items: center; gap: 6px;">
        <i class="fas fa-user" style="color: #7dd3fc;"></i>
        <strong>Coordinator</strong>
      </span>
      <span style="padding-left: 22px; color: #e0e7ff;">${event.coordinator || ''}</span>
    </div>

    <!-- ☎ Phone -->
    <div style="display: flex; flex-direction: column; gap: 6px;">  
        <span style="display: flex; align-items: center; gap: 6px;">
        <i class="fas fa-phone" style="color: #7dd3fc;"></i>
        <strong>Phone</strong>
      </span>
      <span style="padding-left: 22px; color: #e0e7ff;">${event.coordinatorPhone || ''}</span>
    </div>

    <!-- 📍 Venue -->
    <div style="display: flex; flex-direction: column; gap: 6px;">
      <span style="display: flex; align-items: center; gap: 6px;">
        <i class="fas fa-map-marker-alt" style="color: #7dd3fc;"></i>
        <strong>Venue</strong>
      </span>
      <span style="padding-left: 22px; color: #e0e7ff;">${event.venue || ''}</span>
    </div>

    <!-- ⏰ Time -->
    <div style="display: flex; align-items: center; gap: 6px;">
      <i class="fas fa-clock" style="color: #7dd3fc;"></i>
      <strong>Time:</strong> <span style="color: #e0e7ff;">${event.time || ''}</span>
    </div>

  </div>

    <!-- 📝 Description -->
    <p class="event-description">${event.description || ''}</p>

</div>


            </div>
        </div>
        `;

    // Flip logic
    const inner = card.querySelector('.flip-card-inner');
    const detailsBtns = card.querySelectorAll('.details-btn');
    // Only flip to back when clicking Details button
    detailsBtns.forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            inner.classList.add('flipped');
        });
    });

    // Only allow flip back to front when tapping near the center of back face
    inner.addEventListener('click', e => {
        if (inner.classList.contains('flipped')) {
            // When card is flipped to back, prevent any clicks from reaching front face
            e.stopPropagation();
            
            // If clicking any button, don't flip
            const isButton = e.target.closest('.register-btn, .details-btn, button');
            if (isButton) {
                return;
            }

            // Get click position relative to card
            const rect = inner.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Only allow flip if click is within central 60% area
            const xMin = rect.width * 0.2;
            const xMax = rect.width * 0.8;
            const yMin = rect.height * 0.2;
            const yMax = rect.height * 0.8;
            if (x > xMin && x < xMax && y > yMin && y < yMax) {
                inner.classList.remove('flipped');
            }
        }
    });
    return card;
}

// Format date for display
function formatDate(dateString) {
    try {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// Enhanced event card animations
function animateEventCards() {
    const eventCards = document.querySelectorAll('.event-card');
    console.log('Animating event cards:', eventCards.length);

    // Reset animations when filtering
    eventCards.forEach(card => {
        card.style.animation = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px) scale(0.9)';
    });

    // Trigger reflow
    void eventCards[0]?.offsetHeight;

    // Apply animations with delays
    eventCards.forEach((card, index) => {
        card.style.animation = `
            cardEntrance 0.8s ease-out ${index * 0.1}s forwards,
            float 6s ease-in-out ${index * 0.5}s infinite,
            pulseGlow 4s ease-in-out ${index * 0.3}s infinite
        `;
    });
}

// Preload event images to warm browser cache and make cards render instantly
function preloadEventImages() {
    if (!events || events.length === 0) return;
    events.forEach(ev => {
        const url = ev.image_url && ev.image_url.trim() !== '' ? ev.image_url : (ev.image || '');
        if (url) {
            const img = new Image();
            img.src = url;
        }
    });
}

// Setup event listeners - FIXED VERSION
function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Event registration buttons - use event delegation with better targeting
    // Only trigger registration modal on actual register button clicks, not card taps
    document.addEventListener('click', (e) => {
        // Ignore clicks on .flip-card-inner when flipped (back face)
        const inner = e.target.closest('.flip-card-inner');
        if (inner && inner.classList.contains('flipped') && !e.target.classList.contains('register-btn')) {
            // Prevent bubbling to document for back face taps
            return;
        }

        // Try multiple ways to find the register button
        let registerBtn = e.target.closest('.register-btn');

        if (!registerBtn) {
            // If clicking on the icon inside the button
            const icon = e.target.closest('.register-btn i');
            const text = e.target.closest('.register-btn span');
            if (icon || text) {
                registerBtn = (icon || text).closest('.register-btn');
            }
        }

        if (registerBtn) {
            console.log('Register button clicked!');
            console.log('Button element:', registerBtn);
            console.log('All data attributes:', registerBtn.dataset);

            // Get the data-event-id attribute
            const eventId = registerBtn.getAttribute('data-event-id');
            console.log('Event ID from attribute:', eventId, 'Type:', typeof eventId);

            if (eventId && eventId !== 'undefined' && eventId !== 'null') {
                openRegistrationModal(eventId);
            } else {
                console.error('Event ID is undefined or invalid:', eventId);

                // Fallback: try to find event by name
                const eventCard = registerBtn.closest('.event-card');
                if (eventCard) {
                    const eventName = eventCard.querySelector('.event-title')?.textContent;
                    if (eventName) {
                        const event = events.find(e => e.name === eventName);
                        if (event) {
                            console.log('Found event by name, using ID:', event.id);
                            openRegistrationModal(event.id);
                            return;
                        }
                    }
                }

                // Ultimate fallback: use first event
                if (events.length > 0) {
                    console.log('Using first event as fallback');
                    openRegistrationModal(events[0].id);
                } else {
                    alert('Event registration is currently unavailable. Please try again later.');
                }
            }
        }
    });

    // Modal close
    if (closeModal) {
        closeModal.addEventListener('click', closeRegistrationModal);
        console.log('Close modal listener added');
    } else {
        console.error('Close modal button not found');
    }

    if (registrationModal) {
        registrationModal.addEventListener('click', (e) => {
            if (e.target === registrationModal) {
                closeRegistrationModal();
            }
        });
    }

    // Form submission
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
        console.log('Form submission listener added');
    } else {
        console.error('Registration form not found');
    }

    // Navigation toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', toggleNavigation);
        console.log('Navigation toggle listener added');
    }

    console.log('Event listeners setup complete');
}

// Enhanced openRegistrationModal with better error handling
function openRegistrationModal(eventId) {
    console.log('=== OPENING REGISTRATION MODAL ===');
    console.log('Event ID received:', eventId);
    console.log('Type of eventId:', typeof eventId);

    // Convert to number and find event
    let numericId;
    if (typeof eventId === 'string') {
        numericId = parseInt(eventId);
        console.log('Parsed string to number:', numericId);
    } else if (typeof eventId === 'number') {
        numericId = eventId;
        console.log('Already a number:', numericId);
    } else {
        console.error('Invalid event ID type:', typeof eventId);
        numericId = events[0]?.id || 1; // Use first event as fallback
    }

    console.log('Final numeric ID:', numericId);
    console.log('All available events:', events);

    const event = events.find(e => e.id === numericId);

    console.log('Found event:', event);
    console.log('Modal element exists:', !!registrationModal);
    console.log('Event name input exists:', !!eventNameInput);

    if (event && registrationModal && eventNameInput) {
        eventNameInput.value = event.name;
        // set QR code in modal based on event's department
        // Pass whether event is free so modal can hide/show payment fields
        updateModalQr(event.department, event.price === 0);
        registrationModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Add entrance animation
        setTimeout(() => {
            registrationModal.classList.add('active');
        }, 10);

        console.log('✅ Modal opened successfully for event:', event.name);
    } else {
        console.error('❌ Failed to open modal:', {
            eventFound: !!event,
            modalFound: !!registrationModal,
            inputFound: !!eventNameInput,
            eventsCount: events.length,
            eventId: numericId
        });

        // Enhanced fallback
        if (!event) {
            // Try to find any event to use as fallback
            const fallbackEvent = events[0];
            if (fallbackEvent && registrationModal && eventNameInput) {
                console.log('Using fallback event:', fallbackEvent.name);
                eventNameInput.value = fallbackEvent.name;
                // set QR code from fallback event's department
                updateModalQr(fallbackEvent.department, fallbackEvent.price === 0);
                registrationModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    registrationModal.classList.add('active');
                }, 10);
            } else {
                // Ultimate fallback - create a test event
                console.log('Creating test event for modal');
                if (registrationModal && eventNameInput) {
                    eventNameInput.value = "Technical Event";
                    // no department known for test event; clear/set default QR
                    updateModalQr(null, true);
                    registrationModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    setTimeout(() => {
                        registrationModal.classList.add('active');
                    }, 10);
                } else {
                    alert('Event registration is currently unavailable. Please try again later.');
                }
            }
        }
    }
}

// Update the registration modal QR image/text from department data
function updateModalQr(deptId, isFree = false) {
    // deptId: department id or null
    // isFree: boolean — when true, hide payment/QR UI because event is free
    if (!registrationModal) return;
    const qrImg = registrationModal.querySelector('.qr-code-image img');
    const qrContainer = registrationModal.querySelector('.qr-code-image');
    const qrFallbackSmall = registrationModal.querySelector('.qr-fallback small');
    const paymentSection = registrationModal.querySelector('.payment-section');
    const txField = document.getElementById('transaction-id');
    const txError = document.getElementById('transaction-id-error');
    const txLabel = registrationModal.querySelector("label[for='transaction-id']");
    const txHelper = registrationModal.querySelector('.input-help');

    const defaultText = 'UPI: tantra2025@paytm';

    if (isFree) {
        // Hide entire payment section and transaction inputs for free events
        if (paymentSection) paymentSection.style.display = 'none';
        if (qrImg) qrImg.style.display = 'none';
        if (qrContainer) qrContainer.style.display = 'none';
        if (qrFallbackSmall) qrFallbackSmall.textContent = 'Free event — no payment required';

        if (txField) {
            txField.value = '';
            txField.style.display = 'none';
            txField.required = false;
        }
        if (txLabel) txLabel.style.display = 'none';
        if (txError) txError.style.display = 'none';
        if (txHelper) txHelper.style.display = 'none';
        return;
    }

    // For paid events show the QR and transaction inputs
    // Show payment section and inputs for paid events
    if (paymentSection) paymentSection.style.display = '';
    if (txField) {
        txField.style.display = '';
        txField.required = true;
    }
    if (txLabel) txLabel.style.display = '';
    if (txError) txError.style.display = 'none';
    if (txHelper) txHelper.style.display = '';
    if (qrContainer) qrContainer.style.display = '';

    if (!deptId) {
        // show generic QR if available in static images or fallback text
        if (qrImg) {
            qrImg.src = '/static/images/payment-qr.png';
            qrImg.style.display = '';
        }
        if (qrFallbackSmall) qrFallbackSmall.textContent = defaultText;
        return;
    }

    const dept = departments.find(d => d.id === deptId);
    if (dept && dept.qr_code) {
        if (qrImg) {
            const filename = (dept.qr_code || '').trim();
            if (filename !== '') {
                qrImg.src = encodeURI('/static/Qr code/' + filename);
            } else {
                qrImg.src = '/static/images/payment-qr.png';
            }
            qrImg.style.display = '';
        }
        if (qrFallbackSmall) qrFallbackSmall.textContent = dept.qr_code;
    } else {
        if (qrImg) {
            qrImg.src = '/static/images/payment-qr.png';
            qrImg.style.display = '';
        }
        if (qrFallbackSmall) qrFallbackSmall.textContent = defaultText;
    }
}

// Close registration modal
function closeRegistrationModal() {
    console.log('Closing modal');
    if (registrationModal) {
        registrationModal.classList.remove('active');
        setTimeout(() => {
            registrationModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// Handle form submission
function handleRegistration(e) {
    e.preventDefault();
    console.log('Form submission started');

    // Validate transaction ID (12-16 alphanumeric)
    const txField = document.getElementById('transaction-id');
    const txError = document.getElementById('transaction-id-error');
    let txVal = txField?.value?.trim() || '';
    const txRe = /^[A-Za-z0-9]{12,16}$/;

    // Determine selected event and whether payment is required
    const selectedEvent = events.find(e => e.name === (eventNameInput ? eventNameInput.value : '')) || {};
    const requiresPayment = !!(selectedEvent.price && Number(selectedEvent.price) > 0);

    if (requiresPayment) {
        if (!txRe.test(txVal)) {
            if (txError) {
                txError.style.display = 'block';
            }
            if (txField) txField.focus();
            return; // stop submission
        } else {
            if (txError) txError.style.display = 'none';
        }
    } else {
        // Free event: clear any tx input and hide errors
        txVal = '';
        if (txError) txError.style.display = 'none';
    }
    const formData = {
        event_name: selectedEvent.name || (eventNameInput ? eventNameInput.value : 'Unknown Event'),
        event_id: selectedEvent.id || '',
        name: document.getElementById('participant-name')?.value || '',
        email: document.getElementById('participant-email')?.value || '',
        phone: document.getElementById('participant-phone')?.value || '',
        college: document.getElementById('participant-college')?.value || '',
        year: document.getElementById('participant-year')?.value || '',
        'branch/Class': document.getElementById('participant-branch')?.value || '',
        transaction_id: txVal
    };

    console.log('Form data:', formData);

    // Show loading state
    const submitBtn = registrationForm?.querySelector('.submit-btn');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
        submitBtn.disabled = true;

        // Send registration to backend
        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok' && data.saved) {
                    showNotification('Registration successful! Check your email for confirmation.', 'success');
                    if (registrationForm) registrationForm.reset();
                    closeRegistrationModal();
                } else {
                    showNotification('Registration failed. Please try again.', 'error');
                }
            })
            .catch(err => {
                showNotification('Registration failed. Please try again.', 'error');
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
    }
}

// Toggle mobile navigation
function toggleNavigation() {
    if (navMenu) {
        navMenu.classList.toggle('open');
    }
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

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
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

// Add intersection observer for scroll animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, { threshold: 0.1 });

    // Observe event cards
    document.querySelectorAll('.event-card').forEach(card => {
        observer.observe(card);
    });
}

// Add scroll effects
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (!header) return; // no header in this layout — skip scroll styling
    const scrollY = window.scrollY;

    if (scrollY > 100) {
        header.style.background = 'rgba(10, 10, 26, 0.98)';
        header.style.backdropFilter = 'blur(20px)';
    } else {
        header.style.background = 'rgba(10, 10, 26, 0.95)';
        header.style.backdropFilter = 'blur(20px)';
    }
});
async function init() {
    console.log('=== INITIALIZING APPLICATION ===');

    // Initialize DOM elements first
    initializeDOMElements();

    // Start loading data
    await loadData();

    // Preload images to make cards appear immediately
    try {
        preloadEventImages();
    } catch (err) {
        console.warn('Image preloading failed:', err);
    }

    // Enhanced department parameter handling from URL
    const urlParams = new URLSearchParams(window.location.search);
    const departmentParam = urlParams.get('department');

    if (departmentParam) {
        // Validate department exists
        const validDepartment = departments.find(dept => dept.id === departmentParam);
        if (validDepartment) {
            currentDepartment = departmentParam;
            console.log('Department from URL parameter:', currentDepartment);

            // Update page title to show filtered department
            updatePageTitle(validDepartment.name);
        } else {
            console.warn('Invalid department parameter:', departmentParam);
            currentDepartment = 'all';
        }
    }

    // Update page content
    updatePageContent();

    // Setup event listeners
    setupEventListeners();
    setupSmoothScrolling();
    initScrollAnimations();

    console.log('=== APPLICATION INITIALIZED SUCCESSFULLY ===');
    console.log('Current department:', currentDepartment);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
