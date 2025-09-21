/**
 * Emergency Alerts Page JavaScript
 * Handles emergency alert creation, management, and monitoring
 */

class EmergencyAlertsManager {
    constructor() {
        this.alerts = [];
        this.filteredAlerts = [];
        this.alertTemplates = [];
        this.responseData = {};
        this.init();
    }

    /**
     * Initialize the emergency alerts manager
     */
    init() {
        this.setupSidebar();
        this.setupModals();
        this.setupActionButtons();
        this.setupTemplates();
        this.loadAlerts();
        this.animateEntries();
        this.startRealTimeUpdates();
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
     * Setup modal functionality
     */
    setupModals() {
        // Create Alert Modal
        const createAlertBtn = document.getElementById('create-alert-btn');
        const createAlertModal = document.getElementById('create-alert-modal');
        const closeCreateAlertModal = document.getElementById('close-create-alert-modal');
        const cancelCreateAlert = document.getElementById('cancel-create-alert');
        const createAlertForm = document.getElementById('create-alert-form');

        createAlertBtn?.addEventListener('click', () => {
            this.openCreateAlertModal();
        });

        closeCreateAlertModal?.addEventListener('click', () => {
            this.closeCreateAlertModal();
        });

        cancelCreateAlert?.addEventListener('click', () => {
            this.closeCreateAlertModal();
        });

        createAlertForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateAlert(e);
        });

        // Emergency Alert Button in Sidebar
        const emergencyAlertBtn = document.getElementById('emergency-alert-btn');
        emergencyAlertBtn?.addEventListener('click', () => {
            this.sendEmergencyAlert();
        });

        // Close modals when clicking outside
        createAlertModal?.addEventListener('click', (e) => {
            if (e.target === createAlertModal) {
                this.closeCreateAlertModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCreateAlertModal();
            }
        });
    }

    /**
     * Setup action buttons
     */
    setupActionButtons() {
        document.addEventListener('click', (e) => {
            const alertCard = e.target.closest('.alert-card');
            if (!alertCard) return;

            const alertId = this.getAlertIdFromCard(alertCard);

            if (e.target.closest('.edit-alert-btn')) {
                this.editAlert(alertId);
            } else if (e.target.closest('.view-responses-btn')) {
                this.viewAlertResponses(alertId);
            } else if (e.target.closest('.deactivate-btn')) {
                this.deactivateAlert(alertId);
            } else if (e.target.closest('.stop-btn')) {
                this.stopAlert(alertId);
            }
        });
    }

    /**
     * Setup alert templates
     */
    setupTemplates() {
        const templateBtns = document.querySelectorAll('.alert-template-btn');
        
        templateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const templateType = this.getTemplateType(btn);
                this.useTemplate(templateType);
            });
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
                type: 'critical',
                title: 'Critical O- Blood Shortage',
                message: 'Emergency General Hospital urgently needs O- blood for trauma patients',
                bloodType: 'O-',
                targetAudience: 'nearby',
                priority: 'critical',
                status: 'active',
                sentTo: 1247,
                responses: 187,
                confirmed: 23,
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
            },
            {
                id: 2,
                type: 'warning',
                title: 'Low A+ Blood Stock',
                message: 'A+ blood levels below minimum threshold',
                bloodType: 'A+',
                targetAudience: 'eligible',
                priority: 'high',
                status: 'active',
                sentTo: 892,
                responses: 156,
                confirmed: 34,
                timestamp: new Date(Date.now() - 60 * 60 * 1000),
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
            },
            {
                id: 3,
                type: 'info',
                title: 'Upcoming Camp Reminder',
                message: 'Reminder for tomorrow\'s blood drive at University Campus',
                bloodType: null,
                targetAudience: 'registered',
                priority: 'medium',
                status: 'active',
                sentTo: 67,
                responses: 45,
                confirmed: 45,
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        ];
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const activeAlerts = this.alerts.filter(a => a.status === 'active').length;
        const totalSent = this.alerts.reduce((sum, alert) => sum + alert.sentTo, 0);
        const totalResponses = this.alerts.reduce((sum, alert) => sum + alert.responses, 0);
        const avgResponseTime = 12; // Mock data
        
        // Update the DOM elements
        console.log(`Updated summary: ${activeAlerts} active alerts, ${totalSent} sent, ${totalResponses} responses`);
    }

    /**
     * Render alerts list
     */
    renderAlerts() {
        // In a real implementation, this would dynamically generate the alert cards
        // For now, we'll just animate the existing cards
        this.animateEntries();
    }

    /**
     * Animate alert entries
     */
    animateEntries() {
        const entries = document.querySelectorAll('.alert-card');
        entries.forEach((entry, index) => {
            setTimeout(() => {
                entry.classList.add('loaded');
            }, index * 100);
        });
    }

    /**
     * Open create alert modal
     */
    openCreateAlertModal() {
        const modal = document.getElementById('create-alert-modal');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close create alert modal
     */
    closeCreateAlertModal() {
        const modal = document.getElementById('create-alert-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
        
        // Reset form
        const form = document.getElementById('create-alert-form');
        form.reset();
    }

    /**
     * Handle create alert form submission
     */
    async handleCreateAlert(event) {
        const formData = new FormData(event.target);
        const alertData = Object.fromEntries(formData.entries());
        
        try {
            // Show loading state
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending Alert...';
            
            // Simulate API call
            await this.simulateAlertCreation(alertData);
            
            this.showNotification('Emergency alert sent successfully!', 'success');
            this.closeCreateAlertModal();
            this.loadAlerts(); // Refresh alerts
            
        } catch (error) {
            console.error('Error creating alert:', error);
            this.showNotification('Error sending alert. Please try again.', 'error');
        }
    }

    /**
     * Send emergency alert (sidebar button)
     */
    sendEmergencyAlert() {
        if (confirm('This will send an immediate emergency alert to all eligible donors. Continue?')) {
            this.showNotification('Emergency alert sent to all donors!', 'success');
            
            // Add new alert to the list
            const newAlert = {
                id: Date.now(),
                type: 'critical',
                title: 'Emergency Blood Shortage',
                message: 'Immediate blood donations needed for emergency situation',
                bloodType: null,
                targetAudience: 'all',
                priority: 'critical',
                status: 'active',
                sentTo: 15432,
                responses: 0,
                confirmed: 0,
                timestamp: new Date(),
                expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
            };
            
            this.alerts.unshift(newAlert);
            this.renderAlerts();
        }
    }

    /**
     * Use alert template
     */
    useTemplate(templateType) {
        const templates = {
            'critical-o-negative': {
                type: 'critical',
                title: 'Critical O- Blood Shortage',
                message: 'Emergency request for O- blood type',
                bloodType: 'O-',
                targetAudience: 'nearby',
                priority: 'critical'
            },
            'low-stock': {
                type: 'warning',
                title: 'Low Blood Stock Alert',
                message: 'Multiple blood types running low',
                bloodType: '',
                targetAudience: 'eligible',
                priority: 'high'
            },
            'mass-casualty': {
                type: 'emergency',
                title: 'Mass Casualty Event',
                message: 'Large-scale emergency response needed',
                bloodType: '',
                targetAudience: 'all',
                priority: 'critical'
            }
        };

        const template = templates[templateType];
        if (template) {
            this.openCreateAlertModal();
            this.populateFormWithTemplate(template);
        }
    }

    /**
     * Populate form with template data
     */
    populateFormWithTemplate(template) {
        const form = document.getElementById('create-alert-form');
        
        Object.entries(template).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = value;
            }
        });
    }

    /**
     * Edit alert
     */
    editAlert(alertId) {
        const alert = this.alerts.find(a => a.id == alertId);
        if (!alert) return;

        this.openCreateAlertModal();
        this.populateFormWithTemplate(alert);
        
        // Change modal title and button text
        const modalTitle = document.querySelector('#create-alert-modal h3');
        const submitBtn = document.querySelector('#create-alert-form button[type="submit"]');
        
        modalTitle.textContent = 'Edit Emergency Alert';
        submitBtn.textContent = 'Update Alert';
    }

    /**
     * View alert responses
     */
    viewAlertResponses(alertId) {
        const alert = this.alerts.find(a => a.id == alertId);
        if (!alert) return;

        this.showNotification(`Viewing responses for "${alert.title}" - ${alert.responses} total responses`, 'info');
    }

    /**
     * Deactivate alert
     */
    deactivateAlert(alertId) {
        if (confirm('Are you sure you want to deactivate this alert?')) {
            const alert = this.alerts.find(a => a.id == alertId);
            if (alert) {
                alert.status = 'deactivated';
                this.showNotification('Alert deactivated successfully', 'success');
                this.renderAlerts();
            }
        }
    }

    /**
     * Stop alert
     */
    stopAlert(alertId) {
        if (confirm('Are you sure you want to stop this alert? This action cannot be undone.')) {
            const alert = this.alerts.find(a => a.id == alertId);
            if (alert) {
                alert.status = 'stopped';
                this.showNotification('Alert stopped successfully', 'success');
                this.renderAlerts();
            }
        }
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        // Update alert responses every 10 seconds
        setInterval(() => {
            this.updateAlertResponses();
        }, 10000);
    }

    /**
     * Update alert responses
     */
    updateAlertResponses() {
        this.alerts.forEach(alert => {
            if (alert.status === 'active' && Math.random() > 0.7) {
                alert.responses += Math.floor(Math.random() * 3);
                alert.confirmed += Math.floor(Math.random() * 2);
            }
        });
        
        this.updateSummaryCards();
    }

    /**
     * Get template type from button
     */
    getTemplateType(btn) {
        const title = btn.querySelector('h3').textContent;
        
        if (title.includes('O- Shortage')) return 'critical-o-negative';
        if (title.includes('Low Stock')) return 'low-stock';
        if (title.includes('Mass Casualty')) return 'mass-casualty';
        
        return 'custom';
    }

    /**
     * Get alert ID from card
     */
    getAlertIdFromCard(card) {
        // Extract alert ID from card content or index
        const cards = document.querySelectorAll('.alert-card');
        return Array.from(cards).indexOf(card) + 1;
    }

    /**
     * Simulate alert creation
     */
    simulateAlertCreation(alertData) {
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    /**
     * Simulate data loading
     */
    simulateDataLoad() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    showLoadingState() {
        const container = document.querySelector('.space-y-4');
        container.innerHTML = Array(3).fill(0).map(() => `
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
    window.emergencyAlertsManager = new EmergencyAlertsManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.emergencyAlertsManager) {
        // Refresh data when page becomes visible
        console.log('Page became visible, checking for new alerts');
    }
});