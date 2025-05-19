// backend/src/monitoring/monitor.ts
import { AppDataSource } from "../data-source";
import { Log } from "../entities/Log";
import { User } from "../entities/User";

export class ActivityMonitor {
    static async start() {
        setInterval(async () => {
            const oneHourAgo = new Date(Date.now() - 3600000);
            
            const suspiciousUsers = await AppDataSource.getRepository(Log)
                .createQueryBuilder('log')
                .select('log.userId', 'userId')
                .addSelect('COUNT(log.id)', 'actionCount')
                .where('log.timestamp > :oneHourAgo', { oneHourAgo })
                .groupBy('log.userId')
                .having('COUNT(log.id) > :threshold', { threshold: 100 })
                .getRawMany();

            for (const user of suspiciousUsers) {
                await AppDataSource.getRepository(User).update(user.userId, {
                    isMonitored: true
                });
            }
        }, 3600000); // Check every hour
    }
}