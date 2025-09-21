/**
 * User Registration with Firebase Authentication and Firestore
 * Implements phone number authentication with OTP verification
 */

// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    RecaptchaVerifier, 
    signInWithPhoneNumber,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
// Note: Replace these with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};

// Initialize Firebase
let app, auth, db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

class UserRegistration {
    constructor() {
        this.confirmationResult = null;
        this.recaptchaVerifier = null;
        this.formData = {};
        this.resendTimer = null;
        this.resendCountdown = 60;
        this.init();
    }

    /**
     * Initialize the registration system
     */
    init() {
        // Check if Firebase is initialized
        if (!auth || !db) {
            console.error('Firebase not initialized properly');
            this.showNotification('Firebase initialization failed. Please refresh the page.', 'error');
            return;
        }

        this.setupForm();
        this.setupOTPModal();
        this.setupRecaptcha();
        this.loadTransitionSystem();
    }

    /**
     * Setup main registration form
     */
    setupForm() {
        const form = document.getElementById('donor-registration-form') || document.querySelector('form');
        if (!form) {
            console.error('Registration form not found');
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    /**
     * Setup OTP modal functionality
     */
    setupOTPModal() {
        const verifyBtn = document.getElementById('verify-otp-btn');
        const cancelBtn = document.getElementById('cancel-otp-btn');
        const resendBtn = document.getElementById('resend-otp-btn');
        const otpInput = document.getElementById('otp-input');

        if (!verifyBtn || !cancelBtn || !resendBtn || !otpInput) {
            console.error('OTP modal elements not found');
            return;
        }

        verifyBtn.addEventListener('click', () => {
            this.verifyOTP();
        });

        cancelBtn.addEventListener('click', () => {
            this.closeOTPModal();
        });

        resendBtn.addEventListener('click', () => {
            this.resendOTP();
        });

        // Auto-submit OTP when 6 digits are entered
        otpInput.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value;
            
            if (value.length === 6) {
                this.verifyOTP();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeOTPModal();
            }
        });
    }

    /**
     * Setup reCAPTCHA for phone authentication
     */
    setupRecaptcha() {
        try {
            // Check if recaptcha container exists
            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (!recaptchaContainer) {
                console.error('reCAPTCHA container not found');
                return;
            }

            this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: (response) => {
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired');
                    this.showNotification('reCAPTCHA expired. Please try again.', 'error');
                }
            });
        } catch (error) {
            console.error('Error setting up reCAPTCHA:', error);
            this.showNotification('Failed to initialize reCAPTCHA. Please refresh the page.', 'error');
        }
    }

    /**
     * Handle registration form submission
     */
    async handleRegistration() {
        try {
            // Validate form
            if (!this.validateForm()) {
                this.showNotification('Please fill in all required fields correctly.', 'error');
                return;
            }

            // Store form data
            this.formData = this.getFormData();

            // Show loading state
            this.showLoadingState();

            // Format phone number for Firebase
            const phoneNumber = this.formatPhoneNumber(this.formData.phoneNumber);

            // Send OTP
            await this.sendOTP(phoneNumber);

        } catch (error) {
            console.error('Registration error:', error);
            this.handleAuthError(error);
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Send OTP to phone number
     */
    async sendOTP(phoneNumber) {
        try {
            if (!this.recaptchaVerifier) {
                throw new Error('reCAPTCHA not initialized');
            }

            this.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, this.recaptchaVerifier);
            
            this.showOTPModal(phoneNumber);
            this.showNotification('Verification code sent to your phone!', 'success');
            this.startResendTimer();

        } catch (error) {
            console.error('Error sending OTP:', error);
            this.handleAuthError(error);
        }
    }

    /**
     * Verify OTP code
     */
    async verifyOTP() {
        const otpInput = document.getElementById('otp-input');
        const otpCode = otpInput.value.trim();

        if (!otpCode || otpCode.length !== 6) {
            this.showNotification('Please enter a valid 6-digit code.', 'error');
            return;
        }

        try {
            this.showVerifyLoadingState();

            // Verify the OTP
            const result = await this.confirmationResult.confirm(otpCode);
            const user = result.user;

            // Update user profile
            await updateProfile(user, {
                displayName: `${this.formData.firstName} ${this.formData.lastName}`
            });

            // Save user data to Firestore
            await this.saveUserToFirestore(user.uid);

            this.showNotification('Registration successful! Redirecting...', 'success');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('OTP verification error:', error);
            this.handleAuthError(error);
        } finally {
            this.hideVerifyLoadingState();
        }
    }

    /**
     * Save user data to Firestore
     */
    async saveUserToFirestore(userId) {
        try {
            const userData = {
                firstName: this.formData.firstName,
                lastName: this.formData.lastName,
                phone: this.formatPhoneNumber(this.formData.phoneNumber),
                dob: this.formData.dob,
                gender: this.formData.gender,
                bloodGroup: this.formData.bloodGroup,
                role: 'user',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true,
                emailVerified: false,
                phoneVerified: true
            };

            await setDoc(doc(db, 'users', userId), userData);
            console.log('User data saved to Firestore');

        } catch (error) {
            console.error('Error saving user data:', error);
            throw new Error('Failed to save user data. Please try again.');
        }
    }

    /**
     * Resend OTP
     */
    async resendOTP() {
        try {
            const phoneNumber = this.formatPhoneNumber(this.formData.phoneNumber);
            
            // Reset reCAPTCHA
            this.recaptchaVerifier.clear();
            this.setupRecaptcha();
            
            await this.sendOTP(phoneNumber);
            this.startResendTimer();

        } catch (error) {
            console.error('Error resending OTP:', error);
            this.handleAuthError(error);
        }
    }

    /**
     * Validate form data
     */
    validateForm() {
        const form = document.querySelector('form');
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required.';
        }

        // Specific field validations
        if (isValid && value) {
            switch (field.name) {
                case 'first-name':
                case 'last-name':
                    if (!/^[a-zA-Z\s]+$/.test(value) || value.length < 2) {
                        isValid = false;
                        errorMessage = 'Name must contain only letters and be at least 2 characters.';
                    }
                    break;

                case 'phone-number':
                case 'bb-phone-number':
                    if (!this.isValidPhoneNumber(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number with country code (e.g., +1 555-123-4567).';
                    }
                    break;

                case 'bb-email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address.';
                    }
                    break;

                case 'dob':
                    const age = this.calculateAge(value);
                    if (age < 16 || age > 80) {
                        isValid = false;
                        errorMessage = 'Age must be between 16 and 80 years.';
                    }
                    break;
            }
        }

        // Apply validation result
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.showFieldSuccess(field);
        }

        return isValid;
    }

    /**
     * Get form data
     */
    getFormData() {
        const form = document.querySelector('form');
        const formData = new FormData(form);
        
        return {
            firstName: formData.get('first-name')?.trim(),
            lastName: formData.get('last-name')?.trim(),
            phoneNumber: formData.get('phone-number')?.trim(),
            dob: formData.get('dob'),
            gender: formData.get('gender'),
            bloodGroup: formData.get('blood-group')
        };
    }

    /**
     * Show OTP modal
     */
    showOTPModal(phoneNumber) {
        const modal = document.getElementById('otp-modal');
        const phoneDisplay = document.getElementById('phone-display');
        
        if (!modal || !phoneDisplay) {
            console.error('OTP modal elements not found');
            return;
        }
        
        phoneDisplay.textContent = phoneNumber;
        modal.classList.remove('hidden');
        
        // Focus on OTP input
        setTimeout(() => {
            const otpInput = document.getElementById('otp-input');
            if (otpInput) {
                otpInput.focus();
            }
        }, 300);
    }

    /**
     * Close OTP modal
     */
    closeOTPModal() {
        const modal = document.getElementById('otp-modal');
        if (!modal) {
            console.error('OTP modal not found');
            return;
        }
        
        modal.classList.add('hidden');
        
        // Clear OTP input
        const otpInput = document.getElementById('otp-input');
        if (otpInput) {
            otpInput.value = '';
        }
        
        // Stop resend timer
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
        }
    }

    /**
     * Start resend timer
     */
    startResendTimer() {
        const resendBtn = document.getElementById('resend-otp-btn');
        const timerSpan = document.getElementById('resend-timer');
        
        if (!resendBtn || !timerSpan) {
            console.error('Resend timer elements not found');
            return;
        }
        
        this.resendCountdown = 60;
        resendBtn.disabled = true;
        
        this.resendTimer = setInterval(() => {
            this.resendCountdown--;
            timerSpan.textContent = this.resendCountdown;
            
            if (this.resendCountdown <= 0) {
                clearInterval(this.resendTimer);
                resendBtn.disabled = false;
                resendBtn.innerHTML = 'Resend code';
            }
        }, 1000);
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const btn = document.querySelector('button[type="submit"]');
        const btnText = document.getElementById('register-btn-text');
        const loading = document.getElementById('register-loading');
        
        if (!btn || !btnText || !loading) {
            console.error('Loading state elements not found');
            return;
        }
        
        btn.disabled = true;
        btnText.classList.add('hidden');
        loading.classList.remove('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const btn = document.querySelector('button[type="submit"]');
        const btnText = document.getElementById('register-btn-text');
        const loading = document.getElementById('register-loading');
        
        if (!btn || !btnText || !loading) {
            console.error('Loading state elements not found');
            return;
        }
        
        btn.disabled = false;
        btnText.classList.remove('hidden');
        loading.classList.add('hidden');
    }

    /**
     * Show verify loading state
     */
    showVerifyLoadingState() {
        const btn = document.getElementById('verify-otp-btn');
        const btnText = document.getElementById('verify-btn-text');
        const loading = document.getElementById('verify-loading');
        
        if (!btn || !btnText || !loading) {
            console.error('Verify loading state elements not found');
            return;
        }
        
        btn.disabled = true;
        btnText.classList.add('hidden');
        loading.classList.remove('hidden');
    }

    /**
     * Hide verify loading state
     */
    hideVerifyLoadingState() {
        const btn = document.getElementById('verify-otp-btn');
        const btnText = document.getElementById('verify-btn-text');
        const loading = document.getElementById('verify-loading');
        
        if (!btn || !btnText || !loading) {
            console.error('Verify loading state elements not found');
            return;
        }
        
        btn.disabled = false;
        btnText.classList.remove('hidden');
        loading.classList.add('hidden');
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-border-light', 'dark:border-border-dark', 'focus:border-primary', 'focus:ring-primary');

        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-sm text-red-600 dark:text-red-400 mt-1';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Show field success
     */
    showFieldSuccess(field) {
        field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500');
        
        // Remove error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-green-500', 'focus:border-green-500', 'focus:ring-green-500');
        field.classList.add('border-border-light', 'dark:border-border-dark', 'focus:border-primary', 'focus:ring-primary');
        
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Utility functions
     */
    formatPhoneNumber(phone) {
        // Remove all non-digits
        let cleaned = phone.replace(/\D/g, '');
        
        // Add country code if not present
        if (cleaned.length === 10) {
            cleaned = '1' + cleaned;
        }
        
        // Format as +1XXXXXXXXXX
        return '+' + cleaned;
    }

    isValidPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(error) {
        console.error('Auth error:', error);
        
        let message = 'An error occurred. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-phone-number':
                message = 'Invalid phone number format. Please include country code.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later.';
                break;
            case 'auth/invalid-verification-code':
                message = 'Invalid verification code. Please check and try again.';
                break;
            case 'auth/code-expired':
                message = 'Verification code has expired. Please request a new one.';
                break;
            case 'auth/missing-verification-code':
                message = 'Please enter the verification code.';
                break;
            case 'auth/quota-exceeded':
                message = 'SMS quota exceeded. Please try again later.';
                break;
            case 'auth/captcha-check-failed':
                message = 'reCAPTCHA verification failed. Please try again.';
                break;
            default:
                message = error.message || 'Authentication failed. Please try again.';
        }
        
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
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
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 5 seconds
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

// Initialize registration system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add reCAPTCHA container to the page
    if (!document.getElementById('recaptcha-container')) {
        const recaptchaDiv = document.createElement('div');
        recaptchaDiv.id = 'recaptcha-container';
        recaptchaDiv.style.display = 'none';
        document.body.appendChild(recaptchaDiv);
    }

    window.userRegistration = new UserRegistration();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.userRegistration) {
        // Reset any timers when page becomes visible
        console.log('Page became visible');
    }
});

// Export for use in other modules
export { UserRegistration };