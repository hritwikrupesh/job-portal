// server.js
import dotenv from "dotenv";
dotenv.config({ path: "./config/config.env" });

import app from "./app.js";
import cloudinary from "cloudinary";

// Cloudinary configuration
// Cloudinary configuration (use correct variable names)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Start server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Graceful shutdown for safety
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Closing server...`);
  server.close(() => {
    console.log("Server closed gracefully.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  server.close(() => process.exit(1));
});
