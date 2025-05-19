import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const genres = await db.getGenres();
        res.json(genres);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch genres' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const genre = await db.getGenreById(parseInt(id));
        if (!genre) return res.status(404).json({ error: 'Genre not found' });
        res.json(genre);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch genre' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const genre = await db.addGenre(name);
        res.status(201).json(genre);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create genre' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const genre = await db.updateGenre(parseInt(id), name);
        if (!genre) return res.status(404).json({ error: 'Genre not found' });
        res.json(genre);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update genre' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await db.deleteGenre(parseInt(id));
        if (!success) return res.status(404).json({ error: 'Genre not found or cannot be deleted' });
        res.json({ message: 'Genre deleted' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message || 'Failed to delete genre' });
    }
});

export default router;