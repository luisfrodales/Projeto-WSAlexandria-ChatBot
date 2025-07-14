import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config({ path: 'config.env' });

const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if users already exist
    const existingUsers = await User.find({
      email: { $in: ['felippe@chatbot.com', 'nicholas@chatbot.com'] }
    });

    if (existingUsers.length > 0) {
      console.log('⚠️  Users already exist:');
      existingUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.username})`);
      });
      console.log('💡 Use different emails or delete existing users first');
      return;
    }

    // Create admin users
    const adminUsers = [
      {
        username: 'felippe_admin',
        email: 'felippe@chatbot.com',
        password: '2025@chatbot',
        firstName: 'Felippe',
        lastName: 'Admin',
        isActive: true
      },
      {
        username: 'nicholas_admin',
        email: 'nicholas@chatbot.com',
        password: '2025@chatbot',
        firstName: 'Nicholas',
        lastName: 'Admin',
        isActive: true
      }
    ];

    // Insert users
    const createdUsers = [];
    for (const userData of adminUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email} (${user.username})`);
    }

    console.log('\n🎉 Successfully created admin users:');
    createdUsers.forEach(user => {
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   🔑 Password: 2025@chatbot`);
      console.log(`   📅 Created: ${user.createdAt}`);
      console.log('   ---');
    });

    console.log('\n🔐 Login credentials:');
    console.log('   felippe@chatbot.com / 2025@chatbot');
    console.log('   nicholas@chatbot.com / 2025@chatbot');

  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    
    if (error.code === 11000) {
      console.log('💡 Duplicate key error - users may already exist');
    }
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run the seed
seedUsers(); 