generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../db/travel.db"
}

model Place {
  id          Int       @id @default(autoincrement())
  name        String
  location    String
  rating      Int
  description String
  videoUrl    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  categoryId  Int?
  category    Category? @relation(fields: [categoryId], references: [id])
  reviews     Review[]
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  icon      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  places    Place[]
}

model Review {
  id        Int      @id @default(autoincrement())
  content   String
  rating    Int
  author    String
  placeId   Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  place     Place    @relation(fields: [placeId], references: [id], onDelete: Cascade)
}

model places {
  id          Int     @id @default(autoincrement())
  name        String
  location    String
  rating      Int
  description String
  videoUrl    String?
}


