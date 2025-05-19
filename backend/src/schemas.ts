// backend/src/schemas.ts
import { z } from "zod";

// Base Movie Schema
export const movieSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().min(10, "Description must be at least 10 characters"),
    image: z.string().url("Invalid image URL"),
    genre: z.enum(["Action", "SciFi", "Romance", "Horror", "Comedy"]),
    rating: z.number().min(0).max(10)
});

// Partial Schema for Updates
export const movieUpdateSchema = movieSchema.partial().extend({
    id: z.number().positive("Valid ID required")
});

// Query Params Schema
export const movieQuerySchema = z.object({
    genre: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(["title-asc", "title-desc", "rating-asc", "rating-desc"]).optional(),
    page: z.number().optional(),
    limit: z.number().optional()
});

// ID Param Schema
export const idParamSchema = z.object({
    id: z.coerce.number().positive("Invalid movie ID")
});

export type Movie = z.infer<typeof movieSchema>;
export type MovieUpdate = z.infer<typeof movieUpdateSchema>;