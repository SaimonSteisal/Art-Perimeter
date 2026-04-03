const Database = require('better-sqlite3');
const db = new Database('./data/artperimetr.db');
console.log('Пользователи:', db.prepare('SELECT id, username, role FROM users').all());
db.close();
