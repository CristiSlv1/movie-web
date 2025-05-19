import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import WebSocket from 'ws';
import { db } from './db';
import movies from './routes/movies';
import genresRouter from './routes/genres';
import statsRouter from './routes/stats';
import fileUpload from 'express-fileupload';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import authRoutes from './routes/auth';
import { AppDataSource } from './data-source';
import { LoggingService } from './services/LoggingService';
import { Log } from './entities/Log';
import { User } from './entities/User';
import { Movie } from './entities/Movie';
import { populateDatabase } from './scripts/populate-db';

export const monitoredUsers = new Set<number>();

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
}));
app.use(fileUpload());
app.use('/api/movies', movies);
app.use('/api/genres', genresRouter);
app.use('/api/stats', statsRouter);
app.use('/uploads', express.static(path.join(__dirname, '../Uploads')));

authRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// File upload endpoint
app.post('/api/upload', (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const file = req.files.file as fileUpload.UploadedFile;
    const uploadPath = path.join(__dirname, '../Uploads', file.name);
    file.mv(uploadPath, (err) => {
        if (err) {
            console.error('File upload error:', err);
            return res.status(500).json({ error: 'Failed to upload file' });
        }
        res.status(200).json({ fileUrl: `/uploads/${file.name}` });
    });
});

app.get('/api/files', (req, res) => {
    const uploadsDir = path.join(__dirname, '../Uploads');
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(200).json([]);
            }
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ error: 'Failed to read uploads directory' });
        }
        const fileList = files.map(file => ({
            name: file,
            url: `/uploads/${file}`,
        }));
        res.status(200).json(fileList);
    });
});

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const wss = new WebSocket.Server({ server });

const startMovieGeneration = () => {
    const interval = setInterval(async () => {
        const currentCount = await db.getMoviesCount();
        if (currentCount >= 100) {
            console.log('Reached 100 movies, stopping fake movie generation.');
            clearInterval(interval);
            return;
        }
        const moviesToGenerate = Math.min(10, 100 - currentCount);
        const newMovies = await db.generateFakeMovies(moviesToGenerate);
        for (const movie of newMovies) {
            await db.addMovie({
                title: movie.title,
                description: movie.description,
                image: movie.image,
                rating: movie.rating,
                genre: movie.genre.name,
            });
        }
        const update = {
            type: 'update',
            movies: await db.getMovies(),
            genreCounts: await db.getGenreCounts(),
        };
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(update));
            }
        });
    }, 10000);
};

const startMonitoring = async () => {
    const checkActivity = async () => {
        try {
            const logs = await AppDataSource.getRepository(Log).createQueryBuilder('log')
                .select(['log.userId', 'COUNT(log.id) as actionCount', 'MAX(log.timestamp) as lastAction'])
                .groupBy('log.userId')
                .having('COUNT(log.id) > 5')
                .getRawMany();

            console.log('Monitoring check - Logs found:', logs);

            logs.forEach(log => {
                const userId = log.log_userId; // Match the actual column name from the query result
                const actionCount = parseInt(log.actioncount); // Convert string to number
                if (!monitoredUsers.has(userId)) {
                    console.log(`User ${userId} detected with ${actionCount} actions, added to monitored list.`);
                    monitoredUsers.add(userId);
                }
            });

            console.log('Current monitored users:', Array.from(monitoredUsers));
        } catch (error) {
            console.error('Monitoring error:', error);
        }
    };

    await checkActivity();
    setInterval(checkActivity, 60000);
};

const simulateAttack = async () => {
    const adminUser = await AppDataSource.getRepository(User).findOneBy({ email: 'admin@example.com' });
    if (!adminUser) {
        console.error('Admin user not found for attack simulation.');
        return;
    }

    const attackers = [adminUser.id];
    for (const attackerId of attackers) {
        const actionCount = 15;
        console.log(`Simulating attack by user ${attackerId} with ${actionCount} CREATE actions.`);
        for (let i = 0; i < actionCount; i++) {
            try {
                await LoggingService.logAction(attackerId, 'CREATE', 'movie', i);
                console.log(`Logged action ${i + 1} for user ${attackerId}`);
            } catch (error) {
                console.error(`Failed to log action for user ${attackerId}:`, error);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    console.log('Attack simulation completed.');
};

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');
        const movieCount = await AppDataSource.getRepository(Movie).count();
        if (movieCount === 0) {
            console.log('No movies found in DB, populating with fake data...');
            await populateDatabase();
        }
        await simulateAttack();
        startMonitoring();
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }

    wss.on('connection', async ws => {
        try {
            ws.send(
                JSON.stringify({
                    type: 'initial',
                    movies: await db.getMovies(),
                    genreCounts: await db.getGenreCounts(),
                })
            );
        } catch (error) {
            console.error('WebSocket error:', error);
        }
    });
};

startServer();