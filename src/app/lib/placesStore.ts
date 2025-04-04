import { Place } from '../types/place';

// Initial data
const initialPlaces: Place[] = [
  { 
    id: 1, 
    name: 'South Beach', 
    location: 'Miami, Florida', 
    rating: 5, 
    description: 'Beautiful sandy beach with crystal clear waters. Perfect for swimming, sunbathing, and people watching. The vibrant atmosphere and nearby restaurants make it a must-visit destination.'
  },
  { 
    id: 2, 
    name: 'Rocky Mountain National Park', 
    location: 'Colorado', 
    rating: 4, 
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
  }
];

export class PlacesStore {
  private static instance: PlacesStore;
  public places: Place[] = [];
  private nextId: number = 1;

  private constructor() {
    this.places = [...initialPlaces];
    // Ensure nextId is higher than any existing ID
    this.nextId = Math.max(...this.places.map(p => p.id), 0) + 1;
  }

  public static getInstance(): PlacesStore {
    if (!PlacesStore.instance) {
      PlacesStore.instance = new PlacesStore();
    }
    return PlacesStore.instance;
  }

  public getNextId(): number {
    const id = this.nextId;
    this.nextId++;
    return id;
  }

  public addPlace(place: Omit<Place, 'id'>): Place {
    const id = this.getNextId();
    const newPlace: Place = {
      ...place,
      id
    };
    this.places.push(newPlace);
    return newPlace;
  }

  public updatePlace(id: number, place: Omit<Place, 'id'>): Place | null {
    const index = this.places.findIndex(p => p.id === id);
    if (index === -1) {
      return null;
    }
    const updatedPlace: Place = { ...place, id };
    this.places[index] = updatedPlace;
    return updatedPlace;
  }

  public deletePlace(id: number): boolean {
    const index = this.places.findIndex(p => p.id === id);
    if (index === -1) {
      return false;
    }
    this.places.splice(index, 1);
    return true;
  }

  public getPlaceById(id: number): Place | null {
    return this.places.find(p => p.id === id) || null;
  }

  public getAllPlaces(): Place[] {
    return [...this.places];
  }

  public debugPlaces(): void {
    console.log('Current places in store:', this.places);
  }
}

// Export a singleton instance
export const placesStore = PlacesStore.getInstance();

// Debug function
export function debugPlaces(operation: string, id?: number): void {
  console.log(`===== PLACES STORE DEBUG [${operation}] =====`);
  console.log(`Total places: ${placesStore.places.length}`);
  console.log(`All place IDs: ${placesStore.places.map(p => p.id).join(', ')}`);
  if (id !== undefined) {
    console.log(`Looking for ID: ${id} (${typeof id})`);
    const found = placesStore.places.find(p => p.id === id);
    console.log(`Found: ${found ? 'YES' : 'NO'}`);
    if (found) {
      console.log(`Place details: ${JSON.stringify(found)}`);
    }
  }
  console.log('=======================================');
}

// Export the functions and places array
export const places = placesStore.places;
export const getNextId = () => placesStore.getNextId();
export const addPlace = (place: Omit<Place, 'id'>) => placesStore.addPlace(place);
export const updatePlace = (id: number, place: Omit<Place, 'id'>) => placesStore.updatePlace(id, place);
export const deletePlace = (id: number) => placesStore.deletePlace(id);
export const getPlaceById = (id: number) => placesStore.getPlaceById(id); 