// backend/src/decorators/LoggingDecorator.ts
import { AppDataSource } from "../data-source";
import { Log } from "../entities/Log";
import { Request } from "express";
import "../types/express"; // Ensure the extended type is loaded

export function LogAction(action: string, entityType: string) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...args: any[]) {
            // Get request object (assuming it's the first parameter in controller methods)
            const req: Request = args.find(arg => arg.request || arg.headers);
            
            const result = await originalMethod.apply(this, args);
            
            if (req?.user?.id) {
                const logRepo = AppDataSource.getRepository(Log);
                await logRepo.save({
                    userId: req.user.id,
                    action: action as 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
                    entity_type: entityType,
                    entity_id: result?.id || args[0]?.id || null,
                    timestamp: new Date(),
                });
            }
            
            return result;
        };
        
        return descriptor;
    };
}