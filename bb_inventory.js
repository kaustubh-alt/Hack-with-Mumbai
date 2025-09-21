/**
 * Inventory Page JavaScript
 * Handles blood inventory management, stock tracking, and alerts
 */

class InventoryManager {
    constructor() {
        this.inventory = [];
        this.filteredInventory = [];
        this.expirationAlerts = [];
        this.trends = {};
        this.init();
    }

    /**
     * Initialize the inventory manager
     */
    init() {
        this.setupSidebar();
        this.setupModals();
        this.setupActionButtons();
        this.loadInventoryData();
        this.animateElements();
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
        // Add Stock Modal
        const addStockBtn = document.getElementById('add-inventory-btn');
        const addStockModal = document.getElementById('add-stock-modal');
        const closeAddStockModal = document.getElementById('close-add-stock-modal');
        const cancelAddStock = document.getElementById('cancel-add-stock');
        const addStockForm = document.getElementById('add-stock-form');

        addStockBtn?.addEventListener('click', () => {
            this.openAddStockModal();
        });

        closeAddStockModal?.addEventListener('click', () => {
            this.closeAddStockModal();
        });

        cancelAddStock?.addEventListener('click', () => {
            this.closeAddStockModal();
        });

        addStockForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddStock(e);
        });

        // Close modals when clicking outside
        addStockModal?.addEventListener('click', (e) => {
            if (e.target === addStockModal) {
                this.closeAddStockModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAddStockModal();
            }
        });
    }

    /**
     * Setup action buttons
     */
    setupActionButtons() {
        document.addEventListener('click', (e) => {
            const bloodTypeCard = e.target.closest('.blood-type-card');
            
            if (bloodTypeCard && e.target.closest('button')) {
                const bloodType = bloodTypeCard.dataset.bloodType;
                const buttonText = e.target.textContent || e.target.closest('button').textContent;
                
                if (buttonText.includes('Emergency Alert') || buttonText.includes('Send Alert')) {
                    this.sendLowStockAlert(bloodType);
                } else if (buttonText.includes('Update Stock')) {
                    this.updateStock(bloodType);
                } else if (buttonText.includes('View History')) {
                    this.viewStockHistory(bloodType);
                }
            }

            // Table action buttons
            if (e.target.textContent === 'Edit') {
                const row = e.target.closest('tr');
                const bloodType = row.querySelector('.blood-type-badge').textContent;
                this.editStockLevel(bloodType);
            } else if (e.target.textContent === 'History') {
                const row = e.target.closest('tr');
                const bloodType = row.querySelector('.blood-type-badge').textContent;
                this.viewStockHistory(bloodType);
            } else if (e.target.textContent === 'Alert') {
                const row = e.target.closest('tr');
                const bloodType = row.querySelector('.blood-type-badge').textContent;
                this.sendLowStockAlert(bloodType);
            }
        });

        // Export button
        const exportBtn = document.getElementById('export-inventory-btn');
        exportBtn?.addEventListener('click', () => {
            this.exportInventory();
        });
    }

    /**
     * Load inventory data
     */
    async loadInventoryData() {
        try {
            this.showLoadingState();
            
            // Simulate API call
            await this.simulateDataLoad();
            
            // Generate mock data
            this.inventory = this.generateMockData();
            this.filteredInventory = [...this.inventory];
            
            // Load expiration alerts
            this.loadExpirationAlerts();
            
            // Update UI
            this.updateSummaryCards();
            this.updateInventoryDisplay();
            
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Generate mock inventory data
     */
    generateMockData() {
        return [
            {
                bloodType: 'A+',
                currentStock: 245,
                minLevel: 100,
                maxLevel: 400,
                status: 'good',
                expiringUnits: 12,
                weeklyCollection: 45,
                weeklyUsage: 38,
                lastUpdated: new Date()
            },
            {
                bloodType: 'A-',
                currentStock: 156,
                minLevel: 80,
                maxLevel: 250,
                status: 'good',
                expiringUnits: 5,
                weeklyCollection: 23,
                weeklyUsage: 19,
                lastUpdated: new Date()
            },
            {
                bloodType: 'B+',
                currentStock: 201,
                minLevel: 90,
                maxLevel: 300,
                status: 'good',
                expiringUnits: 8,
                weeklyCollection: 32,
                weeklyUsage: 28,
                lastUpdated: new Date()
            },
            {
                bloodType: 'B-',
                currentStock: 89,
                minLevel: 70,
                maxLevel: 200,
                status: 'low',
                expiringUnits: 3,
                weeklyCollection: 15,
                weeklyUsage: 18,
                lastUpdated: new Date()
            },
            {
                bloodType: 'AB+',
                currentStock: 123,
                minLevel: 80,
                maxLevel: 200,
                status: 'good',
                expiringUnits: 7,
                weeklyCollection: 18,
                weeklyUsage: 14,
                lastUpdated: new Date()
            },
            {
                bloodType: 'AB-',
                currentStock: 78,
                minLevel: 60,
                maxLevel: 150,
                status: 'low',
                expiringUnits: 2,
                weeklyCollection: 12,
                weeklyUsage: 15,
                lastUpdated: new Date()
            },
            {
                bloodType: 'O+',
                currentStock: 189,
                minLevel: 200,
                maxLevel: 500,
                status: 'low',
                expiringUnits: 15,
                weeklyCollection: 67,
                weeklyUsage: 72,
                lastUpdated: new Date()
            },
            {
                bloodType: 'O-',
                currentStock: 67,
                minLevel: 150,
                maxLevel: 300,
                status: 'critical',
                expiringUnits: 8,
                weeklyCollection: 34,
                weeklyUsage: 41,
                lastUpdated: new Date()
            }
        ];
    }

    /**
     * Load expiration alerts
     */
    loadExpirationAlerts() {
        this.expirationAlerts = [
            {
                bloodType: 'O+',
                units: 8,
                expirationDate: new Date(),
                severity: 'critical'
            },
            {
                bloodType: 'A+',
                units: 12,
                expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                severity: 'warning'
            }
        ];
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const totalUnits = this.inventory.reduce((sum, item) => sum + item.currentStock, 0);
        const criticalLevels = this.inventory.filter(item => item.status === 'critical').length;
        const weeklyCollection = this.inventory.reduce((sum, item) => sum + item.weeklyCollection, 0);
        const expiringUnits = this.inventory.reduce((sum, item) => sum + item.expiringUnits, 0);
        
        // Update the DOM elements
        console.log(`Updated summary: ${totalUnits} total units, ${criticalLevels} critical levels, ${weeklyCollection} collected this week, ${expiringUnits} expiring`);
    }

    /**
     * Update inventory display
     */
    updateInventoryDisplay() {
        // In a real implementation, this would update the blood type cards and table
        // For now, we'll just animate the existing elements
        this.animateElements();
    }

    /**
     * Animate elements
     */
    animateElements() {
        // Animate blood type cards
        const bloodTypeCards = document.querySelectorAll('.blood-type-card');
        bloodTypeCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('loaded');
            }, index * 100);
        });

        // Animate table rows
        const tableRows = document.querySelectorAll('.inventory-row');
        tableRows.forEach((row, index) => {
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 200 + (index * 50));
        });
    }

    /**
     * Open add stock modal
     */
    openAddStockModal() {
        const modal = document.getElementById('add-stock-modal');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }

    /**
     * Close add stock modal
     */
    closeAddStockModal() {
        const modal = document.getElementById('add-stock-modal');
        modal.classList.add('hidden');
        modal.classList.remove('show');
        
        // Reset form
        const form = document.getElementById('add-stock-form');
        form.reset();
    }

    /**
     * Handle add stock form submission
     */
    async handleAddStock(event) {
        const formData = new FormData(event.target);
        const stockData = Object.fromEntries(formData.entries());
        
        try {
            // Show loading state
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding Stock...';
            
            // Simulate API call
            await this.simulateStockUpdate(stockData);
            
            this.showNotification('Blood stock added successfully!', 'success');
            this.closeAddStockModal();
            this.loadInventoryData(); // Refresh data
            
        } catch (error) {
            console.error('Error adding stock:', error);
            this.showNotification('Error adding stock. Please try again.', 'error');
        }
    }

    /**
     * Send low stock alert
     */
    sendLowStockAlert(bloodType) {
        const item = this.inventory.find(i => i.bloodType === bloodType);
        if (!item) return;

        if (confirm(`Send low stock alert for ${bloodType} blood type to eligible donors?`)) {
            this.showNotification(`Low stock alert sent for ${bloodType} blood type!`, 'success');
            
            // In a real implementation, this would trigger an alert
            console.log(`Sending low stock alert for ${bloodType}`);
        }
    }

    /**
     * Update stock level
     */
    updateStock(bloodType) {
        this.openAddStockModal();
        
        // Pre-select the blood type
        const bloodTypeSelect = document.querySelector('#add-stock-form select');
        if (bloodTypeSelect) {
            bloodTypeSelect.value = bloodType;
        }
    }

    /**
     * Edit stock level
     */
    editStockLevel(bloodType) {
        const item = this.inventory.find(i => i.bloodType === bloodType);
        if (!item) return;

        const newStock = prompt(`Enter new stock level for ${bloodType}:`, item.currentStock);
        if (newStock && !isNaN(newStock) && parseInt(newStock) >= 0) {
            item.currentStock = parseInt(newStock);
            this.showNotification(`Stock level updated for ${bloodType}`, 'success');
            this.updateInventoryDisplay();
        }
    }

    /**
     * View stock history
     */
    viewStockHistory(bloodType) {
        this.showNotification(`Viewing stock history for ${bloodType} blood type`, 'info');
        
        // In a real implementation, this would show a detailed history modal
        console.log(`Viewing history for ${bloodType}`);
    }

    /**
     * Export inventory data
     */
    exportInventory() {
        const exportBtn = document.getElementById('export-inventory-btn');
        const originalText = exportBtn.innerHTML;
        
        exportBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Exporting...';
        exportBtn.disabled = true;

        setTimeout(() => {
            this.downloadInventoryCSV();
            
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
            
            this.showNotification('Inventory data exported successfully!', 'success');
        }, 2000);
    }

    /**
     * Download inventory as CSV
     */
    downloadInventoryCSV() {
        const csvContent = this.generateInventoryCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blood-inventory-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Generate CSV content
     */
    generateInventoryCSV() {
        const headers = ['Blood Type', 'Current Stock', 'Min Level', 'Max Level', 'Status', 'Expiring Units', 'Weekly Collection', 'Weekly Usage', 'Last Updated'];
        const rows = this.inventory.map(item => [
            item.bloodType,
            item.currentStock,
            item.minLevel,
            item.maxLevel,
            item.status,
            item.expiringUnits,
            item.weeklyCollection,
            item.weeklyUsage,
            item.lastUpdated.toISOString()
        ]);
        
        return [
            `Blood Inventory Report - ${new Date().toLocaleString()}`,
            '',
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        // Update inventory every 30 seconds
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000);

        // Update last updated timestamp every minute
        setInterval(() => {
            this.updateLastUpdatedTime();
        }, 60000);
    }

    /**
     * Update real-time data
     */
    updateRealTimeData() {
        // Simulate small changes in inventory
        this.inventory.forEach(item => {
            if (Math.random() > 0.8) {
                // Simulate usage
                const usage = Math.floor(Math.random() * 3);
                item.currentStock = Math.max(0, item.currentStock - usage);
                
                // Update status based on new stock level
                item.status = this.calculateStockStatus(item);
                item.lastUpdated = new Date();
            }
        });

        this.updateSummaryCards();
        this.updateInventoryDisplay();
    }

    /**
     * Calculate stock status
     */
    calculateStockStatus(item) {
        const percentage = (item.currentStock / item.maxLevel) * 100;
        
        if (item.currentStock < item.minLevel) return 'critical';
        if (percentage < 30) return 'low';
        if (percentage < 60) return 'moderate';
        return 'good';
    }

    /**
     * Update last updated time
     */
    updateLastUpdatedTime() {
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = 'Just updated';
            
            setTimeout(() => {
                lastUpdatedElement.textContent = '1 minute ago';
            }, 60000);
        }
    }

    /**
     * Simulate stock update
     */
    simulateStockUpdate(stockData) {
        return new Promise(resolve => {
            setTimeout(resolve, 1500);
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
        const cards = document.querySelectorAll('.blood-type-card');
        cards.forEach(card => {
            card.style.opacity = '0.6';
        });
    }

    hideLoadingState() {
        const cards = document.querySelectorAll('.blood-type-card');
        cards.forEach(card => {
            card.style.opacity = '1';
        });
    }

    showErrorState() {
        this.showNotification('Error loading inventory data. Please try again.', 'error');
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
    window.inventoryManager = new InventoryManager();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.inventoryManager) {
        // Refresh data when page becomes visible
        console.log('Page became visible, refreshing inventory data');
    }
});