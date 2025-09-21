/**
 * Firebase Configuration and Initialization
 * Updated with correct configuration and proper initialization
 */

// Import Firebase v9+ modular SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    connectAuthEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    connectFirestoreEmulator 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration - using the provided config
const firebaseConfig = {
    apiKey: "AIzaSyACa7KS2Bupy2HdJpwZjezkuWi18W6gbIk",
    authDomain: "liquidloveweb.firebaseapp.com",
    projectId: "liquidloveweb",
    storageBucket: "liquidloveweb.firebasestorage.app",
    messagingSenderId: "874984085077",
    appId: "1:874984085077:web:4a70823226e813e35fa6dc",
    measurementId: "G-L18K6DSE0Z"
};

// Initialize Firebase
let app, auth, db;

try {
    console.log('Initializing Firebase with config:', firebaseConfig);
    
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    console.log('✓ Firebase app initialized successfully');
    
    // Initialize Firebase Auth
    auth = getAuth(app);
    console.log('✓ Firebase Auth initialized successfully');
    
    // Initialize Firestore
    db = getFirestore(app);
    console.log('✓ Firestore initialized successfully');
    
    // Optional: Connect to emulators in development
    // Uncomment these lines if you're using Firebase emulators
    /*
    if (location.hostname === 'localhost') {
        connectAuthEmulator(auth, "http://localhost:9099");
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('✓ Connected to Firebase emulators');
    }
    */
    
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
    });
}

// Export Firebase services for use in other modules
export { app, auth, db, firebaseConfig };

// Global error handler for Firebase operations
export const handleFirebaseError = (error) => {
    console.error('Firebase operation failed:', error);
    
    const errorMessages = {
        'auth/email-already-in-use': 'This email address is already registered. Please use a different email or try logging in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Email/password registration is not enabled. Please contact support.',
        'auth/weak-password': 'Password is too weak. Please choose a stronger password with at least 6 characters.',
        'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/api-key-not-valid': 'Firebase API key is invalid. Please check your configuration.',
        'permission-denied': 'You do not have permission to perform this action.',
        'not-found': 'The requested document was not found.',
        'already-exists': 'A document with this ID already exists.',
        'resource-exhausted': 'Quota exceeded. Please try again later.',
        'unauthenticated': 'You must be authenticated to perform this action.',
        'unavailable': 'The service is currently unavailable. Please try again later.',
        'deadline-exceeded': 'The operation took too long. Please try again.',
        'cancelled': 'The operation was cancelled.',
        'invalid-argument': 'Invalid data provided.',
        'failed-precondition': 'The operation failed due to a precondition.',
        'aborted': 'The operation was aborted due to a conflict.',
        'out-of-range': 'The operation was attempted past the valid range.',
        'unimplemented': 'This operation is not implemented.',
        'internal': 'An internal error occurred.',
        'data-loss': 'Unrecoverable data loss or corruption.'
    };

    return errorMessages[error.code] || error.message || 'An unknown error occurred. Please try again.';
};

// Utility function to check if Firebase is properly initialized
export const isFirebaseReady = () => {
    return !!(app && auth && db);
};

console.log('Firebase configuration module loaded successfully');