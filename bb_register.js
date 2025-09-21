/**
 * Blood Bank Registration with Firebase Authentication and Firestore
 * Implements phone number authentication with OTP verification for healthcare providers
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
    serverTimestamp,
    query,
    collection,
    where,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvOxQ8xK9YrL3mN2pR5sT7uV9wX1yZ2aB",
    authDomain: "liquidlove-demo.firebaseapp.com",
    projectId: "liquidlove-demo",
    storageBucket: "liquidlove-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789",
    measurementId: "G-ABCDEF1234"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

class BloodBankRegistration {
    constructor() {
        this.confirmationResult = null;
        this.recaptchaVerifier = null;
        this.formData = {};
        this.resendTimer = null;
        this.resendCountdown = 60;
        this.init();
    }

    /**
     * Initialize the blood bank registration system
     */
    init() {
        this.setupForm();
        this.setupOTPModal();
        this.setupRecaptcha();
        this.loadTransitionSystem();
    }

    /**
     * Setup blood bank registration form
     */
    setupForm() {
        const form = document.getElementById('bb-register-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
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

        // Check license number uniqueness
        const licenseInput = document.getElementById('license-number');
        if (licenseInput) {
            let licenseTimeout;
            licenseInput.addEventListener('input', () => {
                clearTimeout(licenseTimeout);
                licenseTimeout = setTimeout(() => {
                    this.checkLicenseUniqueness(licenseInput.value);
                }, 500);
            });
        }
    }

    /**
     * Setup OTP modal functionality
     */
    setupOTPModal() {
        const verifyBtn = document.getElementById('bb-verify-otp-btn');
        const cancelBtn = document.getElementById('bb-cancel-otp-btn');
        const resendBtn = document.getElementById('bb-resend-otp-btn');
        const otpInput = document.getElementById('bb-otp-input');

        verifyBtn?.addEventListener('click', () => {
            this.verifyOTP();
        });

        cancelBtn?.addEventListener('click', () => {
            this.closeOTPModal();
        });

        resendBtn?.addEventListener('click', () => {
            this.resendOTP();
        });

        // Auto-submit OTP when 6 digits are entered
        otpInput?.addEventListener('input', (e) => {
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
            this.recaptchaVerifier = new RecaptchaVerifier(auth, 'bb-recaptcha-container', {
                size: 'invisible',
                callback: (response) => {
                    console.log('reCAPTCHA solved for blood bank registration');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired');
                    this.showNotification('reCAPTCHA expired. Please try again.', 'error');
                }
            });
        } catch (error) {
            console.error('Error setting up reCAPTCHA:', error);
        }
    }

    /**
     * Handle blood bank registration form submission
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

            // Check for duplicate license number
            const isDuplicate = await this.checkLicenseUniqueness(this.formData.licenseNumber);
            if (isDuplicate) {
                this.showNotification('This license number is already registered.', 'error');
                return;
            }

            // Show loading state
            this.showLoadingState();

            // Format phone number for Firebase
            const phoneNumber = this.formatPhoneNumber(this.formData.phoneNumber);

            // Send OTP
            await this.sendOTP(phoneNumber);

        } catch (error) {
            console.error('Blood bank registration error:', error);
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
        const otpInput = document.getElementById('bb-otp-input');
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
                displayName: this.formData.hospitalName
            });

            // Save blood bank data to Firestore
            await this.saveBloodBankToFirestore(user.uid);

            this.showNotification('Blood bank registration successful! Redirecting...', 'success');
            
            // Redirect to blood bank dashboard
            setTimeout(() => {
                window.location.href = 'bb_dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('OTP verification error:', error);
            this.handleAuthError(error);
        } finally {
            this.hideVerifyLoadingState();
        }
    }

    /**
     * Save blood bank data to Firestore
     */
    async saveBloodBankToFirestore(userId) {
        try {
            const bloodBankData = {
                hospitalName: this.formData.hospitalName,
                licenseNumber: this.formData.licenseNumber,
                phone: this.formatPhoneNumber(this.formData.phoneNumber),
                email: this.formData.email,
                address: this.formData.address,
                facilityType: this.formData.facilityType,
                dailyCapacity: this.formData.dailyCapacity,
                role: 'blood_bank',
                status: 'pending_verification',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true,
                emailVerified: false,
                phoneVerified: true,
                licenseVerified: false
            };

            // Save to blood_banks collection
            await setDoc(doc(db, 'blood_banks', userId), bloodBankData);
            
            // Also save basic info to users collection for unified authentication
            const userData = {
                displayName: this.formData.hospitalName,
                phone: this.formatPhoneNumber(this.formData.phoneNumber),
                email: this.formData.email,
                role: 'blood_bank',
                bloodBankId: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true
            };

            await setDoc(doc(db, 'users', userId), userData);
            
            console.log('Blood bank data saved to Firestore');

        } catch (error) {
            console.error('Error saving blood bank data:', error);
            throw new Error('Failed to save blood bank data. Please try again.');
        }
    }

    /**
     * Check license number uniqueness
     */
    async checkLicenseUniqueness(licenseNumber) {
        if (!licenseNumber || licenseNumber.trim().length < 3) return false;

        try {
            const q = query(
                collection(db, 'blood_banks'), 
                where('licenseNumber', '==', licenseNumber.trim())
            );
            const querySnapshot = await getDocs(q);
            
            const licenseField = document.getElementById('license-number');
            
            if (!querySnapshot.empty) {
                this.showFieldError(licenseField, 'This license number is already registered');
                return true;
            } else {
                this.showFieldSuccess(licenseField);
                return false;
            }
        } catch (error) {
            console.error('Error checking license uniqueness:', error);
            return false;
        }
    }

    /**
     * Validate form data
     */
    validateForm() {
        const form = document.getElementById('bb-register-form');
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
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
                case 'hospital-name':
                    if (value.length < 3) {
                        isValid = false;
                        errorMessage = 'Hospital name must be at least 3 characters.';
                    }
                    break;

                case 'license-number':
                    if (value.length < 5) {
                        isValid = false;
                        errorMessage = 'License number must be at least 5 characters.';
                    }
                    break;

                case 'bb-phone-number':
                    if (!this.isValidPhoneNumber(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number with country code.';
                    }
                    break;

                case 'bb-email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address.';
                    }
                    break;

                case 'bb-address':
                    if (value.length < 10) {
                        isValid = false;
                        errorMessage = 'Please provide a complete address.';
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
        const form = document.getElementById('bb-register-form');
        const formData = new FormData(form);
        
        return {
            hospitalName: formData.get('hospital-name')?.trim(),
            licenseNumber: formData.get('license-number')?.trim(),
            phoneNumber: formData.get('bb-phone-number')?.trim(),
            email: formData.get('bb-email')?.trim().toLowerCase(),
            address: formData.get('bb-address')?.trim(),
            facilityType: formData.get('bb-type'),
            dailyCapacity: formData.get('bb-capacity')
        };
    }

    /**
     * Show OTP modal
     */
    showOTPModal(phoneNumber) {
        const modal = document.getElementById('bb-otp-modal');
        const phoneDisplay = document.getElementById('bb-phone-display');
        
        phoneDisplay.textContent = phoneNumber;
        modal.classList.remove('hidden');
        
        // Focus on OTP input
        setTimeout(() => {
            document.getElementById('bb-otp-input').focus();
        }, 300);
    }

    /**
     * Close OTP modal
     */
    closeOTPModal() {
        const modal = document.getElementById('bb-otp-modal');
        modal.classList.add('hidden');
        
        // Clear OTP input
        document.getElementById('bb-otp-input').value = '';
        
        // Stop resend timer
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
        }
    }

    /**
     * Start resend timer
     */
    startResendTimer() {
        const resendBtn = document.getElementById('bb-resend-otp-btn');
        const timerSpan = document.getElementById('bb-resend-timer');
        
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
     * Show loading state
     */
    showLoadingState() {
        const btn = document.getElementById('bb-register-btn');
        const btnText = document.getElementById('bb-register-btn-text');
        const loading = document.getElementById('bb-register-loading');
        
        btn.disabled = true;
        btnText.classList.add('hidden');
        loading.classList.remove('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const btn = document.getElementById('bb-register-btn');
        const btnText = document.getElementById('bb-register-btn-text');
        const loading = document.getElementById('bb-register-loading');
        
        btn.disabled = false;
        btnText.classList.remove('hidden');
        loading.classList.add('hidden');
    }

    /**
     * Show verify loading state
     */
    showVerifyLoadingState() {
        const btn = document.getElementById('bb-verify-otp-btn');
        const btnText = document.getElementById('bb-verify-btn-text');
        const loading = document.getElementById('bb-verify-loading');
        
        btn.disabled = true;
        btnText.classList.add('hidden');
        loading.classList.remove('hidden');
    }

    /**
     * Hide verify loading state
     */
    hideVerifyLoadingState() {
        const btn = document.getElementById('bb-verify-otp-btn');
        const btnText = document.getElementById('bb-verify-btn-text');
        const loading = document.getElementById('bb-verify-loading');
        
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

// Initialize blood bank registration system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add reCAPTCHA container to the page
    if (!document.getElementById('bb-recaptcha-container')) {
        const recaptchaDiv = document.createElement('div');
        recaptchaDiv.id = 'bb-recaptcha-container';
        recaptchaDiv.style.display = 'none';
        document.body.appendChild(recaptchaDiv);
    }

    window.bloodBankRegistration = new BloodBankRegistration();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.bloodBankRegistration) {
        // Reset any timers when page becomes visible
        console.log('Page became visible');
    }
});

// Export for use in other modules
export { BloodBankRegistration };