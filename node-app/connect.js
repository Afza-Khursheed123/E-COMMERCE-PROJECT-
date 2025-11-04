import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db = null;

export async function connectToDatabase() {
  if (db) return db; // reuse connection

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("    MONGO_URI not found in .env file");

  const client = new MongoClient(uri, {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
  });

  await client.connect();
  db = client.db("USERS"); // your DB name
  console.log("    Connected to MongoDB Atlas");
  return db;
}
