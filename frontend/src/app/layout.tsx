import Link from 'next/link';
import './globals.css';
import UserProfile from './UserProfile';

export const metadata = {
    title: 'Movie App',
    description: 'A movie database application',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-100" suppressHydrationWarning>
                <nav className="custom-nav">
                    <div className="nav-container">
                        <Link href="/" className="nav-title">Movie App</Link>
                        <div className="nav-links">
                            <Link href="/login" className="nav-link">Login</Link>
                            <Link href="/admin/dashboard" className="nav-link">Admin Dashboard</Link>
                        </div>
                    </div>
                </nav>
                <main className="container mx-auto p-4">{children}</main>
                <UserProfile />
            </body>
        </html>
    );
}