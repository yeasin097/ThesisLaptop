import express from 'express';
import upload from '../middleware/upload.js';
import { createEHR, getAllEHRs, getEHRStats } from '../services/ehrService.js';

const router = express.Router();

// Use the service functions directly
router.post('/create', upload.single('fingerprint'), createEHR);
router.post('/create/nid', createEHR);
router.get('/all', getAllEHRs);
router.get('/stats', getEHRStats);

export default router; 