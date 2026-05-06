const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
    process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } } 
    : { user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT }
);

async function initDB() {
    console.log("Initialisation de la base de données...");
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table 'users' prête.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS videos (
                video_id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                user_id INTEGER REFERENCES users(id),
                stream_url VARCHAR(255) NOT NULL,
                genre VARCHAR(50) DEFAULT 'Autre',
                original_file VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table 'videos' prête.");
        console.log("Base de données initialisée avec succès !");
    } catch (err) {
        console.error("Erreur lors de l'initialisation de la DB:", err);
    } finally {
        process.exit(0);
    }
}

initDB();
