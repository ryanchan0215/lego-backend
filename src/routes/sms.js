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