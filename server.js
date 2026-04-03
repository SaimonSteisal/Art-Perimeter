/**
 * Арт Периметр - Масштабированный сервер
 * Версия: 2.0.0
 * 
 * Особенности:
 * - SQLite база данных вместо JSON
 * - JWT аутентификация
 * - Hash паролей (bcrypt)
 * - Rate limiting
 * - Helmet security headers
 * - Загрузка файлов (multer)
 * - Валидация данных (express-validator)
 * - Email уведомления
 * - Telegram уведомления
 * - Логирование
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

const config = {
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  dbPath: process.env.DB_PATH || './data/artperimetr.db',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Арт Периметр <noreply@artperimetr.ru>',
    to: process.env.EMAIL_TO || 'admin@artperimetr.ru'
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || ''
  }
};

// ============================================
// БЕЗОПАСНОСТЬ
// ============================================

// Helmet - заголовки безопасности
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: NODE_ENV === 'production' ? ['https://artperimetr.ru'] : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Слишком много запросов, попробуйте позже' },
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Слишком много попыток входа' }
});

app.use('/api/', limiter);
app.use('/api/login', strictLimiter);

// ============================================
// ЗАГРУЗКА ФАЙЛОВ
// ============================================

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(config.uploadDir, 'images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter
});

// ============================================
// БАЗА ДАННЫХ (SQLite)
// ============================================

let db;

function initDatabase() {
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');

  // Таблица пользователей
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица заявок
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      message TEXT,
      service_type TEXT,
      status TEXT DEFAULT 'new',
      source TEXT DEFAULT 'website',
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица контента сайта
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица портфолио
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      tag TEXT,
      image_url TEXT,
      category TEXT,
      order_index INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица услуг
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price_from REAL,
      image_url TEXT,
      order_index INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица отзывов
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_name TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      text TEXT NOT NULL,
      is_published INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица логов действий
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Создаем администратора по умолчанию
  const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  if (!existingUser) {
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
      'admin',
      passwordHash,
      'admin'
    );
    console.log('✅ Пользователь admin создан');
  }

  // Инициализация контента по умолчанию
  initializeDefaultContent();

  console.log('✅ База данных SQLite инициализирована');
}

function initializeDefaultContent() {
  const defaultContent = {
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
    advantages: JSON.stringify([
      { icon: '🛡️', title: 'Работа по договору', desc: 'Фиксируем стоимость и сроки. Никаких скрытых платежей.' },
      { icon: '🏭', title: 'Собственный цех', desc: 'Изготавливаем конструкции сами, без посредников.' },
      { icon: '⏱️', title: 'Точно в срок', desc: 'Бригады с опытом от 7 лет. Монтаж за 1-2 дня.' },
      { icon: '✅', title: 'Гарантия 2 года', desc: 'Мы уверены в качестве, поэтому даём честную гарантию.' }
    ]),
    footer_text: '© 2025 Арт Периметр. Все права защищены.',
    footer_privacy: '/privacy-policy'
  };

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO site_content (key, value, type, updated_at) 
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);

  for (const [key, value] of Object.entries(defaultContent)) {
    insertStmt.run(key, String(value), typeof value === 'object' ? 'json' : 'string');
  }
}

function getContentValue(key, defaultValue = null) {
  const row = db.prepare('SELECT value, type FROM site_content WHERE key = ?').get(key);
  if (!row) return defaultValue;
  
  if (row.type === 'json') {
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }
  return row.value;
}

function setContentValue(key, value, type = 'string') {
  db.prepare(`
    INSERT OR REPLACE INTO site_content (key, value, type, updated_at) 
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(key, typeof value === 'object' ? JSON.stringify(value) : String(value), type);
}

function logActivity(userId, action, entityType = null, entityId = null, details = null, ipAddress = null) {
  db.prepare(`
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress);
}

// ============================================
// EMAIL УВЕДОМЛЕНИЯ
// ============================================

let emailTransporter = null;

function initEmailTransporter() {
  if (!config.email.user || !config.email.pass) {
    console.log('⚠️ Email уведомления не настроены');
    return;
  }

  emailTransporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });

  console.log('✅ Email транспортер инициализирован');
}

async function sendNewLeadEmail(lead) {
  if (!emailTransporter) {
    console.log('⚠️ Email не отправлен: транспортер не настроен');
    return false;
  }

  const mailOptions = {
    from: config.email.from,
    to: config.email.to,
    subject: `📩 Новая заявка от ${lead.name}`,
    html: `
      <h2>Новая заявка с сайта</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Имя:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Телефон:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.phone}</td></tr>
        ${lead.email ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.email}</td></tr>` : ''}
        ${lead.message ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Сообщение:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.message}</td></tr>` : ''}
        ${lead.service_type ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Услуга:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.service_type}</td></tr>` : ''}
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Дата:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString('ru-RU')}</td></tr>
      </table>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">Заявка отправлена с сайта Арт Периметр</p>
    `
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email отправлен на ${config.email.to}`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error.message);
    return false;
  }
}

// ============================================
// TELEGRAM УВЕДОМЛЕНИЯ
// ============================================

async function sendTelegramNotification(lead) {
  if (!config.telegram.botToken || !config.telegram.chatId) {
    console.log('⚠️ Telegram уведомление не отправлено: не настроен');
    return false;
  }

  const message = `
📩 *Новая заявка с сайта*

👤 *Имя:* ${lead.name}
📞 *Телефон:* ${lead.phone}
${lead.email ? `📧 *Email:* ${lead.email}` : ''}
${lead.message ? `💬 *Сообщение:* ${lead.message}` : ''}
${lead.service_type ? `🔧 *Услуга:* ${lead.service_type}` : ''}

🕒 *Дата:* ${new Date().toLocaleString('ru-RU')}
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegram.chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Telegram уведомление отправлено');
      return true;
    } else {
      console.error('❌ Telegram API ошибка:', result.description);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка отправки Telegram:', error.message);
    return false;
  }
}

// ============================================
// MIDDLEWARE
// ============================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Неверный или истекший токен' });
    }
    req.user = user;
    next();
  });
}

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}

app.use(requestLogger);

// Парсинг JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// API ROUTES
// ============================================

app.get('/api/data', (req, res) => {
  try {
    const content = {};
    
    const rows = db.prepare('SELECT key, value, type FROM site_content').all();
    rows.forEach(row => {
      if (row.type === 'json') {
        try {
          content[row.key] = JSON.parse(row.value);
        } catch {
          content[row.key] = row.value;
        }
      } else {
        content[row.key] = row.value;
      }
    });

    content.services = db.prepare(`
      SELECT id, title, description, price_from, image_url, order_index 
      FROM services 
      WHERE is_published = 1 
      ORDER BY order_index ASC
    `).all();

    content.portfolio = db.prepare(`
      SELECT id, title, description, tag, image_url, category 
      FROM portfolio 
      WHERE is_published = 1 
      ORDER BY order_index ASC
    `).all();

    content.reviews = db.prepare(`
      SELECT id, author_name, rating, text, created_at 
      FROM reviews 
      WHERE is_published = 1 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    res.json(content);
  } catch (error) {
    console.error('Ошибка получения данных:', error);
    res.status(500).json({ error: 'Не удалось получить данные' });
  }
});

app.post('/api/leads', [
  body('name').trim().notEmpty().withMessage('Введите имя'),
  body('phone').trim().notEmpty().withMessage('Введите телефон'),
  body('email').optional().isEmail().normalizeEmail(),
  body('message').optional().trim(),
  body('service_type').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, message, service_type } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';

    const stmt = db.prepare(`
      INSERT INTO leads (name, phone, email, message, service_type, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, phone, email || null, message || null, service_type || null, ipAddress, userAgent);

    const newLead = {
      id: result.lastInsertRowid.toString(),
      name,
      phone,
      email,
      message,
      service_type,
      status: 'new',
      date: new Date().toLocaleString('ru-RU')
    };

    console.log(`📩 Новая заявка: ${name} (${phone})`);

    Promise.all([
      sendNewLeadEmail(newLead),
      sendTelegramNotification(newLead)
    ]).catch(err => console.error('Ошибка отправки уведомлений:', err));

    res.json({ success: true, id: newLead.id });
  } catch (error) {
    console.error('Ошибка создания заявки:', error);
    res.status(500).json({ error: 'Не удалось создать заявку' });
  }
});

app.post('/api/login', [
  body('username').optional().trim(),
  body('password')
    .exists({ checkFalsy: false }).withMessage('Пароль обязателен')
    .isString().withMessage('Пароль должен быть строкой')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Ошибки валидации:', errors.array());
      console.log('Полученные данные:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    const { username = 'admin', password } = req.body;
    
    console.log('Попытка входа пользователя:', username);

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      logActivity(null, 'LOGIN_FAILED', 'user', null, { username }, req.ip);
      return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    logActivity(user.id, 'LOGIN_SUCCESS', 'user', user.id, null, req.ip);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
});

app.post('/api/save', authenticateToken, [
  body('updates').isObject().withMessage('Поле updates должно быть объектом')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { updates } = req.body;
    const allowedFields = [
      'site_title', 'company_name', 'email', 'phone_main', 'phone_secondary',
      'address', 'hours', 'hero_subtitle', 'hero_title',
      'hero_description', 'hero_cta_text', 'hero_cta_link', 'hero_bg',
      'advantages', 'calc_title', 'calc_subtitle',
      'services_title', 'services_desc', 'portfolio_title', 'portfolio_subtitle',
      'contacts_title', 'contacts_subtitle', 'contacts_desc',
      'contacts_form_title', 'contacts_form_consent', 'contacts_form_submit',
      'footer_text', 'footer_privacy'
    ];

    let updatedCount = 0;
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        const type = typeof value === 'object' ? 'json' : 'string';
        setContentValue(key, value, type);
        updatedCount++;
      }
    }

    logActivity(req.user.id, 'CONTENT_UPDATE', 'site_content', null, { updatedFields: Object.keys(updates) }, req.ip);

    console.log(`✅ Контент обновлён: ${updatedCount} полей`);
    res.json({ success: true, updatedCount });
  } catch (error) {
    console.error('Ошибка сохранения контента:', error);
    res.status(500).json({ error: 'Не удалось сохранить изменения' });
  }
});

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;
    
    logActivity(req.user.id, 'FILE_UPLOAD', 'file', null, { filename: req.file.filename }, req.ip);

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

app.get('/api/leads', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM leads';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const leads = db.prepare(query).all(...params);
    
    const totalQuery = status 
      ? 'SELECT COUNT(*) as count FROM leads WHERE status = ?'
      : 'SELECT COUNT(*) as count FROM leads';
    const total = db.prepare(totalQuery).get(status || []).count;

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Ошибка получения заявок:', error);
    res.status(500).json({ error: 'Не удалось получить заявки' });
  }
});

app.put('/api/leads/:id', authenticateToken, [
  body('status').isIn(['new', 'contacted', 'in_progress', 'completed', 'cancelled']).withMessage('Неверный статус')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = db.prepare(`
      UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    logActivity(req.user.id, 'LEAD_STATUS_UPDATE', 'lead', id, { status }, req.ip);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления заявки:', error);
    res.status(500).json({ error: 'Не удалось обновить заявку' });
  }
});

app.get('/api/portfolio', authenticateToken, (req, res) => {
  try {
    const portfolio = db.prepare('SELECT * FROM portfolio ORDER BY order_index ASC').all();
    res.json(portfolio);
  } catch (error) {
    console.error('Ошибка получения портфолио:', error);
    res.status(500).json({ error: 'Не удалось получить портфолио' });
  }
});

app.post('/api/portfolio', authenticateToken, [
  body('title').trim().notEmpty().withMessage('Введите название'),
  body('image_url').trim().notEmpty().withMessage('Введите URL изображения')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, tag, image_url, category, order_index = 0, is_published = 1 } = req.body;

    const result = db.prepare(`
      INSERT INTO portfolio (title, description, tag, image_url, category, order_index, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || null, tag || null, image_url, category || null, order_index, is_published);

    logActivity(req.user.id, 'PORTFOLIO_CREATE', 'portfolio', result.lastInsertRowid, { title }, req.ip);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Ошибка создания элемента портфолио:', error);
    res.status(500).json({ error: 'Не удалось создать элемент портфолио' });
  }
});

app.put('/api/portfolio/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tag, image_url, category, order_index, is_published } = req.body;

    const result = db.prepare(`
      UPDATE portfolio SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        tag = COALESCE(?, tag),
        image_url = COALESCE(?, image_url),
        category = COALESCE(?, category),
        order_index = COALESCE(?, order_index),
        is_published = COALESCE(?, is_published),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, tag, image_url, category, order_index, is_published, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Элемент не найден' });
    }

    logActivity(req.user.id, 'PORTFOLIO_UPDATE', 'portfolio', id, { title }, req.ip);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления портфолио:', error);
    res.status(500).json({ error: 'Не удалось обновить элемент портфолио' });
  }
});

app.delete('/api/portfolio/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM portfolio WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Элемент не найден' });
    }

    logActivity(req.user.id, 'PORTFOLIO_DELETE', 'portfolio', id, null, req.ip);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления портфолио:', error);
    res.status(500).json({ error: 'Не удалось удалить элемент портфолио' });
  }
});

app.get('/api/services', authenticateToken, (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY order_index ASC').all();
    res.json(services);
  } catch (error) {
    console.error('Ошибка получения услуг:', error);
    res.status(500).json({ error: 'Не удалось получить услуги' });
  }
});

app.post('/api/services', authenticateToken, [
  body('title').trim().notEmpty().withMessage('Введите название услуги')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, price_from, image_url, order_index = 0, is_published = 1 } = req.body;

    const result = db.prepare(`
      INSERT INTO services (title, description, price_from, image_url, order_index, is_published)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, description || null, price_from || null, image_url || null, order_index, is_published);

    logActivity(req.user.id, 'SERVICE_CREATE', 'service', result.lastInsertRowid, { title }, req.ip);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Ошибка создания услуги:', error);
    res.status(500).json({ error: 'Не удалось создать услугу' });
  }
});

app.put('/api/services/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price_from, image_url, order_index, is_published } = req.body;

    const result = db.prepare(`
      UPDATE services SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        price_from = COALESCE(?, price_from),
        image_url = COALESCE(?, image_url),
        order_index = COALESCE(?, order_index),
        is_published = COALESCE(?, is_published),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, price_from, image_url, order_index, is_published, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    logActivity(req.user.id, 'SERVICE_UPDATE', 'service', id, { title }, req.ip);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления услуги:', error);
    res.status(500).json({ error: 'Не удалось обновить услугу' });
  }
});

app.delete('/api/services/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM services WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    logActivity(req.user.id, 'SERVICE_DELETE', 'service', id, null, req.ip);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления услуги:', error);
    res.status(500).json({ error: 'Не удалось удалить услугу' });
  }
});

app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const stats = {
      leads: {
        total: db.prepare('SELECT COUNT(*) as count FROM leads').get().count,
        new: db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'new'").get().count,
        today: db.prepare("SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = DATE('now')").get().count
      },
      portfolio: {
        total: db.prepare('SELECT COUNT(*) as count FROM portfolio').get().count,
        published: db.prepare('SELECT COUNT(*) as count FROM portfolio WHERE is_published = 1').get().count
      },
      services: {
        total: db.prepare('SELECT COUNT(*) as count FROM services').get().count,
        published: db.prepare('SELECT COUNT(*) as count FROM services WHERE is_published = 1').get().count
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Не удалось получить статистику' });
  }
});

app.get('/api/logs', authenticateToken, (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = db.prepare(`
      SELECT * FROM activity_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error('Ошибка получения логов:', error);
    res.status(500).json({ error: 'Не удалось получить логи' });
  }
});

// ============================================
// СТАТИЧЕСКИЕ ФАЙЛЫ
// ============================================

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

initDatabase();
initEmailTransporter();

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🚀 Арт Периметр - Сервер v2.0                  ║
║                                                           ║
║  🌐 Сайт:         http://localhost:${PORT}                 ║
║  🔧 Админка:      http://localhost:${PORT}/admin.html      ║
║  💾 База данных:  ${config.dbPath}                        ║
║  📁 Загрузки:     ${config.uploadDir}                     ║
║  🔐 Режим:        ${NODE_ENV}                              ║
║                                                           ║
║  ✨ Новые возможности:                                    ║
║     • SQLite база данных                                  ║
║     • JWT аутентификация                                  ║
║     • Email & Telegram уведомления                        ║
║     • Загрузка изображений                                ║
║     • Расширенное логирование                             ║
║     • Rate limiting & Helmet security                     ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (db) db.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Closing server gracefully...');
  if (db) db.close();
  process.exit(0);
});
