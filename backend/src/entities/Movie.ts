import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, OneToMany } from 'typeorm';
import { Genre } from './Genre';
import { Review } from './Review';

@Entity('movies')
export class Movie {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    description!: string;

    @Column()
    image!: string;

    @Column('decimal', { precision: 3, scale: 1 })
    rating!: number;

    @CreateDateColumn()
    created_at!: Date;

    @ManyToOne(() => Genre, genre => genre.movies)
    @JoinColumn({ name: 'genre_id' })
    genre!: Genre;

    @OneToMany(() => Review, review => review.movie)
    reviews!: Review[];
}