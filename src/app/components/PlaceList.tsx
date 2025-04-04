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
  const { deletePlace, isAutoRefreshing, toggleAutoRefresh, isOffline } = usePlaces();
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
      {isOffline && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You are currently offline. Changes will be synced when you're back online.
              </p>
            </div>
          </div>
        </div>
      )}

      <PlaceCharts places={places} />

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
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
        <button
          onClick={toggleAutoRefresh}
          className={`px-4 py-2 rounded text-white ${
            isAutoRefreshing 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isAutoRefreshing ? 'Stop Auto-Refresh' : 'Start Auto-Refresh'}
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

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
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