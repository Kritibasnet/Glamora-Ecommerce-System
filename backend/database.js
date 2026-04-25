const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'glamora.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Create users table with role
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      email_verified BOOLEAN DEFAULT 0,
      location TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table ready.');

            // Create default admin if not exists
            const adminEmail = 'admin@glamora.com';
            db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
                if (!row) {
                    const bcrypt = require('bcryptjs');
                    bcrypt.hash('default', 10, (err, hash) => {
                        if (!err) {
                            db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                                ['admin', adminEmail, hash, 'admin']);
                            console.log('Default admin account created.');
                        }
                    });
                }
            });

            // Check if role column exists (migration for existing db)
            db.all("PRAGMA table_info(users)", (err, rows) => {
                const hasRole = rows.some(r => r.name === 'role');
                if (!hasRole) {
                    db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (err) => {
                        if (err) console.error("Error adding role column:", err);
                        else console.log("Added role column to users table.");
                    });
                }

                const hasEmailVerified = rows.some(r => r.name === 'email_verified');
                if (!hasEmailVerified) {
                    db.run("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0", (err) => {
                        if (err) console.error("Error adding email_verified column:", err);
                        else console.log("Added email_verified column to users table.");
                    });
                }

                const hasLocation = rows.some(r => r.name === 'location');
                if (!hasLocation) {
                    db.run("ALTER TABLE users ADD COLUMN location TEXT", (err) => {
                        if (err) console.error("Error adding location column:", err);
                        else console.log("Added location column to users table.");
                    });
                }

                const hasPhone = rows.some(r => r.name === 'phone');
                if (!hasPhone) {
                    db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => {
                        if (err) console.error("Error adding phone column:", err);
                        else console.log("Added phone column to users table.");
                    });
                }
            });

            // Migration for custom_products
            db.all("PRAGMA table_info(custom_products)", (err, rows) => {
                if (rows) {
                    const hasInStock = rows.some(r => r.name === 'in_stock');
                    if (!hasInStock) {
                        db.run("ALTER TABLE custom_products ADD COLUMN in_stock BOOLEAN DEFAULT 1", (err) => {
                            if (err) console.error("Error adding in_stock column:", err);
                            else console.log("Added in_stock column to custom_products table.");
                        });
                    }

                    const hasStockCount = rows.some(r => r.name === 'stock_count');
                    if (!hasStockCount) {
                        db.run("ALTER TABLE custom_products ADD COLUMN stock_count INTEGER DEFAULT 100", (err) => {
                            if (err) console.error("Error adding stock_count column:", err);
                            else console.log("Added stock_count column to custom_products table.");
                        });
                    }

                    const hasCategory = rows.some(r => r.name === 'category');
                    if (!hasCategory) {
                        db.run("ALTER TABLE custom_products ADD COLUMN category TEXT", (err) => {
                            if (err) console.error("Error adding category column:", err);
                            else console.log("Added category column to custom_products table.");
                        });
                    }
                }
            });

            // Migration for static_products
            db.all("PRAGMA table_info(static_products)", (err, rows) => {
                if (rows) {
                    const hasStockCount = rows.some(r => r.name === 'stock_count');
                    if (!hasStockCount) {
                        db.run("ALTER TABLE static_products ADD COLUMN stock_count INTEGER", (err) => {
                            if (err) console.error("Error adding stock_count column to static_products:", err);
                            else console.log("Added stock_count column to static_products table.");
                        });
                    }
                    const hasCategory = rows.some(r => r.name === 'category');
                    if (!hasCategory) {
                        db.run("ALTER TABLE static_products ADD COLUMN category TEXT", (err) => {
                            if (err) console.error("Error adding category column to static_products:", err);
                            else console.log("Added category column to static_products table.");
                        });
                    }
                }
            });
        }
    });

    // Create product ratings table
    db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
        if (err) {
            console.error('Error creating ratings table:', err.message);
        } else {
            console.log('Ratings table ready.');
        }
    });

    db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_admin_reply BOOLEAN DEFAULT 0,
      is_read BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `, (err) => {
        if (err) console.error('Error creating messages table:', err.message);
        else console.log('Messages table ready.');
    });

    // Create loyalty codes table
    db.run(`
    CREATE TABLE IF NOT EXISTS loyalty_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL DEFAULT 10,
      is_used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
        if (err) console.error('Error creating loyalty_codes table:', err.message);
        else console.log('Loyalty codes table ready.');
    });

    // Create orders table
    db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      items TEXT NOT NULL, -- JSON string of items
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
        if (err) {
            console.error('Error creating orders table:', err.message);
        } else {
            console.log('Orders table ready.');
            db.all("PRAGMA table_info(orders)", (err, rows) => {
                if (rows) {
                    const hasRefundStatus = rows.some(r => r.name === 'refund_status');
                    if (!hasRefundStatus) {
                        db.run("ALTER TABLE orders ADD COLUMN refund_status TEXT DEFAULT 'none'");
                        db.run("ALTER TABLE orders ADD COLUMN refund_reason TEXT");
                        db.run("ALTER TABLE orders ADD COLUMN refund_amount REAL DEFAULT 0");
                        console.log("Added refund tracking columns to orders table.");
                    }

                    const hasPaymentMethod = rows.some(r => r.name === 'payment_method');
                    if (!hasPaymentMethod) {
                        db.run("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash'");
                        console.log("Added payment_method column to orders table.");
                    }

                    const hasAddress = rows.some(r => r.name === 'address');
                    if (!hasAddress) {
                        db.run("ALTER TABLE orders ADD COLUMN address TEXT");
                        console.log("Added address column to orders table.");
                    }
                }
            });
        }
    });

    // Create cart_items table
    db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
        if (err) console.error('Error creating cart_items table:', err.message);
        else console.log('Cart items table ready.');
    });

    // Create deleted_products table
    db.run(`
    CREATE TABLE IF NOT EXISTS deleted_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL UNIQUE,
      deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
        if (err) console.error('Error creating deleted_products table:', err.message);
        else console.log('Deleted products table ready.');
    });

    // Create custom products table
    db.run(`
    CREATE TABLE IF NOT EXISTS custom_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      img TEXT NOT NULL,
      price REAL NOT NULL,
      company TEXT NOT NULL,
      category TEXT,
      info TEXT,
      in_cart BOOLEAN DEFAULT 0,
      count INTEGER DEFAULT 0,
      total REAL DEFAULT 0,
      in_stock BOOLEAN DEFAULT 1,
      stock_count INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
        if (err) console.error('Error creating custom_products table:', err.message);
        else console.log('Custom products table ready.');
    });

    // Create static products override table
    db.run(`
    CREATE TABLE IF NOT EXISTS static_products (
      id INTEGER PRIMARY KEY,
      title TEXT,
      price REAL,
      company TEXT,
      category TEXT,
      info TEXT,
      img TEXT,
      in_stock BOOLEAN,
      stock_count INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
        if (err) console.error('Error creating static_products table:', err.message);
        else console.log('Static products override table ready.');
    });
}

// Database helper functions
const dbHelpers = {
    // Create a new user
    createUser: (username, email, hashedPassword, role = 'user', emailVerified = false, location = '', phone = '') => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO users (username, email, password, role, email_verified, location, phone) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.run(sql, [username, email, hashedPassword, role, emailVerified ? 1 : 0, location, phone], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, username, email, role, emailVerified, location, phone });
                }
            });
        });
    },

    // Update user profile
    updateUserProfile: (userId, username, location, phone) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET username = ?, location = ?, phone = ? WHERE id = ?';
            db.run(sql, [username, location, phone, userId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, username, location, phone });
                }
            });
        });
    },

    // Find user by email
    findUserByEmail: (email) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE email = ?';
            db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // Find user by username
    findUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE username = ?';
            db.get(sql, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // Update user role
    updateUserRole: (userId, role) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET role = ? WHERE id = ?';
            db.run(sql, [role, userId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    },

    // Add a rating
    addRating: (productId, userId, rating, review) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO ratings (product_id, user_id, rating, review) VALUES (?, ?, ?, ?)';
            db.run(sql, [productId, userId, rating, review], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    },

    // Get ratings for a product
    getRatingsByProduct: (productId) => {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT r.*, u.username 
        FROM ratings r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.product_id = ? 
        ORDER BY r.created_at DESC
      `;
            db.all(sql, [productId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Get all ratings
    getAllRatings: () => {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT r.*, u.username 
        FROM ratings r 
        JOIN users u ON r.user_id = u.id 
        ORDER BY r.created_at DESC
      `;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Get average rating for a product
    getAverageRating: (productId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT AVG(rating) as average, COUNT(*) as count FROM ratings WHERE product_id = ?';
            db.get(sql, [productId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // Cart Management
    saveCartItem: (userId, productId, count) => {
        return new Promise((resolve, reject) => {
            // Check if item exists
            db.get('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId], (err, row) => {
                if (err) reject(err);

                if (row) {
                    // Update count
                    if (count > 0) {
                        db.run('UPDATE cart_items SET count = ? WHERE id = ?', [count, row.id], function (err) {
                            if (err) reject(err);
                            else resolve({ id: row.id, count });
                        });
                    } else {
                        // Remove item if count is 0
                        db.run('DELETE FROM cart_items WHERE id = ?', [row.id], function (err) {
                            if (err) reject(err);
                            else resolve({ deleted: true });
                        });
                    }
                } else if (count > 0) {
                    // Insert new item
                    db.run('INSERT INTO cart_items (user_id, product_id, count) VALUES (?, ?, ?)', [userId, productId, count], function (err) {
                        if (err) reject(err);
                        else resolve({ id: this.lastID, count });
                    });
                } else {
                    resolve({ noChange: true });
                }
            });
        });
    },

    getUserCart: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_items WHERE user_id = ?';
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    clearUserCart: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM cart_items WHERE user_id = ?';
            db.run(sql, [userId], function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Order Management
    createOrder: (userId, items, total, paymentMethod = 'cash', address = '') => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO orders (user_id, items, total, status, payment_method, address) VALUES (?, ?, ?, ?, ?, ?)';
            const itemsJson = JSON.stringify(items);
            db.run(sql, [userId, itemsJson, total, 'completed', paymentMethod, address], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    },

    getUserOrders: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => ({
                    ...row,
                    items: JSON.parse(row.items)
                })));
            });
        });
    },

    deleteOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM orders WHERE id = ?';
            db.run(sql, [orderId], function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    getAllOrders: () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT o.*, u.username, u.email 
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                ORDER BY o.created_at DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => ({
                    ...row,
                    items: JSON.parse(row.items)
                })));
            });
        });
    },

    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.id, u.username, u.email, u.role, u.created_at,
                (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
                (SELECT SUM(total) FROM orders WHERE user_id = u.id) as total_spent,
                (SELECT COUNT(*) FROM cart_items WHERE user_id = u.id) as cart_count
                FROM users u
                ORDER BY u.created_at DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    deleteUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('DELETE FROM cart_items WHERE user_id = ?', [userId], (err) => {
                    if (err) console.error('Error clearing user cart items:', err);
                });
                db.run('DELETE FROM orders WHERE user_id = ?', [userId], (err) => {
                    if (err) console.error('Error clearing user orders:', err);
                });
                db.run('DELETE FROM ratings WHERE user_id = ?', [userId], (err) => {
                    if (err) console.error('Error clearing user ratings:', err);
                });
                db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                });
            });
        });
    },

    getAdminStats: () => {
        return new Promise((resolve, reject) => {
            const stats = {};

            // Get total users
            db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
                if (err) return reject(err);
                stats.totalUsers = row.count;

                // Get total orders
                db.get('SELECT COUNT(*) as count, SUM(total) as revenue FROM orders', [], (err, row) => {
                    if (err) return reject(err);
                    stats.totalOrders = row.count;
                    stats.totalRevenue = row.revenue || 0;

                    resolve(stats);
                });
            });
        });
    },

    // Update password
    updatePassword: (email, hashedPassword) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET password = ? WHERE email = ?';
            db.run(sql, [hashedPassword, email], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    },

    // Product deletion tracking
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT OR REPLACE INTO deleted_products (product_id) VALUES (?)';
            db.run(sql, [productId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, productId });
                }
            });
        });
    },

    getDeletedProducts: () => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM deleted_products ORDER BY deleted_at DESC';
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Custom Products Management
    addCustomProduct: (product) => {
        return new Promise((resolve, reject) => {
            const { title, img, price, company, category, info, inStock, stockCount } = product;
            const sql = 'INSERT INTO custom_products (title, img, price, company, category, info, in_stock, stock_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            db.run(sql, [title, img, price, company, category, info, inStock ? 1 : 0, stockCount || 100], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...product });
            });
        });
    },

    getCustomProducts: () => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM custom_products ORDER BY created_at DESC';
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => ({
                    ...row,
                    id: row.id + 1000,
                    inStock: row.in_stock === 1,
                    stockCount: row.stock_count
                })));
            });
        });
    },

    updateCustomProduct: (id, product) => {
        return new Promise((resolve, reject) => {
            const { title, price, company, category, info, img, inStock, stockCount } = product;
            const customId = id - 1000;
            let sql, params;

            if (img) {
                sql = 'UPDATE custom_products SET title = ?, price = ?, company = ?, category = ?, info = ?, img = ?, in_stock = ?, stock_count = ? WHERE id = ?';
                params = [title, price, company, category, info, img, inStock ? 1 : 0, stockCount, customId];
            } else {
                sql = 'UPDATE custom_products SET title = ?, price = ?, company = ?, category = ?, info = ?, in_stock = ?, stock_count = ? WHERE id = ?';
                params = [title, price, company, category, info, inStock ? 1 : 0, stockCount, customId];
            }

            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    updateStaticProduct: (id, product) => {
        return new Promise((resolve, reject) => {
            const { title, price, company, category, info, img, inStock, stockCount } = product;
            const sql = `
                INSERT INTO static_products (id, title, price, company, category, info, img, in_stock, stock_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title = excluded.title,
                    price = excluded.price,
                    company = excluded.company,
                    category = excluded.category,
                    info = excluded.info,
                    img = COALESCE(excluded.img, static_products.img),
                    in_stock = excluded.in_stock,
                    stock_count = excluded.stock_count,
                    updated_at = CURRENT_TIMESTAMP
            `;
            const params = [id, title, price, company, category, info, img || null, inStock ? 1 : 0, stockCount];

            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    getStaticProductOverrides: () => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM static_products';
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => {
                    const result = { ...row };
                    if (row.in_stock !== null) {
                        result.inStock = row.in_stock === 1;
                    }
                    if (row.stock_count !== null) {
                        result.stockCount = row.stock_count;
                    }
                    return result;
                }));
            });
        });
    },

    decrementStock: (productId, quantity) => {
        return new Promise(async (resolve, reject) => {
            try {
                let sql, params;
                if (productId >= 1000) {
                    // Custom product
                    sql = 'UPDATE custom_products SET stock_count = MAX(0, stock_count - ?) WHERE id = ?';
                    params = [quantity, productId - 1000];
                } else {
                    // Static product - first check if override exists
                    const row = await new Promise((res, rej) => {
                        db.get('SELECT * FROM static_products WHERE id = ?', [productId], (err, row) => {
                            if (err) rej(err); else res(row);
                        });
                    });

                    if (row) {
                        sql = 'UPDATE static_products SET stock_count = MAX(0, stock_count - ?) WHERE id = ?';
                        params = [quantity, productId];
                    } else {
                        // Create override with initial deterministic stock minus quantity
                        // Even IDs = 200, Odd IDs = 150
                        const initialStock = (productId % 2 === 0) ? 200 : 150;
                        sql = 'INSERT INTO static_products (id, stock_count, in_stock) VALUES (?, ?, ?)';
                        params = [productId, initialStock - quantity, 1];
                    }
                }

                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    // Analytics functions
    getAnalytics: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const analytics = {};

                // Sales over time (last 30 days)
                const salesOverTime = await new Promise((res, rej) => {
                    const sql = `
                        SELECT DATE(created_at) as date, 
                               COUNT(*) as orders, 
                               SUM(total) as revenue
                        FROM orders
                        WHERE created_at >= datetime('now', '-30 days')
                        GROUP BY DATE(created_at)
                        ORDER BY date ASC
                    `;
                    db.all(sql, [], (err, rows) => {
                        if (err) rej(err);
                        else res(rows);
                    });
                });

                // Top selling products (based on order items)
                const topProducts = await new Promise((res, rej) => {
                    const sql = `
                        SELECT 
                            json_extract(value, '$.id') as product_id,
                            json_extract(value, '$.title') as product_name,
                            SUM(CAST(json_extract(value, '$.count') AS INTEGER)) as total_sold,
                            SUM(CAST(json_extract(value, '$.count') AS INTEGER) * 
                                CAST(json_extract(value, '$.price') AS REAL)) as revenue
                        FROM orders, json_each(orders.items)
                        GROUP BY product_id
                        ORDER BY total_sold DESC
                        LIMIT 10
                    `;
                    db.all(sql, [], (err, rows) => {
                        if (err) rej(err);
                        else res(rows);
                    });
                });

                // User growth over time (last 30 days)
                const userGrowth = await new Promise((res, rej) => {
                    const sql = `
                        SELECT DATE(created_at) as date, COUNT(*) as new_users
                        FROM users
                        WHERE created_at >= datetime('now', '-30 days')
                        GROUP BY DATE(created_at)
                        ORDER BY date ASC
                    `;
                    db.all(sql, [], (err, rows) => {
                        if (err) rej(err);
                        else res(rows);
                    });
                });

                // Revenue by day of week
                const revenueByDayOfWeek = await new Promise((res, rej) => {
                    const sql = `
                        SELECT 
                            CASE CAST(strftime('%w', created_at) AS INTEGER)
                                WHEN 0 THEN 'Sunday'
                                WHEN 1 THEN 'Monday'
                                WHEN 2 THEN 'Tuesday'
                                WHEN 3 THEN 'Wednesday'
                                WHEN 4 THEN 'Thursday'
                                WHEN 5 THEN 'Friday'
                                WHEN 6 THEN 'Saturday'
                            END as day_name,
                            COUNT(*) as orders,
                            SUM(total) as revenue
                        FROM orders
                        GROUP BY strftime('%w', created_at)
                        ORDER BY strftime('%w', created_at)
                    `;
                    db.all(sql, [], (err, rows) => {
                        if (err) rej(err);
                        else res(rows);
                    });
                });

                // Average order value
                const avgOrderValue = await new Promise((res, rej) => {
                    const sql = 'SELECT AVG(total) as avg_value FROM orders';
                    db.get(sql, [], (err, row) => {
                        if (err) rej(err);
                        else res(row.avg_value || 0);
                    });
                });

                // Total customers vs returning customers
                const customerStats = await new Promise((res, rej) => {
                    const sql = `
                        SELECT 
                            COUNT(DISTINCT user_id) as total_customers,
                            COUNT(CASE WHEN order_count > 1 THEN 1 END) as returning_customers
                        FROM (
                            SELECT user_id, COUNT(*) as order_count
                            FROM orders
                            GROUP BY user_id
                        )
                    `;
                    db.get(sql, [], (err, row) => {
                        if (err) rej(err);
                        else res(row);
                    });
                });

                analytics.salesOverTime = salesOverTime;
                analytics.topProducts = topProducts;
                analytics.userGrowth = userGrowth;
                analytics.revenueByDayOfWeek = revenueByDayOfWeek;
                analytics.avgOrderValue = avgOrderValue;
                analytics.customerStats = customerStats;

                resolve(analytics);
            } catch (error) {
                reject(error);
            }
        });
    },

    // Refund methods
    requestRefund(orderId, reason, amount) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE orders SET refund_status = 'pending', refund_reason = ?, refund_amount = ? WHERE id = ?`;
            db.run(sql, [reason, amount, orderId], function (err) {
                if (err) reject(err);
                else resolve({ id: orderId, changes: this.changes });
            });
        });
    },

    approveRefund(orderId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE orders SET status = 'refunded', refund_status = 'approved' WHERE id = ?`;
            db.run(sql, [orderId], function (err) {
                if (err) reject(err);
                else resolve({ id: orderId, changes: this.changes });
            });
        });
    },

    rejectRefund(orderId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE orders SET refund_status = 'rejected' WHERE id = ?`;
            db.run(sql, [orderId], function (err) {
                if (err) reject(err);
                else resolve({ id: orderId, changes: this.changes });
            });
        });
    },

    // Message helpers
    sendMessage: (userId, senderId, content, isAdminReply = false) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO messages (user_id, sender_id, content, is_admin_reply) VALUES (?, ?, ?, ?)';
            db.run(sql, [userId, senderId, content, isAdminReply ? 1 : 0], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, timestamp: new Date() });
            });
        });
    },

    getUserMessages: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM messages WHERE user_id = ? ORDER BY timestamp ASC';
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getAdminConversations: () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT m.*, u.username, u.email,
                (SELECT COUNT(*) FROM messages WHERE user_id = u.id AND is_read = 0 AND is_admin_reply = 0) as unread_count
                FROM messages m
                JOIN users u ON m.user_id = u.id
                WHERE m.id IN (SELECT MAX(id) FROM messages GROUP BY user_id)
                ORDER BY m.timestamp DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    markMessagesAsRead: (userId, isAdmin = false) => {
        return new Promise((resolve, reject) => {
            const sql = isAdmin
                ? 'UPDATE messages SET is_read = 1 WHERE user_id = ? AND is_admin_reply = 0'
                : 'UPDATE messages SET is_read = 1 WHERE user_id = ? AND is_admin_reply = 1';
            db.run(sql, [userId], function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    // Create a new loyalty code
    createLoyaltyCode: (userId, code, discountPercent = 10) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO loyalty_codes (user_id, code, discount_percent) VALUES (?, ?, ?)';
            db.run(sql, [userId, code, discountPercent], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, userId, code, discountPercent });
            });
        });
    },

    // Get active loyalty codes for a user
    getUserLoyaltyCodes: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM loyalty_codes WHERE user_id = ? AND is_used = 0';
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Validate and use a loyalty code
    validateAndUseLoyaltyCode: (userId, code) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM loyalty_codes WHERE user_id = ? AND code = ? AND is_used = 0';
            db.get(sql, [userId, code], (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    db.run('UPDATE loyalty_codes SET is_used = 1 WHERE id = ?', [row.id], (err) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                }
            });
        });
    }
};

module.exports = { db, dbHelpers };
