import { AppDataSource } from '../data-source';
import { Log } from '../entities/Log';

export class LoggingService {
    static async logAction(userId: number, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', entity_type: string, entity_id?: number) {
        try {
            const logRepository = AppDataSource.getRepository(Log);
            const log = logRepository.create({
                userId: userId,
                action: action,
                entity_type: entity_type,
                entity_id: entity_id,
                timestamp: new Date(),
            });
            await logRepository.save(log);
            console.log(`Successfully logged action for user ${userId}: ${action} on ${entity_type} (${entity_id})`);
        } catch (error) {
            console.error(`Error logging action for user ${userId}:`, error);
            throw error;
        }
    }
}