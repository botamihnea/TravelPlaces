'use client';
import React from 'react';
import Link from 'next/link';
import { Place } from '../types/place';
import { usePlaces } from '../contexts/PlacesContext';

interface PlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const { deletePlace, isOffline } = usePlaces();

  const getPlaceStyle = (place: Place) => {
    if (place.rating >= 4) {
      return "bg-green-50 border-green-200";
    } else if (place.rating <= 2) {
      return "bg-red-50 border-red-200";
    }
    return "bg-white border-gray-200";
  };

  return (
    <div 
      className={`w-full rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow ${getPlaceStyle(place)}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold mb-2">{place.name}</h3>
          <p className="text-lg text-gray-600 mb-2">📍 {place.location}</p>
        </div>
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
      {isOffline && (
        <div className="mt-2 text-sm text-yellow-600">
          ⚠️ Changes will be synced when back online
        </div>
      )}
    </div>
  );
} 