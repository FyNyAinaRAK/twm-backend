const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
const videoRoutes = require('./src/routes/videoRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { verifyToken } = require('./src/middleware/authMiddleware');

// 1. Servir l'application mobile (frontend)
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(__dirname, '../mobile/www/index.html'));
});
app.use(express.static(path.join(__dirname, '../mobile/www')));

// 2. Rendre le dossier HLS protégé par JWT (Cookies)
app.use('/hls', verifyToken, express.static(path.join(__dirname, 'hls')));
app.use('/uploads', verifyToken, express.static(path.join(__dirname, 'uploads')));

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
