const express = require('express');
const Datastore = require('nedb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Initialize NeDB database
const db = {};
db.users = new Datastore({ filename: './database/users.db', autoload: true });

let activeHeartbeats = {};

// Clean inactive heartbeats every 30 seconds
setInterval(() => {
    const now = Date.now();
    for (const user in activeHeartbeats) {
        if (now - activeHeartbeats[user] > 30000) {
            delete activeHeartbeats[user];
        }
    }
}, 30000);

// Registration Endpoint
app.post('/api/register', (req, res) => {
    const { fullName, age, gender, place, username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.users.findOne({ username }, (err, existingUser) => {
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
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

        db.users.insert(newUser, (err, doc) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true, user: doc });
        });
    });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.users.findOne({ username, password }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ success: true, username: user.username });
    });
});

// Heartbeat Endpoint
app.post('/api/heartbeat', (req, res) => {
    const { username } = req.body;
    if (username) {
        activeHeartbeats[username] = Date.now();
    }
    res.json({ status: 'ok' });
});

// Admin Stats Endpoint
app.get('/api/admin/stats', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== 'CPOADMIN123') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    db.users.find({}, (err, users) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        const totalRegistered = users.length;
        const currentlyOnline = Object.keys(activeHeartbeats).length;

        res.json({
            totalRegistered,
            currentlyOnline,
            allUsers: users
        });
    });
});

// Fallback route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
