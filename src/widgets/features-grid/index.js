/**
 * Features Grid Widget Renderer
 * Renders a grid of feature items with icons, titles and descriptions
 */

(function() {
    'use strict';

    /**
     * Render function for features-grid widget
     * @param {Object} data - Widget data from Firebase
     * @param {string} containerId - Target container ID to render into
     */
    function render(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container #${containerId} not found for features-grid widget`);
            return;
        }

        const {
            title = '',
            features = []
        } = data || {};

        const featuresHTML = features.map(item => `
            <div class="feature-item fade-in">
                ${item.icon ? `<div class="feature-icon">${escapeHtml(item.icon)}</div>` : ''}
                ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
                ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
            </div>
        `).join('');

        container.innerHTML = `
            <section class="features widget-features-grid">
                <div class="container">
                    ${title ? `
                        <div class="section-title fade-in">
                            <h2>${escapeHtml(title)}</h2>
                        </div>
                    ` : ''}
                    <div class="features-grid">
                        ${featuresHTML}
                    </div>
                </div>
            </section>
        `;

        // Re-initialize animations if needed
        if (typeof initAnimations === 'function') {
            initAnimations();
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Register in global WidgetLibrary
    window.WidgetLibrary = window.WidgetLibrary || {};
    window.WidgetLibrary['features-grid'] = { render };

    console.log('✅ Widget "features-grid" registered');
})();
