/**
 * Blood Bank Dashboard JavaScript
 * Handles dashboard functionality, real-time updates, and user interactions
 */

class BloodBankDashboard {
    constructor() {
        this.refreshInterval = null;
        this.notifications = [];
        this.init();
    }

    /**
     * Initialize the dashboard
     */
    init() {
        this.setupSidebar();
        this.loadDashboardData();
        this.animateElements();
        this.setupRealTimeUpdates();
        this.setupNotifications();
        this.setupQuickActions();
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
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            // Simulate API calls for dashboard data
            const [metrics, activities, bloodStock, schedule] = await Promise.all([
                this.fetchMetrics(),
                this.fetchRecentActivities(),
                this.fetchBloodStock(),
                this.fetchTodaySchedule()
            ]);

            this.updateMetrics(metrics);
            this.updateActivities(activities);
            this.updateBloodStock(bloodStock);
            this.updateSchedule(schedule);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    /**
     * Fetch metrics data
     */
    async fetchMetrics() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            totalBloodUnits: 2847,
            activeCamps: 8,
            emergencyRequests: 5,
            registeredDonors: 15432,
            trends: {
                bloodUnits: '+12%',
                donors: '+234'
            }
        };
    }

    /**
     * Fetch recent activities
     */
    async fetchRecentActivities() {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return [
            {
                type: 'camp_completed',
                title: 'Blood donation camp completed at City Hospital',
                description: '45 donors participated',
                time: '2 hours ago',
                icon: 'check_circle',
                color: 'green'
            },
            {
                type: 'emergency_request',
                title: 'Emergency request for O- blood type',
                description: "St. Mary's Hospital",
                time: '4 hours ago',
                icon: 'emergency',
                color: 'red'
            },
            {
                type: 'new_donors',
                title: '15 new donors registered today',
                description: 'Various blood types',
                time: '6 hours ago',
                icon: 'person_add',
                color: 'blue'
            },
            {
                type: 'inventory_update',
                title: 'Blood inventory updated',
                description: 'A+ stock level: Low',
                time: '8 hours ago',
                icon: 'inventory',
                color: 'yellow'
            }
        ];
    }

    /**
     * Fetch blood stock data
     */
    async fetchBloodStock() {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return {
            'A+': { units: 245, level: 'good', percentage: 75 },
            'O+': { units: 189, level: 'moderate', percentage: 45 },
            'O-': { units: 67, level: 'critical', percentage: 25 },
            'AB+': { units: 123, level: 'good', percentage: 60 },
            'B-': { units: 89, level: 'low', percentage: 35 },
            'A-': { units: 156, level: 'good', percentage: 65 },
            'B+': { units: 201, level: 'good', percentage: 70 },
            'AB-': { units: 78, level: 'low', percentage: 30 }
        };
    }

    /**
     * Fetch today's schedule
     */
    async fetchTodaySchedule() {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return [
            {
                id: 1,
                name: 'Community Center Drive',
                location: 'Downtown Community Center',
                time: '9:00 AM - 5:00 PM',
                registered: 23,
                capacity: 50,
                status: 'active'
            },
            {
                id: 2,
                name: 'University Campus Drive',
                location: 'State University',
                time: '2:00 PM - 8:00 PM',
                registered: 67,
                capacity: 100,
                status: 'upcoming'
            },
            {
                id: 3,
                name: 'Corporate Office Drive',
                location: 'Tech Corp Building',
                time: '10:00 AM - 4:00 PM',
                registered: 12,
                capacity: 30,
                status: 'scheduled'
            }
        ];
    }

    /**
     * Update metrics display
     */
    updateMetrics(metrics) {
        // Update metric values with animation
        this.animateCounter('.metric-card:nth-child(1) .font-bold', metrics.totalBloodUnits);
        this.animateCounter('.metric-card:nth-child(2) .font-bold', metrics.activeCamps);
        this.animateCounter('.metric-card:nth-child(3) .font-bold', metrics.emergencyRequests);
        this.animateCounter('.metric-card:nth-child(4) .font-bold', metrics.registeredDonors);
    }

    /**
     * Animate counter values
     */
    animateCounter(selector, targetValue) {
        const element = document.querySelector(selector);
        if (!element) return;

        const startValue = 0;
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Update activities display
     */
    updateActivities(activities) {
        // Activities are already in HTML, this would update them dynamically in a real app
        console.log('Activities updated:', activities);
    }

    /**
     * Update blood stock display
     */
    updateBloodStock(bloodStock) {
        // Update blood stock levels with animations
        Object.entries(bloodStock).forEach(([type, data], index) => {
            setTimeout(() => {
                this.updateBloodTypeDisplay(type, data);
            }, index * 100);
        });
    }

    /**
     * Update individual blood type display
     */
    updateBloodTypeDisplay(type, data) {
        const container = document.querySelector(`.blood-type-item:nth-child(${this.getBloodTypeIndex(type)})`);
        if (!container) return;

        const progressBar = container.querySelector('.bg-green-600, .bg-yellow-600, .bg-red-600');
        const statusText = container.querySelector('.text-xs');
        const unitsText = container.querySelector('.text-sm.text-text-muted-light');

        if (progressBar) {
            progressBar.style.width = `${data.percentage}%`;
            progressBar.className = `h-2 rounded-full ${this.getProgressBarColor(data.level)}`;
        }

        if (statusText) {
            statusText.textContent = this.capitalizeFirst(data.level);
            statusText.className = `text-xs ${this.getStatusColor(data.level)} mt-1`;
        }

        if (unitsText) {
            unitsText.textContent = `${data.units} units`;
        }
    }

    /**
     * Get blood type index for display
     */
    getBloodTypeIndex(type) {
        const order = ['A+', 'O+', 'O-', 'AB+', 'B-'];
        return order.indexOf(type) + 1;
    }

    /**
     * Get progress bar color based on level
     */
    getProgressBarColor(level) {
        const colors = {
            critical: 'bg-red-600',
            low: 'bg-yellow-600',
            moderate: 'bg-yellow-600',
            good: 'bg-green-600'
        };
        return colors[level] || 'bg-gray-600';
    }

    /**
     * Get status text color based on level
     */
    getStatusColor(level) {
        const colors = {
            critical: 'text-red-600 dark:text-red-400',
            low: 'text-yellow-600 dark:text-yellow-400',
            moderate: 'text-yellow-600 dark:text-yellow-400',
            good: 'text-green-600 dark:text-green-400'
        };
        return colors[level] || 'text-gray-600 dark:text-gray-400';
    }

    /**
     * Update schedule display
     */
    updateSchedule(schedule) {
        // Schedule is already in HTML, this would update it dynamically in a real app
        console.log('Schedule updated:', schedule);
    }

    /**
     * Animate dashboard elements
     */
    animateElements() {
        // Animate metric cards
        const metricCards = document.querySelectorAll('.metric-card');
        metricCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('loaded');
            }, index * 100);
        });

        // Animate quick action cards
        const quickActionCards = document.querySelectorAll('.quick-action-card');
        quickActionCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('loaded');
            }, 200 + (index * 100));
        });

        // Animate schedule cards
        const scheduleCards = document.querySelectorAll('.schedule-card');
        scheduleCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('loaded');
            }, 400 + (index * 100));
        });
    }

    /**
     * Setup real-time updates
     */
    setupRealTimeUpdates() {
        // Update dashboard every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshDashboardData();
        }, 30000);

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshDashboardData();
            }
        });
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboardData() {
        try {
            const metrics = await this.fetchMetrics();
            this.updateMetrics(metrics);
            
            // Show subtle update indicator
            this.showUpdateIndicator();
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }

    /**
     * Show update indicator
     */
    showUpdateIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs z-50';
        indicator.textContent = 'Updated';
        document.body.appendChild(indicator);

        setTimeout(() => {
            indicator.remove();
        }, 2000);
    }

    /**
     * Setup notifications
     */
    setupNotifications() {
        // Check for critical blood levels
        this.checkCriticalLevels();
        
        // Setup notification click handler
        const notificationBtn = document.querySelector('.relative .material-symbols-outlined');
        notificationBtn?.parentElement.addEventListener('click', () => {
            this.showNotificationPanel();
        });
    }

    /**
     * Check for critical blood levels
     */
    checkCriticalLevels() {
        // This would check actual blood levels and create notifications
        const criticalTypes = ['O-', 'B-'];
        
        criticalTypes.forEach(type => {
            this.addNotification({
                type: 'critical',
                title: `Critical: ${type} blood level low`,
                message: 'Immediate action required',
                time: new Date()
            });
        });
    }

    /**
     * Add notification
     */
    addNotification(notification) {
        this.notifications.unshift(notification);
        this.updateNotificationBadge();
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.notifications.length;
        }
    }

    /**
     * Show notification panel
     */
    showNotificationPanel() {
        // This would show a dropdown or modal with notifications
        this.showNotification('Notification panel would be displayed here', 'info');
    }

    /**
     * Setup quick actions
     */
    setupQuickActions() {
        // Add click handlers for quick actions
        document.addEventListener('click', (e) => {
            const quickAction = e.target.closest('.quick-action-card');
            if (quickAction) {
                const href = quickAction.getAttribute('href');
                if (href && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    this.navigateToPage(href);
                }
            }
        });
    }

    /**
     * Navigate to page with transition
     */
    navigateToPage(url) {
        // Add page transition effect
        document.body.style.opacity = '0.8';
        
        setTimeout(() => {
            window.location.href = url;
        }, 200);
    }

    /**
     * Utility functions
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
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
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        }[type] || 'bg-blue-500';
        
        notification.classList.add(bgColor);
        notification.innerHTML = `
            <div class="flex items-center text-white">
                <span class="material-symbols-outlined mr-2">
                    ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}
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

    /**
     * Cleanup
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bloodBankDashboard = new BloodBankDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.bloodBankDashboard) {
        window.bloodBankDashboard.destroy();
    }
});