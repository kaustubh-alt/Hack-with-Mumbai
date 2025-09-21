/**
 * Authentication Service
 * Centralized authentication management for the Blood Bank System
 */

import { 
    getAuth, 
    onAuthStateChanged, 
    signOut,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class AuthService {
    constructor() {
        this.auth = getAuth();
        this.db = getFirestore();
        this.currentUser = null;
        this.userRole = null;
        this.init();
    }

    /**
     * Initialize authentication service
     */
    init() {
        this.setupAuthStateListener();
    }

    /**
     * Setup authentication state listener
     */
    setupAuthStateListener() {
        onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserRole();
                this.handleAuthenticatedUser();
            } else {
                this.currentUser = null;
                this.userRole = null;
                this.handleUnauthenticatedUser();
            }
        });
    }

    /**
     * Load user role from Firestore
     */
    async loadUserRole() {
        if (!this.currentUser) return;

        try {
            const userDoc = await getDoc(doc(this.db, 'users', this.currentUser.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.userRole = userData.role;
                
                // Set custom claims for security rules
                if (userData.role === 'blood_bank') {
                    // Load additional blood bank data
                    const bloodBankDoc = await getDoc(doc(this.db, 'blood_banks', this.currentUser.uid));
                    if (bloodBankDoc.exists()) {
                        this.bloodBankData = bloodBankDoc.data();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user role:', error);
        }
    }

    /**
     * Handle authenticated user
     */
    handleAuthenticatedUser() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Redirect based on role and current page
        if (currentPage === 'login.html' || currentPage === 'register.html') {
            this.redirectToDashboard();
        }
        
        // Update UI for authenticated state
        this.updateUIForAuthenticatedUser();
    }

    /**
     * Handle unauthenticated user
     */
    handleUnauthenticatedUser() {
        const currentPage = window.location.pathname.split('/').pop();
        const publicPages = ['login.html', 'register.html', 'bb_register.html', 'forgot-password.html', 'index.html'];
        
        // Redirect to login if on protected page
        if (!publicPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }

    /**
     * Redirect to appropriate dashboard
     */
    redirectToDashboard() {
        switch (this.userRole) {
            case 'user':
                window.location.href = 'dashboard.html';
                break;
            case 'blood_bank':
                window.location.href = 'bb_dashboard.html';
                break;
            case 'admin':
                window.location.href = 'admin_dashboard.html';
                break;
            default:
                window.location.href = 'dashboard.html';
        }
    }

    /**
     * Update UI for authenticated user
     */
    updateUIForAuthenticatedUser() {
        // Update user info in sidebar if present
        const userNameElements = document.querySelectorAll('.user-display-name');
        const userRoleElements = document.querySelectorAll('.user-role');
        
        if (this.currentUser) {
            userNameElements.forEach(element => {
                element.textContent = this.currentUser.displayName || 'User';
            });
            
            userRoleElements.forEach(element => {
                element.textContent = this.formatRole(this.userRole);
            });
        }
    }

    /**
     * Sign out user
     */
    async signOutUser() {
        try {
            await signOut(this.auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    /**
     * Check if user has specific role
     */
    hasRole(role) {
        return this.userRole === role;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Get current user data
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get user role
     */
    getUserRole() {
        return this.userRole;
    }

    /**
     * Format role for display
     */
    formatRole(role) {
        const roleMap = {
            user: 'Donor',
            blood_bank: 'Blood Bank',
            admin: 'Administrator'
        };
        return roleMap[role] || 'User';
    }

    /**
     * Phone authentication helper
     */
    async authenticateWithPhone(phoneNumber, recaptchaVerifier) {
        try {
            const confirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, recaptchaVerifier);
            return confirmationResult;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Email authentication helper
     */
    async authenticateWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create reCAPTCHA verifier
     */
    createRecaptchaVerifier(containerId, options = {}) {
        const defaultOptions = {
            size: 'invisible',
            callback: (response) => {
                console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
                console.log('reCAPTCHA expired');
            }
        };

        return new RecaptchaVerifier(this.auth, containerId, { ...defaultOptions, ...options });
    }
}

// Create global auth service instance
window.authService = new AuthService();

// Export for use in other modules
export { AuthService };
export default window.authService;