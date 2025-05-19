// src/data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Genre } from "./entities/Genre";
import { Movie } from "./entities/Movie";
import { Review } from "./entities/Review";
import { User } from "./entities/User";
import { Log } from "./entities/Log";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "1606",
    database: "movies_db",
    logging: false,
    entities: [Genre, Movie, Review, User, Log],
    migrations: [],
    subscribers: [],
    synchronize: false, // Disable auto-sync

});