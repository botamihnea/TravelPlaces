'use client';
import React from 'react';
import Link from 'next/link';
import { usePlaces } from './contexts/PlacesContext';
import PlaceList from './components/PlaceList';

export default function Home() {
  const { places, loading, error } = usePlaces();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Popular Places</h1>
        <Link 
          href="/addPlace" 
          className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors shadow-md"
        >
          Add a new place
        </Link>
      </div>
      
      <div className="mt-8">
        <PlaceList places={places} />
      </div>
    </div>
  );
}
