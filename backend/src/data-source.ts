import { DataSource } from "typeorm";
import { Movie } from "./entities/Movie";
import { Review } from "./entities/Review";
import { User } from "./entities/User";
import { Log } from "./entities/Log";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    synchronize: true,
    logging: false,
    entities: [Movie, Review, User, Log],
});
