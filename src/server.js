const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const conversationsRoutes = require('./routes/conversations');
const adminRoutes = require('./routes/admin');
const tokensRoutes = require('./routes/tokens');
const resourcesRoutes = require('./routes/resources');

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

// ✅ 簡單版（支援 JSON）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========================================
// 🛣️ 路由
// ========================================
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/resources', resourcesRoutes);

// ========================================
// 🏠 根路徑
// ========================================
app.get('/', (req, res) => {
  res.json({ 
    name: '👶 嬰幼兒產品交易平台 API',
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
      tokens: '/api/tokens',
      resources: '/api/resources'
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

