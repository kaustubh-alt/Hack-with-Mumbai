/**
 * Blood Bank Donor Management System JavaScript
 * Handles donor registration, data management, and Firebase integration
 */

// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class DonorManagementSystem {
    constructor() {
        this.db = null;
        this.donors = [];
        this.filteredDonors = [];
        this.currentView = 'table';
        this.currentFilters = {
            bloodType: '',
            status: '',
            location: '',
            search: ''
        };
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.selectedDonors = new Set();
        this.init();
    }

    /**
     * Initialize the donor management system
     */
    async init() {
        try {
            await this.initializeFirebase();
            this.setupSidebar();
            this.setupFilters();
            this.setupViewToggle();
            this.setupModals();
            this.setupActionButtons();
            this.setupBulkActions();
            this.loadDonors();
            this.animateEntries();
        } catch (error) {
            console.error('Error initializing donor management system:', error);
            this.showNotification('Error initializing system. Please refresh the page.', 'error');
        }
    }

    /**
     * Initialize Firebase
     */
    async initializeFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyACa7KS2Bupy2HdJpwZjezkuWi18W6gbIk",
            authDomain: "liquidloveweb.firebaseapp.com",
            projectId: "liquidloveweb",
            storageBucket: "liquidloveweb.firebasestorage.app",
            messagingSenderId: "874984085077",
            appId: "1:874984085077:web:4a70823226e813e35fa6dc",
            measurementId: "G-L18K6DSE0Z"
        };

        try {
            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw new Error('Failed to initialize Firebase');
        }
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
     * Setup filter functionality
     */
    setupFilters() {
        const bloodTypeFilter = document.getElementById('blood-type-filter');
        const statusFilter = document.getElementById('status-filter');
        const locationFilter = document.getElementById('location-filter');
        const searchInput = document.getElementById('search-input');

        bloodTypeFilter?.addEventListener('change', (e) => {
            this.currentFilters.bloodType = e.target.value;
            this.applyFilters();
        });

        statusFilter?.addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.applyFilters();
        });

        locationFilter?.addEventListener('change', (e) => {
            this.currentFilters.location = e.target.value;
            this.applyFilters();
        });

        // Search with debounce
        let searchTimeout;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300);
        });
    }

    /**
     * Setup view toggle functionality
     */
    setupViewToggle() {
        const listViewBtn = document.getElementById('list-view-btn');
        const cardViewBtn = document.getElementById('card-view-btn');

        listViewBtn?.addEventListener('click', () => {
            this.switchView('table');
            this.updateViewButtons(listViewBtn, cardViewBtn);
        });

        cardViewBtn?.addEventListener('click', () => {
            this.switchView('card');
            this.updateViewButtons(cardViewBtn, listViewBtn);
        });
    }

    /**
     * Update view toggle buttons
     */
    updateViewButtons(activeBtn, inactiveBtn) {
        activeBtn.classList.add('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
        activeBtn.classList.remove('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
        
        inactiveBtn.classList.remove('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
        inactiveBtn.classList.add('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
    }

    /**
     * Setup modal functionality
     */
    setupModals() {
        // Send Message Modal
        const sendMessageBtn = document.getElementById('send-message-btn');
        const sendMessageModal = document.getElementById('send-message-modal');
        const closeSendMessageModal = document.getElementById('close-send-message-modal');
        const cancelSendMessage = document.getElementById('cancel-send-message');
        const sendMessageForm = document.getElementById('send-message-form');

        sendMessageBtn?.addEventListener('click', () => {
            this.openSendMessageModal();
        });

        closeSendMessageModal?.addEventListener('click', () => {
            this.closeSendMessageModal();
        });

        cancelSendMessage?.addEventListener('click', () => {
            this.closeSendMessageModal();
        });

        sendMessageForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage(e);
        });

        // Donor Details Modal
        const donorDetailsModal = document.getElementById('donor-details-modal');
        const closeDonorDetailsModal = document.getElementById('close-donor-details-modal');

        closeDonorDetailsModal?.addEventListener('click', () => {
            this.closeDonorDetailsModal();
        });

        // Close modals when clicking outside
        sendMessageModal?.addEventListener('click', (e) => {
            if (e.target === sendMessageModal) {
                this.closeSendMessageModal();
            }
        });

        donorDetailsModal?.addEventListener('click', (e) => {
            if (e.target === donorDetailsModal) {
                this.closeDonorDetailsModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSendMessageModal();
                this.closeDonorDetailsModal();
            }
        });
    }

    /**
     * Setup action buttons
     */
    setupActionButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.textContent === 'View') {
                const row = e.target.closest('tr');
                const donorId = this.getDonorIdFromRow(row);
                this.viewDonorDetails(donorId);
            } else if (e.target.textContent === 'Contact') {
                const row = e.target.closest('tr');
                const donorId = this.getDonorIdFromRow(row);
                this.contactDonor(donorId);
            } else if (e.target.textContent === 'Invite') {
                const row = e.target.closest('tr');
                const donorId = this.getDonorIdFromRow(row);
                this.inviteDonor(donorId);
            }
        });

        // Export button
        const exportBtn = document.getElementById('export-donors-btn');
        exportBtn?.addEventListener('click', () => {
            this.exportDonors();
        });
    }

    /**
     * Setup bulk actions
     */
    setupBulkActions() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-donors');
        selectAllCheckbox?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Individual donor checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('donor-checkbox')) {
                this.toggleDonorSelection(e.target);
            }
        });
    }

    /**
     * Load donors from Firestore
     */
    async loadDonors() {
        try {
            this.showLoadingState();
            
            const donorsRef = collection(this.db, 'donors');
            const q = query(donorsRef, orderBy('registrationDate', 'desc'));
            
            const querySnapshot = await getDocs(q);
            this.donors = [];
            
            querySnapshot.forEach((doc) => {
                this.donors.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.filteredDonors = [...this.donors];
            this.updateSummaryCards();
            this.renderDonors();
            
        } catch (error) {
            console.error('Error loading donors:', error);
            this.showErrorState();
            
            // Fallback to mock data if Firebase fails
            this.loadMockData();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Load mock data as fallback
     */
    loadMockData() {
        this.donors = [
            {
                id: '1',
                firstName: 'Sarah',
                lastName: 'Miller',
                email: 'sarah.miller@email.com',
                phone: '(555) 123-4567',
                bloodType: 'O+',
                status: 'eligible',
                lastDonation: '2023-12-15',
                totalDonations: 5,
                registrationDate: '2023-01-15',
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001'
                },
                medicalInfo: {
                    weight: 140,
                    height: '5\'6"',
                    allergies: 'None',
                    medications: 'None'
                },
                contactPreferences: ['email', 'sms'],
                emergencyContact: {
                    name: 'John Miller',
                    phone: '(555) 987-6543',
                    relationship: 'Spouse'
                }
            },
            {
                id: '2',
                firstName: 'Michael',
                lastName: 'Johnson',
                email: 'm.johnson@email.com',
                phone: '(555) 234-5678',
                bloodType: 'A+',
                status: 'deferred',
                lastDonation: '2023-11-08',
                totalDonations: 3,
                registrationDate: '2023-03-20',
                address: {
                    street: '456 Oak Ave',
                    city: 'Brooklyn',
                    state: 'NY',
                    zipCode: '11201'
                },
                medicalInfo: {
                    weight: 180,
                    height: '6\'0"',
                    allergies: 'Penicillin',
                    medications: 'Blood pressure medication'
                },
                contactPreferences: ['email'],
                emergencyContact: {
                    name: 'Lisa Johnson',
                    phone: '(555) 876-5432',
                    relationship: 'Wife'
                }
            },
            {
                id: '3',
                firstName: 'Emily',
                lastName: 'Rodriguez',
                email: 'emily.r@email.com',
                phone: '(555) 345-6789',
                bloodType: 'O-',
                status: 'eligible',
                lastDonation: '2024-01-22',
                totalDonations: 8,
                registrationDate: '2022-08-10',
                address: {
                    street: '789 Pine St',
                    city: 'Queens',
                    state: 'NY',
                    zipCode: '11375'
                },
                medicalInfo: {
                    weight: 125,
                    height: '5\'4"',
                    allergies: 'None',
                    medications: 'Vitamins'
                },
                contactPreferences: ['email', 'sms', 'phone'],
                emergencyContact: {
                    name: 'Carlos Rodriguez',
                    phone: '(555) 765-4321',
                    relationship: 'Brother'
                }
            }
        ];

        this.filteredDonors = [...this.donors];
        this.updateSummaryCards();
        this.renderDonors();
    }

    /**
     * Register new donor
     */
    async registerDonor(donorData) {
        try {
            // Validate donor data
            const validationResult = this.validateDonorData(donorData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.errors.join(', '));
            }

            // Add registration date and initial status
            const donorRecord = {
                ...donorData,
                registrationDate: new Date().toISOString(),
                status: 'pending',
                totalDonations: 0,
                lastDonation: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Add to Firestore
            const docRef = await addDoc(collection(this.db, 'donors'), donorRecord);
            
            // Add to local array
            this.donors.unshift({
                id: docRef.id,
                ...donorRecord
            });

            this.applyFilters();
            this.updateSummaryCards();
            
            return { success: true, id: docRef.id };
            
        } catch (error) {
            console.error('Error registering donor:', error);
            throw error;
        }
    }

    /**
     * Update donor information
     */
    async updateDonor(donorId, updateData) {
        try {
            const donorRef = doc(this.db, 'donors', donorId);
            const updateRecord = {
                ...updateData,
                updatedAt: new Date()
            };

            await updateDoc(donorRef, updateRecord);

            // Update local array
            const donorIndex = this.donors.findIndex(d => d.id === donorId);
            if (donorIndex !== -1) {
                this.donors[donorIndex] = { ...this.donors[donorIndex], ...updateRecord };
            }

            this.applyFilters();
            this.showNotification('Donor information updated successfully', 'success');
            
        } catch (error) {
            console.error('Error updating donor:', error);
            this.showNotification('Error updating donor information', 'error');
        }
    }

    /**
     * Delete donor
     */
    async deleteDonor(donorId) {
        try {
            await deleteDoc(doc(this.db, 'donors', donorId));

            // Remove from local array
            this.donors = this.donors.filter(d => d.id !== donorId);
            this.applyFilters();
            this.updateSummaryCards();
            
            this.showNotification('Donor removed successfully', 'success');
            
        } catch (error) {
            console.error('Error deleting donor:', error);
            this.showNotification('Error removing donor', 'error');
        }
    }

    /**
     * Validate donor data
     */
    validateDonorData(data) {
        const errors = [];

        // Required fields
        if (!data.firstName?.trim()) errors.push('First name is required');
        if (!data.lastName?.trim()) errors.push('Last name is required');
        if (!data.email?.trim()) errors.push('Email is required');
        if (!data.phone?.trim()) errors.push('Phone number is required');
        if (!data.bloodType) errors.push('Blood type is required');
        if (!data.dateOfBirth) errors.push('Date of birth is required');

        // Email validation
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Invalid email format');
        }

        // Phone validation
        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push('Invalid phone number format');
        }

        // Age validation
        if (data.dateOfBirth) {
            const age = this.calculateAge(data.dateOfBirth);
            if (age < 16) {
                errors.push('Donor must be at least 16 years old');
            }
            if (age > 80) {
                errors.push('Donor must be under 80 years old');
            }
        }

        // Weight validation
        if (data.weight && (data.weight < 110 || data.weight > 500)) {
            errors.push('Weight must be between 110 and 500 pounds');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Apply filters to donor list
     */
    applyFilters() {
        this.filteredDonors = this.donors.filter(donor => {
            // Blood type filter
            if (this.currentFilters.bloodType && donor.bloodType !== this.currentFilters.bloodType) {
                return false;
            }

            // Status filter
            if (this.currentFilters.status && donor.status !== this.currentFilters.status) {
                return false;
            }

            // Location filter
            if (this.currentFilters.location) {
                const location = donor.address?.city?.toLowerCase() || '';
                if (!location.includes(this.currentFilters.location.toLowerCase())) {
                    return false;
                }
            }

            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${donor.firstName} ${donor.lastName} ${donor.email} ${donor.phone}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.renderDonors();
        this.updateSummaryCards();
    }

    /**
     * Render donors based on current view
     */
    renderDonors() {
        if (this.currentView === 'table') {
            this.renderTableView();
        } else {
            this.renderCardView();
        }
    }

    /**
     * Render table view
     */
    renderTableView() {
        const tableView = document.getElementById('table-view');
        const cardView = document.getElementById('card-view');
        
        if (tableView) tableView.classList.remove('hidden');
        if (cardView) cardView.classList.add('hidden');

        const tbody = document.querySelector('#table-view tbody');
        if (!tbody) return;

        if (this.filteredDonors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center">
                        <div class="empty-state">
                            <span class="material-symbols-outlined icon">group_off</span>
                            <p>No donors found matching your criteria.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedDonors = this.filteredDonors.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedDonors.map(donor => `
            <tr class="donor-row" data-donor-id="${donor.id}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <input type="checkbox" class="donor-checkbox rounded border-slate-300 text-primary-600 focus:ring-primary-600 mr-3" data-donor-id="${donor.id}">
                        <img class="h-10 w-10 rounded-full donor-avatar" src="${this.getAvatarUrl(donor)}" alt="${donor.firstName} ${donor.lastName}">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-text-light dark:text-text-dark">${donor.firstName} ${donor.lastName}</div>
                            <div class="text-sm text-text-muted-light dark:text-text-muted-dark">${donor.email}</div>
                            <div class="text-xs text-text-muted-light dark:text-text-muted-dark">ID: ${donor.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="blood-type-badge">${donor.bloodType}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${this.getStatusClasses(donor.status)}">
                        ${this.formatStatus(donor.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-muted-light dark:text-text-muted-dark">
                    ${donor.lastDonation ? this.formatDate(donor.lastDonation) : 'Never'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-light dark:text-text-dark">
                    <span class="donation-count">${donor.totalDonations} donations</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-primary-600 hover:text-primary-900 mr-3 donor-action-btn">View</button>
                    <button class="text-blue-600 hover:text-blue-900 mr-3 donor-action-btn">Contact</button>
                    <button class="text-green-600 hover:text-green-900 donor-action-btn">Invite</button>
                </td>
            </tr>
        `).join('');

        // Animate rows
        setTimeout(() => {
            document.querySelectorAll('.donor-row').forEach(row => {
                row.classList.add('loaded');
            });
        }, 100);

        this.updatePagination();
    }

    /**
     * Render card view
     */
    renderCardView() {
        const tableView = document.getElementById('table-view');
        const cardView = document.getElementById('card-view');
        
        if (tableView) tableView.classList.add('hidden');
        if (cardView) cardView.classList.remove('hidden');

        if (this.filteredDonors.length === 0) {
            cardView.innerHTML = `
                <div class="col-span-full">
                    <div class="empty-state">
                        <span class="material-symbols-outlined icon">group_off</span>
                        <p>No donors found matching your criteria.</p>
                    </div>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedDonors = this.filteredDonors.slice(startIndex, endIndex);

        cardView.innerHTML = paginatedDonors.map(donor => `
            <div class="donor-card" data-donor-id="${donor.id}">
                <div class="flex items-start gap-4">
                    <img class="donor-avatar" src="${this.getAvatarUrl(donor)}" alt="${donor.firstName} ${donor.lastName}">
                    <div class="donor-info">
                        <h3 class="donor-name">${donor.firstName} ${donor.lastName}</h3>
                        <p class="text-sm text-text-muted-light dark:text-text-muted-dark">${donor.email}</p>
                        <div class="donor-details">
                            <div class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">bloodtype</span>
                                <span class="blood-type-badge">${donor.bloodType}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">location_on</span>
                                <span>${donor.address?.city || 'Unknown'}, ${donor.address?.state || ''}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">volunteer_activism</span>
                                <span>${donor.totalDonations} donations</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">schedule</span>
                                <span>Last: ${donor.lastDonation ? this.formatDate(donor.lastDonation) : 'Never'}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-3">
                            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${this.getStatusClasses(donor.status)}">
                                ${this.formatStatus(donor.status)}
                            </span>
                            ${donor.totalDonations >= 5 ? '<span class="regular-donor text-xs">Regular Donor</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button class="flex-1 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors" onclick="donorManager.viewDonorDetails('${donor.id}')">
                        View Details
                    </button>
                    <button class="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="donorManager.contactDonor('${donor.id}')">
                        Contact
                    </button>
                </div>
            </div>
        `).join('');

        // Animate cards
        setTimeout(() => {
            document.querySelectorAll('.donor-card').forEach(card => {
                card.classList.add('loaded');
            });
        }, 100);

        this.updatePagination();
    }

    /**
     * Switch between table and card views
     */
    switchView(view) {
        this.currentView = view;
        this.renderDonors();
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const totalDonors = this.donors.length;
        const activeDonors = this.donors.filter(d => d.status === 'eligible').length;
        const newThisMonth = this.donors.filter(d => {
            const regDate = new Date(d.registrationDate);
            const now = new Date();
            return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
        }).length;
        const regularDonors = this.donors.filter(d => d.totalDonations >= 5).length;

        // Update DOM elements
        this.updateCardValue('total-donors', totalDonors);
        this.updateCardValue('active-donors', activeDonors);
        this.updateCardValue('new-donors', newThisMonth);
        this.updateCardValue('regular-donors', regularDonors);
    }

    /**
     * Update card value with animation
     */
    updateCardValue(cardId, value) {
        const elements = document.querySelectorAll(`[data-card="${cardId}"]`);
        elements.forEach(element => {
            element.classList.add('data-update');
            element.textContent = value.toLocaleString();
            
            setTimeout(() => {
                element.classList.remove('data-update');
            }, 500);
        });
    }

    /**
     * View donor details
     */
    viewDonorDetails(donorId) {
        const donor = this.donors.find(d => d.id === donorId);
        if (!donor) return;

        this.openDonorDetailsModal(donor);
    }

    /**
     * Contact donor
     */
    contactDonor(donorId) {
        const donor = this.donors.find(d => d.id === donorId);
        if (!donor) return;

        // Show contact options
        const contactMethods = donor.contactPreferences || ['email'];
        
        if (contactMethods.includes('phone')) {
            window.open(`tel:${donor.phone}`, '_self');
        } else if (contactMethods.includes('email')) {
            window.open(`mailto:${donor.email}`, '_blank');
        } else {
            this.showNotification('No contact method available for this donor', 'info');
        }
    }

    /**
     * Invite donor
     */
    inviteDonor(donorId) {
        const donor = this.donors.find(d => d.id === donorId);
        if (!donor) return;

        this.showNotification(`Invitation sent to ${donor.firstName} ${donor.lastName}`, 'success');
        
        // In a real implementation, this would send an actual invitation
        console.log(`Sending invitation to donor ${donorId}`);
    }

    /**
     * Open donor details modal
     */
    openDonorDetailsModal(donor) {
        const modal = document.getElementById('donor-details-modal');
        const content = document.getElementById('donor-details-content');

        const detailsHTML = `
            <div class="space-y-6">
                <div class="flex items-center gap-4">
                    <img class="w-20 h-20 rounded-full object-cover border-4 border-primary-100" src="${this.getAvatarUrl(donor)}" alt="${donor.firstName} ${donor.lastName}">
                    <div>
                        <h4 class="text-xl font-bold text-text-light dark:text-text-dark">${donor.firstName} ${donor.lastName}</h4>
                        <p class="text-text-muted-light dark:text-text-muted-dark">${donor.email}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <span class="blood-type-badge">${donor.bloodType}</span>
                            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${this.getStatusClasses(donor.status)}">
                                ${this.formatStatus(donor.status)}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="donor-details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${donor.phone}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Total Donations</div>
                        <div class="detail-value">${donor.totalDonations}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Last Donation</div>
                        <div class="detail-value">${donor.lastDonation ? this.formatDate(donor.lastDonation) : 'Never'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Registration Date</div>
                        <div class="detail-value">${this.formatDate(donor.registrationDate)}</div>
                    </div>
                </div>

                ${donor.address ? `
                    <div class="detail-item">
                        <div class="detail-label">Address</div>
                        <div class="detail-value">
                            ${donor.address.street}<br>
                            ${donor.address.city}, ${donor.address.state} ${donor.address.zipCode}
                        </div>
                    </div>
                ` : ''}

                ${donor.medicalInfo ? `
                    <div class="medical-info">
                        <h5 class="font-semibold text-text-light dark:text-text-dark mb-3">Medical Information</h5>
                        <div class="donor-details-grid">
                            <div class="detail-item">
                                <div class="detail-label">Weight</div>
                                <div class="detail-value">${donor.medicalInfo.weight} lbs</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Height</div>
                                <div class="detail-value">${donor.medicalInfo.height}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Allergies</div>
                                <div class="detail-value">${donor.medicalInfo.allergies || 'None'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Medications</div>
                                <div class="detail-value">${donor.medicalInfo.medications || 'None'}</div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${donor.emergencyContact ? `
                    <div class="detail-item">
                        <div class="detail-label">Emergency Contact</div>
                        <div class="detail-value">
                            ${donor.emergencyContact.name} (${donor.emergencyContact.relationship})<br>
                            ${donor.emergencyContact.phone}
                        </div>
                    </div>
                ` : ''}

                <div class="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button class="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors" onclick="donorManager.editDonor('${donor.id}')">
                        Edit Donor
                    </button>
                    <button class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors" onclick="donorManager.contactDonor('${donor.id}')">
                        Contact
                    </button>
                    <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="donorManager.generateDonorReport('${donor.id}')">
                        Generate Report
                    </button>
                </div>
            </div>
        `;

        content.innerHTML = detailsHTML;
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close donor details modal
     */
    closeDonorDetailsModal() {
        const modal = document.getElementById('donor-details-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }

    /**
     * Open send message modal
     */
    openSendMessageModal() {
        const modal = document.getElementById('send-message-modal');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close send message modal
     */
    closeSendMessageModal() {
        const modal = document.getElementById('send-message-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
        
        // Reset form
        const form = document.getElementById('send-message-form');
        form.reset();
    }

    /**
     * Handle send message form submission
     */
    async handleSendMessage(event) {
        const formData = new FormData(event.target);
        const messageData = Object.fromEntries(formData.entries());
        
        try {
            // Show loading state
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner mr-2"></span>Sending...';
            
            // Simulate sending message
            await this.sendMessage(messageData);
            
            this.showNotification('Message sent successfully to selected donors!', 'success');
            this.closeSendMessageModal();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Error sending message. Please try again.', 'error');
        }
    }

    /**
     * Send message to donors
     */
    async sendMessage(messageData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In a real implementation, this would send messages via email/SMS service
        console.log('Sending message:', messageData);
        
        return { success: true };
    }

    /**
     * Toggle select all donors
     */
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.donor-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            this.toggleDonorSelection(checkbox, false);
        });
        
        this.updateBulkActions();
    }

    /**
     * Toggle individual donor selection
     */
    toggleDonorSelection(checkbox, updateBulkActions = true) {
        const donorId = checkbox.dataset.donorId;
        
        if (checkbox.checked) {
            this.selectedDonors.add(donorId);
        } else {
            this.selectedDonors.delete(donorId);
        }
        
        if (updateBulkActions) {
            this.updateBulkActions();
        }
    }

    /**
     * Update bulk actions visibility
     */
    updateBulkActions() {
        const bulkActions = document.querySelector('.bulk-actions');
        const selectedCount = this.selectedDonors.size;
        
        if (selectedCount > 0) {
            if (!bulkActions) {
                this.createBulkActionsBar();
            } else {
                bulkActions.classList.add('show');
                bulkActions.querySelector('.bulk-actions-count').textContent = selectedCount;
            }
        } else if (bulkActions) {
            bulkActions.classList.remove('show');
        }
    }

    /**
     * Create bulk actions bar
     */
    createBulkActionsBar() {
        const container = document.querySelector('.mx-auto.max-w-7xl');
        const bulkActionsHTML = `
            <div class="bulk-actions">
                <span class="bulk-actions-count">${this.selectedDonors.size}</span>
                <span class="text-sm">donors selected</span>
                <div class="flex gap-2 ml-auto">
                    <button class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700" onclick="donorManager.bulkContact()">
                        Contact All
                    </button>
                    <button class="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700" onclick="donorManager.bulkInvite()">
                        Invite All
                    </button>
                    <button class="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700" onclick="donorManager.bulkDelete()">
                        Remove All
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', bulkActionsHTML);
    }

    /**
     * Export donors data
     */
    exportDonors() {
        const exportBtn = document.getElementById('export-donors-btn');
        const originalText = exportBtn.innerHTML;
        
        exportBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Exporting...';
        exportBtn.disabled = true;

        setTimeout(() => {
            this.downloadDonorsCSV();
            
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
            
            this.showNotification('Donor data exported successfully!', 'success');
        }, 2000);
    }

    /**
     * Download donors as CSV
     */
    downloadDonorsCSV() {
        const csvContent = this.generateDonorsCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donors-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Generate CSV content
     */
    generateDonorsCSV() {
        const headers = [
            'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Blood Type', 
            'Status', 'Total Donations', 'Last Donation', 'Registration Date',
            'City', 'State', 'Weight', 'Height'
        ];
        
        const rows = this.filteredDonors.map(donor => [
            donor.id,
            donor.firstName,
            donor.lastName,
            donor.email,
            donor.phone,
            donor.bloodType,
            donor.status,
            donor.totalDonations,
            donor.lastDonation || '',
            donor.registrationDate,
            donor.address?.city || '',
            donor.address?.state || '',
            donor.medicalInfo?.weight || '',
            donor.medicalInfo?.height || ''
        ]);
        
        return [
            `Donor Database Export - ${new Date().toLocaleString()}`,
            '',
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
    }

    /**
     * Update pagination
     */
    updatePagination() {
        const totalPages = Math.ceil(this.filteredDonors.length / this.itemsPerPage);
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredDonors.length);

        // Update pagination info
        const paginationInfo = document.querySelector('.text-sm.text-text-muted-light');
        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${this.filteredDonors.length} donors`;
        }

        // Update pagination buttons
        this.updatePaginationButtons(totalPages);
    }

    /**
     * Update pagination buttons
     */
    updatePaginationButtons(totalPages) {
        const paginationContainer = document.querySelector('.flex.items-center.gap-2');
        if (!paginationContainer) return;

        const buttonsHTML = `
            <button class="pagination-btn px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                    onclick="donorManager.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                Previous
            </button>
            ${this.generatePageButtons(totalPages)}
            <button class="pagination-btn px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                    onclick="donorManager.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next
            </button>
        `;

        paginationContainer.innerHTML = buttonsHTML;
    }

    /**
     * Generate page number buttons
     */
    generatePageButtons(totalPages) {
        const buttons = [];
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            buttons.push(`
                <button class="pagination-btn px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                        ? 'bg-primary-600 text-white' 
                        : 'border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark hover:bg-slate-50 dark:hover:bg-slate-800'
                }" onclick="donorManager.goToPage(${i})">
                    ${i}
                </button>
            `);
        }

        return buttons.join('');
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredDonors.length / this.itemsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderDonors();
    }

    /**
     * Bulk contact selected donors
     */
    bulkContact() {
        const selectedDonorsList = Array.from(this.selectedDonors);
        this.showNotification(`Contacting ${selectedDonorsList.length} selected donors`, 'info');
        
        // Clear selection
        this.selectedDonors.clear();
        this.updateBulkActions();
    }

    /**
     * Bulk invite selected donors
     */
    bulkInvite() {
        const selectedDonorsList = Array.from(this.selectedDonors);
        this.showNotification(`Invitations sent to ${selectedDonorsList.length} selected donors`, 'success');
        
        // Clear selection
        this.selectedDonors.clear();
        this.updateBulkActions();
    }

    /**
     * Bulk delete selected donors
     */
    async bulkDelete() {
        const selectedDonorsList = Array.from(this.selectedDonors);
        
        if (confirm(`Are you sure you want to remove ${selectedDonorsList.length} selected donors? This action cannot be undone.`)) {
            try {
                // Delete from Firestore
                const deletePromises = selectedDonorsList.map(donorId => 
                    deleteDoc(doc(this.db, 'donors', donorId))
                );
                
                await Promise.all(deletePromises);
                
                // Remove from local array
                this.donors = this.donors.filter(d => !selectedDonorsList.includes(d.id));
                
                this.selectedDonors.clear();
                this.applyFilters();
                this.updateSummaryCards();
                this.updateBulkActions();
                
                this.showNotification(`${selectedDonorsList.length} donors removed successfully`, 'success');
                
            } catch (error) {
                console.error('Error deleting donors:', error);
                this.showNotification('Error removing donors. Please try again.', 'error');
            }
        }
    }

    /**
     * Animate entries
     */
    animateEntries() {
        const entries = document.querySelectorAll('.donor-row, .donor-card');
        entries.forEach((entry, index) => {
            setTimeout(() => {
                entry.classList.add('loaded');
            }, index * 50);
        });
    }

    /**
     * Utility functions
     */
    getDonorIdFromRow(row) {
        return row.dataset.donorId || row.querySelector('.donor-checkbox')?.dataset.donorId;
    }

    getAvatarUrl(donor) {
        // Generate avatar based on donor name
        const initials = `${donor.firstName?.[0] || ''}${donor.lastName?.[0] || ''}`;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(donor.firstName + ' ' + donor.lastName)}&background=DC2626&color=fff&size=128`;
    }

    getStatusClasses(status) {
        const statusClasses = {
            eligible: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            deferred: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
            pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
        };
        return statusClasses[status] || statusClasses.pending;
    }

    formatStatus(status) {
        const statusMap = {
            eligible: 'Eligible',
            deferred: 'Deferred',
            inactive: 'Inactive',
            pending: 'Pending'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

    isValidPhone(phone) {
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        return phoneRegex.test(phone);
    }

    showLoadingState() {
        const tableBody = document.querySelector('#table-view tbody');
        const cardView = document.getElementById('card-view');
        
        if (tableBody) {
            tableBody.innerHTML = Array(5).fill(0).map(() => `
                <tr>
                    <td colspan="6" class="px-6 py-4">
                        <div class="donor-loading"></div>
                    </td>
                </tr>
            `).join('');
        }
        
        if (cardView) {
            cardView.innerHTML = Array(6).fill(0).map(() => `
                <div class="donor-loading"></div>
            `).join('');
        }
    }

    hideLoadingState() {
        // Loading state is hidden when real content is rendered
    }

    showErrorState() {
        this.showNotification('Error loading donor data. Using offline data.', 'error');
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
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    /**
     * Setup real-time listeners
     */
    setupRealTimeListeners() {
        if (!this.db) return;

        const donorsRef = collection(this.db, 'donors');
        
        onSnapshot(donorsRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newDonor = { id: change.doc.id, ...change.doc.data() };
                    this.donors.unshift(newDonor);
                } else if (change.type === 'modified') {
                    const updatedDonor = { id: change.doc.id, ...change.doc.data() };
                    const index = this.donors.findIndex(d => d.id === updatedDonor.id);
                    if (index !== -1) {
                        this.donors[index] = updatedDonor;
                    }
                } else if (change.type === 'removed') {
                    this.donors = this.donors.filter(d => d.id !== change.doc.id);
                }
            });
            
            this.applyFilters();
            this.updateSummaryCards();
        });
    }

    /**
     * Edit donor
     */
    editDonor(donorId) {
        this.showNotification('Edit donor functionality would open here', 'info');
        // In a real implementation, this would open an edit modal
    }

    /**
     * Generate donor report
     */
    generateDonorReport(donorId) {
        const donor = this.donors.find(d => d.id === donorId);
        if (!donor) return;

        const reportContent = `
DONOR REPORT

Personal Information:
- Name: ${donor.firstName} ${donor.lastName}
- Email: ${donor.email}
- Phone: ${donor.phone}
- Blood Type: ${donor.bloodType}
- Status: ${this.formatStatus(donor.status)}

Donation History:
- Total Donations: ${donor.totalDonations}
- Last Donation: ${donor.lastDonation ? this.formatDate(donor.lastDonation) : 'Never'}
- Registration Date: ${this.formatDate(donor.registrationDate)}

Address:
${donor.address ? `${donor.address.street}
${donor.address.city}, ${donor.address.state} ${donor.address.zipCode}` : 'Not provided'}

Medical Information:
${donor.medicalInfo ? `- Weight: ${donor.medicalInfo.weight} lbs
- Height: ${donor.medicalInfo.height}
- Allergies: ${donor.medicalInfo.allergies || 'None'}
- Medications: ${donor.medicalInfo.medications || 'None'}` : 'Not provided'}

Emergency Contact:
${donor.emergencyContact ? `${donor.emergencyContact.name} (${donor.emergencyContact.relationship})
Phone: ${donor.emergencyContact.phone}` : 'Not provided'}

Generated on: ${new Date().toLocaleString()}
        `;
        
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donor-report-${donor.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Donor report generated and downloaded!', 'success');
    }
}

// Initialize the donor management system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.donorManager = new DonorManagementSystem();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.donorManager) {
        // Refresh data when page becomes visible
        console.log('Page became visible, refreshing donor data');
    }
});

// Export for use in other modules
export { DonorManagementSystem };