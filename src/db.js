// E:\Lego\lego-backend\src\config\db.js
const { Pool } = require('pg');
require('dotenv').config();

// 創建 PostgreSQL 連接池（加 SSL）
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false  // ✅ Supabase 需要 SSL
  }
});

// 測試資料庫連接
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ 資料庫連接錯誤:', err.message);
    console.error('詳細錯誤:', err.stack);
  } else {
    console.log('✅ 資料庫連接成功');
    console.log(`Connected to: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
    release();
  }
});

// 導出連接池供其他模組使用
module.exports = pool;