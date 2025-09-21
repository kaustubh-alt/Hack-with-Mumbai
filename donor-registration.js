/**
 * Donor Registration Form Handler
 * Handles new donor registration with Firebase integration
 */

import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class DonorRegistrationForm {
    constructor() {
        this.formData = {};
        this.validationRules = {};
        this.isSubmitting = false;
        this.init();
    }

    /**
     * Initialize the registration form
     */
    init() {
        this.setupForm();
        this.setupValidation();
        this.setupRealTimeValidation();
        this.loadFormData();
    }

    /**
     * Setup form event listeners
     */
    setupForm() {
        const form = document.getElementById('donor-registration-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Auto-save form data
        form.addEventListener('input', () => {
            this.saveFormData();
        });

        form.addEventListener('change', () => {
            this.saveFormData();
        });
    }

    /**
     * Setup validation rules
     */
    setupValidation() {
        this.validationRules = {
            firstName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s]+$/,
                message: 'First name must contain only letters and be at least 2 characters'
            },
            lastName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s]+$/,
                message: 'Last name must contain only letters and be at least 2 characters'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                required: true,
                pattern: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
                message: 'Please enter a valid phone number (e.g., (555) 123-4567)'
            },
            dateOfBirth: {
                required: true,
                custom: (value) => {
                    const age = this.calculateAge(value);
                    return age >= 16 && age <= 80;
                },
                message: 'Donor must be between 16 and 80 years old'
            },
            bloodType: {
                required: true,
                message: 'Please select your blood type'
            },
            weight: {
                required: true,
                min: 110,
                max: 500,
                message: 'Weight must be between 110 and 500 pounds'
            },
            height: {
                required: true,
                pattern: /^\d+'\d+"?$/,
                message: 'Please enter height in format: 5\'6"'
            }
        };
    }

    /**
     * Setup real-time validation
     */
    setupRealTimeValidation() {
        const form = document.getElementById('donor-registration-form');
        if (!form) return;

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

        // Special validation for email uniqueness
        const emailInput = form.querySelector('input[name="email"]');
        if (emailInput) {
            let emailTimeout;
            emailInput.addEventListener('input', () => {
                clearTimeout(emailTimeout);
                emailTimeout = setTimeout(() => {
                    this.checkEmailUniqueness(emailInput.value);
                }, 500);
            });
        }
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        const rules = this.validationRules[fieldName];

        if (!rules) return true;

        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(fieldName)} is required`;
        }

        // Pattern validation
        if (isValid && rules.pattern && value && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message;
        }

        // Length validation
        if (isValid && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = rules.message;
        }

        // Number validation
        if (isValid && (rules.min || rules.max)) {
            const numValue = parseFloat(value);
            if (rules.min && numValue < rules.min) {
                isValid = false;
                errorMessage = rules.message;
            }
            if (rules.max && numValue > rules.max) {
                isValid = false;
                errorMessage = rules.message;
            }
        }

        // Custom validation
        if (isValid && rules.custom && !rules.custom(value)) {
            isValid = false;
            errorMessage = rules.message;
        }

        // Update field appearance
        if (isValid) {
            this.showFieldSuccess(field);
        } else {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Check email uniqueness
     */
    async checkEmailUniqueness(email) {
        if (!email || !this.isValidEmail(email)) return;

        try {
            const q = query(collection(db, 'donors'), where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            const emailField = document.querySelector('input[name="email"]');
            
            if (!querySnapshot.empty) {
                this.showFieldError(emailField, 'This email is already registered');
            } else {
                this.showFieldSuccess(emailField);
            }
        } catch (error) {
            console.error('Error checking email uniqueness:', error);
        }
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');

        // Remove existing error message
        const existingError = field.parentNode.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message validation-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Show field success
     */
    showFieldSuccess(field) {
        field.classList.remove('error');
        field.classList.add('success');

        // Remove error message
        const existingError = field.parentNode.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        if (this.isSubmitting) return;

        const form = document.getElementById('donor-registration-form');
        const formData = new FormData(form);
        const donorData = Object.fromEntries(formData.entries());

        // Validate all fields
        let isFormValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showNotification('Please fix all validation errors before submitting', 'error');
            return;
        }

        this.isSubmitting = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner mr-2"></span>Registering...';

            // Process form data
            const processedData = this.processFormData(donorData);

            // Register donor
            await this.registerDonor(processedData);

            // Clear form and saved data
            form.reset();
            localStorage.removeItem('donorRegistrationForm');
            
            this.showNotification('Donor registered successfully!', 'success');
            
            // Redirect or refresh
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            this.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    /**
     * Process form data before submission
     */
    processFormData(formData) {
        return {
            firstName: formData.firstName?.trim(),
            lastName: formData.lastName?.trim(),
            email: formData.email?.trim().toLowerCase(),
            phone: this.formatPhoneNumber(formData.phone),
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            bloodType: formData.bloodType,
            address: {
                street: formData.street?.trim(),
                city: formData.city?.trim(),
                state: formData.state,
                zipCode: formData.zipCode?.trim()
            },
            medicalInfo: {
                weight: parseFloat(formData.weight),
                height: formData.height?.trim(),
                allergies: formData.allergies?.trim() || 'None',
                medications: formData.medications?.trim() || 'None',
                medicalConditions: formData.medicalConditions?.trim() || 'None'
            },
            emergencyContact: {
                name: formData.emergencyContactName?.trim(),
                phone: this.formatPhoneNumber(formData.emergencyContactPhone),
                relationship: formData.emergencyContactRelationship
            },
            contactPreferences: this.getContactPreferences(formData),
            consentGiven: formData.consent === 'on',
            privacyAccepted: formData.privacy === 'on'
        };
    }

    /**
     * Get contact preferences from form data
     */
    getContactPreferences(formData) {
        const preferences = [];
        
        if (formData.contactEmail === 'on') preferences.push('email');
        if (formData.contactSMS === 'on') preferences.push('sms');
        if (formData.contactPhone === 'on') preferences.push('phone');
        
        return preferences.length > 0 ? preferences : ['email'];
    }

    /**
     * Register donor in Firebase
     */
    async registerDonor(donorData) {
        try {
            // Add timestamp and initial status
            const donorRecord = {
                ...donorData,
                registrationDate: new Date().toISOString(),
                status: 'pending',
                totalDonations: 0,
                lastDonation: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, 'donors'), donorRecord);
            
            console.log('Donor registered with ID:', docRef.id);
            return { success: true, id: docRef.id };
            
        } catch (error) {
            console.error('Error registering donor:', error);
            throw new Error('Failed to register donor. Please try again.');
        }
    }

    /**
     * Save form data to localStorage
     */
    saveFormData() {
        const form = document.getElementById('donor-registration-form');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        localStorage.setItem('donorRegistrationForm', JSON.stringify({
            data,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Load saved form data
     */
    loadFormData() {
        const savedData = localStorage.getItem('donorRegistrationForm');
        if (!savedData) return;

        try {
            const { data, timestamp } = JSON.parse(savedData);
            const saveTime = new Date(timestamp);
            const now = new Date();
            const hoursDiff = (now - saveTime) / (1000 * 60 * 60);

            // Only load if saved within last 24 hours
            if (hoursDiff < 24) {
                this.populateForm(data);
                this.showNotification('Form data restored from previous session', 'info');
            }
        } catch (error) {
            console.error('Error loading saved form data:', error);
        }
    }

    /**
     * Populate form with saved data
     */
    populateForm(data) {
        const form = document.getElementById('donor-registration-form');
        if (!form) return;

        Object.entries(data).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = value === 'on';
                } else if (field.type === 'radio') {
                    if (field.value === value) {
                        field.checked = true;
                    }
                } else {
                    field.value = value;
                }
            }
        });
    }

    /**
     * Utility functions
     */
    getFieldLabel(fieldName) {
        const labels = {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            phone: 'Phone',
            dateOfBirth: 'Date of Birth',
            bloodType: 'Blood Type',
            weight: 'Weight',
            height: 'Height'
        };
        return labels[fieldName] || fieldName;
    }

    formatPhoneNumber(phone) {
        if (!phone) return '';
        
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        
        // Format as (XXX) XXX-XXXX
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        
        return phone;
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

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="material-symbols-outlined mr-2">
                    ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
                </span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.donorRegistrationForm = new DonorRegistrationForm();
});

// Export for use in other modules
export { DonorRegistrationForm };