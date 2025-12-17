const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

// ========================================
// ☁️ Supabase Storage 設定（Hard-coded）
// ========================================
const SUPABASE_URL = 'https://fifgdbgibdclpztlcxog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZmdkYmdpYmRjbHB6dGxjeG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzI4NzQsImV4cCI6MjA4MDk0ODg3NH0.fuaN7rts5nl6sAO8R92FZOk1MJBviN4mVZ7iZVsfxgU';

/**
 * Upload PDF 到 Supabase Storage
 * @param {Buffer} fileBuffer - PDF 檔案 buffer
 * @param {string} fileName - 檔案名稱
 * @returns {Promise<string>} 返回公開 URL
 */
async function uploadPdfToSupabase(fileBuffer, fileName, mimeType) {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/resources/${fileName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': mimeType || 'application/pdf'
      },
      body: fileBuffer
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase Upload 失敗: ${error}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/resources/${fileName}`;
}

/**
 * 從 Supabase Storage 刪除檔案
 * @param {string} fileName - 檔案名稱
 */
async function deletePdfFromSupabase(fileName) {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/resources/${fileName}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {
    console.error('⚠️ Supabase 刪除檔案失敗');
  } else {
    console.log('✅ Supabase 檔案已刪除');
  }
}

// ========================================
// 📁 設定檔案上載（記憶體暫存）
// ========================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('只接受 PDF 檔案'));
    }
  }
});

// ========================================
// 📋 取得所有資源
// ========================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        u.username as uploader_name
      FROM resources r
      LEFT JOIN users u ON r.uploaded_by = u.id
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ 取得資源失敗:', error);
    res.status(500).json({ 
      error: '伺服器錯誤',
      details: error.message 
    });
  }
});

// ========================================
// 📤 上載資源（只限管理員）- Supabase 版
// ========================================
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('📤 收到上載請求');
    console.log('👤 用戶:', req.user);
    console.log('📄 檔案:', req.file?.originalname);
    console.log('📝 表單:', req.body);

    // 檢查管理員權限
    if (!req.user.is_admin) {
      console.log('❌ 非管理員');
      return res.status(403).json({ error: '只有管理員可以上載資源' });
    }

    const { title, description, category } = req.body;
    const file = req.file;

    if (!file) {
      console.log('❌ 冇檔案');
      return res.status(400).json({ error: '請選擇檔案' });
    }

    if (!title || !category) {
      console.log('❌ 缺少標題或分類');
      return res.status(400).json({ error: '請填寫標題和分類' });
    }

    // ✅ 生成唯一檔案名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;

    console.log('☁️ 準備上載到 Supabase Storage...');

    // ✅ Upload 去 Supabase
    const publicUrl = await uploadPdfToSupabase(file.buffer, fileName, file.mimetype);

    console.log('🔗 公開 URL:', publicUrl);

    // ✅ 儲存到資料庫
    const result = await pool.query(
      `INSERT INTO resources (
        title, 
        description, 
        category, 
        file_name, 
        file_path, 
        file_size, 
        uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        title,
        description || null,
        category,
        file.originalname,
        publicUrl,
        file.size,
        req.user.id
      ]
    );

    console.log('✅ 上載成功:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: '上載成功',
      resource: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 上載失敗:', error);
    console.error('錯誤堆疊:', error.stack);

    res.status(500).json({ 
      error: '上載失敗',
      details: error.message 
    });
  }
});

// ========================================
// 🗑️ 刪除資源（只限管理員）- Supabase 版
// ========================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '只有管理員可以刪除資源' });
    }

    const resourceId = req.params.id;

    // 取得資源資料
    const result = await pool.query(
      'SELECT file_path FROM resources WHERE id = $1',
      [resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '資源不存在' });
    }

    const publicUrl = result.rows[0].file_path;

    // ✅ 從 Supabase 刪除檔案
    const fileName = publicUrl.split('/resources/').pop();
    await deletePdfFromSupabase(fileName);

    // ✅ 從資料庫刪除
    await pool.query('DELETE FROM resources WHERE id = $1', [resourceId]);

    res.json({ success: true, message: '刪除成功' });

  } catch (error) {
    console.error('❌ 刪除失敗:', error);
    res.status(500).json({ 
      error: '刪除失敗',
      details: error.message 
    });
  }
});

module.exports = router;