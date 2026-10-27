const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const isLocal =
        !process.env.DB_HOST ||
        process.env.DB_HOST === '127.0.0.1' ||
        process.env.DB_HOST === 'localhost';

    const sslConfig = process.env.DB_SSL === 'true' || !isLocal
        ? { rejectUnauthorized: false }  // Aiven uses its own CA; connection is still encrypted
        : false;

    console.log(`Connecting to DB at ${process.env.DB_HOST}:${process.env.DB_PORT} (SSL: ${sslConfig ? 'yes' : 'no'})...`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        ssl: sslConfig,
        multipleStatements: true
    });

    // On cloud hosts (Aiven) the DB already exists — just switch into it.
    // Locally, create it if needed.
    if (isLocal) {
        console.log('Local mode: creating database if needed...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    }
    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    // Use the Aiven-compatible schema (no CREATE DATABASE / USE statements)
    const schemaFile = fs.existsSync('./schema.aiven.sql')
        ? './schema.aiven.sql'
        : './schema.sql';

    console.log(`Running ${path.basename(schemaFile)}...`);
    const schema = fs.readFileSync(schemaFile, 'utf8');
    const schemaStatements = schema.split(';').filter(s => s.trim().length > 0);
    for (let s of schemaStatements) {
        if (s.trim()) await connection.query(s);
    }

    console.log('Running seed.sql...');
    const seed = fs.readFileSync('./seed.sql', 'utf8');
    const seedStatements = seed.split(';').filter(s => s.trim().length > 0);
    for (let s of seedStatements) {
        if (s.trim()) {
            try {
                await connection.query(s);
            } catch (e) {
                console.warn('Seed warning (skipped):', s.substring(0, 60).trim(), '|', e.message);
            }
        }
    }

    console.log('\n✅ Database setup complete!');
    await connection.end();
}

run().catch(err => {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
});
