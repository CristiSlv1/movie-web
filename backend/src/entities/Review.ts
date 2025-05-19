// src/entities/Review.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Movie } from './Movie';
import { User } from './User';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text')
    comment!: string;

    @Column('decimal', { precision: 3, scale: 1 })
    rating!: number;

    @CreateDateColumn()
    created_at!: Date;

    @Column({ nullable: true }) // Explicitly map movieId column
    movieId!: number;

    @ManyToOne(() => Movie, movie => movie.reviews)
    movie!: Movie;

    @ManyToOne(() => User, user => user.reviews)
    user!: User;
}