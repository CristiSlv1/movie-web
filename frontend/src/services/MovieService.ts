// /services/MovieService.ts

import { Movie } from '../types/movie'

export class MovieService {
    static createMovie(arg0: { rating: number; title: string; description: string; image: string; genre: string; }) {
        throw new Error("Method not implemented.");
    }
    private static BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    static async fetchMovies(params: Record<string, string | number>): Promise<Movie[]> {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await fetch(`${this.BASE_URL}/api/movies?${queryString}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data as Movie[];
    }
}