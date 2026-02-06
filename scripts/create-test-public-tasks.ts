/**
 * Script to create test public tasks
 * Run with: npx ts-node scripts/create-test-public-tasks.ts
 */

import mongoose from 'mongoose';
import { Product } from '../src/models/Product';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const createTestTasks = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sambhav';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Sample test tasks
    const testTasks = [
      {
        name: 'Post Instagram Story',
        description: 'Create an engaging story featuring our new summer collection. Showcase your style and tag us!',
        category: 'influencer_marketing',
        section: 'public',
        earnUpTo: 50.00,
        taskUrl: 'https://instagram.com/p/example',
        route: '/public-tasks/post-instagram-story',
        logo: '/uploads/default-influencer-icon.png',
        icon: 'camera_alt',
        isActive: true,
        isNewProduct: true,
        details: {
          benefits: {
            payoutOpportunity: [],
            customerBenefits: [],
          },
          how: JSON.stringify({
            platform: 'Instagram',
            actions: ['Share', 'Tag'],
            instructions: 'Create a story with our products and tag us',
            requireScreenshot: true,
            instantPay: false,
          }),
        },
        marketing: {
          materials: [],
          links: [],
        },
      },
      {
        name: 'Like & Share Post',
        description: 'Like our pinned tweet and retweet it to help spread the word!',
        category: 'social_task',
        section: 'public',
        earnUpTo: 0.50,
        taskUrl: 'https://twitter.com/p/example',
        route: '/public-tasks/like-share-post',
        logo: '/uploads/default-social-icon.png',
        icon: 'thumb_up',
        isActive: true,
        isNewProduct: true,
        details: {
          benefits: {
            payoutOpportunity: [],
            customerBenefits: [],
          },
          how: JSON.stringify({
            platform: 'Twitter',
            actions: ['Like', 'Share'],
            instructions: 'Like and retweet our pinned tweet',
            requireScreenshot: false,
            instantPay: true,
          }),
        },
        marketing: {
          materials: [],
          links: [],
        },
      },
      {
        name: 'Complete Q3 Survey',
        description: 'Help us improve our services by answering 10 questions about your experience.',
        category: 'company_task',
        section: 'public',
        earnUpTo: 5.00,
        taskUrl: 'https://survey.example.com/q3',
        route: '/public-tasks/complete-q3-survey',
        logo: '/uploads/default-company-icon.png',
        icon: 'checklist',
        isActive: true,
        isNewProduct: true,
        details: {
          benefits: {
            payoutOpportunity: [],
            customerBenefits: [],
          },
          how: JSON.stringify({
            workDescription: 'Complete a short survey about your experience',
            instructions: 'Answer 10 questions honestly',
            instantPay: true,
          }),
        },
        marketing: {
          materials: [],
          links: [],
        },
      },
      {
        name: 'Video Editor Needed',
        description: 'Edit a 10-minute vlog for a travel channel. Raw footage provided, need final cut with music.',
        category: 'company_task',
        section: 'public',
        earnUpTo: 120.00,
        taskUrl: 'https://example.com/video-editor',
        route: '/public-tasks/video-editor-needed',
        logo: '/uploads/default-company-icon.png',
        icon: 'work',
        isActive: true,
        isNewProduct: true,
        details: {
          benefits: {
            payoutOpportunity: [],
            customerBenefits: [],
          },
          how: JSON.stringify({
            workDescription: 'Edit travel vlog footage',
            deliverables: ['Final edited video', 'With background music'],
            instructions: 'Edit 10-minute raw footage into final video',
            instantPay: false,
          }),
        },
        marketing: {
          materials: [],
          links: [],
        },
      },
    ];

    // Delete existing test tasks (optional - comment out if you want to keep existing ones)
    // await Product.deleteMany({ section: 'public', name: { $in: testTasks.map(t => t.name) } });
    // console.log('Deleted existing test tasks');

    // Create test tasks
    const createdTasks = [];
    for (const task of testTasks) {
      const existing = await Product.findOne({ name: task.name, section: 'public' });
      if (existing) {
        console.log(`Task "${task.name}" already exists, skipping...`);
        continue;
      }

      const product = await Product.create(task);
      createdTasks.push(product);
      console.log(`Created task: ${product.name} (ID: ${product._id})`);
    }

    console.log(`\n✅ Successfully created ${createdTasks.length} test tasks!`);
    console.log('\nTest tasks created:');
    createdTasks.forEach((task) => {
      console.log(`  - ${task.name} (${task.category}) - ₹${task.earnUpTo}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error creating test tasks:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
createTestTasks();

