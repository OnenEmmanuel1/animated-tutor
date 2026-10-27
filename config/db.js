const mysql = require('mysql2/promise');
require('dotenv').config();

// SSL is required for Aiven MySQL (and any other managed cloud MySQL).
// Set DB_SSL=true in your environment to enable it.
// Locally (127.0.0.1 / localhost) SSL is skipped automatically.
const isLocal =
  !process.env.DB_HOST ||
  process.env.DB_HOST === '127.0.0.1' ||
  process.env.DB_HOST === 'localhost';

const sslConfig = process.env.DB_SSL === 'true' || !isLocal
  ? { rejectUnauthorized: false }  // Aiven uses its own CA; connection is still encrypted
  : false;

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'tutortoon_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Simple connectivity check
pool.getConnection()
  .then(conn => {
    console.log(`Database connected successfully. (SSL: ${sslConfig ? 'enabled' : 'disabled'})`);
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

module.exports = pool;
