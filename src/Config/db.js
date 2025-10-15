const mysql = require("mysql2/promise");
const path = require("path");

// Fallback si jamais index.js n'a pas chargé dotenv assez tôt
if (!process.env.DB_HOST) {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

module.exports = pool;
