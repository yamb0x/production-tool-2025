#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/production_tool_dev';

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log(`📍 URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//<hidden>:<hidden>@')}`);
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    
    // Get database info
    const db = mongoose.connection.db;
    if (db) {
      const admin = db.admin();
      const info = await admin.serverStatus();
      
      console.log('\n📊 MongoDB Server Info:');
      console.log(`  Version: ${info.version}`);
      console.log(`  Uptime: ${Math.floor(info.uptime / 60)} minutes`);
      console.log(`  Connections: ${info.connections?.current || 'N/A'}`);
    }
    
    // List collections
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('\n📚 Collections:');
    if (collections && collections.length > 0) {
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    } else {
      console.log('  (No collections found - database is empty)');
    }
    
    // Test write operation
    console.log('\n🔬 Testing write operation...');
    const TestSchema = new mongoose.Schema({
      test: String,
      timestamp: { type: Date, default: Date.now }
    });
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    const testDoc = await TestModel.create({
      test: 'Connection test successful'
    });
    console.log('✅ Write test successful');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n✨ All tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error);
    console.error('\n💡 Troubleshooting tips:');
    console.error('  1. Check if MongoDB is running: docker ps | grep mongo');
    console.error('  2. Verify connection string in .env file');
    console.error('  3. For Docker: docker-compose up -d mongodb');
    console.error('  4. For local: mongod --dbpath /data/db');
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('\n👋 Connection closed');
  }
}

// Run the test
testConnection().catch(console.error);