// Global variables
let events = [];
let departments = [];
let festivalInfo = {};
let currentDepartment = 'all';

// Detect iOS early for performance fallbacks in this script too
const _ua = navigator.userAgent || navigator.vendor || window.opera || '';
const isIOS_Script = (/iP(ad|hone|od)/.test(_ua) || (_ua.includes('Mac') && 'ontouchend' in document));

// Pause heavy animations when page is hidden to avoid background CPU and memory pressure
if (typeof document !== 'undefined' && typeof gsap !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        try {
            if (document.hidden) {
                // Pause all GSAP timelines/tweens
                gsap.globalTimeline.pause();
            } else {
                gsap.globalTimeline.resume();
            }
        } catch (e) {
            // ignore if gsap not ready
        }
    });
}

// TANTRA Text Animation - Automatically plays on load
function initTantraAnimation() {
    const text = document.querySelector('.tantra-text');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile-optimized version of desktop animation
        initMobileOptimizedTantraAnimation(text);
    } else {
        // Original desktop animation
        initDesktopTantraAnimation(text);
    }
}

// Mobile-specific animation
function initMobileOptimizedTantraAnimation(text) {
    // Split text into letters for individual animation
    const textContent = text.textContent;
    text.innerHTML = '';
    
    const letters = [];
    for (let i = 0; i < textContent.length; i++) {
        const span = document.createElement('span');
        span.textContent = textContent[i];
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(60px) rotateX(45deg) scale(0.7)'; // Reduced values for mobile
        text.appendChild(span);
        letters.push(span);
    }

    // Optimized master timeline for mobile
    const masterTL = gsap.timeline();

    // 1. Simplified entrance animation
    masterTL.to(letters, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        duration: 1.2, // Shorter duration
        stagger: 0.08, // Faster stagger
        ease: "back.out(1.5)" // Less intense easing
    })

    // 2. Add glow effect after entrance
    .to(text, {
        textShadow: "0 0 25px rgba(0, 245, 255, 0.7), 0 0 50px rgba(157, 78, 221, 0.5), 0 0 75px rgba(255, 46, 146, 0.3)",
        duration: 0.8,
        ease: "power2.out"
    }, "-=0.3")

    // 3. Optimized continuous animations
    .add(() => {
        // Reduced breathing scale (avoid infinite repeats on iOS)
        gsap.to(text, {
            scale: 1.04,
            duration: 4,
            repeat: isIOS_Script ? 1 : -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Reduced floating motion
        gsap.to(text, {
            y: -8,
            duration: 5,
            repeat: isIOS_Script ? 1 : -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Reduced horizontal sway
        gsap.to(text, {
            x: 5,
            duration: 6,
            repeat: isIOS_Script ? 1 : -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Reduced master rotation
        gsap.to(text, {
            rotation: 1,
            duration: 10,
            repeat: isIOS_Script ? 1 : -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Optimized individual letter animations
    letters.forEach((letter, index) => {
            // Reduced rotation
            gsap.to(letter, {
                rotation: Math.random() * 4 - 2,
                duration: 4 + Math.random() * 3,
                repeat: isIOS_Script ? 1 : -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: index * 0.15
            });

            // Reduced scale
            gsap.to(letter, {
                scale: 1.05,
                duration: 3 + Math.random() * 2,
                repeat: isIOS_Script ? 1 : -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: index * 0.2
            });
        });

        // Reduced opacity pulse
        gsap.to(text, {
            opacity: 0.95,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    });

    // Mobile-optimized interactive features
    let isInteracting = false;
    let interactionTimeout;

    text.addEventListener('touchstart', () => {
        if (isInteracting) return;
        isInteracting = true;
        
        // Clear any pending timeout
        if (interactionTimeout) clearTimeout(interactionTimeout);
        
        // Scale up on touch
        gsap.to(text, {
            scale: 1.2,
            duration: 0.3,
            ease: "back.out(1.5)"
        });
        
        // Individual letter jump - reduced intensity
        letters.forEach((letter, index) => {
            gsap.to(letter, {
                y: -15, // Reduced jump height
                rotation: Math.random() * 10 - 5, // Reduced rotation
                duration: 0.4,
                ease: "back.out(1.5)",
                delay: index * 0.06 // Faster response
            });
        });
    });

    text.addEventListener('touchend', () => {
        // Return to normal state with delay
        interactionTimeout = setTimeout(() => {
            gsap.to(text, {
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.5)"
            });
            
            // Return letters to position
            letters.forEach((letter, index) => {
                gsap.to(letter, {
                    y: 0,
                    rotation: 0,
                    duration: 0.5,
                    ease: "back.out(1.5)",
                    delay: index * 0.06
                });
            });
            
            isInteracting = false;
        }, 100);
    });

    // Double tap to replay entrance
    let lastTap = 0;
    text.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            e.preventDefault();
            
            // Hide all letters quickly
            gsap.to(letters, {
                opacity: 0,
                y: 30, // Reduced distance
                rotationX: 45, // Reduced rotation
                scale: 0.7,
                duration: 0.2,
                stagger: 0.03, // Faster
                ease: "power2.in"
            });

            // Reveal letters with delay
            setTimeout(() => {
                gsap.to(letters, {
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    scale: 1,
                    duration: 0.8,
                    stagger: 0.08,
                    ease: "back.out(1.5)"
                });
            }, 300);
        }
        lastTap = currentTime;
    });

    // Prevent context menu on long press
    text.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
}


// Create particles for special stretch effect
function createStretchParticles(text) {
    const rect = text.getBoundingClientRect();
    const particlesContainer = document.createElement('div');
    particlesContainer.style.position = 'fixed';
    particlesContainer.style.top = '0';
    particlesContainer.style.left = '0';
    particlesContainer.style.width = '100%';
    particlesContainer.style.height = '100%';
    particlesContainer.style.pointerEvents = 'none';
    particlesContainer.style.zIndex = '1000';
    document.body.appendChild(particlesContainer);
    
    // Create multiple particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.background = getRandomColor();
        particle.style.borderRadius = '50%';
        particle.style.left = (rect.left + rect.width / 2) + 'px';
        particle.style.top = (rect.top + rect.height / 2) + 'px';
        particle.style.opacity = '1';
        particle.style.filter = 'blur(1px)';
        particlesContainer.appendChild(particle);
        
        // Animate particle
        const angle = (i / 12) * Math.PI * 2;
        const distance = 100 + Math.random() * 50;
        
        gsap.to(particle, {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            opacity: 0,
            scale: 0,
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
                particle.remove();
            }
        });
    }
    
    // Remove container after animation
    setTimeout(() => {
        particlesContainer.remove();
    }, 1600);
}

// Helper function to get random vibrant colors
function getRandomColor() {
    const colors = [
        "#00f5ff", "#9d4edd", "#ff2e92", "#ff8c00", "#00ff88", 
        "#ff0054", "#ffd60a", "#00b4d8", "#6a4c93", "#e63946"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Desktop animation (your existing code)
function initDesktopTantraAnimation(text) {
    // Split text into letters for individual animation
    const textContent = text.textContent;
    text.innerHTML = '';
    
    const letters = [];
    for (let i = 0; i < textContent.length; i++) {
        const span = document.createElement('span');
        span.textContent = textContent[i];
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(100px) rotateX(90deg) scale(0.5)';
        text.appendChild(span);
        letters.push(span);
    }

    // Master timeline for automatic animation
    const masterTL = gsap.timeline();

    // 1. Dramatic entrance animation
    masterTL.to(letters, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        duration: 1.5,
        stagger: 0.15,
        ease: "back.out(2)"
    })

    // 2. Add glow effect after entrance
    .to(text, {
        textShadow: "0 0 40px rgba(0, 245, 255, 0.8), 0 0 80px rgba(157, 78, 221, 0.6), 0 0 120px rgba(255, 46, 146, 0.4)",
        duration: 1,
        ease: "power2.out"
    }, "-=0.5")

    // 3. Continuous animations that loop forever
    .add(() => {
        // Breathing scale
        gsap.to(text, {
            scale: 1.08,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Floating motion
        gsap.to(text, {
            y: -15,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Horizontal sway
        gsap.to(text, {
            x: 10,
            duration: 5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Master rotation
        gsap.to(text, {
            rotation: 2,
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Individual letter animations
        letters.forEach((letter, index) => {
            // Rotation
            gsap.to(letter, {
                rotation: Math.random() * 8 - 4,
                duration: 3 + Math.random() * 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: index * 0.2
            });

            // Scale
            gsap.to(letter, {
                scale: 1.1,
                duration: 2 + Math.random() * 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: index * 0.3
            });
        });

        // Opacity pulse
        gsap.to(text, {
            opacity: 0.9,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    });

    // Interactive features
    text.addEventListener('mouseenter', () => {
        gsap.to(text, {
            scale: 1.3,
            duration: 0.4,
            ease: "back.out(2)"
        });
        
        // Individual letter jump
        letters.forEach((letter, index) => {
            gsap.to(letter, {
                y: -30,
                rotation: Math.random() * 20 - 10,
                duration: 0.6,
                ease: "back.out(2)",
                delay: index * 0.08
            });
        });
    });

    text.addEventListener('mouseleave', () => {
        gsap.to(text, {
            scale: 1,
            duration: 0.4,
            ease: "back.out(2)"
        });
        
        // Return letters to position
        letters.forEach((letter, index) => {
            gsap.to(letter, {
                y: 0,
                rotation: 0,
                duration: 0.6,
                ease: "back.out(2)",
                delay: index * 0.08
            });
        });
    });

    // Click to replay entrance
    text.addEventListener('click', () => {
        // Hide all letters quickly
        gsap.to(letters, {
            opacity: 0,
            y: 50,
            rotationX: 90,
            scale: 0.5,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.in"
        });

        // Reveal letters with delay
        setTimeout(() => {
            gsap.to(letters, {
                opacity: 1,
                y: 0,
                rotationX: 0,
                scale: 1,
                duration: 1,
                stagger: 0.1,
                ease: "back.out(2)"
            });
        }, 400);
    });
}

// Handle window resize to switch between mobile/desktop animations
let currentAnimationMode = window.innerWidth <= 768 ? 'mobile' : 'desktop';
let resizeTimeout;

window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const newMode = window.innerWidth <= 768 ? 'mobile' : 'desktop';
        
        if (newMode !== currentAnimationMode) {
            currentAnimationMode = newMode;
            console.log(`Switching to ${newMode} animation mode`);
            // For better UX, we don't reload the page
            // The animation will adapt on next page load
        }
    }, 250);
});
// Load data from JSON file
async function loadData() {
    try {
        // Try server API first (Flask). If unavailable, fall back to the static JSON file.
        let data = null;
        try {
            const response = await fetch('/api/data');
            if (response && response.ok) {
                data = await response.json();
            }
        } catch (err) {
            // API fetch failed (server not running or network); we'll try static JSON below
            data = null;
        }

        if (!data) {
            const fallbackResp = await fetch('data/data.json');
            if (!fallbackResp.ok) throw new Error('Failed to load fallback data');
            data = await fallbackResp.json();
        }

        events = data.events || [];
        departments = data.departments || [];
        festivalInfo = data.festivalInfo || data.festival_info || {};

        // Update page content with loaded data
        updatePageContent();
        
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        departments = getDefaultDepartments();
        updatePageContent();
    }
}

// Default data in case JSON fails to load
function getDefaultEvents() {
    return [
        {
            id: 1,
            name: "Code Wars",
            department: "computer-science",
            category: "technical",
            description: "A competitive programming challenge where participants solve complex algorithmic problems under time constraints.",
            date: "2024-10-15",
            time: "10:00 AM",
            venue: "CS Lab, Block A",
            coordinator: "Dr. Smith",
            coordinatorPhone: "+1 234 567 8901",
            price: 50,
            image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
            participants: 120,
            duration: "3 hours"
        }
    ];
}

// Update the getDefaultDepartments function to ensure all departments are included:
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
function getDefaultFestivalInfo() {
    return {
            name: "TANTRA 2025",
            dates: "October 15-18, 2025",
        tagline: "The ultimate battleground for tech innovators, creators, and visionaries",
        stats: {
            events: "50+",
            participants: "500+",
            prizePool: "₹50k+"
        }
    };
}

// Update page content with loaded data
function updatePageContent() {
    // Update hero section
    const heroBadge = document.querySelector('.hero-badge span');
    const heroSubtitle = document.querySelector('.hero-subtitle');

    if (heroBadge) heroBadge.textContent = `⚡ ${festivalInfo.dates}`;
    if (heroSubtitle) heroSubtitle.textContent = festivalInfo.tagline;
    
    // Check if we're on main page or events page
    const isEventsPage = window.location.pathname.includes('events.html');
    
    if (isEventsPage) {
        // Events page - render department tabs and events
        renderDepartmentTabs();
    } else {
        // Main page - render departments

        renderDepartments();
    }
}


// Render departments on main page
// In the renderDepartments function, update the department card links:
function renderDepartments() {
    const departmentsContainer = document.getElementById('departments-container');
    if (!departmentsContainer) return;
    
    departmentsContainer.innerHTML = departments.map(dept => {
        const departmentEvents = events.filter(event => event.department === dept.id);
        return `
            <a href="events.html?department=${dept.id}" class="department-card" data-department="${dept.id}">
                <div class="department-icon" style="color: ${dept.color}">
                    <i class="${dept.icon}"></i>
                </div>
                <h3>${dept.name}</h3>
                <p>${dept.description}</p>
                <div class="department-stats">
                    <span class="event-count">${departmentEvents.length} Events</span>
                </div>
            </a>
        `;
    }).join('');

    // Animate department cards with GSAP
    const cards = document.querySelectorAll('.department-card');
    gsap.set(cards, {opacity: 0, y: 60, scale: 0.95});
    gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out'
    });

    // Add uneven float animation delays for each card
    cards.forEach((card, i) => {
        // Use a random or index-based delay for uneven effect
        const delay = (i % 2 === 0)
            ? (Math.random() * 1.5)
            : (0.5 + Math.random() * 1.5);
        card.style.animationDelay = delay.toFixed(2) + 's';
    });
}
// Countdown Timer for October 24, 2024
function initCountdownTimer() {
    const eventDate = new Date('October 24, 2025 9:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = eventDate - now;
        
        // If event date has passed
        if (distance < 0) {
            document.querySelector('.countdown-container').innerHTML = `
                <div class="event-started">
                    <h3>🎉 Event Started!</h3>
                        <p>TANTRA 2025 is now live!</p>
                </div>
            `;
            return;
        }
        
        // Time calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update display
        const daysElement = document.getElementById('days');
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
        
        // Add animation effect when seconds change
        if (secondsElement) {
            secondsElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                secondsElement.style.transform = 'scale(1)';
            }, 300);
        }
    }
    
    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}
// Render department tabs for events page
function renderDepartmentTabs() {
    const filterTabs = document.querySelector('.filter-tabs');
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
        renderDepartmentTabs();
        renderEvents();
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
            renderDepartmentTabs();
            renderEvents();
        });
        filterTabs.appendChild(tab);
    });
    
    // Check for department parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const departmentParam = urlParams.get('department');
    if (departmentParam && departments.find(dept => dept.id === departmentParam)) {
        currentDepartment = departmentParam;
        renderDepartmentTabs();
        renderEvents();
    }
}

// Format date for display
function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

// Initialize the application
async function init() {
    // Start loading data immediately
    await loadData();
    
    // Initialize animations and other functionality
    initTantraAnimation();
    // Initialize gyro-based motion only for mobile/touch devices
    const wantGyro = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (wantGyro) {
        try { initGyroMotion(); } catch (e) { /* ignore */ }
    }
    // Mobile micro-animations
    if (wantGyro) {
        try { initMobileMicroAnimations(); } catch (e) { /* ignore */ }
    }
    initCountdownTimer(); // Add this line
    setupEventListeners();
    setupSmoothScrolling();
    initScrollAnimations();
    setActiveNavigation();
}

// Small mobile-only micro animations
function initMobileMicroAnimations() {
    // CTA pulse
    const ctas = document.querySelectorAll('.cta-button, .btn-primary, .btn-outline');
    ctas.forEach((el, i) => {
        gsap.to(el, { scale: 1.03, duration: 1.6 + (i % 2) * 0.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.6 });
    });

    // dev-card bobbing (if present)
    const devCards = document.querySelectorAll('.dev-card');
    devCards.forEach((card, i) => {
        gsap.to(card, { y: 6, duration: 3 + (i % 2) * 0.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.12 });
        card.addEventListener('click', function(e) {
            // Only flip if not clicking a link or button inside the card
            if (e.target.closest('a,button')) return;
            card.classList.toggle('is-flipped');
        });
    });

    // Tap ripple for mobile
    document.addEventListener('touchstart', function(e){
        const t = e.touches[0];
        if (!t) return;
        const ripple = document.createElement('span');
        ripple.className = 'touch-ripple';
        ripple.style.position = 'fixed';
        ripple.style.left = (t.clientX - 24) + 'px';
        ripple.style.top = (t.clientY - 24) + 'px';
        ripple.style.width = '48px';
        ripple.style.height = '48px';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255,46,146,0.12)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = 2000;
        document.body.appendChild(ripple);
        gsap.to(ripple, { scale: 2.6, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete(){ ripple.remove(); } });
    }, { passive: true });
}

// Gyro-based motion for mobile devices
function initGyroMotion() {
    const bg = document.querySelector('.animated-bg');
    const text = document.querySelector('.tantra-text');
    if (!bg && !text) return;

    // Helper to start listening to deviceorientation
    const start = () => {
        function handleOrientation(e) {
            // alpha: rotation around z-axis (0..360)
            // beta: rotation around x-axis (-180..180) front-to-back
            // gamma: rotation around y-axis (-90..90) left-to-right
            const beta = e.beta || 0; // -180..180
            const gamma = e.gamma || 0; // -90..90

            // Normalize and clamp
            const nx = Math.max(Math.min(gamma / 30, 1), -1); // -1..1
            const ny = Math.max(Math.min(beta / 30, 1), -1);

            // Animate background and text subtlely
            if (bg) gsap.to(bg, { x: nx * -28, y: ny * -16, rotation: nx * 2, duration: 0.45, ease: 'power3.out' });
            if (text) gsap.to(text, { x: nx * 16, y: ny * 10, rotation: nx * 3, duration: 0.45, ease: 'power3.out' });
        }

        window.addEventListener('deviceorientation', handleOrientation, true);
    };

    // iOS requires a user gesture to grant permission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        // create an overlay prompt that asks the user to allow motion (small, unobtrusive)
        const prompt = document.createElement('button');
        prompt.textContent = 'Enable motion';
        prompt.style.position = 'fixed';
        prompt.style.left = '12px';
        prompt.style.bottom = '12px';
        prompt.style.zIndex = 2000;
        prompt.className = 'btn-outline';
        document.body.appendChild(prompt);
        prompt.addEventListener('click', () => {
            DeviceMotionEvent.requestPermission().then(resp => {
                if (resp === 'granted') {
                    start();
                }
                prompt.remove();
            }).catch(() => { prompt.remove(); });
        }, { once: true });
    } else {
        // Non-iOS: start listening immediately
        start();
    }
}

// Set active navigation based on current page
function setActiveNavigation() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (currentPage.includes('events.html') && link.getAttribute('href') === 'events.html') {
            link.classList.add('active');
        } else if (currentPage.endsWith('index.html') || currentPage.endsWith('/') && link.getAttribute('href') === '#home') {
            link.classList.add('active');
        }
    });
    
    // Also update footer links
    const footerLinks = document.querySelectorAll('.footer-link');
    footerLinks.forEach(link => {
        link.classList.remove('active');
        if (currentPage.includes('events.html') && link.getAttribute('href') === 'events.html') {
            link.classList.add('active');
        } else if ((currentPage.endsWith('index.html') || currentPage.endsWith('/')) && link.getAttribute('href') === '#home') {
            link.classList.add('active');
        }
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
    
    // Observe featured cards
    document.querySelectorAll('.featured-card').forEach(card => {
        observer.observe(card);
    });
    
    // Observe department cards
    document.querySelectorAll('.department-card').forEach(card => {
        observer.observe(card);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Event registration buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.register-btn')) {
            const btn = e.target.closest('.register-btn');
            const eventId = btn.dataset.eventId;
            if (typeof openRegistrationModal === 'function') openRegistrationModal(eventId, btn);
        }
    });
    
    // Featured events click
    document.addEventListener('click', (e) => {
        if (e.target.closest('.featured-card')) {
            const featuredCard = e.target.closest('.featured-card');
            // The onclick is already handled in the HTML, but we can add additional logic here
        }
    });

    
    // Navigation toggle
    if (navToggle) {
        navToggle.addEventListener('click', toggleNavigation);
    }
    
    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) {
                navMenu.classList.remove('open');
            }
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
document.addEventListener('DOMContentLoaded', () => {
    init();
    // Footer interactivity
    // Instagram tap
    const insta = document.getElementById('footer-insta');
    if (insta) {
        insta.addEventListener('click', () => {
            window.open('https://www.instagram.com/tantra_.25?igsh=Y2xpczhhempqM3B0', '_blank');
        });
    }
    // Mail tap
    const mail = document.getElementById('footer-mail');
    if (mail) {
        mail.addEventListener('click', () => {
            window.open('mailto:tantratechvjec@gmail.com');
        });
    }
    // Address double-tap
    const address = document.getElementById('footer-address');
    if (address) {
        let lastTap = 0;
        address.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - lastTap < 400) {
                window.open('https://vjec.ac.in/', '_blank');
            }
            lastTap = now;
        });
    }
});