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
                    serverSelectionTimeoutMS: 10000,
                    socketTimeoutMS: 45000,
                    connectTimeoutMS: 10000,
                    maxPoolSize: 10,
                    minPoolSize: 2,
                    family: 4, // Force IPv4
                    retryWrites: true,
                    retryReads: true,
                };
                console.log("🔄 Attempting Mongoose connection...");
                cachedMongoose.promise = mongoose.connect(finalUri, opts).then((m) => m);
            } catch (error) {
                console.error("❌ Mongoose connection error:", error);
                throw error;
            }
        }
        cachedMongoose.conn = await cachedMongoose.promise;
        console.log("✅ Mongoose connection successful");
    }

    // 2. Handle Native MongoDB connection (cached)
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb, mongoose: cachedMongoose.conn };
    }

    try {
        console.log("🔄 Attempting MongoDB Native connection...");
        const client = new MongoClient(finalUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,
            minPoolSize: 2,
            family: 4, // Force IPv4
            retryWrites: true,
            retryReads: true,
            waitQueueTimeoutMS: 10000,
        });

        await client.connect();
        const db = client.db(MONGODB_DB);

        // Test the connection
        await db.admin().ping();
        console.log("✅ MongoDB Native connection successful");

        cachedClient = client;
        cachedDb = db;
        (global as any).mongoClient = client;
        (global as any).mongoDb = db;

        return { client, db, mongoose: cachedMongoose.conn };
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        
        // Provide helpful error messages
        if (error instanceof Error) {
            if (error.message.includes("ECONNREFUSED")) {
                throw new Error(
                    "MongoDB connection refused. Please check:\n" +
                    "1. MongoDB cluster is running\n" +
                    "2. Network/Internet connection is active\n" +
                    "3. Firewall allows MongoDB connections\n" +
                    "4. MongoDB URI is correct\n" +
                    `Error: ${error.message}`
                );
            } else if (error.message.includes("ENOTFOUND") || error.message.includes("querySrv")) {
                throw new Error(
                    "DNS resolution failed for MongoDB cluster. Please check:\n" +
                    "1. Internet connection is active\n" +
                    "2. DNS is working properly\n" +
                    "3. MongoDB URI is correct\n" +
                    "4. Firewall/VPN allows DNS queries\n" +
                    `Error: ${error.message}`
                );
            }
        }
        throw error;
    }
}

export const clientPromise = (async () => {
    try {
        const { client } = await connectToDatabase();
        return client;
    } catch (error) {
        console.error("❌ clientPromise error:", error);
        throw error;
    }
})();

export function getSafeId(id: string) {
    try {
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            return new mongoose.Types.ObjectId(id);
        }
    } catch (error) {
        console.error("❌ getSafeId error:", error);
    }
    return id;
}
