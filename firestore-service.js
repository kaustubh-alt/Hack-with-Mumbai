/**
 * Firestore Service
 * Centralized database operations for the Blood Bank System
 */

import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    onSnapshot,
    serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class FirestoreService {
    constructor() {
        this.db = getFirestore();
        this.listeners = new Map();
    }

    /**
     * User Management
     */
    
    // Create new user
    async createUser(userId, userData) {
        try {
            const userWithTimestamp = {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            await setDoc(doc(this.db, 'users', userId), userWithTimestamp);
            return { success: true, id: userId };
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error('Failed to create user account.');
        }
    }

    // Get user by ID
    async getUser(userId) {
        try {
            const userDoc = await getDoc(doc(this.db, 'users', userId));
            return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
        } catch (error) {
            console.error('Error getting user:', error);
            throw new Error('Failed to retrieve user data.');
        }
    }

    // Update user
    async updateUser(userId, updateData) {
        try {
            const dataWithTimestamp = {
                ...updateData,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(doc(this.db, 'users', userId), dataWithTimestamp);
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Failed to update user data.');
        }
    }

    /**
     * Blood Bank Management
     */
    
    // Create new blood bank
    async createBloodBank(bloodBankId, bloodBankData) {
        try {
            const dataWithTimestamp = {
                ...bloodBankData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            await setDoc(doc(this.db, 'blood_banks', bloodBankId), dataWithTimestamp);
            return { success: true, id: bloodBankId };
        } catch (error) {
            console.error('Error creating blood bank:', error);
            throw new Error('Failed to register blood bank.');
        }
    }

    // Get blood bank by ID
    async getBloodBank(bloodBankId) {
        try {
            const bloodBankDoc = await getDoc(doc(this.db, 'blood_banks', bloodBankId));
            return bloodBankDoc.exists() ? { id: bloodBankDoc.id, ...bloodBankDoc.data() } : null;
        } catch (error) {
            console.error('Error getting blood bank:', error);
            throw new Error('Failed to retrieve blood bank data.');
        }
    }

    // Check if license number exists
    async checkLicenseExists(licenseNumber) {
        try {
            const q = query(
                collection(this.db, 'blood_banks'),
                where('licenseNumber', '==', licenseNumber)
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking license:', error);
            return false;
        }
    }

    /**
     * Blood Requests Management
     */
    
    // Create blood request
    async createBloodRequest(requestData) {
        try {
            const dataWithTimestamp = {
                ...requestData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'active'
            };
            
            const docRef = await addDoc(collection(this.db, 'bloodRequests'), dataWithTimestamp);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating blood request:', error);
            throw new Error('Failed to create blood request.');
        }
    }

    // Get active blood requests
    async getActiveBloodRequests(filters = {}) {
        try {
            let q = query(
                collection(this.db, 'bloodRequests'),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );

            // Apply filters
            if (filters.bloodType) {
                q = query(q, where('bloodType', '==', filters.bloodType));
            }
            
            if (filters.urgency) {
                q = query(q, where('urgency', '==', filters.urgency));
            }

            if (filters.limit) {
                q = query(q, limit(filters.limit));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting blood requests:', error);
            throw new Error('Failed to retrieve blood requests.');
        }
    }

    /**
     * Donation Management
     */
    
    // Record donation
    async recordDonation(donationData) {
        try {
            const dataWithTimestamp = {
                ...donationData,
                createdAt: serverTimestamp(),
                status: 'completed'
            };
            
            const docRef = await addDoc(collection(this.db, 'donations'), dataWithTimestamp);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error recording donation:', error);
            throw new Error('Failed to record donation.');
        }
    }

    // Get user donation history
    async getUserDonationHistory(userId, limitCount = 10) {
        try {
            const q = query(
                collection(this.db, 'donations'),
                where('donorId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting donation history:', error);
            throw new Error('Failed to retrieve donation history.');
        }
    }

    /**
     * Inventory Management
     */
    
    // Update blood inventory
    async updateBloodInventory(bloodBankId, inventoryData) {
        try {
            const dataWithTimestamp = {
                ...inventoryData,
                bloodBankId,
                updatedAt: serverTimestamp()
            };
            
            await setDoc(doc(this.db, 'inventory', `${bloodBankId}_${inventoryData.bloodType}`), dataWithTimestamp);
            return { success: true };
        } catch (error) {
            console.error('Error updating inventory:', error);
            throw new Error('Failed to update blood inventory.');
        }
    }

    // Get blood inventory
    async getBloodInventory(bloodBankId) {
        try {
            const q = query(
                collection(this.db, 'inventory'),
                where('bloodBankId', '==', bloodBankId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting inventory:', error);
            throw new Error('Failed to retrieve blood inventory.');
        }
    }

    /**
     * Real-time Listeners
     */
    
    // Listen to blood requests
    listenToBloodRequests(callback, filters = {}) {
        let q = query(
            collection(this.db, 'bloodRequests'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(requests);
        }, (error) => {
            console.error('Error listening to blood requests:', error);
        });

        this.listeners.set('bloodRequests', unsubscribe);
        return unsubscribe;
    }

    // Listen to inventory changes
    listenToInventory(bloodBankId, callback) {
        const q = query(
            collection(this.db, 'inventory'),
            where('bloodBankId', '==', bloodBankId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const inventory = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(inventory);
        }, (error) => {
            console.error('Error listening to inventory:', error);
        });

        this.listeners.set(`inventory_${bloodBankId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Batch Operations
     */
    
    // Batch write operations
    async batchWrite(operations) {
        try {
            const batch = writeBatch(this.db);
            
            operations.forEach(operation => {
                const { type, ref, data } = operation;
                
                switch (type) {
                    case 'set':
                        batch.set(ref, { ...data, updatedAt: serverTimestamp() });
                        break;
                    case 'update':
                        batch.update(ref, { ...data, updatedAt: serverTimestamp() });
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                }
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error in batch write:', error);
            throw new Error('Failed to perform batch operation.');
        }
    }

    /**
     * Search and Query Helpers
     */
    
    // Search donors by blood type
    async searchDonorsByBloodType(bloodType, limitCount = 50) {
        try {
            const q = query(
                collection(this.db, 'donors'),
                where('bloodType', '==', bloodType),
                where('status', '==', 'eligible'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error searching donors:', error);
            throw new Error('Failed to search donors.');
        }
    }

    // Get nearby blood banks (simplified - in production would use geospatial queries)
    async getNearbyBloodBanks(limitCount = 10) {
        try {
            const q = query(
                collection(this.db, 'blood_banks'),
                where('status', '==', 'verified'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting nearby blood banks:', error);
            throw new Error('Failed to retrieve nearby blood banks.');
        }
    }

    /**
     * Cleanup
     */
    
    // Remove all listeners
    removeAllListeners() {
        this.listeners.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.listeners.clear();
    }

    // Remove specific listener
    removeListener(key) {
        const unsubscribe = this.listeners.get(key);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(key);
        }
    }
}

// Create global Firestore service instance
window.firestoreService = new FirestoreService();

// Export for use in other modules
export { FirestoreService };
export default window.firestoreService;