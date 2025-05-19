import React from 'react';

interface Review {
    id: number;
    content: string;
    rating: number;
    username: string;
}

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
    return (
        <div className="border rounded-lg p-4 mb-4 shadow-md bg-white">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">{review.username}</h3>
                <span className="text-yellow-500 font-bold">Rating: {review.rating}/10</span>
            </div>
            <p className="text-gray-600 mt-2">{review.content}</p>
        </div>
    );
};

export default ReviewCard;