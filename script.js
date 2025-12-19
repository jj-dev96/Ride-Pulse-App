// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initThemeToggle();
    initFormToggle();
    initPasswordVisibility();
    initFormValidation();
    initSocialLogin();
    initTailwindConfig();
});

// ==================== Theme Toggle ====================
function initThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Check for saved user preference or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
    
    // Toggle theme on button click
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

// ==================== Form Toggle (Login/Signup) ====================
function initFormToggle() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const toggleBg = document.getElementById('toggle-bg');
    const loginForm = document.getElementById('authForm');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    
    let isLogin = true;
    
    // Login button click
    loginBtn.addEventListener('click', () => {
        if (!isLogin) {
            toggleBg.classList.remove('translate-x-full');
            toggleBg.classList.add('translate-x-0');
            
            loginBtn.classList.add('font-semibold', 'text-gray-800', 'dark:text-white');
            loginBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
            signupBtn.classList.remove('font-semibold', 'text-gray-800', 'dark:text-white');
            signupBtn.classList.add('font-medium', 'text-gray-500', 'dark:text-gray-400');
            
            // Show login fields, hide signup fields
            showLoginForm();
            
            isLogin = true;
        }
    });
    
    // Signup button click
    signupBtn.addEventListener('click', () => {
        if (isLogin) {
            toggleBg.classList.remove('translate-x-0');
            toggleBg.classList.add('translate-x-full');
            
            signupBtn.classList.add('font-semibold', 'text-gray-800', 'dark:text-white');
            signupBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
            loginBtn.classList.remove('font-semibold', 'text-gray-800', 'dark:text-white');
            loginBtn.classList.add('font-medium', 'text-gray-500', 'dark:text-gray-400');
            
            // Show signup fields, hide login fields
            showSignupForm();
            
            isLogin = false;
        }
    });
    
    // Toggle form fields visibility
    function showLoginForm() {
        // Hide signup fields
        const nameField = document.getElementById('nameField');
        const emailField = document.getElementById('emailField');
        const confirmPasswordField = document.getElementById('confirmPasswordField');
        const phoneField = document.getElementById('phoneField');
        const socialLoginContainer = document.getElementById('socialLoginContainer');
        const userIdField = document.getElementById('userIdField');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
        
        if (nameField) {
            nameField.classList.add('hidden-field');
            nameField.classList.remove('visible-field');
        }
        if (emailField) {
            emailField.classList.add('hidden-field');
            emailField.classList.remove('visible-field');
        }
        if (confirmPasswordField) {
            confirmPasswordField.classList.add('hidden-field');
            confirmPasswordField.classList.remove('visible-field');
        }
        if (phoneField) {
            phoneField.classList.add('hidden-field');
            phoneField.classList.remove('visible-field');
        }
        if (socialLoginContainer) {
            socialLoginContainer.classList.add('hidden-field');
            socialLoginContainer.classList.remove('visible-field');
        }
        
        // Show login fields
        if (userIdField) {
            userIdField.classList.remove('hidden-field');
            userIdField.classList.add('visible-field');
        }
        if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'flex';
        
        // Update form title
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.innerHTML = '<span>LOG IN</span><span class="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>';
        }
        
        // Clear form
        clearForm();
    }
    
    function showSignupForm() {
        // Hide login fields
        const userIdField = document.getElementById('userIdField');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
        const socialLoginContainer = document.getElementById('socialLoginContainer');
        
        // Show signup fields
        const nameField = document.getElementById('nameField');
        const emailField = document.getElementById('emailField');
        const confirmPasswordField = document.getElementById('confirmPasswordField');
        const phoneField = document.getElementById('phoneField');
        
        if (userIdField) {
            userIdField.classList.add('hidden-field');
            userIdField.classList.remove('visible-field');
        }
        if (forgotPasswordContainer) forgotPasswordContainer.style.display = 'none';
        
        if (nameField) {
            nameField.classList.remove('hidden-field');
            nameField.classList.add('visible-field');
        }
        if (emailField) {
            emailField.classList.remove('hidden-field');
            emailField.classList.add('visible-field');
        }
        if (confirmPasswordField) {
            confirmPasswordField.classList.remove('hidden-field');
            confirmPasswordField.classList.add('visible-field');
        }
        if (phoneField) {
            phoneField.classList.remove('hidden-field');
            phoneField.classList.add('visible-field');
        }
        if (socialLoginContainer) {
            socialLoginContainer.classList.remove('hidden-field');
            socialLoginContainer.classList.add('visible-field');
        }
        
        // Update form title
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.innerHTML = '<span>SIGN UP</span><span class="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>';
        }
        
        // Clear form
        clearForm();
    }
}

// ==================== Password Visibility Toggle ====================
function initPasswordVisibility() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Find the input field in the same parent container
            const parent = this.closest('.relative');
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
            }
        });
    });
}

// ==================== Form Validation ====================
function initFormValidation() {
    const authForm = document.getElementById('authForm');
    
    if (!authForm) return;
    
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameField = document.getElementById('nameField');
        const isLoginMode = nameField?.classList.contains('hidden-field') || !nameField;
        
        if (isLoginMode) {
            handleLogin();
        } else {
            handleSignup();
        }
    });
    
    // Real-time validation
    const userIdInput = document.getElementById('userId');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('name');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const phoneInput = document.getElementById('phone');
    
    if (userIdInput) {
        userIdInput.addEventListener('blur', () => validateUserId(userIdInput));
        userIdInput.addEventListener('input', () => clearError(userIdInput));
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', () => validateEmail(emailInput));
        emailInput.addEventListener('input', () => clearError(emailInput));
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', () => validatePassword(passwordInput));
        passwordInput.addEventListener('input', () => clearError(passwordInput));
    }
    
    if (nameInput) {
        nameInput.addEventListener('blur', () => validateName(nameInput));
        nameInput.addEventListener('input', () => clearError(nameInput));
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', () => validateConfirmPassword(confirmPasswordInput, passwordInput));
        confirmPasswordInput.addEventListener('input', () => clearError(confirmPasswordInput));
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('blur', () => validatePhone(phoneInput));
        phoneInput.addEventListener('input', () => clearError(phoneInput));
    }
}

// Validation functions
function validateUserId(input) {
    const userId = input.value.trim();
    
    if (!userId) {
        showError(input, 'User ID is required');
        return false;
    }
    
    if (userId.length < 3) {
        showError(input, 'User ID must be at least 3 characters');
        return false;
    }
    
    clearError(input);
    return true;
}

function validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        showError(input, 'Email is required');
        return false;
    }
    
    if (!emailRegex.test(email)) {
        showError(input, 'Please enter a valid email address');
        return false;
    }
    
    clearError(input);
    return true;
}

function validatePassword(input) {
    const password = input.value;
    
    if (!password) {
        showError(input, 'Password is required');
        return false;
    }
    
    if (password.length < 6) {
        showError(input, 'Password must be at least 6 characters');
        return false;
    }
    
    clearError(input);
    return true;
}

function validateName(input) {
    const name = input.value.trim();
    
    if (!name) {
        showError(input, 'Name is required');
        return false;
    }
    
    if (name.length < 2) {
        showError(input, 'Name must be at least 2 characters');
        return false;
    }
    
    clearError(input);
    return true;
}

function validateConfirmPassword(input, passwordInput) {
    const confirmPassword = input.value;
    const password = passwordInput.value;
    
    if (!confirmPassword) {
        showError(input, 'Please confirm your password');
        return false;
    }
    
    if (confirmPassword !== password) {
        showError(input, 'Passwords do not match');
        return false;
    }
    
    clearError(input);
    return true;
}

function validatePhone(input) {
    const phone = input.value.trim();
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    
    if (phone && !phoneRegex.test(phone)) {
        showError(input, 'Please enter a valid phone number');
        return false;
    }
    
    clearError(input);
    return true;
}

function showError(input, message) {
    input.classList.add('input-error');
    let errorDiv = input.parentElement.querySelector('.error-message');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        input.parentElement.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearError(input) {
    input.classList.remove('input-error');
    const errorDiv = input.parentElement.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

// ==================== Form Submission Handlers ====================
function handleLogin() {
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate
    if (!validateUserId(document.getElementById('userId')) || !validatePassword(document.getElementById('password'))) {
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>';
    
    // Simulate API call
    setTimeout(() => {
        // Dummy authentication (for project/demo)
        // Check against stored users or default test credentials
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = storedUsers.find(u => u.userId === userId || u.email === userId);
        
        // Default test credentials
        if ((userId === 'test' || userId === 'test@gmail.com') && password === '123456') {
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'map.html';
            }, 1000);
        } else if (user && atob(user.password) === password) {
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'map.html';
            }, 1000);
        } else {
            showNotification('Invalid User ID or password', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    }, 1000);
}

function handleSignup() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate all fields
    if (!validateName(document.getElementById('name')) ||
        !validateEmail(document.getElementById('email')) ||
        !validatePassword(document.getElementById('password')) ||
        !validateConfirmPassword(document.getElementById('confirmPassword'), document.getElementById('password'))) {
        return;
    }
    
    // Phone is required for signup
    if (!phone) {
        showError(document.getElementById('phone'), 'Phone number is required');
        return;
    }
    
    if (!validatePhone(document.getElementById('phone'))) {
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>';
    
    // Simulate API call
    setTimeout(() => {
        // Check if user already exists (dummy check)
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const userExists = existingUsers.some(user => user.email === email);
        
        if (userExists) {
            showNotification('An account with this email already exists', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        } else {
            // Save user (for demo purposes)
            const newUser = {
                name,
                email,
                phone,
                password: btoa(password), // Simple encoding (not secure, just for demo)
                userId: email // Allow login with email as userId
            };
            existingUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(existingUsers));
            
            showNotification('Account created successfully!', 'success');
            setTimeout(() => {
                // Switch to login mode
                document.getElementById('loginBtn').click();
                clearForm();
            }, 1500);
        }
    }, 1000);
}

// ==================== Social Login ====================
function initSocialLogin() {
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
}

// ==================== Utility Functions ====================
function clearForm() {
    const form = document.getElementById('authForm');
    if (form) {
        form.reset();
        // Clear all errors
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.classList.remove('show'));
        const errorInputs = form.querySelectorAll('.input-error');
        errorInputs.forEach(input => input.classList.remove('input-error'));
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white font-medium animate-fade-in`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== Tailwind Config ====================
function initTailwindConfig() {
    if (typeof tailwind !== 'undefined') {
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: '#FFD700',
                        'primary-hover': '#E6C200',
                        'background-light': '#F3F4F6',
                        'background-dark': '#111827',
                        'surface-light': '#FFFFFF',
                        'surface-dark': '#1F2937',
                        'accent-red': '#FF0000',
                    },
                    fontFamily: {
                        display: ["'Oswald'", 'sans-serif'],
                        body: ["'Inter'", 'sans-serif'],
                    },
                    borderRadius: {
                        DEFAULT: '0.75rem',
                        xl: '1rem',
                    },
                    backgroundImage: {
                        'hero-pattern': "url('https://images.unsplash.com/photo-1558981806-ec527fa84c3d?q=80&w=2070&auto=format&fit=crop')",
                    }
                },
            },
        };
    }
}

