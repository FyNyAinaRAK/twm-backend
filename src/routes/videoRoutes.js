const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideoStatus, listVideos, deleteVideo } = require('../controllers/videoController');
const { verifyToken } = require('../middleware/authMiddleware');

const fs = require('fs');

// Configuration de Multer pour l'upload de vidéos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'video/mp4') {
            cb(null, true);
        } else {
            cb(new Error('Format non supporté. Seul le MP4 est accepté.'));
        }
    }
});

// Route pour lister les vidéos
router.get('/', verifyToken, listVideos);

// Route pour supprimer une vidéo
router.delete('/:videoId', verifyToken, deleteVideo);

// Route d'upload et conversion (protégée par JWT)
router.post('/upload', verifyToken, upload.single('video'), uploadVideo);

// Route de statut de conversion (protégée par JWT)
router.get('/status/:videoId', verifyToken, getVideoStatus);

module.exports = router;
