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
  const [rating, setRating] = useState(1);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { updatePlace, getPlaceById } = usePlaces();

  useEffect(() => {
    // Load place data
    const place = getPlaceById(id);
    if (place) {
      setName(place.name);
      setLocation(place.location);
      setRating(place.rating);
      setDescription(place.description || '');
    }
  }, [id, getPlaceById]);

  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!location.trim()) {
      setError('Location is required');
      return false;
    }
    if (rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    setError(null);
    return true;
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Edit Place</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Rating</label>
          <input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded h-32"
          />
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