# 🚀 Lego Forum Backend - Project Summary

**生成時間**: 2025-12-17 23:27:39
**項目路徑**: E:\Lego\lego-backend

---

## 📁 Backend File Structure

```
├── src
│   ├── config
│   ├── middleware
│   │   └── auth.js (701B)
│   ├── routes
│   │   ├── admin.js (5.5KB)
│   │   ├── auth.js (6.2KB)
│   │   ├── conversations.js (9.2KB)
│   │   ├── leog.js (914B)
│   │   ├── posts.js (15.7KB)
│   │   ├── sms.js (2.2KB)
│   │   └── tokens.js (1.8KB)
│   ├── db.js (558B)
│   └── server.js (2.9KB)
├── .env (271B)
├── .gitignore (58B)
├── generate_backend_summary.py (11.7KB)
├── package-lock.json (58.7KB)
└── package.json (407B)
```

---

## 📦 Dependencies Overview

### Production Dependencies

- `express`: ^4.18.2
- `pg`: ^8.11.3
- `bcryptjs`: ^2.4.3
- `jsonwebtoken`: ^9.0.2
- `cors`: ^2.8.5
- `dotenv`: ^16.3.1

### Development Dependencies

- `nodemon`: ^3.0.1

---

## 📄 Source Code Files

#### 📄 `package.json`

```json
{
  "name": "lego-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.x"
  }
}
```

#### 📄 `.env`

```env
# ⚠️ 敏感資訊已隱藏，以下為結構範例：



PORT=***HIDDEN***
NODE_ENV=***HIDDEN***

DB_USER=***HIDDEN***
DB_HOST=***HIDDEN***
DB_NAME=***HIDDEN***
DB_PASSWORD=***HIDDEN***
DB_PORT=***HIDDEN***

JWT_SECRET=***HIDDEN***
FRONTEND_URL=***HIDDEN***
```

#### 📄 `src\server.js`

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const conversationsRoutes = require('./routes/conversations');
const adminRoutes = require('./routes/admin');
const tokensRoutes = require('./routes/tokens');

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// 🔧 中介軟體
// ========================================
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ========================================
// 🛣️ 路由
// ========================================
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tokens', tokensRoutes);

// ========================================
// 🏠 根路徑
// ========================================
app.get('/', (req, res) => {
  res.json({ 
    name: '👶 嬰幼兒產品交易平台 API',  // ✅ 改
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      authentication: '/api/auth',
      posts: '/api/posts',
      conversations: '/api/conversations',
      admin: '/api/admin',
      tokens: '/api/tokens'
    }
  });
});

// ========================================
// 🩺 健康檢查路由
// ========================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '伺服器運行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ========================================
// ❌ 404 錯誤處理
// ========================================
app.use((req, res) => {
  res.status(404).json({ 
    error: '路徑不存在',
    path: req.path,
    method: req.method
  });
});

// ========================================
// ⚠️ 全域錯誤處理
// ========================================
app.use((err, req, res, next) => {
  console.error('❌ 伺服器錯誤:', err);
  res.status(500).json({ 
    error: '伺服器內部錯誤',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================================
// 🚀 啟動伺服器
// ========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 伺服器運行在 port ${PORT}`);
  console.log(`📝 環境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 CORS 允許來源: ${process.env.FRONTEND_URL || '*'}`);
});
```

#### 📄 `src\db.js`

```javascript
const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

// 強制 IPv4
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ 資料庫連接成功');
    client.release();
  } catch (err) {
    console.error('❌ 連接失敗:', err.message);
  }
})();

module.exports = pool;
```

### 🛣️ Routes (API Endpoints)

#### 📄 `src\routes\admin.js`

```javascript
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
```

#### 📄 `src\routes\auth.js`

```javascript
// E:\Lego\lego-backend\src\routes\auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ========================================
// 🔐 註冊路由
// ========================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // 驗證必填欄位
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: '所有欄位都是必填的' });
    }

    // 驗證用戶名稱長度
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: '用戶名稱必須是 3-20 個字符' });
    }

    // 驗證密碼長度
    if (password.length < 6) {
      return res.status(400).json({ error: '密碼必須至少 6 個字符' });
    }

    // 驗證電話格式（香港電話：8位數字）
    const phoneRegex = /^\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: '請輸入有效的香港電話號碼（8位數字）' });
    }

    // 驗證電郵格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '請輸入有效的電郵地址' });
    }

    // 檢查用戶名稱是否已存在
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: '用戶名稱已被使用' });
    }

    // 檢查電郵是否已存在
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: '電郵地址已被註冊' });
    }

    // 檢查電話是否已存在
    const phoneCheck = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: '電話號碼已被註冊' });
    }

    // 加密密碼
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 創建新用戶
    const result = await pool.query(
      `INSERT INTO users (username, email, phone, password_hash, tokens) 
       VALUES ($1, $2, $3, $4, 10) 
       RETURNING id, username, email, phone, tokens, is_admin, created_at`,
      [username, email, phone, passwordHash]
    );

    const newUser = result.rows[0];

    // 生成 JWT Token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        username: newUser.username,
        is_admin: newUser.is_admin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '註冊成功！',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        tokens: newUser.tokens,
        is_admin: newUser.is_admin,
        created_at: newUser.created_at
      }
    });

  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({ error: '註冊失敗，請稍後再試' });
  }
});

// ========================================
// 🔑 登入路由（支援 username 或 phone）
// ========================================
router.post('/login', async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    // ✅ 允許用 username 或 phone 登入
    const loginIdentifier = username || phone;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: '請輸入用戶名稱/電話和密碼' });
    }

    // ✅ 同時搜尋 username 和 phone
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR phone = $1',
      [loginIdentifier]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: '用戶名稱/電話或密碼錯誤' });
    }

    const user = result.rows[0];

    // 驗證密碼
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ error: '用戶名稱/電話或密碼錯誤' });
    }

    // 更新最後登入時間
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // 生成 JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        is_admin: user.is_admin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登入成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        tokens: user.tokens,
        is_admin: user.is_admin
      }
    });

  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ error: '登入失敗，請稍後再試' });
  }
});

// ========================================
// 👤 獲取當前用戶資料（需要登入）
// ========================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, phone, tokens, is_admin, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('獲取用戶資料錯誤:', error);
    res.status(500).json({ error: '無法獲取用戶資料' });
  }
});

// ========================================
// 🚪 登出路由（清除客戶端 token）
// ========================================
router.post('/logout', authenticateToken, (req, res) => {
  // 前端會清除 localStorage 的 token
  res.json({ message: '登出成功' });
});

module.exports = router;
```

#### 📄 `src\routes\conversations.js`

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// ========================================
// 📋 獲取用戶所有對話（✅ 改用新欄位名）
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
        
        -- ✅ 獲取帖子的第一個產品資料（新欄位名）
        (
          SELECT json_build_object(
            'item_description', pi.item_description,
            'category', pi.category,
            'brand', pi.brand,
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

    // ✅ 格式化數據（使用新欄位名）
    const conversations = result.rows.map(row => {
      const item = row.post_item || {};
      
      return {
        id: row.id,
        post_id: row.post_id,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
        
        // ✅ 產品標題（使用新欄位）
        post_title: item.item_description 
          ? `${item.item_description} · ${item.category}` 
          : '產品詳情',
        
        // ✅ 產品詳細資訊
        post_item: item,
        post_type: row.post_type,
        
        other_user: {
          id: row.other_user_id,
          username: row.other_username
        },
        last_message: row.last_message,
        last_message_time: row.last_message_at,
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
// 💬 開始/獲取對話（✅ 唔使改）
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
// 📜 獲取對話訊息（✅ 唔使改）
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
// ✉️ 發送訊息（✅ 唔使改）
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
// ✅ 標記對話已讀（✅ 唔使改）
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
// 🔔 獲取未讀訊息總數（✅ 唔使改）
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
```

#### 📄 `src\routes\leog.js`

```javascript
const express = require('express');
const router = express.Router();
const axios = require('axios');

const REBRICKABLE_API = 'https://rebrickable.com/api/v3/lego';
const API_KEY = process.env.REBRICKABLE_API_KEY;

// 搜尋配件
router.get('/parts/search', async (req, res) => {
  try {
    const { part_num } = req.query;
    
    const response = await axios.get(`${REBRICKABLE_API}/parts/${part_num}/`, {
      params: { key: API_KEY }
    });
    
    res.json({
      part_num: response.data.part_num,
      name: response.data.name,
      part_cat_id: response.data.part_cat_id,
      part_img_url: response.data.part_img_url,
      part_material: response.data.part_material
    });
  } catch (error) {
    console.error('搜尋配件失敗:', error.response?.data || error.message);
    res.status(404).json({ error: '找不到此配件' });
  }
});

module.exports = router;
```

#### 📄 `src\routes\posts.js`

```javascript
const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ========================================
// 📝 發佈交易（✅ 改用新 DB 欄位名）
// ========================================
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { type, items, contact_info, notes } = req.body;
    const userId = req.user.id;

    console.log('📸 收到嘅 items:', JSON.stringify(items, null, 2));

    if (!type || !items || items.length === 0) {
      return res.status(400).json({ error: '請填寫交易類型和產品清單' });
    }

    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT tokens FROM users WHERE id = $1',
      [userId]
    );


// ✅ 新 code：發 post 加 token
await client.query(
  'UPDATE users SET tokens = tokens + 1 WHERE id = $1',
  [userId]
);

const newBalance = userResult.rows[0].tokens + 1;

await client.query(
  `INSERT INTO token_transactions (user_id, action, tokens_changed, balance_after, description)
   VALUES ($1, 'post_create', 1, $2, '發佈交易獎勵')`,
  [userId, newBalance]
);

    const postResult = await client.query(
      `INSERT INTO posts (user_id, type, contact_info, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, type, contact_info, notes]
    );

    const post = postResult.rows[0];

    // ✅ 改用新欄位名
    for (const item of items) {
      await client.query(
        `INSERT INTO post_items (
          post_id, 
          item_description, 
          category, 
          brand, 
          price_per_unit,
          condition,
          image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          post.id, 
          item.item_description,     // ✅ 改名
          item.category,             // ✅ 改名
          item.brand || null,        // ✅ 改名
          item.price_per_unit,
          item.condition || null,
          item.image_url || null
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
// 📋 取得所有交易（✅ 改用新欄位名）
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
            'item_description', pi.item_description,
            'category', pi.category,
            'brand', pi.brand,
            'price_per_unit', pi.price_per_unit,
            'condition', pi.condition,
            'image_url', pi.image_url
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
// 📦 取得我的交易（✅ 改用新欄位名）
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
                  'item_description', pi.item_description,
                  'category', pi.category,
                  'brand', pi.brand,
                  'price_per_unit', pi.price_per_unit,
                  'condition', pi.condition,
                  'image_url', pi.image_url
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
// 👑 管理員：取得所有用戶的交易（✅ 改用新欄位名）
// ========================================
router.get('/all-posts', authenticateToken, async (req, res) => {
  try {
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
                  'item_description', pi.item_description,
                  'category', pi.category,
                  'brand', pi.brand,
                  'price_per_unit', pi.price_per_unit,
                  'condition', pi.condition,
                  'image_url', pi.image_url
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
// ✏️ 編輯貼文（✅ 改用新欄位名）
// ========================================
router.put('/:id/edit', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: '請提供要修改的產品資料' });
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



    // ✅ 改用新欄位名（只更新 brand, price_per_unit, condition, image_url）
    for (const item of items) {
      const itemCheck = await client.query(
        'SELECT * FROM post_items WHERE id = $1 AND post_id = $2',
        [item.id, postId]
      );

      if (itemCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `產品 ID ${item.id} 不屬於此貼文` });
      }

      await client.query(
        `UPDATE post_items 
         SET brand = $1, 
             price_per_unit = $2, 
             condition = $3,
             image_url = $4
         WHERE id = $5`,
        [
          item.brand || null,       // ✅ 改名
          item.price_per_unit, 
          item.condition || null,
          item.image_url || null,
          item.id
        ]
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
// ❤️ 點讚/取消點讚（✅ 唔使改）
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
// 💬 獲取帖子留言（✅ 唔使改）
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
// 💬 新增留言（✅ 唔使改）
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
// 🗑️ 刪除留言（✅ 唔使改）
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
// 🗑️ 刪除交易（✅ 唔使改）
// ========================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;

    const postResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到此交易' });
    }

    const postOwnerId = postResult.rows[0].user_id;

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
```

#### 📄 `src\routes\sms.js`

```javascript
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const pool = require('../db');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 發送驗證碼
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;

    // 檢查電話是否已註冊
    const existing = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '此電話號碼已被註冊' });
    }

    // 生成 6 位驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 儲存驗證碼（5分鐘有效期）
    await pool.query(
      `INSERT INTO sms_verifications (phone, code, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes')
       ON CONFLICT (phone) 
       DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '5 minutes', created_at = NOW()`,
      [phone, code]
    );

    // 發送 SMS
    await client.messages.create({
      body: `你的樂高交易平台驗證碼是：${code}（5分鐘內有效）`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+852${phone}`  // 香港電話
    });

    res.json({ message: '驗證碼已發送' });
  } catch (error) {
    console.error('發送驗證碼失敗:', error);
    res.status(500).json({ error: '發送失敗，請稍後再試' });
  }
});

// 驗證驗證碼
router.post('/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    const result = await pool.query(
      `SELECT * FROM sms_verifications 
       WHERE phone = $1 AND code = $2 AND expires_at > NOW()`,
      [phone, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: '驗證碼錯誤或已過期' });
    }

    // 刪除已驗證的驗證碼
    await pool.query(
      'DELETE FROM sms_verifications WHERE phone = $1',
      [phone]
    );

    res.json({ verified: true });
  } catch (error) {
    console.error('驗證失敗:', error);
    res.status(500).json({ error: '驗證失敗' });
  }
});

module.exports = router;
```

#### 📄 `src\routes\tokens.js`

```javascript
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
```

### 🔒 Middleware

#### 📄 `src\middleware\auth.js`

```javascript
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
```

#### 📄 `package-lock.json`

```json
{
  "name": "lego-backend",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "lego-backend",
      "version": "1.0.0",
      "dependencies": {
        "bcrypt": "^6.0.0",
        "bcryptjs": "^2.4.3",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "express": "^4.18.2",
        "jsonwebtoken": "^9.0.2",
        "pg": "^8.11.3"
      },
      "devDependencies": {
        "nodemon": "^3.0.2"
      }
    },
    "node_modules/accepts": {
      "version": "1.3.8",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-1.3.8.tgz",
      "integrity": "sha512-PYAthTa2m2VKxuvSD3DPC/Gy+U+sOA1LAuT8mkmRuvw+NACSaeXEQ+NHcVF7rONl6qcaxV3Uuemwawk+7+SJLw==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "~2.1.34",
        "negotiator": "0.6.3"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/anymatch": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz",
      "integrity": "sha512-KMReFUr0B4t+D+OBkjR3KYqvocp2XaSzO55UcB6mgQMd3KbcE+mWTyvVV7D/zsdEbNnV6acZUutkiHQXvTr1Rw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/array-flatten": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/array-flatten/-/array-flatten-1.1.1.tgz",
      "integrity": "sha512-PCVAQswWemu6UdxsDFFX/+gVeYqKAod3D3UVm91jHwynguOwAvYPhx8nNlM++NqRcK6CxxpUafjmhIdKiHibqg==",
      "license": "MIT"
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/bcrypt": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/bcrypt/-/bcrypt-6.0.0.tgz",
      "integrity": "sha512-cU8v/EGSrnH+HnxV2z0J7/blxH8gq7Xh2JFT6Aroax7UohdmiJJlxApMxtKfuI7z68NvvVcmR78k2LbT6efhRg==",
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "node-addon-api": "^8.3.0",
        "node-gyp-build": "^4.8.4"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/bcryptjs": {
      "version": "2.4.3",
      "resolved": "https://registry.npmjs.org/bcryptjs/-/bcryptjs-2.4.3.tgz",
      "integrity": "sha512-V/Hy/X9Vt7f3BbPJEi8BdVFMByHi+jNXrYkW3huaybV/kQ0KJg0Y6PkEMbn+zeT+i+SiKZ/HMqJGIIt4LZDqNQ==",
      "license": "MIT"
    },
    "node_modules/binary-extensions": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.3.0.tgz",
      "integrity": "sha512-Ceh+7ox5qe7LJuLHoY0feh3pHuUDHAcRUeyL2VYghZwfpkNIy/+8Ocg0a3UuSoYzavmylwuLWQOf3hl0jjMMIw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/body-parser": {
      "version": "1.20.4",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-1.20.4.tgz",
      "integrity": "sha512-ZTgYYLMOXY9qKU/57FAo8F+HA2dGX7bqGc71txDRC1rS4frdFI5R7NhluHxH6M0YItAP0sHB4uqAOcYKxO6uGA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "content-type": "~1.0.5",
        "debug": "2.6.9",
        "depd": "2.0.0",
        "destroy": "~1.2.0",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.4.24",
        "on-finished": "~2.4.1",
        "qs": "~6.14.0",
        "raw-body": "~2.5.3",
        "type-is": "~1.6.18",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8",
        "npm": "1.2.8000 || >= 1.4.16"
      }
    },
    "node_modules/body-parser/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "license": "MIT",
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/body-parser/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A==",
      "license": "MIT"
    },
    "node_modules/brace-expansion": {
      "version": "1.1.12",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.12.tgz",
      "integrity": "sha512-9T9UjW3r0UW5c1Q7GTwllptXwhvYmEzFhzMfZ9H7FQWt+uZePjZPjBP/W1ZEyZ1twGWom5/56TF4lPcqjnDHcg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/bytes": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/chokidar": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.6.0.tgz",
      "integrity": "sha512-7VT13fmjotKpGipCW9JEQAusEPE+Ei8nl6/g4FBAmIm0GOOLMua9NDDo/DWp0ZAxCr3cPq5ZpBqmPAQgDda2Pw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "anymatch": "~3.1.2",
        "braces": "~3.0.2",
        "glob-parent": "~5.1.2",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.6.0"
      },
      "engines": {
        "node": ">= 8.10.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/content-disposition": {
      "version": "0.5.4",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-0.5.4.tgz",
      "integrity": "sha512-FveZTNuGw04cxlAiWbzi6zTAL/lhehaWbTtgluJh4/E95DqMwTmha3KZN1aAWA8cFIhHzMZUvLevkw5Rqk+tSQ==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "5.2.1"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/content-type": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie-signature": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.0.7.tgz",
      "integrity": "sha512-NXdYc3dLr47pBkpUCHtKSwIOQXLVn8dZEuywboCOJY/osA0wFSLlSawr3KN8qXJEyX66FcONTH8EIlVuK0yyFA==",
      "license": "MIT"
    },
    "node_modules/cors": {
      "version": "2.8.5",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.5.tgz",
      "integrity": "sha512-KIHbLJqu73RGr/hnbrO9uBeixNGuvSQjul/jdFvS/KFSIH1hWVd1ng7zOHx+YrEfInLG7q4n6GHQ9cDtxv/P6g==",
      "license": "MIT",
      "dependencies": {
        "object-assign": "^4",
        "vary": "^1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/depd": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/destroy": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/destroy/-/destroy-1.2.0.tgz",
      "integrity": "sha512-2sJGJTaXIIaR1w4iJSNoN0hnMY7Gpc/n8D4qSCJw8QqFWXf7cuAgnEHxBpweaVcPevC2l3KpjYCx3NypQQgaJg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8",
        "npm": "1.2.8000 || >= 1.4.16"
      }
    },
    "node_modules/dotenv": {
      "version": "16.6.1",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-16.6.1.tgz",
      "integrity": "sha512-uBq4egWHTcTt33a72vpSG0z3HnPuIl6NqYcTrKEg2azoEyl2hpW0zqlxysq2pK9HlDIHyHyakeYaYnSAwd8bow==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow==",
      "license": "MIT"
    },
    "node_modules/encodeurl": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
      "integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
      "license": "MIT"
    },
    "node_modules/etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/express": {
      "version": "4.22.1",
      "resolved": "https://registry.npmjs.org/express/-/express-4.22.1.tgz",
      "integrity": "sha512-F2X8g9P1X7uCPZMA3MVf9wcTqlyNp7IhH5qPCI0izhaOIYXaW9L535tGA3qmjRzpH+bZczqq7hVKxTR4NWnu+g==",
      "license": "MIT",
      "dependencies": {
        "accepts": "~1.3.8",
        "array-flatten": "1.1.1",
        "body-parser": "~1.20.3",
        "content-disposition": "~0.5.4",
        "content-type": "~1.0.4",
        "cookie": "~0.7.1",
        "cookie-signature": "~1.0.6",
        "debug": "2.6.9",
        "depd": "2.0.0",
        "encodeurl": "~2.0.0",
        "escape-html": "~1.0.3",
        "etag": "~1.8.1",
        "finalhandler": "~1.3.1",
        "fresh": "~0.5.2",
        "http-errors": "~2.0.0",
        "merge-descriptors": "1.0.3",
        "methods": "~1.1.2",
        "on-finished": "~2.4.1",
        "parseurl": "~1.3.3",
        "path-to-regexp": "~0.1.12",
        "proxy-addr": "~2.0.7",
        "qs": "~6.14.0",
        "range-parser": "~1.2.1",
        "safe-buffer": "5.2.1",
        "send": "~0.19.0",
        "serve-static": "~1.16.2",
        "setprototypeof": "1.2.0",
        "statuses": "~2.0.1",
        "type-is": "~1.6.18",
        "utils-merge": "1.0.1",
        "vary": "~1.1.2"
      },
      "engines": {
        "node": ">= 0.10.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/express/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "license": "MIT",
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/express/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A==",
      "license": "MIT"
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/finalhandler": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-1.3.2.tgz",
      "integrity": "sha512-aA4RyPcd3badbdABGDuTXCMTtOneUCAYH/gxoYRTZlIJdF0YPWuGqiAsIrhNnnqdXGswYk6dGujem4w80UJFhg==",
      "license": "MIT",
      "dependencies": {
        "debug": "2.6.9",
        "encodeurl": "~2.0.0",
        "escape-html": "~1.0.3",
        "on-finished": "~2.4.1",
        "parseurl": "~1.3.3",
        "statuses": "~2.0.2",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/finalhandler/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "license": "MIT",
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/finalhandler/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A==",
      "license": "MIT"
    },
    "node_modules/forwarded": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fresh": {
      "version": "0.5.2",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-0.5.2.tgz",
      "integrity": "sha512-zJ2mQYM18rEFOudeV4GShTGIQ7RbzA7ozbU9I/XBpm7kqgMywgmylMwXHxZJmkVoYkna9d2pVXVXPdYTP9ej8Q==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-flag": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-3.0.0.tgz",
      "integrity": "sha512-sKJf1+ceQBr4SMkvQnBDNDtf4TXpVhVGateu0t918bl30FnbE2m4vNLX+VWe/dpjlb+HugGYzW7uQXH98HPEYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.2.tgz",
      "integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/http-errors": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
      "integrity": "sha512-4FbRdAX+bSdmo4AUFuS0WNiPz8NgFt+r8ThgNWmlrjQjt1Q7ZR9+zTlce2859x4KSXrwIsaeTqDoKQmtP8pLmQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "~2.0.0",
        "inherits": "~2.0.4",
        "setprototypeof": "~1.2.0",
        "statuses": "~2.0.2",
        "toidentifier": "~1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.4.24",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.4.24.tgz",
      "integrity": "sha512-v3MXnZAcvnywkTUEZomIActle7RXXeedOR31wwl7VlyoXO4Qi9arvSenNQWne1TcRwhCL1HwLI21bEqdpj8/rA==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/ignore-by-default": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/ignore-by-default/-/ignore-by-default-1.0.1.tgz",
      "integrity": "sha512-Ius2VYcGNk7T90CppJqcIkS5ooHUZyIQK+ClZfMfMNFEF9VSE73Fq+906u/CWu92x4gzZMWOwfFYckPObzdEbA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/ipaddr.js": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/is-binary-path": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-binary-path/-/is-binary-path-2.1.0.tgz",
      "integrity": "sha512-ZMERYes6pDydyuGidse7OsHxtbI7WVeUEozgR/g7rd0xUimYNlvZRE/K2MgZTjWy725IfelLeVcEM97mmtRGXw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "binary-extensions": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/jsonwebtoken": {
      "version": "9.0.2",
      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.2.tgz",
      "integrity": "sha512-PRp66vJ865SSqOlgqS8hujT5U4AOgMfhrwYIuIhfKaoSCZcirrmASQr8CX7cUg+RMih+hgznrjp99o+W4pJLHQ==",
      "license": "MIT",
      "dependencies": {
        "jws": "^3.2.2",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=12",
        "npm": ">=6"
      }
    },
    "node_modules/jwa": {
      "version": "1.4.2",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-1.4.2.tgz",
      "integrity": "sha512-eeH5JO+21J78qMvTIDdBXidBd6nG2kZjg5Ohz/1fpa28Z4CcsWUzJ1ZZyFq/3z3N17aZy+ZuBoHljASbL1WfOw==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/jws/-/jws-3.2.3.tgz",
      "integrity": "sha512-byiJ0FLRdLdSVSReO/U4E7RoEyOCKnEnEPMjq3HxWtvzLsV08/i5RQKsFVNkCldrCaPr2vDNAOMsfs8T/Hze7g==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^1.4.2",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/media-typer": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz",
      "integrity": "sha512-dq+qelQ9akHpcOl/gUVRTxVIOkAJ1wR3QAvb4RsVjS8oVoFjDGTc679wJYmUmknUF5HwMLOgb5O+a3KxfWapPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/merge-descriptors": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-1.0.3.tgz",
      "integrity": "sha512-gaNvAS7TZ897/rVaZ0nMtAyxNyi/pdbjbAwUpFQpN70GqnVfOiXpeUUMKRBmzXaSQ8DdTX4/0ms62r2K+hE6mQ==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/methods": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/methods/-/methods-1.1.2.tgz",
      "integrity": "sha512-iclAHeNqNm68zFtnZ0e+1L2yUIdvzNoauKU4WBA3VvH/vPFieF7qfRlwUZU+DA9P9bPXIS90ulxoUoCH23sV2w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/mime/-/mime-1.6.0.tgz",
      "integrity": "sha512-x0Vn8spI+wuJ1O6S7gnbaQg8Pxh4NNHb7KSINmEWKiPE4RKOplvijn+NkmYmmRgP68mc70j2EbeTFRsrswaQeg==",
      "license": "MIT",
      "bin": {
        "mime": "cli.js"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/negotiator": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
      "integrity": "sha512-+EUsqGPLsM+j/zdChZjsnX51g4XrHFOIXwfnCVPGlQk/k5giakcKsuxCObBRu6DSm9opw/O6slWbJdghQM4bBg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/node-addon-api": {
      "version": "8.5.0",
      "resolved": "https://registry.npmjs.org/node-addon-api/-/node-addon-api-8.5.0.tgz",
      "integrity": "sha512-/bRZty2mXUIFY/xU5HLvveNHlswNJej+RnxBjOMkidWfwZzgTbPG1E3K5TOxRLOR+5hX7bSofy8yf1hZevMS8A==",
      "license": "MIT",
      "engines": {
        "node": "^18 || ^20 || >= 21"
      }
    },
    "node_modules/node-gyp-build": {
      "version": "4.8.4",
      "resolved": "https://registry.npmjs.org/node-gyp-build/-/node-gyp-build-4.8.4.tgz",
      "integrity": "sha512-LA4ZjwlnUblHVgq0oBF3Jl/6h/Nvs5fzBLwdEF4nuxnFdsfajde4WfxtJr3CaiH+F6ewcIB/q4jQ4UzPyid+CQ==",
      "license": "MIT",
      "bin": {
        "node-gyp-build": "bin.js",
        "node-gyp-build-optional": "optional.js",
        "node-gyp-build-test": "build-test.js"
      }
    },
    "node_modules/nodemon": {
      "version": "3.1.11",
      "resolved": "https://registry.npmjs.org/nodemon/-/nodemon-3.1.11.tgz",
      "integrity": "sha512-is96t8F/1//UHAjNPHpbsNY46ELPpftGUoSVNXwUfMk/qdjSylYrWSu1XavVTBOn526kFiOR733ATgNBCQyH0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "chokidar": "^3.5.2",
        "debug": "^4",
        "ignore-by-default": "^1.0.1",
        "minimatch": "^3.1.2",
        "pstree.remy": "^1.1.8",
        "semver": "^7.5.3",
        "simple-update-notifier": "^2.0.0",
        "supports-color": "^5.5.0",
        "touch": "^3.1.0",
        "undefsafe": "^2.0.5"
      },
      "bin": {
        "nodemon": "bin/nodemon.js"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/nodemon"
      }
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
      "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/on-finished": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
      "integrity": "sha512-oVlzkg3ENAhCk2zdv7IJwd/QUD4z2RxRwpkcGY8psCVcCYZNq4wYnVWALHM+brtuJjePWiYF/ClmuDr8Ch5+kg==",
      "license": "MIT",
      "dependencies": {
        "ee-first": "1.1.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/parseurl": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/path-to-regexp": {
      "version": "0.1.12",
      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-0.1.12.tgz",
      "integrity": "sha512-RA1GjUVMnvYFxuqovrEqZoxxW5NUZqbwKtYz/Tt7nXerk0LbLblQmrsgdeOxV5SFHf0UDggjS/bSeOZwt1pmEQ==",
      "license": "MIT"
    },
    "node_modules/pg": {
      "version": "8.16.3",
      "resolved": "https://registry.npmjs.org/pg/-/pg-8.16.3.tgz",
      "integrity": "sha512-enxc1h0jA/aq5oSDMvqyW3q89ra6XIIDZgCX9vkMrnz5DFTw/Ny3Li2lFQ+pt3L6MCgm/5o2o8HW9hiJji+xvw==",
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "pg-connection-string": "^2.9.1",
        "pg-pool": "^3.10.1",
        "pg-protocol": "^1.10.3",
        "pg-types": "2.2.0",
        "pgpass": "1.0.5"
      },
      "engines": {
        "node": ">= 16.0.0"
      },
      "optionalDependencies": {
        "pg-cloudflare": "^1.2.7"
      },
      "peerDependencies": {
        "pg-native": ">=3.0.1"
      },
      "peerDependenciesMeta": {
        "pg-native": {
          "optional": true
        }
      }
    },
    "node_modules/pg-cloudflare": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/pg-cloudflare/-/pg-cloudflare-1.2.7.tgz",
      "integrity": "sha512-YgCtzMH0ptvZJslLM1ffsY4EuGaU0cx4XSdXLRFae8bPP4dS5xL1tNB3k2o/N64cHJpwU7dxKli/nZ2lUa5fLg==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/pg-connection-string": {
      "version": "2.9.1",
      "resolved": "https://registry.npmjs.org/pg-connection-string/-/pg-connection-string-2.9.1.tgz",
      "integrity": "sha512-nkc6NpDcvPVpZXxrreI/FOtX3XemeLl8E0qFr6F2Lrm/I8WOnaWNhIPK2Z7OHpw7gh5XJThi6j6ppgNoaT1w4w==",
      "license": "MIT"
    },
    "node_modules/pg-int8": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/pg-int8/-/pg-int8-1.0.1.tgz",
      "integrity": "sha512-WCtabS6t3c8SkpDBUlb1kjOs7l66xsGdKpIPZsg4wR+B3+u9UAum2odSsF9tnvxg80h4ZxLWMy4pRjOsFIqQpw==",
      "license": "ISC",
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/pg-pool": {
      "version": "3.10.1",
      "resolved": "https://registry.npmjs.org/pg-pool/-/pg-pool-3.10.1.tgz",
      "integrity": "sha512-Tu8jMlcX+9d8+QVzKIvM/uJtp07PKr82IUOYEphaWcoBhIYkoHpLXN3qO59nAI11ripznDsEzEv8nUxBVWajGg==",
      "license": "MIT",
      "peerDependencies": {
        "pg": ">=8.0"
      }
    },
    "node_modules/pg-protocol": {
      "version": "1.10.3",
      "resolved": "https://registry.npmjs.org/pg-protocol/-/pg-protocol-1.10.3.tgz",
      "integrity": "sha512-6DIBgBQaTKDJyxnXaLiLR8wBpQQcGWuAESkRBX/t6OwA8YsqP+iVSiond2EDy6Y/dsGk8rh/jtax3js5NeV7JQ==",
      "license": "MIT"
    },
    "node_modules/pg-types": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/pg-types/-/pg-types-2.2.0.tgz",
      "integrity": "sha512-qTAAlrEsl8s4OiEQY69wDvcMIdQN6wdz5ojQiOy6YRMuynxenON0O5oCpJI6lshc6scgAY8qvJ2On/p+CXY0GA==",
      "license": "MIT",
      "dependencies": {
        "pg-int8": "1.0.1",
        "postgres-array": "~2.0.0",
        "postgres-bytea": "~1.0.0",
        "postgres-date": "~1.0.4",
        "postgres-interval": "^1.1.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/pgpass": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/pgpass/-/pgpass-1.0.5.tgz",
      "integrity": "sha512-FdW9r/jQZhSeohs1Z3sI1yxFQNFvMcnmfuj4WBMUTxOrAyLMaTcE1aAMBiTlbMNaXvBCQuVi0R7hd8udDSP7ug==",
      "license": "MIT",
      "dependencies": {
        "split2": "^4.1.0"
      }
    },
    "node_modules/picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/postgres-array": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/postgres-array/-/postgres-array-2.0.0.tgz",
      "integrity": "sha512-VpZrUqU5A69eQyW2c5CA1jtLecCsN2U/bD6VilrFDWq5+5UIEVO7nazS3TEcHf1zuPYO/sqGvUvW62g86RXZuA==",
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/postgres-bytea": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/postgres-bytea/-/postgres-bytea-1.0.0.tgz",
      "integrity": "sha512-xy3pmLuQqRBZBXDULy7KbaitYqLcmxigw14Q5sj8QBVLqEwXfeybIKVWiqAXTlcvdvb0+xkOtDbfQMOf4lST1w==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/postgres-date": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/postgres-date/-/postgres-date-1.0.7.tgz",
      "integrity": "sha512-suDmjLVQg78nMK2UZ454hAG+OAW+HQPZ6n++TNDUX+L0+uUlLywnoxJKDou51Zm+zTCjrCl0Nq6J9C5hP9vK/Q==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/postgres-interval": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/postgres-interval/-/postgres-interval-1.2.0.tgz",
      "integrity": "sha512-9ZhXKM/rw350N1ovuWHbGxnGh/SNJ4cnxHiM0rxE4VN41wsg8P8zWn9hv/buK00RP4WvlOyr/RBDiptyxVbkZQ==",
      "license": "MIT",
      "dependencies": {
        "xtend": "^4.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/proxy-addr": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.7.tgz",
      "integrity": "sha512-llQsMLSUDUPT44jdrU/O37qlnifitDP+ZwrmmZcoSKyLKvtZxpyV0n2/bD/N4tBAAZ/gJEdZU7KMraoK1+XYAg==",
      "license": "MIT",
      "dependencies": {
        "forwarded": "0.2.0",
        "ipaddr.js": "1.9.1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/pstree.remy": {
      "version": "1.1.8",
      "resolved": "https://registry.npmjs.org/pstree.remy/-/pstree.remy-1.1.8.tgz",
      "integrity": "sha512-77DZwxQmxKnu3aR542U+X8FypNzbfJ+C5XQDk3uWjWxn6151aIMGthWYRXTqT1E5oJvg+ljaa2OJi+VfvCOQ8w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/qs": {
      "version": "6.14.0",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.14.0.tgz",
      "integrity": "sha512-YWWTjgABSKcvs/nWBi9PycY/JiPJqOD4JA6o9Sej2AtvSGarXxKC3OQSk4pAarbdQlKAh5D4FCQkJNkW+GAn3w==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/range-parser": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.2.1.tgz",
      "integrity": "sha512-Hrgsx+orqoygnmhFbKaHE6c296J+HTAQXoxEF6gNupROmmGJRoyzfG3ccAveqCBrwr/2yxQ5BVd/GTl5agOwSg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/raw-body": {
      "version": "2.5.3",
      "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-2.5.3.tgz",
      "integrity": "sha512-s4VSOf6yN0rvbRZGxs8Om5CWj6seneMwK3oDb4lWDH0UPhWcxwOWw5+qk24bxq87szX1ydrwylIOp2uG1ojUpA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.4.24",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/readdirp": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-3.6.0.tgz",
      "integrity": "sha512-hOS089on8RduqdbhvQ5Z37A0ESjsqz6qnRcffsMU3495FuTdqSm+7bhJ29JvIOsBDEEnan5DPu9t3To9VRlMzA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "picomatch": "^2.2.1"
      },
      "engines": {
        "node": ">=8.10.0"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.7.3",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.3.tgz",
      "integrity": "sha512-SdsKMrI9TdgjdweUSR9MweHA4EJ8YxHn8DFaDisvhVlUOe4BF1tLD7GAj0lIqWVl+dPb/rExr0Btby5loQm20Q==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/send": {
      "version": "0.19.1",
      "resolved": "https://registry.npmjs.org/send/-/send-0.19.1.tgz",
      "integrity": "sha512-p4rRk4f23ynFEfcD9LA0xRYngj+IyGiEYyqqOak8kaN0TvNmuxC2dcVeBn62GpCeR2CpWqyHCNScTP91QbAVFg==",
      "license": "MIT",
      "dependencies": {
        "debug": "2.6.9",
        "depd": "2.0.0",
        "destroy": "1.2.0",
        "encodeurl": "~2.0.0",
        "escape-html": "~1.0.3",
        "etag": "~1.8.1",
        "fresh": "0.5.2",
        "http-errors": "2.0.0",
        "mime": "1.6.0",
        "ms": "2.1.3",
        "on-finished": "2.4.1",
        "range-parser": "~1.2.1",
        "statuses": "2.0.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/send/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "license": "MIT",
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/send/node_modules/debug/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A==",
      "license": "MIT"
    },
    "node_modules/send/node_modules/http-errors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.0.tgz",
      "integrity": "sha512-FtwrG/euBzaEjYeRqOgly7G0qviiXoJWnvEH2Z1plBdXgbyjv34pHTSb9zoeHMyDy33+DWy5Wt9Wo+TURtOYSQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "2.0.0",
        "inherits": "2.0.4",
        "setprototypeof": "1.2.0",
        "statuses": "2.0.1",
        "toidentifier": "1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/send/node_modules/statuses": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.1.tgz",
      "integrity": "sha512-RwNA9Z/7PrK06rYLIzFMlaF+l73iwpzsqRIFgbMLbTcLD6cOao82TaWefPXQvB2fOC4AjuYSEndS7N/mTCbkdQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/serve-static": {
      "version": "1.16.2",
      "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-1.16.2.tgz",
      "integrity": "sha512-VqpjJZKadQB/PEbEwvFdO43Ax5dFBZ2UECszz8bQ7pi7wt//PWe1P6MN7eCnjsatYtBT6EuiClbjSWP2WrIoTw==",
      "license": "MIT",
      "dependencies": {
        "encodeurl": "~2.0.0",
        "escape-html": "~1.0.3",
        "parseurl": "~1.3.3",
        "send": "0.19.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/serve-static/node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "license": "MIT",
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/serve-static/node_modules/debug/node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A==",
      "license": "MIT"
    },
    "node_modules/serve-static/node_modules/http-errors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.0.tgz",
      "integrity": "sha512-FtwrG/euBzaEjYeRqOgly7G0qviiXoJWnvEH2Z1plBdXgbyjv34pHTSb9zoeHMyDy33+DWy5Wt9Wo+TURtOYSQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "2.0.0",
        "inherits": "2.0.4",
        "setprototypeof": "1.2.0",
        "statuses": "2.0.1",
        "toidentifier": "1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/serve-static/node_modules/send": {
      "version": "0.19.0",
      "resolved": "https://registry.npmjs.org/send/-/send-0.19.0.tgz",
      "integrity": "sha512-dW41u5VfLXu8SJh5bwRmyYUbAoSB3c9uQh6L8h/KtsFREPWpbX1lrljJo186Jc4nmci/sGUZ9a0a0J2zgfq2hw==",
      "license": "MIT",
      "dependencies": {
        "debug": "2.6.9",
        "depd": "2.0.0",
        "destroy": "1.2.0",
        "encodeurl": "~1.0.2",
        "escape-html": "~1.0.3",
        "etag": "~1.8.1",
        "fresh": "0.5.2",
        "http-errors": "2.0.0",
        "mime": "1.6.0",
        "ms": "2.1.3",
        "on-finished": "2.4.1",
        "range-parser": "~1.2.1",
        "statuses": "2.0.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/serve-static/node_modules/send/node_modules/encodeurl": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-1.0.2.tgz",
      "integrity": "sha512-TPJXq8JqFaVYm2CWmPvnP2Iyo4ZSM7/QKcSmuMLDObfpH5fi7RUGmd/rTDf+rut/saiDiQEeVTNgAmJEdAOx0w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/serve-static/node_modules/statuses": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.1.tgz",
      "integrity": "sha512-RwNA9Z/7PrK06rYLIzFMlaF+l73iwpzsqRIFgbMLbTcLD6cOao82TaWefPXQvB2fOC4AjuYSEndS7N/mTCbkdQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/setprototypeof": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw==",
      "license": "ISC"
    },
    "node_modules/side-channel": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.0.tgz",
      "integrity": "sha512-ZX99e6tRweoUXqR+VBrslhda51Nh5MTQwou5tnUDgbtyM0dBgmhEDtWGP/xbKn6hqfPRHujUNwz5fy/wbbhnpw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3",
        "side-channel-list": "^1.0.0",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.0.tgz",
      "integrity": "sha512-FCLHtRD/gnpCiCHEiJLOwdmFP+wzCmDEkc9y7NsYxeF4u7Btsn1ZuwgwJGxImImHicJArLP4R0yX4c2KCrMrTA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/simple-update-notifier": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/simple-update-notifier/-/simple-update-notifier-2.0.0.tgz",
      "integrity": "sha512-a2B9Y0KlNXl9u/vsW6sTIu9vGEpfKu2wRV6l1H3XEas/0gUIzGzBoP/IouTcUQbm9JWZLH3COxyn03TYlFax6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^7.5.3"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/split2": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/split2/-/split2-4.2.0.tgz",
      "integrity": "sha512-UcjcJOWknrNkF6PLX83qcHM6KHgVKNkV62Y8a5uYDVv9ydGQVwAHMKqHdJje1VTWpljG0WYpCDhrCdAOYH4TWg==",
      "license": "ISC",
      "engines": {
        "node": ">= 10.x"
      }
    },
    "node_modules/statuses": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/supports-color": {
      "version": "5.5.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-5.5.0.tgz",
      "integrity": "sha512-QjVjwdXIt408MIiAqCX4oUKsgU2EqAGzs2Ppkm4aQYbjm+ZEWEcW4SfFNTr4uMNZma0ey4f5lgLrkB0aX0QMow==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/toidentifier": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/touch": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/touch/-/touch-3.1.1.tgz",
      "integrity": "sha512-r0eojU4bI8MnHr8c5bNo7lJDdI2qXlWWJk6a9EAFG7vbhTjElYhBVS3/miuE0uOuoLdb8Mc/rVfsmm6eo5o9GA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "nodetouch": "bin/nodetouch.js"
      }
    },
    "node_modules/type-is": {
      "version": "1.6.18",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
      "integrity": "sha512-TkRKr9sUTxEH8MdfuCSP7VizJyzRNMjj2J2do2Jr3Kym598JVdEksuzPQCnlFPW4ky9Q+iA+ma9BGm06XQBy8g==",
      "license": "MIT",
      "dependencies": {
        "media-typer": "0.3.0",
        "mime-types": "~2.1.24"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/undefsafe": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/undefsafe/-/undefsafe-2.0.5.tgz",
      "integrity": "sha512-WxONCrssBM8TSPRqN5EmsjVrsv4A8X12J4ArBiiayv3DyyG3ZlIg6yysuuSYdZsVz3TKcTg2fd//Ujd4CHV1iA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/unpipe": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/utils-merge": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/utils-merge/-/utils-merge-1.0.1.tgz",
      "integrity": "sha512-pMZTvIkT1d+TFGvDOqodOclx0QWkkgi6Tdoa8gC8ffGAAqz9pzPTZWAybbsHHoED/ztMtkv/VoYTYyShUn81hA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4.0"
      }
    },
    "node_modules/vary": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/xtend": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/xtend/-/xtend-4.0.2.tgz",
      "integrity": "sha512-LKYU1iAXJXUgAXn9URjiu+MWhyUXHsvfp7mcuYm9dSUKK0/CjtrUwFAxD82/mCWbtLsGjFIad0wIsod4zrTAEQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.4"
      }
    }
  }
}

```

---

## 🗺️ API Routes Overview

### Authentication (`/api/auth`)

- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出
- `GET /api/auth/me` - 獲取當前用戶資料

### Posts (`/api/posts`)

- `GET /api/posts` - 獲取所有帖子
- `GET /api/posts/:id` - 獲取單個帖子
- `POST /api/posts` - 創建帖子（需登入）
- `PUT /api/posts/:id` - 更新帖子（需登入）
- `DELETE /api/posts/:id` - 刪除帖子（需登入）
- `POST /api/posts/:id/like` - 點讚/取消點讚（需登入）

---

## 🗄️ Database Schema

### Tables

1. **users** - 用戶資料
2. **posts** - 帖子資料
3. **parts** - 樂高配件資料
4. **comments** - 留言資料
5. **likes** - 點讚記錄

---

## ⚙️ Environment Variables

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `PORT` | 伺服器端口 | `5000` |
| `DB_USER` | 資料庫用戶名 | `postgres` |
| `DB_HOST` | 資料庫主機 | `localhost` |
| `DB_NAME` | 資料庫名稱 | `lego_forum` |
| `DB_PASSWORD` | 資料庫密碼 | `your_password` |
| `DB_PORT` | 資料庫端口 | `5432` |
| `JWT_SECRET` | JWT 密鑰 | `your-secret-key` |

---

## 📊 Project Statistics

- **總文件數**: 13
- **總代碼行數**: 3,309
- **文件類型分佈**:
  - `.env`: 1 個文件
  - `.js`: 10 個文件
  - `.json`: 2 個文件

---

## 🚀 Quick Start

```bash
# 1. 安裝依賴
npm install

# 2. 配置環境變數
cp .env.example .env
# 然後編輯 .env 填入你的資料庫資訊

# 3. 初始化資料庫
psql -U postgres -d lego_forum -f schema.sql

# 4. 啟動開發伺服器
npm run dev
```

