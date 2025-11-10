/**
 * Remote Database Configuration
 * PostgreSQL configuration for production/staging environments
 */

module.exports = {
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false
    },
    define: {
      timestamps: true,
      underscored: true
    }
  },
  staging: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    // Handle JSON secret format from App Runner
    password: (() => {
      const pwd = process.env.DB_PASSWORD;
      if (!pwd) return undefined;
      // If secret is JSON format, parse it
      try {
        const parsed = JSON.parse(pwd);
        return parsed.password || parsed.PASSWORD || pwd;
      } catch (e) {
        // Not JSON, return as-is
        return pwd;
      }
    })(),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 15,
      min: 2,
      acquire: 45000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
};
