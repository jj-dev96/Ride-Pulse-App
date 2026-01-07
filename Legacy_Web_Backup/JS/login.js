// Login Page JavaScript - Complete Working Version

// Notification function (works standalone)
function showNotification(message, type = 'info') {
    console.log('Notification:', message, type); // Debug log

    // Try to use shared notification if available
    if (window.RidePulse && window.RidePulse.NotificationManager) {
        window.RidePulse.NotificationManager.show(message, type);
        return;
    }

    // Fallback notification
    const existing = document.querySelector('.notification-fallback');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    notification.className = `notification-fallback fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-xl text-white font-medium ${bgColor}`;
    notification.textContent = message;
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'all 0.3s ease';
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Main initialization
document.addEventListener('DOMContentLoaded', function () {
    console.log('Login page loaded'); // Debug log

    // Check if already logged in and redirect
    const isLoggedIn = (window.RidePulse && window.RidePulse.SessionManager && window.RidePulse.SessionManager.isLoggedIn()) ||
        (localStorage.getItem('user') !== null);
    if (isLoggedIn) {
        console.log('User already logged in, redirecting to maps...');
        window.location.href = 'maps.html';
        return;
    }

    // Initialize shared utilities if available
    if (window.RidePulse && window.RidePulse.ThemeManager) {
        window.RidePulse.ThemeManager.init();
    }

    // Get all elements
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const toggleBg = document.getElementById('toggle-bg');
    const authForm = document.getElementById('authForm');
    const submitBtn = document.getElementById('submitBtn');

    if (!loginBtn || !signupBtn || !toggleBg || !authForm || !submitBtn) {
        console.error('Missing required elements:', { loginBtn, signupBtn, toggleBg, authForm, submitBtn });
        return;
    }

    let isLogin = true;

    // Login button click handler
    loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!isLogin) {
            toggleBg.classList.remove('active-signup');
            loginBtn.classList.add('font-semibold', 'text-gray-800', 'dark:text-white');
            loginBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
            signupBtn.classList.remove('font-semibold', 'text-gray-800', 'dark:text-white');
            signupBtn.classList.add('font-medium', 'text-gray-500', 'dark:text-gray-400');
            showLoginForm();
            isLogin = true;
        }
    });

    // Signup button click handler
    signupBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isLogin) {
            toggleBg.classList.add('active-signup');
            signupBtn.classList.add('font-semibold', 'text-gray-800', 'dark:text-white');
            signupBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
            loginBtn.classList.remove('font-semibold', 'text-gray-800', 'dark:text-white');
            loginBtn.classList.add('font-medium', 'text-gray-500', 'dark:text-gray-400');
            showSignupForm();
            isLogin = false;
        }
    });

    function showLoginForm() {
        const nameField = document.getElementById('nameField');
        const emailField = document.getElementById('emailField');
        const confirmPasswordField = document.getElementById('confirmPasswordField');
        const phoneField = document.getElementById('phoneField');
        const socialLoginContainer = document.getElementById('socialLoginContainer');
        const userIdField = document.getElementById('userIdField');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');

        // Hide signup fields
        [nameField, emailField, confirmPasswordField, phoneField, socialLoginContainer].forEach(field => {
            if (field) {
                field.classList.add('hidden-field');
                field.classList.remove('visible-field');
            }
        });

        // Show login fields
        if (userIdField) {
            userIdField.classList.remove('hidden-field');
            userIdField.classList.add('visible-field');
        }
        if (forgotPasswordContainer) {
            forgotPasswordContainer.style.display = 'flex';
        }

        // Update button text
        if (submitBtn) {
            submitBtn.innerHTML = '<span>LOG IN</span><span class="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>';
        }

        clearForm();
    }

    function showSignupForm() {
        const userIdField = document.getElementById('userIdField');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
        const nameField = document.getElementById('nameField');
        const emailField = document.getElementById('emailField');
        const confirmPasswordField = document.getElementById('confirmPasswordField');
        const phoneField = document.getElementById('phoneField');
        const socialLoginContainer = document.getElementById('socialLoginContainer');

        // Hide login fields
        if (userIdField) {
            userIdField.classList.add('hidden-field');
            userIdField.classList.remove('visible-field');
        }
        if (forgotPasswordContainer) {
            forgotPasswordContainer.style.display = 'none';
        }

        // Show signup fields
        [nameField, emailField, confirmPasswordField, phoneField, socialLoginContainer].forEach(field => {
            if (field) {
                field.classList.remove('hidden-field');
                field.classList.add('visible-field');
            }
        });

        // Update button text
        if (submitBtn) {
            submitBtn.innerHTML = '<span>SIGN UP</span><span class="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>';
        }

        clearForm();
    }

    // Password visibility toggle
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const parent = this.closest('.form-input-group');
            if (!parent) {
                console.error('Could not find parent form-input-group');
                return;
            }
            const input = parent.querySelector('input[type="password"], input[type="text"]');
            const icon = this.querySelector('.material-icons-round');

            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = 'visibility';
                } else {
                    input.type = 'password';
                    icon.textContent = 'visibility_off';
                }
            } else {
                console.error('Could not find input or icon', { input, icon });
            }
        });
    });

    // Form submission handler
    authForm.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('Form submitted'); // Debug log

        const nameField = document.getElementById('nameField');
        const isLoginMode = nameField && nameField.classList.contains('hidden-field');

        if (isLoginMode) {
            handleLogin();
        } else {
            handleSignup();
        }
    });

    function handleLogin() {
        const userIdInput = document.getElementById('userId');
        const passwordInput = document.getElementById('password');

        if (!userIdInput || !passwordInput) {
            console.error('Missing input fields');
            showNotification('Form error. Please refresh the page.', 'error');
            return;
        }

        const userId = userIdInput.value.trim();
        const password = passwordInput.value;

        console.log('Login attempt:', { userId, passwordLength: password.length }); // Debug log

        if (!userId || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Show loading state
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner mx-auto"></div>';

        // Simulate API call
        setTimeout(() => {
            try {
                // Check stored users or default credentials
                const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const user = storedUsers.find(u => (u.userId === userId || u.email === userId));

                // Accept any non-empty credentials for testing (fake login)
                let loginSuccess = false;
                let userData = null;

                // Admin login
                if (userId === 'admin' && password === '12345') {
                    loginSuccess = true;
                    userData = {
                        userId: 'admin',
                        name: 'Admin',
                        email: 'admin@ridepulse.com'
                    };
                } else if ((userId === 'test' || userId === 'test@gmail.com') && password === '123456') {
                    // Default test credentials
                    loginSuccess = true;
                    userData = {
                        userId: 'test',
                        name: 'Test User',
                        email: 'test@gmail.com'
                    };
                } else if (user && user.password && atob(user.password) === password) {
                    // Valid registered user
                    loginSuccess = true;
                    userData = {
                        userId: user.userId || user.email,
                        name: user.name,
                        email: user.email
                    };
                } else if (userId && password && password.length >= 1) {
                    // Accept any fake credentials for testing
                    loginSuccess = true;
                    userData = {
                        userId: userId,
                        name: userId.includes('@') ? userId.split('@')[0] : userId,
                        email: userId.includes('@') ? userId : `${userId}@example.com`
                    };
                }

                if (loginSuccess && userData) {
                    // Set session using SessionManager (stores as 'user' in localStorage)
                    if (window.RidePulse && window.RidePulse.SessionManager) {
                        window.RidePulse.SessionManager.setUser(userData);
                    } else {
                        // Fallback: store directly if SessionManager not available
                        localStorage.setItem('user', JSON.stringify(userData));
                    }

                    showNotification('Login successful!', 'success');
                    setTimeout(() => {
                        // Redirect to maps page
                        window.location.href = 'maps.html';
                    }, 1000);
                } else {
                    showNotification('Invalid User ID or password', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalContent;
                }
            } catch (error) {
                console.error('Login error:', error);
                showNotification('An error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }
        }, 1000);
    }

    function handleSignup() {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        if (!nameInput || !emailInput || !phoneInput || !passwordInput || !confirmPasswordInput) {
            console.error('Missing signup input fields');
            showNotification('Form error. Please refresh the page.', 'error');
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        console.log('Signup attempt:', { name, email, phone, passwordLength: password.length }); // Debug log

        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner mx-auto"></div>';

        setTimeout(() => {
            try {
                const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const userExists = existingUsers.some(user => user.email === email);

                if (userExists) {
                    showNotification('An account with this email already exists', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalContent;
                } else {
                    const newUser = {
                        name,
                        email,
                        phone,
                        password: btoa(password),
                        userId: email
                    };
                    existingUsers.push(newUser);
                    localStorage.setItem('users', JSON.stringify(existingUsers));

                    showNotification('Account created successfully!', 'success');
                    setTimeout(() => {
                        loginBtn.click();
                        clearForm();
                    }, 1500);
                }
            } catch (error) {
                console.error('Signup error:', error);
                showNotification('An error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }
        }, 1000);
    }

    function clearForm() {
        if (authForm) {
            authForm.reset();
            document.querySelectorAll('.error-message').forEach(error => {
                error.classList.remove('show');
            });
            document.querySelectorAll('.input-error').forEach(input => {
                input.classList.remove('input-error');
            });
        }
    }

    // Social login handlers
    const googleBtn = document.getElementById('googleLogin');
    const appleBtn = document.getElementById('appleLogin');

    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            showNotification('Google login coming soon!', 'info');
        });
    }

    if (appleBtn) {
        appleBtn.addEventListener('click', () => {
            showNotification('Apple login coming soon!', 'info');
        });
    }

    console.log('Login page initialized successfully'); // Debug log
});
