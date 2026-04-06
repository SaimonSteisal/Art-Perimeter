/**
 * Widget Manifest Builder
 * Scans /src/widgets directories and generates widgets-manifest.json
 */

const fs = require('fs');
const path = require('path');

const WIDGETS_DIR = path.join(__dirname, '..', 'src', 'widgets');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const MANIFEST_FILE = path.join(DIST_DIR, 'widgets-manifest.json');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

function validateConfig(config, widgetFolder) {
    const requiredFields = ['id', 'name', 'schema', 'initialData'];
    const missingFields = requiredFields.filter(field => !(field in config));
    
    if (missingFields.length > 0) {
        throw new Error(
            `Widget "${widgetFolder}" is missing required fields: ${missingFields.join(', ')}`
        );
    }
    
    if (typeof config.id !== 'string' || config.id.trim() === '') {
        throw new Error(`Widget "${widgetFolder}" has invalid or empty "id"`);
    }
    
    if (typeof config.schema !== 'object' || config.schema === null) {
        throw new Error(`Widget "${widgetFolder}" has invalid "schema" (must be an object)`);
    }
    
    return true;
}

function validateIndexJs(widgetFolder) {
    const indexPath = path.join(WIDGETS_DIR, widgetFolder, 'index.js');
    if (!fs.existsSync(indexPath)) {
        throw new Error(
            `Widget "${widgetFolder}" is missing required file: index.js`
        );
    }
    return true;
}

function readWidgetConfig(widgetFolder) {
    const configPath = path.join(WIDGETS_DIR, widgetFolder, 'config.json');
    
    if (!fs.existsSync(configPath)) {
        console.warn(`⚠️  Skipping "${widgetFolder}": No config.json found`);
        return null;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        // Validate config
        validateConfig(config, widgetFolder);
        
        // Validate index.js exists
        validateIndexJs(widgetFolder);
        
        return {
            id: config.id,
            name: config.name,
            previewImage: config.previewImage || null,
            schema: config.schema,
            initialData: config.initialData,
            folder: widgetFolder
        };
    } catch (error) {
        console.error(`❌ Error reading config for "${widgetFolder}":`, error.message);
        return null;
    }
}

function buildManifest() {
    console.log('🔍 Scanning widgets directory:', WIDGETS_DIR);
    
    if (!fs.existsSync(WIDGETS_DIR)) {
        console.error('❌ Widgets directory does not exist:', WIDGETS_DIR);
        process.exit(1);
    }
    
    const widgetFolders = fs.readdirSync(WIDGETS_DIR).filter(item => {
        const itemPath = path.join(WIDGETS_DIR, item);
        return fs.statSync(itemPath).isDirectory();
    });
    
    console.log(`📁 Found ${widgetFolders.length} widget folder(s)`);
    
    const widgets = [];
    
    for (const folder of widgetFolders) {
        console.log(`\n📦 Processing widget: ${folder}`);
        const config = readWidgetConfig(folder);
        
        if (config) {
            widgets.push(config);
            console.log(`   ✅ Added: ${config.name} (ID: ${config.id})`);
        }
    }
    
    const manifest = {
        version: Date.now(),
        generatedAt: new Date().toISOString(),
        widgets: widgets
    };
    
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Manifest built successfully!');
    console.log(`📄 Output: ${MANIFEST_FILE}`);
    console.log(`📊 Total widgets: ${widgets.length}`);
    console.log('='.repeat(50));
    
    return manifest;
}

// Run the build
buildManifest();

module.exports = { buildManifest };
