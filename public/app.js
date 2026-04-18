const App = (function() {
    'use strict';

    const API_URL = '/api/data';
    const LEADS_URL = '/api/leads';
    const ADMIN_PASSWORD = 'admin123';

    let content = {};
    let calcState = {
        step: 1,
        fenceType: null,
        fencePrice: 0,
        length: 50,
        selectedAddons: [],
        heightValue: 2,
        paintId: 'none',
        delivery: false
    };

    const formatter = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    });

    const elements = {};

    function init() {
        cacheElements();
        loadContent().then(() => {
            document.title = content.site_title || 'Арт Периметр';
            renderHeader();
            renderBlocks();
            renderFooter();
            initAnimations();
            initSmoothScroll();
        }).catch(error => {
            console.error('❌ Ошибка:', error);
            if (elements.container) {
                elements.container.innerHTML = `
                    <div class="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                        <p class="text-2xl">⚠️ Ошибка загрузки</p>
                        <p class="text-on-surface-variant">${error.message}</p>
                    </div>`;
            }
        });
    }

    function cacheElements() {
        elements.container = document.getElementById('app-container');
        elements.header = document.getElementById('header');
        elements.footer = document.getElementById('footer');
        elements.toast = document.getElementById('toast');
        elements.toastMessage = document.getElementById('toast-message');
    }

    async function loadContent() {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        content = await response.json();
    }

    // =================== HEADER ===================

    function renderHeader() {
        elements.header.innerHTML = `
        <nav class="fixed top-0 w-full z-50 bg-surface/60 glass-nav shadow-[0_20px_40px_rgba(157,248,152,0.08)]">
            <div class="flex justify-between items-center max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20">
                <a href="#" class="text-lg md:text-xl font-black tracking-tighter text-white font-space" onclick="window.scrollTo(0,0);return false;">
                    ${content.company_name || 'АРТ ПЕРИМЕТР'}
                </a>
                <div class="hidden md:flex gap-6 lg:gap-8 items-center">
                    <a href="#calculator" class="font-space uppercase tracking-[0.1rem] text-sm font-bold text-on-surface-variant hover:text-white transition-colors">Калькулятор</a>
                    <a href="#services" class="font-space uppercase tracking-[0.1rem] text-sm font-bold text-on-surface-variant hover:text-white transition-colors">Услуги</a>
                    <a href="#portfolio" class="font-space uppercase tracking-[0.1rem] text-sm font-bold text-on-surface-variant hover:text-white transition-colors">Работы</a>
                    <a href="#contacts" class="font-space uppercase tracking-[0.1rem] text-sm font-bold text-on-surface-variant hover:text-white transition-colors">Контакты</a>
                </div>
                <div class="flex items-center gap-3 md:gap-4">
                    <a href="tel:${content.phone_main}" class="hidden lg:block text-sm font-space font-bold text-primary hover:text-primary-dim transition-colors">
                        ${formatPhone(content.phone_main)}
                    </a>
                    <button onclick="window.location.href='/admin'" class="px-4 py-2 md:px-6 md:py-3 primary-gradient text-on-primary-container font-space uppercase tracking-[0.1rem] text-xs md:text-sm font-black active:scale-95 transition-all">
                        Заказать
                    </button>
                    <button class="md:hidden text-2xl text-on-surface-variant hover:text-white" onclick="App.toggleMobileMenu()">☰</button>
                </div>
            </div>
        </nav>`;
    }

    // =================== MAIN BLOCKS ===================

    function renderBlocks() {
        renderHero();
        renderBenefits();
        renderCalculator();
        renderServices();
        renderPortfolio();
        renderContacts();
    }

    // =================== HERO ===================

    function renderHero() {
        const section = document.createElement('section');
        section.className = 'relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden section-fade-in';

        const bgUrl = content.hero_bg || 'https://images.pexels.com/photos/162568/fence-iron-gate-garden-162568.jpeg?auto=compress&cs=tinysrgb&w=1920';

        section.innerHTML = `
        <div class="absolute inset-0 z-0">
            <img class="w-full h-full object-cover opacity-40 grayscale" src="${bgUrl}" alt="">
            <div class="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent"></div>
        </div>
        <div class="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
                <span class="inline-block py-1 px-3 bg-primary-container/20 text-primary font-space text-xs font-bold tracking-[0.2em] uppercase mb-4 md:mb-6">${content.hero_subtitle || ''}</span>
                <h1 class="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-space tracking-tighter leading-[0.9] mb-6 md:mb-8">
                    ${content.hero_title || ''}<br/>
                </h1>
                <p class="text-on-surface-variant text-lg md:text-xl max-w-lg mb-8 md:mb-10 leading-relaxed">${content.hero_description || ''}</p>
                <div class="flex flex-wrap gap-4 md:gap-6">
                    <a href="${content.hero_cta_link || '#calculator'}" class="px-8 md:px-10 py-4 md:py-5 primary-gradient text-on-primary-container font-space font-black uppercase tracking-wider text-sm md:text-lg active:scale-95 transition-all shadow-[0_0_30px_rgba(157,248,152,0.3)] text-center">
                        ${content.hero_cta_text || 'Рассчитать'}
                    </a>
                </div>
            </div>
            <div class="hidden lg:block relative">
                <div class="absolute -inset-4 bg-primary/10 blur-3xl rounded-full"></div>
                <div class="relative border-l-2 border-primary/30 p-8 bg-surface-container-low/50 backdrop-blur-md">
                    <div class="space-y-8">
                        <div><div class="text-4xl font-space font-black text-white">500+</div><div class="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Проектов завершено</div></div>
                        <div><div class="text-4xl font-space font-black text-white">15+</div><div class="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Лет опыта</div></div>
                        <div><div class="text-4xl font-space font-black text-white">100%</div><div class="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Гарантия качества</div></div>
                    </div>
                </div>
            </div>
        </div>`;

        elements.container.appendChild(section);
    }

    // =================== BENEFITS ===================

    function renderBenefits() {
        const section = document.createElement('section');
        section.className = 'py-16 md:py-24 bg-surface-container-low section-fade-in';

        const advantages = content.advantages || [];
        const icons = ['description', 'factory', 'schedule', 'verified'];

        section.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-outline-variant/20">
                ${advantages.map((item, i) => `
                <div class="bg-surface-container-low p-8 md:p-10 hover:bg-surface-container transition-all duration-300 group ${i > 0 ? 'sm:border-l sm:border-outline-variant/10' : ''}">
                    <div class="mb-6 md:mb-8">
                        <span class="material-symbols-outlined text-primary text-3xl md:text-4xl">${icons[i] || 'star'}</span>
                    </div>
                    <h3 class="font-space font-bold text-lg md:text-xl uppercase tracking-tight mb-3 md:mb-4 group-hover:text-primary transition-colors">${item.title}</h3>
                    <p class="text-on-surface-variant text-sm leading-relaxed">${item.desc}</p>
                </div>`).join('')}
            </div>
        </div>`;

        elements.container.appendChild(section);
    }

    // =================== CALCULATOR ===================

    function renderCalculator() {
        const section = document.createElement('section');
        section.id = 'calculator';
        section.className = 'py-16 md:py-24 bg-surface section-fade-in';

        if (content.calc_fences?.[0]) {
            calcState.fenceType = content.calc_fences[0].name;
            calcState.fencePrice = content.calc_fences[0].price;
        }

        // Дефолты для расчёта (высота/покраска/доставка).
        const heightOptions = content.calc_heights || [];
        const defaultHeight = heightOptions.find(h => Number(h.value) === 2) || heightOptions[0] || { value: 2, multiplier: 1.25, label: '2.0 м' };
        calcState.heightValue = Number(defaultHeight.value) || 2;

        const paintOptions = content.calc_paint_options || [];
        const nonePaint = paintOptions.find(p => p.id === 'none');
        calcState.paintId = (nonePaint && nonePaint.id) ? nonePaint.id : (paintOptions[0]?.id || 'none');

        calcState.delivery = false;

        const fencesHTML = content.calc_fences.map((f, i) => `
            <button type="button" class="calc-fence-btn p-4 md:p-6 border flex flex-col items-center gap-3 md:gap-4 transition-all ${i === 0 ? 'border-primary bg-primary/10' : 'border-outline/20 hover:border-primary'}"
                    data-fence-type="${f.name}" data-fence-price="${f.price}" data-fence-id="${f.id}">
                <span class="material-symbols-outlined text-2xl md:text-3xl ${i === 0 ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}">
                    ${f.id === 'f1' ? 'forest' : f.id === 'f2' ? 'vertical_split' : 'grid_view'}
                </span>
                <span class="font-space font-bold text-[10px] md:text-xs uppercase tracking-widest">${f.name}</span>
            </button>
        `).join('');

        const addonsHTML = content.calc_extras.map(addon => `
            <button type="button" class="calc-addon-btn p-4 md:p-6 border border-outline/20 hover:border-primary transition-all flex flex-col items-center gap-3 md:gap-4"
                    data-element="${addon.id}" data-price="${addon.price}" data-name="${addon.name}">
                <span class="material-symbols-outlined text-2xl md:text-3xl text-on-surface-variant">${addon.id === 'gate' ? 'garage' : 'door_front'}</span>
                <span class="font-space font-bold text-[10px] md:text-xs uppercase tracking-widest">${addon.name}</span>
                <span class="text-primary text-xs font-bold">+ ${formatter.format(addon.price)}</span>
            </button>
        `).join('');

        const heightsSelectHTML = (content.calc_heights || []).map(h => `
            <option value="${h.value}" ${Number(h.value) === Number(calcState.heightValue) ? 'selected' : ''}>${h.label}</option>
        `).join('');

        const paintSelectHTML = (content.calc_paint_options || []).map(p => `
            <option value="${p.id}" ${p.id === calcState.paintId ? 'selected' : ''}>${p.name}</option>
        `).join('');

        section.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-8">
            <div class="bg-surface-container border-l-4 border-primary p-6 md:p-10 lg:p-16 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-primary/5 blur-[100px]"></div>
                <div class="max-w-3xl relative z-10">
                    <span class="text-primary font-space font-bold tracking-[0.3em] uppercase text-xs">Калькулятор</span>
                    <h2 class="text-2xl md:text-4xl lg:text-5xl font-black font-space tracking-tight mt-3 md:mt-4 mb-8 md:mb-12 uppercase">${content.calc_title || 'Расчёт стоимости'} <br/><span class="text-primary">${content.calc_subtitle || ''}</span></h2>
                    <div class="space-y-8 md:space-y-12">
                        <form id="fenceCalculator">
                            <div id="step-1" class="calc-step">
                                <p class="text-on-surface uppercase tracking-widest text-sm font-bold mb-4 md:mb-6">01. Тип ограждения</p>
                                <div class="grid grid-cols-3 gap-3 md:gap-4">${fencesHTML}</div>
                                <div class="flex justify-end mt-6">
                                    <button type="button" class="px-8 py-3 primary-gradient text-on-primary-container font-space font-black uppercase tracking-[0.15em] text-sm active:scale-95 transition-all" onclick="App.nextCalcStep(1)">Далее</button>
                                </div>
                            </div>
                            <div id="step-2" class="calc-step hidden">
                                <div class="flex justify-between items-end mb-4 md:mb-6">
                                    <p class="text-on-surface uppercase tracking-widest text-sm font-bold">02. Длина забора (метры)</p>
                                    <span class="text-2xl md:text-3xl font-space font-black text-primary" id="lengthValue">${calcState.length}м</span>
                                </div>
                                <input type="range" class="w-full mb-6 md:mb-8 accent-primary" id="lengthSlider" min="10" max="500" value="${calcState.length}" oninput="App.updateLength(this.value)">
                                <div class="h-2 bg-surface-container-high relative mb-6">
                                    <div class="absolute top-0 left-0 h-full bg-primary transition-all" id="lengthBar" style="width:${(calcState.length / 500) * 100}%"></div>
                                </div>

                                <div class="grid md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                                    <div>
                                        <p class="text-on-surface uppercase tracking-widest text-sm font-bold mb-3 md:mb-4">Высота забора</p>
                                        <select id="heightSelect" class="w-full bg-surface-container-high border-none focus:ring-1 focus:ring-primary py-3 md:py-4 px-4 md:px-6 text-white font-space" onchange="App.updateHeight(this.value)">
                                            ${heightsSelectHTML}
                                        </select>
                                    </div>
                                    <div>
                                        <p class="text-on-surface uppercase tracking-widest text-sm font-bold mb-3 md:mb-4">Покраска</p>
                                        <select id="paintSelect" class="w-full bg-surface-container-high border-none focus:ring-1 focus:ring-primary py-3 md:py-4 px-4 md:px-6 text-white font-space" onchange="App.updatePaint(this.value)">
                                            ${paintSelectHTML}
                                        </select>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between gap-4 mb-4 md:mb-6">
                                    <label class="flex items-center gap-3 text-on-surface-variant text-sm">
                                        <input type="checkbox" id="deliveryToggle" class="accent-primary" ${calcState.delivery ? 'checked' : ''} onchange="App.toggleDelivery(this.checked)">
                                        <span>Доставка</span>
                                    </label>
                                    <span class="text-primary font-bold">${formatter.format(content.calc_delivery_fee || 5000)}</span>
                                </div>

                                <p class="text-on-surface uppercase tracking-widest text-sm font-bold mb-4 md:mb-6">03. Доп. элементы</p>
                                <div class="grid grid-cols-2 gap-3 md:gap-4">${addonsHTML}</div>
                                <div class="flex justify-between items-center mt-6">
                                    <span class="text-on-surface-variant text-sm">Предварительно: <span class="text-primary font-bold" id="liveTotal">${formatter.format(calculateTotal())}</span></span>
                                    <div class="flex gap-3">
                                        <button type="button" class="px-6 py-3 border border-outline text-on-surface-variant font-space font-bold uppercase tracking-[0.1em] text-sm hover:text-white hover:border-white transition-all" onclick="App.prevCalcStep(2)">Назад</button>
                                        <button type="button" class="px-8 py-3 primary-gradient text-on-primary-container font-space font-black uppercase tracking-[0.15em] text-sm active:scale-95 transition-all" onclick="App.nextCalcStep(2)">Рассчитать</button>
                                    </div>
                                </div>
                            </div>
                            <div id="step-3" class="calc-step hidden">
                                <form id="netlify-order-form" name="order-form" data-netlify="true" data-netlify-honeypot="bot-field" class="hidden">
                                    <input type="hidden" name="form-name" value="order-form">
                                    <input type="hidden" name="total_price">
                                    <input type="hidden" name="order_details">
                                    <input type="hidden" name="fence_type">
                                    <input type="hidden" name="fence_length">
                                    <input type="hidden" name="fence_height">
                                    <input type="hidden" name="paint_option">
                                    <input type="hidden" name="delivery_included">
                                    <input type="hidden" name="addons_list">
                                    <input type="hidden" name="discount_applied">
                                    <input type="hidden" name="calculation_area">
                                    <input type="text" name="bot-field" style="display:none" tabindex="-1" autocomplete="off">
                                </form>
                                <div class="bg-primary/10 p-6 md:p-8 mb-6 md:mb-8 border border-primary/20">
                                    <p class="text-on-surface-variant text-xs font-space uppercase tracking-widest mb-2">Ориентировочная стоимость</p>
                                    <div class="text-3xl md:text-4xl font-space font-black text-primary" id="finalPrice">${formatter.format(calculateTotal())}</div>
                                </div>
                                <div id="resultDetails" class="text-on-surface-variant text-sm space-y-2 mb-6"></div>
                                <input type="text" id="calcName" class="w-full bg-surface-container-high border-none focus:ring-1 focus:ring-primary py-3 md:py-4 px-4 md:px-6 text-white placeholder:text-outline/50 font-space mb-3 md:mb-4" placeholder="Ваше имя" required inputmode="text" autocomplete="name">
                                <input type="tel" id="calcPhone" class="w-full bg-surface-container-high border-none focus:ring-1 focus:ring-primary py-3 md:py-4 px-4 md:px-6 text-white placeholder:text-outline/50 font-space mb-3 md:mb-4" placeholder="Ваш телефон" required inputmode="tel" autocomplete="tel" pattern="[\\+]?[0-9\\s\\-\\(\\)]{10,}">
                                <div id="formHint" class="text-error text-sm mb-4 min-h-[20px]"></div>
                                <button type="button" id="submitOrderBtn" class="w-full py-4 md:py-5 primary-gradient text-on-primary-container font-space font-black uppercase tracking-[0.2em] text-sm md:text-lg active:scale-[0.98] transition-all">${content.contacts_form_submit || 'Отправить'}</button>
                                <div class="flex justify-start mt-4">
                                    <button type="button" class="px-6 py-3 border border-outline text-on-surface-variant font-space font-bold uppercase tracking-[0.1em] text-sm hover:text-white hover:border-white transition-all" onclick="App.prevCalcStep(3)">Назад</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;

        elements.container.appendChild(section);

        const form = document.getElementById('fenceCalculator');
        if (form) form.addEventListener('submit', handleFormSubmit);

        // Netlify form submission handler
        const submitBtn = document.getElementById('submitOrderBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', handleNetlifySubmit);
        }
    }

    // =================== SERVICES ===================

    function renderServices() {
        const section = document.createElement('section');
        section.id = 'services';
        section.className = 'py-16 md:py-24 bg-surface-container-low section-fade-in';

        const services = content.services || [];
        const serviceCards = services.map((item, i) => {
            const colSpan = (i % 2 === 0) ? 'md:col-span-8' : 'md:col-span-4';
            return `
            <div class="${colSpan} group relative overflow-hidden bg-surface-container-high h-64 md:h-full">
                <img class="w-full h-full object-cover grayscale opacity-60 group-hover:scale-105 group-hover:opacity-40 transition-all duration-700" src="${item.img}" alt="${item.title}" loading="lazy">
                <div class="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
                <div class="absolute bottom-0 left-0 p-6 md:p-10">
                    <h3 class="text-xl md:text-3xl font-space font-black uppercase tracking-tight mb-2">${item.title}</h3>
                    <p class="text-on-surface-variant max-w-sm mb-4 md:mb-6 opacity-0 group-hover:opacity-100 transition-opacity text-sm">${item.desc}</p>
                </div>
            </div>`;
        }).join('');

        section.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-8">
            <div class="mb-10 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                <div>
                    <span class="text-primary font-space font-bold tracking-[0.3em] uppercase text-xs">Наши услуги</span>
                    <h2 class="text-3xl md:text-5xl font-black font-space tracking-tight mt-2 uppercase">${content.services_title || 'Услуги'}</h2>
                </div>
                <p class="max-w-md text-on-surface-variant leading-relaxed text-sm md:text-base">${content.services_desc || ''}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                ${serviceCards}
            </div>
        </div>`;

        elements.container.appendChild(section);
    }

    // =================== PORTFOLIO ===================

    function renderPortfolio() {
        const section = document.createElement('section');
        section.id = 'portfolio';
        section.className = 'py-16 md:py-24 bg-surface section-fade-in';

        const items = content.portfolio || [];
        const portfolioCards = items.map(item => `
            <div class="group">
                <div class="aspect-[4/5] bg-surface-container-high mb-4 md:mb-6 overflow-hidden">
                    <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="${item.img}" alt="${item.title}" loading="lazy">
                </div>
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-space font-bold text-base md:text-lg uppercase tracking-tight">${item.title}</h4>
                        <p class="text-on-surface-variant text-sm">${item.tag}</p>
                    </div>
                </div>
            </div>
        `).join('');

        section.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-8">
            <div class="mb-10 md:mb-16">
                <span class="text-primary font-space font-bold tracking-[0.3em] uppercase text-xs">${content.portfolio_subtitle || 'Наши работы'}</span>
                <h2 class="text-3xl md:text-5xl font-black font-space tracking-tight mt-2 uppercase">${content.portfolio_title || 'Работы'}</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                ${portfolioCards}
            </div>
        </div>`;

        elements.container.appendChild(section);
    }

    // =================== CONTACTS ===================

    function renderContacts() {
        const section = document.createElement('section');
        section.id = 'contacts';
        section.className = 'py-16 md:py-24 bg-surface-container-low border-t border-white/5 section-fade-in';

        section.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-12 md:gap-20">
            <div>
                <h2 class="text-3xl md:text-5xl font-black font-space tracking-tight uppercase mb-6 md:mb-8 leading-none"><span class="text-primary">${content.contacts_title || 'Контакты'}</span></h2>
                <p class="text-on-surface-variant text-lg mb-8 md:mb-12">${content.contacts_desc || ''}</p>
                <div class="space-y-6 md:space-y-8">
                    <div class="flex items-center gap-4 md:gap-6">
                        <div class="w-10 h-10 md:w-12 md:h-12 bg-surface-container flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined">phone_in_talk</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-space font-bold uppercase tracking-widest text-outline">Телефон</p>
                            <a href="tel:${content.phone_main}" class="text-lg md:text-xl font-space font-bold text-white hover:text-primary transition-colors">${content.phone_main}</a>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 md:gap-6">
                        <div class="w-10 h-10 md:w-12 md:h-12 bg-surface-container flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined">location_on</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-space font-bold uppercase tracking-widest text-outline">Адрес</p>
                            <p class="text-lg md:text-xl font-space font-bold">${content.address}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 md:gap-6">
                        <div class="w-10 h-10 md:w-12 md:h-12 bg-surface-container flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined">mail</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-space font-bold uppercase tracking-widest text-outline">Email</p>
                            <a href="mailto:${content.email}" class="text-lg md:text-xl font-space font-bold text-white hover:text-primary transition-colors">${content.email}</a>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 md:gap-6">
                        <div class="w-10 h-10 md:w-12 md:h-12 bg-surface-container flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined">schedule</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-space font-bold uppercase tracking-widest text-outline">Часы работы</p>
                            <p class="text-lg md:text-xl font-space font-bold">${content.hours}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-surface p-6 md:p-10 shadow-2xl">
                <h3 class="text-xl md:text-2xl font-space font-black uppercase tracking-tight mb-4 md:mb-6">${content.contacts_form_title || 'Оставить заявку'}</h3>
                <form class="space-y-4 md:space-y-6" onsubmit="App.submitContactForm(event)">
                    <div class="grid md:grid-cols-2 gap-4 md:gap-6">
                        <div class="space-y-2">
                            <label class="text-[10px] font-space font-bold uppercase tracking-widest text-outline">Имя</label>
                            <input type="text" id="contactName" class="w-full bg-surface-container-high border-none focus:ring-1 focus:ring-primary py-3 md:py-4 px-4 md:px-6 text-white placeholder:text-outline/50 font-space" placeholder="Ваше имя" required inputmode="text" autocomplete="name">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-space font-bold uppercase tracking-widest text-outline">Телефон</label>
                            <input type="tel" id="contactPhone" class="w-full bg-surface-container-high border-none focus:ring-1 focus:ring-primary py-3 md:py-4 px-4 md:px-6 text-white placeholder:text-outline/50 font-space" placeholder="+7 (___) ___-__-__" required inputmode="tel" autocomplete="tel">
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-space font-bold uppercase tracking-widest text-outline">Сообщение</label>
                        <textarea id="contactMessage" class="w-full bg-surface-container-high border-none focus:ring-1 focus:ring-primary py-3 md:py-4 px-4 md:px-6 text-white placeholder:text-outline/50 font-space resize-none" rows="4" placeholder="Расскажите о вашем проекте..."></textarea>
                    </div>
                    <button type="submit" class="w-full py-4 md:py-5 primary-gradient text-on-primary-container font-space font-black uppercase tracking-[0.2em] text-sm md:text-base active:scale-[0.98] transition-all">${content.contacts_form_submit || 'Отправить'}</button>
                    <p class="text-[10px] text-on-surface-variant/50 text-center leading-relaxed">${content.contacts_form_consent || 'Согласие на обработку данных'}</p>
                </form>
            </div>
        </div>`;

        elements.container.appendChild(section);
    }

    // =================== FOOTER ===================

    function renderFooter() {
        elements.footer.innerHTML = `
        <footer class="bg-surface-container-low w-full py-8 md:py-12 px-4 md:px-8 border-t border-white/5">
            <div class="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 max-w-7xl mx-auto">
                <div class="text-base md:text-lg font-bold text-white font-space">${content.company_name || 'Арт Периметр'}</div>
                <div class="flex flex-wrap justify-center gap-4 md:gap-8">
                    <a href="/admin" class="font-body text-xs md:text-sm text-on-surface-variant hover:text-primary transition-colors">Админ-панель</a>
                    <a href="${content.footer_privacy || '#'}" class="font-body text-xs md:text-sm text-on-surface-variant hover:text-primary transition-colors">Политика конфиденциальности</a>
                </div>
                <div class="font-body text-xs md:text-sm text-on-surface-variant">${content.footer_text || '© 2025 Арт Периметр'}</div>
            </div>
        </footer>`;
    }

    // =================== CALCULATOR LOGIC ===================

    function getPricing() {
        const heightOptions = content.calc_heights || [];
        const heightOpt = heightOptions.find(h => Number(h.value) === Number(calcState.heightValue))
            || heightOptions[0]
            || { value: 2, multiplier: 1.25, label: '2.0 м' };

        const heightValue = Number(heightOpt.value) || 2;
        const heightMultiplier = Number(heightOpt.multiplier) || 1;
        const heightLabel = heightOpt.label || `${heightValue} м`;

        const paintOptions = content.calc_paint_options || [];
        const paintOpt = paintOptions.find(p => p.id === calcState.paintId)
            || paintOptions[0]
            || { id: 'none', name: 'Без покраски', multiplier: 1 };

        const paintMultiplier = Number(paintOpt.multiplier) || 1;
        const paintName = paintOpt.name || '';

        const addonsCostRaw = calcState.selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

        const deliveryFee = Number(content.calc_delivery_fee || 5000);
        const deliveryCostRaw = calcState.delivery ? deliveryFee : 0;

        const fenceCostRaw = calcState.length * calcState.fencePrice * heightMultiplier * paintMultiplier;

        const subtotalRaw = fenceCostRaw + addonsCostRaw + deliveryCostRaw;

        const threshold = Number(content.calc_discount_threshold || 100);
        const percent = Number(content.calc_discount_percent || 5);
        const area = calcState.length * heightValue;

        const discountRaw = area > threshold ? subtotalRaw * (percent / 100) : 0;
        const totalRaw = subtotalRaw - discountRaw;

        return {
            fenceCost: Math.round(fenceCostRaw),
            addonsCost: Math.round(addonsCostRaw),
            deliveryCost: Math.round(deliveryCostRaw),
            discount: Math.round(discountRaw),
            discountPercent: discountRaw > 0 ? percent : 0,
            total: Math.round(totalRaw),
            area: Math.round(area * 100) / 100,
            heightValue,
            heightLabel,
            paintId: paintOpt.id,
            paintName
        };
    }

    function calculateTotal() {
        return getPricing().total;
    }

    function updateLiveTotal() {
        const el = document.getElementById('liveTotal');
        if (el) el.textContent = formatter.format(calculateTotal());
    }

    function selectFence(card) {
        document.querySelectorAll('.calc-fence-btn').forEach(c => {
            c.classList.remove('border-primary', 'bg-primary/10');
            c.classList.add('border-outline/20');
            c.querySelector('.material-symbols-outlined').classList.remove('text-primary');
            c.querySelector('.material-symbols-outlined').classList.add('text-on-surface-variant');
        });
        card.classList.remove('border-outline/20');
        card.classList.add('border-primary', 'bg-primary/10');
        card.querySelector('.material-symbols-outlined').classList.remove('text-on-surface-variant');
        card.querySelector('.material-symbols-outlined').classList.add('text-primary');

        calcState.fenceType = card.dataset.fenceType;
        calcState.fencePrice = Number(card.dataset.fencePrice);
        updateLiveTotal();
    }

    function toggleAddon(card) {
        const isSelected = card.classList.toggle('border-primary');
        card.classList.toggle('bg-primary/10', isSelected);
        card.classList.toggle('border-outline/20', !isSelected);

        const id = card.dataset.element;
        const name = card.dataset.name;
        const price = Number(card.dataset.price);
        if (isSelected) {
            if (!calcState.selectedAddons.find(a => a.id === id)) calcState.selectedAddons.push({ id, name, price });
        } else {
            calcState.selectedAddons = calcState.selectedAddons.filter(a => a.id !== id);
        }
        updateLiveTotal();
    }

    function updateLength(value) {
        calcState.length = parseInt(value, 10);
        const el = document.getElementById('lengthValue');
        const bar = document.getElementById('lengthBar');
        if (el) el.textContent = `${value}м`;
        if (bar) bar.style.width = `${(value / 500) * 100}%`;
        updateLiveTotal();
    }

    function updateHeight(value) {
        calcState.heightValue = parseFloat(value);
        updateLiveTotal();
    }

    function updatePaint(id) {
        calcState.paintId = id;
        updateLiveTotal();
    }

    function toggleDelivery(checked) {
        calcState.delivery = !!checked;
        updateLiveTotal();
    }

    function nextCalcStep(current) {
        if (current === 1 && !calcState.fenceType) { showToast('Выберите тип ограждения', 'error'); return; }
        if (current === 2) calculateResult();

        document.querySelectorAll('.calc-step').forEach(s => s.classList.add('hidden'));
        const next = document.getElementById(`step-${current + 1}`);
        if (next) next.classList.remove('hidden');
    }

    function prevCalcStep(current) {
        document.querySelectorAll('.calc-step').forEach(s => s.classList.add('hidden'));
        const prev = document.getElementById(`step-${current - 1}`);
        if (prev) prev.classList.remove('hidden');
    }

    function calculateResult() {
        const pricing = getPricing();
        const paintPart = pricing.paintName ? `, ${pricing.paintName}` : '';
        let details = `<p class="flex justify-between"><span>Забор (${calcState.fenceType}) ${calcState.length}м × ${pricing.heightLabel}${paintPart}</span><span class="font-bold">${formatter.format(pricing.fenceCost)}</span></p>`;
        calcState.selectedAddons.forEach(a => {
            details += `<p class="flex justify-between"><span>${a.name}</span><span class="font-bold">${formatter.format(a.price)}</span></p>`;
        });
        if (pricing.deliveryCost > 0) {
            details += `<p class="flex justify-between"><span>Доставка</span><span class="font-bold">${formatter.format(pricing.deliveryCost)}</span></p>`;
        }
        if (pricing.discount > 0) {
            details += `<p class="flex justify-between"><span>Скидка ${pricing.discountPercent}%</span><span class="font-bold">-${formatter.format(pricing.discount)}</span></p>`;
        }
        const priceEl = document.getElementById('finalPrice');
        const detailsEl = document.getElementById('resultDetails');
        if (priceEl) priceEl.textContent = formatter.format(pricing.total);
        if (detailsEl) detailsEl.innerHTML = details;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('calcName')?.value.trim();
        const phone = document.getElementById('calcPhone')?.value.trim();
        const hint = document.getElementById('formHint');
        const phoneOk = /^\+?[0-9\s\-()]{10,}$/.test(phone);

        if (!name || !phoneOk) { hint.textContent = 'Введите имя и корректный телефон.'; return; }
        hint.textContent = '';

        const pricing = getPricing();
        const lead = {
            type: 'calc',
            name,
            phone,
            details: {
                fence: calcState.fenceType,
                length: calcState.length,
                height: pricing.heightValue,
                paint: calcState.paintId,
                delivery: calcState.delivery,
                discount: pricing.discount,
                total: pricing.total,
                addons: calcState.selectedAddons.map(a => a.name)
            }
        };

        try {
            await fetch(LEADS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
            showToast(`Спасибо, ${name}! Мы свяжемся с вами.`, 'success');
            e.target.reset();
            setTimeout(resetCalculator, 2000);
        } catch (err) {
            showToast('Ошибка отправки', 'error');
        }
    }

    async function submitContactForm(e) {
        e.preventDefault();
        const name = document.getElementById('contactName')?.value.trim();
        const phone = document.getElementById('contactPhone')?.value.trim();
        if (!name || !phone) { showToast('Заполните обязательные поля', 'error'); return; }

        const lead = { type: 'contact', name, phone };
        try {
            await fetch(LEADS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
            showToast('Заявка отправлена!', 'success');
            e.target.reset();
        } catch (err) {
            showToast('Ошибка отправки', 'error');
        }
    }

    function resetCalculator() {
        calcState.selectedAddons = [];
        document.querySelectorAll('.calc-fence-btn').forEach((c, idx) => {
            c.classList.remove('border-primary', 'bg-primary/10');
            c.classList.add('border-outline/20');
            c.querySelector('.material-symbols-outlined')?.classList.remove('text-primary');
            c.querySelector('.material-symbols-outlined')?.classList.add('text-on-surface-variant');
        });
        document.querySelectorAll('.calc-addon-btn').forEach(c => {
            c.classList.remove('border-primary', 'bg-primary/10');
            c.classList.add('border-outline/20');
        });

        const defaultCard = document.querySelector('.calc-fence-btn[data-fence-id="f1"]');
        if (defaultCard) {
            defaultCard.classList.remove('border-outline/20');
            defaultCard.classList.add('border-primary', 'bg-primary/10');
            defaultCard.querySelector('.material-symbols-outlined')?.classList.remove('text-on-surface-variant');
            defaultCard.querySelector('.material-symbols-outlined')?.classList.add('text-primary');
            calcState.fenceType = defaultCard.dataset.fenceType;
            calcState.fencePrice = Number(defaultCard.dataset.fencePrice);
        }

        document.querySelectorAll('.calc-step').forEach(s => s.classList.add('hidden'));
        const step1 = document.getElementById('step-1');
        if (step1) step1.classList.remove('hidden');

        const lengthValue = document.getElementById('lengthValue');
        const lengthSlider = document.getElementById('lengthSlider');
        const lengthBar = document.getElementById('lengthBar');
        calcState.length = 50;
        if (lengthValue) lengthValue.textContent = '50м';
        if (lengthSlider) lengthSlider.value = 50;
        if (lengthBar) lengthBar.style.width = '10%';

        const heightOptions = content.calc_heights || [];
        const defaultHeight = heightOptions.find(h => Number(h.value) === 2) || heightOptions[0] || { value: 2, multiplier: 1.25, label: '2.0 м' };
        calcState.heightValue = Number(defaultHeight.value) || 2;
        const paintOptions = content.calc_paint_options || [];
        const nonePaint = paintOptions.find(p => p.id === 'none');
        calcState.paintId = (nonePaint && nonePaint.id) ? nonePaint.id : (paintOptions[0]?.id || 'none');
        calcState.delivery = false;

        const heightSelect = document.getElementById('heightSelect');
        if (heightSelect) heightSelect.value = String(calcState.heightValue);
        const paintSelect = document.getElementById('paintSelect');
        if (paintSelect) paintSelect.value = calcState.paintId;
        const deliveryToggle = document.getElementById('deliveryToggle');
        if (deliveryToggle) deliveryToggle.checked = false;

        updateLiveTotal();
    }

    // =================== UI HELPERS ===================

    function toggleMobileMenu() {
        let menu = document.getElementById('mobileMenuOverlay');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'mobileMenuOverlay';
            menu.className = 'mobile-menu bg-surface shadow-2xl';
            menu.innerHTML = `
                <div class="flex justify-between items-center p-4 border-b border-outline-variant/20">
                    <span class="font-space font-bold text-white">Меню</span>
                    <button onclick="App.closeMobileMenu()" class="text-2xl text-on-surface-variant">✕</button>
                </div>
                <nav class="flex flex-col p-4 gap-4">
                    <a href="#calculator" onclick="App.closeMobileMenu()" class="font-space uppercase tracking-widest text-sm font-bold text-on-surface-variant hover:text-primary py-2">Калькулятор</a>
                    <a href="#services" onclick="App.closeMobileMenu()" class="font-space uppercase tracking-widest text-sm font-bold text-on-surface-variant hover:text-primary py-2">Услуги</a>
                    <a href="#portfolio" onclick="App.closeMobileMenu()" class="font-space uppercase tracking-widest text-sm font-bold text-on-surface-variant hover:text-primary py-2">Работы</a>
                    <a href="#contacts" onclick="App.closeMobileMenu()" class="font-space uppercase tracking-widest text-sm font-bold text-on-surface-variant hover:text-primary py-2">Контакты</a>
                    <a href="tel:${content.phone_main}" class="font-space uppercase tracking-widest text-sm font-bold text-primary py-2">${content.phone_main}</a>
                </nav>`;
            document.body.appendChild(menu);
        }
        menu.classList.add('open');
    }

    function closeMobileMenu() {
        const menu = document.getElementById('mobileMenuOverlay');
        if (menu) menu.classList.remove('open');
    }

    function showToast(message, type = 'success') {
        if (!elements.toast || !elements.toastMessage) return;
        elements.toastMessage.textContent = message;
        elements.toast.className = `toast ${type} show`;
        setTimeout(() => elements.toast.classList.remove('show'), 4000);
    }

    function initAnimations() {
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
            { threshold: 0.1 }
        );
        document.querySelectorAll('.section-fade-in').forEach(el => observer.observe(el));
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href.length > 1) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const headerOffset = 80;
                        const elementPosition = target.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                        closeMobileMenu();
                    }
                }
            });
        });
    }

    function formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 11 ? `+${cleaned[0]} (${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7,9)}-${cleaned.slice(9,11)}` : phone;
    }

    function openLoginModal() {
        const password = prompt('Введите пароль администратора:');
        if (password === ADMIN_PASSWORD) {
            window.open('admin.html', '_blank');
        } else if (password !== null) {
            showToast('Неверный пароль', 'error');
        }
    }

    // Bind global event listeners for dynamically created elements
    document.addEventListener('click', function(e) {
        if (e.target.closest('.calc-fence-btn')) {
            App.selectFence(e.target.closest('.calc-fence-btn'));
        }
        if (e.target.closest('.calc-addon-btn')) {
            App.toggleAddon(e.target.closest('.calc-addon-btn'));
        }
    });

    document.addEventListener('DOMContentLoaded', init);

    // Expose calcState globally for form-handler.js integration
    window.AppState = calcState;
    window.App = {
        selectFence, toggleAddon, updateLength, updateHeight, updatePaint, toggleDelivery, nextCalcStep, prevCalcStep,
        toggleMobileMenu, closeMobileMenu, openLoginModal, submitContactForm,
        getPricing,
        getContent: () => content
    };
})();
