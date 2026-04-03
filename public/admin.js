const Admin = (function() {
    'use strict';

    const API_LOGIN = '/api/login';
    const API_SAVE = '/api/save';
    const API_DATA = '/api/data';
    const API_LEADS = '/api/leads';

    let content = {};
    let leads = [];

    // Получение токена из localStorage
    function getToken() {
        return localStorage.getItem('adminToken');
    }

    // Проверка авторизации при инициализации
    function init() {
        const token = getToken();
        if (token) {
            // Проверяем валидность токена загружая данные
            loadContent().then(() => {
                showDashboard();
            }).catch(() => {
                // Токен невалиден, показываем экран входа
                showLoginScreen();
            });
        } else {
            showLoginScreen();
        }
    }

    function showLoginScreen() {
        document.getElementById('login-screen')?.classList.remove('hidden');
        document.getElementById('dashboard')?.classList.add('hidden');
    }

    async function login() {
        const password = document.getElementById('admin-pass')?.value;
        const username = document.getElementById('admin-user')?.value || 'admin';
        
        if (!password) return alert('Введите пароль');

        try {
            const response = await fetch(API_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (data.success && data.token) {
                localStorage.setItem('adminToken', data.token);
                showDashboard();
            } else {
                alert('❌ ' + (data.message || 'Неверный логин или пароль'));
            }
        } catch (err) {
            console.error('Ошибка входа:', err);
            alert('❌ Ошибка подключения к серверу');
        }
    }

    function logout() {
        localStorage.removeItem('adminToken');
        location.reload();
    }

    function showDashboard() {
        document.getElementById('login-screen')?.classList.add('hidden');
        document.getElementById('dashboard')?.classList.remove('hidden');
        loadContent();
        loadLeads();
        initTabs();
    }

    async function loadContent() {
        try {
            const response = await fetch(API_DATA);
            if (!response.ok) throw new Error('Failed to load content');
            content = await response.json();
            populateContentForm();
            return content;
        } catch (err) {
            console.error('Ошибка загрузки контента:', err);
            throw err;
        }
    }

    async function loadLeads() {
        try {
            const token = getToken();
            const response = await fetch(API_LEADS, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    alert('Сессия истекла. Пожалуйста, войдите снова.');
                    logout();
                    return;
                }
                throw new Error('Failed to load leads');
            }
            
            const data = await response.json();
            leads = data.leads || data;
            renderLeadsList();
        } catch (err) {
            console.error('Ошибка загрузки заявок:', err);
        }
    }

    function populateContentForm() {
        // Общие настройки
        document.getElementById('edit-company').value = content.company_name || '';
        document.getElementById('edit-email').value = content.email || '';
        document.getElementById('edit-phone1').value = content.phone_main || '';
        document.getElementById('edit-phone2').value = content.phone_secondary || '';
        document.getElementById('edit-address').value = content.address || '';
        document.getElementById('edit-hours').value = content.hours || '';
        document.getElementById('edit-site-title').value = content.site_title || '';
        
        // Hero секция
        document.getElementById('edit-hero-subtitle').value = content.hero_subtitle || '';
        document.getElementById('edit-hero-title').value = content.hero_title || '';
        document.getElementById('edit-hero-desc').value = content.hero_description || '';
        document.getElementById('edit-hero-cta').value = content.hero_cta_text || '';
        document.getElementById('edit-hero-cta-link').value = content.hero_cta_link || '';
        document.getElementById('edit-hero-bg').value = content.hero_bg || '';
        
        // Преимущества
        renderAdvantagesEditor();
        
        // Калькулятор
        document.getElementById('edit-calc-title').value = content.calc_title || '';
        document.getElementById('edit-calc-subtitle').value = content.calc_subtitle || '';
        renderFencesEditor();
        renderExtrasEditor();
        
        // Услуги
        document.getElementById('edit-services-title').value = content.services_title || '';
        document.getElementById('edit-services-desc').value = content.services_desc || '';
        renderServicesEditor();
        
        // Портфолио
        document.getElementById('edit-portfolio-title').value = content.portfolio_title || '';
        document.getElementById('edit-portfolio-subtitle').value = content.portfolio_subtitle || '';
        renderPortfolioEditor();
        
        // Контакты
        document.getElementById('edit-contacts-title').value = content.contacts_title || '';
        document.getElementById('edit-contacts-subtitle').value = content.contacts_subtitle || '';
        document.getElementById('edit-contacts-desc').value = content.contacts_desc || '';
        document.getElementById('edit-contacts-form-title').value = content.contacts_form_title || '';
        document.getElementById('edit-contacts-form-submit').value = content.contacts_form_submit || '';
        
        // Футер
        document.getElementById('edit-footer-text').value = content.footer_text || '';
    }
    
    function renderAdvantagesEditor() {
        const container = document.getElementById('advantages-editor');
        if (!container) return;
        container.innerHTML = (content.advantages || []).map((item, index) => `
            <div class="editable-item" data-array="advantages" data-index="${index}">
                <div class="form-row">
                    <div class="form-group"><label>Иконка</label><input type="text" value="${item.icon}" onchange="Admin.updateArrayItem('advantages', ${index}, 'icon', this.value)"></div>
                    <div class="form-group"><label>Заголовок</label><input type="text" value="${item.title}" onchange="Admin.updateArrayItem('advantages', ${index}, 'title', this.value)"></div>
                </div>
                <div class="form-group"><label>Описание</label><textarea onchange="Admin.updateArrayItem('advantages', ${index}, 'desc', this.value)">${item.desc}</textarea></div>
                <button class="btn-remove" onclick="Admin.removeArrayItem('advantages', ${index})">Удалить</button>
            </div>
        `).join('');
        container.innerHTML += `<button class="btn-add" onclick="Admin.addArrayItem('advantages', {icon: '⭐', title: 'Новое преимущество', desc: 'Описание'})">+ Добавить преимущество</button>`;
    }
    
    function renderFencesEditor() {
        const container = document.getElementById('fences-editor');
        if (!container) return;
        container.innerHTML = (content.calc_fences || []).map((item, index) => `
            <div class="editable-item" data-array="calc_fences" data-index="${index}">
                <div class="form-row">
                    <div class="form-group"><label>ID</label><input type="text" value="${item.id}" onchange="Admin.updateArrayItem('calc_fences', ${index}, 'id', this.value)"></div>
                    <div class="form-group"><label>Название</label><input type="text" value="${item.name}" onchange="Admin.updateArrayItem('calc_fences', ${index}, 'name', this.value)"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Цена (руб/м)</label><input type="number" value="${item.price}" onchange="Admin.updateArrayItem('calc_fences', ${index}, 'price', Number(this.value))"></div>
                    <div class="form-group"><label>Изображение (URL)</label><input type="text" value="${item.img}" onchange="Admin.updateArrayItem('calc_fences', ${index}, 'img', this.value)"></div>
                </div>
                <button class="btn-remove" onclick="Admin.removeArrayItem('calc_fences', ${index})">Удалить</button>
            </div>
        `).join('');
        container.innerHTML += `<button class="btn-add" onclick="Admin.addArrayItem('calc_fences', {id: 'f' + Date.now(), name: 'Новый забор', price: 3000, img: ''})">+ Добавить тип забора</button>`;
    }
    
    function renderExtrasEditor() {
        const container = document.getElementById('extras-editor');
        if (!container) return;
        container.innerHTML = (content.calc_extras || []).map((item, index) => `
            <div class="editable-item" data-array="calc_extras" data-index="${index}">
                <div class="form-row">
                    <div class="form-group"><label>ID</label><input type="text" value="${item.id}" onchange="Admin.updateArrayItem('calc_extras', ${index}, 'id', this.value)"></div>
                    <div class="form-group"><label>Название</label><input type="text" value="${item.name}" onchange="Admin.updateArrayItem('calc_extras', ${index}, 'name', this.value)"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Цена (руб)</label><input type="number" value="${item.price}" onchange="Admin.updateArrayItem('calc_extras', ${index}, 'price', Number(this.value))"></div>
                    <div class="form-group"><label>Изображение (URL)</label><input type="text" value="${item.img}" onchange="Admin.updateArrayItem('calc_extras', ${index}, 'img', this.value)"></div>
                </div>
                <button class="btn-remove" onclick="Admin.removeArrayItem('calc_extras', ${index})">Удалить</button>
            </div>
        `).join('');
        container.innerHTML += `<button class="btn-add" onclick="Admin.addArrayItem('calc_extras', {id: 'extra' + Date.now(), name: 'Дополнительно', price: 10000, img: ''})">+ Добавить опцию</button>`;
    }
    
    function renderServicesEditor() {
        const container = document.getElementById('services-editor');
        if (!container) return;
        container.innerHTML = (content.services || []).map((item, index) => `
            <div class="editable-item" data-array="services" data-index="${index}">
                <div class="form-row">
                    <div class="form-group"><label>Заголовок</label><input type="text" value="${item.title}" onchange="Admin.updateArrayItem('services', ${index}, 'title', this.value)"></div>
                    <div class="form-group"><label>Изображение (URL)</label><input type="text" value="${item.img}" onchange="Admin.updateArrayItem('services', ${index}, 'img', this.value)"></div>
                </div>
                <div class="form-group"><label>Описание</label><textarea onchange="Admin.updateArrayItem('services', ${index}, 'desc', this.value)">${item.desc}</textarea></div>
                <button class="btn-remove" onclick="Admin.removeArrayItem('services', ${index})">Удалить</button>
            </div>
        `).join('');
        container.innerHTML += `<button class="btn-add" onclick="Admin.addArrayItem('services', {title: 'Новая услуга', desc: 'Описание услуги', img: ''})">+ Добавить услугу</button>`;
    }
    
    function renderPortfolioEditor() {
        const container = document.getElementById('portfolio-editor');
        if (!container) return;
        container.innerHTML = (content.portfolio || []).map((item, index) => `
            <div class="editable-item" data-array="portfolio" data-index="${index}">
                <div class="form-row">
                    <div class="form-group"><label>Заголовок</label><input type="text" value="${item.title}" onchange="Admin.updateArrayItem('portfolio', ${index}, 'title', this.value)"></div>
                    <div class="form-group"><label>Тег (локация)</label><input type="text" value="${item.tag}" onchange="Admin.updateArrayItem('portfolio', ${index}, 'tag', this.value)"></div>
                </div>
                <div class="form-group"><label>Изображение (URL)</label><input type="text" value="${item.img}" onchange="Admin.updateArrayItem('portfolio', ${index}, 'img', this.value)"></div>
                <button class="btn-remove" onclick="Admin.removeArrayItem('portfolio', ${index})">Удалить</button>
            </div>
        `).join('');
        container.innerHTML += `<button class="btn-add" onclick="Admin.addArrayItem('portfolio', {title: 'Объект', tag: 'Локация', img: ''})">+ Добавить объект</button>`;
    }

    async function saveContent() {
        const newContent = {
            site_title: document.getElementById('edit-site-title').value,
            company_name: document.getElementById('edit-company').value,
            email: document.getElementById('edit-email').value,
            phone_main: document.getElementById('edit-phone1').value,
            phone_secondary: document.getElementById('edit-phone2').value,
            address: document.getElementById('edit-address').value,
            hours: document.getElementById('edit-hours').value,
            hero_subtitle: document.getElementById('edit-hero-subtitle').value,
            hero_title: document.getElementById('edit-hero-title').value,
            hero_description: document.getElementById('edit-hero-desc').value,
            hero_cta_text: document.getElementById('edit-hero-cta').value,
            hero_cta_link: document.getElementById('edit-hero-cta-link').value,
            hero_bg: document.getElementById('edit-hero-bg').value,
            advantages: content.advantages,
            calc_title: document.getElementById('edit-calc-title').value,
            calc_subtitle: document.getElementById('edit-calc-subtitle').value,
            calc_fences: content.calc_fences,
            calc_extras: content.calc_extras,
            services_title: document.getElementById('edit-services-title').value,
            services_desc: document.getElementById('edit-services-desc').value,
            services: content.services,
            portfolio_title: document.getElementById('edit-portfolio-title').value,
            portfolio_subtitle: document.getElementById('edit-portfolio-subtitle').value,
            portfolio: content.portfolio,
            contacts_title: document.getElementById('edit-contacts-title').value,
            contacts_subtitle: document.getElementById('edit-contacts-subtitle').value,
            contacts_desc: document.getElementById('edit-contacts-desc').value,
            contacts_form_title: document.getElementById('edit-contacts-form-title').value,
            contacts_form_submit: document.getElementById('edit-contacts-form-submit').value,
            footer_text: document.getElementById('edit-footer-text').value
        };

        try {
            const response = await fetch(API_SAVE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: localStorage.getItem('adminToken'),
                    newContent
                })
            });

            if (response.ok) {
                alert('✅ Изменения сохранены! Обновите главную страницу (F5) чтобы увидеть изменения.');
            } else {
                alert('❌ Ошибка сохранения. Перезайдите в админку.');
                logout();
            }
        } catch (err) {
            alert('❌ Ошибка подключения к серверу');
        }
    }
    
    function updateArrayItem(arrayName, index, field, value) {
        content[arrayName][index][field] = value;
    }
    
    function removeArrayItem(arrayName, index) {
        if (confirm('Удалить этот элемент?')) {
            content[arrayName].splice(index, 1);
            populateContentForm();
        }
    }
    
    function addArrayItem(arrayName, item) {
        content[arrayName].push(item);
        populateContentForm();
    }

    function renderLeadsList() {
        const list = document.getElementById('leads-list');
        if (!list) return;

        if (leads.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:60px;color:#999;">Пока нет заявок</div>';
            return;
        }

        list.innerHTML = leads.map(lead => `
            <div class="lead-item">
                <div class="lead-name">${lead.name}</div>
                <div class="lead-phone">📞 <a href="tel:${lead.phone}">${lead.phone}</a></div>
                <div class="lead-date">🕐 ${lead.date}</div>
                ${lead.details ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #eee;font-size:0.875rem;color:#666;"><strong>Детали:</strong> ${lead.details.fence} | ${lead.details.length}м | ${new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',minimumFractionDigits:0}).format(lead.details.total)}</div>` : ''}
            </div>
        `).join('');
    }

    function initTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
            });
        });
    }

    return {
        init,
        login,
        logout,
        saveContent,
        updateArrayItem,
        removeArrayItem,
        addArrayItem
    };
})();

document.addEventListener('DOMContentLoaded', Admin.init);
