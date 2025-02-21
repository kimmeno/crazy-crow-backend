const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialize table on startup
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        await client.query('CREATE TABLE IF NOT EXISTS highscores (id SERIAL PRIMARY KEY, name TEXT NOT NULL, score INTEGER NOT NULL)');
        console.log('Highscores table created or already exists');
        client.release();
    } catch (e) {
        console.error('Failed to initialize database:', e.stack);
    }
}

pool.on('connect', () => console.log('Connected to PostgreSQL database'));
pool.on('error', (err) => console.error('Database pool error:', err.stack));

// Initialize database when server starts
initializeDatabase();

app.get('/highscores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM highscores ORDER BY score DESC');
        console.log('Fetched scores:', result.rows.length);
        res.json(result.rows);
    } catch (e) {
        console.error("Failed to fetch high scores:", e.stack);
        res.status(500).json({ error: 'Server error', details: e.message });
    }
});

app.post('/highscores', async (req, res) => {
    const { name, score } = req.body;
    console.log('Received POST:', { name, score });
    if (!name || typeof score !== 'number') {
        console.error('Invalid data received:', { name, score });
        return res.status(400).json({ error: 'Invalid data' });
    }
    try {
        await pool.query('INSERT INTO highscores (name, score) VALUES ($1, $2)', [name, score]);
        const result = await pool.query('SELECT * FROM highscores ORDER BY score DESC');
        console.log('Inserted score, new total:', result.rows.length);
        res.status(200).json(result.rows);
    } catch (e) {
        console.error("Failed to post score:", e.stack);
        res.status(500).json({ error: 'Server error', details: e.message });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));