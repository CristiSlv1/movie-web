import { Movie } from "../types/movie";
import { getCurrentStatus } from "./newtworkStatus";

const QUEUE_KEY = "offlineQueue";
const LOCAL_DATA_KEY = "offlineMovies";
const SYNC_RETRY_INTERVAL = 10000; // 10 seconds

export type OperationType = "add" | "update" | "delete";

export function getLocalMovies(): Movie[] {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || "[]");
}

export function startSyncMonitor() {
    if (typeof window === "undefined") return;
    
    setInterval(() => {
        if (getCurrentStatus() === "online" && getQueue().length > 0) {
            autoSyncQueue();
        }
    }, SYNC_RETRY_INTERVAL);
}

startSyncMonitor();

let isSyncing = false;

export async function autoSyncQueue() {
    if (isSyncing) return;
    
    const queue = getQueue();
    if (queue.length === 0) return;

    try {
        isSyncing = true;
        await syncQueue(); // Uses our existing sync function
        console.log("Auto-sync completed successfully");
        window.dispatchEvent(new Event("syncComplete"));

    } catch (error) {
        console.error("Auto-sync failed, will retry later", error);
    } finally {
        isSyncing = false;
    }
}

export function updateLocalMovies(operations: QueuedOperation[]) {
    let movies = getLocalMovies();
    
    operations.forEach(op => {
        switch(op.type) {
            case "add":
            movies.push({ ...op.data, id: op.id || Date.now() });
            break;
            case "update":
            movies = movies.map(m => m.id === op.id ? { ...m, ...op.data } : m);
            break;
            case "delete":
            movies = movies.filter(m => m.id !== op.id);
            break;
        }
    });
    
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(movies));
}

export interface QueuedOperation {
    type: OperationType;
    data?: Movie; // Optional data for add and update operations
    id?: number; // Required for update and delete, optional for add
}

export function mergeMovies(serverMovies: Movie[], localMovies: Movie[]): Movie[] {
    const serverMap = new Map<number, Movie>();
    const localMap = new Map<number, Movie>();

    // Create maps for quick lookup
    serverMovies.forEach(movie => serverMap.set(movie.id, movie));
    localMovies.forEach(movie => localMap.set(movie.id, movie));

    // Merge strategy: Local changes override server data
    const mergedMovies = [...serverMovies];
    
    localMap.forEach((localMovie, id) => {
        if (!serverMap.has(id)) {
            // New offline-added movie
            mergedMovies.push(localMovie);
        } else {
            // Find and update existing movie
            const index = mergedMovies.findIndex(m => m.id === id);
            if (index !== -1) {
            mergedMovies[index] = { ...mergedMovies[index], ...localMovie };
            }
        }
    });

    return mergedMovies;
}

export function addToQueue(operation: QueuedOperation) {
    if (
        !operation ||
        !operation.type ||
        (operation.type === "add" && !operation.data) ||
        (operation.type === "update" && (!operation.id || !operation.data)) ||
        (operation.type === "delete" && !operation.id)
    ) {
        console.warn("Invalid operation, not queued:", operation);
        return;
    }

    const queue = getQueue();
    queue.push(operation);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedOperation[] {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
}

export function clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
}

export async function syncQueue() {
    const queue = getQueue();
    const localMovies = getLocalMovies();
    
    try{
        const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies`);
        const serverData = await serverResponse.json();
    
        // Merge changes
        const mergedData = mergeMovies(serverData.data || [], localMovies);

        for (const op of queue) {
            try {
                if (op.type === "add") {
                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(op.data),
                    });
                } else if (op.type === "update" && op.id !== undefined) {
                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies/${op.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(op.data),
                    });
                } else if (op.type === "delete" && op.id !== undefined) {
                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/movies/${op.id}`, {
                        method: "DELETE",
                    });
                }
            } catch (err) {
                console.error("❌ Sync failed for", op);
                return; // Stop syncing if an operation fails
            }
        }
        localStorage.removeItem(LOCAL_DATA_KEY);
        clearQueue();
        return mergedData;
    } catch (err) {
        console.error("Partial sync failure - keeping offline data");
        throw err;
    }
}