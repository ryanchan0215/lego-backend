const { Pool } = require('pg');
require('dotenv').config();

// ✅ 改用 DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ 資料庫連接錯誤:', err.message);
    console.error('詳細錯誤:', err);
  } else {
    console.log('✅ 資料庫連接成功');
    release();
  }
});

module.exports = pool;