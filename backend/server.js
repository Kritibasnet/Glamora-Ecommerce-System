require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelpers, db } = require('./database');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'glamora-secret-key-2025';

// NodeMailer Config (Gmail SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error:', error.message);
    } else {
        console.log('✅ SMTP Server is ready to send emails');
    }
});

// In-memory OTP Store (email -> { otp, expiresAt })
const otpStore = new Map();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Middleware to verify Admin role
function verifyAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Glamora API is running!' });
});

// All static products catalog for AI matching
const PRODUCT_CATALOG = [
    { id: 1, title: "Necklace", category: "Accessories", info: "Sterling silver personalized cursive name necklace" },
    { id: 2, title: "Sun Screen", category: "Skincare", info: "SPF-50 ultra matte sunscreen, natural nutrition, skin soothing" },
    { id: 3, title: "Ring", category: "Accessories", info: "Fashion ring, lightweight, durable, jewellery" },
    { id: 4, title: "Ear Ring", category: "Accessories", info: "Classy earring jewellery set, party wear" },
    { id: 5, title: "Makeup Products Combo", category: "Makeup", info: "Lipstick, concealer, kajal, blush and other makeup items combo" },
    { id: 6, title: "Treatment Oil", category: "Skincare", info: "Skin treatment oil, antioxidants, skin nourishing, botanical" },
    { id: 7, title: "Makeup Brush", category: "Accessories", info: "Professional cosmetics makeup brushes set, foundation, eyeshadow, blush" },
    { id: 8, title: "Nail Polish", category: "Makeup", info: "Easy apply nail polish, durable, soft brush" },
    { id: 9, title: "Deodorant", category: "Perfume & Body lotion", info: "Long-lasting body odour protection deodorant" },
    { id: 10, title: "Intense Matte Lipstick", category: "Makeup", info: "Matte moisturizing long lasting lipstick, all skin tones" },
    { id: 11, title: "Perfume", category: "Perfume & Body lotion", info: "Elegant fragrance, classic Channel Paris scent" },
    { id: 12, title: "Red Bag", category: "Accessories", info: "Red sling bag, synthetic material, golden chain belt" },
    { id: 13, title: "Facial Serum", category: "Skincare", info: "Vitamin C and Hyaluronic acid serum, hydration, radiant complexion" },
    { id: 14, title: "Hair Mask", category: "Hair & Body Care", info: "Deep conditioning hair mask, restores shine, softness" },
    { id: 15, title: "Limited Edition Watch", category: "Accessories", info: "Premium luxury watch, leather strap, sapphire crystal" },
    { id: 16, title: "Suede Handbag", category: "Accessories", info: "Classic suede handbag, gold accents, formal occasions" },
];

// AI Recommendation Endpoint
app.post('/api/ai/recommend', async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) return res.status(400).json({ error: 'Description is required' });

        const productList = PRODUCT_CATALOG.map(p => `- "${p.title}" (${p.category}): ${p.info}`).join('\n');

        const prompt = `You are a product recommender for a cosmetics store.

A user is looking for: "${description}"

Here are the available products in our store:
${productList}

Based on the user's description, pick the SINGLE most relevant product from the list above. Return ONLY the exact product title as it appears in the list, nothing else. No explanation, no punctuation, just the exact title.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const keyword = response.text().trim().replace(/^["']|["']$/g, '');

        res.json({ keyword });
    } catch (error) {
        console.error('AI Recommendation Error:', error);
        res.status(500).json({ error: 'Failed to get recommendation' });
    }
});

// Send OTP Endpoint
app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Check if email already registered
        const existingUser = await dbHelpers.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Generate a 6-digit OTP
        let otp = Math.floor(100000 + Math.random() * 900000).toString();

        // DEV MODE: Fixed OTP for test user
        if (email === 'test_sg@example.com') {
            otp = '123456';
        }

        const expiresAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        otpStore.set(email, { otp, expiresAt });

        // Send OTP via Gmail SMTP
        const mailOptions = {
            from: 'glamoranepal221@gmail.com',
            to: email,
            subject: 'Glamora - Your OTP for Registration',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                    <h2 style="color: #D4567D; text-align: center;">Welcome to Glamora!</h2>
                    <p>Hello,</p>
                    <p>Your One-Time Password (OTP) for registration is:</p>
                    <div style="background: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #D4567D;">${otp}</span>
                    </div>
                    <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777; text-align: center;">The Glamora Team</p>
                </div>
            `,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ OTP sent to ${email}: ${otp}`);
            console.log('Message ID:', info.messageId);
        } catch (emailError) {
            console.error('❌ Gmail SMTP Failed:', emailError.stack || emailError.message);
            // In Dev/Demo mode, we proceed even if email fails, so the user can copy OTP from console
            console.log(`*** DEV MODE OTP for ${email}: ${otp} ***`);
        }

        res.status(200).json({ message: 'OTP sent successfully to your email.' });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Server error during OTP generation or sending.' });
    }
});

// Register Endpoint (with OTP verification)
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, otp, location, phone } = req.body;

        // Validation
        if (!username || !email || !password || !otp) {
            return res.status(400).json({ error: 'All fields including OTP are required' });
        }

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Verify OTP
        const storedOtpData = otpStore.get(email);

        if (!storedOtpData) {
            return res.status(400).json({ error: 'OTP not found or expired. Please request a new one.' });
        }

        if (Date.now() > storedOtpData.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
        }

        if (storedOtpData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP Verified - Clear it
        otpStore.delete(email);

        // Check if user already exists (double check)
        const existingUserByEmail = await dbHelpers.findUserByEmail(email);
        if (existingUserByEmail) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const existingUserByUsername = await dbHelpers.findUserByUsername(username);
        if (existingUserByUsername) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with email_verified = true
        const user = await dbHelpers.createUser(username, email, hashedPassword, 'user', true, location || '', phone || '');

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                location: user.location,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await dbHelpers.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                location: user.location,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await dbHelpers.findUserByEmail(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            location: user.location,
            phone: user.phone
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update User Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { username, location, phone } = req.body;
        if (!username) return res.status(400).json({ error: 'Username is required' });
        await dbHelpers.updateUserProfile(req.user.id, username, location, phone);
        res.json({ message: 'Profile updated successfully', username, location, phone });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Forgot Password Endpoint
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Check if user exists
        const user = await dbHelpers.findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        otpStore.set(email, { otp, expiresAt });

        // Send OTP via Gmail SMTP
        const mailOptions = {
            from: 'glamoranepal221@gmail.com',
            to: email,
            subject: 'Glamora - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                    <h2 style="color: #D4567D; text-align: center;">Reset Your Password</h2>
                    <p>Hello,</p>
                    <p>You requested a password reset. Your One-Time Password (OTP) is:</p>
                    <div style="background: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #D4567D;">${otp}</span>
                    </div>
                    <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777; text-align: center;">The Glamora Team</p>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Reset OTP sent to ${email} (via Gmail): ${otp}`);
        } catch (emailError) {
            console.error('Gmail Reset SMTP Failed:', emailError.message);
            console.log(`*** DEV MODE RESET OTP for ${email}: ${otp} ***`);
        }

        res.status(200).json({ message: 'OTP sent successfully to your email.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error during forgot password request' });
    }
});

// Reset Password Endpoint
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Verify OTP
        const storedOtpData = otpStore.get(email);

        if (!storedOtpData) {
            return res.status(400).json({ error: 'OTP not found or expired. Please request a new one.' });
        }

        if (Date.now() > storedOtpData.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
        }

        if (storedOtpData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP Verified - Clear it
        otpStore.delete(email);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await dbHelpers.updatePassword(email, hashedPassword);

        res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error during password reset' });
    }
});


// Add rating endpoint (protected)
app.post('/api/ratings', authenticateToken, async (req, res) => {
    try {
        const { productId, rating, review } = req.body;
        const userId = req.user.id;

        if (!productId || !rating) {
            return res.status(400).json({ error: 'Product ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if user has purchased the product
        const orders = await dbHelpers.getUserOrders(userId);
        const hasPurchased = orders.some(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            return items.some(item => item.id === parseInt(productId));
        });

        if (!hasPurchased) {
            return res.status(403).json({ error: 'You can only review products you have purchased.' });
        }

        const result = await dbHelpers.addRating(productId, userId, rating, review || '');

        res.status(201).json({
            message: 'Rating added successfully',
            ratingId: result.id
        });
    } catch (error) {
        console.error('Add rating error:', error);
        res.status(500).json({ error: 'Server error while adding rating' });
    }
});

// Get ratings for a product
app.get('/api/ratings/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const ratings = await dbHelpers.getRatingsByProduct(productId);
        const average = await dbHelpers.getAverageRating(productId);

        res.json({
            ratings,
            average: average.average || 0,
            count: average.count || 0
        });
    } catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({ error: 'Server error while fetching ratings' });
    }
});

// Get all ratings
app.get('/api/ratings', async (req, res) => {
    try {
        const ratings = await dbHelpers.getAllRatings();
        res.json({ ratings });
    } catch (error) {
        console.error('Get all ratings error:', error);
        res.status(500).json({ error: 'Server error while fetching ratings' });
    }
});

// Verify token endpoint
app.get('/api/verify', authenticateToken, async (req, res) => {
    try {
        // Refresh user data to get latest role
        const user = await dbHelpers.findUserByEmail(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


// --- Cart Endpoints ---

// Get user cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const cartItems = await dbHelpers.getUserCart(req.user.id);
        res.json(cartItems);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save cart item
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { productId, count } = req.body;
        const result = await dbHelpers.saveCartItem(req.user.id, productId, count);
        res.json(result);
    } catch (error) {
        console.error('Save cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Clear cart
app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        await dbHelpers.clearUserCart(req.user.id);
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Order Endpoints ---

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, total } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const { loyaltyCode, paymentMethod, address } = req.body;
        if (loyaltyCode) {
            await dbHelpers.validateAndUseLoyaltyCode(req.user.id, loyaltyCode);
        }

        const user = await dbHelpers.findUserByEmail(req.user.email);
        const orderAddress = address || user.location || 'Your provided location';

        const result = await dbHelpers.createOrder(req.user.id, items, total, paymentMethod || 'cash', orderAddress);

        // Send Confirmation Email
        const mailOptions = {
            from: 'glamoranepal221@gmail.com',
            to: req.user.email,
            subject: 'Order Confirmed - Glamora',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                    <h2 style="color: #D4567D; text-align: center;">Order Confirmed!</h2>
                    <p>Hello ${req.user.username},</p>
                    <p>Thanks for your order your order would be delivered to the location <strong>${orderAddress}</strong> within 2 business days.</p>
                    <p><strong>Order ID:</strong> #${result.id}</p>
                    <p><strong>Total:</strong> $${total.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'eSewa/Online'}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777; text-align: center;">The Glamora Team</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions).catch(err => console.error('Email error:', err));

        // Generate loyalty code for next purchase
        const newLoyaltyCode = 'GLAM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await dbHelpers.createLoyaltyCode(req.user.id, newLoyaltyCode, 10);

        // Decrement stock for each item
        for (const item of items) {
            try {
                await dbHelpers.decrementStock(item.id, item.count);
            } catch (stockError) {
                console.error(`Error decrementing stock for product ${item.id}:`, stockError);
                // We continue even if stock decrement fails for one item
            }
        }

        // Clear cart after successful order
        await dbHelpers.clearUserCart(req.user.id);

        res.status(201).json({
            message: 'Order created successfully',
            orderId: result.id
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await dbHelpers.getUserOrders(req.user.id);
        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user loyalty codes
app.get('/api/loyalty-codes', authenticateToken, async (req, res) => {
    try {
        const codes = await dbHelpers.getUserLoyaltyCodes(req.user.id);
        res.json(codes);
    } catch (error) {
        console.error('Get loyalty codes error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Validate loyalty code
app.post('/api/loyalty-codes/validate', authenticateToken, async (req, res) => {
    try {
        const { code } = req.body;
        const sql = 'SELECT * FROM loyalty_codes WHERE user_id = ? AND code = ? AND is_used = 0';
        db.get(sql, [req.user.id, code], (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!row) return res.status(404).json({ error: 'Invalid or used loyalty code' });
            res.json(row);
        });
    } catch (error) {
        console.error('Validate loyalty code error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Request Refund
app.post('/api/orders/:orderId/refund', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ error: 'Reason is required' });

        // Get order
        db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id], async (err, order) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!order) return res.status(404).json({ error: 'Order not found' });

            if (order.refund_status === 'pending' || order.refund_status === 'approved') {
                return res.status(400).json({ error: 'Refund already requested or approved' });
            }

            const createdTime = new Date(order.created_at).getTime();
            const now = Date.now();
            const diffHours = (now - createdTime) / (1000 * 60 * 60);

            let refundRate = 0;
            if (diffHours <= 24) refundRate = 0.8;
            else if (diffHours <= 48) refundRate = 0.6;
            else if (diffHours <= 168) refundRate = 0.2; // 7 days

            if (refundRate === 0) {
                return res.status(400).json({ error: 'Order exceeds the 7-day refund policy window.' });
            }

            const refundAmount = order.total * refundRate;

            await dbHelpers.requestRefund(orderId, reason, refundAmount);

            res.json({ message: 'Refund requested successfully', refundAmount });
        });
    } catch (error) {
        console.error('Refund request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Admin Endpoints ---

// Get all orders (Admin only)
app.get('/api/admin/orders', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const orders = await dbHelpers.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete order (Admin only)
app.delete('/api/admin/orders/:orderId', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await dbHelpers.deleteOrder(orderId);
        if (result.changes > 0) {
            res.json({ message: 'Order deleted successfully' });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Approve Refund
app.post('/api/admin/orders/:orderId/refund-approve', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        await dbHelpers.approveRefund(orderId);
        res.json({ message: 'Refund approved successfully' });
    } catch (error) {
        console.error('Approve refund error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Reject Refund
app.post('/api/admin/orders/:orderId/refund-reject', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        await dbHelpers.rejectRefund(orderId);
        res.json({ message: 'Refund rejected successfully' });
    } catch (error) {
        console.error('Reject refund error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users (Admin only)
app.get('/api/admin/users', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const users = await dbHelpers.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:userId', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own admin account' });
        }

        const result = await dbHelpers.deleteUser(userId);
        if (result.changes > 0) {
            res.json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get admin stats (Admin only)
app.get('/api/admin/stats', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const stats = await dbHelpers.getAdminStats();
        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get analytics data (Admin only)
app.get('/api/admin/analytics', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const analytics = await dbHelpers.getAnalytics();
        res.json(analytics);
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete product (Admin only) - Note: This deletes from in-memory data
app.delete('/api/admin/products/:productId', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const { productId } = req.params;
        // Since products are stored in data.js, we'll mark them as deleted in a separate table
        const result = await dbHelpers.deleteProduct(productId);
        res.json({ message: 'Product marked as deleted successfully', result });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get deleted products list (Public - needed for filtering)
app.get('/api/admin/deleted-products', async (req, res) => {
    try {
        const deletedProducts = await dbHelpers.getDeletedProducts();
        res.json(deletedProducts);
    } catch (error) {
        console.error('Get deleted products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Add Product (Protected)
app.post('/api/admin/products', authenticateToken, verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, price, company, category, info, inStock, stockCount } = req.body;
        if (!title || !price || !company) {
            return res.status(400).json({ error: 'Missing required fields (title, price, company)' });
        }
        // Image is optional; provide placeholder if not uploaded
        const imgPath = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : '';
        const product = await dbHelpers.addCustomProduct({
            title,
            img: imgPath,
            price: parseFloat(price),
            company,
            category: category || 'General',
            info: info || '',
            inStock: inStock === 'true' || inStock === true || true,
            stockCount: parseInt(stockCount) || 100
        });
        res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
        console.error('Add product error:', error);
        // Ensure JSON error response
        res.status(500).json({ error: 'Server error while adding product' });
    }
});

// Admin Update Product (Protected)
app.put('/api/admin/products/:productId', authenticateToken, verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { productId } = req.params;
        const { title, price, company, category, info } = req.body;
        const id = parseInt(productId);

        if (!title || !price || !company) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const productData = {
            title,
            price: parseFloat(price),
            company,
            category: category || 'General',
            info: info || '',
            inStock: req.body.inStock === 'true' || req.body.inStock === true,
            stockCount: parseInt(req.body.stockCount) || 0
        };

        if (req.file) {
            productData.img = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        let result;
        if (id >= 1000) {
            result = await dbHelpers.updateCustomProduct(id, productData);
        } else {
            result = await dbHelpers.updateStaticProduct(id, productData);
        }

        if (result.changes > 0) {
            res.json({ message: 'Product updated successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all products (Combined static and custom)
app.get('/api/products', async (req, res) => {
    try {
        const customProducts = await dbHelpers.getCustomProducts();
        const staticOverrides = await dbHelpers.getStaticProductOverrides();
        res.json({ customProducts, staticOverrides });
    } catch (error) {
        console.error('Get custom products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- eSewa Payment Integration (v2) ---
const ESEWA_SECRET = '8gBm/:&EnhH.1/q';
const ESEWA_PRODUCT_CODE = 'EPAYTEST';

// Generate signature for eSewa v2
app.post('/api/esewa/generate-signature', authenticateToken, (req, res) => {
    try {
        const { total_amount, transaction_uuid } = req.body;
        if (!total_amount || !transaction_uuid) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const crypto = require('crypto');
        const hashString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
        const signature = crypto.createHmac('sha256', ESEWA_SECRET).update(hashString).digest('base64');

        res.json({ signature, product_code: ESEWA_PRODUCT_CODE });
    } catch (error) {
        console.error('Signature generation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify eSewa v2 payment
app.post('/api/esewa/verify', authenticateToken, async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) return res.status(400).json({ error: 'Missing data' });

        // Decode base64 data from eSewa
        const decodedString = Buffer.from(data, 'base64').toString('utf-8');
        const decodedData = JSON.parse(decodedString);

        // eSewa v2 returns success in "status" field
        if (decodedData.status !== 'COMPLETE') {
            return res.status(400).json({ error: 'Payment not completed', details: decodedData });
        }

        // Optional: Verify signature of the response
        // In dummy mode, we can trust the status if it's COMPLETE, 
        // but for security we should re-hash. eSewa response includes parameters.

        res.json({ success: true, message: 'Payment verified successfully.' });
    } catch (error) {
        console.error('eSewa verify error:', error);
        res.status(500).json({ error: 'Server error during payment verification' });
    }
});

// Chat System Endpoints
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await dbHelpers.getUserMessages(req.user.id);
        await dbHelpers.markMessagesAsRead(req.user.id, false); // Mark admin replies as read
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Message content is required' });

        // User message
        await dbHelpers.sendMessage(req.user.id, req.user.id, content, false);

        // Automated reply
        const autoReply = "Thanks for your message, we generally reply within few hours. Our admin will get back to you.";
        // We find an admin ID (usually 1)
        db.get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin'], async (err, admin) => {
            if (admin) {
                await dbHelpers.sendMessage(req.user.id, admin.id, autoReply, true);
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.get('/api/admin/conversations', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const conversations = await dbHelpers.getAdminConversations();
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

app.get('/api/admin/messages/:userId', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await dbHelpers.getUserMessages(userId);
        await dbHelpers.markMessagesAsRead(userId, true); // Mark user messages as read
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user messages' });
    }
});

app.post('/api/admin/messages/:userId', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Message content is required' });

        await dbHelpers.sendMessage(userId, req.user.id, content, true);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'An unexpected server error occurred.',
        details: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Glamora server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});
