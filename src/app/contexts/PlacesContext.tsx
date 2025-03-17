// src/app/contexts/PlacesContext.tsx
'use client'; // Mark as a Client Component
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Place } from '../types/place'; // Import the Place interface

interface PlacesContextType {
  places: Place[];
  addPlace: (place: Omit<Place, 'id'>) => void;
  updatePlace: (id: number, updatedPlace: Omit<Place, 'id'>) => void;
  deletePlace: (id: number) => void;
  getPlaceById: (id: number) => Place | undefined;
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

// Initial sample data
const initialPlaces: Place[] = [
  { 
    id: 1, 
    name: 'South Beach', 
    location: 'Miami, Florida', 
    rating: 4, 
    description: 'Beautiful sandy beach with crystal clear waters. Perfect for swimming, sunbathing, and people watching. The vibrant atmosphere and nearby restaurants make it a must-visit destination.'
  },
  { 
    id: 2, 
    name: 'Rocky Mountain National Park', 
    location: 'Colorado', 
    rating: 5, 
    description: 'Stunning mountain views with diverse wildlife and hiking trails for all skill levels. The park offers breathtaking scenery, alpine lakes, and opportunities to see elk, moose, and other wildlife in their natural habitat.'
  },
  { 
    id: 3, 
    name: 'Cancun Resort & Spa', 
    location: 'Cancun, Mexico', 
    rating: 4, 
    description: 'Luxury all-inclusive resort with pristine beaches, multiple swimming pools, and world-class dining options. Enjoy water sports, spa treatments, and evening entertainment in this tropical paradise.'
  },
  { 
    id: 4, 
    name: 'Lake Michigan', 
    location: 'Michigan', 
    rating: 3, 
    description: 'Peaceful lake perfect for fishing, boating, and water sports. The surrounding forests and small towns offer charming accommodations and local cuisine. Great for family vacations and outdoor enthusiasts.'
  },
  { 
    id: 5, 
    name: 'Manhattan Experience', 
    location: 'New York City', 
    rating: 2, 
    description: 'Exciting city break with world-famous attractions including Times Square, Central Park, and Broadway shows. Shop on Fifth Avenue, visit museums, and experience the diverse culinary scene that makes NYC a global destination.'
  },
  { 
    id: 6, 
    name: 'Roman Colosseum', 
    location: 'Rome, Italy', 
    rating: 5, 
    description: 'Ancient amphitheater dating back to 70-80 AD. This iconic symbol of Imperial Rome offers a glimpse into the past with its impressive architecture and historical significance. Guided tours available to learn about gladiatorial contests and public spectacles.'
  },
];

export const PlacesProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with initial data
  const [places, setPlaces] = useState<Place[]>(initialPlaces);

  const addPlace = (place: Omit<Place, 'id'>) => {
    setPlaces(prev => [...prev, { ...place, id: Date.now() }]);
  };

  const updatePlace = (id: number, updatedPlace: Omit<Place, 'id'>) => {
    setPlaces(prev => prev.map(place => 
      place.id === id ? { ...updatedPlace, id } : place
    ));
  };

  const deletePlace = (id: number) => {
    setPlaces(prev => prev.filter(place => place.id !== id));
  };

  const getPlaceById = (id: number) => places.find(place => place.id === id);

  return (
    <PlacesContext.Provider value={{ places, addPlace, updatePlace, deletePlace, getPlaceById }}>
      {children}
    </PlacesContext.Provider>
  );
};

export const usePlaces = () => {
  const context = useContext(PlacesContext);
  if (!context) {
    throw new Error('usePlaces must be used within a PlacesProvider');
  }
  return context;
};