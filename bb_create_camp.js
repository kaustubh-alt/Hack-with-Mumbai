/**
 * Create Blood Donation Camp JavaScript
 * Handles form validation, submission, and user interactions
 */

class CreateCampManager {
    constructor() {
        this.formData = {};
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.init();
    }

    /**
     * Initialize the create camp manager
     */
    init() {
        this.setupSidebar();
        this.setupForm();
        this.setupValidation();
        this.setupAutoSave();
        this.setupPreview();
        this.setupLocationServices();
        this.animateElements();
    }

    /**
     * Setup sidebar functionality
     */
    setupSidebar() {
        let sidebarOpen = false;

        const menuButton = document.getElementById("menu-button");
        const sidebar = document.getElementById("sidebar");
        const sidebarOverlay = document.getElementById("sidebar-overlay");
        const closeSidebar = document.getElementById("close-sidebar");
        const mainContent = document.getElementById("main-content");

        const toggleSidebar = () => {
            sidebarOpen = !sidebarOpen;

            if (sidebarOpen) {
                sidebar.classList.add("open");
                if (window.innerWidth >= 768) {
                    mainContent.classList.add("sidebar-open");
                } else {
                    sidebarOverlay.classList.remove("hidden");
                    document.body.style.overflow = "hidden";
                }
            } else {
                sidebar.classList.remove("open");
                mainContent.classList.remove("sidebar-open");
                sidebarOverlay.classList.add("hidden");
                document.body.style.overflow = "auto";
            }
        };

        const closeSidebarFunc = () => {
            if (sidebarOpen) {
                toggleSidebar();
            }
        };

        menuButton?.addEventListener("click", toggleSidebar);
        closeSidebar?.addEventListener("click", closeSidebarFunc);
        sidebarOverlay?.addEventListener("click", closeSidebarFunc);

        // Handle window resize
        window.addEventListener("resize", () => {
            if (window.innerWidth >= 768) {
                sidebarOverlay.classList.add("hidden");
                document.body.style.overflow = "auto";
                if (sidebarOpen) {
                    mainContent.classList.add("sidebar-open");
                } else {
                    mainContent.classList.remove("sidebar-open");
                }
            } else {
                mainContent.classList.remove("sidebar-open");
                if (sidebarOpen) {
                    sidebarOverlay.classList.remove("hidden");
                    document.body.style.overflow = "hidden";
                }
            }
        });

        // Close sidebar with Escape key
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && sidebarOpen) {
                closeSidebarFunc();
            }
        });
    }

    /**
     * Setup form functionality
     */
    setupForm() {
        const form = document.getElementById('create-camp-form');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Track form changes
        form.addEventListener('input', () => {
            this.isDirty = true;
            this.scheduleAutoSave();
        });

        form.addEventListener('change', () => {
            this.isDirty = true;
            this.scheduleAutoSave();
        });

        // Save draft button
        const saveDraftBtn = document.getElementById('save-draft-btn');
        saveDraftBtn?.addEventListener('click', () => {
            this.saveDraft();
        });

        // Cancel button
        const cancelBtn = form.querySelector('button[type="button"]:last-child');
        cancelBtn?.addEventListener('click', () => {
            this.handleCancel();
        });

        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }

    /**
     * Setup form validation
     */
    setupValidation() {
        const form = document.getElementById('create-camp-form');
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            // Real-time validation
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('field-error')) {
                    this.validateField(input);
                }
            });
        });

        // Date validation
        const startDateInput = form.querySelector('input[name="startDate"]');
        const endDateInput = form.querySelector('input[name="endDate"]');

        startDateInput?.addEventListener('change', () => {
            this.validateDateRange();
        });

        endDateInput?.addEventListener('change', () => {
            this.validateDateRange();
        });

        // Time validation
        const startTimeInput = form.querySelector('input[name="startTime"]');
        const endTimeInput = form.querySelector('input[name="endTime"]');

        startTimeInput?.addEventListener('change', () => {
            this.validateTimeRange();
        });

        endTimeInput?.addEventListener('change', () => {
            this.validateTimeRange();
        });
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error
        this.clearFieldError(field);

        // Required field validation
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required.';
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address.';
            }
        }

        // Phone validation
        if (field.name === 'contactPhone' && value) {
            const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number.';
            }
        }

        // Number validation
        if (field.type === 'number' && value) {
            const num = parseInt(value);
            if (isNaN(num) || num < 1) {
                isValid = false;
                errorMessage = 'Please enter a valid positive number.';
            }
        }

        // Date validation
        if (field.type === 'date' && value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                isValid = false;
                errorMessage = 'Date cannot be in the past.';
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
     * Validate date range
     */
    validateDateRange() {
        const startDate = document.querySelector('input[name="startDate"]').value;
        const endDate = document.querySelector('input[name="endDate"]').value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end < start) {
                this.showFieldError(
                    document.querySelector('input[name="endDate"]'),
                    'End date cannot be before start date.'
                );
                return false;
            }
        }

        return true;
    }

    /**
     * Validate time range
     */
    validateTimeRange() {
        const startTime = document.querySelector('input[name="startTime"]').value;
        const endTime = document.querySelector('input[name="endTime"]').value;

        if (startTime && endTime) {
            const start = new Date(`2000-01-01 ${startTime}`);
            const end = new Date(`2000-01-01 ${endTime}`);

            if (end <= start) {
                this.showFieldError(
                    document.querySelector('input[name="endTime"]'),
                    'End time must be after start time.'
                );
                return false;
            }
        }

        return true;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('field-error');
        field.classList.remove('field-success');

        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Show field success
     */
    showFieldSuccess(field) {
        field.classList.remove('field-error');
        field.classList.add('field-success');
        this.clearFieldError(field);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('field-error');
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        // Auto-save every 30 seconds if there are changes
        setInterval(() => {
            if (this.isDirty) {
                this.saveDraft(true); // Silent save
            }
        }, 30000);
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(() => {
            this.saveDraft(true);
        }, 5000); // Save 5 seconds after last change
    }

    /**
     * Save draft
     */
    saveDraft(silent = false) {
        const formData = this.getFormData();
        
        // Save to localStorage
        localStorage.setItem('campDraft', JSON.stringify({
            data: formData,
            timestamp: new Date().toISOString()
        }));

        this.isDirty = false;

        if (!silent) {
            this.showAutoSaveIndicator('Draft saved');
        }
    }

    /**
     * Load draft
     */
    loadDraft() {
        const draft = localStorage.getItem('campDraft');
        if (draft) {
            try {
                const { data, timestamp } = JSON.parse(draft);
                const draftDate = new Date(timestamp);
                const now = new Date();
                const hoursDiff = (now - draftDate) / (1000 * 60 * 60);

                // Only load draft if it's less than 24 hours old
                if (hoursDiff < 24) {
                    this.populateForm(data);
                    this.showNotification('Draft loaded from ' + draftDate.toLocaleString(), 'info');
                }
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        const form = document.getElementById('create-camp-form');
        const formData = new FormData(form);
        const data = {};

        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (like checkboxes)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        // Handle checkboxes that might not be in FormData
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked && checkbox.name) {
                if (checkbox.name === 'bloodTypes') {
                    // Skip blood types as they're handled above
                    return;
                }
                data[checkbox.name] = false;
            }
        });

        return data;
    }

    /**
     * Populate form with data
     */
    populateForm(data) {
        const form = document.getElementById('create-camp-form');

        Object.entries(data).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = value === true || value === 'on';
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
     * Setup preview functionality
     */
    setupPreview() {
        const previewBtn = document.getElementById('preview-btn');
        const previewModal = document.getElementById('preview-modal');
        const closePreviewModal = document.getElementById('close-preview-modal');

        previewBtn?.addEventListener('click', () => {
            this.showPreview();
        });

        closePreviewModal?.addEventListener('click', () => {
            this.closePreview();
        });

        previewModal?.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                this.closePreview();
            }
        });

        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePreview();
            }
        });
    }

    /**
     * Show preview
     */
    showPreview() {
        const formData = this.getFormData();
        const previewContent = document.getElementById('preview-content');
        
        const previewHTML = this.generatePreviewHTML(formData);
        previewContent.innerHTML = previewHTML;

        const modal = document.getElementById('preview-modal');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close preview
     */
    closePreview() {
        const modal = document.getElementById('preview-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }

    /**
     * Generate preview HTML
     */
    generatePreviewHTML(data) {
        const bloodTypes = Array.isArray(data.bloodTypes) ? data.bloodTypes.join(', ') : (data.bloodTypes || 'All types accepted');
        
        return `
            <div class="space-y-6">
                <div class="preview-section">
                    <h4 class="preview-label text-lg font-semibold mb-3">Basic Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="preview-label">Camp Name</p>
                            <p class="preview-value">${data.campName || 'Not specified'}</p>
                        </div>
                        <div>
                            <p class="preview-label">Organizer</p>
                            <p class="preview-value">${data.organizerName || 'Not specified'}</p>
                        </div>
                        <div class="md:col-span-2">
                            <p class="preview-label">Description</p>
                            <p class="preview-value">${data.description || 'No description provided'}</p>
                        </div>
                    </div>
                </div>

                <div class="preview-section">
                    <h4 class="preview-label text-lg font-semibold mb-3">Location</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="preview-label">Venue</p>
                            <p class="preview-value">${data.venueName || 'Not specified'}</p>
                        </div>
                        <div>
                            <p class="preview-label">Address</p>
                            <p class="preview-value">${this.formatAddress(data)}</p>
                        </div>
                    </div>
                </div>

                <div class="preview-section">
                    <h4 class="preview-label text-lg font-semibold mb-3">Schedule</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="preview-label">Date</p>
                            <p class="preview-value">${this.formatDateRange(data.startDate, data.endDate)}</p>
                        </div>
                        <div>
                            <p class="preview-label">Time</p>
                            <p class="preview-value">${this.formatTimeRange(data.startTime, data.endTime)}</p>
                        </div>
                    </div>
                </div>

                <div class="preview-section">
                    <h4 class="preview-label text-lg font-semibold mb-3">Capacity & Requirements</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="preview-label">Maximum Donors</p>
                            <p class="preview-value">${data.maxDonors || 'Not specified'}</p>
                        </div>
                        <div>
                            <p class="preview-label">Target Units</p>
                            <p class="preview-value">${data.targetUnits || 'Not specified'}</p>
                        </div>
                        <div class="md:col-span-2">
                            <p class="preview-label">Preferred Blood Types</p>
                            <p class="preview-value">${bloodTypes}</p>
                        </div>
                    </div>
                </div>

                <div class="preview-section">
                    <h4 class="preview-label text-lg font-semibold mb-3">Additional Settings</h4>
                    <div class="space-y-2">
                        <p class="preview-value">
                            <span class="font-medium">Walk-ins:</span> ${data.walkInsAllowed ? 'Allowed' : 'Not allowed'}
                        </p>
                        <p class="preview-value">
                            <span class="font-medium">Refreshments:</span> ${data.refreshmentsProvided ? 'Provided' : 'Not provided'}
                        </p>
                        <p class="preview-value">
                            <span class="font-medium">Public Event:</span> ${data.publicEvent ? 'Yes' : 'No'}
                        </p>
                        <p class="preview-value">
                            <span class="font-medium">Reminders:</span> ${data.sendReminders ? 'Enabled' : 'Disabled'}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format address for display
     */
    formatAddress(data) {
        const parts = [
            data.streetAddress,
            data.city,
            data.state,
            data.zipCode
        ].filter(part => part);

        return parts.length > 0 ? parts.join(', ') : 'Not specified';
    }

    /**
     * Format date range for display
     */
    formatDateRange(startDate, endDate) {
        if (!startDate) return 'Not specified';
        
        const start = new Date(startDate).toLocaleDateString();
        if (!endDate) return start;
        
        const end = new Date(endDate).toLocaleDateString();
        return `${start} - ${end}`;
    }

    /**
     * Format time range for display
     */
    formatTimeRange(startTime, endTime) {
        if (!startTime || !endTime) return 'Not specified';
        
        const formatTime = (time) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        };

        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }

    /**
     * Setup location services
     */
    setupLocationServices() {
        const locateBtn = document.getElementById('locate-btn');
        
        locateBtn?.addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Update map preview when address changes
        const addressFields = ['streetAddress', 'city', 'state', 'zipCode'];
        addressFields.forEach(fieldName => {
            const field = document.querySelector(`input[name="${fieldName}"]`);
            field?.addEventListener('blur', () => {
                this.updateMapPreview();
            });
        });
    }

    /**
     * Get current location
     */
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showNotification('Geolocation is not supported by this browser.', 'error');
            return;
        }

        const locateBtn = document.getElementById('locate-btn');
        const originalText = locateBtn.textContent;
        locateBtn.textContent = 'Getting location...';
        locateBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.reverseGeocode(latitude, longitude);
                
                locateBtn.textContent = originalText;
                locateBtn.disabled = false;
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showNotification('Unable to get your location. Please enter address manually.', 'error');
                
                locateBtn.textContent = originalText;
                locateBtn.disabled = false;
            }
        );
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(lat, lng) {
        // In a real implementation, this would use a geocoding service
        // For demo purposes, we'll just show a notification
        this.showNotification('Location detected. In a real app, this would populate the address fields.', 'info');
        this.updateMapPreview();
    }

    /**
     * Update map preview
     */
    updateMapPreview() {
        const mapPreview = document.getElementById('map-preview');
        
        // In a real implementation, this would update with an actual map
        mapPreview.innerHTML = `
            <div class="text-center">
                <span class="material-symbols-outlined text-4xl text-primary-600 mb-2">location_on</span>
                <p class="text-sm text-text-light dark:text-text-dark font-medium">Location Preview</p>
                <p class="text-xs text-text-muted-light dark:text-text-muted-dark">Map would show the entered address</p>
            </div>
        `;
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        // Validate all fields
        const form = document.getElementById('create-camp-form');
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Additional validations
        if (!this.validateDateRange() || !this.validateTimeRange()) {
            isValid = false;
        }

        if (!isValid) {
            this.showNotification('Please fix all errors before submitting.', 'error');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner mr-2"></span>Creating...';

        try {
            // Simulate API call
            await this.createCamp(this.getFormData());
            
            // Clear draft
            localStorage.removeItem('campDraft');
            this.isDirty = false;
            
            this.showNotification('Blood donation camp created successfully!', 'success');
            
            // Redirect to manage camps page
            setTimeout(() => {
                window.location.href = 'bb_manage_camps.html';
            }, 2000);

        } catch (error) {
            console.error('Error creating camp:', error);
            this.showNotification('Error creating camp. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    /**
     * Create camp (API call simulation)
     */
    async createCamp(campData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real implementation, this would make an API call
        console.log('Creating camp with data:', campData);
        
        return { success: true, id: Date.now() };
    }

    /**
     * Handle cancel
     */
    handleCancel() {
        if (this.isDirty) {
            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                window.location.href = 'bb_dashboard.html';
            }
        } else {
            window.location.href = 'bb_dashboard.html';
        }
    }

    /**
     * Animate form elements
     */
    animateElements() {
        const formSections = document.querySelectorAll('.form-section');
        formSections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('loaded');
            }, index * 200);
        });
    }

    /**
     * Show auto-save indicator
     */
    showAutoSaveIndicator(message) {
        let indicator = document.querySelector('.auto-save-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'auto-save-indicator';
            document.body.appendChild(indicator);
        }

        indicator.textContent = message;
        indicator.classList.add('show');

        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
        
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
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.createCampManager = new CreateCampManager();
    
    // Load draft if available
    window.createCampManager.loadDraft();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.createCampManager && window.createCampManager.isDirty) {
        // Save draft when page becomes hidden
        window.createCampManager.saveDraft(true);
    }
});