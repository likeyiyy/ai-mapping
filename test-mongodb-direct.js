// Test MongoDB connection with direct URI
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://likeyiyy:likeyiyy%401991MD@cluster0.k48mkdp.mongodb.net/?appName=Cluster0";
const dbName = "ai-mapping";

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('URI:', uri.replace(/:([^:@]+)@/, ':***@')); // Hide password

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');

    // Test database access
    const db = client.db(dbName);
    await db.admin().ping();
    console.log('✅ Database ping successful!');

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Current collections:', collections.length > 0 ? collections.map(c => c.name) : 'None');

    // Test write access
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({ test: 'Hello from MongoDB!', timestamp: new Date() });
    console.log('✅ Write test successful! Inserted ID:', result.insertedId);

    // Read test
    const doc = await testCollection.findOne({ _id: result.insertedId });
    console.log('✅ Read test successful! Document:', doc);

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