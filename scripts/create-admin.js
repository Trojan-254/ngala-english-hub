const { getDb } = require('../database/database');
const bcrypt = require('bcrypt');

const db = getDb();

const username = process.argv[2] || 'teacher';
const display_name = process.argv[3] || 'Teacher';
const password = process.argv[4] || 'teach1234';

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  console.log(`User "${username}" already exists. Nothing created.`);
  process.exit(0);
}

const password_hash = bcrypt.hashSync(password, 10);

const result = db.prepare(`
  INSERT INTO users (username, display_name, password_hash, role, class_group, curriculum)
  VALUES (?, ?, ?, 'teacher', NULL, NULL)
`).run(username, display_name, password_hash);

console.log('\nTeacher account created successfully:');
console.log(`  ID:           ${result.lastInsertRowid}`);
console.log(`  Username:     ${username}`);
console.log(`  Display name: ${display_name}`);
console.log(`  Password:     ${password}`);
console.log('\nHand these credentials to the cooperating teacher.');
console.log('They can log in at http://<server-ip>:5000\n');

