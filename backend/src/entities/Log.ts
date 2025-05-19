import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Log {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'integer', nullable: true })
    userId!: number | null;

    @ManyToOne(() => User, user => user.logs, { nullable: true })
    user!: User | null;

    @Column({ type: 'varchar', length: 50, nullable: false })
    action!: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

    @Column({ type: 'varchar', length: 50, nullable: false })
    entity_type!: string;

    @Column({ type: 'integer', nullable: true })
    entity_id!: number | null;

    @CreateDateColumn()
    timestamp!: Date;
}