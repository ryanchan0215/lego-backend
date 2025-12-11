const express = require('express');
const router = express.Router();
const axios = require('axios');

const REBRICKABLE_API = 'https://rebrickable.com/api/v3/lego';
const API_KEY = process.env.REBRICKABLE_API_KEY;

// 搜尋配件
router.get('/parts/search', async (req, res) => {
  try {
    const { part_num } = req.query;
    
    const response = await axios.get(`${REBRICKABLE_API}/parts/${part_num}/`, {
      params: { key: API_KEY }
    });
    
    res.json({
      part_num: response.data.part_num,
      name: response.data.name,
      part_cat_id: response.data.part_cat_id,
      part_img_url: response.data.part_img_url,
      part_material: response.data.part_material
    });
  } catch (error) {
    console.error('搜尋配件失敗:', error.response?.data || error.message);
    res.status(404).json({ error: '找不到此配件' });
  }
});

module.exports = router;