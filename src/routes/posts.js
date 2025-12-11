const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ========================================
// 📝 發佈交易（✅ condition 存入 post_items）
// ========================================
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { type, items, contact_info, notes } = req.body;
    const userId = req.user.id;

    if (!type || !items || items.length === 0) {
      return res.status(400).json({ error: '請填寫交易類型和配件清單' });
    }

    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT tokens FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0].tokens < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: '發佈次數不足，請聯絡客服購買' 
      });
    }

    await client.query(
      'UPDATE users SET tokens = tokens - 1, total_tokens_used = total_tokens_used + 1 WHERE id = $1',
      [userId]
    );

    const newBalance = userResult.rows[0].tokens - 1;

    await client.query(
      `INSERT INTO token_transactions (user_id, action, tokens_changed, balance_after, description)
       VALUES ($1, 'post_create', -1, $2, '發佈交易')`,
      [userId, newBalance]
    );

    const postResult = await client.query(
      `INSERT INTO posts (user_id, type, contact_info, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, type, contact_info, notes]
    );

    const post = postResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO post_items (
          post_id, 
          part_number, 
          part_name, 
          part_image_url, 
          color, 
          quantity, 
          price_per_unit,
          condition
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          post.id, 
          item.part_number, 
          item.part_name || null, 
          item.part_image_url || null, 
          item.color, 
          item.quantity, 
          item.price_per_unit,
          item.condition || null
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: '發佈成功！剩餘發佈次數：' + newBalance,
      post,
      remaining_tokens: newBalance
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('發佈錯誤:', error);
    res.status(500).json({ error: '發佈失敗，請稍後再試' });
  } finally {
    client.release();
  }
});

// ========================================
// 📋 取得所有交易（✅ 從 post_items 讀取 condition）
// ========================================
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    const currentUserId = req.user?.id || null;

    let query = `
      SELECT 
        p.*, 
        u.username, 
        u.phone,
        COALESCE(
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id), 
          0
        ) as likes_count,
        ${currentUserId ? `EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${currentUserId})` : 'false'} as is_liked,
        json_agg(
          json_build_object(
            'id', pi.id,
            'part_number', pi.part_number,
            'part_name', pi.part_name,
            'part_image_url', pi.part_image_url,
            'color', pi.color,
            'quantity', pi.quantity,
            'price_per_unit', pi.price_per_unit,
            'condition', pi.condition
          ) ORDER BY pi.id
        ) as items
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN post_items pi ON p.id = pi.post_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND p.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ' GROUP BY p.id, u.username, u.phone ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);

    res.json(result.rows);

  } catch (error) {
    console.error('取得交易錯誤:', error);
    res.status(500).json({ error: '無法取得交易列表' });
  }
});

// ========================================
// 📦 取得我的交易（✅ 從 post_items 讀取 condition）
// ========================================
router.get('/my-posts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              u.username,
              COALESCE(
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id), 
                0
              ) as likes_count,
              json_agg(
                json_build_object(
                  'id', pi.id,
                  'part_number', pi.part_number,
                  'part_name', pi.part_name,
                  'part_image_url', pi.part_image_url,
                  'color', pi.color,
                  'quantity', pi.quantity,
                  'price_per_unit', pi.price_per_unit,
                  'condition', pi.condition
                ) ORDER BY pi.id
              ) as items
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN post_items pi ON p.id = pi.post_id
       WHERE p.user_id = $1
       GROUP BY p.id, u.username
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('取得我的交易錯誤:', error);
    res.status(500).json({ error: '無法取得交易列表' });
  }
});

// ========================================
// 👑 管理員：取得所有用戶的交易（✅ 修正這裡）
// ========================================
router.get('/all-posts', authenticateToken, async (req, res) => {
  try {
    // ✅ 改用 is_admin 檢查
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '無權限訪問' });
    }

    const result = await pool.query(
      `SELECT p.*, 
              u.username,
              COALESCE(
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id), 
                0
              ) as likes_count,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked,
              json_agg(
                json_build_object(
                  'id', pi.id,
                  'part_number', pi.part_number,
                  'part_name', pi.part_name,
                  'part_image_url', pi.part_image_url,
                  'color', pi.color,
                  'quantity', pi.quantity,
                  'price_per_unit', pi.price_per_unit,
                  'condition', pi.condition
                ) ORDER BY pi.id
              ) as items
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN post_items pi ON p.id = pi.post_id
       GROUP BY p.id, u.username
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('取得所有交易錯誤:', error);
    res.status(500).json({ error: '無法取得交易列表' });
  }
});

// ========================================
// ✏️ 編輯貼文（✅ 修正：更新 post_items.condition）
// ========================================
router.put('/:id/edit', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: '請提供要修改的配件資料' });
    }

    await client.query('BEGIN');

    const postCheck = await client.query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (postCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '找不到此貼文或無權編輯' });
    }

    const userResult = await client.query(
      'SELECT tokens FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0].tokens < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: '發佈次數不足，無法編輯貼文' 
      });
    }

    await client.query(
      'UPDATE users SET tokens = tokens - 1, total_tokens_used = total_tokens_used + 1 WHERE id = $1',
      [userId]
    );

    const newBalance = userResult.rows[0].tokens - 1;

    await client.query(
      `INSERT INTO token_transactions (user_id, action, tokens_changed, balance_after, description)
       VALUES ($1, 'post_edit', -1, $2, $3)`,
      [userId, newBalance, `編輯貼文 #${postId}`]
    );

    for (const item of items) {
      const itemCheck = await client.query(
        'SELECT * FROM post_items WHERE id = $1 AND post_id = $2',
        [item.id, postId]
      );

      if (itemCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `配件 ID ${item.id} 不屬於此貼文` });
      }

      await client.query(
        `UPDATE post_items 
         SET quantity = $1, 
             price_per_unit = $2, 
             condition = $3
         WHERE id = $4`,
        [item.quantity, item.price_per_unit, item.condition || null, item.id]
      );
    }

    await client.query(
      'UPDATE posts SET updated_at = NOW() WHERE id = $1',
      [postId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '修改成功！剩餘發佈次數：' + newBalance,
      remaining_tokens: newBalance
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('編輯貼文錯誤:', error);
    res.status(500).json({ error: '編輯失敗，請稍後再試' });
  } finally {
    client.release();
  }
});

// ========================================
// ❤️ 點讚/取消點讚
// ========================================
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const postCheck = await pool.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const likeCheck = await pool.query(
      'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    let isLiked;

    if (likeCheck.rows.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      isLiked = false;
    } else {
      await pool.query(
        'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
        [postId, userId]
      );
      isLiked = true;
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM likes WHERE post_id = $1',
      [postId]
    );

    const likesCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      is_liked: isLiked,
      likes_count: likesCount,
      message: isLiked ? '點讚成功' : '取消點讚'
    });

  } catch (error) {
    console.error('點讚錯誤:', error);
    res.status(500).json({ error: '操作失敗' });
  }
});

// ========================================
// 💬 獲取帖子留言（半私密）
// ========================================
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.user.id;

    const postResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const postOwnerId = postResult.rows[0].user_id;
    const isPostOwner = currentUserId === postOwnerId;

    let commentsResult;

    if (isPostOwner) {
      commentsResult = await pool.query(
        `SELECT c.*, u.username 
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = $1
         ORDER BY c.created_at DESC`,
        [postId]
      );
    } else {
      commentsResult = await pool.query(
        `SELECT c.*, u.username 
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = $1 AND c.user_id = $2
         ORDER BY c.created_at DESC`,
        [postId, currentUserId]
      );
    }

    res.json({
      comments: commentsResult.rows,
      is_post_owner: isPostOwner,
      total_comments: commentsResult.rows.length
    });

  } catch (error) {
    console.error('獲取留言錯誤:', error);
    res.status(500).json({ error: '無法獲取留言' });
  }
});

// ========================================
// 💬 新增留言
// ========================================
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '留言內容不能為空' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: '留言不能超過 500 字' });
    }

    const postCheck = await pool.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, user_id, content, created_at`,
      [postId, userId, content.trim()]
    );

    const comment = result.rows[0];

    const userResult = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: '留言成功',
      comment: {
        ...comment,
        username: userResult.rows[0].username
      }
    });

  } catch (error) {
    console.error('留言錯誤:', error);
    res.status(500).json({ error: '留言失敗' });
  }
});

// ========================================
// 🗑️ 刪除留言
// ========================================
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const commentCheck = await pool.query(
      'SELECT * FROM comments WHERE id = $1 AND post_id = $2 AND user_id = $3',
      [commentId, postId, userId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: '找不到此留言或無權刪除' });
    }

    await pool.query(
      'DELETE FROM comments WHERE id = $1',
      [commentId]
    );

    res.json({ 
      success: true,
      message: '留言已刪除' 
    });

  } catch (error) {
    console.error('刪除留言錯誤:', error);
    res.status(500).json({ error: '刪除失敗' });
  }
});

// ========================================
// 🗑️ 刪除交易（✅ 支援管理員刪除所有貼文）
// ========================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;  // ✅ 改用 is_admin

    const postResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到此交易' });
    }

    const postOwnerId = postResult.rows[0].user_id;

    // ✅ 改用 is_admin 檢查
    if (postOwnerId !== userId && !isAdmin) {
      return res.status(403).json({ error: '無權限刪除此貼文' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    res.json({ 
      success: true,
      message: '刪除成功' 
    });

  } catch (error) {
    console.error('刪除錯誤:', error);
    res.status(500).json({ error: '刪除失敗' });
  }
});

module.exports = router;