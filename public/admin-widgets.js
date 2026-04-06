/**
 * Admin Widget Manager
 * Handles widget gallery, dynamic form generation, and Firebase sync
 */

const AdminWidgetManager = (function() {
    'use strict';

    let manifest = null;
    let currentBlocks = [];
    let selectedBlockIndex = -1;
    const MANIFEST_URL = '/dist/widgets-manifest.json';

    /**
     * Initialize the Admin Widget Manager
     */
    async function init() {
        await loadManifest();
        setupEventListeners();
        console.log('🎛️ AdminWidgetManager initialized');
    }

    /**
     * Load widgets manifest from dist folder
     */
    async function loadManifest() {
        try {
            const response = await fetch(MANIFEST_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            manifest = await response.json();
            console.log(`✅ Loaded manifest with ${manifest.widgets.length} widgets`);
            renderWidgetGallery();
        } catch (error) {
            console.error('❌ Failed to load manifest:', error);
            manifest = { widgets: [] };
        }
    }

    /**
     * Setup event listeners for widget management
     */
    function setupEventListeners() {
        // Add block button
        const addBlockBtn = document.getElementById('add-widget-btn');
        if (addBlockBtn) {
            addBlockBtn.addEventListener('click', showWidgetGallery);
        }

        // Save changes button
        const saveBtn = document.getElementById('save-blocks-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveBlocksToFirebase);
        }

        // Form auto-save on change
        const inspectorForm = document.getElementById('widget-inspector-form');
        if (inspectorForm) {
            inspectorForm.addEventListener('input', debounce(onFormDataChange, 500));
        }
    }

    /**
     * Render widget gallery grid
     */
    function renderWidgetGallery() {
        const galleryContainer = document.getElementById('widget-gallery');
        if (!galleryContainer) return;

        if (!manifest || !manifest.widgets || manifest.widgets.length === 0) {
            galleryContainer.innerHTML = `
                <div style="text-align:center;padding:40px;color:#888;">
                    No widgets available. Run the build script first.
                </div>
            `;
            return;
        }

        galleryContainer.innerHTML = manifest.widgets.map(widget => `
            <div class="widget-gallery-item" data-widget-id="${widget.id}" onclick="AdminWidgetManager.addWidget('${widget.id}')">
                <div class="widget-preview">
                    ${widget.previewImage 
                        ? `<img src="${widget.previewImage}" alt="${widget.name}" onerror="this.style.display='none'">`
                        : '<div class="widget-preview-placeholder">📦</div>'
                    }
                </div>
                <div class="widget-info">
                    <h4>${escapeHtml(widget.name)}</h4>
                    <span class="widget-id-badge">${escapeHtml(widget.id)}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Show widget gallery modal/panel
     */
    function showWidgetGallery() {
        const galleryPanel = document.getElementById('widget-gallery-panel');
        if (galleryPanel) {
            galleryPanel.classList.remove('hidden');
        }
    }

    /**
     * Add a new widget block
     * @param {string} widgetId - Widget type ID from manifest
     */
    function addWidget(widgetId) {
        const widgetConfig = manifest.widgets.find(w => w.id === widgetId);
        
        if (!widgetConfig) {
            console.error(`Widget "${widgetId}" not found in manifest`);
            return;
        }

        const newBlock = {
            id: generateUniqueId(),
            type: widgetId,
            data: JSON.parse(JSON.stringify(widgetConfig.initialData)), // Deep copy
            order: currentBlocks.length
        };

        currentBlocks.push(newBlock);
        renderBlocksList();
        selectBlock(currentBlocks.length - 1);
        
        // Close gallery if open
        const galleryPanel = document.getElementById('widget-gallery-panel');
        if (galleryPanel) {
            galleryPanel.classList.add('hidden');
        }

        console.log(`✅ Added widget: ${widgetId}`);
    }

    /**
     * Render the list of current blocks
     */
    function renderBlocksList() {
        const listContainer = document.getElementById('blocks-list');
        if (!listContainer) return;

        if (currentBlocks.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center;padding:40px;color:#888;">
                    No blocks added yet. Click "Add Widget" to start.
                </div>
            `;
            return;
        }

        listContainer.innerHTML = currentBlocks.map((block, index) => `
            <div class="block-list-item ${selectedBlockIndex === index ? 'selected' : ''}" 
                 data-block-index="${index}"
                 onclick="AdminWidgetManager.selectBlock(${index})">
                <div class="block-drag-handle">⋮⋮</div>
                <div class="block-info">
                    <span class="block-type">${escapeHtml(block.type)}</span>
                    <span class="block-order">#${index + 1}</span>
                </div>
                <button class="block-remove-btn" onclick="event.stopPropagation(); AdminWidgetManager.removeBlock(${index})">×</button>
            </div>
        `).join('');
    }

    /**
     * Select a block for editing
     * @param {number} index - Block index in currentBlocks array
     */
    function selectBlock(index) {
        if (index < 0 || index >= currentBlocks.length) {
            selectedBlockIndex = -1;
            renderBlocksList();
            clearInspector();
            return;
        }

        selectedBlockIndex = index;
        const block = currentBlocks[index];
        
        renderBlocksList();
        generateInspectorForm(block);
    }

    /**
     * Generate dynamic form based on widget schema
     * @param {Object} block - Block with type and data
     */
    function generateInspectorForm(block) {
        const formContainer = document.getElementById('widget-inspector-form');
        if (!formContainer) return;

        const widgetConfig = manifest.widgets.find(w => w.id === block.type);
        
        if (!widgetConfig) {
            formContainer.innerHTML = `
                <div style="padding:20px;background:#fee;color:#c00;">
                    Unknown widget type: ${block.type}
                </div>
            `;
            return;
        }

        let formHTML = `
            <div class="inspector-header">
                <h3>${escapeHtml(widgetConfig.name)}</h3>
                <span class="widget-id-badge">${escapeHtml(block.type)}</span>
            </div>
        `;

        formHTML += '<div class="inspector-fields">';

        // Generate fields from schema
        for (const [fieldName, fieldSchema] of Object.entries(widgetConfig.schema)) {
            const fieldValue = block.data[fieldName] !== undefined 
                ? block.data[fieldName] 
                : (fieldSchema.default || '');

            formHTML += generateFieldHTML(fieldName, fieldSchema, fieldValue);
        }

        formHTML += '</div>';

        formContainer.innerHTML = formHTML;
    }

    /**
     * Generate HTML for a single form field
     */
    function generateFieldHTML(fieldName, schema, value) {
        const fieldId = `field-${fieldName}`;
        const label = schema.label || fieldName;
        const required = schema.required ? 'required' : '';
        const placeholder = schema.placeholder || '';

        let inputHTML = '';

        switch (schema.type) {
            case 'textarea':
                inputHTML = `<textarea id="${fieldId}" name="${fieldName}" rows="4" ${required} placeholder="${placeholder}">${escapeHtml(value)}</textarea>`;
                break;

            case 'image':
                inputHTML = `
                    <div class="image-field">
                        <input type="text" id="${fieldId}" name="${fieldName}" value="${escapeHtml(value)}" ${required} placeholder="Image URL">
                        ${value ? `<img src="${escapeHtml(value)}" alt="Preview" class="image-preview">` : ''}
                    </div>
                `;
                break;

            case 'number':
                inputHTML = `<input type="number" id="${fieldId}" name="${fieldName}" value="${escapeHtml(value)}" ${required} placeholder="${placeholder}">`;
                break;

            case 'checkbox':
                inputHTML = `
                    <label class="checkbox-label">
                        <input type="checkbox" id="${fieldId}" name="${fieldName}" ${value ? 'checked' : ''}>
                        <span>${label}</span>
                    </label>
                `;
                break;

            case 'array':
                inputHTML = generateArrayFieldHTML(fieldName, schema, value);
                break;

            case 'text':
            default:
                inputHTML = `<input type="text" id="${fieldId}" name="${fieldName}" value="${escapeHtml(value)}" ${required} placeholder="${placeholder}" maxlength="${schema.maxLength || ''}">`;
                break;
        }

        if (schema.type !== 'checkbox') {
            return `
                <div class="form-field" data-field-name="${fieldName}">
                    <label for="${fieldId}">${label}${schema.required ? '<span class="required">*</span>' : ''}</label>
                    ${inputHTML}
                </div>
            `;
        }

        return `
            <div class="form-field form-field--checkbox" data-field-name="${fieldName}">
                ${inputHTML}
            </div>
        `;
    }

    /**
     * Generate HTML for array fields (repeater)
     */
    function generateArrayFieldHTML(fieldName, schema, items) {
        if (!Array.isArray(items)) items = [];
        const itemSchema = schema.itemSchema || {};

        let html = `<div class="array-field" data-field-name="${fieldName}">`;
        html += `<div class="array-items">`;

        items.forEach((item, itemIndex) => {
            html += `
                <div class="array-item" data-item-index="${itemIndex}">
                    <div class="array-item-header">
                        <span>${schema.label} #${itemIndex + 1}</span>
                        <button type="button" class="array-item-remove" onclick="AdminWidgetManager.removeArrayItem('${fieldName}', ${itemIndex})">×</button>
                    </div>
                    <div class="array-item-fields">
            `;

            for (const [subFieldName, subFieldSchema] of Object.entries(itemSchema)) {
                const subFieldValue = item[subFieldName] || '';
                const subFieldId = `${fieldName}-${itemIndex}-${subFieldName}`;
                
                if (subFieldSchema.type === 'textarea') {
                    html += `
                        <div class="sub-field">
                            <label>${subFieldSchema.label || subFieldName}</label>
                            <textarea name="${subFieldName}" data-item-index="${itemIndex}">${escapeHtml(subFieldValue)}</textarea>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="sub-field">
                            <label>${subFieldSchema.label || subFieldName}</label>
                            <input type="${subFieldSchema.type || 'text'}" name="${subFieldName}" data-item-index="${itemIndex}" value="${escapeHtml(subFieldValue)}">
                        </div>
                    `;
                }
            }

            html += `</div></div>`;
        });

        html += `</div>`;
        html += `<button type="button" class="btn btn-secondary btn-sm" onclick="AdminWidgetManager.addArrayItem('${fieldName}')">+ Add ${schema.label || 'Item'}</button>`;
        html += `</div>`;

        return html;
    }

    /**
     * Handle form data change (auto-save)
     */
    function onFormDataChange(event) {
        if (selectedBlockIndex < 0 || selectedBlockIndex >= currentBlocks.length) return;

        const block = currentBlocks[selectedBlockIndex];
        const form = document.getElementById('widget-inspector-form');
        const formData = new FormData(form);

        // Update block data from form
        for (const [fieldName, fieldSchema] of Object.entries(manifest.widgets.find(w => w.id === block.type)?.schema || {})) {
            if (fieldSchema.type === 'array') {
                // Handle array fields separately
                block.data[fieldName] = collectArrayData(fieldName, fieldSchema);
            } else if (fieldSchema.type === 'checkbox') {
                const checkbox = form.querySelector(`[name="${fieldName}"]`);
                block.data[fieldName] = checkbox?.checked || false;
            } else {
                block.data[fieldName] = formData.get(fieldName) || '';
            }
        }

        console.log('🔄 Block data updated:', block.data);
    }

    /**
     * Collect data from array/repeater fields
     */
    function collectArrayData(fieldName, schema) {
        const arrayContainer = document.querySelector(`.array-field[data-field-name="${fieldName}"]`);
        if (!arrayContainer) return [];

        const items = [];
        const arrayItems = arrayContainer.querySelectorAll('.array-item');

        arrayItems.forEach(itemEl => {
            const itemData = {};
            const itemIndex = itemEl.dataset.itemIndex;

            for (const [subFieldName] of Object.entries(schema.itemSchema || {})) {
                const input = itemEl.querySelector(`[name="${subFieldName}"][data-item-index="${itemIndex}"]`);
                if (input) {
                    itemData[subFieldName] = input.type === 'checkbox' ? input.checked : input.value;
                }
            }

            items.push(itemData);
        });

        return items;
    }

    /**
     * Add new item to array field
     */
    function addArrayItem(fieldName) {
        if (selectedBlockIndex < 0) return;

        const block = currentBlocks[selectedBlockIndex];
        const widgetConfig = manifest.widgets.find(w => w.id === block.type);
        const fieldSchema = widgetConfig?.schema?.[fieldName];

        if (!fieldSchema || fieldSchema.type !== 'array') return;

        if (!Array.isArray(block.data[fieldName])) {
            block.data[fieldName] = [];
        }

        // Create new item with empty/default values
        const newItem = {};
        for (const [subFieldName, subFieldSchema] of Object.entries(fieldSchema.itemSchema || {})) {
            newItem[subFieldName] = subFieldSchema.default || '';
        }

        block.data[fieldName].push(newItem);
        
        // Re-generate form to show new item
        generateInspectorForm(block);
    }

    /**
     * Remove item from array field
     */
    function removeArrayItem(fieldName, itemIndex) {
        if (selectedBlockIndex < 0) return;

        const block = currentBlocks[selectedBlockIndex];
        if (Array.isArray(block.data[fieldName])) {
            block.data[fieldName].splice(itemIndex, 1);
            generateInspectorForm(block);
        }
    }

    /**
     * Remove a block
     */
    function removeBlock(index) {
        if (index < 0 || index >= currentBlocks.length) return;

        currentBlocks.splice(index, 1);

        if (selectedBlockIndex >= currentBlocks.length) {
            selectedBlockIndex = currentBlocks.length - 1;
        }

        renderBlocksList();
        
        if (selectedBlockIndex >= 0) {
            selectBlock(selectedBlockIndex);
        } else {
            clearInspector();
        }
    }

    /**
     * Clear inspector panel
     */
    function clearInspector() {
        const formContainer = document.getElementById('widget-inspector-form');
        if (formContainer) {
            formContainer.innerHTML = `
                <div style="text-align:center;padding:40px;color:#888;">
                    Select a block to edit its properties
                </div>
            `;
        }
    }

    /**
     * Save blocks configuration to Firebase
     */
    async function saveBlocksToFirebase() {
        try {
            const response = await fetch('/api/save-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: localStorage.getItem('adminToken'),
                    blocks: currentBlocks
                })
            });

            if (response.ok) {
                alert('✅ Blocks saved successfully!');
                console.log('📦 Saved blocks:', currentBlocks);
            } else {
                alert('❌ Failed to save. Please re-login.');
            }
        } catch (error) {
            console.error('❌ Save error:', error);
            alert('❌ Connection error');
        }
    }

    /**
     * Load blocks from Firebase/API
     */
    async function loadBlocksFromAPI() {
        try {
            const response = await fetch('/api/site-config');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const config = await response.json();
            currentBlocks = config.blocks || [];
            renderBlocksList();
        } catch (error) {
            console.error('❌ Failed to load blocks:', error);
            currentBlocks = [];
        }
    }

    /**
     * Set blocks from external source
     */
    function setBlocks(blocks) {
        currentBlocks = blocks || [];
        selectedBlockIndex = -1;
        renderBlocksList();
        clearInspector();
    }

    /**
     * Get current blocks
     */
    function getBlocks() {
        return currentBlocks;
    }

    /**
     * Generate unique ID for new blocks
     */
    function generateUniqueId() {
        return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Debounce utility
     */
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

    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init,
        addWidget,
        selectBlock,
        removeBlock,
        removeArrayItem,
        addArrayItem,
        setBlocks,
        getBlocks,
        loadBlocksFromAPI,
        saveBlocksToFirebase,
        showWidgetGallery,
        renderWidgetGallery
    };
})();

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', AdminWidgetManager.init);
}
