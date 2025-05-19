import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import 'dotenv/config';

const userRepository = AppDataSource.getRepository(User);

export class AuthService {
    static async register(email: string, password: string, role: 'user' | 'admin' = 'user'): Promise<{ success: boolean; message?: string; token?: string }> {
        const existingUser = await userRepository.findOneBy({ email });
        if (existingUser) {
            return { success: false, message: 'Email already in use' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = userRepository.create({
            email,
            password: hashedPassword,
            role,
        });
        await userRepository.save(user);

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
        return { success: true, message: 'Successfully registered', token };
    }

    static async login(email: string, password: string): Promise<{ success: boolean; message?: string; token?: string }> {
        const user = await userRepository.findOneBy({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return { success: false, message: 'Invalid email or password' };
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
        return { success: true, message: 'Successfully logged in', token };
    }
}

export default AuthService;