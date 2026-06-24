import "dotenv/config";

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/studyNest?retryWrites=false";

const client = new MongoClient(mongoUri);
client
  .connect()
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err.message));
const db = client.db();

const trustedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  process.env.BETTER_AUTH_URL || "http://localhost:3000",
].filter(Boolean);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

  database: mongodbAdapter(db),

  trustedOrigins,

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/callback/google`,
    },
  },
});
