/**
 * Blood Requests Page JavaScript
 * Handles request management, filtering, and user interactions
 */

class BloodRequestsManager {
    constructor() {
        this.currentFilters = {
            urgency: '',
            bloodType: '',
            location: '',
            search: ''
        };
        this.currentView = 'list';
        this.requests = [];
        this.filteredRequests = [];
        this.userBloodType = 'O+'; // From user profile
        this.userLocation = { lat: 40.7128, lng: -74.0060 }; // Default to NYC
        this.init();
    }

    /**
     * Initialize the requests manager
     */
    init() {
        this.setupSidebar();
        this.setupFilters();
        this.setupViewToggle();
        this.setupModals();
        this.setupActionButtons();
        this.loadRequests();
        this.animateEntries();
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
        const urgencyFilter = document.getElementById('urgency-filter');
        const bloodTypeFilter = document.getElementById('blood-type-filter');
        const locationFilter = document.getElementById('location-filter');
        const searchInput = document.getElementById('search-input');

        // Filter event listeners
        urgencyFilter?.addEventListener('change', (e) => {
            this.currentFilters.urgency = e.target.value;
            this.applyFilters();
        });

        bloodTypeFilter?.addEventListener('change', (e) => {
            this.currentFilters.bloodType = e.target.value;
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
    setupModals() {
        // Create Request Modal
        const createRequestBtn = document.getElementById('create-request-btn');
        const createRequestModal = document.getElementById('create-request-modal');
        const closeCreateModal = document.getElementById('close-create-modal');
        const cancelCreateRequest = document.getElementById('cancel-create-request');
        const createRequestForm = document.getElementById('create-request-form');

        createRequestBtn?.addEventListener('click', () => {
            this.openCreateRequestModal();
        });

        closeCreateModal?.addEventListener('click', () => {
            this.closeCreateRequestModal();
        });

        cancelCreateRequest?.addEventListener('click', () => {
            this.closeCreateRequestModal();
        });

        createRequestForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateRequest(e);
        });

        // Response Modal
        const responseModal = document.getElementById('response-modal');
        const closeResponseModal = document.getElementById('close-response-modal');

        closeResponseModal?.addEventListener('click', () => {
            this.closeResponseModal();
        });

        // Close modals when clicking outside
        createRequestModal?.addEventListener('click', (e) => {
            if (e.target === createRequestModal) {
                this.closeCreateRequestModal();
            }
        });

        responseModal?.addEventListener('click', (e) => {
            if (e.target === responseModal) {
                this.closeResponseModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCreateRequestModal();
                this.closeResponseModal();
            }
        });
    }

    /**
     * Setup action buttons
     */
    setupActionButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.respond-btn')) {
                const requestCard = e.target.closest('.request-card');
                this.handleRespond(requestCard);
            } else if (e.target.closest('.contact-btn')) {
                const requestCard = e.target.closest('.request-card');
                this.handleContact(requestCard);
            }
        });

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        loadMoreBtn?.addEventListener('click', () => {
            this.loadMoreRequests();
        });
    }

    /**
     * Load blood requests data
     */
    async loadRequests() {
        try {
            this.showLoadingState();
            
            // Simulate API call
            await this.simulateDataLoad();
            
            // Generate mock data
            this.requests = this.generateMockData();
            this.filteredRequests = [...this.requests];
            
            // Update UI
            this.updateSummaryCards();
            this.renderRequests();
            
        } catch (error) {
            console.error('Error loading requests:', error);
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Generate mock request data
     */
    generateMockData() {
        return [
            {
                id: 1,
                hospital: 'Emergency General Hospital',
                bloodType: 'O-',
                units: 4,
                urgency: 'critical',
                deadline: '2 hours',
                distance: 1.5,
                patientInfo: 'Emergency surgery patient - Multiple trauma case',
                contactPhone: '(555) 911-1111',
                address: '555 Emergency Ave, New York, NY',
                timePosted: '5 minutes ago',
                compatible: this.isCompatibleBloodType('O-')
            },
            {
                id: 2,
                hospital: 'St. Mary\'s Medical Center',
                bloodType: 'A+',
                units: 2,
                urgency: 'urgent',
                deadline: '6 hours',
                distance: 2.3,
                patientInfo: 'Scheduled surgery - Cardiac surgery patient',
                contactPhone: '(555) 222-3333',
                address: '777 Health St, New York, NY',
                timePosted: '15 minutes ago',
                compatible: this.isCompatibleBloodType('A+')
            },
            {
                id: 3,
                hospital: 'Children\'s Hospital',
                bloodType: 'B-',
                units: 1,
                urgency: 'normal',
                deadline: '12 hours',
                distance: 4.1,
                patientInfo: 'Pediatric patient - Routine but important care',
                contactPhone: '(555) 444-5555',
                address: '999 Kids Way, New York, NY',
                timePosted: '30 minutes ago',
                compatible: this.isCompatibleBloodType('B-')
            },
            {
                id: 4,
                hospital: 'Regional Medical Center',
                bloodType: 'AB+',
                units: 3,
                urgency: 'urgent',
                deadline: '8 hours',
                distance: 3.7,
                patientInfo: 'Cancer patient - Chemotherapy support',
                contactPhone: '(555) 666-7777',
                address: '111 Care Blvd, New York, NY',
                timePosted: '45 minutes ago',
                compatible: this.isCompatibleBloodType('AB+')
            },
            {
                id: 5,
                hospital: 'Metropolitan Hospital',
                bloodType: 'O+',
                units: 2,
                urgency: 'normal',
                deadline: '24 hours',
                distance: 2.8,
                patientInfo: 'Elective surgery - Pre-operative preparation',
                contactPhone: '(555) 888-9999',
                address: '333 Metro Ave, New York, NY',
                timePosted: '1 hour ago',
                compatible: this.isCompatibleBloodType('O+')
            }
        ];
    }

    /**
     * Apply filters to requests
     */
    applyFilters() {
        this.filteredRequests = this.requests.filter(request => {
            // Urgency filter
            if (this.currentFilters.urgency && request.urgency !== this.currentFilters.urgency) {
                return false;
            }
            
            // Blood type filter
            if (this.currentFilters.bloodType && request.bloodType !== this.currentFilters.bloodType) {
                return false;
            }
            
            // Location filter
            if (this.currentFilters.location) {
                switch (this.currentFilters.location) {
                    case 'nearby':
                        if (request.distance > 10) return false;
                        break;
                    case 'city':
                        if (request.distance > 25) return false;
                        break;
                    case 'state':
                        if (request.distance > 100) return false;
                        break;
                }
            }
            
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${request.hospital} ${request.patientInfo} ${request.bloodType}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Sort by urgency and time
        this.filteredRequests.sort((a, b) => {
            const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
            const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            if (urgencyDiff !== 0) return urgencyDiff;
            
            // If same urgency, sort by distance
            return a.distance - b.distance;
        });
        
        this.renderRequests();
        this.updateSummaryCards();
    }

    /**
     * Render requests list
     */
    renderRequests() {
        const requestsList = document.getElementById('requests-list');
        
        if (this.filteredRequests.length === 0) {
            requestsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined icon">bloodtype</span>
                    <p>No blood requests found matching your criteria.</p>
                </div>
            `;
            return;
        }

        const requestsHTML = this.filteredRequests.map((request, index) => {
            const urgencyClass = `request-${request.urgency}`;
            const timeClass = `time-${request.urgency}`;
            
            return `
                <div class="request-card ${urgencyClass} rounded-2xl border border-slate-200 bg-card-light p-6 dark:border-slate-700 dark:bg-card-dark" 
                     style="animation-delay: ${index * 100}ms" data-request-id="${request.id}">
                    <div class="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div class="flex items-start gap-4 flex-1">
                            <div class="flex size-12 items-center justify-center rounded-full ${this.getUrgencyIconBg(request.urgency)} flex-shrink-0">
                                <span class="material-symbols-outlined ${this.getUrgencyIconColor(request.urgency)}">${this.getUrgencyIcon(request.urgency)}</span>
                            </div>
                            <div class="flex-1">
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 class="font-semibold text-text-light dark:text-text-dark">${request.hospital}</h3>
                                    <span class="inline-flex items-center rounded-full ${this.getUrgencyBadgeClass(request.urgency)} px-2.5 py-0.5 text-xs font-medium">
                                        ${this.formatUrgency(request.urgency)}
                                    </span>
                                    ${request.compatible ? '<span class="compatibility-match">Compatible</span>' : ''}
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-text-muted-light dark:text-text-muted-dark mb-3">
                                    <div class="flex items-center gap-1">
                                        <span class="material-symbols-outlined text-xs">bloodtype</span>
                                        <span class="font-medium ${request.urgency === 'critical' ? 'text-red-600 dark:text-red-400' : ''}">${request.bloodType} - ${request.units} units</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="material-symbols-outlined text-xs">location_on</span>
                                        <span>${request.distance} miles away</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="material-symbols-outlined text-xs">schedule</span>
                                        <span class="${timeClass}">Needed in ${request.deadline}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="material-symbols-outlined text-xs">access_time</span>
                                        <span>Posted: ${request.timePosted}</span>
                                    </div>
                                </div>
                                <p class="text-sm text-text-muted-light dark:text-text-muted-dark">
                                    <strong>Details:</strong> ${request.patientInfo}
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <button class="respond-btn px-4 py-2 rounded-lg ${request.urgency === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'} text-white text-sm font-medium transition-colors">
                                <span class="material-symbols-outlined text-sm mr-1">volunteer_activism</span>
                                ${request.urgency === 'critical' ? 'Respond Now' : 'Respond'}
                            </button>
                            <button class="contact-btn px-4 py-2 rounded-lg border ${request.urgency === 'critical' ? 'border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark hover:bg-slate-50 dark:hover:bg-slate-800'} text-sm font-medium transition-colors">
                                <span class="material-symbols-outlined text-sm mr-1">call</span>
                                Contact
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        requestsList.innerHTML = requestsHTML;
        
        // Animate cards
        setTimeout(() => {
            document.querySelectorAll('.request-card').forEach(card => {
                card.classList.add('loaded');
            });
        }, 100);
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const criticalCount = this.filteredRequests.filter(r => r.urgency === 'critical').length;
        const urgentCount = this.filteredRequests.filter(r => r.urgency === 'urgent').length;
        const compatibleCount = this.filteredRequests.filter(r => r.compatible).length;
        
        // Update the DOM elements if they exist
        const criticalElement = document.querySelector('.text-red-600.dark\\:text-red-400');
        const urgentElement = document.querySelector('.text-yellow-600.dark\\:text-yellow-400');
        const compatibleElement = document.querySelector('.text-blue-600.dark\\:text-blue-400');
        
        if (criticalElement) criticalElement.textContent = criticalCount;
        if (urgentElement) urgentElement.textContent = urgentCount;
        if (compatibleElement) compatibleElement.textContent = compatibleCount;
    }

    /**
     * Switch between list and map views
     */
    switchView(view) {
        this.currentView = view;
        if (view === 'map') {
            this.showNotification('Map view would display interactive map with request locations', 'info');
        }
    }

    /**
     * Open create request modal
     */
    openCreateRequestModal() {
        const modal = document.getElementById('create-request-modal');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close create request modal
     */
    closeCreateRequestModal() {
        const modal = document.getElementById('create-request-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
        
        // Reset form
        const form = document.getElementById('create-request-form');
        form.reset();
    }

    /**
     * Handle create request form submission
     */
    handleCreateRequest(event) {
        const formData = new FormData(event.target);
        const requestData = Object.fromEntries(formData.entries());
        
        // Simulate request creation
        this.showNotification('Blood request created successfully! Hospitals in your area will be notified.', 'success');
        this.closeCreateRequestModal();
        
        // In a real app, this would send data to the server
        console.log('Creating request:', requestData);
    }

    /**
     * Handle respond to request
     */
    handleRespond(requestCard) {
        const requestId = requestCard.dataset.requestId;
        const request = this.requests.find(r => r.id == requestId);
        
        if (!request) return;
        
        this.openResponseModal(request);
    }

    /**
     * Handle contact hospital
     */
    handleContact(requestCard) {
        const requestId = requestCard.dataset.requestId;
        const request = this.requests.find(r => r.id == requestId);
        
        if (!request) return;
        
        // Open phone dialer
        window.open(`tel:${request.contactPhone}`, '_self');
    }

    /**
     * Open response modal
     */
    openResponseModal(request) {
        const modal = document.getElementById('response-modal');
        const modalContent = document.getElementById('response-modal-content');
        
        const modalHTML = `
            <div class="space-y-4">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Respond to Blood Request</h4>
                    <p class="text-sm text-text-muted-light dark:text-text-muted-dark">${request.hospital}</p>
                    <div class="flex items-center justify-center gap-2 mt-2">
                        <span class="blood-type-badge">${request.bloodType}</span>
                        <span class="inline-flex items-center rounded-full ${this.getUrgencyBadgeClass(request.urgency)} px-2.5 py-0.5 text-xs font-medium">
                            ${this.formatUrgency(request.urgency)}
                        </span>
                    </div>
                </div>
                <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <h5 class="font-medium text-text-light dark:text-text-dark mb-2">Request Details</h5>
                    <div class="space-y-1 text-sm text-text-muted-light dark:text-text-muted-dark">
                        <p><strong>Quantity:</strong> ${request.units} units</p>
                        <p><strong>Deadline:</strong> ${request.deadline}</p>
                        <p><strong>Patient:</strong> ${request.patientInfo}</p>
                        <p><strong>Distance:</strong> ${request.distance} miles</p>
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
                    <button class="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors" onclick="bloodRequestsManager.confirmResponse(${request.id})">
                        Send Response
                    </button>
                    <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="bloodRequestsManager.closeResponseModal()">
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
     * Close response modal
     */
    closeResponseModal() {
        const modal = document.getElementById('response-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }

    /**
     * Confirm response
     */
    confirmResponse(requestId) {
        this.closeResponseModal();
        this.showNotification('Response sent! The hospital will contact you shortly.', 'success');
    }

    /**
     * Load more requests
     */
    loadMoreRequests() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        
        // Show loading state
        loadMoreBtn.classList.add('loading');
        loadMoreBtn.innerHTML = 'Loading...';
        
        setTimeout(() => {
            // In a real implementation, this would load more data from the server
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.innerHTML = 'Load More Requests';
            
            this.showNotification('No more requests to load', 'info');
        }, 1500);
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            // In a real app, this would check for new requests from the server
            console.log('Checking for new requests...');
        }, 30000);
    }

    /**
     * Animate entries
     */
    animateEntries() {
        const entries = document.querySelectorAll('.request-card');
        entries.forEach((entry, index) => {
            setTimeout(() => {
                entry.classList.add('loaded');
            }, index * 100);
        });
    }

    /**
     * Utility functions
     */
    getUrgencyIcon(urgency) {
        const icons = {
            critical: 'emergency',
            urgent: 'schedule',
            normal: 'bloodtype'
        };
        return icons[urgency] || 'bloodtype';
    }

    getUrgencyIconBg(urgency) {
        const backgrounds = {
            critical: 'bg-red-100 dark:bg-red-900/50',
            urgent: 'bg-yellow-100 dark:bg-yellow-900/50',
            normal: 'bg-blue-100 dark:bg-blue-900/50'
        };
        return backgrounds[urgency] || 'bg-blue-100 dark:bg-blue-900/50';
    }

    getUrgencyIconColor(urgency) {
        const colors = {
            critical: 'text-red-600 dark:text-red-400',
            urgent: 'text-yellow-600 dark:text-yellow-400',
            normal: 'text-blue-600 dark:text-blue-400'
        };
        return colors[urgency] || 'text-blue-600 dark:text-blue-400';
    }

    getUrgencyBadgeClass(urgency) {
        const classes = {
            critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            urgent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            normal: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
        };
        return classes[urgency] || 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    }

    formatUrgency(urgency) {
        const formatted = {
            critical: 'Critical',
            urgent: 'Urgent',
            normal: 'Normal'
        };
        return formatted[urgency] || urgency;
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

    simulateDataLoad() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    showLoadingState() {
        const requestsList = document.getElementById('requests-list');
        requestsList.innerHTML = Array(3).fill(0).map(() => `
            <div class="request-loading"></div>
        `).join('');
    }

    hideLoadingState() {
        // Loading state is hidden when real content is rendered
    }

    showErrorState() {
        this.showNotification('Error loading requests. Please try again.', 'error');
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
    window.bloodRequestsManager = new BloodRequestsManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.bloodRequestsManager) {
        // Refresh data when page becomes visible
        console.log('Page became visible, checking for new requests');
    }
});