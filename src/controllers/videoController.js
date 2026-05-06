const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const pool = require('../config/db');

// Stockage des jobs de conversion en cours
const conversionJobs = {};

/**
 * UPLOAD + DÉMARRAGE DE LA CONVERSION EN ARRIÈRE-PLAN
 */
const uploadVideo = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier vidéo fourni.' });
    }

    const videoId = uuidv4();
    const title = req.body.title || req.file.originalname;
    const genre = req.body.genre || 'Autre';
    const inputPath = req.file.path;
    const originalFileUrl = `/uploads/${req.file.filename}`;
    const outputDir = path.join(__dirname, '../../hls', videoId);
    const userId = req.user ? req.user.id : null;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'index.m3u8');
    const streamUrl = `/hls/${videoId}/index.m3u8`;

    console.log(`[${videoId}] Démarrage de la conversion...`);

    // 1. Enregistrer dans la base de données
    try {
        await pool.query(
            'INSERT INTO videos (video_id, title, user_id, stream_url, genre, original_file) VALUES ($1, $2, $3, $4, $5, $6)',
            [videoId, title, userId, streamUrl, genre, originalFileUrl]
        );
    } catch (err) {
        console.error('Erreur DB lors de l\'insertion de la vidéo:', err);
        // On continue quand même la conversion, mais l'erreur est logguée
    }

    // 2. Marquer le job comme en cours
    conversionJobs[videoId] = { status: 'converting', progress: 0, error: null };

    let firstSegmentReady = false;

    const command = ffmpeg(inputPath, { timeout: 432000 })
        .addOptions([
            '-c:v libx264',
            '-preset ultrafast',
            '-crf 23',
            '-profile:v baseline',
            '-level 3.0',
            '-force_key_frames', 'expr:gte(t,n_forced*4)',
            '-c:a aac',
            '-ar 44100',
            '-b:a 128k',
            '-start_number 0',
            '-hls_time 4',
            '-hls_list_size 0',
            '-f hls'
        ])
        .output(outputPath)
        .on('progress', (progress) => {
            conversionJobs[videoId].progress = Math.round(progress.percent || 0);

            if (!firstSegmentReady) {
                // Vérifier si au moins le premier segment est créé
                if (fs.existsSync(path.join(outputDir, 'index0.ts'))) {
                    firstSegmentReady = true;
                    res.json({
                        message: 'Streaming démarré ! La conversion continue en arrière-plan.',
                        videoId: videoId,
                        streamUrl: streamUrl,
                        statusUrl: `/api/videos/status/${videoId}`
                    });
                }
            }
        })
        .on('end', () => {
            conversionJobs[videoId].status = 'completed'; // Changé de 'done' à 'completed'
            conversionJobs[videoId].progress = 100;
            console.log(`[${videoId}] Conversion terminée.`);

            if (!firstSegmentReady) {
                res.json({
                    message: 'Vidéo uploadée et convertie.',
                    videoId: videoId,
                    streamUrl: streamUrl,
                    statusUrl: `/api/videos/status/${videoId}`
                });
            }
        })
        .on('error', (err) => {
            conversionJobs[videoId].status = 'error';
            conversionJobs[videoId].error = err.message;
            if (!res.headersSent) {
                res.status(500).json({ message: 'Erreur lors du traitement.' });
            }
        });

    command.run();
};

/**
 * LISTER TOUTES LES VIDÉOS
 */
const listVideos = async (req, res) => {
    try {
        let query = 'SELECT videos.*, users.username FROM videos LEFT JOIN users ON videos.user_id = users.id WHERE 1=1';
        let values = [];
        let index = 1;

        if (req.query.mine === 'true') {
            query += ` AND videos.user_id = $${index++}`;
            values.push(req.user.id);
        }
        if (req.query.genre && req.query.genre !== 'Tous') {
            query += ` AND videos.genre = $${index++}`;
            values.push(req.query.genre);
        }
        if (req.query.search) {
            query += ` AND videos.title ILIKE $${index++}`;
            values.push(`%${req.query.search}%`);
        }

        query += ' ORDER BY videos.created_at DESC';
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des vidéos.' });
    }
};

/**
 * STATUT DE CONVERSION
 */
const getVideoStatus = (req, res) => {
    const { videoId } = req.params;
    const job = conversionJobs[videoId];
    if (!job) return res.status(404).json({ message: 'Job introuvable.' });
    res.json({ videoId, status: job.status, progress: job.progress, error: job.error });
};

/**
 * SUPPRIMER UNE VIDÉO
 */
const deleteVideo = async (req, res) => {
    const { videoId } = req.params;

    try {
        // 1. Récupérer les infos de la vidéo
        const video = await pool.query('SELECT * FROM videos WHERE video_id = $1', [videoId]);
        
        if (video.rows.length === 0) {
            return res.status(404).json({ message: 'Vidéo introuvable.' });
        }

        // 2. Supprimer de la base de données
        await pool.query('DELETE FROM videos WHERE video_id = $1', [videoId]);

        // 3. Supprimer les fichiers physiques
        const videoDir = path.join(__dirname, '../../hls', videoId);
        if (fs.existsSync(videoDir)) {
            fs.rmSync(videoDir, { recursive: true, force: true });
            console.log(`[${videoId}] Fichiers HLS supprimés.`);
        }
        
        if (video.rows[0].original_file) {
            const originalPath = path.join(__dirname, '../../', video.rows[0].original_file);
            if (fs.existsSync(originalPath)) {
                fs.unlinkSync(originalPath);
            }
        }

        res.json({ message: 'Vidéo supprimée avec succès.' });
    } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        res.status(500).json({ message: 'Erreur lors de la suppression de la vidéo.' });
    }
};

module.exports = { uploadVideo, getVideoStatus, listVideos, deleteVideo };


