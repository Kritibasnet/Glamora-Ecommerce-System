const sqlite3 = require('sqlite3').verbose();
const dbPath = 'c:/react-cosmetic-store-master/glamora.db';
const db = new sqlite3.Database(dbPath);

db.all('PRAGMA table_info(orders)', (err, rows) => {
    if (err) {
        console.error('Error fetching table info:', err);
        process.exit(1);
    }

    if (!rows || rows.length === 0) {
        console.error('No table "orders" found or no columns returned.');
        process.exit(1);
    }

    const cols = rows.map(r => r.name);
    console.log('Current columns:', cols);

    if (!cols.includes('refund_status')) {
        console.log('Adding refund_status...');
        db.run("ALTER TABLE orders ADD COLUMN refund_status TEXT DEFAULT 'none'");
    }
    if (!cols.includes('refund_reason')) {
        console.log('Adding refund_reason...');
        db.run("ALTER TABLE orders ADD COLUMN refund_reason TEXT");
    }
    if (!cols.includes('refund_amount')) {
        console.log('Adding refund_amount...');
        db.run("ALTER TABLE orders ADD COLUMN refund_amount REAL DEFAULT 0");
    }

    console.log('Migration script finished.');
    setTimeout(() => db.close(), 1000);
});
