'use client';
import React from 'react';
import Link from 'next/link';
import { usePlaces } from './contexts/PlacesContext';
import PlaceList from './components/PlaceList';

export default function Home() {
  const { places } = usePlaces();

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
