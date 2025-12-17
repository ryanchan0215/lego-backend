const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ 驗證 JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要登入' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token 無效或已過期' });
    }
    req.user = user;
    next();
  });
}

// ✅ 檢查管理員權限（從資料庫查詢）
async function authenticateAdmin(req, res, next) {
  try {
    // ✅ 確保 req.user 已經由 authenticateToken 設定
    if (!req.user) {
      return res.status(401).json({ error: '需要登入' });
    }

    // ✅ 從資料庫查詢最新的 is_admin 狀態
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('查詢用戶權限失敗:', error);
      return res.status(500).json({ error: '查詢權限失敗' });
    }

    if (!data || !data.is_admin) {
      return res.status(403).json({ error: '需要管理員權限' });
    }

    next();
  } catch (error) {
    console.error('檢查管理員權限失敗:', error);
    res.status(500).json({ error: '檢查權限失敗' });
  }
}

module.exports = { authenticateToken, authenticateAdmin };