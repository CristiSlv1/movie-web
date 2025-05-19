import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Log } from '../entities/Log';
import * as jwt from 'jsonwebtoken';
import { monitoredUsers } from '../index';

const userRepository = AppDataSource.getRepository(User);
const logRepository = AppDataSource.getRepository(Log);

export default function (app: any) {
    app.post('/api/register', async (req: Request, res: Response) => {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const result = await AuthService.register(email, password, role || 'user');
        if (result.success) {
            res.status(201).json({ success: true, message: result.message, token: result.token });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    });

    app.post('/api/login', async (req: Request, res: Response) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const result = await AuthService.login(email, password);
        if (result.success) {
            res.status(200).json({ success: true, message: result.message, token: result.token });
        } else {
            res.status(401).json({ success: false, message: result.message });
        }
    });

    app.get('/api/user', async (req: Request, res: Response) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; role: string };
            const user = await userRepository.findOneBy({ id: decoded.id });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.status(200).json({ success: true, email: user.email, role: user.role });
        } catch (error) {
            res.status(401).json({ success: false, message: 'Invalid token' });
        }
    });

    app.get('/api/monitored-users', async (req: Request, res: Response) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number; role: string };
            if (decoded.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admins can view monitored users' });
            }

            console.log('Monitored users in endpoint:', Array.from(monitoredUsers));

            if (monitoredUsers.size === 0) {
                console.log('No monitored users found, returning empty logs.');
                return res.status(200).json({ success: true, logs: [] });
            }

            const logs = await logRepository
                .createQueryBuilder('log')
                .leftJoinAndSelect('log.user', 'user')
                .where('log.userId IN (:...ids)', { ids: Array.from(monitoredUsers) })
                .orderBy('log.timestamp', 'DESC')
                .getMany();

            console.log('Logs fetched for monitored users:', logs);

            const formattedLogs = logs.map(log => ({
                userId: log.userId,
                username: log.user?.email || 'Unknown',
                action: log.action,
                entity: log.entity_type,
                entityId: log.entity_id,
                timestamp: log.timestamp,
            }));

            res.status(200).json({ success: true, logs: formattedLogs });
        } catch (error) {
            console.error('Error fetching monitored users:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch monitored users' });
        }
    });
}