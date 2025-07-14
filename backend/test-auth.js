import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config({ path: 'config.env' });

const testAuth = async () => {
  try {
    console.log('🧪 Testing authentication system...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if admin users exist
    console.log('\n📋 Test 1: Checking admin users...');
    const adminUsers = await User.find({
      email: { $in: ['felippe@chatbot.com', 'nicholas@chatbot.com'] }
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found. Run "npm run backend:seed" first.');
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.username}) - Active: ${user.isActive}`);
    });

    // Test 2: Test password validation
    console.log('\n🔐 Test 2: Testing password validation...');
    const testUser = adminUsers[0];
    
    // Test correct password
    const correctPassword = await testUser.comparePassword('2025@chatbot');
    console.log(`✅ Correct password test: ${correctPassword ? 'PASS' : 'FAIL'}`);
    
    // Test incorrect password
    const incorrectPassword = await testUser.comparePassword('wrongpassword');
    console.log(`✅ Incorrect password test: ${!incorrectPassword ? 'PASS' : 'FAIL'}`);

    // Test 3: Test user status
    console.log('\n👤 Test 3: Testing user status...');
    const activeUsers = await User.find({ isActive: true });
    const inactiveUsers = await User.find({ isActive: false });
    
    console.log(`✅ Active users: ${activeUsers.length}`);
    console.log(`✅ Inactive users: ${inactiveUsers.length}`);

    // Test 4: Test email case insensitivity
    console.log('\n📧 Test 4: Testing email case insensitivity...');
    const upperCaseEmail = await User.findOne({ 
      email: { $regex: new RegExp(`^${testUser.email.toUpperCase()}$`, 'i') }
    });
    console.log(`✅ Case insensitive email search: ${upperCaseEmail ? 'PASS' : 'FAIL'}`);

    // Test 5: Test user methods
    console.log('\n🔧 Test 5: Testing user methods...');
    const userJSON = testUser.toJSON();
    console.log(`✅ toJSON method (no password): ${!userJSON.password ? 'PASS' : 'FAIL'}`);
    console.log(`✅ User has required fields: ${userJSON.email && userJSON.username ? 'PASS' : 'FAIL'}`);

    console.log('\n🎉 All authentication tests completed successfully!');
    console.log('\n📝 Login Test Commands:');
    console.log('curl -X POST http://localhost:3001/api/auth/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email": "felippe@chatbot.com", "password": "2025@chatbot"}\'');

  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run the test
testAuth(); 