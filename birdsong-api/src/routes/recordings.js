import express from 'express';
import { getAllRecordings, getRecordingById } from '../controllers/recordingController.js';

const router = express.Router();

// 获取所有录音，支持筛选和分页
router.get('/', getAllRecordings);

// 根据ID获取特定录音详情
router.get('/:id', getRecordingById);

export default router;