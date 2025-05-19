import { AppDataSource } from '../data-source';
import { Genre } from '../entities/Genre';
import { Movie } from '../entities/Movie';
import { Review } from '../entities/Review';
import { faker } from '@faker-js/faker';
import { User } from '../entities/User';

async function populateDatabase() {
    await AppDataSource.initialize();
    
    // Get repositories
    const genreRepo = AppDataSource.getRepository(Genre);
    const movieRepo = AppDataSource.getRepository(Movie);
    const reviewRepo = AppDataSource.getRepository(Review);
    const userRepo = AppDataSource.getRepository(User);

    // Create 1,000 dummy users
    console.log('Creating dummy users...');
    const users = [];
    for (let i = 0; i < 1000; i++) {
        const user = userRepo.create({
            email: `user${i + 1}@example.com`,
            password: '$2b$10$XlWYb6L.5z7V7V7V7V7V7eXlWYb6L.5z7V7V7V7V7V7eXlWYb6L.5z7V7V7V7V7V7e',
            role: i === 0 ? 'admin' : 'user',
        });
        users.push(await userRepo.save(user));
    }
    console.log('Created 1,000 dummy users');

    // Ensure 5 valid genres exist
    console.log('Ensuring valid genres...');
    console.time('Ensure genres');
    const validGenres = ['Action', 'SciFi', 'Romance', 'Horror', 'Comedy'];
    const existingGenres = await genreRepo.find();
    const genresToAdd = validGenres.filter(name => !existingGenres.some(g => g.name === name));
    if (genresToAdd.length > 0) {
        await genreRepo.save(genresToAdd.map(name => ({ name })));
    }
    const savedGenres = await genreRepo.find();
    console.timeEnd('Ensure genres');
    console.log('Ensured 5 valid genres.');

    // Generate 100,000 movies without user association
    console.log('Generating movies...');
    console.time('Generate movies');
    const movies: Partial<Movie>[] = [];
    for (let i = 0; i < 100000; i++) {
        const createdAt = faker.date.past({ years: 2 });
        movies.push({
            title: faker.lorem.words(3),
            description: faker.lorem.paragraph(),
            image: faker.image.urlLoremFlickr({ category: 'movie' }),
            rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
            created_at: createdAt,
            genre: savedGenres[Math.floor(Math.random() * savedGenres.length)],
            // Removed user association, user_id will be null
        });
        if ((i + 1) % 5000 === 0) console.log(`Generated ${i + 1} movies...`);
    }
    console.timeEnd('Generate movies');

    // Insert movies
    console.time('Insert movies');
    await movieRepo.save(movies.map(movie => movieRepo.create(movie)), { chunk: 5000 });
    console.timeEnd('Insert movies');
    console.log('Inserted 100,000 movies.');

    // Generate 100,000 reviews with user association
    console.log('Generating reviews...');
    console.time('Generate reviews');
    const savedMovies = await movieRepo.find();
    const reviews: Partial<Review>[] = [];
    for (let i = 0; i < 100000; i++) {
        const createdAt = faker.date.between({
            from: savedMovies[0].created_at || new Date('2023-01-01'),
            to: new Date()
        });
        const movie = savedMovies[Math.floor(Math.random() * savedMovies.length)];
        reviews.push({
            comment: faker.lorem.sentence(),
            rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
            created_at: createdAt,
            movie: movie,
            movieId: movie.id,
            user: users[Math.floor(Math.random() * users.length)],
        });
        if ((i + 1) % 5000 === 0) console.log(`Generated ${i + 1} reviews...`);
    }
    console.timeEnd('Generate reviews');

    // Insert reviews
    console.time('Insert reviews');
    await reviewRepo.save(reviews.map(review => reviewRepo.create(review)), { chunk: 5000 });
    console.timeEnd('Insert reviews');
    console.log('Inserted 100,000 reviews.');

    await AppDataSource.destroy();
    console.log('Database population complete.');
}

populateDatabase().catch(console.error);