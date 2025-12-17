const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========================================
// 📁 設定檔案上載
// ========================================
const uploadDir = path.join(__dirname, '../../uploads/resources');

// 確保資料夾存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
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
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ========================================
// 📤 上載資源（只限管理員）
// ========================================
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // 檢查管理員權限
    if (!req.user.is_admin) {
      // 刪除已上載檔案
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: '只有管理員可以上載資源' });
    }

    const { title, description, category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: '請選擇檔案' });
    }

    if (!title || !category) {
      // 刪除已上載檔案
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: '請填寫標題和分類' });
    }

    const filePath = `/uploads/resources/${file.filename}`;

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
        filePath,
        file.size,
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: '上載成功',
      resource: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 上載失敗:', error);
    
    // 刪除已上載檔案
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: '上載失敗' });
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

    // 取得檔案資訊
    const result = await pool.query(
      'SELECT file_path FROM resources WHERE id = $1',
      [resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '資源不存在' });
    }

    const filePath = path.join(__dirname, '../..', result.rows[0].file_path);

    // 刪除資料庫記錄
    await pool.query('DELETE FROM resources WHERE id = $1', [resourceId]);

    // 刪除檔案
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: '刪除成功' });

  } catch (error) {
    console.error('❌ 刪除失敗:', error);
    res.status(500).json({ error: '刪除失敗' });
  }
});

module.exports = router;