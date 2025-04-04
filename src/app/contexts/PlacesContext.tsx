// src/app/contexts/PlacesContext.tsx
'use client'; // Mark as a Client Component
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Place } from '../types/place'; // Import the Place interface

interface PlacesContextType {
  places: Place[];
  addPlace: (place: Omit<Place, 'id'>) => Promise<void>;
  updatePlace: (id: number, updatedPlace: Omit<Place, 'id'>) => Promise<void>;
  deletePlace: (id: number) => Promise<void>;
  getPlaceById: (id: number) => Place | undefined;
  loading: boolean;
  error: string | null;
  isAutoRefreshing: boolean;
  toggleAutoRefresh: () => void;
  isOffline: boolean;
  pendingOperations: any[];
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export const PlacesProvider = ({ children }: { children: ReactNode }) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<any[]>([]);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingOperations();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load places from local storage on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      const storedPlaces = localStorage.getItem('places');
      if (storedPlaces) {
        setPlaces(JSON.parse(storedPlaces));
      }
    };

    const fetchPlaces = async () => {
      try {
        const response = await fetch('/api/places');
        if (!response.ok) throw new Error('Failed to fetch places');
        const data = await response.json();
        setPlaces(data);
        localStorage.setItem('places', JSON.stringify(data));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Save to local storage whenever places change
  useEffect(() => {
    localStorage.setItem('places', JSON.stringify(places));
  }, [places]);

  const addPendingOperation = (operation: any) => {
    const newPendingOps = [...pendingOperations, operation];
    setPendingOperations(newPendingOps);
    localStorage.setItem('pendingOperations', JSON.stringify(newPendingOps));
  };

  const syncPendingOperations = async () => {
    const ops = [...pendingOperations];
    setPendingOperations([]);
    localStorage.removeItem('pendingOperations');

    for (const op of ops) {
      try {
        switch (op.type) {
          case 'add':
            await fetch('/api/places', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(op.data),
            });
            break;
          case 'update':
            await fetch(`/api/places/${op.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(op.data),
            });
            break;
          case 'delete':
            await fetch(`/api/places/${op.id}`, {
              method: 'DELETE',
            });
            break;
        }
      } catch (error) {
        console.error('Failed to sync operation:', error);
        addPendingOperation(op);
      }
    }
  };

  const addPlace = async (place: Omit<Place, 'id'>) => {
    try {
      if (isOffline) {
        const tempId = Date.now();
        const newPlace = { ...place, id: tempId };
        setPlaces(prev => [...prev, newPlace]);
        addPendingOperation({ type: 'add', data: place });
        return;
      }

      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(place),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.join(', ') || 'Failed to add place');
      }

      const newPlace = await response.json();
      setPlaces(prev => [...prev, newPlace]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add place');
      throw err;
    }
  };

  const updatePlace = async (id: number, place: Omit<Place, 'id'>) => {
    try {
      if (isOffline) {
        setPlaces(prev => prev.map(p => p.id === id ? { ...place, id } : p));
        addPendingOperation({ type: 'update', id, data: place });
        return;
      }

      const response = await fetch(`/api/places/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(place),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.join(', ') || 'Failed to update place');
      }

      const updatedPlace = await response.json();
      setPlaces(prev => prev.map(p => p.id === id ? updatedPlace : p));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update place');
      throw err;
    }
  };

  const deletePlace = async (id: number) => {
    try {
      if (isOffline) {
        setPlaces(prev => prev.filter(p => p.id !== id));
        addPendingOperation({ type: 'delete', id });
        return;
      }

      const response = await fetch(`/api/places/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.join(', ') || 'Failed to delete place');
      }

      setPlaces(prev => prev.filter(p => p.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete place');
      throw err;
    }
  };

  const getPlaceById = (id: number) => {
    return places.find(p => p.id === id);
  };

  const toggleAutoRefresh = () => {
    if (isAutoRefreshing) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setIsAutoRefreshing(false);
    } else {
      const interval = setInterval(async () => {
        const updatedPlaces = [...places];
        const randomIndex = Math.floor(Math.random() * updatedPlaces.length);
        const randomRating = Math.floor(Math.random() * 5) + 1;
        const placeToUpdate = updatedPlaces[randomIndex];
        if (placeToUpdate) {
          placeToUpdate.rating = randomRating;
          setPlaces(updatedPlaces);
        }
      }, 3000);
      
      setRefreshInterval(interval);
      setIsAutoRefreshing(true);
    }
  };

  return (
    <PlacesContext.Provider 
      value={{ 
        places, 
        addPlace, 
        updatePlace, 
        deletePlace, 
        getPlaceById,
        loading,
        error,
        isAutoRefreshing,
        toggleAutoRefresh,
        isOffline,
        pendingOperations
      }}
    >
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