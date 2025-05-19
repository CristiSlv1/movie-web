// backend/src/middleware/validateParams.ts
import { Request, Response, NextFunction } from 'express';

// Extend the Request interface to include validatedParams
declare global {
    namespace Express {
        interface Request {
            validatedParams?: {
                page: number;
                limit: number;
                sort?: string;
                genre?: string;
            };
        }
    }
}

export const validateMovieParams = (req: Request, res: Response, next: NextFunction) => {
    const validSortOptions = ["title-asc", "title-desc", "rating-asc", "rating-desc"];
    const validGenres = ["Action", "SciFi", "Romance", "Horror", "Comedy"];

    const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sort: req.query.sort as string | undefined,
        genre: req.query.genre as string | undefined
    };

    if (params.sort && !validSortOptions.includes(params.sort)) {
        return res.status(400).json({ error: "Invalid sort parameter" });
    }

    if (params.genre && !validGenres.includes(params.genre)) {
        return res.status(400).json({ error: "Invalid genre parameter" });
    }

    req.validatedParams = params;
    next();
};