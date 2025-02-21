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

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to PostgreSQL database');

    client.query('CREATE TABLE IF NOT EXISTS highscores (id SERIAL PRIMARY KEY, name TEXT, score INTEGER)', (err) => {
        release();
        if (err) {
            console.error('Failed to create table:', err.stack);
        } else {
            console.log('Highscores table created or already exists');
        }
    });
});

app.get('/highscores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM highscores ORDER BY score DESC');
        res.json(result.rows);
    } catch (e) {
        console.error("Failed to fetch high scores:", e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/highscores', async (req, res) => {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') return res.status(400).json({ error: 'Invalid data' });
    try {
        await pool.query('INSERT INTO highscores (name, score) VALUES ($1, $2)', [name, score]);
        const result = await pool.query('SELECT * FROM highscores ORDER BY score DESC');
        res.status(200).json(result.rows);
    } catch (e) {
        console.error("Failed to post score:", e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));