/**
 * Profile Page JavaScript
 * Handles profile editing, image upload, and form validation
 */

class ProfileManager {
    constructor() {
        this.isEditing = false;
        this.originalData = {};
        this.init();
    }

    /**
     * Initialize the profile manager
     */
    init() {
        this.setupSidebar();
        this.setupEditButtons();
        this.setupImageUpload();
        this.setupFormValidation();
        this.loadProfileData();
    }

    /**
     * Setup sidebar functionality (reused from main dashboard)
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
     * Setup edit buttons functionality
     */
    setupEditButtons() {
        const editButtons = document.querySelectorAll('button:contains("Edit")');
        const mainEditButton = document.getElementById('edit-profile-btn');

        // Main edit profile button
        mainEditButton?.addEventListener('click', () => {
            this.toggleEditMode();
        });

        // Section-specific edit buttons
        document.addEventListener('click', (e) => {
            if (e.target.textContent === 'Edit') {
                const section = e.target.closest('.rounded-2xl');
                this.toggleSectionEdit(section);
            }
        });
    }

    /**
     * Toggle edit mode for the entire profile
     */
    toggleEditMode() {
        this.isEditing = !this.isEditing;
        const editButton = document.getElementById('edit-profile-btn');
        
        if (this.isEditing) {
            this.enterEditMode();
            editButton.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Save Changes';
            editButton.classList.remove('bg-primary-600', 'hover:bg-primary-700');
            editButton.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
            this.exitEditMode();
            editButton.innerHTML = '<span class="material-symbols-outlined text-sm">edit</span> Edit Profile';
            editButton.classList.remove('bg-green-600', 'hover:bg-green-700');
            editButton.classList.add('bg-primary-600', 'hover:bg-primary-700');
        }
    }

    /**
     * Enter edit mode
     */
    enterEditMode() {
        // Store original data
        this.storeOriginalData();
        
        // Convert text elements to input fields
        this.convertToInputs();
        
        // Add edit mode class
        document.body.classList.add('edit-mode');
        
        // Show save/cancel buttons
        this.showEditActions();
    }

    /**
     * Exit edit mode
     */
    exitEditMode() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('You have unsaved changes. Are you sure you want to exit without saving?')) {
                return;
            }
        }
        
        // Save changes or restore original data
        this.saveChanges();
        
        // Convert inputs back to text
        this.convertToText();
        
        // Remove edit mode class
        document.body.classList.remove('edit-mode');
        
        // Hide edit actions
        this.hideEditActions();
    }

    /**
     * Toggle edit mode for a specific section
     */
    toggleSectionEdit(section) {
        const isEditing = section.classList.contains('section-editing');
        
        if (isEditing) {
            this.exitSectionEdit(section);
        } else {
            this.enterSectionEdit(section);
        }
    }

    /**
     * Enter edit mode for a specific section
     */
    enterSectionEdit(section) {
        section.classList.add('section-editing');
        
        // Convert text to inputs in this section
        const textElements = section.querySelectorAll('p:not(.text-sm)');
        textElements.forEach(element => {
            if (!element.closest('.text-sm')) {
                this.convertTextToInput(element);
            }
        });
        
        // Change edit button to save/cancel
        const editButton = section.querySelector('button');
        if (editButton) {
            editButton.innerHTML = 'Save';
            editButton.classList.add('bg-green-600', 'text-white');
        }
    }

    /**
     * Exit edit mode for a specific section
     */
    exitSectionEdit(section) {
        section.classList.remove('section-editing');
        
        // Convert inputs back to text
        const inputs = section.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            this.convertInputToText(input);
        });
        
        // Change save button back to edit
        const saveButton = section.querySelector('button');
        if (saveButton) {
            saveButton.innerHTML = 'Edit';
            saveButton.classList.remove('bg-green-600', 'text-white');
        }
    }

    /**
     * Convert text element to input field
     */
    convertTextToInput(element) {
        const value = element.textContent.trim();
        const input = document.createElement('input');
        
        input.type = 'text';
        input.value = value;
        input.className = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:ring-primary-600 focus:border-primary-600';
        
        // Store original element for restoration
        input.dataset.originalContent = value;
        
        element.parentNode.replaceChild(input, element);
    }

    /**
     * Convert input field back to text element
     */
    convertInputToText(input) {
        const p = document.createElement('p');
        p.textContent = input.value;
        p.className = 'text-text-light dark:text-text-dark font-medium';
        
        input.parentNode.replaceChild(p, input);
    }

    /**
     * Setup image upload functionality
     */
    setupImageUpload() {
        const cameraButton = document.querySelector('.absolute.bottom-0.right-0');
        
        if (cameraButton) {
            cameraButton.addEventListener('click', () => {
                this.openImageUpload();
            });
        }
        
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        document.body.appendChild(fileInput);
        this.fileInput = fileInput;
    }

    /**
     * Open image upload dialog
     */
    openImageUpload() {
        this.fileInput.click();
    }

    /**
     * Handle image upload
     */
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file.', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image size must be less than 5MB.', 'error');
            return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.updateProfileImage(e.target.result);
            this.showNotification('Profile image updated successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Update profile image
     */
    updateProfileImage(imageSrc) {
        const profileImages = document.querySelectorAll('img[alt="Sarah Miller"]');
        profileImages.forEach(img => {
            img.src = imageSrc;
        });
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                this.validateField(e.target);
            }
        });
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Email validation
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address.';
            }
        }
        
        // Phone validation
        if (field.name === 'phone') {
            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
            if (value && !phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number.';
            }
        }
        
        // Required field validation
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required.';
        }
        
        // Update field styling
        if (isValid) {
            field.classList.remove('border-red-500');
            field.classList.add('border-slate-300', 'dark:border-slate-600');
            this.removeFieldError(field);
        } else {
            field.classList.remove('border-slate-300', 'dark:border-slate-600');
            field.classList.add('border-red-500');
            this.showFieldError(field, errorMessage);
        }
        
        return isValid;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        this.removeFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-sm text-red-600 dark:text-red-400 mt-1';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Remove field error
     */
    removeFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Store original data before editing
     */
    storeOriginalData() {
        const textElements = document.querySelectorAll('p.font-medium');
        this.originalData = {};
        
        textElements.forEach((element, index) => {
            this.originalData[index] = element.textContent.trim();
        });
    }

    /**
     * Convert text elements to inputs
     */
    convertToInputs() {
        const textElements = document.querySelectorAll('p.font-medium');
        textElements.forEach(element => {
            this.convertTextToInput(element);
        });
    }

    /**
     * Convert inputs back to text
     */
    convertToText() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input !== this.fileInput) {
                this.convertInputToText(input);
            }
        });
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            if (input === this.fileInput) continue;
            
            const originalValue = input.dataset.originalContent || '';
            if (input.value.trim() !== originalValue) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Save changes
     */
    async saveChanges() {
        if (!this.validateAllFields()) {
            this.showNotification('Please fix all validation errors before saving.', 'error');
            return;
        }
        
        // Show loading state
        this.showLoadingState();
        
        try {
            // Simulate API call
            await this.simulateSave();
            
            this.showNotification('Profile updated successfully!', 'success');
            
            // Update original data
            this.storeOriginalData();
            
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error saving profile. Please try again.', 'error');
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Validate all fields
     */
    validateAllFields() {
        const inputs = document.querySelectorAll('input, select, textarea');
        let allValid = true;
        
        inputs.forEach(input => {
            if (input !== this.fileInput) {
                if (!this.validateField(input)) {
                    allValid = false;
                }
            }
        });
        
        return allValid;
    }

    /**
     * Simulate save operation
     */
    simulateSave() {
        return new Promise(resolve => {
            setTimeout(resolve, 1500);
        });
    }

    /**
     * Show edit actions
     */
    showEditActions() {
        // Implementation would add save/cancel buttons
        console.log('Showing edit actions');
    }

    /**
     * Hide edit actions
     */
    hideEditActions() {
        // Implementation would hide save/cancel buttons
        console.log('Hiding edit actions');
    }

    /**
     * Load profile data
     */
    async loadProfileData() {
        try {
            // Simulate API call to load profile data
            await this.simulateDataLoad();
            
            // Update UI with loaded data
            this.updateProfileUI();
            
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showNotification('Error loading profile data.', 'error');
        }
    }

    /**
     * Simulate data loading
     */
    simulateDataLoad() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    /**
     * Update profile UI with loaded data
     */
    updateProfileUI() {
        // In a real implementation, this would update the UI with actual data
        console.log('Profile data loaded and UI updated');
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const editButton = document.getElementById('edit-profile-btn');
        if (editButton) {
            editButton.disabled = true;
            editButton.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Saving...';
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const editButton = document.getElementById('edit-profile-btn');
        if (editButton) {
            editButton.disabled = false;
            if (this.isEditing) {
                editButton.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Save Changes';
            } else {
                editButton.innerHTML = '<span class="material-symbols-outlined text-sm">edit</span> Edit Profile';
            }
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        }[type] || 'bg-blue-500';
        
        notification.classList.add(bgColor);
        notification.innerHTML = `
            <div class="flex items-center text-white">
                <span class="material-symbols-outlined mr-2">
                    ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
                </span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize profile manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh data when page becomes visible
        console.log('Page became visible, refreshing profile data');
    }
});