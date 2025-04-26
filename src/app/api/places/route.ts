import { NextResponse } from 'next/server';
import { Place } from '../../types/place';
import { headers } from 'next/headers';
import { placesDB } from '../db';

// Helper function to validate place data
function validatePlace(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  } else if (!/[a-zA-Z]/.test(data.name)) {
    errors.push('Name must contain at least one letter');
  }

  if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
    errors.push('Location is required and must be a non-empty string');
  }

  if (!data.rating || typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
    errors.push('Rating is required and must be an integer between 1 and 5');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET all places
export async function GET() {
  try {
    const places = await placesDB.getAllPlaces();
    return NextResponse.json(places, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching places from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST new place
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validation = validatePlace(data);

    if (!validation.isValid) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log('Adding new place to database:', data);
    
    // Add to the database
    const newPlace = await placesDB.addPlace(data);
    
    console.log('New place added with ID:', newPlace.id);
    
    return NextResponse.json(newPlace, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating place:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400, headers: corsHeaders }
    );
  }
} 