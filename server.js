const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'logs.txt');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'db.json');
const ADMIN_PASSWORD = 'admin123';
const ADMIN_TOKEN_SECRET = 'super-secret-token-123';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function generateToken() {
  return JSON.stringify({ secret: ADMIN_TOKEN_SECRET, issued: Date.now() });
}

function validateToken(token) {
  try {
    const parsed = JSON.parse(token);
    if (parsed.secret !== ADMIN_TOKEN_SECRET) return false;
    if (Date.now() - parsed.issued > TOKEN_EXPIRY_MS) return false;
    return true;
  } catch {
    return false;
  }
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const defaultDb = {
  content: {
    site_title: 'Арт Периметр — Металлоконструкции',
    company_name: 'Арт Периметр',
    phone_main: '+7 917 509 79 97',
    phone_secondary: '+7 985 554 16 69',
    email: 'artemtozlan5@gmail.com',
    address: 'Москва и МО, Производственный проезд, 1',
    hours: 'Ежедневно 9:00 - 21:00',
    hero_subtitle: 'ваша зона комфорта',
    hero_title: 'Профессиональный монтаж заборов и металлоконструкций',
    hero_description: 'Работаем по Москве и МО. Своё производство. Гарантия 2 года.',
    hero_cta_text: 'Рассчитать стоимость',
    hero_cta_link: '#calculator',
    hero_bg: 'https://images.pexels.com/photos/162568/fence-iron-gate-garden-162568.jpeg?auto=compress&cs=tinysrgb&w=1920',
    advantages: [
      { icon: '🛡️', title: 'Работа по договору', desc: 'Фиксируем стоимость и сроки. Никаких скрытых платежей.' },
      { icon: '🏭', title: 'Собственный цех', desc: 'Изготавливаем конструкции сами, без посредников.' },
      { icon: '⏱️', title: 'Точно в срок', desc: 'Бригады с опытом от 7 лет. Монтаж за 1-2 дня.' },
      { icon: '✅', title: 'Гарантия 2 года', desc: 'Мы уверены в качестве, поэтому даём честную гарантию.' }
    ],
    calc_title: 'Быстрый расчет стоимости забора',
    calc_subtitle: 'Ответьте на 3 вопроса и узнайте ориентировочную цену',
    calc_fences: [
      { id: 'f1', name: 'Профнастил', price: 3000, img: 'https://images.pexels.com/photos/5570224/pexels-photo-5570224.jpeg?auto=compress&cs=tinysrgb&w=600', heights: [1.5, 1.8, 2.0, 2.5] },
      { id: 'f2', name: 'Евроштакетник', price: 4500, img: 'https://images.pexels.com/photos/5691613/pexels-photo-5691613.jpeg?auto=compress&cs=tinysrgb&w=600', heights: [1.5, 1.8, 2.0, 2.5] },
      { id: 'f3', name: '3D Сетка', price: 2000, img: 'https://images.pexels.com/photos/13880222/pexels-photo-13880222.jpeg?auto=compress&cs=tinysrgb&w=600', heights: [1.5, 1.8, 2.0, 2.5] }
    ],
    calc_extras: [
      { id: 'gate', name: 'Ворота (Откатные)', price: 35000, img: 'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { id: 'wicket', name: 'Калитка', price: 15000, img: 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=600' }
    ],
    calc_heights: [
      { value: 1.5, label: '1.5 м', multiplier: 1.0 },
      { value: 1.8, label: '1.8 м', multiplier: 1.15 },
      { value: 2.0, label: '2.0 м', multiplier: 1.25 },
      { value: 2.5, label: '2.5 м', multiplier: 1.5 }
    ],
    calc_paint_options: [
      { id: 'none', name: 'Без покраски', multiplier: 1.0 },
      { id: 'ground', name: 'Грунт-эмаль', multiplier: 1.1 },
      { id: 'powder', name: 'Порошковая покраска', multiplier: 1.2 }
    ],
    calc_delivery_fee: 5000,
    calc_discount_threshold: 100,
    calc_discount_percent: 5,
    services_title: 'Наши услуги',
    services_desc: 'Выполняем полный цикл работ: замер, проектирование, изготовление, доставка и монтаж.',
    services: [
      { title: 'Заборы и ограждения', desc: 'Профнастил, евроштакетник, 3D сетка, жалюзи.', img: 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { title: 'Калитки', desc: 'Металлические, с элементами ковки, врезные замки.', img: 'https://images.pexels.com/photos/534220/pexels-photo-534220.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { title: 'Откатные ворота', desc: 'Автоматика, консольные системы, монтаж под ключ.', img: 'https://images.pexels.com/photos/210617/pexels-photo-210617.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { title: 'Навесы для авто', desc: 'Арочные и односкатные навесы из поликарбоната.', img: 'https://images.pexels.com/photos/534220/pexels-photo-534220.jpeg?auto=compress&cs=tinysrgb&w=600' }
    ],
    portfolio_title: 'Выполненные объекты',
    portfolio_subtitle: 'Реальные примеры наших работ в Москве и области',
    portfolio: [
      { title: 'Навес на 2 машины', tag: 'МО, Одинцово', img: 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&w=600&q=80' },
      { title: 'Забор жалюзи', tag: 'Истра', img: 'https://images.unsplash.com/photo-1622379361879-668d2a650992?auto=format&fit=crop&w=600&q=80' },
      { title: 'Кованые перила', tag: 'Химки', img: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&w=600&q=80' }
    ],
    contacts_title: 'Свяжитесь с нами',
    contacts_subtitle: 'Контактная информация',
    contacts_desc: 'Готовы обсудить ваш проект? Позвоните нам или напишите на почту.',
    contacts_form_title: 'Оставьте заявку',
    contacts_form_consent: 'Я согласен на обработку персональных данных',
    contacts_form_submit: 'Отправить',
    footer_text: '© 2025 Арт Периметр. Все права защищены.',
    footer_privacy: '#'
  },
  leads: []
};

const DB_SCHEMA = {
  content: {
    requiredStrings: ['site_title', 'company_name', 'phone_main', 'phone_secondary', 'email', 'address', 'hours', 'hero_subtitle', 'hero_title', 'hero_description', 'hero_cta_text', 'hero_cta_link', 'hero_bg', 'calc_title', 'calc_subtitle', 'services_title', 'services_desc', 'portfolio_title', 'portfolio_subtitle', 'contacts_title', 'contacts_subtitle', 'contacts_desc', 'contacts_form_title', 'contacts_form_consent', 'contacts_form_submit', 'footer_text', 'footer_privacy'],
    requiredArrays: ['advantages', 'calc_fences', 'calc_extras', 'services', 'portfolio']
  },
  leads: 'array'
};

function validateDb(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return ['DB data is not an object'];
  }
  if (!data.content || typeof data.content !== 'object') {
    errors.push('Missing or invalid "content" object');
  } else {
    for (const key of DB_SCHEMA.content.requiredStrings) {
      if (typeof data.content[key] !== 'string') {
        errors.push(`Missing or invalid string field: content.${key}`);
      }
    }
    for (const key of DB_SCHEMA.content.requiredArrays) {
      if (!Array.isArray(data.content[key])) {
        errors.push(`Missing or invalid array field: content.${key}`);
      }
    }
  }
  if (!Array.isArray(data.leads)) {
    errors.push('Missing or invalid "leads" array');
  }
  return errors;
}

function backupDb() {
  if (fs.existsSync(DB_FILE)) {
    const backupPath = DB_FILE + '.bak';
    fs.copyFileSync(DB_FILE, backupPath);
    console.log('💾 Бэкап создан: db.json.bak');
    return backupPath;
  }
  return null;
}

function writeDb(data) {
  const errors = validateDb(data);
  if (errors.length > 0) {
    console.error('❌ Ошибка валидации БД:', errors);
    throw new Error(`Invalid DB structure: ${errors.join(', ')}`);
  }
  backupDb();
  const tempPath = DB_FILE + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, DB_FILE);
}

function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    console.log('✅ db.json создан');
  } else {
    try {
      const db = readDb();
      const errors = validateDb(db);
      if (errors.length > 0) {
        console.warn('⚠️ db.json повреждён, восстанавливаю из default:', errors);
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
      }
    } catch (err) {
      console.warn('⚠️ Не удалось прочитать db.json, создаю заново:', err.message);
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    }
  }
}

function readDb() {
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const data = JSON.parse(raw);
  const errors = validateDb(data);
  if (errors.length > 0) {
    throw new Error(`Invalid DB structure: ${errors.join(', ')}`);
  }
  return data;
}

app.get('/api/data', (req, res) => {
  try {
    const db = readDb();
    res.json(db.content);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось прочитать данные' });
  }
});

app.get('/api/jsonld', (req, res) => {
  try {
    const db = readDb();
    const c = db.content;
    const jsonld = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: c.company_name,
      description: c.hero_description,
      url: 'https://art-perimeter.ru',
      telephone: c.phone_main,
      email: c.email,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Москва',
        addressCountry: 'RU',
        streetAddress: c.address
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
        opens: '09:00',
        closes: '21:00'
      },
      image: c.hero_bg,
      priceRange: '$$'
    };
    res.json(jsonld);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось сгенерировать JSON-LD' });
  }
});

app.get('/api/assets/audit', (req, res) => {
  try {
    const db = readDb();
    const urls = [];
    function extractImages(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(extractImages); return; }
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'img' && typeof value === 'string') urls.push({ field: key, url: value, valid: value.startsWith('http') });
        else if (key === 'hero_bg' && typeof value === 'string') urls.push({ field: key, url: value, valid: value.startsWith('http') });
        else if (typeof value === 'object') extractImages(value);
      }
    }
    extractImages(db.content);
    res.json({ total: urls.length, valid: urls.filter(u => u.valid).length, invalid: urls.filter(u => !u.valid).length, images: urls });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка аудита ассетов' });
  }
});

app.get('/api/leads', (req, res) => {
  try {
    const db = readDb();
    res.json(db.leads || []);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось прочитать заявки' });
  }
});

app.post('/api/leads', (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Слишком много запросов. Подождите минуту.' });
    }
    const db = readDb();
    const sanitized = sanitizeObject(req.body);
    const newLead = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: new Date().toLocaleString('ru-RU'),
      status: 'new',
      ...sanitized
    };
    db.leads.unshift(newLead);
    writeDb(db);
    console.log(`📩 Новая заявка: ${newLead.name} (${newLead.phone})`);
    logToFile(`LEAD: ${newLead.name} (${newLead.phone}) type=${newLead.type || 'unknown'} status=new`);
    res.json({ success: true, id: newLead.id });
  } catch (err) {
    logToFile(`ERROR creating lead: ${err.message}`);
    res.status(500).json({ error: 'Не удалось сохранить заявку' });
  }
});

const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const window = 60 * 1000;
  const maxRequests = 5;
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const timestamps = rateLimitMap.get(ip).filter(t => now - t < window);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return timestamps.length > maxRequests;
}
function resetRateLimits() {
  rateLimitMap.clear();
}

app.patch('/api/leads/:id/status', (req, res) => {
  const { token } = req.query;
  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  const { status } = req.body;
  const validStatuses = ['new', 'in_progress', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Недопустимый статус. Допустимые: ${validStatuses.join(', ')}` });
  }
  try {
    const db = readDb();
    const lead = db.leads.find(l => l.id === req.params.id);
    if (!lead) return res.status(404).json({ error: 'Заявка не найдена' });
    lead.status = status;
    lead.statusUpdatedAt = new Date().toLocaleString('ru-RU');
    writeDb(db);
    logToFile(`LEAD STATUS: ${lead.id} -> ${status}`);
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось обновить статус' });
  }
});

app.get('/api/leads/export', (req, res) => {
  const { token } = req.query;
  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  try {
    const db = readDb();
    const leads = db.leads || [];
    const headers = ['ID', 'Date', 'Name', 'Phone', 'Type', 'Status', 'Details'];
    const rows = leads.map(l => {
      const details = l.details ? JSON.stringify(l.details).replace(/"/g, '""') : '';
      return `"${l.id}","${l.date}","${l.name || ''}","${l.phone || ''}","${l.type || ''}","${l.status || 'new'}","${details}"`;
    });
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка экспорта' });
  }
});

app.delete('/api/leads/:id', (req, res) => {
  const { token } = req.query;
  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  try {
    const db = readDb();
    const before = db.leads.length;
    db.leads = db.leads.filter(lead => lead.id !== req.params.id);
    if (db.leads.length === before) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    writeDb(db);
    console.log(`🗑️ Заявка удалена: ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось удалить заявку' });
  }
});

app.post('/api/leads/bulk-delete', (req, res) => {
  const { token } = req.query;
  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Требуется массив ID заявок' });
  }
  try {
    const db = readDb();
    const before = db.leads.length;
    const idsSet = new Set(ids.map(String));
    db.leads = db.leads.filter(lead => !idsSet.has(lead.id));
    const deleted = before - db.leads.length;
    writeDb(db);
    console.log(`🗑️ Удалено заявок: ${deleted}`);
    res.json({ success: true, deleted: deleted });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось удалить заявки' });
  }
});

app.post('/api/leads/bulk-status', (req, res) => {
  const { token } = req.query;
  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Требуется массив ID заявок' });
  }
  const validStatuses = ['new', 'in_progress', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Недопустимый статус. Допустимые: ${validStatuses.join(', ')}` });
  }
  try {
    const db = readDb();
    const idsSet = new Set(ids.map(String));
    let updated = 0;
    db.leads.forEach(lead => {
      if (idsSet.has(lead.id)) {
        lead.status = status;
        lead.statusUpdatedAt = new Date().toLocaleString('ru-RU');
        updated++;
      }
    });
    writeDb(db);
    console.log(`✏️ Обновлено статусов: ${updated}`);
    res.json({ success: true, updated: updated });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось обновить статусы' });
  }
});

app.post('/api/portfolio', (req, res) => {
  const { token, item } = req.body;
  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  try {
    const db = readDb();
    const sanitized = sanitizeObject(item);
    const newItem = {
      id: Date.now().toString(),
      title: sanitized.title || 'Без названия',
      tag: sanitized.tag || '',
      img: sanitized.img || ''
    };
    db.content.portfolio.push(newItem);
    writeDb(db);
    console.log(`🖼️ Портфолио добавлено: ${newItem.title}`);
    res.json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось добавить в портфолио' });
  }
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = generateToken();
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Неверный пароль' });
  }
});

app.post('/api/save', (req, res) => {
  const { token, newContent } = req.body;

  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    const db = readDb();
    const oldContent = JSON.parse(JSON.stringify(db.content));
    db.content = { ...db.content, ...sanitizeObject(newContent) };
    if (!db.contentHistory) db.contentHistory = [];
    db.contentHistory.unshift({
      timestamp: Date.now(),
      date: new Date().toLocaleString('ru-RU'),
      changes: Object.keys(newContent),
      snapshot: oldContent
    });
    if (db.contentHistory.length > 20) db.contentHistory = db.contentHistory.slice(0, 20);
    writeDb(db);
    console.log('✅ Контент обновлён');
    logToFile(`CONTENT UPDATE: ${Object.keys(newContent).join(', ')}`);
    res.json({ success: true });
  } catch (err) {
    logToFile(`ERROR saving content: ${err.message}`);
    res.status(500).json({ error: 'Не удалось сохранить изменения' });
  }
});

app.get('/api/content/history', (req, res) => {
  const { token } = req.query;
  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  try {
    const db = readDb();
    const history = (db.contentHistory || []).map(h => ({
      date: h.date,
      changes: h.changes,
      timestamp: h.timestamp
    }));
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось получить историю' });
  }
});

app.post('/api/content/rollback', (req, res) => {
  const { token, versionIndex } = req.body;
  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  try {
    const db = readDb();
    const history = db.contentHistory || [];
    if (!history[versionIndex]) {
      return res.status(404).json({ error: 'Версия не найдена' });
    }
    db.content = history[versionIndex].snapshot;
    writeDb(db);
    logToFile(`CONTENT ROLLBACK to version ${versionIndex}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка отката' });
  }
});

app.get('/api/preview', (req, res) => {
  const { token, changes, ...queryFields } = req.query;

  if (!validateToken(token)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    let contentChanges = {};
    
    if (changes) {
      try {
        contentChanges = JSON.parse(changes);
      } catch {
        return res.status(400).json({ error: 'Недопустимый формат изменений' });
      }
    } else {
      for (const [key, value] of Object.entries(queryFields)) {
        if (key !== 'token') {
          contentChanges[key] = value;
        }
      }
    }

    const db = readDb();
    const sanitizedPreview = sanitizeObject({ ...db.content, ...contentChanges });
    
    res.json({
      success: true,
      preview: sanitizedPreview,
      appliedChanges: Object.keys(contentChanges)
    });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось создать превью' });
  }
});

app.post('/api/calculate', (req, res) => {
  try {
    const { fencePrice, length, height, paintMultiplier, addons, delivery } = req.body;

    if (!fencePrice || !length || length <= 0) {
      return res.status(400).json({ error: 'Укажите цену и длину забора' });
    }

    const heightOptions = defaultDb.content.calc_heights || [];
    const heightOpt = heightOptions.find(h => h.value === height);
    const hm = heightOpt ? heightOpt.multiplier : (height && height > 0 ? height : 1.0);
    const pm = paintMultiplier || 1.0;
    const fenceCost = length * fencePrice * hm * pm;
    const addonsCost = Array.isArray(addons) ? addons.reduce((sum, a) => sum + (a.price || 0), 0) : 0;
    const deliveryCost = delivery ? defaultDb.content.calc_delivery_fee || 5000 : 0;
    let subtotal = fenceCost + addonsCost + deliveryCost;

    const area = length * (heightOpt ? heightOpt.value : (height || 2));
    let discount = 0;
    const threshold = defaultDb.content.calc_discount_threshold || 100;
    const discountPercent = defaultDb.content.calc_discount_percent || 5;
    if (area > threshold) {
      discount = subtotal * (discountPercent / 100);
      subtotal -= discount;
    }

    res.json({
      success: true,
      fenceCost: Math.round(fenceCost),
      addonsCost: Math.round(addonsCost),
      deliveryCost: Math.round(deliveryCost),
      discount: Math.round(discount),
      discountPercent: discount > 0 ? discountPercent : 0,
      total: Math.round(subtotal),
      area: Math.round(area * 100) / 100
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка расчёта' });
  }
});

// ==================== ROUTING FIX ====================
// GET / : Serve Landing Page (public/index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /admin : Serve Admin Dashboard (login protected via client-side)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// GET /admin/plan : Serve Development Plan Viewer
app.get('/admin/plan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-plan.html'));
});

// 404 handler for unknown routes
app.use((req, res) => {
  logToFile(`404: ${req.method} ${req.url}`);
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html')) || res.status(404).json({ error: 'Страница не найдена' });
});

// Global error handler
app.use((err, req, res, next) => {
  logToFile(`500 ERROR: ${err.message}`);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

function startServer() {
  initDb();
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  🚀 Сервер запущен!                        ║
║                                            ║
║  🌐 Сайт:     http://localhost:${PORT}       ║
║  🔧 Админка:  http://localhost:${PORT}/admin ║
║  📋 План:     http://localhost:${PORT}/admin/plan ║
║  🔑 Пароль:   ${ADMIN_PASSWORD}                 ║
║  💾 База:     db.json                       ║
╚════════════════════════════════════════════╝
  `);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, initDb, readDb, writeDb, backupDb, validateDb, generateToken, validateToken, sanitizeInput, sanitizeObject, resetRateLimits, defaultDb, ADMIN_PASSWORD, ADMIN_TOKEN_SECRET, DB_FILE };
