// backend/src/scripts/simulateAttack.ts
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Log } from "../entities/Log";

async function simulateAttack() {
    const user = await AppDataSource.getRepository(User).findOneBy({ email: 'attacker@example.com' });
    if (!user) return;

    // Simulate 150 actions in quick succession
    for (let i = 0; i < 150; i++) {
        await AppDataSource.getRepository(Log).save({
            user,
            action: 'CREATE',
            entityType: 'Movie',
            entityId: i
        });
    }
}