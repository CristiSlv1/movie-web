'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './page.css';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        const url = isRegister ? '/api/register' : '/api/login';
        try {
            console.log(`Fetching: http://localhost:3001${url}`);
            const response = await fetch(`http://localhost:3001${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: isRegister ? role : undefined }),
            });
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Response data:', data);
            if (data.success) {
                localStorage.setItem('token', data.token);
                setMessage(data.message || `Successfully ${isRegister ? 'registered' : 'logged in'}! Redirecting...`);
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } else {
                setMessage(data.message || 'An error occurred');
            }
        } catch (error) {
            console.error('Error during fetch:', error);
            setMessage('Failed to connect to the server. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">{isRegister ? 'Register' : 'Login'}</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="mb-4">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {isRegister && (
                        <div className="mb-4">
                            <label>Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'admin')} className="w-full p-2 border rounded">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}
                    <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
                </form>
                <p className="login-toggle">
                    {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
                    <button onClick={() => setIsRegister(!isRegister)}>
                        {isRegister ? 'Login' : 'Register'}
                    </button>
                </p>
                {message && (
                    <p className={`login-message ${message.includes('Successfully') ? 'success' : ''}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}