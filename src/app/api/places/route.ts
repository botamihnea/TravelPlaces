import { NextResponse } from 'next/server';
import { Place } from '../../types/place';
import { headers } from 'next/headers';
import { prisma } from '../../../lib/prisma';

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

// GET all places with filtering and sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const categoryId = searchParams.get('categoryId');
    const minRating = searchParams.get('minRating');
    const search = searchParams.get('search');
    
    // Extract sorting parameters
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Build where condition for filtering
    const where: any = {};
    
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }
    
    if (minRating) {
      where.rating = {
        gte: parseInt(minRating)
      };
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } }
      ];
    }
    
    // Build order by condition for sorting
    const orderBy: any = {};
    
    if (['name', 'rating', 'location', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    }
    
    // Query the database with filters, sorting and include related data
    const places = await prisma.place.findMany({
      where,
      orderBy,
      include: {
        category: true,
        reviews: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 3 // Include only 3 most recent reviews
        }
      }
    });
    
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
    
    // Create the place in the database
    const newPlace = await prisma.place.create({
      data: {
        name: data.name,
        location: data.location,
        rating: data.rating,
        description: data.description,
        videoUrl: data.videoUrl || null,
        categoryId: data.categoryId || null
      },
      include: {
        category: true
      }
    });
    
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