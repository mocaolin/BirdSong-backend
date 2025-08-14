import express from 'express';
import { getAllBirds, getBirdById, searchBirds } from '../controllers/birdController.js';

const router = express.Router();

// 获取所有鸟类，支持分页和搜索
router.get('/', getAllBirds);

// 根据ID获取特定鸟类详情
router.get('/:id', getBirdById);

// 根据条件筛选鸟类
router.get('/search', searchBirds);

export default router;