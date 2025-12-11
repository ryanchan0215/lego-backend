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
       VALUES ($1, $2, $3, $4, 3) 
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