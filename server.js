const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Safe database connection (won't crash if string is missing)
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cpo-mock";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB successfully");
}).catch(err => {
  console.log("MongoDB connection warning: Running without persistent DB or check MONGO_URI", err.message);
});

// Basic Route for testing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CPO AIR 1 CBT Platform</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px; }
            .card { background: #1e293b; padding: 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
            h1 { color: #38bdf8; }
            p { color: #94a3b8; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>CPO AIR 1 CBT Platform is Live!</h1>
            <p>Your application has successfully deployed and is running smoothly.</p>
        </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running live on port ${PORT}`);
});
