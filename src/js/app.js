/**
 * METALLUM Calculator App - Art Perimeter
 * Connects the UI to the calculator engine
 */

(function() {
  'use strict';

  // ==================== STATE ====================
  
  let currentState = {
    fenceType: null,
    fencePrice: 0,
    length: 0,
    height: 1.5,
    paintOption: 'none',
    addons: [],
    includeDelivery: false
  };

  // ==================== FENCE TYPES ====================
  
  const FENCE_TYPES = [
    { 
      id: '3d-fence', 
      name: '3D Забор', 
      price: 1800,
      description: 'Современные 3D панели для надежной защиты'
    },
    { 
      id: 'profile', 
      name: 'Профнастил', 
      price: 2200,
      description: 'Классический забор из профнастила'
    },
    { 
      id: 'lattice', 
      name: 'Евроштакетник', 
      price: 2000,
      description: 'Элегантный забор-евроштакетник'
    },
    { 
      id: 'chain-link', 
      name: 'Рабица', 
      price: 1200,
      description: 'Бюджетное решение из сетки рабицы'
    },
    { 
      id: 'wrought', 
      name: 'Кованый', 
      price: 4500,
      description: 'Премиум кованые ограждения'
    }
  ];

  // ==================== ADDONS ====================
  
  const ADDONS = [
    { id: 'gate', name: 'Калитка', price: 15000 },
    { id: 'auto-gate', name: 'Автоматические ворота', price: 45000 },
    { id: 'lighting', name: 'Освещение', price: 8000 },
    { id: 'security', name: 'Система безопасности', price: 25000 }
  ];

  // ==================== DOM ELEMENTS ====================
  
  let elements = {};

  function initElements() {
    elements = {
      // Fence type selection
      fenceOptions: document.querySelectorAll('.fence-option'),
      
      // Inputs
      lengthInput: document.getElementById('length'),
      heightSelect: document.getElementById('height'),
      paintSelect: document.getElementById('paint-option'),
      deliveryCheckbox: document.getElementById('delivery'),
      
      // Addons
      addonCheckboxes: document.querySelectorAll('.addon-checkbox'),
      
      // Results
      resultTotal: document.getElementById('result-total'),
      resultBreakdown: document.getElementById('result-breakdown'),
      
      // Form
      quoteForm: document.getElementById('quote-form'),
      hiddenTotal: document.getElementById('total_price'),
      hiddenDetails: document.getElementById('order_details')
    };
  }

  // ==================== EVENT LISTENERS ====================
  
  function attachEventListeners() {
    // Fence type selection
    elements.fenceOptions.forEach(option => {
      option.addEventListener('click', () => selectFenceType(option));
    });

    // Length input
    if (elements.lengthInput) {
      elements.lengthInput.addEventListener('input', (e) => {
        currentState.length = parseFloat(e.target.value) || 0;
        updateCalculation();
      });
    }

    // Height select
    if (elements.heightSelect) {
      elements.heightSelect.addEventListener('change', (e) => {
        currentState.height = parseFloat(e.target.value);
        updateCalculation();
      });
    }

    // Paint select
    if (elements.paintSelect) {
      elements.paintSelect.addEventListener('change', (e) => {
        currentState.paintOption = e.target.value;
        updateCalculation();
      });
    }

    // Delivery checkbox
    if (elements.deliveryCheckbox) {
      elements.deliveryCheckbox.addEventListener('change', (e) => {
        currentState.includeDelivery = e.target.checked;
        updateCalculation();
      });
    }

    // Addon checkboxes
    elements.addonCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        toggleAddon(e.target.value, e.target.checked);
        updateCalculation();
      });
    });

    // Form submission
    if (elements.quoteForm) {
      elements.quoteForm.addEventListener('submit', handleSubmit);
    }
  }

  // ==================== FUNCTIONS ====================
  
  function selectFenceType(optionElement) {
    // Remove selected class from all options
    elements.fenceOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Add selected class to clicked option
    optionElement.classList.add('selected');
    
    // Get fence type data
    const fenceId = optionElement.dataset.fenceId;
    const fenceType = FENCE_TYPES.find(f => f.id === fenceId);
    
    if (fenceType) {
      currentState.fenceType = fenceType.id;
      currentState.fencePrice = fenceType.price;
      updateCalculation();
    }
  }

  function toggleAddon(addonId, isChecked) {
    const addon = ADDONS.find(a => a.id === addonId);
    
    if (!addon) return;
    
    if (isChecked) {
      // Add addon if not already in list
      if (!currentState.addons.find(a => a.id === addonId)) {
        currentState.addons.push(addon);
      }
    } else {
      // Remove addon
      currentState.addons = currentState.addons.filter(a => a.id !== addonId);
    }
  }

  function updateCalculation() {
    if (!window.CalculatorEngine) {
      console.error('CalculatorEngine not loaded');
      return;
    }

    const result = window.CalculatorEngine.calculate({
      fencePrice: currentState.fencePrice,
      length: currentState.length,
      height: currentState.height,
      paintOption: currentState.paintOption,
      addons: currentState.addons.map(a => ({ price: a.price })),
      includeDelivery: currentState.includeDelivery
    });

    if (result.valid) {
      // Update total display
      if (elements.resultTotal) {
        elements.resultTotal.textContent = `${result.total.toLocaleString('ru-RU')} ₽`;
      }

      // Update breakdown display
      if (elements.resultBreakdown) {
        let breakdownHTML = `
          <p>Длина: ${currentState.length} м</p>
          <p>Высота: ${currentState.height} м</p>
          <p>Стоимость забора: ${result.fenceCost.toLocaleString('ru-RU')} ₽</p>
        `;
        
        if (result.addonsCost > 0) {
          breakdownHTML += `<p>Дополнительно: ${result.addonsCost.toLocaleString('ru-RU')} ₽</p>`;
        }
        
        if (result.deliveryCost > 0) {
          breakdownHTML += `<p>Доставка: ${result.deliveryCost.toLocaleString('ru-RU')} ₽</p>`;
        }
        
        if (result.discount > 0) {
          breakdownHTML += `<p class="text-accent">Скидка ${result.discountPercent}%: -${result.discount.toLocaleString('ru-RU')} ₽</p>`;
        }
        
        elements.resultBreakdown.innerHTML = breakdownHTML;
      }

      // Save state to localStorage
      window.CalculatorEngine.saveState(currentState);

      // Update hidden form fields
      if (elements.quoteForm) {
        window.CalculatorEngine.populateFormFields(elements.quoteForm, result);
      }
    } else {
      if (elements.resultTotal) {
        elements.resultTotal.textContent = '—';
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!currentState.fenceType) {
      alert('Пожалуйста, выберите тип забора');
      return;
    }
    
    if (currentState.length <= 0) {
      alert('Пожалуйста, укажите длину забора');
      return;
    }

    // Update hidden fields one more time before submission
    const result = window.CalculatorEngine.calculate({
      fencePrice: currentState.fencePrice,
      length: currentState.length,
      height: currentState.height,
      paintOption: currentState.paintOption,
      addons: currentState.addons.map(a => ({ price: a.price })),
      includeDelivery: currentState.includeDelivery
    });

    if (result.valid && elements.quoteForm) {
      window.CalculatorEngine.populateFormFields(elements.quoteForm, result);
      
      // Submit form
      elements.quoteForm.submit();
    }
  }

  function renderFenceOptions() {
    const container = document.getElementById('fence-options');
    if (!container) return;

    container.innerHTML = FENCE_TYPES.map(fence => `
      <div class="fence-option" data-fence-id="${fence.id}">
        <input type="radio" name="fence-type" id="${fence.id}" value="${fence.id}">
        <label for="${fence.id}" style="margin: 0; cursor: pointer;">
          <strong>${fence.name}</strong>
          <br>
          <small>${fence.description}</small>
          <br>
          <span class="text-accent">от ${fence.price.toLocaleString('ru-RU')} ₽/м</span>
        </label>
      </div>
    `).join('');
  }

  function renderAddons() {
    const container = document.getElementById('addon-options');
    if (!container) return;

    container.innerHTML = ADDONS.map(addon => `
      <div class="form-group">
        <label>
          <input type="checkbox" class="addon-checkbox" value="${addon.id}" style="width: auto; margin-right: 0.5rem;">
          ${addon.name} — ${addon.price.toLocaleString('ru-RU')} ₽
        </label>
      </div>
    `).join('');
  }

  function loadSavedState() {
    if (!window.CalculatorEngine) return;
    
    const savedState = window.CalculatorEngine.loadState();
    if (savedState) {
      currentState = { ...currentState, ...savedState };
      
      // Restore UI state
      if (currentState.fenceType) {
        const option = document.querySelector(`.fence-option[data-fence-id="${currentState.fenceType}"]`);
        if (option) option.classList.add('selected');
      }
      
      if (elements.lengthInput && currentState.length) {
        elements.lengthInput.value = currentState.length;
      }
      
      if (elements.heightSelect && currentState.height) {
        elements.heightSelect.value = currentState.height;
      }
      
      if (elements.paintSelect && currentState.paintOption) {
        elements.paintSelect.value = currentState.paintOption;
      }
      
      if (elements.deliveryCheckbox) {
        elements.deliveryCheckbox.checked = currentState.includeDelivery;
      }
      
      currentState.addons.forEach(addon => {
        const checkbox = document.querySelector(`.addon-checkbox[value="${addon.id}"]`);
        if (checkbox) checkbox.checked = true;
      });
      
      updateCalculation();
    }
  }

  // ==================== INITIALIZATION ====================
  
  function init() {
    renderFenceOptions();
    renderAddons();
    initElements();
    attachEventListeners();
    loadSavedState();
    
    console.log('METALLUM Calculator initialized');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
