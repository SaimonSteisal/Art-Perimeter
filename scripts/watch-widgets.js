/**
 * Widget Build Watcher
 * Watches /src/widgets for changes and rebuilds manifest automatically
 */

const chokidar = require('chokidar');
const path = require('path');
const { buildManifest } = require('./build-widgets');

const WIDGETS_DIR = path.join(__dirname, '..', 'src', 'widgets');

console.log('👁️  Watching for widget changes...');
console.log(`📁 Directory: ${WIDGETS_DIR}`);
console.log('Press Ctrl+C to stop\n');

// Initial build
buildManifest();

// Watch for changes
const watcher = chokidar.watch(WIDGETS_DIR, {
    persistent: true,
    ignoreInitial: true,
    ignored: /(^|[\/\\])\../ // ignore dotfiles
});

let debounceTimer;

function debouncedRebuild(event, filePath) {
    clearTimeout(debounceTimer);
    
    const fileName = path.basename(filePath);
    
    // Skip non-config files for immediate rebuild
    if (fileName !== 'config.json' && !filePath.endsWith('.js')) {
        console.log(`📝 Detected change: ${event} - ${path.relative(WIDGETS_DIR, filePath)}`);
        return;
    }
    
    debounceTimer = setTimeout(() => {
        console.log(`\n🔄 Rebuilding manifest due to ${event}: ${path.relative(WIDGETS_DIR, filePath)}\n`);
        buildManifest();
        console.log('\n👁️  Watching...\n');
    }, 500);
}

watcher
    .on('add', (path) => debouncedRebuild('add', path))
    .on('change', (path) => debouncedRebuild('change', path))
    .on('unlink', (path) => debouncedRebuild('unlink', path))
    .on('addDir', (path) => {
        console.log(`📁 New widget folder detected: ${path.basename(path)}`);
    })
    .on('unlinkDir', (path) => {
        console.log(`🗑️  Widget folder removed: ${path.basename(path)}`);
        debouncedRebuild('unlinkDir', path);
    })
    .on('error', (error) => {
        console.error('❌ Watcher error:', error);
    });

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping watcher...');
    watcher.close().then(() => {
        process.exit(0);
    });
});
