const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './techcare.db';
const db = new Database(dbPath, { verbose: console.log });

// Pragmas
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const initDb = () => {
    try {
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
        console.log('Database schema initialized.');
    } catch (err) {
        console.error('Failed to initialize database schema:', err);
    }
};

module.exports = {
    db,
    initDb
};
