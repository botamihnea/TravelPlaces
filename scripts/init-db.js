const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Initializing database with sample data...');

  // Create categories
  const categories = [
    { name: 'Beach', icon: '🏖️' },
    { name: 'Mountain', icon: '🏔️' },
    { name: 'City', icon: '🏙️' },
    { name: 'Historical', icon: '🏛️' },
    { name: 'Resort', icon: '🏨' }
  ];

  // Insert categories
  console.log('Adding categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  // Get categories for reference
  const beachCategory = await prisma.category.findUnique({ where: { name: 'Beach' } });
  const mountainCategory = await prisma.category.findUnique({ where: { name: 'Mountain' } });
  const cityCategory = await prisma.category.findUnique({ where: { name: 'City' } });
  const historicalCategory = await prisma.category.findUnique({ where: { name: 'Historical' } });
  const resortCategory = await prisma.category.findUnique({ where: { name: 'Resort' } });

  // Create initial places with categories
  const places = [
    { 
      name: 'South Beach', 
      location: 'Miami, Florida', 
      rating: 5, 
      description: 'Beautiful sandy beach with crystal clear waters.',
      categoryId: beachCategory.id
    },
    { 
      name: 'Rocky Mountain National Park', 
      location: 'Colorado', 
      rating: 4, 
      description: 'Stunning mountain views with diverse wildlife and hiking trails.',
      categoryId: mountainCategory.id
    },
    { 
      name: 'Cancun Resort & Spa', 
      location: 'Cancun, Mexico', 
      rating: 4, 
      description: 'Luxury all-inclusive resort with pristine beaches.',
      categoryId: resortCategory.id
    },
    { 
      name: 'Lake Michigan', 
      location: 'Michigan', 
      rating: 3, 
      description: 'Peaceful lake perfect for fishing, boating, and water sports.',
      categoryId: beachCategory.id
    },
    { 
      name: 'Manhattan Experience', 
      location: 'New York City', 
      rating: 5, 
      description: 'Exciting city break with world-famous attractions.',
      categoryId: cityCategory.id
    },
    { 
      name: 'Roman Colosseum', 
      location: 'Rome, Italy', 
      rating: 5, 
      description: 'Ancient amphitheater dating back to 70-80 AD.',
      categoryId: historicalCategory.id
    }
  ];

  // Insert places
  console.log('Adding places...');
  const createdPlaces = [];
  for (const place of places) {
    const created = await prisma.place.create({ data: place });
    createdPlaces.push(created);
  }

  // Add some reviews
  console.log('Adding reviews...');
  const reviews = [
    {
      content: 'Fantastic beach, loved the atmosphere!',
      rating: 5,
      author: 'BeachLover22',
      placeId: createdPlaces[0].id
    },
    {
      content: 'Beautiful mountains, great hiking trails.',
      rating: 4,
      author: 'HikingEnthusiast',
      placeId: createdPlaces[1].id
    },
    {
      content: 'Love the city vibes and attractions!',
      rating: 5,
      author: 'CityExplorer',
      placeId: createdPlaces[4].id
    },
    {
      content: 'Amazing historical site, a must-visit!',
      rating: 5,
      author: 'HistoryBuff',
      placeId: createdPlaces[5].id
    },
    {
      content: 'Relaxing resort, great service.',
      rating: 4,
      author: 'VacationMode',
      placeId: createdPlaces[2].id
    }
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review });
  }

  console.log('Database initialized successfully!');
}

main()
  .catch(e => {
    console.error('Error initializing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 