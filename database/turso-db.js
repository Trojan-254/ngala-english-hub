/*
* TURSO DATABASE
*/
const { createClient } = require('@libsql/client');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

let db = null;

async function getDb() {
  if (db) return db;

  // Check if we're in production (Render) with Turso
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // Production: Use Turso
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    console.log('Connected to Turso database (Production)');
    
    // Test connection
    try {
      await db.execute('SELECT 1');
      console.log('Turso connection verified');
    } catch (err) {
      console.error('Turso connection failed:', err.message);
    }
  } else {
    // Development: Use local SQLite
    const localDbPath = path.join(__dirname, '..', 'ngala.db');
    const sqlite3 = require('better-sqlite3');
    db = sqlite3(localDbPath);
    console.log('Connected to local SQLite (Development):', localDbPath);
  }
  
  return db;
}

// Helper function to run queries (adapts to both database types)
async function runQuery(sql, params = []) {
  const database = await getDb();
  
  // Check if it's a SELECT query
  const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
  
  if (process.env.TURSO_DATABASE_URL) {
    // Turso version
    if (isSelect) {
      const result = await database.execute({ sql, args: params });
      return result.rows;
    } else {
      const result = await database.execute({ sql, args: params });
      return { changes: result.rowsAffected, lastInsertRowid: result.lastInsertRowid };
    }
  } else {
    // Local SQLite version (better-sqlite3)
    if (isSelect) {
      return database.prepare(sql).all(...params);
    } else {
      const stmt = database.prepare(sql);
      const result = stmt.run(...params);
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    }
  }
}

// For prepared statements 
class TursoStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
  }
  
  run(...params) {
    return this.db.execute({ sql: this.sql, args: params });
  }
  
  get(...params) {
    return this.db.execute({ sql: this.sql, args: params }).then(r => r.rows[0]);
  }
  
  all(...params) {
    return this.db.execute({ sql: this.sql, args: params }).then(r => r.rows);
  }
}

// Wrapper to make Turso work with your existing better-sqlite3 code
function getCompatibleDb() {
  if (process.env.TURSO_DATABASE_URL) {
    // Return a proxy that mimics better-sqlite3 interface
    const tursoDb = getDb();
    return {
      prepare: (sql) => {
        return {
          run: (...params) => tursoDb.then(db => db.execute({ sql, args: params })),
          get: (...params) => tursoDb.then(db => db.execute({ sql, args: params }).then(r => r.rows[0])),
          all: (...params) => tursoDb.then(db => db.execute({ sql, args: params }).then(r => r.rows)),
        };
      },
      transaction: (fn) => fn,
      pragma: (stmt) => console.log('Pragma skipped in Turso'),
    };
  } else {
    return require('./database');
  }
}

module.exports = { getDb, runQuery, getCompatibleDb };
