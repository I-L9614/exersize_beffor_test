import { MongoClient } from "mongodb";
async function initMongoDb() {
    const MONGO_URL = process.env.MONGO_URL || "mongodb://admin:password123@localhost:27018/todos?authSource=admin"
    
}
