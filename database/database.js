const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.NODE_ENV === 'production' ? '/var/data/ngala.db' : path.join(__dirname, 'ngala.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function splitSql(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prev = sql[i - 1];

    if (inString) {
      current += char;
      // End of string — but not an escaped quote or a doubled quote
      if (char === stringChar && prev !== '\\') {
        // Check next char — if also a quote, it's a doubled quote escape, stay in string
        if (sql[i + 1] === stringChar) {
          current += sql[i + 1];
          i++; // skip next quote
        } else {
          inString = false;
        }
      }
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === '-' && sql[i + 1] === '-') {
        // Line comment — skip to end of line
        while (i < sql.length && sql[i] !== '\n') i++;
        current += '\n';
      } else if (char === '/' && sql[i + 1] === '*') {
        // Block comment — skip to */
        i += 2;
        while (i < sql.length - 1 && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
        i += 2;
      } else if (char === ';') {
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          statements.push(trimmed);
        }
        current = '';
      } else {
        current += char;
      }
    }
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed);

  return statements;
}

function getDb() {
  if (db) return db;

  db = new Database(DB_PATH, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null
  });

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -16000');
  db.pragma('temp_store = MEMORY');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const statements = splitSql(schema);

  const runAll = db.transaction(() => {
    statements.forEach((stmt, i) => {
      try {
        db.exec(stmt + ';');
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.error(`Error at statement ${i + 1}:`, e.message);
          console.error('Statement:', stmt.substring(0, 120));
          throw e;
        }
      }
    });
  });

  runAll();
  console.log('Database ready:', DB_PATH);
  return db;
}

module.exports = { getDb };
