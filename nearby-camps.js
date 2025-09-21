/**
 * Nearby Camps and Blood Requests Page JavaScript
 * Handles camp listings, blood requests, filtering, and interactive features
 */

class NearbyCampsManager {
    constructor() {
        this.currentView = 'list';
        this.currentFilters = {
            bloodType: '',
            urgency: '',
            distance: '',
            search: ''
        };
        this.currentSort = 'distance';
        this.camps = [];
        this.requests = [];
        this.filteredCamps = [];
        this.filteredRequests = [];
        this.userLocation = { lat: 40.7128, lng: -74.0060 }; // Default to NYC
        this.userBloodType = 'O+'; // From user profile
        this.init();
    }

    /**
     * Initialize the camps manager
     */
    init() {
        this.setupSidebar();
        this.setupFilters();
        this.setupViewToggle();
        this.setupModal();
        this.setupQuickActions();
        this.loadData();
        this.setupRefreshButton();
        this.startRealTimeUpdates();
    }

    /**
     * Setup sidebar functionality (reused from other pages)
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
        const urgencyFilter = document.getElementById('urgency-filter');
        const distanceFilter = document.getElementById('distance-filter');
        const searchInput = document.getElementById('search-input');
        const sortFilter = document.getElementById('sort-filter');
        const clearFiltersBtn = document.getElementById('clear-filters-btn');

        // Filter event listeners
        bloodTypeFilter?.addEventListener('change', (e) => {
            this.currentFilters.bloodType = e.target.value;
            this.applyFilters();
        });

        urgencyFilter?.addEventListener('change', (e) => {
            this.currentFilters.urgency = e.target.value;
            this.applyFilters();
        });

        distanceFilter?.addEventListener('change', (e) => {
            this.currentFilters.distance = e.target.value;
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

        // Sort functionality
        sortFilter?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFilters();
        });

        // Clear filters
        clearFiltersBtn?.addEventListener('click', () => {
            this.clearFilters();
        });
    }

    /**
     * Setup view toggle functionality
     */
    setupViewToggle() {
        const listViewBtn = document.getElementById('list-view-btn');
        const mapViewBtn = document.getElementById('map-view-btn');

        listViewBtn?.addEventListener('click', () => {
            this.switchView('list');
            listViewBtn.classList.add('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
            listViewBtn.classList.remove('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
            mapViewBtn.classList.remove('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
            mapViewBtn.classList.add('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
        });

        mapViewBtn?.addEventListener('click', () => {
            this.switchView('map');
            mapViewBtn.classList.add('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
            mapViewBtn.classList.remove('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
            listViewBtn.classList.remove('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
            listViewBtn.classList.add('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
        });
    }

    /**
     * Setup modal functionality
     */
    setupModal() {
        const modal = document.getElementById('response-modal');
        const closeModal = document.getElementById('close-modal');

        closeModal?.addEventListener('click', () => {
            this.closeModal();
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Setup quick actions
     */
    setupQuickActions() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action')) {
                const action = e.target.closest('.quick-action');
                const actionType = action.querySelector('p').textContent;
                
                switch (actionType) {
                    case 'Find Nearest Camp':
                        this.findNearestCamp();
                        break;
                    case 'Emergency Response':
                        this.handleEmergencyResponse();
                        break;
                    case 'Set Alerts':
                        this.setupAlerts();
                        break;
                }
            }
        });
    }

    /**
     * Setup refresh button
     */
    setupRefreshButton() {
        const refreshBtn = document.getElementById('refresh-data-btn');
        
        refreshBtn?.addEventListener('click', () => {
            this.refreshData();
        });
    }

    /**
     * Load initial data
     */
    async loadData() {
        try {
            this.showLoadingState();
            
            // Simulate API calls
            await Promise.all([
                this.loadCamps(),
                this.loadRequests(),
                this.loadAlerts()
            ]);
            
            this.applyFilters();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Load camps data
     */
    async loadCamps() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.camps = [
            {
                id: 1,
                name: 'City Hospital Blood Drive',
                address: '123 Main St, New York, NY 10001',
                distance: 0.8,
                status: 'open',
                hours: '9:00 AM - 6:00 PM',
                phone: '(555) 123-4567',
                acceptedTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                capacity: 'High',
                waitTime: '15 min',
                coordinates: { lat: 40.7589, lng: -73.9851 }
            },
            {
                id: 2,
                name: 'Community Center Drive',
                address: '456 Oak Ave, New York, NY 10002',
                distance: 1.2,
                status: 'open',
                hours: '10:00 AM - 8:00 PM',
                phone: '(555) 234-5678',
                acceptedTypes: ['O+', 'O-', 'A+', 'B+'],
                capacity: 'Medium',
                waitTime: '25 min',
                coordinates: { lat: 40.7505, lng: -73.9934 }
            },
            {
                id: 3,
                name: 'Mobile Blood Unit #7',
                address: '789 Pine St, New York, NY 10003',
                distance: 2.1,
                status: 'closing-soon',
                hours: '8:00 AM - 4:00 PM',
                phone: '(555) 345-6789',
                acceptedTypes: ['A+', 'O+', 'B+', 'AB+'],
                capacity: 'Low',
                waitTime: '10 min',
                coordinates: { lat: 40.7282, lng: -73.9942 }
            },
            {
                id: 4,
                name: 'University Medical Center',
                address: '321 College Blvd, New York, NY 10004',
                distance: 3.5,
                status: 'open',
                hours: '24/7',
                phone: '(555) 456-7890',
                acceptedTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                capacity: 'High',
                waitTime: '20 min',
                coordinates: { lat: 40.7061, lng: -74.0087 }
            }
        ];
    }

    /**
     * Load blood requests data
     */
    async loadRequests() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        this.requests = [
            {
                id: 1,
                bloodType: 'O-',
                urgency: 'critical',
                quantity: '4 units',
                hospital: 'Emergency General Hospital',
                address: '555 Emergency Ave, New York, NY',
                distance: 1.5,
                timePosted: '5 minutes ago',
                deadline: '2 hours',
                patientInfo: 'Emergency surgery patient',
                contactPhone: '(555) 911-1111',
                coordinates: { lat: 40.7614, lng: -73.9776 }
            },
            {
                id: 2,
                bloodType: 'A+',
                urgency: 'urgent',
                quantity: '2 units',
                hospital: 'St. Mary\'s Medical Center',
                address: '777 Health St, New York, NY',
                distance: 2.3,
                timePosted: '15 minutes ago',
                deadline: '6 hours',
                patientInfo: 'Scheduled surgery',
                contactPhone: '(555) 222-3333',
                coordinates: { lat: 40.7505, lng: -73.9934 }
            },
            {
                id: 3,
                bloodType: 'B-',
                urgency: 'urgent',
                quantity: '3 units',
                hospital: 'Children\'s Hospital',
                address: '999 Kids Way, New York, NY',
                distance: 4.1,
                timePosted: '30 minutes ago',
                deadline: '4 hours',
                patientInfo: 'Pediatric patient',
                contactPhone: '(555) 444-5555',
                coordinates: { lat: 40.7282, lng: -73.9942 }
            },
            {
                id: 4,
                bloodType: 'O+',
                urgency: 'normal',
                quantity: '1 unit',
                hospital: 'Regional Medical Center',
                address: '111 Care Blvd, New York, NY',
                distance: 5.2,
                timePosted: '1 hour ago',
                deadline: '12 hours',
                patientInfo: 'Routine transfusion',
                contactPhone: '(555) 666-7777',
                coordinates: { lat: 40.7061, lng: -74.0087 }
            }
        ];
    }

    /**
     * Load alert notifications
     */
    async loadAlerts() {
        const alertsContainer = document.getElementById('alert-notifications');
        
        const criticalAlerts = this.requests.filter(req => req.urgency === 'critical');
        
        if (criticalAlerts.length > 0) {
            const alertsHTML = criticalAlerts.map(alert => `
                <div class="alert-notification alert-critical rounded-lg p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined text-red-600 dark:text-red-400 mt-0.5">emergency</span>
                        <div class="flex-1">
                            <h3 class="font-semibold text-red-800 dark:text-red-200">Critical Blood Shortage Alert</h3>
                            <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                                ${alert.bloodType} blood urgently needed at ${alert.hospital}. 
                                ${alert.quantity} required within ${alert.deadline}.
                            </p>
                            <div class="flex gap-2 mt-3">
                                <button class="respond-btn action-btn px-4 py-2 rounded-lg text-sm font-medium" 
                                        onclick="nearbyCampsManager.openResponseModal(${alert.id}, 'request')">
                                    Respond Now
                                </button>
                                <button class="contact-btn action-btn px-4 py-2 rounded-lg text-sm font-medium"
                                        onclick="nearbyCampsManager.contactHospital('${alert.contactPhone}')">
                                    Contact Hospital
                                </button>
                            </div>
                        </div>
                        <button class="text-red-400 hover:text-red-600" onclick="this.parentElement.parentElement.remove()">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
            `).join('');
            
            alertsContainer.innerHTML = alertsHTML;
        }
    }

    /**
     * Apply filters and sorting
     */
    applyFilters() {
        // Filter camps
        this.filteredCamps = this.camps.filter(camp => {
            if (this.currentFilters.distance && camp.distance > parseInt(this.currentFilters.distance)) {
                return false;
            }
            
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${camp.name} ${camp.address}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });

        // Filter requests
        this.filteredRequests = this.requests.filter(request => {
            if (this.currentFilters.bloodType && request.bloodType !== this.currentFilters.bloodType) {
                return false;
            }
            
            if (this.currentFilters.urgency && request.urgency !== this.currentFilters.urgency) {
                return false;
            }
            
            if (this.currentFilters.distance && request.distance > parseInt(this.currentFilters.distance)) {
                return false;
            }
            
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${request.hospital} ${request.bloodType}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });

        // Apply sorting
        this.sortData();
        
        // Render filtered data
        this.renderCamps();
        this.renderRequests();
        this.updateStats();
    }

    /**
     * Sort data based on current sort option
     */
    sortData() {
        const sortFunctions = {
            distance: (a, b) => a.distance - b.distance,
            urgency: (a, b) => {
                const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
                return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            },
            time: (a, b) => new Date(a.timePosted) - new Date(b.timePosted)
        };

        if (sortFunctions[this.currentSort]) {
            this.filteredCamps.sort(sortFunctions[this.currentSort]);
            this.filteredRequests.sort(sortFunctions[this.currentSort]);
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {
            bloodType: '',
            urgency: '',
            distance: '',
            search: ''
        };

        // Reset form elements
        document.getElementById('blood-type-filter').value = '';
        document.getElementById('urgency-filter').value = '';
        document.getElementById('distance-filter').value = '';
        document.getElementById('search-input').value = '';

        this.applyFilters();
    }

    /**
     * Render camps list
     */
    renderCamps() {
        const campsContainer = document.getElementById('camps-list');
        
        if (this.filteredCamps.length === 0) {
            campsContainer.innerHTML = `
                <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-text-muted-light dark:text-text-muted-dark mb-4">location_off</span>
                    <p class="text-text-muted-light dark:text-text-muted-dark">No camps found matching your criteria.</p>
                </div>
            `;
            return;
        }

        const campsHTML = this.filteredCamps.map((camp, index) => `
            <div class="camp-card rounded-2xl border border-slate-200 bg-card-light p-6 dark:border-slate-700 dark:bg-card-dark" 
                 style="animation-delay: ${index * 100}ms">
                <div class="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div class="flex items-start gap-4 flex-1">
                        <div class="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 flex-shrink-0">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">local_hospital</span>
                        </div>
                        <div class="flex-1">
                            <div class="flex flex-wrap items-center gap-2 mb-2">
                                <h3 class="font-semibold text-text-light dark:text-text-dark">${camp.name}</h3>
                                <span class="status-${camp.status} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                                    ${this.formatStatus(camp.status)}
                                </span>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-text-muted-light dark:text-text-muted-dark mb-3">
                                <div class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">location_on</span>
                                    <span>${camp.address}</span>
                                </div>
                                <div class="flex items-center gap-1 distance-${this.getDistanceClass(camp.distance)}">
                                    <span class="material-symbols-outlined text-xs">near_me</span>
                                    <span>${camp.distance} miles away</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">schedule</span>
                                    <span>${camp.hours}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">timer</span>
                                    <span>Wait: ${camp.waitTime}</span>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-1 mb-3">
                                ${camp.acceptedTypes.map(type => `
                                    <span class="blood-type-badge ${type === this.userBloodType ? 'compatibility-match' : ''}">${type}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button class="directions-btn action-btn px-4 py-2 rounded-lg text-sm font-medium"
                                onclick="nearbyCampsManager.getDirections(${camp.coordinates.lat}, ${camp.coordinates.lng})">
                            <span class="material-symbols-outlined text-sm mr-1">directions</span>
                            Directions
                        </button>
                        <button class="contact-btn action-btn px-4 py-2 rounded-lg text-sm font-medium"
                                onclick="nearbyCampsManager.contactCamp('${camp.phone}')">
                            <span class="material-symbols-outlined text-sm mr-1">call</span>
                            Contact
                        </button>
                        <button class="respond-btn action-btn px-4 py-2 rounded-lg text-sm font-medium"
                                onclick="nearbyCampsManager.openResponseModal(${camp.id}, 'camp')">
                            <span class="material-symbols-outlined text-sm mr-1">volunteer_activism</span>
                            Book Slot
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        campsContainer.innerHTML = campsHTML;
        
        // Animate cards
        setTimeout(() => {
            document.querySelectorAll('.camp-card').forEach(card => {
                card.classList.add('loaded');
            });
        }, 100);
    }

    /**
     * Render requests list
     */
    renderRequests() {
        const requestsContainer = document.getElementById('requests-list');
        
        if (this.filteredRequests.length === 0) {
            requestsContainer.innerHTML = `
                <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-text-muted-light dark:text-text-muted-dark mb-4">bloodtype</span>
                    <p class="text-text-muted-light dark:text-text-muted-dark">No blood requests found matching your criteria.</p>
                </div>
            `;
            return;
        }

        const requestsHTML = this.filteredRequests.map((request, index) => `
            <div class="request-card rounded-2xl border border-slate-200 bg-card-light p-6 dark:border-slate-700 dark:bg-card-dark ${request.urgency === 'critical' ? 'urgency-critical' : request.urgency === 'urgent' ? 'urgency-urgent' : ''}" 
                 style="animation-delay: ${index * 100}ms">
                <div class="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div class="flex items-start gap-4 flex-1">
                        <div class="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 flex-shrink-0">
                            <span class="material-symbols-outlined text-red-600 dark:text-red-400">bloodtype</span>
                        </div>
                        <div class="flex-1">
                            <div class="flex flex-wrap items-center gap-2 mb-2">
                                <h3 class="font-semibold text-text-light dark:text-text-dark">${request.hospital}</h3>
                                <span class="status-${request.urgency} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                                    ${this.formatUrgency(request.urgency)}
                                </span>
                                ${this.isCompatibleBloodType(request.bloodType) ? '<span class="compatibility-match">Compatible</span>' : ''}
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-text-muted-light dark:text-text-muted-dark mb-3">
                                <div class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">bloodtype</span>
                                    <span class="font-medium">${request.bloodType} - ${request.quantity}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">location_on</span>
                                    <span>${request.distance} miles away</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">schedule</span>
                                    <span>Deadline: ${request.deadline}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">access_time</span>
                                    <span>Posted: ${request.timePosted}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs">person</span>
                                    <span>${request.patientInfo}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button class="directions-btn action-btn px-4 py-2 rounded-lg text-sm font-medium"
                                onclick="nearbyCampsManager.getDirections(${request.coordinates.lat}, ${request.coordinates.lng})">
                            <span class="material-symbols-outlined text-sm mr-1">directions</span>
                            Directions
                        </button>
                        <button class="contact-btn action-btn px-4 py-2 rounded-lg text-sm font-medium"
                                onclick="nearbyCampsManager.contactHospital('${request.contactPhone}')">
                            <span class="material-symbols-outlined text-sm mr-1">call</span>
                            Contact
                        </button>
                        <button class="respond-btn action-btn px-4 py-2 rounded-lg text-sm font-medium"
                                onclick="nearbyCampsManager.openResponseModal(${request.id}, 'request')">
                            <span class="material-symbols-outlined text-sm mr-1">volunteer_activism</span>
                            Respond
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        requestsContainer.innerHTML = requestsHTML;
        
        // Animate cards
        setTimeout(() => {
            document.querySelectorAll('.request-card').forEach(card => {
                card.classList.add('loaded');
            });
        }, 100);
    }

    /**
     * Update statistics
     */
    updateStats() {
        document.getElementById('camps-count').textContent = this.filteredCamps.length;
        document.getElementById('urgent-count').textContent = this.filteredRequests.filter(r => r.urgency === 'critical' || r.urgency === 'urgent').length;
        
        const compatibleRequests = this.filteredRequests.filter(r => this.isCompatibleBloodType(r.bloodType)).length;
        document.getElementById('compatible-requests').textContent = `${compatibleRequests} compatible requests`;
    }

    /**
     * Switch between list and map views
     */
    switchView(view) {
        this.currentView = view;
        // In a real implementation, this would toggle between list and map display
        if (view === 'map') {
            this.showNotification('Map view would be displayed here with interactive markers', 'info');
        }
    }

    /**
     * Open response modal
     */
    openResponseModal(id, type) {
        const modal = document.getElementById('response-modal');
        const modalContent = document.getElementById('modal-content');
        
        let item;
        if (type === 'camp') {
            item = this.camps.find(c => c.id === id);
        } else {
            item = this.requests.find(r => r.id === id);
        }

        if (!item) return;

        const modalHTML = type === 'camp' ? `
            <div class="space-y-4">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Book Donation Slot</h4>
                    <p class="text-sm text-text-muted-light dark:text-text-muted-dark">${item.name}</p>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Preferred Date</label>
                        <input type="date" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Preferred Time</label>
                        <select class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2">
                            <option>9:00 AM - 10:00 AM</option>
                            <option>10:00 AM - 11:00 AM</option>
                            <option>11:00 AM - 12:00 PM</option>
                            <option>2:00 PM - 3:00 PM</option>
                            <option>3:00 PM - 4:00 PM</option>
                            <option>4:00 PM - 5:00 PM</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Special Notes</label>
                        <textarea class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" rows="3" placeholder="Any special requirements or notes..."></textarea>
                    </div>
                </div>
                <div class="flex gap-3 pt-4">
                    <button class="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors" onclick="nearbyCampsManager.confirmBooking(${id})">
                        Confirm Booking
                    </button>
                    <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="nearbyCampsManager.closeModal()">
                        Cancel
                    </button>
                </div>
            </div>
        ` : `
            <div class="space-y-4">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Respond to Blood Request</h4>
                    <p class="text-sm text-text-muted-light dark:text-text-muted-dark">${item.hospital}</p>
                    <div class="flex items-center justify-center gap-2 mt-2">
                        <span class="blood-type-badge">${item.bloodType}</span>
                        <span class="status-${item.urgency} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                            ${this.formatUrgency(item.urgency)}
                        </span>
                    </div>
                </div>
                <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <h5 class="font-medium text-text-light dark:text-text-dark mb-2">Request Details</h5>
                    <div class="space-y-1 text-sm text-text-muted-light dark:text-text-muted-dark">
                        <p><strong>Quantity:</strong> ${item.quantity}</p>
                        <p><strong>Deadline:</strong> ${item.deadline}</p>
                        <p><strong>Patient:</strong> ${item.patientInfo}</p>
                        <p><strong>Distance:</strong> ${item.distance} miles</p>
                    </div>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Response Type</label>
                        <select class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2">
                            <option>I can donate immediately</option>
                            <option>I can donate within 2 hours</option>
                            <option>I can donate within 4 hours</option>
                            <option>I need to check my eligibility</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Contact Information</label>
                        <input type="tel" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" placeholder="Your phone number" value="(555) 123-4567">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Additional Message</label>
                        <textarea class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" rows="3" placeholder="Any additional information..."></textarea>
                    </div>
                </div>
                <div class="flex gap-3 pt-4">
                    <button class="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors" onclick="nearbyCampsManager.confirmResponse(${id})">
                        Send Response
                    </button>
                    <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="nearbyCampsManager.closeModal()">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        modalContent.innerHTML = modalHTML;
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('response-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }

    /**
     * Confirm booking
     */
    confirmBooking(campId) {
        this.closeModal();
        this.showNotification('Booking confirmed! You will receive a confirmation email shortly.', 'success');
    }

    /**
     * Confirm response
     */
    confirmResponse(requestId) {
        this.closeModal();
        this.showNotification('Response sent! The hospital will contact you shortly.', 'success');
    }

    /**
     * Get directions to location
     */
    getDirections(lat, lng) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    }

    /**
     * Contact camp
     */
    contactCamp(phone) {
        window.open(`tel:${phone}`, '_self');
    }

    /**
     * Contact hospital
     */
    contactHospital(phone) {
        window.open(`tel:${phone}`, '_self');
    }

    /**
     * Find nearest camp
     */
    findNearestCamp() {
        if (this.filteredCamps.length > 0) {
            const nearest = this.filteredCamps[0];
            this.showNotification(`Nearest camp: ${nearest.name} (${nearest.distance} miles away)`, 'info');
            this.getDirections(nearest.coordinates.lat, nearest.coordinates.lng);
        }
    }

    /**
     * Handle emergency response
     */
    handleEmergencyResponse() {
        const criticalRequests = this.filteredRequests.filter(r => r.urgency === 'critical');
        if (criticalRequests.length > 0) {
            this.openResponseModal(criticalRequests[0].id, 'request');
        } else {
            this.showNotification('No critical requests at this time.', 'info');
        }
    }

    /**
     * Setup alerts
     */
    setupAlerts() {
        this.showNotification('Alert preferences would be configured here.', 'info');
    }

    /**
     * Refresh data
     */
    async refreshData() {
        const refreshBtn = document.getElementById('refresh-data-btn');
        const originalText = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Refreshing...';
        refreshBtn.disabled = true;

        try {
            await this.loadData();
            this.showNotification('Data refreshed successfully!', 'success');
        } catch (error) {
            this.showNotification('Error refreshing data. Please try again.', 'error');
        } finally {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            // In a real app, this would check for new data from the server
            console.log('Checking for updates...');
        }, 30000);
    }

    /**
     * Utility functions
     */
    formatStatus(status) {
        const statusMap = {
            'open': 'Open',
            'closing-soon': 'Closing Soon',
            'closed': 'Closed'
        };
        return statusMap[status] || status;
    }

    formatUrgency(urgency) {
        const urgencyMap = {
            'critical': 'Critical',
            'urgent': 'Urgent',
            'normal': 'Normal'
        };
        return urgencyMap[urgency] || urgency;
    }

    getDistanceClass(distance) {
        if (distance <= 2) return 'near';
        if (distance <= 5) return 'medium';
        return 'far';
    }

    isCompatibleBloodType(requestedType) {
        // Simplified compatibility check
        const compatibility = {
            'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
            'O+': ['O+', 'A+', 'B+', 'AB+'],
            'A-': ['A-', 'A+', 'AB-', 'AB+'],
            'A+': ['A+', 'AB+'],
            'B-': ['B-', 'B+', 'AB-', 'AB+'],
            'B+': ['B+', 'AB+'],
            'AB-': ['AB-', 'AB+'],
            'AB+': ['AB+']
        };
        
        return compatibility[this.userBloodType]?.includes(requestedType) || false;
    }

    showLoadingState() {
        // Show loading skeletons
        const containers = ['camps-list', 'requests-list'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            container.innerHTML = Array(3).fill(0).map(() => `
                <div class="rounded-2xl border border-slate-200 bg-card-light p-6 dark:border-slate-700 dark:bg-card-dark">
                    <div class="animate-pulse">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="size-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div class="flex-1">
                                <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        });
    }

    hideLoadingState() {
        // Loading state is hidden when real content is rendered
    }

    showErrorState() {
        this.showNotification('Error loading data. Please try again.', 'error');
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
            info: 'bg-blue-500'
        }[type] || 'bg-blue-500';
        
        notification.classList.add(bgColor);
        notification.innerHTML = `
            <div class="flex items-center text-white">
                <span class="material-symbols-outlined mr-2">
                    ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
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

// Initialize the manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.nearbyCampsManager = new NearbyCampsManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.nearbyCampsManager) {
        // Refresh data when page becomes visible
        console.log('Page became visible, checking for updates');
    }
});