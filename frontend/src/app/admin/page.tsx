'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [monitoredUsers, setMonitoredUsers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.role === 'admin') {
                    // Simulate fetching monitored users (for now, use a mock API or backend endpoint)
                    setMonitoredUsers([1, 2]); // Replace with real API call
                } else {
                    router.push('/');
                }
                setLoading(false);
            })
            .catch(() => {
                router.push('/login');
                setLoading(false);
            });
    }, [router]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <h2 className="text-xl mb-2">Monitored Users</h2>
            <ul>
                {monitoredUsers.map(userId => (
                    <li key={userId} className="mb-2">User ID: {userId}</li>
                ))}
            </ul>
        </div>
    );
}