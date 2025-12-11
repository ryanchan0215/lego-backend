const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// ========================================
// 📋 獲取用戶所有對話
// ========================================
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📋 開始獲取對話，用戶 ID:', userId);

    const result = await pool.query(`
      SELECT 
        c.id,
        c.post_id,
        c.last_message_at,
        c.created_at,
        c.buyer_id,
        c.seller_id,
        
        -- ✅ 獲取帖子的第一個配件資料
        (
          SELECT json_build_object(
            'part_number', pi.part_number,
            'color', pi.color,
            'quantity', pi.quantity,
            'price_per_unit', pi.price_per_unit
          )
          FROM post_items pi
          WHERE pi.post_id = c.post_id
          ORDER BY pi.id
          LIMIT 1
        ) as post_item,
        
        -- ✅ 帖子類型
        p.type as post_type,
        
        -- 對方用戶資訊
        CASE 
          WHEN c.buyer_id = $1 THEN seller.username
          ELSE buyer.username
        END as other_username,
        
        CASE 
          WHEN c.buyer_id = $1 THEN c.seller_id
          ELSE c.buyer_id
        END as other_user_id,
        
        -- 最後訊息
        (
          SELECT content 
          FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        
        -- 未讀數
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE conversation_id = c.id 
            AND sender_id != $1 
            AND is_read = FALSE
        )::integer as unread_count
        
      FROM conversations c
      LEFT JOIN posts p ON c.post_id = p.id
      LEFT JOIN users buyer ON c.buyer_id = buyer.id
      LEFT JOIN users seller ON c.seller_id = seller.id
      WHERE c.buyer_id = $1 OR c.seller_id = $1
      ORDER BY c.last_message_at DESC
    `, [userId]);

    console.log('✅ 成功獲取對話，數量:', result.rows.length);

    // ✅ 格式化數據
    const conversations = result.rows.map(row => {
      const item = row.post_item || {};
      
      return {
        id: row.id,
        post_id: row.post_id,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
        
        // ✅ 商品標題（使用配件資訊）
        post_title: item.part_number 
          ? `#${item.part_number} ${item.color} ×${item.quantity}` 
          : '配件詳情',
        
        // ✅ 商品詳細資訊
        post_item: item,
        post_type: row.post_type,
        
        other_user: {
          id: row.other_user_id,
          username: row.other_username
        },
        last_message: row.last_message,
        last_message_time: row.last_message_at,  // ✅ 加這個
        unread_count: row.unread_count
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error('❌ 獲取對話失敗:', error);
    res.status(500).json({ 
      error: '伺服器錯誤', 
      details: error.message
    });
  }
});

// ========================================
// 💬 開始/獲取對話
// ========================================
router.post('/', async (req, res) => {
  try {
    const { post_id } = req.body;
    const buyerId = req.user.id;

    console.log('💬 開始對話請求:', { post_id, buyerId });

    if (!post_id) {
      return res.status(400).json({ error: '缺少 post_id' });
    }

    const postResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [post_id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    const sellerId = postResult.rows[0].user_id;

    if (buyerId === sellerId) {
      return res.status(400).json({ error: '不能跟自己對話' });
    }

    let conversation = await pool.query(
      `SELECT id FROM conversations 
       WHERE post_id = $1 AND buyer_id = $2 AND seller_id = $3`,
      [post_id, buyerId, sellerId]
    );

    let isNew = false;

    if (conversation.rows.length === 0) {
      conversation = await pool.query(
        `INSERT INTO conversations (post_id, buyer_id, seller_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [post_id, buyerId, sellerId]
      );
      isNew = true;
      console.log('✅ 創建新對話，ID:', conversation.rows[0].id);
    } else {
      console.log('✅ 對話已存在，ID:', conversation.rows[0].id);
    }

    res.json({
      conversation_id: conversation.rows[0].id,
      is_new: isNew
    });
  } catch (error) {
    console.error('❌ 創建對話失敗:', error);
    res.status(500).json({ error: '伺服器錯誤', details: error.message });
  }
});

// ========================================
// 📜 獲取對話訊息
// ========================================
router.get('/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    console.log('📜 獲取訊息:', { conversationId, userId });

    const conversationCheck = await pool.query(
      `SELECT * FROM conversations 
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [conversationId, userId]
    );

    if (conversationCheck.rows.length === 0) {
      return res.status(403).json({ error: '無權查看此對話' });
    }

    const result = await pool.query(
      `SELECT 
        m.id,
        m.sender_id,
        u.username as sender_username,
        m.content,
        m.is_read,
        m.created_at
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    console.log('✅ 成功獲取訊息，數量:', result.rows.length);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ 獲取訊息失敗:', error);
    res.status(500).json({ error: '伺服器錯誤', details: error.message });
  }
});

// ========================================
// ✉️ 發送訊息
// ========================================
router.post('/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const senderId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '訊息內容不能為空' });
    }

    const conversationCheck = await pool.query(
      `SELECT * FROM conversations 
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [conversationId, senderId]
    );

    if (conversationCheck.rows.length === 0) {
      return res.status(403).json({ error: '無權發送訊息到此對話' });
    }

    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, content, is_read, created_at`,
      [conversationId, senderId, content.trim()]
    );

    await pool.query(
      `UPDATE conversations 
       SET last_message_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [conversationId]
    );

    console.log('✅ 訊息已發送');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ 發送訊息失敗:', error);
    res.status(500).json({ error: '伺服器錯誤', details: error.message });
  }
});

// ========================================
// ✅ 標記對話已讀
// ========================================
router.put('/:id/read', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    await pool.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE conversation_id = $1 
         AND sender_id != $2 
         AND is_read = FALSE`,
      [conversationId, userId]
    );

    res.json({ message: '已標記為已讀' });
  } catch (error) {
    console.error('❌ 標記已讀失敗:', error);
    res.status(500).json({ error: '伺服器錯誤', details: error.message });
  }
});

// ========================================
// 🔔 獲取未讀訊息總數
// ========================================
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COUNT(*)::integer as count
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.buyer_id = $1 OR c.seller_id = $1)
         AND m.sender_id != $1
         AND m.is_read = FALSE`,
      [userId]
    );

    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error('❌ 獲取未讀數失敗:', error);
    res.status(500).json({ error: '伺服器錯誤', details: error.message });
  }
});

module.exports = router;