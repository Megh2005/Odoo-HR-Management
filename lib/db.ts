import { MongoClient, Db } from "mongodb";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "hrspecs";

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable"
    );
}

// Ensure the URI has proper query parameters
let finalUri = MONGODB_URI;
if (!finalUri.includes("?")) {
    finalUri += "/?retryWrites=true&w=majority";
} else if (!finalUri.includes("retryWrites")) {
    finalUri += "&retryWrites=true&w=majority";
}

let cachedClient: MongoClient | null = (global as any).mongoClient || null;
let cachedDb: Db | null = (global as any).mongoDb || null;
let cachedMongoose: any = (global as any).mongoose;

if (!cachedMongoose) {
    cachedMongoose = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    // 1. Handle Mongoose connection
    if (!cachedMongoose.conn) {
        if (!cachedMongoose.promise) {
            try {
                const opts = {
                    bufferCommands: false,
                    dbName: MONGODB_DB,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                };
                cachedMongoose.promise = mongoose.connect(finalUri, opts).then((m) => m);
            } catch (error) {
                console.error("Mongoose connection error:", error);
                throw error;
            }
        }
        cachedMongoose.conn = await cachedMongoose.promise;
    }

    // 2. Handle Native MongoDB connection (cached)
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb, mongoose: cachedMongoose.conn };
    }

    try {
        const client = new MongoClient(finalUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            retryReads: true,
        });

        await client.connect();
        const db = client.db(MONGODB_DB);

        // Test the connection
        await db.admin().ping();
        console.log("✓ MongoDB connection successful");

        cachedClient = client;
        cachedDb = db;
        (global as any).mongoClient = client;
        (global as any).mongoDb = db;

        return { client, db, mongoose: cachedMongoose.conn };
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export const clientPromise = (async () => {
    try {
        const { client } = await connectToDatabase();
        return client;
    } catch (error) {
        console.error("clientPromise error:", error);
        throw error;
    }
})();

export function getSafeId(id: string) {
    try {
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            return new mongoose.Types.ObjectId(id);
        }
    } catch (error) {
        console.error("getSafeId error:", error);
    }
    return id;
}
