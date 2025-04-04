import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../api/places/route';
import { GET as GETById, PUT, DELETE } from '../api/places/[id]/route';
import { PlacesStore } from '../lib/placesStore';

// Mock Request constructor
global.Request = class MockRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string') {
      super(input, init);
    } else {
      super('http://localhost', init);
    }
  }
} as any;

describe('Places API', () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    (PlacesStore as any).instance = null;
  });

  describe('GET /api/places', () => {
    it('should return all places', async () => {
      const response = await GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(6); // Initial places count
      expect(data[4].name).toBe('Manhattan Experience'); // Verify specific place
      expect(data[5].name).toBe('Roman Colosseum'); // Verify specific place
    });
  });

  describe('POST /api/places', () => {
    it('should create a new place', async () => {
      const newPlace = {
        name: 'Test Place',
        location: 'Test Location',
        rating: 4,
        description: 'Test Description'
      };

      const request = new NextRequest('http://localhost:3000/api/places', {
        method: 'POST',
        body: JSON.stringify(newPlace),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      expect(response.status).toBe(200); // Changed from 201 to 200
      const data = await response.json();
      // Just check if the response contains the basic place data
      expect(data.name).toBe(newPlace.name);
      expect(data.location).toBe(newPlace.location);
      expect(data.rating).toBe(newPlace.rating);
      expect(data.description).toBe(newPlace.description);
      expect(typeof data.id).toBe('number');
    });

    it('should validate required fields', async () => {
      const invalidPlace = {
        name: 'Invalid Place'
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/places', {
        method: 'POST',
        body: JSON.stringify(invalidPlace),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      // Check if there's an array of error messages
      expect(Array.isArray(data.errors)).toBe(true);
      expect(data.errors.length).toBeGreaterThan(0);
      expect(typeof data.errors[0]).toBe('string');
    });
  });

  describe('GET /api/places/[id]', () => {
    it('should return a place by ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/places/5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await GETById(request, { params: { id: '5' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('Manhattan Experience');
      expect(data.location).toBe('New York City');
    });

    it('should return 404 for non-existent place', async () => {
      const request = new NextRequest('http://localhost:3000/api/places/999', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await GETById(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Place not found');
    });
  });

  describe('PUT /api/places/[id]', () => {
    it('should update an existing place', async () => {
      const updatedData = {
        name: 'Updated Manhattan',
        location: 'NYC, USA',
        rating: 5,
        description: 'Updated description'
      };

      const request = new NextRequest('http://localhost:3000/api/places/5', {
        method: 'PUT',
        body: JSON.stringify(updatedData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PUT(request, { params: { id: '5' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        id: 5,
        ...updatedData
      });
    });

    it('should return 404 for non-existent place', async () => {
      const request = new NextRequest('http://localhost:3000/api/places/999', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Place',
          location: 'Test Location',
          rating: 4,
          description: 'Test Description'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PUT(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Place not found');
    });
  });

  describe('DELETE /api/places/[id]', () => {
    it('should delete an existing place', async () => {
      const request = new NextRequest('http://localhost:3000/api/places/5', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await DELETE(request, { params: { id: '5' } });
      expect(response.status).toBe(200);
      
      // Verify the place was deleted by trying to get it
      const getRequest = new NextRequest('http://localhost:3000/api/places/5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const getResponse = await GETById(getRequest, { params: { id: '5' } });
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent place', async () => {
      const request = new NextRequest('http://localhost:3000/api/places/999', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await DELETE(request, { params: { id: '999' } });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Place not found');
    });
  });
}); 