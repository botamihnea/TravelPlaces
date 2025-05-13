const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

async function generateTestData() {
  console.log('Starting test data generation...');
  
  // Generate categories
  const categories = [
    { name: 'Beach', icon: '🏖️' },
    { name: 'Mountain', icon: '🏔️' },
    { name: 'City', icon: '🏙️' },
    { name: 'Historical', icon: '🏛️' },
    { name: 'Resort', icon: '🏨' }
  ];

  console.log('Creating categories...');
  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
    createdCategories.push(created);
  }

  // Generate places
  console.log('Generating places...');
  const places = [];
  for (let i = 0; i < 100000; i++) {
    const place = {
      name: faker.location.city(),
      location: `${faker.location.city()}, ${faker.location.country()}`,
      rating: faker.number.int({ min: 1, max: 5 }),
      description: faker.lorem.paragraph(),
      videoUrl: faker.image.url(),
      categoryId: createdCategories[faker.number.int({ min: 0, max: 4 })].id
    };
    places.push(place);
  }

  // Batch insert places
  console.log('Inserting places...');
  const batchSize = 1000;
  for (let i = 0; i < places.length; i += batchSize) {
    const batch = places.slice(i, i + batchSize);
    await prisma.place.createMany({
      data: batch,
      skipDuplicates: true
    });
    console.log(`Inserted ${i + batch.length} places...`);
  }

  // Generate reviews
  console.log('Generating reviews...');
  const allPlaces = await prisma.place.findMany({ select: { id: true } });
  const reviews = [];
  
  for (let i = 0; i < 100000; i++) {
    const review = {
      content: faker.lorem.paragraph(),
      rating: faker.number.int({ min: 1, max: 5 }),
      author: faker.person.fullName(),
      placeId: allPlaces[faker.number.int({ min: 0, max: allPlaces.length - 1 })].id
    };
    reviews.push(review);
  }

  // Batch insert reviews
  console.log('Inserting reviews...');
  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    await prisma.review.createMany({
      data: batch,
      skipDuplicates: true
    });
    console.log(`Inserted ${i + batch.length} reviews...`);
  }

  console.log('Test data generation completed!');
}

generateTestData()
  .catch(e => {
    console.error('Error generating test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 