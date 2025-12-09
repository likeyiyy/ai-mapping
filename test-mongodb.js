// Test MongoDB connection
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('Testing MongoDB connection...');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');

    // Test database access
    const db = client.db(process.env.MONGODB_DB_NAME || 'ai-mapping');
    await db.admin().ping();
    console.log('✅ Database ping successful!');

    // Test write access
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({ test: 'Hello from MongoDB!' });
    console.log('✅ Write test successful! Inserted ID:', result.insertedId);

    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Cleanup successful!');

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

testConnection();