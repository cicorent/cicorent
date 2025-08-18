import 'dotenv/config';
import { db } from './db';
import { vehicles, employees, bookingSequence } from '@shared/schema';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(vehicles);
    await db.delete(employees);
    await db.delete(bookingSequence);

    // Seed vehicles
    console.log('Seeding vehicles...');
    await db.insert(vehicles).values([
      {
        name: 'Volkswagen Polo',
        slug: 'volkswagen-polo',
        type: 'CAR',
        basePriceDay: '60',
        quantity: 2,
        availableQuantity: 2,
        colorOptions: ['Bianco', 'Nero'],
        seats: 5,
        transmission: 'MANUAL',
        fuelType: 'GASOLINE',
        imageUrl: 'https://cdn.motor1.com/images/mgl/1BKEp/s1/copertina-nuova-volkswagen-polo-listino-prezzi-da-13600-euro.jpg',
      },
      {
        name: 'Volkswagen Crafter L3H3',
        slug: 'volkswagen-crafter',
        type: 'VAN',
        basePriceDay: '80',
        quantity: 2,
        availableQuantity: 2,
        colorOptions: ['Bianco'],
        seats: 3,
        transmission: 'MANUAL',
        fuelType: 'DIESEL',
        imageUrl: 'https://assets.volkswagen.com/is/image/volkswagenag/vw-crafter-van-5x3?Zml0PWNyb3AsMSZmbXQ9cG5nJndpZD04MDAmYWxpZ249MC4wMCwwLjAwJmJmYz1vZmYmYzRiMA==',
      },
      {
        name: 'Peugeot Boxer III L2H2',
        slug: 'peugeot-boxer-iii',
        type: 'VAN',
        basePriceDay: '80',
        quantity: 3,
        availableQuantity: 3,
        colorOptions: ['Bianco'],
        seats: 3,
        transmission: 'MANUAL',
        fuelType: 'DIESEL',
        imageUrl: 'https://www.cheautocompro.it/sites/default/files/images/auto/3115771_BOXER_2024_1.jpg',
      },
    ]);

    // Seed employees
    console.log('Seeding employees...');
    const adminPassword = await bcrypt.hash('admin', 10);
    const staffPassword = await bcrypt.hash('staff', 10);

    await db.insert(employees).values([
      {
        username: 'admin',
        password: adminPassword,
        role: 'ADMIN',
      },
      {
        username: 'staff',
        password: staffPassword,
        role: 'STAFF',
      },
    ]);

    // Initialize booking sequence
    console.log('Initializing booking sequence...');
    await db.insert(bookingSequence).values([
      {
        lastValue: 0,
      },
    ]);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seed finished');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}

export { seedDatabase };