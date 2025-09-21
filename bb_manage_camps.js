/**
 * Manage Camps Page JavaScript
 * Handles camp management, filtering, editing, and monitoring
 */

class ManageCampsManager {
    constructor() {
        this.currentFilters = {
            status: '',
            date: '',
            search: ''
        };
        this.camps = [];
        this.filteredCamps = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    /**
     * Initialize the manage camps manager
     */
    init() {
        this.setupSidebar();
        this.setupFilters();
        this.setupModals();
        this.setupActionButtons();
        this.loadCamps();
        this.animateEntries();
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
        const statusFilter = document.getElementById('status-filter');
        const dateFilter = document.getElementById('date-filter');
        const searchInput = document.getElementById('search-input');

        statusFilter?.addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.applyFilters();
        });

        dateFilter?.addEventListener('change', (e) => {
            this.currentFilters.date = e.target.value;
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
     * Setup modal functionality
     */
    setupModals() {
        // Details Modal
        const detailsModal = document.getElementById('details-modal');
        const closeDetailsModal = document.getElementById('close-details-modal');

        closeDetailsModal?.addEventListener('click', () => {
            this.closeDetailsModal();
        });

        detailsModal?.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                this.closeDetailsModal();
            }
        });

        // Edit Modal
        const editModal = document.getElementById('edit-modal');
        const closeEditModal = document.getElementById('close-edit-modal');

        closeEditModal?.addEventListener('click', () => {
            this.closeEditModal();
        });

        editModal?.addEventListener('click', (e) => {
            if (e.target === editModal) {
                this.closeEditModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDetailsModal();
                this.closeEditModal();
            }
        });
    }

    /**
     * Setup action buttons
     */
    setupActionButtons() {
        document.addEventListener('click', (e) => {
            const campCard = e.target.closest('.camp-card');
            if (!campCard) return;

            const campId = campCard.dataset.campId || this.getCampIdFromCard(campCard);

            if (e.target.closest('.monitor-btn')) {
                this.monitorCamp(campId);
            } else if (e.target.closest('.edit-btn')) {
                this.editCamp(campId);
            } else if (e.target.closest('.details-btn')) {
                this.viewCampDetails(campId);
            } else if (e.target.closest('.report-btn')) {
                this.viewCampReport(campId);
            } else if (e.target.closest('.cancel-btn')) {
                this.cancelCamp(campId);
            }
        });

        // Export button
        const exportBtn = document.getElementById('export-camps-btn');
        exportBtn?.addEventListener('click', () => {
            this.exportCamps();
        });

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        loadMoreBtn?.addEventListener('click', () => {
            this.loadMoreCamps();
        });
    }

    /**
     * Load camps data
     */
    async loadCamps() {
        try {
            this.showLoadingState();
            
            // Simulate API call
            await this.simulateDataLoad();
            
            // Generate mock data
            this.camps = this.generateMockData();
            this.filteredCamps = [...this.camps];
            
            // Update UI
            this.updateSummaryCards();
            this.renderCamps();
            
        } catch (error) {
            console.error('Error loading camps:', error);
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Generate mock camp data
     */
    generateMockData() {
        return [
            {
                id: 1,
                name: 'Community Center Blood Drive',
                location: 'Downtown Community Center',
                address: '123 Main St, New York, NY 10001',
                status: 'active',
                startDate: '2024-07-14',
                endDate: '2024-07-14',
                startTime: '09:00',
                endTime: '17:00',
                maxDonors: 50,
                registered: 23,
                attended: 18,
                unitsCollected: 18,
                targetUnits: 40,
                organizer: 'Dr. Sarah Wilson',
                contactPhone: '(555) 123-4567',
                priority: 'high'
            },
            {
                id: 2,
                name: 'University Campus Drive',
                location: 'State University',
                address: '456 College Ave, New York, NY 10002',
                status: 'scheduled',
                startDate: '2024-07-20',
                endDate: '2024-07-20',
                startTime: '14:00',
                endTime: '20:00',
                maxDonors: 100,
                registered: 67,
                attended: 0,
                unitsCollected: 0,
                targetUnits: 80,
                organizer: 'Dr. Michael Chen',
                contactPhone: '(555) 234-5678',
                priority: 'medium'
            },
            {
                id: 3,
                name: 'Corporate Office Drive',
                location: 'Tech Corp Building',
                address: '789 Business Blvd, New York, NY 10003',
                status: 'completed',
                startDate: '2024-07-10',
                endDate: '2024-07-10',
                startTime: '10:00',
                endTime: '16:00',
                maxDonors: 30,
                registered: 28,
                attended: 25,
                unitsCollected: 25,
                targetUnits: 25,
                organizer: 'Dr. Emily Rodriguez',
                contactPhone: '(555) 345-6789',
                priority: 'low'
            }
        ];
    }

    /**
     * Apply filters to camps
     */
    applyFilters() {
        this.filteredCamps = this.camps.filter(camp => {
            // Status filter
            if (this.currentFilters.status && camp.status !== this.currentFilters.status) {
                return false;
            }
            
            // Date filter
            if (this.currentFilters.date) {
                const today = new Date();
                const campDate = new Date(camp.startDate);
                
                switch (this.currentFilters.date) {
                    case 'today':
                        if (campDate.toDateString() !== today.toDateString()) return false;
                        break;
                    case 'week':
                        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                        if (campDate < today || campDate > weekFromNow) return false;
                        break;
                    case 'month':
                        const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                        if (campDate < today || campDate > monthFromNow) return false;
                        break;
                }
            }
            
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${camp.name} ${camp.location} ${camp.organizer}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.renderCamps();
        this.updateSummaryCards();
    }

    /**
     * Render camps list
     */
    renderCamps() {
        // In a real implementation, this would dynamically generate the camp cards
        // For now, we'll just animate the existing cards
        this.animateEntries();
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const activeCamps = this.filteredCamps.filter(c => c.status === 'active').length;
        const scheduledCamps = this.filteredCamps.filter(c => c.status === 'scheduled').length;
        const totalRegistrations = this.filteredCamps.reduce((sum, camp) => sum + camp.registered, 0);
        const totalUnits = this.filteredCamps.reduce((sum, camp) => sum + camp.unitsCollected, 0);
        
        // Update the DOM elements
        console.log(`Updated summary: ${activeCamps} active, ${scheduledCamps} scheduled, ${totalRegistrations} registrations, ${totalUnits} units`);
    }

    /**
     * Animate camp entries
     */
    animateEntries() {
        const entries = document.querySelectorAll('.camp-card');
        entries.forEach((entry, index) => {
            setTimeout(() => {
                entry.classList.add('loaded');
            }, index * 100);
        });
    }

    /**
     * Monitor camp (redirect to active monitor)
     */
    monitorCamp(campId) {
        window.location.href = `bb_active_monitor.html?campId=${campId}`;
    }

    /**
     * Edit camp
     */
    editCamp(campId) {
        const camp = this.camps.find(c => c.id == campId);
        if (!camp) return;

        this.openEditModal(camp);
    }

    /**
     * View camp details
     */
    viewCampDetails(campId) {
        const camp = this.camps.find(c => c.id == campId);
        if (!camp) return;

        this.openDetailsModal(camp);
    }

    /**
     * View camp report
     */
    viewCampReport(campId) {
        this.showNotification('Generating detailed camp report...', 'info');
        
        setTimeout(() => {
            this.generateCampReport(campId);
        }, 1500);
    }

    /**
     * Cancel camp
     */
    cancelCamp(campId) {
        if (confirm('Are you sure you want to cancel this camp? This action cannot be undone.')) {
            const camp = this.camps.find(c => c.id == campId);
            if (camp) {
                camp.status = 'cancelled';
                this.showNotification('Camp cancelled successfully. Registered donors will be notified.', 'success');
                this.renderCamps();
            }
        }
    }

    /**
     * Open details modal
     */
    openDetailsModal(camp) {
        const modal = document.getElementById('details-modal');
        const content = document.getElementById('details-content');
        
        const detailsHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold text-text-light dark:text-text-dark mb-3">Basic Information</h4>
                        <div class="space-y-2 text-sm">
                            <p><strong>Name:</strong> ${camp.name}</p>
                            <p><strong>Location:</strong> ${camp.location}</p>
                            <p><strong>Address:</strong> ${camp.address}</p>
                            <p><strong>Organizer:</strong> ${camp.organizer}</p>
                            <p><strong>Contact:</strong> ${camp.contactPhone}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold text-text-light dark:text-text-dark mb-3">Schedule</h4>
                        <div class="space-y-2 text-sm">
                            <p><strong>Date:</strong> ${this.formatDate(camp.startDate)}</p>
                            <p><strong>Time:</strong> ${this.formatTime(camp.startTime)} - ${this.formatTime(camp.endTime)}</p>
                            <p><strong>Status:</strong> <span class="status-${camp.status} px-2 py-1 rounded text-xs">${this.formatStatus(camp.status)}</span></p>
                            <p><strong>Priority:</strong> <span class="priority-${camp.priority} px-2 py-1 rounded text-xs">${this.formatPriority(camp.priority)}</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h4 class="font-semibold text-text-light dark:text-text-dark mb-3">Capacity</h4>
                        <div class="space-y-2 text-sm">
                            <p><strong>Max Donors:</strong> ${camp.maxDonors}</p>
                            <p><strong>Registered:</strong> ${camp.registered}</p>
                            <p><strong>Attended:</strong> ${camp.attended}</p>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${(camp.registered / camp.maxDonors) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold text-text-light dark:text-text-dark mb-3">Blood Collection</h4>
                        <div class="space-y-2 text-sm">
                            <p><strong>Target Units:</strong> ${camp.targetUnits}</p>
                            <p><strong>Collected:</strong> ${camp.unitsCollected}</p>
                            <p><strong>Success Rate:</strong> ${Math.round((camp.unitsCollected / camp.targetUnits) * 100)}%</p>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                                <div class="bg-green-600 h-2 rounded-full" style="width: ${(camp.unitsCollected / camp.targetUnits) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold text-text-light dark:text-text-dark mb-3">Performance</h4>
                        <div class="space-y-2 text-sm">
                            <p><strong>Attendance Rate:</strong> ${camp.attended > 0 ? Math.round((camp.attended / camp.registered) * 100) : 0}%</p>
                            <p><strong>Collection Rate:</strong> ${camp.attended > 0 ? Math.round((camp.unitsCollected / camp.attended) * 100) : 0}%</p>
                            <p><strong>Overall Rating:</strong> ⭐⭐⭐⭐⭐</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button class="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors" onclick="manageCampsManager.editCamp(${camp.id})">
                        Edit Camp
                    </button>
                    ${camp.status === 'active' ? `
                        <button class="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors" onclick="manageCampsManager.monitorCamp(${camp.id})">
                            Monitor Live
                        </button>
                    ` : ''}
                    <button class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="manageCampsManager.generateCampReport(${camp.id})">
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
     * Open edit modal
     */
    openEditModal(camp) {
        const modal = document.getElementById('edit-modal');
        const content = document.getElementById('edit-content');
        
        const editHTML = `
            <form id="edit-camp-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Camp Name</label>
                        <input type="text" value="${camp.name}" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Location</label>
                        <input type="text" value="${camp.location}" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" required>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Address</label>
                        <input type="text" value="${camp.address}" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Start Date</label>
                        <input type="date" value="${camp.startDate}" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">End Date</label>
                        <input type="date" value="${camp.endDate}" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Start Time</label>
                        <input type="time" value="${camp.startTime}" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">End Time</label>
                        <input type="time" value="${camp.endTime}" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Max Donors</label>
                        <input type="number" value="${camp.maxDonors}" min="1" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Target Units</label>
                        <input type="number" value="${camp.targetUnits}" min="1" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Priority</label>
                        <select class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2">
                            <option value="low" ${camp.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${camp.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${camp.priority === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Status</label>
                        <select class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-card-light dark:bg-card-dark px-3 py-2">
                            <option value="scheduled" ${camp.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                            <option value="active" ${camp.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="completed" ${camp.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${camp.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors">
                        Save Changes
                    </button>
                    <button type="button" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="manageCampsManager.closeEditModal()">
                        Cancel
                    </button>
                </div>
            </form>
        `;
        
        content.innerHTML = editHTML;
        modal.classList.remove('hidden');
        modal.classList.add('show');

        // Setup form submission
        const form = document.getElementById('edit-camp-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCampChanges(camp.id, form);
        });
    }

    /**
     * Close details modal
     */
    closeDetailsModal() {
        const modal = document.getElementById('details-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }

    /**
     * Close edit modal
     */
    closeEditModal() {
        const modal = document.getElementById('edit-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }

    /**
     * Save camp changes
     */
    async saveCampChanges(campId, form) {
        try {
            const formData = new FormData(form);
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
            
            // Simulate API call
            await this.simulateSave();
            
            this.showNotification('Camp updated successfully!', 'success');
            this.closeEditModal();
            this.loadCamps(); // Refresh data
            
        } catch (error) {
            console.error('Error saving camp:', error);
            this.showNotification('Error saving changes. Please try again.', 'error');
        }
    }

    /**
     * Export camps data
     */
    exportCamps() {
        const exportBtn = document.getElementById('export-camps-btn');
        const originalText = exportBtn.innerHTML;
        
        exportBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Exporting...';
        exportBtn.disabled = true;

        setTimeout(() => {
            this.downloadCampsCSV();
            
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
            
            this.showNotification('Camps data exported successfully!', 'success');
        }, 2000);
    }

    /**
     * Download camps as CSV
     */
    downloadCampsCSV() {
        const csvContent = this.generateCampsCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `camps-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Generate CSV content
     */
    generateCampsCSV() {
        const headers = ['Name', 'Location', 'Date', 'Time', 'Status', 'Registered', 'Attended', 'Units Collected', 'Organizer'];
        const rows = this.filteredCamps.map(camp => [
            camp.name,
            camp.location,
            camp.startDate,
            `${camp.startTime} - ${camp.endTime}`,
            camp.status,
            camp.registered,
            camp.attended,
            camp.unitsCollected,
            camp.organizer
        ]);
        
        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }

    /**
     * Generate camp report
     */
    generateCampReport(campId) {
        const camp = this.camps.find(c => c.id == campId);
        if (!camp) return;

        const reportContent = `
BLOOD DONATION CAMP REPORT

Camp Name: ${camp.name}
Location: ${camp.location}
Date: ${this.formatDate(camp.startDate)}
Time: ${this.formatTime(camp.startTime)} - ${this.formatTime(camp.endTime)}
Status: ${this.formatStatus(camp.status)}

STATISTICS:
- Maximum Capacity: ${camp.maxDonors} donors
- Registered Donors: ${camp.registered}
- Attended Donors: ${camp.attended}
- Attendance Rate: ${camp.attended > 0 ? Math.round((camp.attended / camp.registered) * 100) : 0}%

BLOOD COLLECTION:
- Target Units: ${camp.targetUnits}
- Units Collected: ${camp.unitsCollected}
- Collection Rate: ${Math.round((camp.unitsCollected / camp.targetUnits) * 100)}%

ORGANIZER INFORMATION:
- Organizer: ${camp.organizer}
- Contact: ${camp.contactPhone}

Generated on: ${new Date().toLocaleString()}
        `;
        
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `camp-report-${camp.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Camp report generated and downloaded!', 'success');
    }

    /**
     * Load more camps
     */
    loadMoreCamps() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        
        loadMoreBtn.classList.add('loading');
        loadMoreBtn.innerHTML = 'Loading...';
        
        setTimeout(() => {
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.innerHTML = 'Load More Camps';
            
            this.showNotification('No more camps to load', 'info');
        }, 1500);
    }

    /**
     * Utility functions
     */
    getCampIdFromCard(card) {
        // Extract camp ID from card content or index
        const cards = document.querySelectorAll('.camp-card');
        return Array.from(cards).indexOf(card) + 1;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    formatStatus(status) {
        const statusMap = {
            active: 'Active',
            scheduled: 'Scheduled',
            completed: 'Completed',
            cancelled: 'Cancelled'
        };
        return statusMap[status] || status;
    }

    formatPriority(priority) {
        const priorityMap = {
            low: 'Low',
            medium: 'Medium',
            high: 'High'
        };
        return priorityMap[priority] || priority;
    }

    simulateDataLoad() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    simulateSave() {
        return new Promise(resolve => {
            setTimeout(resolve, 1500);
        });
    }

    showLoadingState() {
        const container = document.getElementById('camps-container');
        container.innerHTML = Array(3).fill(0).map(() => `
            <div class="camp-loading"></div>
        `).join('');
    }

    hideLoadingState() {
        // Loading state is hidden when real content is rendered
    }

    showErrorState() {
        this.showNotification('Error loading camps. Please try again.', 'error');
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
    window.manageCampsManager = new ManageCampsManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.manageCampsManager) {
        // Refresh data when page becomes visible
        console.log('Page became visible, refreshing camps data');
    }
});