# Glamora - Premium Cosmetics E-Commerce Platform

A modern, feature-rich React-based e-commerce application for cosmetics and beauty products.

## 🌟 Features

### Core Features
- **Product Catalog**: Browse a curated selection of premium cosmetics
- **Shopping Cart**: Add products to cart with quantity management
- **Product Details**: Detailed product information and descriptions
- **Responsive Design**: Fully responsive across all devices

### New Features (2025 Update)
- **User Authentication**: Secure login and signup system with JWT
- **User Ratings & Reviews**: Rate and review products
- **Top This Week**: Featured products showcase
- **Enhanced Product Filtering**: Search, filter by price, and sort products
- **About Us Page**: Company information with Google Maps integration
- **Modern UI/UX**: Glassmorphism effects, smooth animations, and gradient designs

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd d:\react-cosmetic-store-master
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

### Running the Application

#### Option 1: Run Both Frontend and Backend Together (Recommended)
```bash
npm run dev
```
This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

#### Option 2: Run Separately

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend App:**
```bash
npm start
```

### First Time Setup

1. The SQLite database (`glamora.db`) will be created automatically when you start the backend server
2. Navigate to `http://localhost:3000` in your browser
3. Create a new account by clicking "Sign Up" in the navigation bar
4. Start shopping!

## 📱 Application Structure

### Pages
- **Home** (`/`) - Main product listing
- **View Products** (`/products`) - Enhanced product browsing with filters
- **Top This Week** (`/top-week`) - Featured products
- **Ratings** (`/ratings`) - Product reviews and ratings
- **About Us** (`/about`) - Company information and location
- **Product Details** (`/details`) - Individual product information
- **Shopping Cart** (`/cart`) - Cart management and checkout
- **Login** (`/login`) - User authentication
- **Sign Up** (`/signup`) - User registration

### Technology Stack

**Frontend:**
- React 16.13.1
- React Router DOM
- Styled Components
- Material-UI Icons
- Bootstrap 4

**Backend:**
- Node.js
- Express.js
- SQLite3
- JWT Authentication
- bcryptjs for password hashing

## 🎨 Design Features

- **Glamora Branding**: Elegant pink and gold color scheme
- **Modern Typography**: Playfair Display and Poppins fonts
- **Smooth Animations**: Fade-in, slide-in effects
- **Glassmorphism**: Modern glass-like UI elements
- **Responsive Navigation**: Mobile-friendly hamburger menu
- **Custom Scrollbar**: Branded scrollbar design

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for secure authentication:
- Passwords are hashed using bcryptjs
- Tokens are stored in localStorage
- Protected routes require authentication
- Session persistence across page refreshes

## 📍 Location

**Store Location:**
Dilli Bazaar, Kathmandu 44600, Nepal

Visit our About Us page to see the interactive Google Maps location.

## 🛠️ Development

### Available Scripts

- `npm start` - Run frontend development server
- `npm run server` - Run backend server
- `npm run dev` - Run both frontend and backend concurrently
- `npm run build` - Build production bundle
- `npm test` - Run tests

### Database

The application uses SQLite for data storage:
- **Database file**: `glamora.db` (created automatically)
- **Tables**: 
  - `users` - User accounts
  - `ratings` - Product ratings and reviews

## 🐛 Troubleshooting

### PowerShell Execution Policy Error
If you encounter a PowerShell execution policy error, run:
```bash
powershell -ExecutionPolicy Bypass -Command "npm install --legacy-peer-deps"
```

### Port Already in Use
If port 3000 or 5000 is already in use:
- Frontend: Set `PORT=3001` environment variable
- Backend: Modify `PORT` in `server.js`

### Database Issues
If you encounter database errors:
1. Stop the server
2. Delete `glamora.db` file
3. Restart the server (database will be recreated)

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Adding environment variables for sensitive data
- Implementing proper error boundaries
- Adding comprehensive testing
- Setting up CI/CD pipeline
- Using a production-grade database

## 📄 License

This project is for educational and demonstration purposes.

## 🙏 Acknowledgments

- Original template: React E-Commerce Store
- Enhanced and redesigned as Glamora (2025)
- Icons: Material-UI
- Fonts: Google Fonts

---

**Glamora** - Where Beauty Meets Luxury ✨
