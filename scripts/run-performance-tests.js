const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function measureQueryPerformance() {
  console.log('Starting performance tests...');

  // Test 1: Complex query with joins and aggregations
  console.log('\nTest 1: Complex query with joins and aggregations');
  const start1 = Date.now();
  const result1 = await prisma.place.findMany({
    where: {
      rating: {
        gte: 4
      }
    },
    include: {
      category: true,
      reviews: {
        where: {
          rating: {
            gte: 4
          }
        }
      }
    },
    orderBy: {
      rating: 'desc'
    },
    take: 100
  });
  const end1 = Date.now();
  console.log(`Query 1 took ${end1 - start1}ms`);
  console.log(`Found ${result1.length} places with high ratings`);

  // Test 2: Aggregation query
  console.log('\nTest 2: Aggregation query');
  const start2 = Date.now();
  const result2 = await prisma.place.groupBy({
    by: ['categoryId'],
    _count: {
      id: true
    },
    _avg: {
      rating: true
    },
    having: {
      rating: {
        _avg: {
          gt: 3
        }
      }
    }
  });
  const end2 = Date.now();
  console.log(`Query 2 took ${end2 - start2}ms`);
  console.log(`Found ${result2.length} categories with average rating > 3`);

  // Test 3: Search query with multiple conditions
  console.log('\nTest 3: Search query with multiple conditions');
  const start3 = Date.now();
  const result3 = await prisma.place.findMany({
    where: {
      OR: [
        { name: { contains: 'a' } },
        { location: { contains: 'a' } }
      ],
      AND: [
        { rating: { gte: 3 } },
        { reviews: { some: { rating: { gte: 4 } } } }
      ]
    },
    include: {
      category: true,
      reviews: {
        take: 5,
        orderBy: {
          rating: 'desc'
        }
      }
    },
    take: 50
  });
  const end3 = Date.now();
  console.log(`Query 3 took ${end3 - start3}ms`);
  console.log(`Found ${result3.length} places matching search criteria`);
}

measureQueryPerformance()
  .catch(e => {
    console.error('Error running performance tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 