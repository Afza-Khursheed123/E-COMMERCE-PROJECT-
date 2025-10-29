require("dotenv").config();
const { MongoClient } = require("mongodb");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_OPTIONS = "--openssl-legacy-provider";

async function testConnection() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB!");
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await client.close();
  }
}

testConnection();
