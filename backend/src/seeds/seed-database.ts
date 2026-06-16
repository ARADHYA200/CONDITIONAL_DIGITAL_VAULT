import dotenv from 'dotenv';
import connectDB from '../config/database';
import { User } from '../models/User';
import { hashPassword } from '../services/auth.service';
import { createArtifact } from '../services/artifact.service';
import { ArtifactCategory, ConditionType } from '../models/types';

dotenv.config();

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const existingDemo = await User.findOne({ email: 'demo@example.com' });
    if (existingDemo) {
      console.log('Demo data already exists. Skipping seed.');
      process.exit(0);
    }

    console.log('Seeding database...');

    const passwordHash = await hashPassword('demo123');

    const user1 = await User.create({ email: 'demo@example.com', password_hash: passwordHash });
    await User.create({ email: 'test@example.com', password_hash: passwordHash });

    console.log('Created demo users');

    const userId1 = user1._id.toString();

    await createArtifact(userId1, {
      title: 'Future Message to Myself',
      content: 'This is a message that will unlock in 1 minute. Remember to stay positive!',
      category: ArtifactCategory.MESSAGE,
      conditions: [
        {
          condition_type: ConditionType.TIME_BASED,
          condition_data: {
            unlock_duration_days: 0,
            unlock_date: new Date(Date.now() + 60000).toISOString()
          }
        }
      ]
    });

    await createArtifact(userId1, {
      title: 'Graduation Memory',
      content: 'Congratulations on completing your degree! This memory will unlock when you confirm your graduation.',
      category: ArtifactCategory.MEMORY,
      conditions: [
        {
          condition_type: ConditionType.BEHAVIOR_BASED,
          condition_data: {
            required_action: 'Confirm graduation milestone',
            confirmation_required: true
          }
        }
      ]
    });

    await createArtifact(userId1, {
      title: 'Important Advice',
      content: 'This advice will be available in 30 days. Patience is a virtue.',
      category: ArtifactCategory.ADVICE,
      conditions: [
        {
          condition_type: ConditionType.TIME_BASED,
          condition_data: {
            unlock_duration_days: 30
          }
        }
      ]
    });

    await createArtifact(userId1, {
      title: 'Inactivity Warning',
      content: 'This artifact will be archived if you do not log in for 7 days.',
      category: ArtifactCategory.DOCUMENT,
      conditions: [
        {
          condition_type: ConditionType.INACTIVITY_BASED,
          condition_data: {
            days_of_inactivity: 7,
            action_on_inactivity: 'archive'
          }
        }
      ]
    });

    console.log('Created demo artifacts');
    console.log('Seeding completed successfully!');
    console.log('\nDemo credentials:');
    console.log('Email: demo@example.com');
    console.log('Password: demo123');
    console.log('\nEmail: test@example.com');
    console.log('Password: demo123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
