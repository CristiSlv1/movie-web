import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/genre-stats', async (req, res) => {
    try {
        const stats = await db.getGenreStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;