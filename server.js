const express = require('express');
const path = require('path');
const Datastore = require('nedb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const usersDb = new Datastore({ filename: 'users.db', autoload: true });

// Track active users in memory (Active in the last 30 seconds)
const activeSessions = new Map();

// Heartbeat endpoint to track live online users
app.post('/api/heartbeat', (req, res) => {
    const { username } = req.body;
    if (username) {
        activeSessions.set(username, Date.now());
    }
    res.sendStatus(200);
});

// Registration API
app.post('/api/register', (req, res) => {
    const { fullName, age, gender, place, username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    usersDb.findOne({ username }, (err, user) => {
        if (user) {
            return res.status(400).json({ error: "Username already exists" });
        }
        const newUser = {
            fullName,
            age,
            gender,
            place,
            username,
            password,
            registeredAt: new Date().toISOString()
        };
        usersDb.insert(newUser, (err, doc) => {
            res.json({ message: "Registration successful" });
        });
    });
});

// Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    usersDb.findOne({ username, password }, (err, user) => {
        if (user) {
            activeSessions.set(username, Date.now());
            res.json({ message: "Login successful", user });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

// Admin API to get all registered users & count live active users
app.get('/api/admin/stats', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== 'CPOADMIN123') { // Secret key to protect admin data
        return res.status(403).json({ error: "Access Denied" });
    }

    const now = Date.now();
    let liveCount = 0;
    const activeUsernames = [];

    // Clean up inactive users (no ping in last 30s)
    activeSessions.forEach((lastSeen, user) => {
        if (now - lastSeen < 30000) {
            liveCount++;
            activeUsernames.push(user);
        } else {
            activeSessions.delete(user);
        }
    });

    usersDb.find({}, { password: 0 }, (err, docs) => {
        res.json({
            totalRegistered: docs.length,
            currentlyOnline: liveCount,
            activeUsers: activeUsernames,
            allUsers: docs
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
