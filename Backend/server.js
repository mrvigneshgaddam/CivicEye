require('dotenv').config();
const express = require('express');
// const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const policeRoutes = require('./routes/policeRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Static files (evidence uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/v1/auth', authRoutes);

app.use(cors({
  origin: 'http://localhost:3000', // Your frontend origin
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/landing/reset-password.html'));
});
app.get('/check-path', (req, res) => {
  const fullPath = path.join(__dirname, '../Frontend/landing/reset-password.html');
  res.send({
    exists: require('fs').existsSync(fullPath),
    path: fullPath
  });
});
//  Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


app.use(express.static(path.join(__dirname, '../Frontend')));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
