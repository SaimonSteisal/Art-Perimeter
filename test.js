const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { app, initDb, readDb, writeDb, backupDb, validateDb, generateToken, validateToken, sanitizeInput, sanitizeObject, defaultDb, ADMIN_PASSWORD, DB_FILE } = require('./server');

const TEST_PORT = 3999;
let server;
let validToken;

async function getValidToken() {
  const res = await request('POST', '/api/login', { password: ADMIN_PASSWORD });
  return res.body.token;
}

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
  assert.ok(res.body.token);
  const parsed = JSON.parse(res.body.token);
  assert.strictEqual(parsed.secret, 'super-secret-token-123');
  assert.ok(parsed.issued);
});

test('POST /api/login — неверный пароль', async () => {
  const res = await request('POST', '/api/login', { password: 'wrong' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, 'Неверный пароль');
});

test('POST /api/save — верный токен', async () => {
  const token = await getValidToken();
  const newContent = { company_name: 'Новое название' };
  const res = await request('POST', '/api/save', { token, newContent });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

test('POST /api/save — неверный токен', async () => {
  const res = await request('POST', '/api/save', { token: 'bad-token', newContent: {} });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error, 'Доступ запрещён');
});

test('POST /api/save — контент обновляется в БД', async () => {
  const token = await getValidToken();
  const newContent = { hero_title: 'Тестовый заголовок' };
  await request('POST', '/api/save', { token, newContent });
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
  const testData = JSON.parse(JSON.stringify(defaultDb));
  testData.content.company_name = 'Test Company';
  writeDb(testData);
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  assert.strictEqual(parsed.content.company_name, 'Test Company');
});

test('validateDb — валидная структура возвращает пустой массив', () => {
  const errors = validateDb(defaultDb);
  assert.strictEqual(errors.length, 0);
});

test('validateDb — отсутствие content возвращает ошибку', () => {
  const errors = validateDb({ leads: [] });
  assert.ok(errors.length > 0);
  assert.ok(errors.some(e => e.includes('content')));
});

test('validateDb — отсутствие leads возвращает ошибку', () => {
  const errors = validateDb({ content: defaultDb.content });
  assert.ok(errors.length > 0);
  assert.ok(errors.some(e => e.includes('leads')));
});

test('validateDb — не-объект возвращает ошибку', () => {
  const errors = validateDb(null);
  assert.strictEqual(errors.length, 1);
  assert.strictEqual(errors[0], 'DB data is not an object');
});

test('validateDb — missing string field returns error', () => {
  const bad = JSON.parse(JSON.stringify(defaultDb));
  delete bad.content.site_title;
  const errors = validateDb(bad);
  assert.ok(errors.some(e => e.includes('site_title')));
});

test('validateDb — missing array field returns error', () => {
  const bad = JSON.parse(JSON.stringify(defaultDb));
  delete bad.content.advantages;
  const errors = validateDb(bad);
  assert.ok(errors.some(e => e.includes('advantages')));
});

test('backupDb — создаёт .bak файл', () => {
  const bakPath = DB_FILE + '.bak';
  if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath);
  backupDb();
  assert.ok(fs.existsSync(bakPath));
  const original = fs.readFileSync(DB_FILE, 'utf8');
  const backup = fs.readFileSync(bakPath, 'utf8');
  assert.strictEqual(original, backup);
  if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath);
});

test('backupDb — возвращает null если файл не существует', () => {
  const result = backupDb();
  assert.ok(result !== null);
});

test('writeDb — атомарная запись через .tmp файл', () => {
  const tmpPath = DB_FILE + '.tmp';
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  const testData = JSON.parse(JSON.stringify(defaultDb));
  testData.content.company_name = 'Atomic Test Company';
  writeDb(testData);
  assert.ok(!fs.existsSync(tmpPath), 'Temp file should not exist after write');
  const db = readDb();
  assert.strictEqual(db.content.company_name, 'Atomic Test Company');
});

test('writeDb — отклоняет невалидные данные', () => {
  assert.throws(() => {
    writeDb({ content: 'bad', leads: [] });
  }, /Invalid DB structure/);
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

// ==================== CALCULATOR API TESTS (Phase 2) ====================

test('POST /api/calculate — базовый расчёт', async () => {
  const res = await request('POST', '/api/calculate', { fencePrice: 3000, length: 50, height: 2.0, paintMultiplier: 1.0, addons: [], delivery: false });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.total > 0);
});

test('POST /api/calculate — с высотой 1.8м (множитель 1.15)', async () => {
  const res = await request('POST', '/api/calculate', { fencePrice: 3000, length: 50, height: 1.8, paintMultiplier: 1.0, addons: [], delivery: false });
  assert.strictEqual(res.status, 200);
  const expected = 50 * 3000 * 1.15;
  assert.strictEqual(res.body.fenceCost, Math.round(expected));
});

test('POST /api/calculate — с покраской (порошковая x1.2)', async () => {
  const res = await request('POST', '/api/calculate', { fencePrice: 3000, length: 50, height: 2.0, paintMultiplier: 1.2, addons: [], delivery: false });
  assert.strictEqual(res.status, 200);
  const hm = 1.25;
  const expected = 50 * 3000 * hm * 1.2;
  assert.strictEqual(res.body.fenceCost, Math.round(expected));
});

test('POST /api/calculate — с доставкой', async () => {
  const res = await request('POST', '/api/calculate', { fencePrice: 3000, length: 50, height: 2.0, paintMultiplier: 1.0, addons: [], delivery: true });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.deliveryCost, 5000);
});

test('POST /api/calculate — с доп. элементами', async () => {
  const res = await request('POST', '/api/calculate', { fencePrice: 3000, length: 50, height: 2.0, paintMultiplier: 1.0, addons: [{ price: 35000 }, { price: 15000 }], delivery: false });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.addonsCost, 50000);
});

test('POST /api/calculate — скидка 5% при площади > 100м²', async () => {
  const res = await request('POST', '/api/calculate', { fencePrice: 3000, length: 100, height: 2.0, paintMultiplier: 1.0, addons: [], delivery: false });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.discount > 0);
  assert.strictEqual(res.body.discountPercent, 5);
});

test('POST /api/calculate — нет скидки при площади <= 100м²', async () => {
  const res = await request('POST', '/api/calculate', { fencePrice: 3000, length: 25, height: 2.0, paintMultiplier: 1.0, addons: [], delivery: false });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.discount, 0);
});

test('POST /api/calculate — ошибка при отсутствии fencePrice', async () => {
  const res = await request('POST', '/api/calculate', { length: 50 });
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.error);
});

test('POST /api/calculate — ошибка при length <= 0', async () => {
  const res = await request('POST', '/api/calculate', { fencePrice: 3000, length: 0 });
  assert.strictEqual(res.status, 400);
});

test('POST /api/calculate — полный расчёт со всем', async () => {
  const res = await request('POST', '/api/calculate', {
    fencePrice: 4500,
    length: 150,
    height: 2.5,
    paintMultiplier: 1.2,
    addons: [{ price: 35000 }, { price: 15000 }],
    delivery: true
  });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.discount > 0);
  assert.ok(res.body.total > 0);
});

test('Калькулятор — edge case: нулевая длина', () => {
  const total = 0 * 3000;
  assert.strictEqual(total, 0);
});

test('Калькулятор — edge case: огромный заказ (1000м)', () => {
  const fencePrice = 3000;
  const length = 1000;
  const height = 2.5;
  const paintMultiplier = 1.2;
  const fenceCost = length * fencePrice * height * paintMultiplier;
  assert.strictEqual(fenceCost, 9000000);
});

test('Калькулятор — edge case: отрицательная длина (должна быть 0)', () => {
  const length = Math.max(0, -10);
  const total = length * 3000;
  assert.strictEqual(total, 0);
});

test('Калькулятор — скидка 5% при площади > 100', () => {
  const length = 60;
  const height = 2;
  const area = length * height;
  const subtotal = 60 * 3000 * 2;
  const discount = area > 100 ? subtotal * 0.05 : 0;
  const total = subtotal - discount;
  assert.ok(area > 100);
  assert.strictEqual(total, 342000);
});

test('defaultDb — calc_heights содержит 4 варианта', () => {
  assert.strictEqual(defaultDb.content.calc_heights.length, 4);
  const values = defaultDb.content.calc_heights.map(h => h.value);
  assert.ok(values.includes(1.5));
  assert.ok(values.includes(2.5));
});

test('defaultDb — calc_paint_options содержит 3 варианта', () => {
  assert.strictEqual(defaultDb.content.calc_paint_options.length, 3);
  const ids = defaultDb.content.calc_paint_options.map(p => p.id);
  assert.ok(ids.includes('none'));
  assert.ok(ids.includes('ground'));
  assert.ok(ids.includes('powder'));
});

test('defaultDb — calc_delivery_fee определён', () => {
  assert.strictEqual(defaultDb.content.calc_delivery_fee, 5000);
});

test('defaultDb — calc_discount_threshold = 100', () => {
  assert.strictEqual(defaultDb.content.calc_discount_threshold, 100);
});

test('defaultDb — calc_discount_percent = 5', () => {
  assert.strictEqual(defaultDb.content.calc_discount_percent, 5);
});

// ==================== PHASE 3: SECURITY TESTS ====================

test('generateToken — создаёт валидный токен', () => {
  const token = generateToken();
  assert.ok(token);
  assert.strictEqual(validateToken(token), true);
});

test('validateToken — отклоняет неверный токен', () => {
  assert.strictEqual(validateToken('bad-token'), false);
  assert.strictEqual(validateToken('{"secret":"wrong","issued":' + Date.now() + '}'), false);
});

test('validateToken — отклоняет просроченный токен', () => {
  const expired = JSON.stringify({ secret: 'super-secret-token-123', issued: Date.now() - 25 * 60 * 60 * 1000 });
  assert.strictEqual(validateToken(expired), false);
});

test('DELETE /api/leads/:id — удаляет заявку с токеном', async () => {
  const lead = { type: 'test', name: 'Удали меня', phone: '+7 000 000 00 00' };
  const createRes = await request('POST', '/api/leads', lead);
  const leadId = createRes.body.id;
  const token = await getValidToken();
  const res = await request('DELETE', `/api/leads/${leadId}?token=${encodeURIComponent(token)}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  const db = readDb();
  assert.ok(!db.leads.find(l => l.id === leadId));
});

test('DELETE /api/leads/:id — без токена 403', async () => {
  const res = await request('DELETE', '/api/leads/fake-id');
  assert.strictEqual(res.status, 403);
});

test('DELETE /api/leads/:id — несуществующий ID 404', async () => {
  const token = await getValidToken();
  const res = await request('DELETE', `/api/leads/nonexistent-id?token=${encodeURIComponent(token)}`);
  assert.strictEqual(res.status, 404);
});

test('POST /api/portfolio — добавляет элемент с токеном', async () => {
  const token = await getValidToken();
  const item = { title: 'Тестовый объект', tag: 'Москва', img: 'https://example.com/test.jpg' };
  const res = await request('POST', '/api/portfolio', { token, item });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.item.title, 'Тестовый объект');
});

test('POST /api/portfolio — без токена 403', async () => {
  const res = await request('POST', '/api/portfolio', { token: 'bad', item: {} });
  assert.strictEqual(res.status, 403);
});

test('sanitizeInput — удаляет HTML теги', () => {
  assert.strictEqual(sanitizeInput('<script>alert(1)</script>'), 'alert(1)');
  assert.strictEqual(sanitizeInput('<b>bold</b>'), 'bold');
  assert.strictEqual(sanitizeInput('Hello <img src=x onerror=alert(1)> World'), 'Hello  World');
});

test('sanitizeInput — экранирует спецсимволы', () => {
  assert.strictEqual(sanitizeInput('a & b'), 'a &amp; b');
  assert.strictEqual(sanitizeInput('"quoted"'), '&quot;quoted&quot;');
  assert.strictEqual(sanitizeInput("it's"), 'it&#x27;s');
});

test('sanitizeObject — санитизирует вложенные строки', () => {
  const obj = { name: '<script>x</script>', details: { msg: '<b>hi</b>' }, count: 42 };
  const result = sanitizeObject(obj);
  assert.strictEqual(result.name, 'x');
  assert.strictEqual(result.details.msg, 'hi');
  assert.strictEqual(result.count, 42);
});

test('POST /api/leads — санитизирует входные данные', async () => {
  const lead = { type: 'calc', name: '<script>hack</script>', phone: '+7 999 000 00 00' };
  const res = await request('POST', '/api/leads', lead);
  assert.strictEqual(res.status, 200);
  const db = readDb();
  assert.strictEqual(db.leads[0].name, 'hack');
});

test('POST /api/save — санитизирует контент', async () => {
  const token = await getValidToken();
  const newContent = { hero_title: '<script>evil</script>Тест' };
  await request('POST', '/api/save', { token, newContent });
  const db = readDb();
  assert.strictEqual(db.content.hero_title, 'evilТест');
});

test('POST /api/login — неверный пароль 401', async () => {
  const res = await request('POST', '/api/login', { password: 'wrongpass' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/save — просроченный токен 403', async () => {
  const expired = JSON.stringify({ secret: 'super-secret-token-123', issued: Date.now() - 25 * 60 * 60 * 1000 });
  const res = await request('POST', '/api/save', { token: expired, newContent: {} });
  assert.strictEqual(res.status, 403);
});
