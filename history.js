/**
 * Donation History Page JavaScript
 * Handles filtering, searching, view switching, and data management
 */

class DonationHistory {
    constructor() {
        this.currentView = 'list';
        this.currentFilters = {
            status: '',
            type: '',
            year: '',
            search: ''
        };
        this.donations = [];
        this.filteredDonations = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    /**
     * Initialize the donation history manager
     */
    init() {
        this.setupSidebar();
        this.setupFilters();
        this.setupViewToggle();
        this.setupExportButton();
        this.setupActionButtons();
        this.loadDonationHistory();
        this.animateEntries();
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
     * Setup filter functionality
     */
    setupFilters() {
        const statusFilter = document.getElementById('status-filter');
        const typeFilter = document.getElementById('type-filter');
        const yearFilter = document.getElementById('year-filter');
        const searchInput = document.getElementById('search-input');

        // Status filter
        statusFilter?.addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.applyFilters();
        });

        // Type filter
        typeFilter?.addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.applyFilters();
        });

        // Year filter
        yearFilter?.addEventListener('change', (e) => {
            this.currentFilters.year = e.target.value;
            this.applyFilters();
        });

        // Search input with debounce
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
        const timelineViewBtn = document.getElementById('timeline-view-btn');
        const listView = document.getElementById('list-view');
        const timelineView = document.getElementById('timeline-view');

        listViewBtn?.addEventListener('click', () => {
            this.switchView('list');
            listViewBtn.classList.add('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
            listViewBtn.classList.remove('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
            timelineViewBtn.classList.remove('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
            timelineViewBtn.classList.add('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
            listView.classList.remove('hidden');
            timelineView.classList.add('hidden');
        });

        timelineViewBtn?.addEventListener('click', () => {
            this.switchView('timeline');
            timelineViewBtn.classList.add('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
            timelineViewBtn.classList.remove('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
            listViewBtn.classList.remove('bg-primary-100', 'text-primary-600', 'dark:bg-primary-900/50', 'dark:text-primary-200');
            listViewBtn.classList.add('hover:bg-slate-100', 'dark:hover:bg-slate-800', 'text-text-muted-light', 'dark:text-text-muted-dark');
            listView.classList.add('hidden');
            timelineView.classList.remove('hidden');
        });
    }

    /**
     * Switch between list and timeline views
     */
    switchView(view) {
        this.currentView = view;
        if (view === 'timeline') {
            this.renderTimelineView();
        }
    }

    /**
     * Setup export functionality
     */
    setupExportButton() {
        const exportBtn = document.getElementById('export-history-btn');
        
        exportBtn?.addEventListener('click', () => {
            this.exportHistory();
        });
    }

    /**
     * Setup action buttons (view details, certificates, etc.)
     */
    setupActionButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn')) {
                this.viewDonationDetails(e.target);
            } else if (e.target.classList.contains('download-certificate-btn')) {
                this.downloadCertificate(e.target);
            } else if (e.target.classList.contains('reschedule-btn')) {
                this.rescheduleDonation(e.target);
            } else if (e.target.classList.contains('cancel-btn')) {
                this.cancelDonation(e.target);
            }
        });

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        loadMoreBtn?.addEventListener('click', () => {
            this.loadMoreHistory();
        });
    }

    /**
     * Load donation history data
     */
    async loadDonationHistory() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Simulate API call
            await this.simulateDataLoad();
            
            // Generate mock data
            this.donations = this.generateMockData();
            this.filteredDonations = [...this.donations];
            
            // Update UI
            this.updateSummaryCards();
            this.renderDonations();
            
        } catch (error) {
            console.error('Error loading donation history:', error);
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Generate mock donation data
     */
    generateMockData() {
        return [
            {
                id: 1,
                type: 'whole-blood',
                status: 'completed',
                date: '2023-12-15',
                location: 'City Hospital',
                duration: '45 minutes',
                amount: '450ml collected',
                notes: 'Smooth donation process. No adverse reactions. Thank you for your contribution!',
                year: '2023'
            },
            {
                id: 2,
                type: 'plasma',
                status: 'scheduled',
                date: '2024-07-15',
                location: 'Mobile Unit',
                duration: '10:00 AM',
                amount: 'Plasma donation',
                notes: 'Please arrive 15 minutes early and bring a valid ID.',
                year: '2024'
            },
            {
                id: 3,
                type: 'platelets',
                status: 'completed',
                date: '2023-06-15',
                location: 'Community Center',
                duration: '90 minutes',
                amount: 'Platelets collected',
                notes: 'First-time platelets donation. Process went smoothly. Donor handled the longer procedure well.',
                year: '2023'
            },
            {
                id: 4,
                type: 'whole-blood',
                status: 'completed',
                date: '2023-03-10',
                location: 'Regional Blood Center',
                duration: '40 minutes',
                amount: '450ml collected',
                notes: 'Regular donation. Excellent health indicators.',
                year: '2023'
            },
            {
                id: 5,
                type: 'whole-blood',
                status: 'completed',
                date: '2023-01-05',
                location: 'University Hospital',
                duration: '50 minutes',
                amount: '450ml collected',
                notes: 'First donation of the year. Welcome back!',
                year: '2023'
            }
        ];
    }

    /**
     * Apply filters to donation data
     */
    applyFilters() {
        this.filteredDonations = this.donations.filter(donation => {
            // Status filter
            if (this.currentFilters.status && donation.status !== this.currentFilters.status) {
                return false;
            }
            
            // Type filter
            if (this.currentFilters.type && donation.type !== this.currentFilters.type) {
                return false;
            }
            
            // Year filter
            if (this.currentFilters.year && donation.year !== this.currentFilters.year) {
                return false;
            }
            
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${donation.location} ${donation.notes} ${donation.type}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.renderDonations();
        this.updateSummaryCards();
    }

    /**
     * Render donations in the current view
     */
    renderDonations() {
        if (this.currentView === 'list') {
            this.renderListView();
        } else {
            this.renderTimelineView();
        }
    }

    /**
     * Render list view
     */
    renderListView() {
        // In a real implementation, this would dynamically generate the donation entries
        // For now, we'll just animate the existing entries
        this.animateEntries();
    }

    /**
     * Render timeline view
     */
    renderTimelineView() {
        const timelineView = document.getElementById('timeline-view');
        if (!timelineView) return;

        // Generate timeline HTML
        const timelineHTML = this.filteredDonations.map((donation, index) => {
            const statusIcon = this.getStatusIcon(donation.status);
            const statusColor = this.getStatusColor(donation.status);
            
            return `
                <div class="relative flex items-start gap-6">
                    <div class="flex size-12 items-center justify-center rounded-full ${statusColor} border-4 border-card-light dark:border-card-dark z-10">
                        <span class="material-symbols-outlined">${statusIcon}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="rounded-2xl border border-slate-200 bg-card-light p-6 dark:border-slate-700 dark:bg-card-dark">
                            <h3 class="font-semibold text-text-light dark:text-text-dark mb-2">${this.formatDonationType(donation.type)}</h3>
                            <p class="text-sm text-text-muted-light dark:text-text-muted-dark mb-4">${this.formatDate(donation.date)} • ${donation.location}</p>
                            <p class="text-sm text-text-muted-light dark:text-text-muted-dark">${donation.notes}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        timelineView.innerHTML = `
            <div class="relative">
                <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                <div class="space-y-8">
                    ${timelineHTML}
                </div>
            </div>
        `;
    }

    /**
     * Get status icon for donation
     */
    getStatusIcon(status) {
        const icons = {
            completed: 'check_circle',
            scheduled: 'schedule',
            cancelled: 'cancel'
        };
        return icons[status] || 'help';
    }

    /**
     * Get status color classes
     */
    getStatusColor(status) {
        const colors = {
            completed: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
            scheduled: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400',
            cancelled: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
        };
        return colors[status] || 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400';
    }

    /**
     * Format donation type for display
     */
    formatDonationType(type) {
        const types = {
            'whole-blood': 'Whole Blood Donation',
            'plasma': 'Plasma Donation',
            'platelets': 'Platelets Donation'
        };
        return types[type] || type;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    /**
     * Animate donation entries
     */
    animateEntries() {
        const entries = document.querySelectorAll('.donation-entry');
        entries.forEach((entry, index) => {
            setTimeout(() => {
                entry.classList.add('loaded');
            }, index * 100);
        });
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const completedDonations = this.donations.filter(d => d.status === 'completed').length;
        const totalLivesSaved = completedDonations * 3; // Estimate 3 lives per donation
        
        // Update the cards with current data
        // In a real implementation, this would update the actual DOM elements
        console.log(`Updated summary: ${completedDonations} donations, ${totalLivesSaved} lives saved`);
    }

    /**
     * View donation details
     */
    viewDonationDetails(button) {
        const donationEntry = button.closest('.donation-entry');
        // In a real implementation, this would show a detailed modal
        this.showNotification('Donation details would be displayed here', 'info');
    }

    /**
     * Download donation certificate
     */
    downloadCertificate(button) {
        const donationEntry = button.closest('.donation-entry');
        
        // Show loading state
        button.disabled = true;
        button.innerHTML = 'Generating...';
        
        setTimeout(() => {
            // Simulate certificate generation
            this.generateCertificate();
            
            // Reset button
            button.disabled = false;
            button.innerHTML = 'Certificate';
            
            this.showNotification('Certificate downloaded successfully!', 'success');
        }, 2000);
    }

    /**
     * Generate and download certificate
     */
    generateCertificate() {
        // Create a simple text certificate (in a real app, this would be a PDF)
        const certificateContent = `
BLOOD DONATION CERTIFICATE

This certifies that Sarah Miller has made a valuable contribution
to saving lives through blood donation.

Date: December 15, 2023
Location: City Hospital
Type: Whole Blood Donation
Amount: 450ml

Thank you for your life-saving contribution!

LiquidLove Blood Donation Center
        `;
        
        const blob = new Blob([certificateContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'donation-certificate.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Reschedule donation
     */
    rescheduleDonation(button) {
        // In a real implementation, this would open a rescheduling modal
        this.showNotification('Rescheduling options would be displayed here', 'info');
    }

    /**
     * Cancel donation
     */
    cancelDonation(button) {
        if (confirm('Are you sure you want to cancel this donation appointment?')) {
            // Update the donation status
            const donationEntry = button.closest('.donation-entry');
            const statusBadge = donationEntry.querySelector('.inline-flex');
            
            statusBadge.className = 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300';
            statusBadge.textContent = 'Cancelled';
            
            // Hide action buttons
            const actionButtons = donationEntry.querySelector('.flex.items-center.gap-2');
            actionButtons.style.display = 'none';
            
            this.showNotification('Donation appointment cancelled', 'success');
        }
    }

    /**
     * Export donation history
     */
    exportHistory() {
        const exportBtn = document.getElementById('export-history-btn');
        const originalText = exportBtn.innerHTML;
        
        // Show loading state
        exportBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Exporting...';
        exportBtn.disabled = true;

        setTimeout(() => {
            // Generate and download CSV
            this.downloadHistoryCSV();
            
            // Reset button
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
            
            this.showNotification('History exported successfully!', 'success');
        }, 2000);
    }

    /**
     * Download history as CSV
     */
    downloadHistoryCSV() {
        const csvContent = this.generateHistoryCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donation-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Generate CSV content
     */
    generateHistoryCSV() {
        const headers = ['Date', 'Type', 'Status', 'Location', 'Duration', 'Amount', 'Notes'];
        const rows = this.filteredDonations.map(donation => [
            donation.date,
            this.formatDonationType(donation.type),
            donation.status,
            donation.location,
            donation.duration,
            donation.amount,
            donation.notes.replace(/,/g, ';') // Replace commas to avoid CSV issues
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        return `Donation History Export - ${new Date().toLocaleString()}\n\n${csvContent}`;
    }

    /**
     * Load more history entries
     */
    loadMoreHistory() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        
        // Show loading state
        loadMoreBtn.classList.add('loading');
        loadMoreBtn.innerHTML = 'Loading...';
        
        setTimeout(() => {
            // In a real implementation, this would load more data from the server
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.innerHTML = 'Load More History';
            
            this.showNotification('No more history to load', 'info');
        }, 1500);
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
     * Show loading state
     */
    showLoadingState() {
        const entries = document.querySelectorAll('.donation-entry');
        entries.forEach(entry => {
            entry.style.opacity = '0.6';
        });
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const entries = document.querySelectorAll('.donation-entry');
        entries.forEach(entry => {
            entry.style.opacity = '1';
        });
    }

    /**
     * Show error state
     */
    showErrorState() {
        this.showNotification('Error loading donation history. Please try again.', 'error');
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

// Initialize donation history when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DonationHistory();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh data when page becomes visible
        console.log('Page became visible, refreshing history data');
    }
});