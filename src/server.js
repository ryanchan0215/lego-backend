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
  origin: process.env.FRONTEND_URL || '*',  // ✅ 改用環境變數
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
    name: '🧱 樂高配件交易平台 API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',  // ✅ 加環境資訊
    timestamp: new Date().toISOString(),  // ✅ 加時間戳
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
    uptime: process.uptime()  // ✅ 加運行時間
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
app.listen(PORT, '0.0.0.0', () => {  // ✅ 綁定所有網絡介面
  console.log(`🚀 伺服器運行在 port ${PORT}`);
  console.log(`📝 環境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 CORS 允許來源: ${process.env.FRONTEND_URL || '*'}`);
});