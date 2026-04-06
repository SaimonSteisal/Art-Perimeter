/**
 * Hero Main Widget Renderer
 * Renders the hero section with background image, title, subtitle, description and CTA
 */

(function() {
    'use strict';

    /**
     * Render function for hero-main widget
     * @param {Object} data - Widget data from Firebase
     * @param {string} containerId - Target container ID to render into
     */
    function render(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container #${containerId} not found for hero-main widget`);
            return;
        }

        const {
            title = '',
            subtitle = '',
            description = '',
            ctaText = '',
            ctaLink = '#',
            backgroundImage = ''
        } = data || {};

        const bgStyle = backgroundImage ? `background-image: url('${backgroundImage}')` : '';

        container.innerHTML = `
            <section class="hero widget-hero-main fade-in" style="${bgStyle}">
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    ${subtitle ? `<div class="hero-subtitle">${escapeHtml(subtitle)}</div>` : ''}
                    ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
                    ${description ? `<p>${escapeHtml(description)}</p>` : ''}
                    ${ctaText ? `<a href="${escapeHtml(ctaLink)}" class="hero-cta">${escapeHtml(ctaText)}</a>` : ''}
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
    window.WidgetLibrary['hero-main'] = { render };

    console.log('✅ Widget "hero-main" registered');
})();
