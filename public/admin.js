const Admin = (function() {
    'use strict';

    const API_LOGIN = '/api/login';
    const API_SAVE = '/api/save';
    const API_DATA = '/api/data';
    const API_LEADS = '/api/leads';
    const ADMIN_TOKEN = 'super-secret-token-123';

    let content = {};
    let leads = [];

    function hasValidStoredToken() {
        const raw = localStorage.getItem('adminToken');
        if (!raw) return false;
        try {
            const parsed = JSON.parse(raw);
            return parsed && parsed.secret === ADMIN_TOKEN;
        } catch {
            // Если токен хранится не в JSON-формате — считаем, что это невалидная сессия.
            return false;
        }
    }

    function init() {
        if (hasValidStoredToken()) {
            showDashboard();
        }
    }

    async function login() {
        const password = document.getElementById('admin-pass')?.value;
        if (!password) return alert('Введите пароль');

        try {
            const response = await fetch(API_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();

            if (data.success) {
                localStorage.setItem('adminToken', data.token);
                showDashboard();
            } else {
                alert('❌ Неверный пароль');
            }
        } catch (err) {
            alert('❌ Ошибка подключения к серверу');
        }
    }

    function logout() {
        localStorage.removeItem('adminToken');
        location.reload();
    }

    function showDashboard() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadContent();
        loadLeads();
        initTabs();
    }

    async function loadContent() {
        try {
            const response = await fetch(API_DATA);
            content = await response.json();
            populateContentForm();
        } catch (err) {
            console.error('Ошибка загрузки контента:', err);
        }
    }

    async function loadLeads() {
        try {
            const response = await fetch(API_LEADS);
            leads = await response.json();
            renderLeadsList();
        } catch (err) {
            console.error('Ошибка загрузки заявок:', err);
        }
    }

    function populateContentForm() {
        document.getElementById('edit-company').value = content.company_name || '';
        document.getElementById('edit-email').value = content.email || '';
        document.getElementById('edit-phone1').value = content.phone_main || '';
        document.getElementById('edit-phone2').value = content.phone_secondary || '';
        document.getElementById('edit-address').value = content.address || '';
        document.getElementById('edit-hours').value = content.hours || '';
        document.getElementById('edit-hero-subtitle').value = content.hero_subtitle || '';
        document.getElementById('edit-hero-title').value = content.hero_title || '';
        document.getElementById('edit-hero-desc').value = content.hero_description || '';
        document.getElementById('edit-hero-cta').value = content.hero_cta_text || '';
        document.getElementById('edit-hero-bg').value = content.hero_bg || '';
    }

    async function saveContent() {
        const newContent = {
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
            hero_bg: document.getElementById('edit-hero-bg').value
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
        saveContent
    };
})();

document.addEventListener('DOMContentLoaded', Admin.init);
