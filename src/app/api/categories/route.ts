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

// Validate category data
function validateCategory(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// GET all categories with optional include of places
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if we should include places
    const includePlaces = searchParams.get('includePlaces') === 'true';
    
    // Query categories
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        places: includePlaces ? {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true
          }
        } : false
      }
    });
    
    return NextResponse.json(categories, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST new category
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validation = validateCategory(data);

    if (!validation.isValid) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Check if category with same name exists
    const existing = await prisma.category.findUnique({
      where: { name: data.name }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Create the category
    const newCategory = await prisma.category.create({
      data: {
        name: data.name,
        icon: data.icon || null
      }
    });
    
    return NextResponse.json(newCategory, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500, headers: corsHeaders }
    );
  }
} 