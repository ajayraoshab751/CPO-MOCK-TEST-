const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));
}

app.post('/api/login', (req, res) => {
  const { email, password, name } = req.body;
  const isAdmin = (email === 'ajayraoshab751@gmail.com' && password === 'sunitadevi');
  
  return res.json({ 
    success: true, 
    isAdmin, 
    user: { email, name: name || 'User', isAdmin } 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
