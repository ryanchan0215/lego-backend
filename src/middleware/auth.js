const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要登入' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token 無效' });
    }
    req.user = user;
    next();
  });
}

function authenticateAdmin(req, res, next) {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '需要管理員權限' });
  }
  next();
}

module.exports = { authenticateToken, authenticateAdmin };