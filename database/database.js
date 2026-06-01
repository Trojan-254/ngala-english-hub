// database/database.js
const path = require('path');
require('dotenv').config();

let db = null;

async function initializeDatabase() {
  if (db) return db;
  
  // Check if we're using Turso (production)
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const { createClient } = require('@libsql/client');
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    console.log('✅ Using Turso database');
    
    // Initialize schema in Turso if needed
    const fs = require('fs');
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // Split schema by semicolons and execute
      const statements = schema.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        try {
          await db.execute(stmt);
        } catch (e) {
          if (!e.message.includes('already exists')) {
            console.log('Schema statement error (may be OK):', e.message);
          }
        }
      }
    }
  } else {
    // Use local better-sqlite3 for development
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const DB_PATH = path.join(__dirname, 'ngala.db');
    const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
    
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // Initialize schema if needed
    if (fs.existsSync(SCHEMA_PATH)) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      db.exec(schema);
    }
    console.log('✅ Using local SQLite database');
  }
  
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

module.exports = { getDb, initializeDatabase };
