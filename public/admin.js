const Admin = (function() {
    'use strict';

    const API_LOGIN = '/api/login';
    const API_SAVE = '/api/save';
    const API_DATA = '/api/data';
    const API_LEADS = '/api/leads';
    const API_STATS = '/api/stats';

    let content = {};
    let leads = [];
    let isLoggedIn = false;
    let leadFilter = 'all';

    function init() {
        const token = localStorage.getItem('adminToken');
        if (token) {
            checkToken(token);
        }
    }

    async function checkToken(token) {
        try {
            const response = await fetch(`${API_LEADS}?token=${encodeURIComponent(token)}`);
            if (response.ok) {
                isLoggedIn = true;
                showDashboard();
            } else {
                logout();
            }
        } catch {
            logout();
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
                isLoggedIn = true;
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
        isLoggedIn = false;
        location.reload();
    }

    function showDashboard() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadContent();
        loadLeads();
        loadStats();
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
            updateStats();
        } catch (err) {
            console.error('Ошибка загрузки заявок:', err);
        }
    }

    async function loadStats() {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_STATS}?token=${encodeURIComponent(token)}`);
            const stats = await response.json();
            renderStats(stats);
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
        }
    }

    function renderStats(stats) {
        document.getElementById('stat-total').textContent = stats.totalLeads || 0;
        document.getElementById('stat-new').textContent = stats.newLeads || 0;
        document.getElementById('stat-progress').textContent = stats.inProgress || 0;
        document.getElementById('stat-completed').textContent = stats.completed || 0;
        document.getElementById('stat-24h').textContent = stats.newLeads24h || 0;
    }

    function updateStats() {
        const filtered = getFilteredLeads();
        document.getElementById('leads-count').textContent = filtered.length;
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
        document.getElementById('edit-calc-title').value = content.calc_title || '';
        document.getElementById('edit-calc-subtitle').value = content.calc_subtitle || '';
        document.getElementById('edit-services-title').value = content.services_title || '';
        document.getElementById('edit-services-desc').value = content.services_desc || '';
        document.getElementById('edit-contacts-title').value = content.contacts_title || '';
        document.getElementById('edit-contacts-desc').value = content.contacts_desc || '';
        document.getElementById('edit-footer').value = content.footer_text || '';
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
            hero_bg: document.getElementById('edit-hero-bg').value,
            calc_title: document.getElementById('edit-calc-title').value,
            calc_subtitle: document.getElementById('edit-calc-subtitle').value,
            services_title: document.getElementById('edit-services-title').value,
            services_desc: document.getElementById('edit-services-desc').value,
            contacts_title: document.getElementById('edit-contacts-title').value,
            contacts_desc: document.getElementById('edit-contacts-desc').value,
            footer_text: document.getElementById('edit-footer').value
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
                const data = await response.json();
                alert(`❌ ${data.error || 'Ошибка сохранения'}`);
                logout();
            }
        } catch (err) {
            alert('❌ Ошибка подключения к серверу');
        }
    }

    function getFilteredLeads() {
        if (leadFilter === 'all') return leads;
        return leads.filter(l => l.status === leadFilter);
    }

    function setFilter(status) {
        leadFilter = status;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.filter-btn[data-status="${status}"]`)?.classList.add('active');
        renderLeadsList();
    }

    async function updateLeadStatus(id, status) {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`/api/leads/${id}/status?token=${encodeURIComponent(token)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                loadLeads();
                loadStats();
            } else {
                alert('❌ Ошибка обновления статуса');
            }
        } catch (err) {
            alert('❌ Ошибка подключения');
        }
    }

    async function deleteLead(id) {
        if (!confirm('Удалить заявку?')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`/api/leads/${id}?token=${encodeURIComponent(token)}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadLeads();
                loadStats();
            } else {
                alert('❌ Ошибка удаления');
            }
        } catch (err) {
            alert('❌ Ошибка подключения');
        }
    }

    function getStatusBadge(s) {
        const badges = { new: '🆕', in_progress: '🔄', completed: '✅', rejected: '❌' };
        return badges[s] || '❓';
    }

    function renderLeadsList() {
        const list = document.getElementById('leads-list');
        if (!list) return;

        const filtered = getFilteredLeads();

        if (filtered.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:60px;color:#999;">Пока нет заявок</div>';
            return;
        }

        list.innerHTML = filtered.map(lead => `
            <div class="lead-item">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div>
                        <div class="lead-name">${lead.name}</div>
                        <div class="lead-phone">📞 <a href="tel:${lead.phone}">${lead.phone}</a></div>
                        <div class="lead-date">🕐 ${lead.date}</div>
                        ${lead.details ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #eee;font-size:0.875rem;color:#666;"><strong>��ет��ли:</strong> ${lead.details.fence || ''} | ${lead.details.length || ''}м | ${lead.details.total ? new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',minimumFractionDigits:0}).format(lead.details.total) : ''}</div>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.5rem;margin-bottom:10px;">${getStatusBadge(lead.status)}</div>
                        <select onchange="Admin.updateLeadStatus('${lead.id}', this.value)" style="padding:6px;border-radius:4px;border:1px solid #ddd;margin-bottom:5px;">
                            <option value="new" ${lead.status === 'new' ? 'selected' : ''}>🆕 Новая</option>
                            <option value="in_progress" ${lead.status === 'in_progress' ? 'selected' : ''}>🔄 В работе</option>
                            <option value="completed" ${lead.status === 'completed' ? 'selected' : ''}>✅ Выполнена</option>
                            <option value="rejected" ${lead.status === 'rejected' ? 'selected' : ''}>❌ Отклонена</option>
                        </select>
                        <button onclick="Admin.deleteLead('${lead.id}')" style="background:#f44336;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">🗑️</button>
                    </div>
                </div>
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
        setFilter,
        updateLeadStatus,
        deleteLead
    };
})();

document.addEventListener('DOMContentLoaded', Admin.init);
