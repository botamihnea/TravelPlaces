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

// GET single category
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const idParam = params.id;
  
  try {
    const id = parseInt(idParam);
    
    // Check if we should include places
    const { searchParams } = new URL(request.url);
    const includePlaces = searchParams.get('includePlaces') !== 'false'; // Default to true
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        places: includePlaces ? true : false
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(category, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT (update) category
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params;
  const idParam = params.id;
  
  try {
    const id = parseInt(idParam);
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const data = await request.json();
    const validation = validateCategory(data);

    if (!validation.isValid) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Check for name conflict (only if name is changing)
    if (data.name !== existingCategory.name) {
      const nameExists = await prisma.category.findUnique({
        where: { name: data.name }
      });
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon || existingCategory.icon
      },
      include: {
        places: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedCategory, { headers: corsHeaders });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE category
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const params = context.params;
  const idParam = params.id;
  
  try {
    const id = parseInt(idParam);
    
    // Check if category exists and get related places
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        places: true
      }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Check if category has places
    if (existingCategory.places.length > 0) {
      // Update places to remove category reference
      await prisma.place.updateMany({
        where: { categoryId: id },
        data: { categoryId: null }
      });
    }

    // Delete the category
    await prisma.category.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      message: 'Category deleted successfully',
      deletedCategory: {
        id: existingCategory.id,
        name: existingCategory.name,
        icon: existingCategory.icon
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500, headers: corsHeaders }
    );
  }
} 