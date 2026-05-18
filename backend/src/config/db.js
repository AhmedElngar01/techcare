const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath = process.env.DB_PATH || './techcare.db';

// Vercel has a read-only filesystem. We must use /tmp for SQLite writes.
if (process.env.VERCEL) {
    const tmpPath = '/tmp/techcare.db';
    // If the database doesn't exist in /tmp yet, copy it from the root if it exists, or let it be created
    if (!fs.existsSync(tmpPath) && fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpPath);
    }
    dbPath = tmpPath;
}

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
