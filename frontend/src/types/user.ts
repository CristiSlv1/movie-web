// frontend/src/types/user.ts
export interface User {
    id: number;
    email: string;
    role: 'user' | 'admin';
    isMonitored: boolean;
    actionCount?: number; // For admin dashboard
}