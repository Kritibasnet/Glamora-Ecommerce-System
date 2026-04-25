const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('glamora.db');

db.run('INSERT INTO cart_items (user_id, product_id, count) VALUES (?, ?, ?)', [3, 2, 1], function (err) {
    if (err) console.error(err);
    else console.log('Added item 2 to cart for user 3');
    db.close();
});
