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