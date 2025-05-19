'use client';

import { useState, useEffect } from 'react';

export default function UserProfile() {
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('http://localhost:3001/api/user', {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setEmail(data.email);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    if (loading || !email) return null;

    return (
        <div className="profile-section">
            <img
                src="../../public/default-avatar.png"
                alt="Profile"
                className="profile-section img"
            />
            <span className="profile-section span">{email}</span>
        </div>
    );
}