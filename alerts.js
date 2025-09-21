/**
 * Alerts Page JavaScript
 * Handles alert management, filtering, and user interactions
 */

class AlertsManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.alerts = [];
        this.filteredAlerts = [];
        this.unreadCount = 0;
        this.init();
    }

    /**
     * Initialize the alerts manager
     */
    init() {
        this.setupSidebar();
        this.setupTabs();
        this.setupModals();
        this.setupActionButtons();
        this.loadAlerts();
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
     * Setup tab functionality
     */
    setupTabs() {
        const tabs = document.querySelectorAll('.tab-button');
        const sortFilter = document.getElementById('sort-filter');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Set current filter
                this.currentFilter = tab.id.replace('-tab', '').replace('all', 'all');
                if (this.currentFilter === 'blood-requests') this.currentFilter = 'blood-request';
                if (this.currentFilter === 'appointments') this.currentFilter = 'appointment';
                
                // Apply filters
                this.applyFilters();
            });
        });

        // Sort functionality
        sortFilter?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFilters();
        });

        // Mark all read button
        const markAllReadBtn = document.getElementById('mark-all-read-btn');
        markAllReadBtn?.addEventListener('click', () => {
            this.markAllAsRead();
        });
    }

    /**
     * Setup modal functionality
     */
    setupModals() {
        // Settings Modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsModal = document.getElementById('close-settings-modal');
        const cancelSettings = document.getElementById('cancel-settings');

        settingsBtn?.addEventListener('click', () => {
            this.openSettingsModal();
        });

        closeSettingsModal?.addEventListener('click', () => {
            this.closeSettingsModal();
        });

        cancelSettings?.addEventListener('click', () => {
            this.closeSettingsModal();
        });

        // Close modal when clicking outside
        settingsModal?.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                this.closeSettingsModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettingsModal();
            }
        });
    }

    /**
     * Setup action buttons
     */
    setupActionButtons() {
        document.addEventListener('click', (e) => {
            const alertItem = e.target.closest('.alert-item');
            if (!alertItem) return;

            const alertId = alertItem.dataset.alertId;

            if (e.target.closest('.respond-btn')) {
                this.handleRespond(alertId);
            } else if (e.target.closest('.contact-btn')) {
                this.handleContact(alertId);
            } else if (e.target.closest('.confirm-btn')) {
                this.handleConfirm(alertId);
            } else if (e.target.closest('.reschedule-btn')) {
                this.handleReschedule(alertId);
            } else if (e.target.closest('.share-btn')) {
                this.handleShare(alertId);
            } else if (e.target.closest('.mark-read-btn')) {
                this.markAsRead(alertId);
            } else if (e.target.closest('.dismiss-btn')) {
                this.dismissAlert(alertId);
            } else if (e.target.closest('.update-btn')) {
                this.handleUpdate(alertId);
            } else if (e.target.closest('.later-btn')) {
                this.handleLater(alertId);
            } else if (e.target.closest('.view-btn')) {
                this.handleView(alertId);
            }
        });

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-alerts-btn');
        loadMoreBtn?.addEventListener('click', () => {
            this.loadMoreAlerts();
        });
    }

    /**
     * Load alerts data
     */
    async loadAlerts() {
        try {
            this.showLoadingState();
            
            // Simulate API call
            await this.simulateDataLoad();
            
            // Generate mock data
            this.alerts = this.generateMockData();
            this.filteredAlerts = [...this.alerts];
            
            // Update UI
            this.updateSummaryCards();
            this.renderAlerts();
            
        } catch (error) {
            console.error('Error loading alerts:', error);
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Generate mock alert data
     */
    generateMockData() {
        return [
            {
                id: 1,
                type: 'blood-request',
                priority: 'critical',
                title: 'Critical Blood Shortage - O- Needed',
                message: 'Emergency General Hospital urgently needs O- blood for trauma patient',
                timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
                read: false,
                data: {
                    bloodType: 'O-',
                    units: 4,
                    hospital: 'Emergency General Hospital',
                    distance: 1.5,
                    deadline: '2 hours'
                }
            },
            {
                id: 2,
                type: 'appointment',
                priority: 'normal',
                title: 'Upcoming Donation Appointment',
                message: 'Your plasma donation is scheduled for tomorrow at City Hospital',
                timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                read: false,
                data: {
                    date: 'July 15, 2024',
                    time: '10:00 AM',
                    location: 'City Hospital - Mobile Unit',
                    type: 'Plasma'
                }
            },
            {
                id: 3,
                type: 'blood-request',
                priority: 'normal',
                title: 'Perfect Blood Type Match',
                message: 'St. Mary\'s Medical Center needs your O+ blood type for a patient',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
                read: false,
                data: {
                    bloodType: 'O+',
                    units: 2,
                    hospital: 'St. Mary\'s Medical Center',
                    distance: 2.3,
                    deadline: '6 hours'
                }
            },
            {
                id: 4,
                type: 'system',
                priority: 'low',
                title: 'System Update Available',
                message: 'New features and improvements are available for the LiquidLove app',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                read: false,
                data: {
                    version: '2.1.0',
                    features: [
                        'Enhanced notification system',
                        'Improved blood request matching',
                        'Better accessibility features'
                    ]
                }
            },
            {
                id: 5,
                type: 'achievement',
                priority: 'low',
                title: 'Achievement Unlocked!',
                message: 'Congratulations! You\'ve completed 5 blood donations and earned the "Life Saver" badge',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                read: false,
                data: {
                    badge: 'Life Saver',
                    description: '5 blood donations completed',
                    points: 500
                }
            }
        ];
    }

    /**
     * Apply filters to alerts
     */
    applyFilters() {
        this.filteredAlerts = this.alerts.filter(alert => {
            // Type filter
            if (this.currentFilter !== 'all' && alert.type !== this.currentFilter) {
                return false;
            }
            
            return true;
        });

        // Apply sorting
        this.sortAlerts();
        
        // Render filtered alerts
        this.renderAlerts();
        this.updateSummaryCards();
    }

    /**
     * Sort alerts based on current sort option
     */
    sortAlerts() {
        this.filteredAlerts.sort((a, b) => {
            switch (this.currentSort) {
                case 'newest':
                    return b.timestamp - a.timestamp;
                case 'oldest':
                    return a.timestamp - b.timestamp;
                case 'priority':
                    const priorityOrder = { critical: 0, urgent: 1, normal: 2, low: 3 };
                    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    return b.timestamp - a.timestamp; // Secondary sort by newest
                default:
                    return b.timestamp - a.timestamp;
            }
        });
    }

    /**
     * Render alerts list
     */
    renderAlerts() {
        const alertsContainer = document.getElementById('alerts-container');
        
        if (this.filteredAlerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined icon">notifications_off</span>
                    <p>No alerts found matching your criteria.</p>
                </div>
            `;
            return;
        }

        // Use existing HTML structure for now, but in a real app this would be dynamic
        // For demo purposes, we'll animate the existing alerts
        this.animateEntries();
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const criticalCount = this.alerts.filter(a => a.priority === 'critical').length;
        const unreadCount = this.alerts.filter(a => !a.read).length;
        const respondedCount = 3; // Mock data
        const upcomingCount = 2; // Mock data
        
        // Update the DOM elements
        const criticalElement = document.getElementById('critical-count');
        const unreadElement = document.getElementById('unread-count');
        const respondedElement = document.getElementById('responded-count');
        const upcomingElement = document.getElementById('upcoming-count');
        
        if (criticalElement) criticalElement.textContent = criticalCount;
        if (unreadElement) unreadElement.textContent = unreadCount;
        if (respondedElement) respondedElement.textContent = respondedCount;
        if (upcomingElement) upcomingElement.textContent = upcomingCount;
        
        this.unreadCount = unreadCount;
    }

    /**
     * Animate alert entries
     */
    animateEntries() {
        const entries = document.querySelectorAll('.alert-item');
        entries.forEach((entry, index) => {
            setTimeout(() => {
                entry.classList.add('loaded');
            }, index * 100);
        });
    }

    /**
     * Mark all alerts as read
     */
    markAllAsRead() {
        this.alerts.forEach(alert => {
            alert.read = true;
        });
        
        // Update UI
        const alertItems = document.querySelectorAll('.alert-item');
        alertItems.forEach(item => {
            item.classList.add('alert-read');
            item.classList.remove('alert-unread');
        });
        
        this.updateSummaryCards();
        this.showNotification('All alerts marked as read', 'success');
    }

    /**
     * Mark specific alert as read
     */
    markAsRead(alertId) {
        const alert = this.alerts.find(a => a.id == alertId);
        if (alert) {
            alert.read = true;
            
            // Update UI
            const alertItem = document.querySelector(`[data-alert-id="${alertId}"]`);
            if (alertItem) {
                alertItem.classList.add('alert-read');
                alertItem.classList.remove('alert-unread');
            }
            
            this.updateSummaryCards();
            this.showNotification('Alert marked as read', 'success');
        }
    }

    /**
     * Dismiss alert
     */
    dismissAlert(alertId) {
        const alertItem = document.querySelector(`[data-alert-id="${alertId}"]`);
        if (alertItem) {
            alertItem.style.opacity = '0';
            alertItem.style.transform = 'translateX(-100%)';
            
            setTimeout(() => {
                alertItem.remove();
                
                // Remove from data
                this.alerts = this.alerts.filter(a => a.id != alertId);
                this.filteredAlerts = this.filteredAlerts.filter(a => a.id != alertId);
                
                this.updateSummaryCards();
            }, 300);
            
            this.showNotification('Alert dismissed', 'info');
        }
    }

    /**
     * Handle action buttons
     */
    handleRespond(alertId) {
        this.showNotification('Opening response form...', 'info');
        // In a real app, this would open a response modal or navigate to response page
    }

    handleContact(alertId) {
        this.showNotification('Opening contact information...', 'info');
        // In a real app, this would open contact details or dial number
    }

    handleConfirm(alertId) {
        this.markAsRead(alertId);
        this.showNotification('Appointment confirmed!', 'success');
    }

    handleReschedule(alertId) {
        this.showNotification('Opening reschedule options...', 'info');
        // In a real app, this would open reschedule modal
    }

    handleShare(alertId) {
        if (navigator.share) {
            navigator.share({
                title: 'Blood Donation Alert',
                text: 'Help save lives by donating blood!',
                url: window.location.href
            });
        } else {
            this.showNotification('Sharing options would be displayed here', 'info');
        }
    }

    handleUpdate(alertId) {
        this.showNotification('Starting system update...', 'info');
        this.markAsRead(alertId);
    }

    handleLater(alertId) {
        this.showNotification('Reminder set for later', 'info');
        this.markAsRead(alertId);
    }

    handleView(alertId) {
        this.showNotification('Opening detailed view...', 'info');
        // In a real app, this would show achievement details
    }

    /**
     * Open settings modal
     */
    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close settings modal
     */
    closeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }

    /**
     * Load more alerts
     */
    loadMoreAlerts() {
        const loadMoreBtn = document.getElementById('load-more-alerts-btn');
        
        // Show loading state
        loadMoreBtn.classList.add('loading');
        loadMoreBtn.innerHTML = 'Loading...';
        
        setTimeout(() => {
            // In a real implementation, this would load more data from the server
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.innerHTML = 'Load More Alerts';
            
            this.showNotification('No more alerts to load', 'info');
        }, 1500);
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            // In a real app, this would check for new alerts from the server
            console.log('Checking for new alerts...');
        }, 30000);
    }

    /**
     * Utility functions
     */
    formatTimestamp(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    simulateDataLoad() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    showLoadingState() {
        const alertsContainer = document.getElementById('alerts-container');
        alertsContainer.innerHTML = Array(3).fill(0).map(() => `
            <div class="alert-loading"></div>
        `).join('');
    }

    hideLoadingState() {
        // Loading state is hidden when real content is rendered
    }

    showErrorState() {
        this.showNotification('Error loading alerts. Please try again.', 'error');
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
    window.alertsManager = new AlertsManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.alertsManager) {
        // Refresh data when page becomes visible
        console.log('Page became visible, checking for new alerts');
    }
});