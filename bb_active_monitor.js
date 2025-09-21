/**
 * Active Monitor Page JavaScript
 * Handles real-time monitoring, live updates, and camp status tracking
 */

class ActiveMonitorManager {
    constructor() {
        this.isLive = true;
        this.refreshInterval = null;
        this.activeCamps = [];
        this.activityFeed = [];
        this.stats = {};
        this.init();
    }

    /**
     * Initialize the active monitor manager
     */
    init() {
        this.setupSidebar();
        this.setupAutoRefresh();
        this.setupQuickActions();
        this.loadInitialData();
        this.startRealTimeUpdates();
        this.animateElements();
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
     * Setup auto-refresh functionality
     */
    setupAutoRefresh() {
        const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
        const refreshBtn = document.getElementById('refresh-btn');

        autoRefreshToggle?.addEventListener('change', (e) => {
            this.isLive = e.target.checked;
            if (this.isLive) {
                this.startRealTimeUpdates();
                this.showConnectionStatus('online');
            } else {
                this.stopRealTimeUpdates();
                this.showConnectionStatus('offline');
            }
        });

        refreshBtn?.addEventListener('click', () => {
            this.manualRefresh();
        });
    }

    /**
     * Setup quick actions
     */
    setupQuickActions() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-btn')) {
                const action = e.target.closest('.quick-action-btn');
                const actionText = action.querySelector('p').textContent;
                
                switch (actionText) {
                    case 'Send Alert':
                        this.sendAlert();
                        break;
                    case 'Generate Report':
                        this.generateReport();
                        break;
                    case 'Broadcast Message':
                        this.broadcastMessage();
                        break;
                }
            }
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.showLoadingState();
            
            // Simulate API calls
            await Promise.all([
                this.loadActiveCamps(),
                this.loadLiveStats(),
                this.loadActivityFeed()
            ]);
            
            this.updateUI();
            
        } catch (error) {
            console.error('Error loading monitor data:', error);
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Load active camps data
     */
    async loadActiveCamps() {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        this.activeCamps = [
            {
                id: 1,
                name: 'Community Center Drive',
                location: 'Downtown Community Center',
                status: 'active',
                checkIns: 18,
                registered: 23,
                unitsCollected: 15,
                targetUnits: 40,
                waitTime: 12,
                successRate: 94,
                lastUpdate: new Date()
            },
            {
                id: 2,
                name: 'Hospital Mobile Unit',
                location: 'City Hospital Parking',
                status: 'active',
                checkIns: 12,
                registered: 20,
                unitsCollected: 11,
                targetUnits: 18,
                waitTime: 25,
                successRate: 92,
                lastUpdate: new Date()
            },
            {
                id: 3,
                name: 'Shopping Mall Drive',
                location: 'Metro Shopping Center',
                status: 'active',
                checkIns: 8,
                registered: 15,
                unitsCollected: 7,
                targetUnits: 12,
                waitTime: 8,
                successRate: 88,
                lastUpdate: new Date()
            }
        ];
    }

    /**
     * Load live statistics
     */
    async loadLiveStats() {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        this.stats = {
            activeCamps: 3,
            donorsToday: 47,
            unitsCollected: 42,
            avgWaitTime: 18,
            successRate: 91
        };
    }

    /**
     * Load activity feed
     */
    async loadActivityFeed() {
        await new Promise(resolve => setTimeout(resolve, 400));
        
        this.activityFeed = [
            {
                id: 1,
                type: 'check_in',
                message: 'Donor checked in at Community Center',
                details: 'Sarah M. • O+ blood type',
                timestamp: new Date(Date.now() - 2 * 60 * 1000),
                camp: 'Community Center Drive'
            },
            {
                id: 2,
                type: 'collection',
                message: 'Blood unit collected successfully',
                details: 'Hospital Mobile Unit • A+',
                timestamp: new Date(Date.now() - 3 * 60 * 1000),
                camp: 'Hospital Mobile Unit'
            },
            {
                id: 3,
                type: 'registration',
                message: 'New donor registration',
                details: 'Shopping Mall Drive • Walk-in',
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                camp: 'Shopping Mall Drive'
            },
            {
                id: 4,
                type: 'deferral',
                message: 'Donor deferred - low hemoglobin',
                details: 'Community Center • Referred to physician',
                timestamp: new Date(Date.now() - 7 * 60 * 1000),
                camp: 'Community Center Drive'
            }
        ];
    }

    /**
     * Update UI with loaded data
     */
    updateUI() {
        this.updateLiveStats();
        this.updateCampCards();
        this.updateActivityFeed();
    }

    /**
     * Update live statistics
     */
    updateLiveStats() {
        const elements = {
            'active-camps-count': this.stats.activeCamps,
            'donors-today-count': this.stats.donorsToday,
            'units-collected-count': this.stats.unitsCollected,
            'avg-wait-time': `${this.stats.avgWaitTime} min`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateCounterUpdate(element, value);
            }
        });
    }

    /**
     * Animate counter updates
     */
    animateCounterUpdate(element, newValue) {
        element.classList.add('data-update');
        element.textContent = newValue;
        
        setTimeout(() => {
            element.classList.remove('data-update');
        }, 500);
    }

    /**
     * Update camp monitor cards
     */
    updateCampCards() {
        // In a real implementation, this would update the camp cards with live data
        // For now, we'll just animate the existing cards
        this.animateElements();
    }

    /**
     * Update activity feed
     */
    updateActivityFeed() {
        const feedContainer = document.getElementById('activity-feed');
        if (!feedContainer) return;

        const feedHTML = this.activityFeed.map((activity, index) => {
            const iconMap = {
                check_in: 'check_circle',
                collection: 'bloodtype',
                registration: 'person_add',
                deferral: 'warning'
            };

            const colorMap = {
                check_in: 'green',
                collection: 'blue',
                registration: 'yellow',
                deferral: 'red'
            };

            const color = colorMap[activity.type];
            const icon = iconMap[activity.type];

            return `
                <div class="activity-item flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800" style="animation-delay: ${index * 100}ms">
                    <div class="flex size-8 items-center justify-center rounded-full bg-${color}-100 dark:bg-${color}-900/50 flex-shrink-0">
                        <span class="material-symbols-outlined text-${color}-600 dark:text-${color}-400 text-sm">${icon}</span>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-text-light dark:text-text-dark">
                            ${activity.message}
                        </p>
                        <p class="text-xs text-text-muted-light dark:text-text-muted-dark">
                            ${activity.details} • ${this.formatTimeAgo(activity.timestamp)}
                        </p>
                    </div>
                </div>
            `;
        }).join('');

        feedContainer.innerHTML = feedHTML;
        
        // Animate activity items
        setTimeout(() => {
            document.querySelectorAll('.activity-item').forEach(item => {
                item.classList.add('loaded');
            });
        }, 100);
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            if (this.isLive) {
                this.updateLiveData();
            }
        }, 5000); // Update every 5 seconds

        this.showConnectionStatus('online');
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Update live data
     */
    async updateLiveData() {
        try {
            // Simulate new data
            this.simulateDataChanges();
            this.updateUI();
            
            // Add new activity
            this.addNewActivity();
            
        } catch (error) {
            console.error('Error updating live data:', error);
            this.showConnectionStatus('offline');
        }
    }

    /**
     * Simulate data changes
     */
    simulateDataChanges() {
        // Randomly update some stats
        if (Math.random() > 0.7) {
            this.stats.donorsToday += Math.floor(Math.random() * 3);
            this.stats.unitsCollected += Math.floor(Math.random() * 2);
        }

        // Update camp data
        this.activeCamps.forEach(camp => {
            if (Math.random() > 0.8) {
                camp.checkIns += Math.floor(Math.random() * 2);
                camp.unitsCollected += Math.floor(Math.random() * 2);
                camp.waitTime = Math.max(5, camp.waitTime + Math.floor(Math.random() * 6) - 3);
                camp.lastUpdate = new Date();
            }
        });
    }

    /**
     * Add new activity to feed
     */
    addNewActivity() {
        if (Math.random() > 0.6) {
            const activities = [
                {
                    type: 'check_in',
                    message: 'New donor checked in',
                    details: `${this.generateRandomName()} • ${this.generateRandomBloodType()}`,
                    camp: this.activeCamps[Math.floor(Math.random() * this.activeCamps.length)].name
                },
                {
                    type: 'collection',
                    message: 'Blood unit collected',
                    details: `${this.generateRandomBloodType()} • Successful donation`,
                    camp: this.activeCamps[Math.floor(Math.random() * this.activeCamps.length)].name
                }
            ];

            const newActivity = {
                id: Date.now(),
                ...activities[Math.floor(Math.random() * activities.length)],
                timestamp: new Date()
            };

            this.activityFeed.unshift(newActivity);
            this.activityFeed = this.activityFeed.slice(0, 10); // Keep only last 10 items
            
            this.updateActivityFeed();
        }
    }

    /**
     * Manual refresh
     */
    async manualRefresh() {
        const refreshBtn = document.getElementById('refresh-btn');
        const originalHTML = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Refreshing...';
        refreshBtn.disabled = true;

        try {
            await this.loadInitialData();
            this.showNotification('Data refreshed successfully!', 'success');
        } catch (error) {
            this.showNotification('Error refreshing data. Please try again.', 'error');
        } finally {
            refreshBtn.innerHTML = originalHTML;
            refreshBtn.disabled = false;
        }
    }

    /**
     * Send alert to camps
     */
    sendAlert() {
        this.showNotification('Alert sent to all active camps!', 'success');
        
        // Add to activity feed
        this.activityFeed.unshift({
            id: Date.now(),
            type: 'alert',
            message: 'System alert sent to all camps',
            details: 'Emergency notification broadcast',
            timestamp: new Date(),
            camp: 'All Camps'
        });
        
        this.updateActivityFeed();
    }

    /**
     * Generate daily report
     */
    generateReport() {
        this.showNotification('Generating daily monitoring report...', 'info');
        
        setTimeout(() => {
            this.downloadReport();
        }, 2000);
    }

    /**
     * Download monitoring report
     */
    downloadReport() {
        const reportContent = `
DAILY MONITORING REPORT
Generated: ${new Date().toLocaleString()}

OVERVIEW:
- Active Camps: ${this.stats.activeCamps}
- Total Donors Today: ${this.stats.donorsToday}
- Units Collected: ${this.stats.unitsCollected}
- Average Wait Time: ${this.stats.avgWaitTime} minutes
- Overall Success Rate: ${this.stats.successRate}%

CAMP DETAILS:
${this.activeCamps.map(camp => `
- ${camp.name}
  Location: ${camp.location}
  Check-ins: ${camp.checkIns}/${camp.registered}
  Units Collected: ${camp.unitsCollected}/${camp.targetUnits}
  Wait Time: ${camp.waitTime} minutes
  Success Rate: ${camp.successRate}%
`).join('')}

RECENT ACTIVITY:
${this.activityFeed.slice(0, 5).map(activity => `
- ${activity.message}
  ${activity.details}
  ${this.formatTimeAgo(activity.timestamp)}
`).join('')}
        `;
        
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Monitoring report downloaded!', 'success');
    }

    /**
     * Broadcast message to camps
     */
    broadcastMessage() {
        this.showNotification('Message broadcast to all active camps!', 'success');
        
        // Add to activity feed
        this.activityFeed.unshift({
            id: Date.now(),
            type: 'broadcast',
            message: 'Message broadcast sent',
            details: 'Communication sent to all camp coordinators',
            timestamp: new Date(),
            camp: 'All Camps'
        });
        
        this.updateActivityFeed();
    }

    /**
     * Show connection status
     */
    showConnectionStatus(status) {
        let statusElement = document.querySelector('.connection-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'connection-status';
            document.body.appendChild(statusElement);
        }

        statusElement.className = `connection-status connection-${status}`;
        statusElement.textContent = status === 'online' ? 'Live Monitoring' : 'Offline Mode';
    }

    /**
     * Animate elements
     */
    animateElements() {
        // Animate stat cards
        const statCards = document.querySelectorAll('.live-stat-card');
        statCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('loaded');
            }, index * 100);
        });

        // Animate monitor cards
        const monitorCards = document.querySelectorAll('.camp-monitor-card');
        monitorCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('loaded');
            }, 200 + (index * 100));
        });
    }

    /**
     * Utility functions
     */
    generateRandomName() {
        const names = ['John D.', 'Sarah M.', 'Mike R.', 'Lisa K.', 'David W.', 'Emma T.'];
        return names[Math.floor(Math.random() * names.length)];
    }

    generateRandomBloodType() {
        const types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        return types[Math.floor(Math.random() * types.length)];
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    showLoadingState() {
        const containers = document.querySelectorAll('.live-stat-card, .camp-monitor-card');
        containers.forEach(container => {
            container.style.opacity = '0.6';
        });
    }

    hideLoadingState() {
        const containers = document.querySelectorAll('.live-stat-card, .camp-monitor-card');
        containers.forEach(container => {
            container.style.opacity = '1';
        });
    }

    showErrorState() {
        this.showNotification('Error loading monitoring data. Please try again.', 'error');
        this.showConnectionStatus('offline');
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
    window.activeMonitorManager = new ActiveMonitorManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.activeMonitorManager) {
        // Resume live updates when page becomes visible
        if (window.activeMonitorManager.isLive) {
            window.activeMonitorManager.startRealTimeUpdates();
        }
    } else if (window.activeMonitorManager) {
        // Pause updates when page is hidden to save resources
        window.activeMonitorManager.stopRealTimeUpdates();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.activeMonitorManager) {
        window.activeMonitorManager.stopRealTimeUpdates();
    }
});