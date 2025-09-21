/**
 * Login System with Firebase Authentication
 * Handles both email/password and phone number authentication
 */

import authService from './auth-service.js';
import { 
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

class LoginManager {
    constructor() {
        this.recaptchaVerifier = null;
        this.confirmationResult = null;
        this.init();
    }

    /**
     * Initialize login manager
     */
    init() {
        this.setupForm();
        this.setupRecaptcha();
        this.loadTransitionSystem();
    }

    /**
     * Setup login form
     */
    setupForm() {
        const form = document.querySelector('form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    /**
     * Setup reCAPTCHA
     */
    setupRecaptcha() {
        try {
            if (!document.getElementById('login-recaptcha-container')) {
                const recaptchaDiv = document.createElement('div');
                recaptchaDiv.id = 'login-recaptcha-container';
                recaptchaDiv.style.display = 'none';
                document.body.appendChild(recaptchaDiv);
            }

            this.recaptchaVerifier = new RecaptchaVerifier(authService.auth, 'login-recaptcha-container', {
                size: 'invisible',
                callback: (response) => {
                    console.log('Login reCAPTCHA solved');
                }
            });
        } catch (error) {
            console.error('Error setting up login reCAPTCHA:', error);
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!this.validateLoginForm(email, password)) {
            return;
        }

        try {
            this.showLoadingState();

            // Determine if input is email or phone number
            if (this.isPhoneNumber(email)) {
                await this.loginWithPhone(email);
            } else {
                await this.loginWithEmail(email, password);
            }

        } catch (error) {
            console.error('Login error:', error);
            this.handleLoginError(error);
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Login with email and password
     */
    async loginWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(authService.auth, email, password);
            const user = userCredential.user;

            this.showNotification('Login successful! Redirecting...', 'success');
            
            // AuthService will handle redirection based on user role
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Login with phone number (for demo purposes)
     */
    async loginWithPhone(phoneNumber) {
        try {
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            // For demo purposes, we'll show a message about phone login
            this.showNotification('Phone number login would require OTP verification. Using demo login instead.', 'info');
            
            // Simulate successful login for demo
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate login form
     */
    validateLoginForm(email, password) {
        let isValid = true;

        if (!email) {
            this.showFieldError(document.getElementById('email'), 'Email or phone number is required.');
            isValid = false;
        } else if (!this.isValidEmailOrPhone(email)) {
            this.showFieldError(document.getElementById('email'), 'Please enter a valid email address or phone number.');
            isValid = false;
        } else {
            this.clearFieldError(document.getElementById('email'));
        }

        if (!password) {
            this.showFieldError(document.getElementById('password'), 'Password is required.');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError(document.getElementById('password'), 'Password must be at least 6 characters.');
            isValid = false;
        } else {
            this.clearFieldError(document.getElementById('password'));
        }

        return isValid;
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        
        switch (field.id) {
            case 'email':
                if (value && !this.isValidEmailOrPhone(value)) {
                    this.showFieldError(field, 'Please enter a valid email address or phone number.');
                    return false;
                }
                break;
            case 'password':
                if (value && value.length < 6) {
                    this.showFieldError(field, 'Password must be at least 6 characters.');
                    return false;
                }
                break;
        }

        this.clearFieldError(field);
        return true;
    }

    /**
     * Utility functions
     */
    isValidEmailOrPhone(input) {
        return this.isValidEmail(input) || this.isPhoneNumber(input);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isPhoneNumber(input) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(input.replace(/[\s\-\(\)]/g, ''));
    }

    formatPhoneNumber(phone) {
        let cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            cleaned = '1' + cleaned;
        }
        
        return '+' + cleaned;
    }

    /**
     * UI State Management
     */
    showLoadingState() {
        const btn = document.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
        `;
    }

    hideLoadingState() {
        const btn = document.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = 'Login';
    }

    showFieldError(field, message) {
        field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-gray-300', 'focus:border-primary', 'focus:ring-primary');

        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-sm text-red-600 dark:text-red-400 mt-1';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.add('border-gray-300', 'focus:border-primary', 'focus:ring-primary');
        
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Handle login errors
     */
    handleLoginError(error) {
        let message = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                message = 'This account has been disabled. Please contact support.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your connection and try again.';
                break;
            default:
                message = error.message || 'Login failed. Please try again.';
        }
        
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification-toast');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification-toast fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
        
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        }[type] || 'bg-blue-500';
        
        notification.classList.add(bgColor);
        notification.innerHTML = `
            <div class="flex items-center text-white">
                <span class="material-symbols-outlined mr-2">
                    ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}
                </span>
                <span class="text-sm">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Load transition system
     */
    loadTransitionSystem() {
        if (!document.querySelector('script[src="transitions.js"]')) {
            const script = document.createElement('script');
            script.src = 'transitions.js';
            document.head.appendChild(script);
        }
    }
}

// Initialize login manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.loginManager = new LoginManager();
});

// Export for use in other modules
export { LoginManager };