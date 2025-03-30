'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Place } from '../types/place';
import { usePlaces } from '../contexts/PlacesContext';
import PlaceCharts from './PlaceCharts';

interface PlaceListProps {
  places: Place[];
}

const ITEMS_PER_PAGE = 5;

export default function PlaceList({ places }: PlaceListProps) {
  const { deletePlace } = usePlaces();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'location'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (places.length === 0) return null;

    const sortedByRating = [...places].sort((a, b) => b.rating - a.rating);
    const totalRating = places.reduce((sum, place) => sum + place.rating, 0);
    
    return {
      mostExpensive: sortedByRating[0],
      leastExpensive: sortedByRating[sortedByRating.length - 1],
      average: Math.round(totalRating / places.length)
    };
  }, [places]);

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

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedPlaces.length / ITEMS_PER_PAGE);
  const paginatedPlaces = filteredAndSortedPlaces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPlaceStyle = (place: Place) => {
    if (!statistics) return "";
    
    if (place.id === statistics.mostExpensive.id) {
      return "bg-blue-50 border-blue-200";
    } else if (place.id === statistics.leastExpensive.id) {
      return "bg-red-50 border-red-200";
    } else if (place.rating === statistics.average) {
      return "bg-yellow-50 border-yellow-200";
    }
    return "bg-white border-gray-200";
  };

  if (places.length === 0) {
    return <p className="text-center py-4">No places found. Add some places to get started!</p>;
  }

  return (
    <div className="w-full">
      <PlaceCharts places={places} />

      {statistics && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-gray-600">Highest Rating</p>
              <p className="font-medium">{statistics.mostExpensive.name} ({statistics.mostExpensive.rating}★)</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-md">
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="font-medium">{statistics.average}★</p>
            </div>
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-sm text-gray-600">Lowest Rating</p>
              <p className="font-medium">{statistics.leastExpensive.name} ({statistics.leastExpensive.rating}★)</p>
            </div>
          </div>
        </div>
      )}

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
        <>
          <div className="space-y-8">
            {paginatedPlaces.map((place) => (
              <div 
                key={place.id} 
                className={`w-full rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow ${getPlaceStyle(place)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{place.name}</h3>
                    <p className="text-lg text-gray-600 mb-2">📍 {place.location}</p>
                  </div>
                  {statistics && (
                    <div className="text-sm">
                      {place.id === statistics.mostExpensive.id && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Highest Rating</span>
                      )}
                      {place.id === statistics.leastExpensive.id && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Lowest Rating</span>
                      )}
                      {place.rating === statistics.average && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Average Rating</span>
                      )}
                    </div>
                  )}
                </div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}