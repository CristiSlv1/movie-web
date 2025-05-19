import { AppDataSource } from './data-source';
import { Movie } from './entities/Movie';
import { Genre } from './entities/Genre';
import { faker } from '@faker-js/faker';
import { In, Like, Between } from 'typeorm';

export interface MovieDTO {
    id: number;
    title: string;
    description: string;
    image: string;
    genre: string;
    rating: number;
    created_at?: string;
}

export interface GenreDTO {
    id: number;
    name: string;
}

export interface ReviewDTO {
    id: number;
    comment: string;
    rating: number;
    created_at?: string;
    movieId: number;
}


let cachedStats: any[] | null = null;

export const db = {
    initialize: async () => {
        await AppDataSource.initialize();
        // Ensure genres exist
        const genreRepo = AppDataSource.getRepository(Genre);
        const validGenres = ['Action', 'SciFi', 'Romance', 'Horror', 'Comedy'];
        const existingGenres = await genreRepo.find();
        const missingGenres = validGenres.filter(
            name => !existingGenres.some(g => g.name === name)
        );
        if (missingGenres.length > 0) {
            await genreRepo.save(missingGenres.map(name => ({ name })));
        }
    },

    generateFakeMovies: async (count: number) => {
        const genreRepo = AppDataSource.getRepository(Genre);
        const movieRepo = AppDataSource.getRepository(Movie);
        const genres = await genreRepo.find();
        const movies: Movie[] = Array.from({ length: count }, () =>
            movieRepo.create({
                title: faker.lorem.words(3),
                description: faker.lorem.paragraph(),
                image: faker.image.urlLoremFlickr({ category: 'movie' }),
                rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
                genre: faker.helpers.arrayElement(genres),
            })
        );
        return movieRepo.save(movies);
    },

    initializeFakeData: async (count = 100) => {
        const movieRepo = AppDataSource.getRepository(Movie);
        const currentCount = await movieRepo.count();
        if (currentCount < 100) {
            const moviesToGenerate = Math.min(count, 100 - currentCount);
            if (moviesToGenerate > 0) {
                await db.generateFakeMovies(moviesToGenerate);
            }
        }
    },

    // Movie CRUD
    getMovies: async (): Promise<MovieDTO[]> => {
        const movies = await AppDataSource.getRepository(Movie).find({ relations: ['genre'] });
        return movies.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            image: m.image,
            rating: m.rating,
            created_at: m.created_at?.toISOString(),
            genre: m.genre.name,
        }));
    },

    getMovieById: async (id: number): Promise<MovieDTO | null> => {
        const movie = await AppDataSource.getRepository(Movie).findOne({
            where: { id },
            relations: ['genre'],
        });
        if (!movie) return null;
        return {
            id: movie.id,
            title: movie.title,
            description: movie.description,
            image: movie.image,
            rating: movie.rating,
            created_at: movie.created_at?.toISOString(),
            genre: movie.genre.name,
        };
    },

    addMovie: async (movie: Omit<MovieDTO, 'id' | 'created_at'>): Promise<MovieDTO> => {
        const genreRepo = AppDataSource.getRepository(Genre);
        const movieRepo = AppDataSource.getRepository(Movie);
        const genre = await genreRepo.findOneBy({ name: movie.genre });
        if (!genre) throw new Error('Invalid genre');
        const newMovie = movieRepo.create({
            title: movie.title,
            description: movie.description,
            image: movie.image,
            rating: Math.min(Math.max(movie.rating, 0), 10),
            genre,
        });
        const savedMovie = await movieRepo.save(newMovie);
        return {
            id: savedMovie.id,
            title: savedMovie.title,
            description: savedMovie.description,
            image: savedMovie.image,
            rating: savedMovie.rating,
            created_at: savedMovie.created_at?.toISOString(),
            genre: savedMovie.genre.name,
        };
    },

    updateMovie: async (id: number, updates: Partial<MovieDTO>): Promise<MovieDTO | null> => {
        const movieRepo = AppDataSource.getRepository(Movie);
        const movie = await movieRepo.findOne({ where: { id }, relations: ['genre'] });
        if (!movie) return null;
        if (updates.genre) {
            const genre = await AppDataSource.getRepository(Genre).findOneBy({ name: updates.genre });
            if (!genre) throw new Error('Invalid genre');
            movie.genre = genre;
        }
        if (updates.title) movie.title = updates.title;
        if (updates.description) movie.description = updates.description;
        if (updates.image) movie.image = updates.image;
        if (updates.rating !== undefined) {
            movie.rating = Math.min(Math.max(updates.rating, 0), 10);
        }
        const updatedMovie = await movieRepo.save(movie);
        return {
            id: updatedMovie.id,
            title: updatedMovie.title,
            description: updatedMovie.description,
            image: updatedMovie.image,
            rating: updatedMovie.rating,
            created_at: updatedMovie.created_at?.toISOString(),
            genre: updatedMovie.genre.name,
        };
    },

    deleteMovie: async (id: number): Promise<boolean> => {
        const result = await AppDataSource.getRepository(Movie).delete(id);
        return (result.affected ?? 0) > 0;
    },

    searchMovies: async (queryString: string): Promise<MovieDTO[]> => {
        const movies = await AppDataSource.getRepository(Movie)
            .createQueryBuilder('movie')
            .leftJoinAndSelect('movie.genre', 'genre')
            .where('LOWER(movie.title) LIKE :term OR LOWER(movie.description) LIKE :term', {
                term: `%${queryString.toLowerCase()}%`,
            })
            .getMany();
        return movies.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            image: m.image,
            rating: m.rating,
            created_at: m.created_at?.toISOString(),
            genre: m.genre.name,
        }));
    },

    getMoviesByGenre: async (genre: string): Promise<MovieDTO[]> => {
        const movieRepo = AppDataSource.getRepository(Movie);
        let movies: Movie[];
        if (genre.toLowerCase() === 'all genres') {
            movies = await movieRepo.find({ relations: ['genre'] });
        } else {
            movies = await movieRepo.find({
                where: { genre: { name: genre } },
                relations: ['genre'],
            });
        }
        return movies.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            image: m.image,
            rating: m.rating,
            created_at: m.created_at?.toISOString(),
            genre: m.genre.name,
        }));
    },

    // Genre CRUD
    getGenres: async (): Promise<GenreDTO[]> => {
        return AppDataSource.getRepository(Genre).find();
    },

    getGenreById: async (id: number): Promise<GenreDTO | null> => {
        return AppDataSource.getRepository(Genre).findOneBy({ id });
    },

    addGenre: async (name: string): Promise<GenreDTO> => {
        const genreRepo = AppDataSource.getRepository(Genre);
        const genre = genreRepo.create({ name });
        return genreRepo.save(genre);
    },

    updateGenre: async (id: number, name: string): Promise<GenreDTO | null> => {
        const genreRepo = AppDataSource.getRepository(Genre);
        const genre = await genreRepo.findOneBy({ id });
        if (!genre) return null;
        genre.name = name;
        return genreRepo.save(genre);
    },

    deleteGenre: async (id: number): Promise<boolean> => {
        const movieRepo = AppDataSource.getRepository(Movie);
        const movieCount = await movieRepo.count({ where: { genre: { id } } });
        if (movieCount > 0) {
            throw new Error('Cannot delete genre that is used by movies');
        }
        const result = await AppDataSource.getRepository(Genre).delete(id);
        return (result.affected ?? 0) > 0;
    },

    // Sorting for movies
    getMoviesSorted: async (sort: string): Promise<MovieDTO[]> => {
        const [field, order] = sort.split('-');
        const validFields = ['title', 'rating'];
        const validOrders = ['asc', 'desc'];
        if (!validFields.includes(field) || !validOrders.includes(order)) {
            throw new Error('Invalid sort parameters');
        }
        const movies = await AppDataSource.getRepository(Movie)
            .createQueryBuilder('movie')
            .leftJoinAndSelect('movie.genre', 'genre')
            .orderBy(`movie.${field}`, order.toUpperCase() as 'ASC' | 'DESC')
            .getMany();
        return movies.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            image: m.image,
            rating: m.rating,
            created_at: m.created_at?.toISOString(),
            genre: m.genre.name,
        }));
    },

    // Sorting for genres
    getGenresSorted: async (order: 'asc' | 'desc'): Promise<GenreDTO[]> => {
        return AppDataSource.getRepository(Genre)
            .createQueryBuilder('genre')
            .orderBy('genre.name', order.toUpperCase() as 'ASC' | 'DESC')
            .getMany();
    },

    getGenreStats: async () => {
        if (cachedStats) {
            console.log('Returning cached stats');
            return cachedStats;
        }
        const stats = await AppDataSource.query(`
            SELECT 
                g.name AS genre,
                COUNT(DISTINCT m.id)::bigint AS movie_count,
                COUNT(r.id)::bigint AS review_count,
                AVG(m.rating)::numeric(4,2) AS avg_movie_rating
            FROM genres g
            LEFT JOIN movies m ON g.id = m.genre_id
            LEFT JOIN reviews r ON m.id = r."movieId"
            GROUP BY g.name
            ORDER BY avg_movie_rating DESC NULLS LAST;
        `);
        cachedStats = stats;
        setTimeout(() => { cachedStats = null; }, 60000); // Clear cache after 1 minute
        return stats;
    },

    // Filtering by rating range
    getMoviesByRatingRange: async (minRating: number, maxRating: number): Promise<MovieDTO[]> => {
        const movies = await AppDataSource.getRepository(Movie).find({
            where: { rating: Between(minRating, maxRating) },
            relations: ['genre'],
        });
        return movies.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            image: m.image,
            rating: m.rating,
            created_at: m.created_at?.toISOString(),
            genre: m.genre.name,
        }));
    },

    // Helper for WebSocket
    getMoviesCount: async (): Promise<number> => {
        return AppDataSource.getRepository(Movie).count();
    },

    getGenreCounts: async () => {
        const validGenres = ['Action', 'SciFi', 'Romance', 'Horror', 'Comedy'];
        const counts = [];
        for (const genre of validGenres) {
            const count = await AppDataSource.getRepository(Movie).count({
                where: { genre: { name: genre } },
            });
            counts.push({ genre, count });
        }
        return counts;
    },
};