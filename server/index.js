const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const predictionsRoutes = require('./routes/predictions');
const leaderboardRoutes = require('./routes/leaderboard');
const prizePoolRoutes = require('./routes/prizepool');
const adminRoutes = require('./routes/admin');
const deadlinesRoutes = require('./routes/deadlines');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — CORS
// In production, frontend is served from the same origin (Express serves client/dist/),
// so CORS isn't strictly needed. Allow it broadly for flexibility.
const isProduction = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: isProduction
    ? true  // Allow all origins in production (same-origin anyway)
    : 'http://localhost:5173',  // Vite dev server in development
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/prize-pool', prizePoolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deadlines', deadlinesRoutes);

// Serve static files from client dist folder
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// SPA fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
