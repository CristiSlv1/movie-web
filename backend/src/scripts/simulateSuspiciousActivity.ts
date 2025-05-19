import { AppDataSource } from '../data-source';
import { LoggingService } from '../services/LoggingService';
import { User } from '../entities/User';

async function simulateSuspiciousActivity() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log('Database connected successfully');

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneBy({ email: 'attacker99@mail.com' });

        if (!user) {
            console.error('Test user not found');
            return;
        }

        console.log(`Starting simulation for user: ${user.email} (ID: ${user.id})`);

        // Simulate 20 CREATE operations (more than the 5-action threshold)
        console.log('Simulating CREATE operations...');
        for (let i = 0; i < 20; i++) {
            await LoggingService.logAction(user.id, 'CREATE', 'movie', i);
            console.log(`Logged CREATE action ${i + 1}/20`);
            // Small delay to make it more realistic
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Simulate 20 READ operations
        console.log('Simulating READ operations...');
        for (let i = 0; i < 20; i++) {
            await LoggingService.logAction(user.id, 'READ', 'movie', i);
            console.log(`Logged READ action ${i + 1}/20`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Simulate 20 UPDATE operations
        console.log('Simulating UPDATE operations...');
        for (let i = 0; i < 20; i++) {
            await LoggingService.logAction(user.id, 'UPDATE', 'movie', i);
            console.log(`Logged UPDATE action ${i + 1}/20`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Simulate 20 DELETE operations
        console.log('Simulating DELETE operations...');
        for (let i = 0; i < 20; i++) {
            await LoggingService.logAction(user.id, 'DELETE', 'movie', i);
            console.log(`Logged DELETE action ${i + 1}/20`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('Simulation completed successfully');
        console.log('The user should now be marked as monitored due to high activity');

    } catch (error) {
        console.error('Error during simulation:', error);
    } finally {
        // Close the database connection
        await AppDataSource.destroy();
    }
}

// Run the simulation
simulateSuspiciousActivity();