import { z } from "zod";

export const movieSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(1),
    description: z.string().min(1),
    image: z.string().url(),
    genre: z.enum(["Action", "SciFi", "Romance", "Horror", "Comedy"]),
    rating: z.number().min(0).max(10)
});