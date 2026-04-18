/**
 * Calculator Engine for Art Perimeter
 * Client-side calculation logic for fence cost estimation
 * 
 * Formula: total = length × fencePrice × heightMultiplier × paintMultiplier + addons + delivery - discount
 * 
 * Rules:
 * - Discount: 5% off when area > 100m²
 * - Height multipliers: 1.5m (×1.0), 1.8m (×1.15), 2.0m (×1.25), 2.5m (×1.5)
 * - Paint options: none (×1.0), ground-эмаль (×1.1), powder (×1.2)
 * - Delivery: flat fee 5000₽
 */

(function() {
  'use strict';

  // ==================== CONSTANTS ====================
  
  const HEIGHT_MULTIPLIERS = [
    { value: 1.5, label: '1.5 м', multiplier: 1.0 },
    { value: 1.8, label: '1.8 м', multiplier: 1.15 },
    { value: 2.0, label: '2.0 м', multiplier: 1.25 },
    { value: 2.5, label: '2.5 м', multiplier: 1.5 }
  ];

  const PAINT_OPTIONS = [
    { id: 'none', name: 'Без покраски', multiplier: 1.0 },
    { id: 'ground', name: 'Грунт-эмаль', multiplier: 1.1 },
    { id: 'powder', name: 'Порошковая покраска', multiplier: 1.2 }
  ];

  const DELIVERY_FEE = 5000;
  const DISCOUNT_THRESHOLD = 100; // m²
  const DISCOUNT_PERCENT = 5;

  const STORAGE_KEY = 'artPerimeterCalculatorState';

  // ==================== CORE CALCULATION FUNCTIONS ====================

  /**
   * Get height multiplier by height value
   * @param {number} height - Height in meters
   * @returns {number} Multiplier value
   */
  function getHeightMultiplier(height) {
    const heightOpt = HEIGHT_MULTIPLIERS.find(h => h.value === height);
    return heightOpt ? heightOpt.multiplier : 1.0;
  }

  /**
   * Get paint multiplier by paint option ID
   * @param {string} paintId - Paint option ID ('none', 'ground', 'powder')
   * @returns {number} Multiplier value
   */
  function getPaintMultiplier(paintId) {
    const paintOpt = PAINT_OPTIONS.find(p => p.id === paintId);
    return paintOpt ? paintOpt.multiplier : 1.0;
  }

  /**
   * Calculate total fence cost
   * @param {Object} params - Calculation parameters
   * @param {number} params.fencePrice - Price per meter of selected fence type
   * @param {number} params.length - Length of fence in meters
   * @param {number} params.height - Height of fence in meters
   * @param {string} params.paintOption - Paint option ID
   * @param {Array} params.addons - Array of addon objects with price property
   * @param {boolean} params.includeDelivery - Whether to include delivery fee
   * @returns {Object} Calculation result with breakdown
   */
  function calculate(params) {
    const {
      fencePrice,
      length,
      height,
      paintOption,
      addons = [],
      includeDelivery = false
    } = params;

    // Validate inputs
    if (!fencePrice || !length || length <= 0) {
      return {
        error: 'Укажите цену и длину забора',
        valid: false
      };
    }

    // Get multipliers
    const heightMultiplier = getHeightMultiplier(height);
    const paintMultiplier = getPaintMultiplier(paintOption);

    // Calculate fence cost
    const fenceCost = length * fencePrice * heightMultiplier * paintMultiplier;

    // Calculate addons cost
    const addonsCost = Array.isArray(addons) 
      ? addons.reduce((sum, addon) => sum + (addon.price || 0), 0) 
      : 0;

    // Calculate delivery cost
    const deliveryCost = includeDelivery ? DELIVERY_FEE : 0;

    // Calculate subtotal
    let subtotal = fenceCost + addonsCost + deliveryCost;

    // Calculate area for discount
    const effectiveHeight = height || 2; // Default to 2m if not specified
    const area = length * effectiveHeight;

    // Apply discount if area > 100m²
    let discount = 0;
    let appliedDiscountPercent = 0;
    
    if (area > DISCOUNT_THRESHOLD) {
      discount = subtotal * (DISCOUNT_PERCENT / 100);
      subtotal -= discount;
      appliedDiscountPercent = DISCOUNT_PERCENT;
    }

    // Round all values
    return {
      valid: true,
      fenceCost: Math.round(fenceCost),
      addonsCost: Math.round(addonsCost),
      deliveryCost: Math.round(deliveryCost),
      discount: Math.round(discount),
      discountPercent: appliedDiscountPercent,
      total: Math.round(subtotal),
      area: Math.round(area * 100) / 100,
      breakdown: {
        basePrice: fencePrice,
        length: length,
        height: height,
        heightMultiplier: heightMultiplier,
        paintMultiplier: paintMultiplier,
        addonsCount: addons.length,
        hasDelivery: includeDelivery
      }
    };
  }

  // ==================== LOCALSTORAGE FUNCTIONS ====================

  /**
   * Save calculator state to localStorage
   * @param {Object} state - Calculator state to save
   */
  function saveState(state) {
    try {
      const serialized = JSON.stringify({
        timestamp: Date.now(),
        ...state
      });
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (err) {
      console.warn('Failed to save calculator state:', err);
    }
  }

  /**
   * Load calculator state from localStorage
   * @returns {Object|null} Saved state or null if not found
   */
  function loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return null;
      
      const state = JSON.parse(serialized);
      
      // Check if state is older than 24 hours
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - state.timestamp > oneDay) {
        clearState();
        return null;
      }
      
      return state;
    } catch (err) {
      console.warn('Failed to load calculator state:', err);
      return null;
    }
  }

  /**
   * Clear calculator state from localStorage
   */
  function clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear calculator state:', err);
    }
  }

  // ==================== FORM INTEGRATION HELPERS ====================

  /**
   * Populate hidden form fields with calculation results
   * @param {HTMLFormElement} form - Form element
   * @param {Object} calculationResult - Result from calculate() function
   */
  function populateFormFields(form, calculationResult) {
    if (!form || !calculationResult || !calculationResult.valid) return;

    // Create or update hidden fields
    const fields = {
      'calc_total': calculationResult.total,
      'calc_fence_cost': calculationResult.fenceCost,
      'calc_addons_cost': calculationResult.addonsCost,
      'calc_delivery_cost': calculationResult.deliveryCost,
      'calc_discount': calculationResult.discount,
      'calc_discount_percent': calculationResult.discountPercent,
      'calc_area': calculationResult.area,
      'calc_length': calculationResult.breakdown.length,
      'calc_height': calculationResult.breakdown.height,
      'calc_paint_multiplier': calculationResult.breakdown.paintMultiplier,
      'calc_height_multiplier': calculationResult.breakdown.heightMultiplier
    };

    Object.entries(fields).forEach(([name, value]) => {
      let field = form.querySelector(`input[name="${name}"]`);
      if (!field) {
        field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        form.appendChild(field);
      }
      field.value = value;
    });
  }

  // ==================== PUBLIC API ====================

  window.CalculatorEngine = {
    // Constants
    HEIGHT_MULTIPLIERS,
    PAINT_OPTIONS,
    DELIVERY_FEE,
    DISCOUNT_THRESHOLD,
    DISCOUNT_PERCENT,

    // Core functions
    calculate,
    getHeightMultiplier,
    getPaintMultiplier,

    // State management
    saveState,
    loadState,
    clearState,

    // Form helpers
    populateFormFields
  };

  // Export for module systems (if needed)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CalculatorEngine;
  }

})();
