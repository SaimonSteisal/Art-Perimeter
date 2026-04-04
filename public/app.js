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
        selectedAddons: []
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
            initMobileMenu();
            initSmoothScroll();
            console.log('✅ Приложение инициализировано');
        }).catch(error => {
            console.error('❌ Ошибка:', error);
            if (elements.container) {
                elements.container.innerHTML = `
                    <div class="container" style="text-align:center;padding:100px 20px;">
                        <h2 style="color:#2e7d32;">Ошибка загрузки</h2>
                        <p style="color:#b0b0b0;">${error.message}</p>
                    </div>
                `;
            }
        });
    }

    function cacheElements() {
        elements.container = document.getElementById('app-container');
        elements.header = document.getElementById('header');
        elements.footer = document.getElementById('footer');
        elements.mobileMenu = document.getElementById('mobile-menu');
        elements.mobileNav = document.getElementById('mobile-nav');
        elements.toast = document.getElementById('toast');
        elements.toastMessage = document.getElementById('toast-message');
    }

    async function loadContent() {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        content = await response.json();
    }

    function renderHeader() {
        elements.header.innerHTML = `
            <div class="container header-inner">
                <a href="#" class="logo" onclick="window.scrollTo(0,0);return false;">
                    <div class="logo-icon">${content.company_name?.charAt(0) || 'А'}</div>
                    <div class="logo-text">
                        <span>${content.company_name || 'Арт Периметр'}</span>
                        <span class="logo-subtitle">Металлоконструкции</span>
                    </div>
                </a>
                <nav>
                    <ul>
                        <li><a href="#calculator">Калькулятор</a></li>
                        <li><a href="#services">Услуги</a></li>
                        <li><a href="#portfolio">Наши работы</a></li>
                        <li><a href="#contacts">Контакты</a></li>
                    </ul>
                </nav>
                <div class="header-contacts">
                    <a href="tel:${content.phone_main}" class="header-phone">${formatPhone(content.phone_main)}</a>
                    <div class="header-sub">${content.hours}</div>
                </div>
                <button class="mobile-toggle" onclick="App.toggleMobileMenu()">☰</button>
            </div>
        `;
    }

    function renderBlocks() {
        renderHero();
        renderFeatures();
        renderCalculator();
        renderServices();
        renderPortfolio();
        renderContacts();
    }

    function renderHero() {
        const section = document.createElement('section');
        section.className = 'hero fade-in';
        section.style.backgroundImage = `url('${content.hero_bg}')`;
        section.innerHTML = `
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-subtitle">${content.hero_subtitle}</div>
                <h1>${content.hero_title}</h1>
                <p>${content.hero_description}</p>
                <a href="${content.hero_cta_link}" class="hero-cta">${content.hero_cta_text}</a>
            </div>
        `;
        elements.container.appendChild(section);
    }

    function renderFeatures() {
        const section = document.createElement('section');
        section.className = 'features';
        section.id = 'advantages';
        section.innerHTML = `
            <div class="container">
                <div class="features-grid">
                    ${content.advantages.map(item => `
                        <div class="feature-item fade-in">
                            <div class="feature-icon">${item.icon}</div>
                            <h3>${item.title}</h3>
                            <p>${item.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        elements.container.appendChild(section);
    }

    function renderCalculator() {
        const section = document.createElement('section');
        section.id = 'calculator';
        section.className = 'fade-in';

        if (content.calc_fences?.[0]) {
            calcState.fenceType = content.calc_fences[0].name;
            calcState.fencePrice = content.calc_fences[0].price;
        }

        const fencesHTML = content.calc_fences.map((f, i) => `
            <div class="option-card ${i === 0 ? 'selected' : ''}"
                 data-fence-type="${f.name}" data-fence-price="${f.price}" data-fence-id="${f.id}"
                 onclick="App.selectFence(this)">
                <img src="${f.img}" alt="${f.name}" loading="lazy">
                <div class="option-card-content">
                    <span class="option-card-title">${f.name}</span>
                    <span class="option-card-price">${formatter.format(f.price)}/м</span>
                </div>
            </div>
        `).join('');

        const addonsHTML = content.calc_extras.map(addon => `
            <div class="option-card" data-element="${addon.id}" data-price="${addon.price}" data-name="${addon.name}"
                 onclick="App.toggleAddon(this)">
                <img src="${addon.img}" alt="${addon.name}" loading="lazy">
                <div class="option-card-content">
                    <span class="option-card-title">${addon.name}</span>
                    <span class="option-card-price">+ ${formatter.format(addon.price)}</span>
                </div>
            </div>
        `).join('');

        section.innerHTML = `
            <div class="container">
                <div class="section-title fade-in">
                    <h2>${content.calc_title} <span class="highlight">${content.calc_subtitle}</span></h2>
                </div>
                <div class="calc-wrapper">
                    <div class="calc-progress"><div id="calcProgressBar" class="calc-progress-bar"></div></div>
                    <form id="fenceCalculator">
                        <div id="step-1" class="calc-step active">
                            <div class="step-title">Шаг 1 из 3: Выберите тип ограждения</div>
                            <div class="option-grid">${fencesHTML}</div>
                            <div class="calc-actions"><div></div><button type="button" class="btn" onclick="App.nextCalcStep(1)">Далее</button></div>
                        </div>
                        <div id="step-2" class="calc-step">
                            <div class="step-title">Шаг 2 из 3: Укажите параметры</div>
                            <div class="range-container">
                                <div class="range-header">
                                    <span class="range-label">Длина забора, метры (м):</span>
                                    <span class="range-value" id="lengthValue">${calcState.length} м.</span>
                                </div>
                                <input type="range" class="range-slider" id="lengthSlider"
                                       min="10" max="500" value="${calcState.length}"
                                       oninput="App.updateLength(this.value)">
                            </div>
                            <div class="option-grid">${addonsHTML}</div>
                            <div id="liveTotal" class="live-total">Предварительно: ${formatter.format(calculateTotal())}</div>
                            <div class="calc-actions">
                                <button type="button" class="btn btn-secondary" onclick="App.prevCalcStep(2)">Назад</button>
                                <button type="button" class="btn" onclick="App.nextCalcStep(2)">Рассчитать</button>
                            </div>
                        </div>
                        <div id="step-3" class="calc-step">
                            <div class="step-title">Шаг 3 из 3: Ваша предварительная смета</div>
                            <div class="result-box">
                                <p style="font-size:0.625rem;font-weight:900;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:1rem;">Ориентировочная стоимость</p>
                                <div class="final-price" id="finalPrice">${formatter.format(calculateTotal())}</div>
                            </div>
                            <div id="resultDetails" class="result-details"></div>
                            <input type="text" id="calcName" class="calc-input" placeholder="Ваше имя" required inputmode="text" autocomplete="name">
                            <input type="tel" id="calcPhone" class="calc-input" placeholder="Ваш телефон" required inputmode="tel" autocomplete="tel" pattern="[\+]?[0-9\s\-\(\)]{10,}">
                            <div id="formHint" class="hint"></div>
                            <button type="submit" class="form-submit">${content.contacts_form_submit}</button>
                            <div class="calc-actions"><button type="button" class="btn btn-secondary" onclick="App.prevCalcStep(3)">Назад</button><div></div></div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        elements.container.appendChild(section);

        const form = document.getElementById('fenceCalculator');
        if (form) form.addEventListener('submit', handleFormSubmit);
    }

    function renderServices() {
        const section = document.createElement('section');
        section.id = 'services';
        section.className = 'section';
        section.innerHTML = `
            <div class="container">
                <div class="section-title fade-in">
                    <h2>${content.services_title}</h2>
                    <p>${content.services_desc}</p>
                </div>
                <div class="services-grid">
                    ${content.services.map(item => `
                        <div class="service-card fade-in">
                            <div class="card-img" style="background-image:url('${item.img}')"></div>
                            <div class="card-body">
                                <h3>${item.title}</h3>
                                <p>${item.desc}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        elements.container.appendChild(section);
    }

    function renderPortfolio() {
        const section = document.createElement('section');
        section.id = 'portfolio';
        section.className = 'section portfolio-bg';
        section.innerHTML = `
            <div class="container">
                <div class="section-title fade-in">
                    <h2>${content.portfolio_title}</h2>
                    <p>${content.portfolio_subtitle}</p>
                </div>
                <div class="portfolio-grid">
                    ${content.portfolio.map(item => `
                        <div class="portfolio-item fade-in">
                            <img src="${item.img}" alt="${item.title}" loading="lazy">
                            <div class="portfolio-overlay">
                                <div class="portfolio-title">${item.title}</div>
                                <div class="portfolio-tag">${item.tag}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        elements.container.appendChild(section);
    }

    function renderContacts() {
        const section = document.createElement('section');
        section.id = 'contacts';
        section.className = 'section contacts-section';
        section.innerHTML = `
            <div class="container">
                <div class="section-title fade-in">
                    <h2>${content.contacts_title}</h2>
                    <p>${content.contacts_desc}</p>
                </div>
                <div class="contacts-grid">
                    <div class="contacts-info fade-in">
                        <h3>${content.contacts_subtitle}</h3>
                        <div class="contact-item"><span class="contact-icon">📞</span><span class="contact-text">Артём: <a href="tel:${content.phone_main}">${content.phone_main}</a></span></div>
                        <div class="contact-item"><span class="contact-icon">📞</span><span class="contact-text">Юрий: <a href="tel:${content.phone_secondary}">${content.phone_secondary}</a></span></div>
                        <div class="contact-item"><span class="contact-icon">✉️</span><span class="contact-text">E-mail: <a href="mailto:${content.email}">${content.email}</a></span></div>
                    </div>
                    <div class="contact-form fade-in">
                        <h3>${content.contacts_form_title}</h3>
                        <form onsubmit="App.submitContactForm(event)">
                            <input type="text" id="contactName" placeholder="Ваше имя" required inputmode="text" autocomplete="name">
                            <input type="tel" id="contactPhone" placeholder="Ваш телефон" required inputmode="tel" autocomplete="tel" pattern="[\+]?[0-9\s\-\(\)]{10,}">
                            <textarea id="contactMessage" rows="4" placeholder="Сообщение"></textarea>
                            <div class="checkbox-group">
                                <input type="checkbox" id="contactConsent" required>
                                <label for="contactConsent">${content.contacts_form_consent}</label>
                            </div>
                            <button type="submit" class="btn btn-full">${content.contacts_form_submit}</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        elements.container.appendChild(section);
    }

    function renderFooter() {
        elements.footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-copyright">${content.footer_text}</div>
                <button class="footer-admin" onclick="App.openLoginModal()">Вход для персонала</button>
            </div>
        `;
    }

    function calculateTotal() {
        const fenceCost = calcState.length * calcState.fencePrice;
        const addonsCost = calcState.selectedAddons.reduce((sum, a) => sum + a.price, 0);
        return fenceCost + addonsCost;
    }

    function updateLiveTotal() {
        const el = document.getElementById('liveTotal');
        if (el) el.textContent = `Предварительно: ${formatter.format(calculateTotal())}`;
    }

    function selectFence(card) {
        const step1 = document.getElementById('step-1');
        if (!step1) return;
        step1.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        calcState.fenceType = card.dataset.fenceType;
        calcState.fencePrice = Number(card.dataset.fencePrice);
        updateLiveTotal();
    }

    function toggleAddon(card) {
        card.classList.toggle('selected');
        const id = card.dataset.element;
        const name = card.dataset.name;
        const price = Number(card.dataset.price);
        if (card.classList.contains('selected')) {
            if (!calcState.selectedAddons.find(a => a.id === id)) calcState.selectedAddons.push({ id, name, price });
        } else {
            calcState.selectedAddons = calcState.selectedAddons.filter(a => a.id !== id);
        }
        updateLiveTotal();
    }

    function updateLength(value) {
        calcState.length = parseInt(value, 10);
        const el = document.getElementById('lengthValue');
        if (el) el.textContent = `${value} м.`;
        updateLiveTotal();
    }

    function nextCalcStep(current) {
        if (current === 1 && !calcState.fenceType) { showToast('Выберите тип ограждения', 'error'); return; }
        if (current === 2) calculateResult();
        document.getElementById(`step-${current}`)?.classList.remove('active');
        document.getElementById(`step-${current + 1}`)?.classList.add('active');
        const bar = document.getElementById('calcProgressBar');
        if (bar) bar.style.width = `${((current + 1) / 3) * 100}%`;
    }

    function prevCalcStep(current) {
        document.getElementById(`step-${current}`)?.classList.remove('active');
        document.getElementById(`step-${current - 1}`)?.classList.add('active');
        const bar = document.getElementById('calcProgressBar');
        if (bar) bar.style.width = `${((current - 1) / 3) * 100}%`;
    }

    function calculateResult() {
        const fenceCost = calcState.length * calcState.fencePrice;
        let details = `<p>— Забор (${calcState.fenceType}) ${calcState.length} м: <strong>${formatter.format(fenceCost)}</strong></p>`;
        calcState.selectedAddons.forEach(a => details += `<p>— ${a.name}: <strong>${formatter.format(a.price)}</strong></p>`);
        const priceEl = document.getElementById('finalPrice');
        const detailsEl = document.getElementById('resultDetails');
        if (priceEl) priceEl.textContent = formatter.format(calculateTotal());
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

        const lead = {
            type: 'calc',
            name, phone,
            details: {
                fence: calcState.fenceType,
                length: calcState.length,
                total: calculateTotal(),
                addons: calcState.selectedAddons.map(a => a.name)
            }
        };

        try {
            await fetch(LEADS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lead)
            });
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
            await fetch(LEADS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lead)
            });
            showToast('Заявка отправлена!', 'success');
            e.target.reset();
        } catch (err) {
            showToast('Ошибка отправки', 'error');
        }
    }

    function resetCalculator() {
        calcState.selectedAddons = [];
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        const defaultCard = document.querySelector('#step-1 .option-card[data-fence-id="f1"]');
        if (defaultCard) {
            defaultCard.classList.add('selected');
            calcState.fenceType = defaultCard.dataset.fenceType;
            calcState.fencePrice = Number(defaultCard.dataset.fencePrice);
        }
        document.getElementById('step-3')?.classList.remove('active');
        document.getElementById('step-2')?.classList.remove('active');
        document.getElementById('step-1')?.classList.add('active');
        const bar = document.getElementById('calcProgressBar');
        if (bar) bar.style.width = '33.3%';
        const lengthValue = document.getElementById('lengthValue');
        const lengthSlider = document.getElementById('lengthSlider');
        if (lengthValue) lengthValue.textContent = '50 м.';
        if (lengthSlider) lengthSlider.value = 50;
        calcState.length = 50;
        updateLiveTotal();
    }

    function toggleMobileMenu() { elements.mobileMenu?.classList.toggle('hidden'); }
    function closeMobileMenu() { elements.mobileMenu?.classList.add('hidden'); }

    function initMobileMenu() {
        if (!elements.mobileNav) return;
        elements.mobileNav.innerHTML = `
            <a href="#calculator" onclick="App.closeMobileMenu()">Калькулятор</a>
            <a href="#services" onclick="App.closeMobileMenu()">Услуги</a>
            <a href="#portfolio" onclick="App.closeMobileMenu()">Наши работы</a>
            <a href="#contacts" onclick="App.closeMobileMenu()">Контакты</a>
        `;
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href.length > 1) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const headerOffset = 70;
                        const elementPosition = target.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                        closeMobileMenu();
                    }
                }
            });
        });
    }

    function showToast(message, type = 'success') {
        if (!elements.toast || !elements.toastMessage) return;
        elements.toastMessage.textContent = message;
        elements.toast.className = `toast ${type}`;
        elements.toast.classList.remove('hidden');
        setTimeout(() => elements.toast.classList.add('hidden'), 4000);
    }

    function initAnimations() {
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
            { threshold: 0.1 }
        );
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }

    function formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
    }

    function openLoginModal() {
        const password = prompt('Введите пароль администратора:');
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_token', 'true');
            showToast('Доступ разрешён', 'success');
            window.open('admin.html', '_blank');
        } else if (password !== null) {
            showToast('Неверный пароль', 'error');
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        selectFence, toggleAddon, updateLength, nextCalcStep, prevCalcStep,
        toggleMobileMenu, closeMobileMenu, openLoginModal, submitContactForm,
        getContent: () => content
    };
})();
