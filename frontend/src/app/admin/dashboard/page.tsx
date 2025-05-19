'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetch('http://localhost:3001/api/user', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.role === 'admin') {
                    fetch('http://localhost:3001/api/monitored-users', {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                const uniqueUsers = Array.from(
                                    new Map(
                                        data.logs.map((log: any) => [log.userId, { userId: log.userId, username: log.username }])
                                    ).values()
                                );
                                setUsers(uniqueUsers);
                            }
                            setLoading(false);
                        })
                        .catch(() => {
                            setLoading(false);
                            router.push('/login');
                        });
                } else {
                    router.push('/');
                    setLoading(false);
                }
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
            {users.length === 0 ? (
                <p>No monitored users found.</p>
            ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">User ID</th>
                            <th className="border p-2">Username</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                                <td className="border p-2">{user.userId}</td>
                                <td className="border p-2">{user.username}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
