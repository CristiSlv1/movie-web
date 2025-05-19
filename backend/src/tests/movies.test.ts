import express from 'express';
import request from 'supertest';
import moviesRouter from '../routes/movies';
import { db } from '../db';

jest.mock('../db'); // Mock the db module

const app = express();
app.use(express.json());
app.use('/movies', moviesRouter);

const mockMovie = {
    id: 1,
    title: 'Test Movie',
    description: 'A test description',
    image: 'https://example.com/image.jpg',
    genre: 'Action',
    rating: 7.5,
    created_at: new Date().toISOString(),
};

describe('Movies API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /movies', () => {
        it('returns paginated movies', async () => {
        (db.getMovies as jest.Mock).mockResolvedValue([mockMovie, mockMovie]);

        const res = await request(app).get('/movies?page=1&limit=1');
        expect(res.status).toBe(200);
        expect(db.getMovies).toHaveBeenCalled();
        expect(res.body.data).toHaveLength(1);
        expect(res.body.total).toBe(2);
        expect(res.body.page).toBe(1);
        expect(res.body.limit).toBe(1);
        });

        it('returns sorted movies', async () => {
        (db.getMoviesSorted as jest.Mock).mockResolvedValue([mockMovie]);

        const res = await request(app).get('/movies?sort=rating-desc');
        expect(res.status).toBe(200);
        expect(db.getMoviesSorted).toHaveBeenCalledWith('rating-desc');
        });

        it('returns movies filtered by genre', async () => {
        (db.getMoviesByGenre as jest.Mock).mockResolvedValue([mockMovie]);

        const res = await request(app).get('/movies?genre=Action');
        expect(res.status).toBe(200);
        expect(db.getMoviesByGenre).toHaveBeenCalledWith('Action');
        });

        it('handles DB errors gracefully', async () => {
        (db.getMovies as jest.Mock).mockRejectedValue(new Error('DB failed'));

        const res = await request(app).get('/movies');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('DB failed');
    });
});

    describe('GET /movies/:id', () => {
        it('returns a movie by ID', async () => {
        (db.getMovieById as jest.Mock).mockResolvedValue(mockMovie);

        const res = await request(app).get('/movies/1');
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(mockMovie.id);
    });

    it('returns 404 if movie not found', async () => {
        (db.getMovieById as jest.Mock).mockResolvedValue(null);

        const res = await request(app).get('/movies/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Movie not found');
    });

    it('handles DB errors gracefully', async () => {
        (db.getMovieById as jest.Mock).mockRejectedValue(new Error());

        const res = await request(app).get('/movies/1');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to fetch movie');
    });
});

    describe('POST /movies', () => {
        it('creates a movie', async () => {
        (db.addMovie as jest.Mock).mockResolvedValue(mockMovie);

        const res = await request(app).post('/movies').send(mockMovie);
        expect(res.status).toBe(201);
        expect(res.body.title).toBe(mockMovie.title);
    });

    it('handles errors on movie creation', async () => {
        (db.addMovie as jest.Mock).mockRejectedValue(new Error('Create failed'));

        const res = await request(app).post('/movies').send(mockMovie);
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Create failed');
    });
});

describe('PUT /movies/:id', () => {
        it('updates a movie', async () => {
        const updated = { ...mockMovie, title: 'Updated' };
        (db.updateMovie as jest.Mock).mockResolvedValue(updated);

        const res = await request(app).put('/movies/1').send({ title: 'Updated' });
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated');
        });

        it('returns 404 if movie not found', async () => {
        (db.updateMovie as jest.Mock).mockResolvedValue(null);

        const res = await request(app).put('/movies/999').send({ title: 'Updated' });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Movie not found');
        });

        it('handles DB errors on update', async () => {
        (db.updateMovie as jest.Mock).mockRejectedValue(new Error('Update error'));

        const res = await request(app).put('/movies/1').send({ title: 'Updated' });
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Update error');
        });
    });

    describe('DELETE /movies/:id', () => {
        it('deletes a movie', async () => {
        (db.deleteMovie as jest.Mock).mockResolvedValue(true);

        const res = await request(app).delete('/movies/1');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Movie deleted');
        });

        it('returns 404 if movie not found', async () => {
        (db.deleteMovie as jest.Mock).mockResolvedValue(false);

        const res = await request(app).delete('/movies/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Movie not found');
        });

        it('handles DB errors on delete', async () => {
        (db.deleteMovie as jest.Mock).mockRejectedValue(new Error('Delete error'));

        const res = await request(app).delete('/movies/1');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to delete movie');
        });
    });
});
