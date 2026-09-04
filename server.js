const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Datastore = require('@seald-io/nedb');
const path = require('path');

const app = express();
const usersDB = new Datastore({ filename: 'users.db', autoload: true });
const resultsDB = new Datastore({ filename: 'results.db', autoload: true });

app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'tab_s9_fe_secret_key_123',
    resave: false,
    saveUninitialized: false
}));

// 1. User Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

    usersDB.findOne({ username }, async (err, user) => {
        if (user) return res.status(400).json({ error: 'Username already exists' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        usersDB.insert({ username, password: hashedPassword }, (err, newUser) => {
            req.session.userId = newUser._id;
            req.session.username = newUser.username;
            res.json({ success: true, username: newUser.username });
        });
    });
});

// 2. User Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    usersDB.findOne({ username }, async (err, user) => {
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        req.session.userId = user._id;
        req.session.username = user.username;
        res.json({ success: true, username: user.username });
    });
});

// 3. Check Authentication Session
app.get('/api/me', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// 4. Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 5. Save Test Score
app.post('/api/save-result', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const resultData = {
        userId: req.session.userId,
        testTitle: req.body.testTitle,
        score: req.body.score,
        total: req.body.total,
        date: new Date().toLocaleDateString()
    };

    resultsDB.insert(resultData, () => {
        res.json({ success: true });
    });
});

// 6. Get Saved Test History
app.get('/api/my-history', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    resultsDB.find({ userId: req.session.userId }, (err, docs) => {
        res.json(docs);
    });
});

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});
