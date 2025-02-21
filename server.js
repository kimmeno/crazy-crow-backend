const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow your FTP domain
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const highScoresFile = path.join(__dirname, 'highscores.json');

async function initHighScores() {
    try {
        await fs.access(highScoresFile);
    } catch {
        await fs.writeFile(highScoresFile, JSON.stringify([]));
    }
}

async function loadHighScores() {
    const data = await fs.readFile(highScoresFile, 'utf8');
    return JSON.parse(data);
}

async function saveHighScores(scores) {
    await fs.writeFile(highScoresFile, JSON.stringify(scores, null, 2));
}

app.get('/highscores', async (req, res) => {
    const scores = await loadHighScores();
    res.json(scores);
});

app.post('/highscores', async (req, res) => {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') return res.status(400).json({ error: 'Invalid data' });
    const scores = await loadHighScores();
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 10); // Top 10
    await saveHighScores(topScores);
    res.status(200).json(topScores);
});

initHighScores().then(() => {
    app.listen(port, () => console.log(`Server running on port ${port}`));
});