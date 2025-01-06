require("dotenv").config();
const { Pool } = require("pg");

// Load environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to PostgreSQL database:", err);
  } else {
    console.log("Connected to PostgreSQL database");
  }
});

module.exports = pool;
