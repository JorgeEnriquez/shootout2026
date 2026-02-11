const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, saveDb } = require('../db');
const { verifyToken, generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDb();

    // Check if email already exists
    const existing = db.exec('SELECT user_id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (email, password_hash, role, is_active, first_login_complete)
       VALUES (?, ?, 'participant', 1, 0)`,
      [email.toLowerCase(), password_hash]
    );
    saveDb();

    // Fetch the newly created user
    const results = db.exec('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const userRow = results[0].values[0];
    const columns = results[0].columns;
    const user = {};
    columns.forEach((col, idx) => {
      user[col] = userRow[idx];
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        first_login_complete: user.first_login_complete
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = await getDb();
    const results = db.exec('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0 || results[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userRow = results[0].values[0];
    const columns = results[0].columns;
    const user = {};
    columns.forEach((col, idx) => {
      user[col] = userRow[idx];
    });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        first_login_complete: user.first_login_complete
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/display-name
router.post('/display-name', verifyToken, async (req, res) => {
  try {
    const { display_name } = req.body;
    const user_id = req.user.user_id;

    if (!display_name || display_name.trim() === '') {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const db = await getDb();
    db.run(
      'UPDATE users SET display_name = ?, first_login_complete = 1 WHERE user_id = ?',
      [display_name, user_id]
    );
    saveDb();

    // Return updated user info
    const results = db.exec('SELECT * FROM users WHERE user_id = ?', [user_id]);
    const userRow = results[0].values[0];
    const columns = results[0].columns;
    const user = {};
    columns.forEach((col, idx) => {
      user[col] = userRow[idx];
    });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        first_login_complete: user.first_login_complete
      }
    });
  } catch (error) {
    console.error('Display name update error:', error);
    res.status(500).json({ error: 'Failed to update display name' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const db = await getDb();
    const results = db.exec('SELECT * FROM users WHERE user_id = ?', [req.user.user_id]);

    if (results.length === 0 || results[0].values.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRow = results[0].values[0];
    const columns = results[0].columns;
    const user = {};
    columns.forEach((col, idx) => {
      user[col] = userRow[idx];
    });

    res.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        first_login_complete: user.first_login_complete
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
