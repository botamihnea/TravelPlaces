import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

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

// Validate review data
function validateReview(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required and must be a non-empty string');
  }

  if (!data.rating || typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
    errors.push('Rating is required and must be an integer between 1 and 5');
  }

  if (!data.author || typeof data.author !== 'string' || data.author.trim().length === 0) {
    errors.push('Author is required and must be a non-empty string');
  }

  if (!data.placeId || typeof data.placeId !== 'number') {
    errors.push('PlaceId is required and must be a number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// GET reviews with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const placeId = searchParams.get('placeId');
    const minRating = searchParams.get('minRating');
    
    // Build where condition for filtering
    const where: any = {};
    
    if (placeId) {
      where.placeId = parseInt(placeId);
    }
    
    if (minRating) {
      where.rating = {
        gte: parseInt(minRating)
      };
    }
    
    // Query the database with filters
    const reviews = await prisma.review.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        place: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(reviews, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST new review
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validation = validateReview(data);

    if (!validation.isValid) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Check if place exists
    const place = await prisma.place.findUnique({
      where: { id: data.placeId }
    });
    
    if (!place) {
      return NextResponse.json(
        { error: 'Place not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Create the review
    const newReview = await prisma.review.create({
      data: {
        content: data.content,
        rating: data.rating,
        author: data.author,
        placeId: data.placeId
      },
      include: {
        place: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(newReview, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500, headers: corsHeaders }
    );
  }
} 