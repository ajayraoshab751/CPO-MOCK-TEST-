const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cpo-mock";
mongoose.connect(MONGO_URI).then(() => {
  console.log("Connected to MongoDB successfully");
}).catch(err => {
  console.log("MongoDB connection warning:", err.message);
});

// Serve frontend safely without string syntax errors
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running live on port ${PORT}`);
});
