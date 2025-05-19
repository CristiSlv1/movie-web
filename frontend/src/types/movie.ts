// types/movie.ts
export interface Movie {
    id: number;
    title: string;
    description: string;
    image: string;
    genre: { id: number; name: string } | null;
    rating: number;
    created_at?: string;
}

export interface Review {
    id: number;
    comment: string;
    rating: number;
    created_at?: Date;
    movieId: number;
    username?: string;
}