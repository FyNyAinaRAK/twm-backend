const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'twm_streaming',
    password: 'admin',
    port: 5432
});

async function run() {
    try {
        await pool.query(`ALTER TABLE videos ADD COLUMN genre VARCHAR(50) DEFAULT 'Autre'`);
        console.log("Added genre");
    } catch (e) {
        console.log("genre might already exist");
    }
    try {
        await pool.query(`ALTER TABLE videos ADD COLUMN original_file VARCHAR(255)`);
        console.log("Added original_file");
    } catch (e) {
        console.log("original_file might already exist");
    }
    process.exit(0);
}
run();
