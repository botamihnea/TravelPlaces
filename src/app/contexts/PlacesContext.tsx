// src/app/contexts/PlacesContext.tsx
'use client'; // Mark as a Client Component
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Place } from '../types/place'; // Import the Place interface

interface PlacesContextType {
  places: Place[];
  addPlace: (place: Omit<Place, 'id'>) => Promise<Place>;
  updatePlace: (id: number, place: Omit<Place, 'id'>) => Promise<Place>;
  deletePlace: (id: number) => Promise<void>;
  error: string | null;
  isOffline: boolean;
  pendingOperations: any[];
  uploadFile: (file: File) => Promise<string>;
  autoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
  getPlaceById: (id: number) => Place | undefined;
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<any[]>([]);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

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
      // Ensure each place has videoUrl property
      const placesWithVideo = data.map((place: Place) => ({
        ...place,
        videoUrl: place.videoUrl || null
      }));
      setPlaces(placesWithVideo);
      localStorage.setItem('places', JSON.stringify(placesWithVideo));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Network status detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingOperations();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Load places from local storage on mount
  useEffect(() => {
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

  const uploadFile = async (file: File): Promise<string> => {
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
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const addPlace = async (place: Omit<Place, 'id'>) => {
    try {
      if (isOffline) {
        const tempId = Date.now();
        const newPlace = { ...place, id: tempId };
        setPlaces(prev => [...prev, newPlace]);
        addPendingOperation({ type: 'add', data: place });
        return newPlace;
      }

      const placeData = {
        ...place,
        videoUrl: place.videoUrl || null
      };

      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.join(', ') || 'Failed to add place');
      }

      const newPlace = await response.json();
      
      // Create complete place object with video URL
      const completePlace = {
        ...newPlace,
        videoUrl: placeData.videoUrl
      };

      // Update local state first
      setPlaces(prev => {
        // Check if place already exists
        if (prev.some(p => p.id === completePlace.id)) {
          return prev;
        }
        return [...prev, completePlace];
      });
      setError(null);
      return completePlace;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add place');
      throw err;
    }
  };

  const updatePlace = async (id: number, place: Omit<Place, 'id'>) => {
    try {
      if (isOffline) {
        const updatedPlace = { ...place, id };
        setPlaces(prev => prev.map(p => p.id === id ? updatedPlace : p));
        addPendingOperation({ type: 'update', id, data: place });
        return updatedPlace;
      }

      // Create the complete place object first
      const placeData: Place = {
        ...place,
        id,
        videoUrl: place.videoUrl || undefined
      };

      try {
        // Try to update via API first
        const response = await fetch(`/api/places/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(placeData),
        });

        // If API call fails but it's a 404 (not found), we assume it's an auto-generated place
        // and continue with the update process
        if (!response.ok && response.status !== 404) {
          const errorData = await response.json();
          throw new Error(errorData.errors?.join(', ') || 'Failed to update place');
        }

        // If the API call was successful, use the server response
        // Otherwise for auto-generated places (404), use our placeData
        const completePlace: Place = response.ok ? 
          { ...(await response.json()), videoUrl: placeData.videoUrl } : 
          placeData;
        
        // Update local state immediately
        setPlaces(prev => prev.map(p => p.id === id ? completePlace : p));
        setError(null);
        return completePlace;
      } catch (error) {
        // If it's a network error or other error (not 404), rethrow
        if (error instanceof Error && !error.message.includes('404')) {
          throw error;
        }
        // For 404 errors (auto-generated places), just update local state
        const completePlace: Place = placeData;
        setPlaces(prev => prev.map(p => p.id === id ? completePlace : p));
        setError(null);
        return completePlace;
      }
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

      // First update local state to provide immediate feedback
      setPlaces(prev => prev.filter(p => p.id !== id));

      try {
        // Try to delete from API first
        const response = await fetch(`/api/places/${id}`, {
          method: 'DELETE',
        });

        // If API call fails but it's a 404 (not found), we assume it's an auto-generated place
        // and continue with the deletion process
        if (!response.ok && response.status !== 404) {
          // If the delete request fails (and it's not a 404), revert the local state change
          const place = places.find(p => p.id === id);
          if (place) {
            setPlaces(prev => [...prev, place]);
          }
          const errorData = await response.json();
          throw new Error(errorData.errors?.join(', ') || 'Failed to delete place');
        }
      } catch (error) {
        // If it's a network error or other error (not 404), rethrow
        if (error instanceof Error && !error.message.includes('404')) {
          throw error;
        }
        // Otherwise, continue with the deletion process
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete place');
      throw err;
    }
  };

  const toggleAutoRefresh = useCallback(() => {
    // No-op: WebSocket functionality removed
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  const getPlaceById = useCallback((id: number) => {
    return places.find(place => place.id === id);
  }, [places]);

  // Auto-refresh polling effect
  useEffect(() => {
    if (autoRefreshEnabled) {
      const interval = setInterval(async () => {
        // Randomly update the rating of a random place (if any)
        if (places.length > 0) {
          const randomIndex = Math.floor(Math.random() * places.length);
          const randomPlace = places[randomIndex];
          const newRating = Math.floor(Math.random() * 5) + 1;
          if (randomPlace.rating !== newRating) {
            await updatePlace(randomPlace.id, { ...randomPlace, rating: newRating });
          }
        }
        fetchPlaces();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled, places, updatePlace]);

  const value = useMemo(() => ({
    places,
    addPlace,
    updatePlace,
    deletePlace,
    error,
    isOffline,
    pendingOperations,
    uploadFile,
    autoRefreshEnabled,
    toggleAutoRefresh,
    getPlaceById,
  }), [places, addPlace, updatePlace, deletePlace, error, isOffline, pendingOperations, uploadFile, autoRefreshEnabled, toggleAutoRefresh, getPlaceById]);

  return (
    <PlacesContext.Provider value={value}>
      {children}
    </PlacesContext.Provider>
  );
}

export function usePlaces() {
  const context = useContext(PlacesContext);
  if (context === undefined) {
    throw new Error('usePlaces must be used within a PlacesProvider');
  }
  return context;
}