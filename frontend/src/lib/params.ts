export const validateMovieParams = (params: URLSearchParams) => {
    const page = Number(params.get("page")) || 1;
    const limit = Number(params.get("limit")) || 10;
    const sort = params.get("sort");
    const genre = params.get("genre");

    return {
        page: page > 0 ? page : 1,
        limit: limit > 0 ? limit : 10,
        sort: ["title-asc", "title-desc", "rating-asc", "rating-desc"].includes(sort) ? sort : undefined,
        genre: genre || undefined
    };
};