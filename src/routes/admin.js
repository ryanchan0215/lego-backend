const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ========================================
// 🔒 檢查管理員權限
// ========================================
const requireAdmin = async (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '需要管理員權限' });
  }
  next();
};

router.use(authenticateToken);
router.use(requireAdmin);

// ========================================
// 📊 取得所有用戶
// ========================================
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.tokens,
        u.total_tokens_used,
        u.is_admin,
        u.created_at,
        u.last_login,
        COUNT(DISTINCT p.id) as posts_count,
        COUNT(DISTINCT l.id) as likes_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN likes l ON u.id = l.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('獲取用戶失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ========================================
// ➕ 增加用戶 Token
// ========================================
router.post('/users/:id/add-tokens', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.params.id;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '數量必須大於 0' });
    }

    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT username, tokens FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '用戶不存在' });
    }

    const user = userResult.rows[0];
    const newBalance = user.tokens + amount;

    await client.query(
      'UPDATE users SET tokens = tokens + $1 WHERE id = $2',
      [amount, userId]
    );

    await client.query(
      `INSERT INTO token_transactions (user_id, action, tokens_changed, balance_after, description)
       VALUES ($1, 'admin_add', $2, $3, $4)`,
      [userId, amount, newBalance, description || `管理員增加 ${amount} 次發佈機會`]
    );

    await client.query('COMMIT');

    res.json({ 
      success: true,
      username: user.username,
      old_balance: user.tokens,
      new_balance: newBalance,
      message: `已為 ${user.username} 增加 ${amount} 次發佈機會`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('增加 Token 失敗:', error);
    res.status(500).json({ error: '操作失敗' });
  } finally {
    client.release();
  }
});

// ========================================
// 📈 Token 使用統計（每日）
// ========================================
router.get('/stats/daily-tokens', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions_count,
        SUM(CASE WHEN tokens_changed < 0 THEN ABS(tokens_changed) ELSE 0 END) as tokens_used,
        SUM(CASE WHEN tokens_changed > 0 THEN tokens_changed ELSE 0 END) as tokens_added
      FROM token_transactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('獲取統計失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ========================================
// 📊 總覽統計
// ========================================
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM posts WHERE status = 'available') as active_posts,
        (SELECT COUNT(*) FROM posts WHERE type = 'sell' AND status = 'available') as sell_posts,
        (SELECT COUNT(*) FROM posts WHERE type = 'buy' AND status = 'available') as buy_posts,
        (SELECT SUM(tokens) FROM users) as total_tokens_remaining,
        (SELECT SUM(total_tokens_used) FROM users) as total_tokens_used,
        (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '7 days') as active_users_7d
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('獲取總覽失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ========================================
// 📜 取得用戶 Token 歷史
// ========================================
router.get('/users/:id/token-history', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const result = await pool.query(`
      SELECT 
        id,
        action,
        tokens_changed,
        balance_after,
        description,
        created_at
      FROM token_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('獲取歷史失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

module.exports = router;