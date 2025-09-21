/**
 * Raise Request Page JavaScript
 * Handles blood request form submission, validation, and preview
 */

class RaiseRequestManager {
    constructor() {
        this.formData = {};
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.init();
    }

    /**
     * Initialize the raise request manager
     */
    init() {
        this.setupSidebar();
        this.setupForm();
        this.setupValidation();
        this.setupPreview();
        this.setupAutoSave();
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
        const form = document.getElementById('raise-request-form');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Track form changes
        form.addEventListener('input', () => {
            this.isDirty = true;
            this.scheduleAutoSave();
            this.updatePreview();
        });

        form.addEventListener('change', () => {
            this.isDirty = true;
            this.scheduleAutoSave();
            this.updatePreview();
        });

        // Save draft button
        const saveDraftBtn = document.getElementById('save-draft-btn');
        saveDraftBtn?.addEventListener('click', () => {
            this.saveDraft();
        });

        // Preview button
        const previewBtn = document.getElementById('preview-btn');
        previewBtn?.addEventListener('click', () => {
            this.showPreview();
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
        const form = document.getElementById('raise-request-form');
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
                
                // Character counter for textareas
                if (input.tagName === 'TEXTAREA') {
                    this.updateCharacterCounter(input);
                }
            });
        });

        // Deadline validation
        const deadlineInput = form.querySelector('input[name="deadline"]');
        deadlineInput?.addEventListener('change', () => {
            this.validateDeadline();
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

        // Apply validation result
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.showFieldSuccess(field);
        }

        return isValid;
    }

    /**
     * Validate deadline
     */
    validateDeadline() {
        const deadlineInput = document.querySelector('input[name="deadline"]');
        const deadline = new Date(deadlineInput.value);
        const now = new Date();

        if (deadline <= now) {
            this.showFieldError(deadlineInput, 'Deadline must be in the future.');
            return false;
        }

        // Check if deadline is too far in the future for emergency requests
        const requestType = document.querySelector('select[name="requestType"]').value;
        if (requestType === 'emergency') {
            const maxEmergencyTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
            if (deadline > maxEmergencyTime) {
                this.showFieldError(deadlineInput, 'Emergency requests should have deadlines within 24 hours.');
                return false;
            }
        }

        this.showFieldSuccess(deadlineInput);
        return true;
    }

    /**
     * Update character counter
     */
    updateCharacterCounter(textarea) {
        const maxLength = 500; // Set a reasonable limit
        const currentLength = textarea.value.length;
        
        let counter = textarea.parentNode.querySelector('.char-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'char-counter';
            textarea.parentNode.appendChild(counter);
        }

        counter.textContent = `${currentLength}/${maxLength} characters`;
        
        if (currentLength > maxLength * 0.9) {
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning');
        }

        if (currentLength > maxLength) {
            counter.classList.add('error');
            textarea.value = textarea.value.substring(0, maxLength);
        } else {
            counter.classList.remove('error');
        }
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
     * Setup preview functionality
     */
    setupPreview() {
        const previewModal = document.getElementById('preview-modal');
        const closePreviewModal = document.getElementById('close-preview-modal');

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
     * Update live preview
     */
    updatePreview() {
        const formData = this.getFormData();
        const previewContainer = document.getElementById('request-preview');
        
        if (formData.requestTitle && formData.bloodType && formData.unitsRequired) {
            const previewHTML = this.generatePreviewHTML(formData);
            previewContainer.innerHTML = previewHTML;
            previewContainer.classList.add('populated');
        } else {
            previewContainer.innerHTML = `
                <p class="text-sm text-text-muted-light dark:text-text-muted-dark text-center">
                    Fill out the form above to see a preview of your request
                </p>
            `;
            previewContainer.classList.remove('populated');
        }
    }

    /**
     * Show full preview modal
     */
    showPreview() {
        const formData = this.getFormData();
        const previewContent = document.getElementById('preview-content');
        
        const previewHTML = this.generateFullPreviewHTML(formData);
        previewContent.innerHTML = previewHTML;

        const modal = document.getElementById('preview-modal');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close preview modal
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
        const urgencyClass = this.getUrgencyClass(data.requestType);
        
        return `
            <div class="space-y-3">
                <div class="flex items-center gap-2">
                    <h4 class="font-semibold text-text-light dark:text-text-dark">${data.requestTitle || 'Request Title'}</h4>
                    <span class="priority-${data.requestType} px-2 py-1 rounded text-xs font-medium">
                        ${this.formatRequestType(data.requestType)}
                    </span>
                </div>
                <div class="flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">bloodtype</span>
                        <span class="font-medium">${data.bloodType || 'Blood Type'} - ${data.unitsRequired || 'X'} units</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">location_on</span>
                        <span>${data.hospitalName || 'Hospital Name'}</span>
                    </div>
                </div>
                <p class="text-sm text-text-muted-light dark:text-text-muted-dark">
                    ${data.description || 'Request description will appear here...'}
                </p>
            </div>
        `;
    }

    /**
     * Generate full preview HTML
     */
    generateFullPreviewHTML(data) {
        return `
            <div class="space-y-6">
                <div class="text-center">
                    <h4 class="text-xl font-bold text-text-light dark:text-text-dark mb-2">${data.requestTitle || 'Blood Request Title'}</h4>
                    <div class="flex items-center justify-center gap-2">
                        <span class="priority-${data.requestType} px-3 py-1 rounded-full text-sm font-medium">
                            ${this.formatRequestType(data.requestType)}
                        </span>
                        <span class="blood-type-badge">${data.bloodType || 'Blood Type'}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h5 class="font-semibold text-text-light dark:text-text-dark mb-3">Request Details</h5>
                        <div class="space-y-2 text-sm">
                            <p><strong>Blood Type:</strong> ${data.bloodType || 'Not specified'}</p>
                            <p><strong>Units Required:</strong> ${data.unitsRequired || 'Not specified'}</p>
                            <p><strong>Deadline:</strong> ${data.deadline ? new Date(data.deadline).toLocaleString() : 'Not specified'}</p>
                            <p><strong>Request Type:</strong> ${this.formatRequestType(data.requestType)}</p>
                        </div>
                    </div>
                    <div>
                        <h5 class="font-semibold text-text-light dark:text-text-dark mb-3">Hospital Information</h5>
                        <div class="space-y-2 text-sm">
                            <p><strong>Hospital:</strong> ${data.hospitalName || 'Not specified'}</p>
                            <p><strong>Department:</strong> ${data.department || 'Not specified'}</p>
                            <p><strong>Contact:</strong> ${data.contactPerson || 'Not specified'}</p>
                            <p><strong>Phone:</strong> ${data.contactPhone || 'Not specified'}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h5 class="font-semibold text-text-light dark:text-text-dark mb-3">Patient Information</h5>
                    <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <p><strong>Age Group:</strong> ${this.formatAgeGroup(data.patientAge)}</p>
                            <p><strong>Condition:</strong> ${this.formatMedicalCondition(data.medicalCondition)}</p>
                        </div>
                        ${data.medicalDetails ? `<p class="text-sm mt-2"><strong>Details:</strong> ${data.medicalDetails}</p>` : ''}
                    </div>
                </div>
                
                <div>
                    <h5 class="font-semibold text-text-light dark:text-text-dark mb-3">Distribution Settings</h5>
                    <div class="space-y-2 text-sm">
                        <p><strong>Target Audience:</strong> ${this.formatTargetAudience(data.targetAudience)}</p>
                        <p><strong>Geographic Radius:</strong> ${data.radius || '10'} miles</p>
                        <p><strong>Notification Methods:</strong> ${this.formatNotificationMethods(data)}</p>
                        <p><strong>Public Request:</strong> ${data.publicRequest ? 'Yes' : 'No'}</p>
                    </div>
                </div>
                
                ${data.specialInstructions ? `
                    <div>
                        <h5 class="font-semibold text-text-light dark:text-text-dark mb-3">Special Instructions</h5>
                        <p class="text-sm text-text-muted-light dark:text-text-muted-dark bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            ${data.specialInstructions}
                        </p>
                    </div>
                ` : ''}
                
                <div class="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button class="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors" onclick="raiseRequestManager.submitFromPreview()">
                        Send Request
                    </button>
                    <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="raiseRequestManager.closePreview()">
                        Edit Request
                    </button>
                </div>
            </div>
        `;
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
        localStorage.setItem('requestDraft', JSON.stringify({
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
        const draft = localStorage.getItem('requestDraft');
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
        const form = document.getElementById('raise-request-form');
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
                data[checkbox.name] = false;
            }
        });

        return data;
    }

    /**
     * Populate form with data
     */
    populateForm(data) {
        const form = document.getElementById('raise-request-form');

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
     * Handle form submission
     */
    async handleSubmit() {
        // Validate all fields
        const form = document.getElementById('raise-request-form');
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Additional validations
        if (!this.validateDeadline()) {
            isValid = false;
        }

        if (!isValid) {
            this.showNotification('Please fix all errors before submitting.', 'error');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner mr-2"></span>Sending Request...';

        try {
            // Simulate API call
            await this.submitRequest(this.getFormData());
            
            // Clear draft
            localStorage.removeItem('requestDraft');
            this.isDirty = false;
            
            this.showNotification('Blood request sent successfully! Donors will be notified immediately.', 'success');
            
            // Redirect to emergency alerts page
            setTimeout(() => {
                window.location.href = 'bb_emergency_alerts.html';
            }, 2000);

        } catch (error) {
            console.error('Error submitting request:', error);
            this.showNotification('Error sending request. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    /**
     * Submit from preview modal
     */
    submitFromPreview() {
        this.closePreview();
        this.handleSubmit();
    }

    /**
     * Submit request (API call simulation)
     */
    async submitRequest(requestData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real implementation, this would make an API call
        console.log('Submitting request with data:', requestData);
        
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
     * Utility functions
     */
    getUrgencyClass(requestType) {
        const classMap = {
            emergency: 'emergency',
            urgent: 'urgent',
            routine: 'routine',
            campaign: 'routine'
        };
        return classMap[requestType] || 'routine';
    }

    formatRequestType(type) {
        const typeMap = {
            emergency: 'Emergency',
            urgent: 'Urgent',
            routine: 'Routine',
            campaign: 'Campaign'
        };
        return typeMap[type] || type;
    }

    formatAgeGroup(age) {
        const ageMap = {
            infant: 'Infant (0-2 years)',
            child: 'Child (3-12 years)',
            teen: 'Teenager (13-17 years)',
            adult: 'Adult (18-64 years)',
            senior: 'Senior (65+ years)'
        };
        return ageMap[age] || age;
    }

    formatMedicalCondition(condition) {
        const conditionMap = {
            trauma: 'Trauma/Accident',
            surgery: 'Scheduled Surgery',
            cancer: 'Cancer Treatment',
            anemia: 'Severe Anemia',
            bleeding: 'Internal Bleeding',
            other: 'Other Medical Condition'
        };
        return conditionMap[condition] || condition;
    }

    formatTargetAudience(audience) {
        const audienceMap = {
            all: 'All Eligible Donors',
            nearby: 'Nearby Donors',
            city: 'City-wide',
            state: 'State-wide',
            bloodtype: 'Specific Blood Type Only'
        };
        return audienceMap[audience] || audience;
    }

    formatNotificationMethods(data) {
        const methods = [];
        if (data.notificationMethods) {
            if (Array.isArray(data.notificationMethods)) {
                methods.push(...data.notificationMethods);
            } else {
                methods.push(data.notificationMethods);
            }
        }
        
        const methodMap = {
            sms: 'SMS',
            email: 'Email',
            push: 'Push Notification',
            call: 'Phone Call'
        };
        
        return methods.map(method => methodMap[method] || method).join(', ') || 'Not specified';
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
    window.raiseRequestManager = new RaiseRequestManager();
    
    // Load draft if available
    window.raiseRequestManager.loadDraft();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.raiseRequestManager && window.raiseRequestManager.isDirty) {
        // Save draft when page becomes hidden
        window.raiseRequestManager.saveDraft(true);
    }
});