/**
 * Fix Button Flashing Issue
 * Prevents rapid blue/white flashing on hover by stabilizing intervals and event handlers
 */
(function() {
    'use strict';

    console.log('🔧 BUTTON FLASH FIX: Loading...');

    // Track existing intervals to prevent duplicates
    const trackedIntervals = new Set();

    // Override setInterval to prevent rapid button updates
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, delay) {
        // If the interval is too fast (< 200ms), slow it down
        if (delay < 200) {
            console.log(`🔧 BUTTON FLASH FIX: Slowing down rapid interval from ${delay}ms to 500ms`);
            delay = 500;
        }

        return originalSetInterval.call(this, callback, delay);
    };

    // Debounce function to prevent rapid style changes
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Stabilize button hover effects
    function stabilizeButtonHovers() {
        const buttons = document.querySelectorAll('button, .btn, [role="button"], .action-button, .clickable');

        buttons.forEach(button => {
            // Remove any existing hover listeners that might cause flashing
            if (button._hoverFixed) return;

            button.addEventListener('mouseenter', debounce(() => {
                button.style.transition = 'all 0.2s ease';
            }, 50));

            button.addEventListener('mouseleave', debounce(() => {
                button.style.transition = 'all 0.2s ease';
            }, 50));

            button._hoverFixed = true;
        });
    }

    // Prevent CSS animation conflicts that cause flashing
    function preventFlashingAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            /* Prevent rapid CSS transitions that cause flashing */
            button, .btn, [role="button"], .action-button, .clickable {
                transition: all 0.2s ease !important;
            }

            /* Stabilize hover effects */
            button:hover, .btn:hover, [role="button"]:hover,
            .action-button:hover, .clickable:hover {
                transition: all 0.2s ease !important;
                animation: none !important;
            }

            @keyframes none {
                from { opacity: 1; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize fixes
    function initializeButtonFlashFix() {
        preventFlashingAnimations();
        stabilizeButtonHovers();
    }

    // Run immediately and on DOM changes
    initializeButtonFlashFix();

    // Watch for new buttons being added
    const observer = new MutationObserver(debounce(() => {
        stabilizeButtonHovers();
    }, 200));

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also run after page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeButtonFlashFix);
    } else {
        setTimeout(initializeButtonFlashFix, 100);
    }

    console.log('✅ BUTTON FLASH FIX: Loaded - button flashing should be reduced');

})();