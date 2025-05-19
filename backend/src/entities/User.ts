import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Review } from './Review';
import { Log } from './Log';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
    email!: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    password!: string;

    @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
    role!: 'user' | 'admin';

    @OneToMany(() => Review, review => review.user)
    reviews!: Review[];

    @OneToMany(() => Log, log => log.user)
    logs!: Log[];
}