import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

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

  return {
    isValid: errors.length === 0,
    errors
  };
}

// GET single review
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params;
  const idParam = params.id;
  
  try {
    const id = parseInt(idParam);
    
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        place: true
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(review, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT (update) review
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params;
  const idParam = params.id;
  
  try {
    const id = parseInt(idParam);
    
    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id }
    });
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const data = await request.json();
    const validation = validateReview(data);

    if (!validation.isValid) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        content: data.content,
        rating: data.rating,
        author: data.author,
        // We don't update the placeId to maintain the relationship
      },
      include: {
        place: true
      }
    });
    
    return NextResponse.json(updatedReview, { headers: corsHeaders });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE review
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params;
  const idParam = params.id;
  
  try {
    const id = parseInt(idParam);
    
    // Check if review exists first
    const existingReview = await prisma.review.findUnique({
      where: { id },
      include: {
        place: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      message: 'Review deleted successfully',
      deletedReview: existingReview
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500, headers: corsHeaders }
    );
  }
} 