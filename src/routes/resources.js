const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

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
// 📤 儲存資源（Frontend 已 Upload 到 Supabase）
// ========================================
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    console.log('📝 收到資源儲存請求');
    console.log('👤 用戶:', req.user);
    console.log('📄 資料:', req.body);

    // 檢查管理員權限
    if (!req.user.is_admin) {
      console.log('❌ 非管理員');
      return res.status(403).json({ error: '只有管理員可以上載資源' });
    }

    const { title, description, category, file_name, file_path, file_size } = req.body;

    if (!title || !category || !file_name || !file_path) {
      console.log('❌ 缺少必填欄位');
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    // ✅ 儲存到資料庫，初始化 download_count 為 0
    const result = await pool.query(
      `INSERT INTO resources (
        title, 
        description, 
        category, 
        file_name, 
        file_path, 
        file_size, 
        uploaded_by,
        download_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
      RETURNING *`,
      [
        title,
        description || null,
        category,
        file_name,
        file_path,
        file_size,
        req.user.id
      ]
    );

    console.log('✅ 資源儲存成功:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: '上載成功',
      resource: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 儲存失敗:', error);
    console.error('錯誤堆疊:', error.stack);

    res.status(500).json({ 
      error: '儲存失敗',
      details: error.message 
    });
  }
});

// ========================================
// ✅ 記錄下載統計（需要登入）
// ========================================
router.post('/:id/download', authenticateToken, async (req, res) => {
  try {
    const resourceId = req.params.id;

    // ✅ 增加下載次數
    const result = await pool.query(
      `UPDATE resources 
       SET download_count = download_count + 1 
       WHERE id = $1 
       RETURNING download_count`,
      [resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '資源不存在' });
    }

    res.json({ 
      success: true,
      download_count: result.rows[0].download_count
    });

  } catch (error) {
    console.error('❌ 記錄下載失敗:', error);
    res.status(500).json({ 
      error: '記錄下載失敗',
      details: error.message 
    });
  }
});

// ========================================
// 🗑️ 刪除資源（只限管理員）
// ========================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '只有管理員可以刪除資源' });
    }

    const resourceId = req.params.id;

    const result = await pool.query(
      'DELETE FROM resources WHERE id = $1 RETURNING *',
      [resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '資源不存在' });
    }

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