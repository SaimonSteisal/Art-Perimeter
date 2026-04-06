/**
 * WidgetManager - Dynamic Renderer & Registry
 * Handles widget registration, loading and rendering from Firebase config
 */

const WidgetManager = (function() {
    'use strict';

    // Global registry for widget render functions
    const WidgetLibrary = window.WidgetLibrary || {};
    
    // Container ID where widgets will be rendered
    let mainContainerId = 'app-container';
    
    // Current page configuration (blocks array)
    let currentPageConfig = null;

    /**
     * Initialize the Widget Manager
     * @param {string} containerId - Main container DOM element ID
     */
    function init(containerId = 'app-container') {
        mainContainerId = containerId;
        console.log('🔧 WidgetManager initialized with container:', mainContainerId);
        
        // Ensure global registry exists
        window.WidgetLibrary = WidgetLibrary;
    }

    /**
     * Register a widget render function
     * @param {string} widgetId - Unique widget identifier
     * @param {Object} widgetModule - Module with render method
     */
    function registerWidget(widgetId, widgetModule) {
        if (!widgetId || typeof widgetId !== 'string') {
            console.error('❌ Invalid widget ID:', widgetId);
            return false;
        }
        
        if (!widgetModule || typeof widgetModule.render !== 'function') {
            console.error(`❌ Widget "${widgetId}" must have a render() function`);
            return false;
        }
        
        WidgetLibrary[widgetId] = widgetModule;
        console.log(`✅ Widget registered: ${widgetId}`);
        return true;
    }

    /**
     * Load and render all widgets from page configuration
     * @param {Array} blocks - Array of block configs from Firebase
     *                        Each block: { id, type, data, order }
     */
    function renderPage(blocks) {
        if (!Array.isArray(blocks)) {
            console.error('❌ renderPage: blocks must be an array');
            return;
        }

        currentPageConfig = blocks;
        const container = document.getElementById(mainContainerId);
        
        if (!container) {
            console.error(`❌ Container #${mainContainerId} not found`);
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Sort blocks by order if present
        const sortedBlocks = [...blocks].sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : 0;
            const orderB = b.order !== undefined ? b.order : 0;
            return orderA - orderB;
        });

        console.log(`🎨 Rendering ${sortedBlocks.length} widget(s)`);

        // Render each block
        sortedBlocks.forEach((block, index) => {
            renderBlock(block, index);
        });

        console.log('✅ Page rendering complete');
    }

    /**
     * Render a single block/widget
     * @param {Object} block - Block configuration
     * @param {number} index - Block index for unique container ID
     */
    function renderBlock(block, index) {
        const { type, data, id } = block;

        if (!type) {
            console.warn('⚠️  Block missing "type" property, skipping:', block);
            return;
        }

        const widgetModule = WidgetLibrary[type];
        
        if (!widgetModule) {
            console.error(`❌ Widget "${type}" not found in registry. Available:`, Object.keys(WidgetLibrary));
            
            // Render placeholder for missing widget
            renderMissingWidgetPlaceholder(type, data, index);
            return;
        }

        // Create unique container for this widget instance
        const containerId = id || `widget-${type}-${index}-${Date.now()}`;
        const container = document.createElement('div');
        container.id = containerId;
        container.className = `widget-instance widget-instance--${type}`;
        container.dataset.widgetType = type;
        container.dataset.widgetId = id || containerId;
        
        document.getElementById(mainContainerId).appendChild(container);

        // Call widget's render function
        try {
            widgetModule.render(data || {}, containerId);
            console.log(`   ✅ Rendered: ${type} (#${containerId})`);
        } catch (error) {
            console.error(`❌ Error rendering widget "${type}":`, error);
            container.innerHTML = `
                <div style="padding:20px;background:#fee;border:1px solid #fcc;color:#c00;">
                    <strong>Error rendering widget "${type}"</strong><br>
                    ${error.message}
                </div>
            `;
        }
    }

    /**
     * Render placeholder for missing/unregistered widgets
     */
    function renderMissingWidgetPlaceholder(type, data, index) {
        const container = document.createElement('div');
        container.id = `widget-${type}-${index}`;
        container.className = 'widget-instance widget-instance--missing';
        container.innerHTML = `
            <div style="padding:30px;background:#1a1a1a;border:2px dashed #444;text-align:center;color:#888;">
                <p style="font-size:1.25rem;margin-bottom:0.5rem;">⚠️ Widget "${type}" not found</p>
                <p style="font-size:0.875rem;">This widget type is not registered. Please add the widget module or remove this block.</p>
                <pre style="margin-top:1rem;background:#000;padding:1rem;text-align:left;font-size:0.75rem;overflow:auto;">${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
        document.getElementById(mainContainerId).appendChild(container);
    }

    /**
     * Re-render a specific block by ID
     * @param {string} blockId - Block instance ID
     * @param {Object} newData - New data to apply
     */
    function updateBlock(blockId, newData) {
        const container = document.getElementById(blockId);
        if (!container) {
            console.error(`❌ Container #${blockId} not found for update`);
            return;
        }

        const widgetType = container.dataset.widgetType;
        const widgetModule = WidgetLibrary[widgetType];

        if (widgetModule) {
            container.innerHTML = '';
            widgetModule.render(newData || {}, blockId);
            console.log(`🔄 Updated block: ${blockId}`);
        }
    }

    /**
     * Remove a block from DOM
     * @param {string} blockId - Block instance ID
     */
    function removeBlock(blockId) {
        const container = document.getElementById(blockId);
        if (container) {
            container.remove();
            console.log(`🗑️  Removed block: ${blockId}`);
        }
    }

    /**
     * Get list of registered widgets
     * @returns {Array<string>} Array of widget IDs
     */
    function getRegisteredWidgets() {
        return Object.keys(WidgetLibrary);
    }

    /**
     * Check if a widget is registered
     * @param {string} widgetId - Widget ID to check
     * @returns {boolean}
     */
    function isWidgetRegistered(widgetId) {
        return !!WidgetLibrary[widgetId];
    }

    return {
        init,
        registerWidget,
        renderPage,
        updateBlock,
        removeBlock,
        getRegisteredWidgets,
        isWidgetRegistered
    };
})();

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetManager;
}
