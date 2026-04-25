const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('glamora.db');

const updates = [
    { old: 'Hair & bdy care', new: 'Hair & body care' }
];

db.serialize(() => {
    updates.forEach(update => {
        db.run('UPDATE custom_products SET category = ? WHERE category = ?', [update.new, update.old], function(err) {
            if (err) console.error(err);
            else console.log(`Updated custom_products: ${update.old} -> ${update.new} (Changes: ${this.changes})`);
        });

        db.run('UPDATE static_products SET category = ? WHERE category = ?', [update.new, update.old], function(err) {
            if (err) console.error(err);
            else console.log(`Updated static_products: ${update.old} -> ${update.new} (Changes: ${this.changes})`);
        });
    });
});

db.close(() => {
    console.log('Database connection closed.');
});
