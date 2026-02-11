const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shootout2026-dev-key';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      first_login_complete: user.first_login_complete,
      display_name: user.display_name
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = {
  verifyToken,
  requireAdmin,
  generateToken,
  JWT_SECRET
};
