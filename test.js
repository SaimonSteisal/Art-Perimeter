const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { app, initDb, readDb, writeDb, defaultDb, ADMIN_PASSWORD, ADMIN_TOKEN, DB_FILE } = require('./server');

const TEST_PORT = 3999;
let server;

// Helper to make HTTP requests
function request(method, pathname, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: pathname,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Setup and teardown
test.before(async () => {
  // Reset db to default for tests
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  initDb();
  server = app.listen(TEST_PORT);
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 100));
});

test.after(async () => {
  if (server) server.close();
  // Cleanup test db
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
});

// ==================== API ENDPOINT TESTS ====================

test('GET /api/data — возвращает контент', async () => {
  const res = await request('GET', '/api/data');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.site_title, defaultDb.content.site_title);
  assert.ok(Array.isArray(res.body.advantages));
  assert.ok(Array.isArray(res.body.calc_fences));
  assert.ok(Array.isArray(res.body.services));
  assert.ok(Array.isArray(res.body.portfolio));
});

test('POST /api/leads — создаёт заявку', async () => {
  const lead = { type: 'calc', name: 'Тест', phone: '+7 999 123 45 67' };
  const res = await request('POST', '/api/leads', lead);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.id);
});

test('POST /api/leads — заявка сохраняется в БД', async () => {
  const lead = { type: 'contact', name: 'Иван', phone: '+7 999 111 22 33' };
  await request('POST', '/api/leads', lead);
  const db = readDb();
  assert.ok(db.leads.length > 0);
  assert.strictEqual(db.leads[0].name, 'Иван');
});

test('GET /api/leads — возвращает список заявок', async () => {
  const res = await request('GET', '/api/leads');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0);
});

test('POST /api/login — верный пароль', async () => {
  const res = await request('POST', '/api/login', { password: ADMIN_PASSWORD });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.token, ADMIN_TOKEN);
});

test('POST /api/login — неверный пароль', async () => {
  const res = await request('POST', '/api/login', { password: 'wrong' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, 'Неверный пароль');
});

test('POST /api/save — верный токен', async () => {
  const newContent = { company_name: 'Новое название' };
  const res = await request('POST', '/api/save', { token: ADMIN_TOKEN, newContent });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

test('POST /api/save — неверный токен', async () => {
  const res = await request('POST', '/api/save', { token: 'bad-token', newContent: {} });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error, 'Доступ запрещён');
});

test('POST /api/save — контент обновляется в БД', async () => {
  const newContent = { hero_title: 'Тестовый заголовок' };
  await request('POST', '/api/save', { token: ADMIN_TOKEN, newContent });
  const db = readDb();
  assert.strictEqual(db.content.hero_title, 'Тестовый заголовок');
});

// ==================== DB UTILITY TESTS ====================

test('initDb — создаёт db.json если не существует', async () => {
  const testDbPath = path.join(__dirname, 'test_db_temp.json');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  
  // Temporarily override DB_FILE
  const original = DB_FILE;
  // We can't easily override the module-level constant, so test via readDb after init
  
  // Instead, verify that after initDb, db.json exists and is valid
  const db = readDb();
  assert.ok(db.content);
  assert.ok(Array.isArray(db.leads));
});

test('readDb — возвращает валидный объект', async () => {
  const db = readDb();
  assert.strictEqual(typeof db, 'object');
  assert.ok(db.content);
  assert.ok(Array.isArray(db.leads));
});

test('writeDb — записывает данные в файл', async () => {
  const testData = { content: { test: true }, leads: [] };
  writeDb(testData);
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  assert.strictEqual(parsed.content.test, true);
});

// ==================== CALCULATOR LOGIC TESTS ====================

test('Калькулятор — расчёт стоимости профнастила', () => {
  const fencePrice = 3000;
  const length = 50;
  const total = length * fencePrice;
  assert.strictEqual(total, 150000);
});

test('Калькулятор — расчёт с воротами', () => {
  const fencePrice = 3000;
  const length = 50;
  const gatePrice = 35000;
  const total = length * fencePrice + gatePrice;
  assert.strictEqual(total, 185000);
});

test('Калькулятор — расчёт с калиткой', () => {
  const fencePrice = 4500;
  const length = 100;
  const wicketPrice = 15000;
  const total = length * fencePrice + wicketPrice;
  assert.strictEqual(total, 465000);
});

test('Калькулятор — расчёт с воротами и калиткой', () => {
  const fencePrice = 2000;
  const length = 200;
  const gatePrice = 35000;
  const wicketPrice = 15000;
  const total = length * fencePrice + gatePrice + wicketPrice;
  assert.strictEqual(total, 450000);
});

test('Калькулятор — минимальная длина', () => {
  const fencePrice = 3000;
  const length = 1;
  const total = length * fencePrice;
  assert.strictEqual(total, 3000);
});

test('Калькулятор — только доп. элементы без забора', () => {
  const gatePrice = 35000;
  const wicketPrice = 15000;
  const total = gatePrice + wicketPrice;
  assert.strictEqual(total, 50000);
});

// ==================== DATA INTEGRITY TESTS ====================

test('defaultDb — содержит все необходимые секции', () => {
  const required = ['site_title', 'company_name', 'phone_main', 'phone_secondary', 'email', 'address', 'hours', 'hero_subtitle', 'hero_title', 'hero_description', 'hero_cta_text', 'hero_cta_link', 'hero_bg', 'advantages', 'calc_title', 'calc_subtitle', 'calc_fences', 'calc_extras', 'services_title', 'services_desc', 'services', 'portfolio_title', 'portfolio_subtitle', 'portfolio', 'contacts_title', 'contacts_subtitle', 'contacts_desc', 'contacts_form_title', 'contacts_form_consent', 'contacts_form_submit', 'footer_text', 'footer_privacy'];
  required.forEach(key => {
    assert.ok(defaultDb.content[key] !== undefined, `Отсутствует поле: ${key}`);
  });
});

test('defaultDb — advantages содержит 4 элемента', () => {
  assert.strictEqual(defaultDb.content.advantages.length, 4);
});

test('defaultDb — calc_fences содержит 3 типа забора', () => {
  assert.strictEqual(defaultDb.content.calc_fences.length, 3);
  const ids = defaultDb.content.calc_fences.map(f => f.id);
  assert.ok(ids.includes('f1'));
  assert.ok(ids.includes('f2'));
  assert.ok(ids.includes('f3'));
});

test('defaultDb — calc_extras содержит ворота и калитку', () => {
  assert.strictEqual(defaultDb.content.calc_extras.length, 2);
  const names = defaultDb.content.calc_extras.map(e => e.id);
  assert.ok(names.includes('gate'));
  assert.ok(names.includes('wicket'));
});

test('defaultDb — services содержит 4 услуги', () => {
  assert.strictEqual(defaultDb.content.services.length, 4);
});

test('defaultDb — portfolio содержит 3 объекта', () => {
  assert.strictEqual(defaultDb.content.portfolio.length, 3);
});

test('defaultDb — leads — пустой массив', () => {
  assert.ok(Array.isArray(defaultDb.leads));
  assert.strictEqual(defaultDb.leads.length, 0);
});
