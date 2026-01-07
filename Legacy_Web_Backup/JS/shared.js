// ============================================
// RidePulse - Shared JavaScript Utilities
// ============================================

// Navigation Configuration (relative paths from HTML folder)
const NAVIGATION = {
    login: 'loginPage.html',
    dashboard: 'dashbroard.html',
    maps: 'maps.html',
    stats: 'stats.html',
    premium: 'dashbroard.html',
    settings: 'settings.html',
    createJoin: 'createJoin.html',
    rideProgress: 'rideProgress.html'
};

// Theme Management
const ThemeManager = {
    init() {
        const toggleButton = document.getElementById('theme-toggle');
        const htmlElement = document.documentElement;

        // Check for saved preference or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }

        // Setup toggle button if exists
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                if (htmlElement.classList.contains('dark')) {
                    htmlElement.classList.remove('dark');
                    localStorage.theme = 'light';
                } else {
                    htmlElement.classList.add('dark');
                    localStorage.theme = 'dark';
                }
            });
        }
    }
};

// Navigation Manager
const NavigationManager = {
    init() {
        // Setup navigation links
        document.querySelectorAll('[data-nav]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-nav');
                if (NAVIGATION[page]) {
                    window.location.href = NAVIGATION[page];
                }
            });
        });

        // Setup bottom navigation
        this.setupBottomNav();
    },

    setupBottomNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'loginPage.html';

        // Highlight active nav item
        document.querySelectorAll('[data-nav]').forEach(link => {
            const navPage = link.getAttribute('data-nav');
            if (NAVIGATION[navPage] === currentPage ||
                (navPage === 'maps' && currentPage === 'maps.html') ||
                (navPage === 'stats' && currentPage === 'stats.html') ||
                (navPage === 'settings' && currentPage === 'settings.html') ||
                (navPage === 'premium' && currentPage === 'dashbroard.html')) {
                link.classList.add('nav-active');
            }
        });
    },

    navigateTo(page) {
        if (NAVIGATION[page]) {
            window.location.href = NAVIGATION[page];
        }
    }
};

// Notification System
const NotificationManager = {
    show(message, type = 'info', duration = 3000) {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type} animate-fade-in`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    info(message) {
        this.show(message, 'info');
    }
};

// Form Validation Utilities
const FormValidator = {
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    validatePhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone);
    },

    validatePassword(password) {
        return password.length >= 6;
    },

    showError(input, message) {
        input.classList.add('input-error');
        let errorDiv = input.parentElement.querySelector('.error-message');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            input.parentElement.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    },

    clearError(input) {
        input.classList.remove('input-error');
        const errorDiv = input.parentElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }
};

// User Session Management
const SessionManager = {
    setUser(userData) {
        localStorage.setItem('user', JSON.stringify(userData));
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isLoggedIn() {
        return this.getUser() !== null;
    },

    logout() {
        localStorage.removeItem('user');
        NavigationManager.navigateTo('login');
    }
};

// Animation Utilities
const AnimationUtils = {
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        setTimeout(() => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '1';
        }, 10);
    },

    fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    },

    slideDown(element, duration = 300) {
        element.style.maxHeight = '0';
        element.style.overflow = 'hidden';
        element.style.transition = `max-height ${duration}ms ease`;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.maxHeight = element.scrollHeight + 'px';
        }, 10);
    },

    slideUp(element, duration = 300) {
        element.style.transition = `max-height ${duration}ms ease`;
        element.style.maxHeight = '0';
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function () {
    ThemeManager.init();
    NavigationManager.init();

    // Check authentication for protected pages
    const protectedPages = ['dashboard', 'maps', 'stats', 'settings', 'premium', 'createJoin', 'rideProgress'];
    const currentPage = window.location.pathname.split('/').pop() || '';

    if (protectedPages.some(page => currentPage.includes(NAVIGATION[page]))) {
        if (!SessionManager.isLoggedIn() && !currentPage.includes('login')) {
            NavigationManager.navigateTo('login');
        }
    }
});

// Export for use in other scripts
window.RidePulse = {
    ThemeManager,
    NavigationManager,
    NotificationManager,
    FormValidator,
    SessionManager,
    AnimationUtils,
    NAVIGATION
};


// SOS System Logic
let sosTimer = null;
let countdownInterval = null;
let countdownValue = 10;

function toggleSOS() {
    const body = document.body;

    // If SOS is already active or counting down, we cancel it
    if (body.classList.contains('sos-active') || document.querySelector('.sos-countdown-overlay')) {
        cancelSOS();
        return;
    }

    // Otherwise, start the countdown
    startSOSCountdown();
}

function startSOSCountdown() {
    countdownValue = 10;
    const body = document.body;

    // Create Countdown Overlay
    let overlay = document.createElement('div');
    overlay.className = 'sos-countdown-overlay';
    overlay.innerHTML = `
        <div class="sos-countdown-container">
            <div class="sos-warning-icon">
                <span class="material-icons-round">warning</span>
            </div>
            <h2>EMERGENCY ALERT</h2>
            <p>Sending beacon to emergency contacts in</p>
            <div class="countdown-number">${countdownValue}</div>
            <button onclick="cancelSOS()" class="cancel-sos-btn">CANCEL</button>
        </div>
    `;
    body.appendChild(overlay);

    // Start Timer
    countdownInterval = setInterval(() => {
        countdownValue--;
        const numDisplay = overlay.querySelector('.countdown-number');
        if (numDisplay) numDisplay.textContent = countdownValue;

        if (countdownValue <= 0) {
            activateSOS();
        }
    }, 1000);
}

function activateSOS() {
    // Clear countdown
    clearInterval(countdownInterval);
    const countdownOverlay = document.querySelector('.sos-countdown-overlay');
    if (countdownOverlay) countdownOverlay.remove();

    const body = document.body;
    body.classList.add('sos-active');

    // Create Flash Overlay
    let overlay = document.createElement('div');
    overlay.className = 'sos-active-overlay';
    overlay.innerHTML = `
        <div class="sos-content">
            <h1>SOS ACTIVE</h1>
            <p>LOCATION BROADCASTING...</p>
            <div class="pulse-ring"></div>
            <button onclick="cancelSOS()" class="stop-sos-btn">STOP SIGNAL</button>
        </div>
    `;
    body.appendChild(overlay);

    if (window.RidePulse && window.RidePulse.NotificationManager) {
        window.RidePulse.NotificationManager.error('SOS BEACON SENT', 0);
    }
}

function cancelSOS() {
    clearInterval(countdownInterval);
    clearTimeout(sosTimer);

    const body = document.body;
    body.classList.remove('sos-active');

    const countdownOverlay = document.querySelector('.sos-countdown-overlay');
    if (countdownOverlay) countdownOverlay.remove();

    const activeOverlay = document.querySelector('.sos-active-overlay');
    if (activeOverlay) activeOverlay.remove();

    if (window.RidePulse && window.RidePulse.NotificationManager) {
        window.RidePulse.NotificationManager.info('SOS Cancelled');
    }
}

// SOS System
function toggleSOS() {
    let overlay = document.getElementById('sosOverlay');
    if (!overlay) {
        // Inject Overlay if missing
        overlay = document.createElement('div');
        overlay.id = 'sosOverlay';
        overlay.className = 'fixed inset-0 z-[2000] bg-red-600/90 backdrop-blur-xl hidden flex-col items-center justify-center text-center';
        overlay.innerHTML = `
            <div class="animate-pulse flex flex-col items-center">
                <span class="material-icons-round text-white text-9xl mb-4">warning</span>
                <h1 class="text-6xl font-black text-white mb-4 tracking-tighter">SOS ALERT</h1>
                <p class="text-2xl text-white font-bold mb-8">TRANSMITTING LOCATION TO SQUAD...</p>
                <div class="text-8xl font-black text-white mb-8" id="sosCountdown">10</div>
                <button onclick="cancelSOS()" class="px-12 py-6 bg-white text-red-600 font-bold rounded-full text-2xl shadow-xl hover:scale-105 transition-transform">CANCEL ALERT</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    if (overlay.classList.contains('hidden')) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        startSOSCountdown();
    } else {
        cancelSOS();
    }
}

let sosInterval;
function startSOSCountdown() {
    let count = 10;
    const el = document.getElementById('sosCountdown');
    if (el) el.innerText = count;

    clearInterval(sosInterval);
    sosInterval = setInterval(() => {
        count--;
        if (el) el.innerText = count;
        if (count <= 0) {
            clearInterval(sosInterval);
            if (window.RidePulse) window.RidePulse.NotificationManager.error("SOS SENT! SQUAD NOTIFIED.");
            document.getElementById('sosOverlay').innerHTML = `
                <div class="flex flex-col items-center animate-fade-in">
                    <span class="material-icons-round text-white text-9xl mb-4">check_circle</span>
                    <h1 class="text-5xl font-black text-white mb-4">ALERT SENT</h1>
                     <button onclick="cancelSOS()" class="mt-8 px-8 py-4 bg-white/20 text-white border-2 border-white font-bold rounded-full text-xl hover:bg-white hover:text-red-600 transition-colors">DISMISS</button>
                </div>
             `;
        }
    }, 1000);
}

function cancelSOS() {
    const overlay = document.getElementById('sosOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        overlay.remove(); // Clean up to reset state next time
    }
    clearInterval(sosInterval);
}

// Pulse AI System (Enhanced)
window.togglePulseAI = function () {
    let overlay = document.getElementById('pulseAIOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pulseAIOverlay';
        overlay.className = 'fixed inset-0 z-[1500] bg-black/80 backdrop-blur-xl hidden flex-col items-center justify-center';
        overlay.innerHTML = `
            <div class="absolute top-4 right-4">
                <button onclick="togglePulseAI()" class="text-gray-500 hover:text-white"><span class="material-icons-round text-4xl">close</span></button>
            </div>
            <div class="relative w-64 h-64 flex items-center justify-center mb-12">
                <!-- AI Orb Visualizer -->
                <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div class="absolute inset-4 bg-primary/40 rounded-full animate-pulse"></div>
                <div class="relative w-48 h-48 bg-black rounded-full border-4 border-primary shadow-[0_0_50px_rgba(255,215,0,0.5)] flex items-center justify-center overflow-hidden">
                    <img src="../Images/RidePulse-Logo.jpg" class="w-full h-full object-cover opacity-60 mix-blend-overlay">
                    <div class="absolute inset-0 flex items-center justify-center gap-1">
                        <div class="w-2 h-8 bg-primary rounded-full animate-wave"></div>
                        <div class="w-2 h-12 bg-primary rounded-full animate-wave delay-75"></div>
                        <div class="w-2 h-6 bg-primary rounded-full animate-wave delay-150"></div>
                        <div class="w-2 h-10 bg-primary rounded-full animate-wave delay-100"></div>
                        <div class="w-2 h-8 bg-primary rounded-full animate-wave delay-200"></div>
                    </div>
                </div>
            </div>
            <div class="text-center space-y-4 max-w-lg px-6">
                <h2 class="text-2xl font-display font-medium text-primary tracking-widest uppercase mb-2">Pulse AI Active</h2>
                <div id="aiTranscript" class="h-24 flex items-center justify-center text-xl sm:text-3xl font-light text-white italic transition-all">
                    "Listening..."
                </div>
                <div class="flex gap-4 justify-center mt-8">
                    <button class="px-6 py-2 rounded-full border border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm" onclick="simulateAIResponse('Route Status')">Route Status</button>
                    <button class="px-6 py-2 rounded-full border border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm" onclick="simulateAIResponse('Bike Health')">Bike Health</button>
                    <button class="px-6 py-2 rounded-full border border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm" onclick="simulateAIResponse('Find Squad')">Find Squad</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Add Wave Animation Style
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes wave {
                0%, 100% { height: 10px; opacity: 0.5; }
                50% { height: 30px; opacity: 1; }
            }
            .animate-wave { animation: wave 1s ease-in-out infinite; }
        `;
        document.head.appendChild(style);
    }

    if (overlay.classList.contains('hidden')) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        simulateAIResponse("Listening...");
    } else {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

window.simulateAIResponse = function (query) {
    const transcript = document.getElementById('aiTranscript');
    if (!transcript) return;

    transcript.style.opacity = '0';
    setTimeout(() => {
        transcript.innerText = `"${query}"`;
        transcript.style.opacity = '1';

        if (query !== "Listening...") {
            setTimeout(() => {
                transcript.style.opacity = '0';
                setTimeout(() => {
                    let response = "I didn't catch that.";
                    if (query === 'Route Status') response = "Traffic clear. ETA 12:45.";
                    if (query === 'Bike Health') response = "Tire pressure optimal. Fuel 45%.";
                    if (query === 'Find Squad') response = "Sarah is 2 miles ahead.";

                    transcript.innerText = response;
                    transcript.style.opacity = '1';

                    // Voice Synthesis (Mock)
                    if ('speechSynthesis' in window) {
                        const msg = new SpeechSynthesisUtterance(response);
                        window.speechSynthesis.speak(msg);
                    }
                }, 300);
            }, 1000);
        }
    }, 300);
}
