#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates database and runs initial schema setup
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  };

  const dbName = process.env.DB_NAME || 'timepulse_db';

  console.log('🔧 Setting up TimePulse database...');
  console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`👤 User: ${dbConfig.user}`);
  console.log(`🗄️  Database: ${dbName}`);

  try {
    // Connect to PostgreSQL server (without database)
    const client = new Client(dbConfig);
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const dbCheckResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (dbCheckResult.rows.length === 0) {
      // Create database
      console.log(`📝 Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log('✅ Database created successfully');
    } else {
      console.log('ℹ️  Database already exists');
    }

    await client.end();

    // Connect to the specific database
    const dbClient = new Client({
      ...dbConfig,
      database: dbName
    });

    await dbClient.connect();
    console.log(`✅ Connected to database: ${dbName}`);

    // Check if schema file exists
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📋 Running database schema...');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await dbClient.query(schema);
      console.log('✅ Database schema applied successfully');
    } else {
      console.log('⚠️  Schema file not found, skipping schema setup');
    }

    await dbClient.end();
    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure PostgreSQL is running and accessible at:');
      console.log(`   Host: ${dbConfig.host}`);
      console.log(`   Port: ${dbConfig.port}`);
      console.log('\n🔧 To start PostgreSQL:');
      console.log('   macOS (Homebrew): brew services start postgresql');
      console.log('   Linux: sudo systemctl start postgresql');
      console.log('   Windows: net start postgresql-x64-14');
    }
    
    if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Check your credentials:');
      console.log(`   Username: ${dbConfig.user}`);
      console.log('   Password: [hidden]');
      console.log('\n🔧 Update your .env file with correct database credentials');
    }

    process.exit(1);
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
