// Test MongoDB connection with proper escaping
const { MongoClient } = require('mongodb');

// The password contains @, so we need to URL encode it properly
const username = "likeyiyy";
const password = "likeyiyy@1991MD"; // The actual password
const encodedPassword = encodeURIComponent(password);

// Construct the URI
const uri = `mongodb+srv://${username}:${encodedPassword}@cluster0.k48mkdp.mongodb.net/ai-mapping?retryWrites=true&w=majority`;

console.log('Testing MongoDB connection...');
console.log('URI:', uri.replace(/:([^:@]+)@/, ':***@')); // Hide password

const client = new MongoClient(uri);

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');

    // Test database access
    const db = client.db();
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

    console.log('\n✅ All tests passed! MongoDB is ready to use.');

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (error.code === 8000) {
      console.log('\n💡 Hint: Authentication failed. Please check:');
      console.log('   1. Username and password are correct');
      console.log('   2. User has access to the database');
      console.log('   3. IP address is whitelisted in MongoDB Atlas');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

testConnection();