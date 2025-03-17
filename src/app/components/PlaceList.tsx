'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Place } from '../types/place';
import { usePlaces } from '../contexts/PlacesContext';

interface PlaceListProps {
  places: Place[];
}

export default function PlaceList({ places }: PlaceListProps) {
  const { deletePlace } = usePlaces();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'location'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and sort places
  const filteredAndSortedPlaces = useMemo(() => {
    // First filter
    const filtered = places.filter(place => 
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Then sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'location') {
        comparison = a.location.localeCompare(b.location);
      } else if (sortBy === 'rating') {
        comparison = a.rating - b.rating;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [places, searchTerm, sortBy, sortOrder]);

  if (places.length === 0) {
    return <p className="text-center py-4">No places found. Add some places to get started!</p>;
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search places..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-64 text-lg"
        />
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'location')}
          className="p-2 border rounded text-lg"
        >
          <option value="name">Name</option>
          <option value="location">Location</option>
          <option value="rating">Rating</option>
        </select>
        <button 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-2 border rounded w-10 text-lg"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-6">All Popular Places</h2>
      
      {filteredAndSortedPlaces.length === 0 ? (
        <p className="text-lg">No places match your search.</p>
      ) : (
        <div className="space-y-8">
          {filteredAndSortedPlaces.map((place) => (
            <div 
              key={place.id} 
              className="w-full bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-bold mb-2">{place.name}</h3>
              <p className="text-lg text-gray-600 mb-2">📍 {place.location}</p>
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-500 text-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= place.rating ? 'text-yellow-500' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-lg">{place.rating} out of 5</span>
              </div>
              <p className="text-gray-700 mb-4">{place.description}</p>
              <div className="mt-4 flex space-x-4">
                <Link 
                  href={`/editPlace/${place.id}`}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Edit
                </Link>
                <button 
                  onClick={() => deletePlace(place.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}