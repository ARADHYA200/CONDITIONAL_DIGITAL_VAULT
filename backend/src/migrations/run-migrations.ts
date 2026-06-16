import dotenv from 'dotenv';
import connectDB from '../config/database';

dotenv.config();

async function runMigrations() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB schemas are managed by Mongoose models. No SQL migrations required.');
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
