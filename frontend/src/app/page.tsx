"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "../components/ui/button";
import {
    AlignJustify,
    ChevronDown,
    Clapperboard,
    CircleUser,
    House,
    Upload,
    FileVideo,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import "./page.css";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { getCurrentStatus, onStatusChange } from "../utils/newtworkStatus";
import { addToQueue, getLocalMovies, mergeMovies, QueuedOperation, syncQueue, updateLocalMovies } from "../utils/offlineQueue";
import { Movie } from '../types/movie';
import NetworkStatusBanner from "../components/NetworkStatusBanner";

ChartJS.register(ArcElement, Tooltip, Legend);

const validGenres = ["Action", "SciFi", "Romance", "Horror", "Comedy"];

const validateMovie = (movie: Movie) => ({
    ...movie,
    image: movie.image || "/default-movie.jpg",
    title: movie.title || "Untitled Movie",
    rating: Math.min(Math.max(movie.rating, 0), 10),
});

function throttle(func: () => void, limit: number) {
    let inThrottle: boolean;
    return function() {
        if (!inThrottle) {
            func();
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDelay, setIsLoadingDelay] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<string>("");
    const [isInfinite, setIsInfinite] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [sortOption, setSortOption] = useState<string>("");
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [showAddMovie, setShowAddMovie] = useState<boolean>(false);
    const [newMovie, setNewMovie] = useState({
        title: "",
        description: "",
        image: "",
        genre: { id: 0, name: "" },
        rating: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [moviesPerPage, setMoviesPerPage] = useState<number>(20);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [showActionModal, setShowActionModal] = useState<boolean>(false);
    const [showEditMovie, setShowEditMovie] = useState<boolean>(false);
    const [editMovie, setEditMovie] = useState<Movie>({
        id: 0,
        title: "",
        description: "",
        image: "",
        genre: { id: 0, name: "" },
        rating: 0,
    });
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [genreCounts, setGenreCounts] = useState<{ genre: string; count: number }[]>([]);
    const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    const [showFilesModal, setShowFilesModal] = useState<boolean>(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);

    const fetchMovies = useCallback(async (forceRefresh = false) => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                page: currentPage.toString(),
                limit: moviesPerPage.toString(),
                ...(selectedGenre && selectedGenre !== "All Genres" && { genre: selectedGenre }),
                ...(sortOption && { sort: sortOption === "A-Z" ? "title-asc" : "title-desc" }),
            };
    
            const status = getCurrentStatus();
            let fetchedMovies: Movie[] = [];
    
            if (status === "online" || forceRefresh) {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies?${new URLSearchParams(params)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (!res.ok) throw new Error(`Failed to fetch movies: ${res.status}`);
                const data = await res.json();
                fetchedMovies = data.data || [];
                setHasMore(data.total > data.page * data.limit);
            } else {
                fetchedMovies = getLocalMovies().slice(
                    (currentPage - 1) * moviesPerPage,
                    currentPage * moviesPerPage
                );
                setHasMore(fetchedMovies.length === moviesPerPage);
            }
    
            setAllMovies(fetchedMovies);
        } catch (error) {
            console.error("Fetch error:", error);
            const localMovies = getLocalMovies().slice(
                (currentPage - 1) * moviesPerPage,
                currentPage * moviesPerPage
            );
            setAllMovies(localMovies);
            setHasMore(localMovies.length === moviesPerPage);
        } finally {
            setIsLoading(false);
        }
    }, [selectedGenre, sortOption, moviesPerPage, currentPage]);

    const fetchMoreMovies = useCallback(async (page = 1, append = false) => {
        if ((loadingMore && append) || isLoadingDelay) return;
    
        try {
            setLoadingMore(true);
            setIsLoadingDelay(true);

            const token = localStorage.getItem('token');
            const params = {
                page: page.toString(),
                limit: "20",
                ...(selectedGenre && selectedGenre !== "All Genres" && { genre: selectedGenre }),
                ...(sortOption && { sort: sortOption === "A-Z" ? "title-asc" : "title-desc" }),
            };
    
            const status = getCurrentStatus();
            let newMovies: Movie[] = [];
    
            if (status === "online") {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies?${new URLSearchParams(params)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (!res.ok) throw new Error("Failed to fetch movies");
                const data = await res.json();
                newMovies = data.data || data;
                setHasMore(data.page * data.limit < data.total);
            } else {
                newMovies = getLocalMovies().slice((page - 1) * 20, page * 20);
                setHasMore(newMovies.length >= 20);
            }
    
            setAllMovies(prev => append ? [...prev, ...newMovies] : newMovies);
        } catch (error) {
            console.error("Fetch error:", error);
            const localMovies = getLocalMovies().slice((page - 1) * 20, page * 20);
            setAllMovies(prev => append ? [...prev, ...localMovies] : localMovies);
            setHasMore(localMovies.length >= 20);
        } finally {
            setLoadingMore(false);
            setIsLoadingDelay(false);
        }
    }, [loadingMore, selectedGenre, sortOption, isInfinite, isLoadingDelay]);

    const fetchUploadedFiles = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/files`);
            if (!res.ok) throw new Error("Failed to fetch uploaded files");
            const files = await res.json();
            setUploadedFiles(files);
        } catch (error) {
            console.error("Error fetching uploaded files:", error);
            setUploadedFiles([]);
        }
    }, []);

    useEffect(() => {
        let ws: WebSocket;
        const connectWebSocket = () => {
            ws = new WebSocket('ws://localhost:3001');

            ws.onopen = () => {
                console.log('WebSocket connected');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'initial' || data.type === 'update') {
                    setAllMovies(prev => mergeMovies(data.movies, getLocalMovies()));
                    setGenreCounts(data.genreCounts);
                    setHasMore(data.movies.length >= moviesPerPage);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                fetchMovies(false);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected, attempting to reconnect...');
                setTimeout(connectWebSocket, 2000);
            };
        };

        connectWebSocket();
        return () => ws?.close();
    }, [fetchMovies]);

    useEffect(() => {
        fetchMovies();
        fetchUploadedFiles();
        const unsubscribe = onStatusChange((status) => {
            if (status === "online") {
                syncQueue().then(() => fetchMovies(true));
                fetchUploadedFiles();
            }
        });
        return () => unsubscribe();
    }, [fetchMovies, fetchUploadedFiles]);

    useEffect(() => {
        if (!isInfinite || !hasMore || isLoading || loadingMore || isLoadingDelay) return;
        
        const handleScroll = throttle(() => {
            const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                setCurrentPage(prev => {
                    const newPage = prev + 1;
                    fetchMoreMovies(newPage, true);
                    return newPage;
                });
            }
        }, 10000);
    
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isInfinite, hasMore, isLoading, loadingMore, isLoadingDelay, fetchMoreMovies]);

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setUploadStatus("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            setUploadStatus("Uploading...");
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();
            setUploadStatus(`File uploaded successfully! URL: ${data.fileUrl}`);
            setSelectedFile(null);
            setShowUploadModal(false);
            fetchUploadedFiles();
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus("Failed to upload file.");
        }
    };

    const ratings = allMovies.map((movie) => movie.rating) || [];
    const highestRating = ratings.length ? Math.max(...ratings) : 0;
    const lowestRating = ratings.length ? Math.min(...ratings) : 0;
    const avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    const chartData = {
        labels: validGenres,
        datasets: [{
            data: genreCounts.map(gc => gc.count),
            backgroundColor: ["#3498db", "#e74c3c", "#f1c40f", "#2ecc71", "#9b59b6"],
            borderColor: "#fff",
            borderWidth: 2,
        }],
    };

    const currentMovies = isInfinite 
        ? allMovies 
        : allMovies.slice(
            (currentPage - 1) * moviesPerPage,
            currentPage * moviesPerPage
        );

    const handleAddMovie = async (e: React.FormEvent) => {
        e.preventDefault();
        const status = getCurrentStatus();
        const tempId = Date.now();
        const newMovieWithId: Movie = {
            ...newMovie,
            id: tempId,
            rating: Number(newMovie.rating),
            genre: { id: tempId, name: newMovie.genre.name }
        };

        setAllMovies(prev => [...prev, newMovieWithId]);
        setNewMovie({ title: "", description: "", image: "", genre: { id: 0, name: "" }, rating: 0 });
        setShowAddMovie(false);

        if (status === "online") {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(newMovieWithId),
                });
                
                if (!response.ok) throw new Error("Failed to add movie");
                
                const createdMovie = await response.json();
                setAllMovies(prev => prev.map(m => m.id === tempId ? createdMovie : m));
            } catch (error) {
                console.error("Error adding movie:", error);
                const operation: QueuedOperation = { 
                    type: "add", 
                    data: newMovieWithId, 
                    id: tempId 
                };
                addToQueue(operation);
                updateLocalMovies([operation]);
                alert("Added locally - will sync when back online");
            }
        } else {
            const operation: QueuedOperation = { 
                type: "add", 
                data: newMovieWithId, 
                id: tempId 
            };
            addToQueue(operation);
            updateLocalMovies([operation]);
        }
    };

    const handleEditMovie = async (e: React.FormEvent) => {
        e.preventDefault();
        const status = getCurrentStatus();

        setAllMovies(prev => prev.map(m => m.id === editMovie.id ? editMovie : m));
        setShowEditMovie(false);

        if (status === "online") {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies/${editMovie.id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify(editMovie),
                    }
                );
                if (!response.ok) throw new Error("Failed to update movie");
            } catch (error) {
                console.error("Error updating movie:", error);
                const operation: QueuedOperation = {
                    type: "update",
                    id: editMovie.id,
                    data: editMovie,
                };
                addToQueue(operation);
                updateLocalMovies([operation]);
            }
        } else {
            const operation: QueuedOperation = {
                type: "update",
                id: editMovie.id,
                data: editMovie,
            };
            addToQueue(operation);
            updateLocalMovies([operation]);
        }
    };

    const handleDeleteMovie = async (id: number) => {
        const status = getCurrentStatus();

        setAllMovies(prev => prev.filter(m => m.id !== id));
        setShowActionModal(false);

        if (status === "online") {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies/${id}`,
                    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
                );
                if (!response.ok) throw new Error("Failed to delete movie");
            } catch (error) {
                console.error("Error deleting movie:", error);
                const operation: QueuedOperation = { type: "delete", id };
                addToQueue(operation);
                updateLocalMovies([operation]);
            }
        } else {
            const operation: QueuedOperation = { type: "delete", id };
            addToQueue(operation);
            updateLocalMovies([operation]);
        }
    };

    const handleRatingFilter = (category: "highest" | "average" | "lowest") => {
        const sorted = [...allMovies].sort((a, b) => a.rating - b.rating);
        const len = sorted.length;
        const third = Math.floor(len / 3);
        setAllMovies(
            category === "lowest"
                ? sorted.slice(0, third)
                : category === "average"
                ? sorted.slice(third, 2 * third)
                : sorted.slice(2 * third)
        );
    };

    return (
        <div>
            {isLoading && <div>Loading movies...</div>}
            <div className="dropdownPagination"></div>
            <div className="filterContainer">
                <Button
                    className="button-outline"
                    variant="outline"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    Sort By <ChevronDown />
                </Button>
                {showDropdown && (
                    <div className="dropdownMenu">
                        <button
                            onClick={() => {
                                setSortOption("title-asc");
                                setShowDropdown(false);
                                fetchMovies();
                            }}
                        >
                            A-Z
                        </button>
                        <button
                            onClick={() => {
                                setSortOption("title-desc");
                                setShowDropdown(false);
                                fetchMovies();
                            }}
                        >
                            Z-A
                        </button>
                    </div>
                )}
            </div>
            <div className="navButtons">
                <Button variant="outline">
                    <AlignJustify /> Menu
                </Button>
                <Button variant="outline">
                    <House /> Feed
                </Button>
                <Button variant="outline" className="pressed">
                    <Clapperboard /> Movie List
                </Button>
                <Button variant="outline">
                    <CircleUser /> Account
                </Button>
                <Button 
                    variant="outline" 
                    onClick={() => setShowUploadModal(true)}
                    style={{ marginTop: '10px' }}
                >
                    <Upload /> Upload a File
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        fetchUploadedFiles();
                        setShowFilesModal(true);
                    }}
                    style={{ marginTop: '10px' }}
                >
                    <FileVideo /> See Files
                </Button>
                {showFilesModal && (
                    <style>
                        {`
                            video {
                                max-width: 400px;
                                max-height: 400px;
                            }
                            .modalContent {
                                max-height: 80vh;
                                overflow-y: auto;
                            }
                        `}
                    </style>
                )}
            </div>
            <div className="addMovieButton">
                <Button variant="outline" onClick={() => setShowAddMovie(true)}>
                    Add a Movie
                </Button>
            </div>
            {showAddMovie && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <form onSubmit={handleAddMovie}>
                            <input
                                type="text"
                                placeholder="Title"
                                value={newMovie.title}
                                onChange={(e) =>
                                    setNewMovie({ ...newMovie, title: e.target.value })
                                }
                                required
                            />
                            <textarea
                                placeholder="Description"
                                value={newMovie.description}
                                onChange={(e) =>
                                    setNewMovie({ ...newMovie, description: e.target.value })
                                }
                                required
                            />
                            <input
                                type="text"
                                placeholder="Image URL"
                                value={newMovie.image}
                                onChange={(e) =>
                                    setNewMovie({ ...newMovie, image: e.target.value })
                                }
                                required
                            />
                            <select
                                value={newMovie.genre.name}
                                onChange={(e) =>
                                    setNewMovie({ 
                                        ...newMovie, 
                                        genre: { id: Date.now(), name: e.target.value } 
                                    })
                                }
                                required
                            >
                                <option value="">Select Genre</option>
                                {validGenres.map((genre) => (
                                    <option key={genre} value={genre}>
                                        {genre}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Rating (1-10)"
                                step="0.1"
                                min="1"
                                max="10"
                                value={newMovie.rating}
                                onChange={(e) =>
                                    setNewMovie({ ...newMovie, rating: Number(e.target.value) })
                                }
                                required
                            />
                            <Button type="submit">Add Movie</Button>
                            <Button type="button" onClick={() => setShowAddMovie(false)}>
                                Close
                            </Button>
                        </form>
                    </div>
                </div>
            )}
            {showUploadModal && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <form onSubmit={handleFileUpload}>
                            <input
                                type="file"
                                accept="video/mp4,video/mov,video/avi,video/mkv"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            <Button type="submit">Upload File</Button>
                            <Button type="button" onClick={() => setShowUploadModal(false)}>
                                Close
                            </Button>
                            {uploadStatus && <p>{uploadStatus}</p>}
                        </form>
                    </div>
                </div>
            )}
            {showFilesModal && (
                <div className="modalOverlay">
                    <div className="modalContent" style={{ maxWidth: '800px', width: '100%' }}>
                        <h2>Uploaded Files</h2>
                        {uploadedFiles.length === 0 ? (
                            <p>No files uploaded yet.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {uploadedFiles.map((file) => (
                                    <li key={file.name} style={{ marginBottom: '20px' }}>
                                        <p>{file.name}</p>
                                        <video 
                                            controls 
                                            src={file.url} 
                                            style={{ maxWidth: '100%', height: 'auto' }}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                        <div>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => window.open(file.url, '_blank')}
                                                style={{ marginTop: '10px', marginRight: '10px' }}
                                            >
                                                Download
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Button onClick={() => setShowFilesModal(false)}>Close</Button>
                    </div>
                </div>
            )}
            <div className="statsContainer">
                <button
                    className="ratingButtonHighest"
                    onClick={() => handleRatingFilter("highest")}
                >
                    Highest Rating: {highestRating}
                </button>
                <button
                    className="ratingButtonAverage"
                    onClick={() => handleRatingFilter("average")}
                >
                    Average Rating: {avgRating.toFixed(2)}
                </button>
                <button
                    className="ratingButtonLowest"
                    onClick={() => handleRatingFilter("lowest")}
                >
                    Lowest Rating: {lowestRating}
                </button>
            </div>
            <div className="pieChartContainer">
                <Pie data={chartData} />
            </div>
            <div className="genreButtons">
                {["All Genres", ...validGenres].map((genre) => (
                    <Button
                        key={genre}
                        variant="outline"
                        onClick={() => {
                            setSelectedGenre(genre === "All Genres" ? "" : genre);
                            setCurrentPage(1);
                            fetchMovies();
                        }}
                    >
                        {genre}
                    </Button>
                ))}
            </div>
            <div className="movieGridContainer">
                <div className="movieGrid">
                    {currentMovies.map((movie) => {
                        const validatedMovie = validateMovie(movie);
                        let backgroundColor = "";
                        if (movie.rating === highestRating) backgroundColor = "blue";
                        else if (movie.rating === lowestRating) backgroundColor = "red";
                        else if (movie.rating === avgRating) backgroundColor = "yellow";
                        return (
                            <Link href={`/movies/${movie.id}`} key={validatedMovie.id}>
                                <div
                                    className="movieCard"
                                    style={{ backgroundColor }}
                                >
                                    <Image
                                        src={validatedMovie.image}
                                        alt="alt text"
                                        width={200}
                                        height={300}
                                        className="movieImage"
                                    />
                                    <h3 className="movieTitle">{movie.title}</h3>
                                    <p className="movieDescription">{movie.description}</p>
                                    <p className="movieRating">Rating: {movie.rating}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="paginationControls">
                    {!isInfinite && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span>
                                Page {currentPage} of {Math.ceil(allMovies.length / moviesPerPage) || 1}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage((p) => p + 1)}
                                disabled={currentPage * moviesPerPage >= allMovies.length}
                            >
                                Next
                            </Button>
                        </>
                    )}
                    <select
                        value={moviesPerPage}
                        onChange={(e) => {
                            const value = e.target.value;
                            const newMoviesPerPage = value === "infinite" ? 50 : Number(value);
                            setIsInfinite(value === "infinite");
                            setMoviesPerPage(newMoviesPerPage);
                            setCurrentPage(1);
                            fetchMovies();
                        }}
                        className="pageSizeDropdown"
                    >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value="infinite">Infinite Scroll</option>
                    </select>
                    {isInfinite && (hasMore && (loadingMore || isLoadingDelay)) && (
                        <div className="loading-spinner">Loading more movies...</div>
                    )}  
                </div>

                {showActionModal && selectedMovie && (
                    <div className="modalOverlay">
                        <div className="modalContent">
                            <h2>{selectedMovie.title}</h2>
                            <p>{selectedMovie.description}</p>
                            <Button
                                variant="outline"
                                onClick={() => handleDeleteMovie(selectedMovie.id)}
                            >
                                Remove
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditMovie(selectedMovie);
                                    setShowEditMovie(true);
                                    setShowActionModal(false);
                                }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowActionModal(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
                {showEditMovie && (
                    <div className="modalOverlay">
                        <div className="modalContent">
                            <form onSubmit={handleEditMovie}>
                                <input
                                    type="text"
                                    value={editMovie.title}
                                    onChange={(e) =>
                                        setEditMovie({ ...editMovie, title: e.target.value })
                                    }
                                    required
                                />
                                <textarea
                                    value={editMovie.description}
                                    onChange={(e) =>
                                        setEditMovie({ ...editMovie, description: e.target.value })
                                    }
                                    required
                                />
                                <input
                                    type="text"
                                    value={editMovie.image}
                                    onChange={(e) =>
                                        setEditMovie({ ...editMovie, image: e.target.value })
                                    }
                                    required
                                />
                                <input
                                    type="text"
                                    value={editMovie.genre.name}
                                    onChange={(e) =>
                                        setEditMovie({ 
                                            ...editMovie, 
                                            genre: { id: Date.now(), name: e.target.value } 
                                        })
                                    }
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    max="10"
                                    value={editMovie.rating}
                                    onChange={(e) =>
                                        setEditMovie({ ...editMovie, rating: Number(e.target.value) })
                                    }
                                    required
                                />
                                <Button type="submit">Update Movie</Button>
                                <Button type="button" onClick={() => setShowEditMovie(false)}>
                                    Close
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}