'use client';
import React, { useState } from 'react';

interface StarRatingProps {
  initialRating: number;
  onChange: (rating: number) => void;
}

export default function StarRating({ initialRating, onChange }: StarRatingProps) {
  const [rating, setRating] = useState<number>(initialRating || 0);
  const [hover, setHover] = useState<number | null>(null);

  const handleClick = (selectedRating: number) => {
    setRating(selectedRating);
    onChange(selectedRating);
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl focus:outline-none ${
            (hover !== null ? hover >= star : rating >= star)
              ? 'text-yellow-500'
              : 'text-gray-300'
          }`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          aria-label={`Rate ${star} out of 5 stars`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-gray-700">{hover !== null ? hover : rating} out of 5</span>
    </div>
  );
} 