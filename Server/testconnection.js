require("dotenv").config();
const { Pool } = require("pg");

// Add validation for environment variables
if (!process.env.DB_PASSWORD) {
  throw new Error("Database password not found in environment variables");
}

const pool = new Pool({
  user: process.env.DB_USER || "",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "",
  password: String(process.env.DB_PASSWORD), // Explicitly convert to string
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Use async/await for better error handling
const connectToDatabase = async () => {
  try {
    await pool.connect();
    console.log("Connected to PostgreSQL database");
  } catch (err) {
    console.error("Error connecting to PostgreSQL database:", err);
    throw err;
  }
};

connectToDatabase();

module.exports = pool;
