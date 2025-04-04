'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlaces } from '../contexts/PlacesContext';
import StarRating from './StarRating';

interface EditPlaceFormProps {
  id: number;
}

export default function EditPlaceForm({ id }: EditPlaceFormProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    location?: string;
    rating?: string;
    description?: string;
  }>({});
  
  const router = useRouter();
  const { getPlaceById, updatePlace } = usePlaces();

  useEffect(() => {
    // Load place data
    const place = getPlaceById(id);
    if (place) {
      setName(place.name);
      setLocation(place.location);
      setRating(place.rating);
      setDescription(place.description);
      setLoading(false);
    } else {
      setError('Place not found');
      setLoading(false);
    }
  }, [id, getPlaceById]);

  const validateForm = () => {
    const newErrors: {
      name?: string;
      location?: string;
      rating?: string;
      description?: string;
    } = {};
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }
    
    // Validate location
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    // Validate rating
    if (rating === 0) {
      newErrors.rating = 'Rating is required';
    }
    
    // Validate description
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        await updatePlace(id, {
          name,
          location,
          rating,
          description
        });
        
        router.push('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update place');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        
        <div>
          <label className="block mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full p-2 border rounded ${errors.location ? 'border-red-500' : ''}`}
          />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>
        
        <div>
          <label className="block mb-1">Rating</label>
          <StarRating initialRating={rating} onChange={setRating} />
          {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
        </div>
        
        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full p-2 border rounded ${errors.description ? 'border-red-500' : ''}`}
            rows={4}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>
        
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded"
        >
          Update
        </button>
      </form>
    </div>
  );
} 