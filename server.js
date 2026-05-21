const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ──
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// ── Routes ──
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/trips',    require('./routes/tripRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/members',  require('./routes/memberRoutes'));
app.use('/api/settle',   require('./routes/settleRoutes'));

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ message: '✅ PocketFriendly API is running', version: '1.0.0' });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PocketFriendly server running on port ${PORT}`);
});
