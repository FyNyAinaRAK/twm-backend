const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Priorité aux Cookies, puis Header, puis Query Param (très utile pour le streaming vidéo cross-origin)
    const token = req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]) ||
                  req.query.token;

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
