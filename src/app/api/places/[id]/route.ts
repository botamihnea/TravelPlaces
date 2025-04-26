import { NextResponse } from 'next/server';
import { Place } from '../../../types/place';
import { placesDB } from '../../db';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to validate place data
function validatePlace(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
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

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET single place
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params;
  const idParam = params.id;
  
  try {
    console.log(`GET request for id: ${idParam} (${typeof idParam})`);
    const id = parseInt(idParam);
    
    const place = await placesDB.getPlaceById(id);

    if (!place) {
      console.log(`Place with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(place, { headers: corsHeaders });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch place' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT (update) place
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params;
  const idParam = params.id;
  
  try {
    console.log(`PUT request for id: ${idParam} (${typeof idParam})`);
    const id = parseInt(idParam);
    
    // Check if place exists
    const existingPlace = await placesDB.getPlaceById(id);
    if (!existingPlace) {
      console.log(`Place with ID ${id} not found for update`);
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const data = await request.json();
    const validation = validatePlace(data);

    if (!validation.isValid) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    const updatedPlace = await placesDB.updatePlace(id, data);
    
    if (!updatedPlace) {
      console.log(`Failed to update place with ID ${id}`);
      return NextResponse.json(
        { error: 'Failed to update place' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(updatedPlace, { headers: corsHeaders });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: 'Failed to update place' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE place
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params;
  const idParam = params.id;
  
  try {
    console.log(`DELETE request for id: ${idParam} (${typeof idParam})`);
    const id = parseInt(idParam);
    
    // Check if place exists first
    const existingPlace = await placesDB.getPlaceById(id);
    if (!existingPlace) {
      console.log(`Place with ID ${id} not found for deletion`);
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Delete using the database
    const success = await placesDB.deletePlace(id);
    
    if (!success) {
      console.log(`Failed to delete place with ID ${id}`);
      return NextResponse.json(
        { error: 'Failed to delete place' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    return NextResponse.json({ 
      message: 'Place deleted successfully',
      deletedPlace: existingPlace
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: 'Failed to delete place' },
      { status: 500, headers: corsHeaders }
    );
  }
} 