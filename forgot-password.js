/**
 * Forgot Password Page JavaScript
 * Handles form validation, submission, and user feedback
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const form = document.getElementById('forgot-password-form');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const emailError = document.getElementById('email-error');

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Validates email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    function validateEmail(email) {
        return emailRegex.test(email.trim());
    }

    /**
     * Shows loading state on submit button
     */
    function showLoadingState() {
        submitBtn.disabled = true;
        submitText.textContent = 'Sending...';
        loadingSpinner.classList.remove('hidden');
    }

    /**
     * Hides loading state on submit button
     */
    function hideLoadingState() {
        submitBtn.disabled = false;
        submitText.textContent = 'Send Reset Link';
        loadingSpinner.classList.add('hidden');
    }

    /**
     * Shows success message
     * @param {string} email - Email address for personalized message
     */
    function showSuccessMessage(email) {
        hideAllMessages();
        const successText = successMessage.querySelector('p');
        successText.textContent = `Password reset instructions have been sent to ${email}`;
        successMessage.classList.remove('hidden');
        
        // Scroll to top to ensure message is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Shows error message
     * @param {string} message - Error message to display
     */
    function showErrorMessage(message) {
        hideAllMessages();
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        
        // Scroll to top to ensure message is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Hides all status messages
     */
    function hideAllMessages() {
        successMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        emailError.classList.add('hidden');
    }

    /**
     * Shows email validation error
     */
    function showEmailError() {
        emailError.classList.remove('hidden');
        emailInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        emailInput.classList.remove('border-gray-300', 'focus:border-primary', 'focus:ring-primary');
    }

    /**
     * Hides email validation error
     */
    function hideEmailError() {
        emailError.classList.add('hidden');
        emailInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        emailInput.classList.add('border-gray-300', 'focus:border-primary', 'focus:ring-primary');
    }

    /**
     * Simulates password reset request
     * @param {string} email - Email address
     * @returns {Promise} - Promise that resolves/rejects based on simulation
     */
    function simulatePasswordReset(email) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                // Simulate different scenarios based on email
                if (email.includes('invalid')) {
                    reject(new Error('Email address not found in our system.'));
                } else if (email.includes('error')) {
                    reject(new Error('Server error. Please try again later.'));
                } else {
                    resolve({ success: true, email: email });
                }
            }, 2000); // 2 second delay to simulate network request
        });
    }

    // Real-time email validation
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        
        if (email && !validateEmail(email)) {
            showEmailError();
        } else {
            hideEmailError();
        }
    });

    // Clear messages when user starts typing
    emailInput.addEventListener('focus', function() {
        hideAllMessages();
    });

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // Hide previous messages
        hideAllMessages();
        
        // Validate email
        if (!email) {
            showErrorMessage('Please enter your email address.');
            emailInput.focus();
            return;
        }
        
        if (!validateEmail(email)) {
            showEmailError();
            emailInput.focus();
            return;
        }
        
        // Show loading state
        showLoadingState();
        
        try {
            // Simulate password reset request
            await simulatePasswordReset(email);
            
            // Show success message
            showSuccessMessage(email);
            
            // Clear form
            form.reset();
            
            // Optional: Redirect to login page after delay
            setTimeout(() => {
                // Uncomment the line below if you want automatic redirect
                // window.location.href = 'login.html';
            }, 5000);
            
        } catch (error) {
            // Show error message
            showErrorMessage(error.message);
        } finally {
            // Hide loading state
            hideLoadingState();
        }
    });

    // Keyboard accessibility
    document.addEventListener('keydown', function(e) {
        // Close messages with Escape key
        if (e.key === 'Escape') {
            hideAllMessages();
        }
    });

    // Handle browser back/forward navigation
    window.addEventListener('pageshow', function(e) {
        // Reset form state when page is shown (including back navigation)
        hideLoadingState();
        hideAllMessages();
    });
});

/**
 * Utility function to handle responsive behavior
 */
function handleResponsiveLayout() {
    const isMobile = window.innerWidth < 768;
    
    // Add any mobile-specific JavaScript behavior here
    if (isMobile) {
        // Mobile-specific adjustments
        console.log('Mobile layout active');
    } else {
        // Desktop-specific adjustments
        console.log('Desktop layout active');
    }
}

// Handle window resize
window.addEventListener('resize', handleResponsiveLayout);

// Initial layout check
handleResponsiveLayout();