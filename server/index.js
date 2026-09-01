const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

// Load environment variables
dotenv.config();

const app = express();

// Ensure DB Connection and initial data seeding
connectDB().then(() => {
  seedAdmin();
});

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// CORS setup allowing credentials dynamically
app.use(cors({
  origin: function (origin, callback) {
    // Reflect request origin to support cross-domain credentials (cookie authentication)
    callback(null, origin || true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Route Mounts (Supports both /api/* and /* paths)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/auth', require('./routes/authRoutes'));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/users', require('./routes/userRoutes'));

app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));

app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/complaints', require('./routes/complaintRoutes'));

// Health check endpoint
app.get(['/api/health', '/health', '/api', '/'], (req, res) => {
  res.json({ status: 'OK', message: 'Smart Complaint Management System API operational' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Only listen locally, export app for Vercel Serverless
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
