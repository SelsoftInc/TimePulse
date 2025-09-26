/**
 * Local Database Configuration
 * PostgreSQL configuration for local development
 */

module.exports = {
  development: {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'timepulse_db',
    username: 'postgres',
    password: 'password',
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
};
