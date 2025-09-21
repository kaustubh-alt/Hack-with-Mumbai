/**
 * User Registration Service
 * Handles complete user registration with Firebase Auth and Firestore
 */

import { auth, db, handleFirebaseError, isFirebaseReady } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    updateProfile,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    serverTimestamp,
    query,
    collection,
    where,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class RegistrationService {
    constructor() {
        this.isProcessing = false;
        this.init();
    }

    /**
     * Initialize the registration service
     */
    init() {
        // Wait for Firebase to be ready
        if (!isFirebaseReady()) {
            console.error('Firebase is not properly initialized');
            return;
        }
        
        console.log('✓ Registration service initialized');
        this.setupFormHandlers();
    }

    /**
     * Setup form event handlers
     */
    setupFormHandlers() {
        const form = document.getElementById('registration-form');
        if (!form) {
            console.error('Registration form not found');
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration(e);
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

        console.log('✓ Form handlers setup complete');
    }

    /**
     * Handle registration form submission
     */
    async handleRegistration(event) {
        if (this.isProcessing) {
            console.log('Registration already in progress...');
            return;
        }

        console.log('🚀 Starting registration process...');
        
        try {
            // Validate form
            if (!this.validateForm()) {
                this.showNotification('Please fix all validation errors before submitting.', 'error');
                return;
            }

            // Get form data
            const formData = this.getFormData();
            console.log('📝 Form data collected:', { ...formData, password: '[HIDDEN]' });

            // Check if email already exists
            const emailExists = await this.checkEmailExists(formData.email);
            if (emailExists) {
                this.showNotification('This email is already registered. Please use a different email or try logging in.', 'error');
                return;
            }

            this.isProcessing = true;
            this.showLoadingState();

            // Create user account with Firebase Auth
            console.log('🔐 Creating user account with Firebase Auth...');
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            console.log('✓ User account created successfully:', user.uid);

            // Update user profile
            console.log('👤 Updating user profile...');
            await updateProfile(user, {
                displayName: `${formData.firstName} ${formData.lastName}`
            });
            console.log('✓ User profile updated');

            // Save user data to Firestore
            console.log('💾 Saving user data to Firestore...');
            await this.saveUserToFirestore(user.uid, formData);
            console.log('✓ User data saved to Firestore');

            // Send email verification (optional)
            try {
                await sendEmailVerification(user);
                console.log('✓ Email verification sent');
            } catch (emailError) {
                console.warn('⚠️ Email verification failed:', emailError);
                // Don't fail the registration for email verification issues
            }

            // Success!
            this.showNotification('Registration successful! Welcome to LiquidLove!', 'success');
            console.log('🎉 Registration completed successfully');
            
            // Clear form and redirect
            this.clearForm();
            
            // Redirect to dashboard after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('❌ Registration failed:', error);
            const errorMessage = handleFirebaseError(error);
            this.showNotification(errorMessage, 'error');
        } finally {
            this.isProcessing = false;
            this.hideLoadingState();
        }
    }

    /**
     * Check if email already exists in Firestore
     */
    async checkEmailExists(email) {
        try {
            const q = query(
                collection(db, 'users'), 
                where('email', '==', email.toLowerCase())
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking email existence:', error);
            return false; // Assume email doesn't exist if check fails
        }
    }

    /**
     * Save user data to Firestore
     */
    async saveUserToFirestore(userId, formData) {
        try {
            const userData = {
                // Basic information
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email.toLowerCase(),
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                bloodType: formData.bloodType,
                
                // Address information
                address: {
                    street: formData.street || '',
                    city: formData.city || '',
                    state: formData.state || '',
                    zipCode: formData.zipCode || ''
                },
                
                // Medical information
                medicalInfo: {
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                    height: formData.height || '',
                    allergies: formData.allergies || 'None',
                    medications: formData.medications || 'None',
                    medicalConditions: formData.medicalConditions || 'None'
                },
                
                // Emergency contact
                emergencyContact: {
                    name: formData.emergencyContactName || '',
                    phone: formData.emergencyContactPhone || '',
                    relationship: formData.emergencyContactRelationship || ''
                },
                
                // Contact preferences
                contactPreferences: this.getContactPreferences(formData),
                
                // System fields
                role: 'user',
                status: 'active',
                emailVerified: false,
                phoneVerified: false,
                registrationDate: new Date().toISOString(),
                totalDonations: 0,
                lastDonation: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true
            };

            // Save to users collection
            await setDoc(doc(db, 'users', userId), userData);
            
            // Also save to donors collection for blood bank queries
            const donorData = {
                ...userData,
                donorId: userId,
                eligibilityStatus: 'pending', // Will be determined after medical screening
                donationHistory: []
            };
            
            await setDoc(doc(db, 'donors', userId), donorData);
            
            console.log('✓ User data saved to both users and donors collections');
            
        } catch (error) {
            console.error('Error saving user data to Firestore:', error);
            throw new Error('Failed to save user information. Please try again.');
        }
    }

    /**
     * Get contact preferences from form data
     */
    getContactPreferences(formData) {
        const preferences = [];
        
        if (formData.contactEmail === 'on') preferences.push('email');
        if (formData.contactSMS === 'on') preferences.push('sms');
        if (formData.contactPhone === 'on') preferences.push('phone');
        
        return preferences.length > 0 ? preferences : ['email']; // Default to email
    }

    /**
     * Validate the entire form
     */
    validateForm() {
        const form = document.getElementById('registration-form');
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Additional validations
        if (!this.validatePasswordMatch()) {
            isValid = false;
        }

        if (!this.validateAge()) {
            isValid = false;
        }

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
                case 'firstName':
                case 'lastName':
                    if (!/^[a-zA-Z\s]+$/.test(value) || value.length < 2) {
                        isValid = false;
                        errorMessage = 'Name must contain only letters and be at least 2 characters.';
                    }
                    break;

                case 'email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address.';
                    }
                    break;

                case 'phone':
                    if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number (e.g., (555) 123-4567).';
                    }
                    break;

                case 'password':
                    if (value.length < 6) {
                        isValid = false;
                        errorMessage = 'Password must be at least 6 characters long.';
                    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                        isValid = false;
                        errorMessage = 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
                    }
                    break;

                case 'confirmPassword':
                    const passwordField = document.querySelector('input[name="password"]');
                    if (value !== passwordField.value) {
                        isValid = false;
                        errorMessage = 'Passwords do not match.';
                    }
                    break;

                case 'weight':
                    const weight = parseFloat(value);
                    if (isNaN(weight) || weight < 110 || weight > 500) {
                        isValid = false;
                        errorMessage = 'Weight must be between 110 and 500 pounds.';
                    }
                    break;

                case 'height':
                    if (!/^\d+'\d+"?$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter height in format: 5\'6"';
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
     * Validate password match
     */
    validatePasswordMatch() {
        const passwordField = document.querySelector('input[name="password"]');
        const confirmPasswordField = document.querySelector('input[name="confirmPassword"]');
        
        if (passwordField && confirmPasswordField) {
            return this.validateField(confirmPasswordField);
        }
        
        return true;
    }

    /**
     * Validate age requirement
     */
    validateAge() {
        const dobField = document.querySelector('input[name="dateOfBirth"]');
        if (!dobField || !dobField.value) return true;

        const age = this.calculateAge(dobField.value);
        if (age < 16 || age > 80) {
            this.showFieldError(dobField, 'Donor must be between 16 and 80 years old.');
            return false;
        }

        this.showFieldSuccess(dobField);
        return true;
    }

    /**
     * Calculate age from date of birth
     */
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
     * Get form data
     */
    getFormData() {
        const form = document.getElementById('registration-form');
        const formData = new FormData(form);
        const data = {};

        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value.trim();
        }

        // Handle checkboxes
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            data[checkbox.name] = checkbox.checked ? 'on' : 'off';
        });

        return data;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-gray-300', 'focus:border-blue-500', 'focus:ring-blue-500');
        field.classList.remove('border-green-500', 'focus:border-green-500', 'focus:ring-green-500');

        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-sm text-red-600 mt-1';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Show field success
     */
    showFieldSuccess(field) {
        field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-gray-300', 'focus:border-blue-500', 'focus:ring-blue-500');
        field.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500');
        
        // Remove error message
        this.clearFieldError(field);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-green-500', 'focus:border-green-500', 'focus:ring-green-500');
        field.classList.add('border-gray-300', 'focus:border-blue-500', 'focus:ring-blue-500');
        
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const submitBtn = document.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        if (submitBtn && btnText && btnLoading) {
            submitBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const submitBtn = document.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        if (submitBtn && btnText && btnLoading) {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
    }

    /**
     * Clear form
     */
    clearForm() {
        const form = document.getElementById('registration-form');
        form.reset();
        
        // Clear all validation states
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            this.clearFieldError(input);
        });
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
}

// Initialize registration service when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Firebase to initialize
    setTimeout(() => {
        window.registrationService = new RegistrationService();
    }, 100);
});

// Export for use in other modules
export { RegistrationService };