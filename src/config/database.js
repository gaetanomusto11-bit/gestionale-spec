import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;

export async function initializeDatabase() {
  try {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = await open({
      filename: path.join(dataDir, 'spec.db'),
      driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON;');

    console.log('✓ Database SQLite connesso: ' + path.join(dataDir, 'spec.db'));

    await initializeSchema();

    return db;
  } catch (error) {
    console.error('✗ Errore connessione database:', error);
    throw error;
  }
}

async function initializeSchema() {
  try {
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='contatti'"
    );

    if (!tableExists) {
      console.log('📝 Inizializzazione schema database...');

      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

      const sqliteSql = schemaSql
        .replace(/gen_random_uuid\(\)/g, "lower(hex(randomblob(16)))")
        .replace(/GENERATED ALWAYS AS.*STORED/g, '')
        .split(';')
        .filter(statement => statement.trim().length > 0 && !statement.includes('ON CONFLICT'));

      for (const statement of sqliteSql) {
        if (statement.trim()) {
          await db.exec(statement + ';');
        }
      }

      console.log('✓ Schema database inizializzato');
    }
  } catch (error) {
    console.error('✗ Errore inizializzazione schema:', error);
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database non inizializzato. Chiama initializeDatabase() prima.');
  }
  return db;
}

export async function queryOne(sql, params = []) {
  try {
    const database = getDatabase();
    return await database.get(sql, params);
  } catch (error) {
    console.error('Database query error:', error, { sql, params });
    throw error;
  }
}

export async function queryAll(sql, params = []) {
  try {
    const database = getDatabase();
    return await database.all(sql, params);
  } catch (error) {
    console.error('Database query error:', error, { sql, params });
    throw error;
  }
}

export async function execute(sql, params = []) {
  try {
    const database = getDatabase();
    const result = await database.run(sql, params);
    return {
      id: result.lastID,
      changes: result.changes,
      success: result.changes > 0
    };
  } catch (error) {
    console.error('Database execute error:', error, { sql, params });
    throw error;
  }
}

export async function transaction(callback) {
  try {
    const database = getDatabase();
    await database.exec('BEGIN TRANSACTION;');

    try {
      const result = await callback(database);
      await database.exec('COMMIT;');
      return result;
    } catch (error) {
      await database.exec('ROLLBACK;');
      throw error;
    }
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    console.log('✓ Database chiuso');
  }
}

export default {
  initializeDatabase,
  getDatabase,
  queryOne,
  queryAll,
  execute,
  transaction,
  closeDatabase
};