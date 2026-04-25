const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('glamora.db');

db.all('SELECT * FROM users', [], (err, rows) => {
    console.log('USERS:', rows);
    db.all('SELECT * FROM cart_items', [], (err, rows) => {
        console.log('CART_ITEMS:', rows);
        db.all('SELECT * FROM orders', [], (err, rows) => {
            console.log('ORDERS:', rows);
            db.close();
        });
    });
});
