import { Movie } from '../types/movie'
    
let movies: Movie[] = [];
let nextId = 1;
    
export const db = {
    getMovies: () => movies,
    addMovie: (movie: Omit<Movie, "id">) => {
        const newMovie = { ...movie, id: nextId++ };
        movies.push(newMovie);
    return newMovie;
    },
    updateMovie: (id: number, updates: Partial<Movie>) => {
        const index = movies.findIndex(m => m.id === id);
        if (index === -1) return null;
        movies[index] = { ...movies[index], ...updates };
        return movies[index];
    },
        deleteMovie: (id: number) => {
        movies = movies.filter(m => m.id !== id);
    }
};