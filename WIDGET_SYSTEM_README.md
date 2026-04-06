# Widget Registry & Dynamic Loader System

## 📋 Overview

This system transforms a static website into a modular CMS where new sections (widgets) can be added by simply dropping a folder into `/src/widgets` and running a build script.

### Architecture Layers

1. **Build Layer (Node.js)** - `scripts/build-widgets.js`
2. **Storage Layer (Firebase)** - Site config with blocks array
3. **Render Layer (Vanilla JS)** - `widget-manager.js`

---

## 🚀 Quick Start

### 1. Build the Widget Manifest

```bash
npm run build:widgets
```

This scans `/src/widgets/*` and generates `dist/widgets-manifest.json`.

### 2. Watch for Changes (Development)

```bash
npm run watch:widgets
```

Auto-rebuilds manifest when widget files change.

### 3. Open Admin Panel

Navigate to `/public/admin-widgets.html` in your browser.

---

## 📁 Creating a New Widget

### Step 1: Create Widget Folder

```bash
mkdir -p /src/widgets/my-new-widget
```

### Step 2: Add config.json

```json
{
  "id": "my-new-widget",
  "name": "My New Widget",
  "previewImage": "/assets/previews/my-widget.png",
  "schema": {
    "title": {
      "type": "text",
      "label": "Title",
      "required": true
    },
    "content": {
      "type": "textarea",
      "label": "Content",
      "required": false
    }
  },
  "initialData": {
    "title": "Default Title",
    "content": "Default content"
  }
}
```

### Step 3: Add index.js (Renderer)

```javascript
(function() {
    'use strict';

    function render(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { title = '', content = '' } = data || {};

        container.innerHTML = `
            <section class="my-widget">
                <h2>${escapeHtml(title)}</h2>
                <div>${escapeHtml(content)}</div>
            </section>
        `;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Register widget
    window.WidgetLibrary = window.WidgetLibrary || {};
    window.WidgetLibrary['my-new-widget'] = { render };
})();
```

### Step 4: Rebuild

```bash
npm run build:widgets
```

---

## 🔧 File Structure

```
/workspace
├── scripts/
│   ├── build-widgets.js      # Manifest builder
│   └── watch-widgets.js      # Development watcher
├── src/
│   └── widgets/
│       ├── hero-main/
│       │   ├── config.json   # Widget metadata & schema
│       │   └── index.js      # Render function
│       └── features-grid/
│           ├── config.json
│           └── index.js
├── dist/
│   └── widgets-manifest.json # Generated manifest
├── public/
│   ├── widget-manager.js     # Client-side renderer
│   ├── admin-widgets.js      # Admin panel logic
│   ├── admin-widgets.html    # Admin UI
│   └── ...
└── package.json
```

---

## 📦 Widget Config Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique widget identifier (kebab-case) |
| `name` | string | Human-readable name for admin panel |
| `schema` | object | Field definitions for property inspector |
| `initialData` | object | Default values for new instances |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `previewImage` | string | URL/path to preview image |

### Schema Field Types

| Type | Input Generated | Description |
|------|-----------------|-------------|
| `text` | `<input type="text">` | Single-line text |
| `textarea` | `<textarea>` | Multi-line text |
| `number` | `<input type="number">` | Numeric input |
| `image` | `<input type="text">` + preview | Image URL |
| `checkbox` | `<input type="checkbox">` | Boolean toggle |
| `array` | Repeater UI | List of items |

---

## 🎛️ Admin Panel Features

### Widget Gallery
- Visual grid of available widgets
- Click to add widget to page

### Blocks List
- Ordered list of page blocks
- Select to edit properties
- Remove blocks

### Property Inspector
- Auto-generated forms from schema
- Real-time data binding
- Support for nested arrays (repeaters)

### Preview Tab
- Live preview using WidgetManager
- Renders widgets as they appear on site

---

## 🔌 WidgetManager API

### Methods

```javascript
// Initialize with container ID
WidgetManager.init('app-container');

// Register a widget manually
WidgetManager.registerWidget('widget-id', { render });

// Render all blocks from config
WidgetManager.renderPage([
    { id: 'block-1', type: 'hero-main', data: {...}, order: 0 },
    { id: 'block-2', type: 'features-grid', data: {...}, order: 1 }
]);

// Update specific block
WidgetManager.updateBlock('block-1', newData);

// Remove block
WidgetManager.removeBlock('block-1');

// Get registered widgets
WidgetManager.getRegisteredWidgets();

// Check if widget exists
WidgetManager.isWidgetRegistered('hero-main');
```

---

## 💾 Firebase Integration

### Data Structure

```javascript
// Firestore document: siteConfig
{
  "blocks": [
    {
      "id": "block-unique-id",
      "type": "hero-main",
      "data": {
        "title": "Welcome",
        "subtitle": "Subtitle here",
        ...
      },
      "order": 0
    },
    ...
  ]
}
```

### API Endpoints (to implement)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/site-config` | GET | Load blocks configuration |
| `/api/save-blocks` | POST | Save blocks array |

---

## 🎨 Design System: METALLUM

- **Background**: Dark (#0a0a0a, #1a1a1a)
- **Accent**: Gold (#c9a227)
- **Text**: White/Gray gradient
- **Style**: Industrial, high-contrast

---

## ✅ Validation Rules

The build script validates:

1. `config.json` exists in widget folder
2. Required fields present (`id`, `name`, `schema`, `initialData`)
3. `index.js` render file exists
4. Valid JSON syntax
5. Unique widget IDs

---

## 🐛 Troubleshooting

### Widget not appearing in gallery
- Run `npm run build:widgets`
- Check console for validation errors
- Verify `config.json` has required fields

### Render error in preview
- Check browser console for errors
- Ensure widget is registered: `console.log(Object.keys(window.WidgetLibrary))`
- Verify `index.js` calls registration code

### Manifest not updating
- Stop and restart watch script
- Delete `dist/widgets-manifest.json` and rebuild

---

## 📝 Example: Adding Calculator Widget

```bash
# 1. Create folder
mkdir -p /src/widgets/calculator-pro

# 2. Create config.json
cat > /src/widgets/calculator-pro/config.json << 'EOF'
{
  "id": "calculator-pro",
  "name": "Advanced Calculator",
  "schema": {
    "basePrice": {
      "type": "number",
      "label": "Base Price",
      "required": true
    },
    "options": {
      "type": "array",
      "label": "Options",
      "itemSchema": {
        "name": { "type": "text", "label": "Name" },
        "price": { "type": "number", "label": "Price" }
      }
    }
  },
  "initialData": {
    "basePrice": 1000,
    "options": []
  }
}
EOF

# 3. Create index.js (renderer implementation)
# 4. Run build
npm run build:widgets
```

---

## 🔐 Security Notes

1. Always escape HTML in widget renderers
2. Validate user input in admin panel
3. Use authentication for admin routes
4. Sanitize data before saving to Firebase

---

## 📄 License

Internal use only - Art Perimetr Project
