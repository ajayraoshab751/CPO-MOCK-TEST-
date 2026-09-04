const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const users = [];
const testResults = []; // Stores attempt history
let activeHeartbeats = {};

// Clean inactive heartbeats
setInterval(() => {
    const now = Date.now();
    for (const user in activeHeartbeats) {
        if (now - activeHeartbeats[user] > 30000) delete activeHeartbeats[user];
    }
}, 30000);

// Register
app.post('/api/register', (req, res) => {
    const { fullName, age, gender, place, username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username & password required' });
    if (users.find(u => u.username === username)) return res.status(400).json({ error: 'User already exists' });
    
    const newUser = { fullName, age, gender, place, username, password, registeredAt: new Date().toISOString() };
    users.push(newUser);
    res.json({ success: true, user: newUser });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, username: user.username });
});

// Save Test Submission (Allows max 20 re-attempts)
app.post('/api/submit-test', (req, res) => {
    const { username, score, percentage, timeTaken, correct, incorrect, unattempted, markedForReview } = req.body;
    
    const userAttempts = testResults.filter(r => r.username === username);
    if (userAttempts.length >= 20) {
        return res.status(400).json({ error: 'Attempt limit reached! You have used all 20 attempts.' });
    }

    const attemptData = {
        id: Date.now(),
        username,
        attemptNumber: userAttempts.length + 1,
        score,
        percentage,
        timeTaken,
        correct,
        incorrect,
        unattempted,
        markedForReview,
        submittedAt: new Date().toISOString()
    };

    testResults.push(attemptData);
    res.json({ success: true, attemptNumber: attemptData.attemptNumber, remainingAttempts: 20 - attemptData.attemptNumber });
});

// Fetch Attempt History
app.get('/api/attempts/:username', (req, res) => {
    const userAttempts = testResults.filter(r => r.username === req.params.username);
    res.json({ attempts: userAttempts, totalAttempts: userAttempts.length, maxAllowed: 20 });
});

// Heartbeat
app.post('/api/heartbeat', (req, res) => {
    if (req.body.username) activeHeartbeats[req.body.username] = Date.now();
    res.json({ status: 'ok' });
});

// Admin Stats
app.get('/api/admin/stats', (req, res) => {
    if (req.query.key !== 'CPOADMIN123') return res.status(403).json({ error: 'Unauthorized' });
    res.json({ totalRegistered: users.length, currentlyOnline: Object.keys(activeHeartbeats).length, allUsers: users, allResults: testResults });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
