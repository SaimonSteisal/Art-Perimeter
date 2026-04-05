/**
 * METALLUM UI WIDGET: Material Cost Estimator Card
 * 
 * Architecture:
 * - Pure Vanilla JS Function
 * - Returns Template Literal (HTML) with Tailwind CSS
 * - Data-Driven via `data` object
 * - Glass-morphism styling per Metalium Guide
 */

// Safe DOM Check for Font Injection (Browser Environment Only)
if (typeof document !== 'undefined' && !document.getElementById('metallum-fonts')) {
    const link = document.createElement('link');
    link.id = 'metallum-fonts';
    link.rel = 'preconnect';
    link.href = 'https://fonts.googleapis.com';
    document.head.appendChild(link);

    const link2 = document.createElement('link');
    link2.rel = 'preconnect';
    link2.href = 'https://fonts.gstatic.com';
    link2.crossOrigin = 'anonymous';
    document.head.appendChild(link2);

    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@500;700&display=swap';
    document.head.appendChild(styles);
}

/**
 * Renders a Material Cost Estimator Card
 * @param {Object} data - Widget configuration data
 * @param {string} data.title - Card headline
 * @param {string} data.materialType - Type of metal (e.g., "Steel Beam", "Aluminum Sheet")
 * @param {number} data.basePricePerKg - Price per unit weight
 * @param {string} data.currency - Currency symbol
 * @param {string} data.contactEmail - Support email
 * @returns {string} HTML Template Literal
 */
function renderMaterialEstimator(data) {
    const widgetId = `metallum-est-${Date.now()}`;
    
    // Default values for stability
    const title = data.title || "Project Estimate";
    const material = data.materialType || "Standard Steel";
    const basePrice = parseFloat(data.basePricePerKg) || 0;
    const currency = data.currency || "$";
    const email = data.contactEmail || "info@metalco.com";

    return `
<!-- METALLUM WIDGET CONTAINER -->
<div id="${widgetId}" class="metallum-widget-wrapper font-inter text-gray-300 w-full max-w-md mx-auto">
    <style>
        #${widgetId} {
            --surface-lowest: #131319;
            --surface-container: rgba(30, 30, 40, 0.6);
            --emerald-accent: #4edea3;
            --outline-variant: rgba(255, 255, 255, 0.1);
        }
        #${widgetId} .glass-panel {
            background: var(--surface-container);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--outline-variant);
        }
        #${widgetId} input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: var(--emerald-accent);
            cursor: pointer;
            margin-top: -8px;
            box-shadow: 0 0 10px rgba(78, 222, 163, 0.5);
        }
        #${widgetId} input[type="range"]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
        }
        #${widgetId} .font-manrope { font-family: 'Manrope', sans-serif; }
        #${widgetId} .font-inter { font-family: 'Inter', sans-serif; }
    </style>

    <!-- Main Card -->
    <div class="glass-panel rounded-2xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        
        <!-- Decorative Glow -->
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <!-- Header -->
        <div class="flex flex-col gap-1 z-10">
            <h2 class="font-manrope text-xl font-bold text-white tracking-tight">${title}</h2>
            <p class="text-xs text-gray-400 uppercase tracking-wider font-medium">${material}</p>
        </div>

        <!-- Input Section: Weight Slider -->
        <div class="flex flex-col gap-3 z-10">
            <div class="flex justify-between items-end">
                <label class="text-sm font-medium text-gray-300">Estimated Weight (kg)</label>
                <span id="${widgetId}-weight-display" class="font-manrope text-emerald-400 font-bold text-lg">100 kg</span>
            </div>
            <input 
                type="range" 
                id="${widgetId}-weight-input" 
                min="1" 
                max="10000" 
                value="100" 
                step="10"
                class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#4edea3]"
            >
        </div>

        <!-- Calculation Display -->
        <div class="glass-panel rounded-xl p-4 flex flex-col justify-center items-center gap-1 border-white/5 bg-white/5">
            <span class="text-xs text-gray-400">Total Estimated Cost</span>
            <div class="flex items-baseline gap-1">
                <span class="font-manrope text-3xl font-bold text-white" id="${widgetId}-total-cost">${currency}0.00</span>
            </div>
            <p class="text-[10px] text-gray-500 mt-1">*Excludes taxes and shipping</p>
        </div>

        <!-- Action Button -->
        <button 
            id="${widgetId}-quote-btn"
            class="group relative w-full py-3.5 px-4 rounded-xl bg-[#4edea3] hover:bg-[#3cc992] transition-all duration-300 ease-out flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(78,222,163,0.2)] hover:shadow-[0_0_30px_rgba(78,222,163,0.4)] active:scale-[0.98]"
        >
            <span class="text-surface-lowest font-manrope font-bold text-sm uppercase tracking-wide">Request Formal Quote</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-surface-lowest group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
        </button>
        
        <!-- Footer -->
        <div class="text-center">
            <a href="mailto:${email}" class="text-xs text-gray-500 hover:text-[#4edea3] transition-colors">Contact Engineering Team</a>
        </div>
    </div>

    <!-- Interaction Logic -->
    <script>
        (function() {
            const root = document.getElementById('${widgetId}');
            const slider = root.querySelector('#${widgetId}-weight-input');
            const display = root.querySelector('#${widgetId}-weight-display');
            const totalDisplay = root.querySelector('#${widgetId}-total-cost');
            const btn = root.querySelector('#${widgetId}-quote-btn');
            
            const baseRate = ${basePrice};
            const currencySymbol = '${currency}';

            function updateCalculation() {
                const weight = parseInt(slider.value);
                const total = weight * baseRate;
                
                // Update UI
                display.textContent = \`\${weight.toLocaleString()} kg\`;
                totalDisplay.textContent = \`\${currencySymbol}\${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\`;
            }

            // Event Listeners
            slider.addEventListener('input', updateCalculation);
            
            btn.addEventListener('click', () => {
                const weight = slider.value;
                const total = (weight * baseRate).toFixed(2);
                const subject = encodeURIComponent('Quote Request: ${material}');
                const body = encodeURIComponent(\`Hello,\\n\\nI would like a formal quote for:\\nMaterial: ${material}\\nWeight: \${weight} kg\\nEstimated Cost: \${currencySymbol}\${total}\\n\\nThank you.\`);
                
                window.location.href = \`mailto:${email}?subject=\${subject}&body=\${body}\`;
            });

            // Initial Run
            updateCalculation();
        })();
    <\/script>
</div>
`;
}

/**
 * WIDGET REGISTRY
 * Centralized factory for stable widget instantiation.
 * Add new widgets here as they are developed.
 */
const widgets = {
    estimator: (data) => renderMaterialEstimator(data),
    // Future widgets can be added here:
    // hero: (data) => renderHeroWidget(data),
    // gallery: (data) => renderGalleryWidget(data),
    // contact: (data) => renderContactForm(data),
};

// Export for module usage or attach to window for CDN usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderMaterialEstimator, widgets };
} else if (typeof window !== 'undefined') {
    window.renderMaterialEstimator = renderMaterialEstimator;
    window.metallumWidgets = widgets;
}
