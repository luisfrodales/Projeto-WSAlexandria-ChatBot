import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config.env') });

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Not configured');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Please check your config.env file');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected successfully!');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Port: ${conn.connection.port}`);

    // Test creating a simple document
    const TestModel = mongoose.model('Test', new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    }));

    const testDoc = new TestModel({ message: 'Connection test successful' });
    await testDoc.save();
    console.log('✅ Document creation test passed');

    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Document cleanup successful');

    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.name === 'MongoNetworkError') {
      console.log('💡 Check if:');
      console.log('   - Your internet connection is working');
      console.log('   - The MongoDB URI is correct');
      console.log('   - Your IP is whitelisted in MongoDB Atlas');
    }
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('💡 Check if:');
      console.log('   - The database name is correct');
      console.log('   - The username and password are correct');
      console.log('   - The cluster is running');
    }
  }
};

// Run the test
testConnection(); 