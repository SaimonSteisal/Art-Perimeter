const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'db.json');
const ADMIN_PASSWORD = 'admin123';
const ADMIN_TOKEN = 'super-secret-token-123';

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
      { id: 'f1', name: 'Профнастил', price: 3000, img: 'https://images.pexels.com/photos/5570224/pexels-photo-5570224.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { id: 'f2', name: 'Евроштакетник', price: 4500, img: 'https://images.pexels.com/photos/5691613/pexels-photo-5691613.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { id: 'f3', name: '3D Сетка', price: 2000, img: 'https://images.pexels.com/photos/13880222/pexels-photo-13880222.jpeg?auto=compress&cs=tinysrgb&w=600' }
    ],
    calc_extras: [
      { id: 'gate', name: 'Ворота (Откатные)', price: 35000, img: 'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { id: 'wicket', name: 'Калитка', price: 15000, img: 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=600' }
    ],
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

function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    console.log('✅ db.json создан');
  }
}

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/data', (req, res) => {
  try {
    const db = readDb();
    res.json(db.content);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось прочитать данные' });
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
    const db = readDb();
    const newLead = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: new Date().toLocaleString('ru-RU'),
      ...req.body
    };
    db.leads.unshift(newLead);
    writeDb(db);
    console.log(`📩 Новая заявка: ${newLead.name} (${newLead.phone})`);
    res.json({ success: true, id: newLead.id });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось сохранить заявку' });
  }
});

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ success: false, message: 'Неверный пароль' });
  }
});

app.post('/api/save', (req, res) => {
  const { token, newContent } = req.body;

  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    const db = readDb();
    db.content = { ...db.content, ...newContent };
    writeDb(db);
    console.log('✅ Контент обновлён');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Не удалось сохранить изменения' });
  }
});

function startServer() {
  initDb();
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  🚀 Сервер запущен!                        ║
║                                            ║
║  🌐 Сайт:     http://localhost:${PORT}       ║
║  🔧 Админка:  http://localhost:${PORT}/admin.html ║
║  🔑 Пароль:   ${ADMIN_PASSWORD}                 ║
║  💾 База:     db.json                       ║
╚════════════════════════════════════════════╝
  `);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, initDb, readDb, writeDb, defaultDb, ADMIN_PASSWORD, ADMIN_TOKEN, DB_FILE };
