const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// ========================================
// 🎁 睇廣告賺 Token
// ========================================
router.post('/earn', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;

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
    const earnAmount = 1;
    const newBalance = user.tokens + earnAmount;

    await client.query(
      'UPDATE users SET tokens = tokens + $1 WHERE id = $2',
      [earnAmount, userId]
    );

    await client.query(
      `INSERT INTO token_transactions (
        user_id, 
        action, 
        tokens_changed, 
        balance_after, 
        description
      )
      VALUES ($1, 'ad_watched', $2, $3, $4)`,
      [userId, earnAmount, newBalance, `觀看廣告賺取 ${earnAmount} 次發佈機會`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      earned: earnAmount,
      new_balance: newBalance,
      message: `恭喜！你獲得 ${earnAmount} 次發佈機會`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('賺 Token 失敗:', error);
    res.status(500).json({ error: '操作失敗' });
  } finally {
    client.release();
  }
});

module.exports = router;