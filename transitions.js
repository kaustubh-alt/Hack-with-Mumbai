/**
 * Page Transition Manager for LiquidLove
 * Handles smooth page transitions and loading states
 */

class PageTransitionManager {
    constructor() {
        this.isTransitioning = false;
        this.transitionDuration = 300;
        this.init();
    }

    /**
     * Initialize the transition manager
     */
    init() {
        this.createLoadingOverlay();
        this.setupPageLoad();
        this.setupLinkInterception();
        this.setupFormTransitions();
        this.checkReducedMotion();
    }

    /**
     * Check if user prefers reduced motion
     */
    checkReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.transitionDuration = 0;
            document.documentElement.style.setProperty('--transition-duration', '0ms');
        }
    }

    /**
     * Create loading overlay element
     */
    createLoadingOverlay() {
        if (document.getElementById('page-loading-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'page-loading-overlay';
        overlay.className = 'page-loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(overlay);
    }

    /**
     * Setup page load animations
     */
    setupPageLoad() {
        // Add transition class to main content areas
        const mainContent = document.querySelector('main') || document.querySelector('.main-content') || document.body;
        if (mainContent && !mainContent.classList.contains('page-transition')) {
            mainContent.classList.add('page-transition');
        }

        // Add form container transitions
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const container = form.closest('.w-full.max-w-md, .w-full.max-w-lg') || form.parentElement;
            if (container && !container.classList.contains('form-container')) {
                container.classList.add('form-container');
            }
        });

        // Trigger animations when page loads
        window.addEventListener('load', () => {
            this.animatePageIn();
        });

        // Fallback for DOMContentLoaded if load event doesn't fire
        if (document.readyState === 'complete') {
            setTimeout(() => this.animatePageIn(), 50);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.animatePageIn(), 50);
            });
        }
    }

    /**
     * Animate page entrance
     */
    animatePageIn() {
        const transitionElements = document.querySelectorAll('.page-transition, .form-container');
        
        transitionElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('loaded');
            }, index * 100); // Stagger animations
        });

        // Animate other elements
        this.animateElements();
    }

    /**
     * Animate various page elements
     */
    animateElements() {
        // Animate cards with stagger
        const cards = document.querySelectorAll('.rounded-2xl, .card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 200 + (index * 50));
        });

        // Animate navigation items
        const navItems = document.querySelectorAll('nav a');
        navItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 300 + (index * 30));
        });
    }

    /**
     * Setup link interception for smooth transitions
     */
    setupLinkInterception() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            
            if (!link || this.isTransitioning) return;
            
            const href = link.getAttribute('href');
            
            // Only intercept internal links
            if (!href || 
                href.startsWith('#') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:') || 
                href.includes('://') ||
                link.target === '_blank') {
                return;
            }

            // Don't intercept if it's the same page
            if (href === window.location.pathname || 
                href === window.location.pathname.split('/').pop()) {
                return;
            }

            e.preventDefault();
            this.transitionToPage(href);
        });
    }

    /**
     * Setup form submission transitions
     */
    setupFormTransitions() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (this.isTransitioning) {
                    e.preventDefault();
                    return;
                }

                // Add loading state to submit button
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    const originalText = submitBtn.textContent;
                    submitBtn.textContent = 'Loading...';
                    
                    // Reset after a delay (for demo purposes)
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }, 2000);
                }
            });
        });
    }

    /**
     * Transition to a new page
     */
    async transitionToPage(url) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        try {
            // Show loading overlay
            this.showLoadingOverlay();
            
            // Animate current page out
            await this.animatePageOut();
            
            // Navigate to new page
            window.location.href = url;
            
        } catch (error) {
            console.error('Page transition error:', error);
            this.hideLoadingOverlay();
            this.isTransitioning = false;
        }
    }

    /**
     * Animate page exit
     */
    animatePageOut() {
        return new Promise((resolve) => {
            const transitionElements = document.querySelectorAll('.page-transition.loaded, .form-container.loaded');
            
            transitionElements.forEach(element => {
                element.classList.remove('loaded');
            });
            
            setTimeout(resolve, this.transitionDuration);
        });
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay() {
        const overlay = document.getElementById('page-loading-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('page-loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * Show message with animation
     */
    showMessage(element) {
        if (element) {
            element.classList.add('show');
        }
    }

    /**
     * Hide message with animation
     */
    hideMessage(element) {
        if (element) {
            element.classList.remove('show');
        }
    }

    /**
     * Animate element entrance
     */
    animateIn(element, delay = 0) {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }

    /**
     * Animate element exit
     */
    animateOut(element, delay = 0) {
        setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-10px)';
        }, delay);
    }
}

// Initialize transition manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pageTransitions = new PageTransitionManager();
});

// Handle browser back/forward navigation
window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        // Page was loaded from cache, re-animate
        setTimeout(() => {
            if (window.pageTransitions) {
                window.pageTransitions.animatePageIn();
            }
        }, 50);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageTransitionManager;
}