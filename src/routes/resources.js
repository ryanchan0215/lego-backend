const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ========================================
// 📥 獲取所有資源（公開）
// ========================================
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('獲取資源失敗:', error);
    res.status(500).json({ error: '獲取資源失敗' });
  }
});

// ========================================
// 📤 上載資源（只有管理員）
// ========================================
router.post('/upload', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, file_name, file_path, file_size } = req.body;

    if (!title || !category || !file_name || !file_path) {
      return res.status(400).json({ error: '缺少必要欄位' });
    }

    const { data, error } = await supabase
      .from('resources')
      .insert([{
        title,
        description,
        category,
        file_name,
        file_path,
        file_size,
        uploaded_by: req.user.id,
        download_count: 0  // ✅ 初始化下載次數
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('上載資源失敗:', error);
    res.status(500).json({ error: '上載資源失敗' });
  }
});

// ========================================
// ✅ 記錄下載統計（需要登入）
// ========================================
router.post('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ 先獲取目前的下載次數
    const { data: resource, error: fetchError } = await supabase
      .from('resources')
      .select('download_count')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // ✅ 增加下載次數
    const { error: updateError } = await supabase
      .from('resources')
      .update({ 
        download_count: (resource.download_count || 0) + 1 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (error) {
    console.error('記錄下載失敗:', error);
    res.status(500).json({ error: '記錄下載失敗' });
  }
});

// ========================================
// 🗑️ 刪除資源（只有管理員）
// ========================================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('刪除資源失敗:', error);
    res.status(500).json({ error: '刪除資源失敗' });
  }
});

module.exports = router;