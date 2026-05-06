const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Priorité aux Cookies (pour le streaming), puis Header (pour l'API)
    const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
};

module.exports = { verifyToken };
