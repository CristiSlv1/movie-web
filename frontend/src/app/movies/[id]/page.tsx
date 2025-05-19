'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import './page.css';
import { getCurrentStatus } from '../../../utils/newtworkStatus';

interface Movie {
    id: number;
    title: string;
    description: string;
    image: string;
    rating: number;
    genre: string;
    created_at?: string;
}

interface Review {
    id: number;
    content: string;
    rating: number;
    username: string;
    created_at?: string | Date;
    movieId?: number;
}

export default function MovieDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [likedReviews, setLikedReviews] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovieAndReviews = async () => {
            try {
                setIsLoading(true);
                const status = getCurrentStatus();

                if (status === 'online') {
                    const token = localStorage.getItem('token');
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies/${params.id}/reviews`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    if (!res.ok) {
                        if (res.status === 404) {
                            throw new Error('Movie not found');
                        }
                        throw new Error(`Failed to fetch: ${res.status}`);
                    }
                    const data = await res.json();

                    // Log the raw data for debugging
                    console.log('Raw movie data:', data.movie);

                    // Validate and sanitize the image URL
                    let imageUrl = '/default-movie.jpg'; // Default fallback
                    if (data.movie.image) {
                        if (data.movie.image.startsWith('http')) {
                            imageUrl = data.movie.image;
                        } else if (data.movie.image.startsWith('/')) {
                            imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${data.movie.image}`;
                        } else {
                            imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${data.movie.image}`;
                        }
                    }

                    // Log the final image URL
                    console.log('Final image URL:', imageUrl);

                    // Handle the genre field
                    const genre = data.movie.genre?.name || data.movie.genre || 'Unknown';
                    console.log('Processed genre:', genre);

                    setMovie({
                        id: data.movie.id,
                        title: data.movie.title,
                        description: data.movie.description,
                        image: imageUrl,
                        rating: parseFloat(data.movie.rating),
                        genre: genre,
                        created_at: data.movie.created_at,
                    });

                    setReviews((data.reviews || []).map((review: any) => ({
                        id: review.id,
                        content: review.comment || 'No review text',
                        rating: parseFloat(review.rating),
                        username: review.username || 'anonymous',
                        created_at: review.created_at ? new Date(review.created_at) : undefined,
                        movieId: review.movieId,
                    })));
                } else {
                    const localMovies = JSON.parse(localStorage.getItem('movies') || '[]');
                    const localMovie = localMovies.find((m: Movie) => m.id === parseInt(params.id as string));
                    if (localMovie) {
                        setMovie({
                            ...localMovie,
                            genre: localMovie.genre?.name || localMovie.genre || 'Unknown',
                        });
                    } else {
                        setMovie(null);
                    }
                    setReviews([]);
                }
            } catch (error: any) {
                console.error('Error fetching movie and reviews:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMovieAndReviews();
    }, [params.id]);

    const handleLikeReview = (reviewId: number) => {
        setLikedReviews(prev => 
            prev.includes(reviewId) 
                ? prev.filter(id => id !== reviewId) 
                : [...prev, reviewId]
        );
    };

    const handleDeleteReview = (reviewId: number) => {
        setReviews(prev => prev.filter(review => review.id !== reviewId));
    };

    const handleImageError = () => {
        setImageError('Failed to load movie image');
        setMovie(prev => prev ? { ...prev, image: '/default-movie.jpg' } : null);
    };

    if (error) {
        return (
            <div className="notFoundState">
                {error}
                <button 
                    onClick={() => router.push('/')} 
                    style={{ 
                        marginTop: '1rem', 
                        padding: '0.5rem 1rem', 
                        background: '#00ff41', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        color: '#000',
                        fontFamily: "'Impact', sans-serif",
                        fontWeight: 'bold'
                    }}
                >
                    Back to Movies
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="loadingState">
                Loading...
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="notFoundState">
                <h2>Movie not found</h2>
                <p>ID: {params.id}</p>
                <button 
                    onClick={() => router.push('/')} 
                    className="watchlistButton mt-4"
                >
                    Back to Movies
                </button>
            </div>
        );
    }

    return (
        <div className="movieContainer">
            <div className="topNav">
                <button className="backButton" onClick={() => router.push('/')}>
                    <ArrowLeft />
                </button>
                <div className="navIcons">
                    <button><Heart /></button>
                </div>
            </div>
            <div 
                className="movieBanner" 
                style={{ backgroundImage: `url(${movie.image})` }}
            >
                <img
                    src={movie.image}
                    alt={movie.title}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        opacity: 0, // Hidden for now, used for error handling
                    }}
                    onError={handleImageError}
                />
                <div className="bannerOverlay">
                    <h1 className="movieTitle">{movie.title}</h1>
                    <p className="movieDescription">{movie.description}</p>
                    <p>Genre: {movie.genre}</p>
                    <p>Rating: {movie.rating}/10</p>
                    <div className="movieActions">
                        <button className="watchlistButton">
                            Add to Watchlist
                        </button>
                        <span className="friendsCount">
                            {Math.floor(Math.random() * 36)} friends watched
                        </span>
                    </div>
                </div>
            </div>
            {imageError && (
                <p style={{ color: '#ff3333', textAlign: 'center' }}>
                    {imageError}
                </p>
            )}
            <div className="tabsContainer">
                <button className="tabButton active">
                    Reviews
                </button>
            </div>
            <div className="reviewsSection">
                {reviews.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#e5e5e5' }}>
                        No reviews yet... Be the first to share your thoughts!
                    </p>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="reviewCard">
                            <div className="reviewHeader">
                                <div className="reviewUserDetails">
                                    <img 
                                        src="/default-avatar.png" 
                                        alt="avatar" 
                                        className="avatar"
                                    />
                                    <span className="reviewUser">
                                        @{review.username}
                                    </span>
                                </div>
                                <span>
                                    {review.rating}/10
                                </span>
                            </div>
                            <p className="reviewContent">
                                {review.content}
                            </p>
                            <div className="reviewFooter">
                                Posted on {review.created_at?.toLocaleString()}
                            </div>
                            <div className="reviewActions">
                                <button 
                                    className="heartButton" 
                                    onClick={() => handleLikeReview(review.id)}
                                    style={{ color: likedReviews.includes(review.id) ? '#ff3333' : '#666' }}
                                >
                                    <Heart size={20} />
                                </button>
                                <button 
                                    className="deleteButton" 
                                    onClick={() => handleDeleteReview(review.id)}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}