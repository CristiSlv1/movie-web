import express from 'express';
import { db } from '../db';
import { AppDataSource } from '../data-source';
import { Movie } from '../entities/Movie';
import { Review } from '../entities/Review';
import { LoggingService } from '../services/LoggingService';
import * as jwt from 'jsonwebtoken';

const router = express.Router();

// Add health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

router.get('/', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; role: string };
        const { page = '1', limit = '20', genre, sort } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        let movies: any[] = [];
        let total: number;

        if (genre || sort) {
            if (sort) {
                movies = await db.getMoviesSorted(sort as string);
            } else if (genre) {
                movies = await db.getMoviesByGenre(genre as string);
            } else {
                movies = await db.getMovies();
            }
            total = movies.length;
            movies = movies.slice(skip, skip + limitNum);
        } else {
            movies = await db.getMovies();
            total = movies.length;
            movies = movies.slice(skip, skip + limitNum);
        }

        for (const movie of movies) {
            if (movie.id) {
                await LoggingService.logAction(decoded.id, 'READ', 'movie', movie.id);
            }
        }

        res.json({
            data: movies,
            total,
            page: pageNum,
            limit: limitNum,
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message || 'Failed to fetch movies' });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; role: string };
        const { id } = req.params;
        const movie = await db.getMovieById(parseInt(id));
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        await LoggingService.logAction(decoded.id, 'READ', 'movie', parseInt(id));
        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch movie' });
    }
});

router.post('/', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; role: string };
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can add movies' });
        }

        const movie = await db.addMovie(req.body);
        await LoggingService.logAction(decoded.id, 'CREATE', 'movie', movie.id);
        res.status(201).json(movie);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message || 'Failed to create movie' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; role: string };
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can update movies' });
        }

        const { id } = req.params;
        const movie = await db.updateMovie(parseInt(id), req.body);
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        await LoggingService.logAction(decoded.id, 'UPDATE', 'movie', parseInt(id));
        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message || 'Failed to update movie' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; role: string };
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can delete movies' });
        }

        const { id } = req.params;
        const success = await db.deleteMovie(parseInt(id));
        if (!success) return res.status(404).json({ error: 'Movie not found' });
        await LoggingService.logAction(decoded.id, 'DELETE', 'movie', parseInt(id));
        res.json({ message: 'Movie deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete movie' });
    }
});

router.get("/:id/reviews", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; role: string };
        const movieId = parseInt(req.params.id);

        const movie = await AppDataSource.getRepository(Movie).findOne({
            where: { id: movieId },
        });

        if (!movie) {
            return res.status(404).json({ error: "Movie not found" });
        }

        const reviews = await AppDataSource.getRepository(Review).find({
            where: { movie: { id: movieId } },
            relations: ["movie"],
        });

        const reviewsWithUsername = reviews.map(review => ({
            ...review,
            username: `User${review.id}`,
        }));

        await LoggingService.logAction(decoded.id, 'READ', 'review', movieId);
        res.status(200).json({ movie, reviews: reviewsWithUsername });
    } catch (error) {
        console.error("Error fetching movie and reviews:", error);
        res.status(500).json({ error: "Failed to fetch movie and reviews" });
    }
});

export default router;