import { MongoClient } from "mongodb";
const MONGO_URL = process.env.MONGO_URL || "mongodb://admin:password123@localhost:27018/todos?authSource=admin"

const DB_NAME = "ecommerce"
const COLLECTION_NAME = "products"

let mongocClient = null;
let mongoConn = null;

export async function initMongoDb() {
    try {
    mongocClient = new MongoClient(MONGO_URL);
    await mongocClient.connect();
    mongoConn = mongocClient.db(DB_NAME);
    
    const todosCollection = mongoConn.collection(COLLECTION_NAME);

    await todosCollection.createIndex({ name: 1 }, { unique: true })
    console.log("Database initialized and unique index created on 'name' field")
    }catch (err) {
        console.error("Error initializing database:", err);
        throw err;
    }finally {
        await closeConnection();
  }
}

export async function getMongoDbConnection() {
    if (!mongoConn) {
        if (!mongocClient) {
        mongocClient = new MongoClient(MONGO_URL);
        await mongocClient.connect();
        }
        mongoConn = mongocClient.db(DB_NAME);
  }
  return mongoConn;
}
