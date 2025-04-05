// src/app/components/addPlaceForm.tsx
'use client'; // Mark as a Client Component
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlaces } from '../contexts/PlacesContext'; // Import the usePlaces hook
import StarRating from './StarRating';
import FileUpload from './FileUpload';

export default function AddPlaceForm() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    location?: string;
    rating?: string;
    description?: string;
  }>({});
  
  const router = useRouter();
  const { addPlace } = usePlaces(); // Use the addPlace function from the context

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

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setVideoUrl(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        await addPlace({
          name,
          location,
          rating,
          description,
          videoUrl
        });
        
        router.push('/');
      } catch (error) {
        console.error('Failed to add place:', error);
      }
    }
  };

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

        <div>
          <label className="block mb-1">Upload Video (Optional)</label>
          <FileUpload onUpload={handleFileUpload} />
          {videoUrl && (
            <div className="mt-2">
              <video 
                src={videoUrl} 
                controls 
                className="w-full max-h-64 object-contain"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded"
        >
          Add
        </button>
      </form>
    </div>
  );
}