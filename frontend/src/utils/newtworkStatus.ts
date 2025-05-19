export type ConnectionStatus = 'online' | 'network-offline' | 'server-offline';

let currentStatus: ConnectionStatus = 'online';
let statusListeners: Array<(status: ConnectionStatus) => void> = [];

async function checkConnectionStatus(): Promise<ConnectionStatus> {
    if (!navigator.onLine) {
        return updateStatus('network-offline');
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
    
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
        });
    
        clearTimeout(timeoutId);
    
        if (!response.ok) {
            return updateStatus('server-offline');
        }
        
        // More flexible health check
        const data = await response.json();
        if (!data || typeof data !== 'object') {
            return updateStatus('server-offline');
        }
        
        return updateStatus('online');
    } catch (error) {
        console.error('Health check failed:', error);
        return updateStatus('server-offline');
    }
}

function updateStatus(newStatus: ConnectionStatus): ConnectionStatus {
    if (currentStatus !== newStatus) {
        console.log(`Status changed to: ${newStatus}`);
        currentStatus = newStatus;
        notifyStatusChange();
    }
    return currentStatus;
}

function notifyStatusChange() {
    statusListeners.forEach(listener => listener(currentStatus));
}

export function getCurrentStatus(): ConnectionStatus {
    return currentStatus;
}

export function onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    statusListeners.push(listener);
    return () => {
        statusListeners = statusListeners.filter(l => l !== listener);
    };
}

export function initializeNetworkStatus() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => checkConnectionStatus());
    window.addEventListener('offline', () => updateStatus('network-offline'));

    const intervalId = setInterval(() => checkConnectionStatus(), 10000);
    checkConnectionStatus(); // Initial check

    return () => clearInterval(intervalId);
}

if (typeof window !== 'undefined') {
    initializeNetworkStatus();
}