/**
 * Form Handler for Art Perimeter
 * Handles Netlify Forms integration for the calculator order form
 * 
 * This module:
 * - Listens for form submission events
 * - Populates hidden fields with calculator data
 * - Submits to Netlify Forms
 * - Provides success/error feedback
 */

(function() {
  'use strict';

  // ==================== CONFIGURATION ====================

  const FORM_NAME = 'order-form';
  const TOAST_DURATION = 5000; // ms

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {'success'|'error'} type - Toast type
   */
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) {
      alert(message);
      return;
    }

    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, TOAST_DURATION);
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean}
   */
  function isValidPhone(phone) {
    return /^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone);
  }

  // ==================== FORM HANDLING ====================

  /**
   * Get current pricing from calculator state
   * Uses CalculatorEngine if available, otherwise falls back to app.js getPricing
   * @returns {Object} Pricing data
   */
  function getCurrentPricing() {
    // Try to use CalculatorEngine first
    if (window.CalculatorEngine && window.AppState) {
      const state = window.AppState;
      const result = window.CalculatorEngine.calculate({
        fencePrice: state.fencePrice,
        length: state.length,
        height: state.heightValue,
        paintOption: state.paintId,
        addons: state.selectedAddons || [],
        includeDelivery: state.delivery
      });
      
      if (result.valid) {
        return {
          total: result.total,
          fenceCost: result.fenceCost,
          addonsCost: result.addonsCost,
          deliveryCost: result.deliveryCost,
          discount: result.discount,
          discountPercent: result.discountPercent,
          area: result.area,
          heightValue: result.breakdown.height,
          heightLabel: `${result.breakdown.height} м`,
          paintId: state.paintId,
          paintName: state.paintName || 'Без покраски'
        };
      }
    }

    // Fallback to app.js getPricing if available
    if (window.App && typeof window.App.getPricing === 'function') {
      return window.App.getPricing();
    }

    // Last resort: return default values
    console.warn('No pricing source available, using defaults');
    return {
      total: 0,
      fenceCost: 0,
      addonsCost: 0,
      deliveryCost: 0,
      discount: 0,
      discountPercent: 0,
      area: 0,
      heightValue: 2,
      heightLabel: '2.0 м',
      paintId: 'none',
      paintName: 'Без покраски'
    };
  }

  /**
   * Populate hidden form fields with calculator data
   * @param {HTMLFormElement} form - Netlify form element
   * @param {Object} pricing - Pricing data from calculator
   * @param {Object} calcState - Current calculator state
   */
  function populateHiddenFields(form, pricing, calcState) {
    const fields = {
      'total_price': pricing.total.toString(),
      'order_details': JSON.stringify({
        fence_type: calcState.fenceType,
        fence_price: calcState.fencePrice,
        length: calcState.length,
        height: pricing.heightValue,
        height_label: pricing.heightLabel,
        paint_id: calcState.paintId,
        paint_name: pricing.paintName,
        addons: (calcState.selectedAddons || []).map(a => a.name),
        delivery: calcState.delivery,
        discount_percent: pricing.discountPercent,
        area: pricing.area
      }),
      'fence_type': calcState.fenceType || '',
      'fence_length': calcState.length.toString(),
      'fence_height': pricing.heightValue.toString(),
      'paint_option': pricing.paintName || 'Без покраски',
      'delivery_included': calcState.delivery ? 'Да' : 'Нет',
      'addons_list': (calcState.selectedAddons || []).map(a => a.name).join(', ') || 'Нет',
      'discount_applied': pricing.discount > 0 ? `${pricing.discountPercent}%` : 'Нет',
      'calculation_area': pricing.area.toString()
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

    // Add customer name and phone
    const customerName = document.getElementById('calcName')?.value.trim() || '';
    const customerPhone = document.getElementById('calcPhone')?.value.trim() || '';

    ['customer_name', 'customer_phone'].forEach(([name, value]) => {
      let field = form.querySelector(`input[name="${name}"]`);
      if (!field) {
        field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        form.appendChild(field);
      }
      field.value = name === 'customer_name' ? customerName : customerPhone;
    });
  }

  /**
   * Handle Netlify form submission
   * @param {Event} event - Submit event
   */
  async function handleFormSubmit(event) {
    if (event) {
      event.preventDefault();
    }

    const nameInput = document.getElementById('calcName');
    const phoneInput = document.getElementById('calcPhone');
    const formHint = document.getElementById('formHint');

    const name = nameInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';

    // Validation
    if (!name) {
      if (formHint) formHint.textContent = 'Введите имя.';
      showToast('Пожалуйста, введите ваше имя', 'error');
      return false;
    }

    if (!isValidPhone(phone)) {
      if (formHint) formHint.textContent = 'Введите корректный номер телефона.';
      showToast('Пожалуйста, введите корректный номер телефона', 'error');
      return false;
    }

    if (formHint) formHint.textContent = '';

    // Get the Netlify form
    const netlifyForm = document.getElementById('netlify-order-form');
    if (!netlifyForm) {
      console.error('Netlify form not found');
      showToast('Ошибка формы. Попробуйте еще раз.', 'error');
      return false;
    }

    // Get current pricing and calculator state
    const pricing = getCurrentPricing();
    const calcState = window.AppState || {
      fenceType: null,
      fencePrice: 0,
      length: 0,
      heightValue: 2,
      paintId: 'none',
      selectedAddons: [],
      delivery: false,
      paintName: 'Без покраски'
    };

    // Populate hidden fields
    populateHiddenFields(netlifyForm, pricing, calcState);

    try {
      // Submit to Netlify
      const formData = new FormData(netlifyForm);
      
      const response = await fetch('/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded' 
        },
        body: new URLSearchParams(formData).toString()
      });

      if (response.ok) {
        showToast(`Спасибо, ${name}! Ваша заявка отправлена.`, 'success');
        
        // Reset form fields
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';

        // Optional: reset calculator after delay
        setTimeout(() => {
          if (typeof window.resetCalculator === 'function') {
            window.resetCalculator();
          }
          // Hide all steps and show step 1
          document.querySelectorAll('.calc-step').forEach(step => {
            step.classList.add('hidden');
          });
          const step1 = document.getElementById('step-1');
          if (step1) step1.classList.remove('hidden');
        }, 2000);

        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showToast('Ошибка отправки. Попробуйте еще раз.', 'error');
      return false;
    }
  }

  /**
   * Initialize form handlers
   */
  function init() {
    document.addEventListener('DOMContentLoaded', () => {
      // Attach submit handler to the order button
      const submitBtn = document.getElementById('submitOrderBtn');
      if (submitBtn) {
        submitBtn.addEventListener('click', handleFormSubmit);
      }

      // Also attach to form submit event as backup
      const netlifyForm = document.getElementById('netlify-order-form');
      if (netlifyForm) {
        netlifyForm.addEventListener('submit', handleFormSubmit);
      }

      console.log('✅ Form handler initialized');
    });
  }

  // ==================== PUBLIC API ====================

  window.FormHandler = {
    handleFormSubmit,
    showToast,
    isValidPhone,
    init
  };

  // Auto-initialize
  init();

})();
