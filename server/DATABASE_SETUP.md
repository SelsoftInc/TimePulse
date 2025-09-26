# TimePulse Database Configuration Guide

## Overview

The TimePulse server supports both local and remote PostgreSQL database configurations. The system automatically selects the appropriate configuration based on your environment.

## Configuration Files

### Local Development
- **Config File**: `config/database.local.js`
- **Environment**: Automatically used when `NODE_ENV=development` or `USE_LOCAL_DB=true`
- **Default Database**: `timepulse_local`

### Remote/Production
- **Config File**: `config/database.remote.js`
- **Environment**: Used for production, staging, or when `USE_LOCAL_DB=false`
- **Database**: Configured via environment variables

## Setup Instructions

### 1. Local Development Setup

1. **Install PostgreSQL locally** (if not already installed):
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Create local database
   createdb timepulse_local
   ```

2. **Create your local .env file**:
   ```bash
   cp .env.sample.local .env
   ```

3. **Update the .env file** with your local PostgreSQL credentials:
   ```env
   NODE_ENV=development
   USE_LOCAL_DB=true
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=timepulse_local
   DB_USER=postgres
   DB_PASSWORD=your_local_password
   ```

### 2. Remote/Production Setup

1. **Create your production .env file**:
   ```bash
   cp .env.sample.remote .env
   ```

2. **Update the .env file** with your remote database credentials:
   ```env
   NODE_ENV=production
   DB_HOST=your-remote-host.com
   DB_NAME=timepulse_production
   DB_USER=your_db_user
   DB_PASSWORD=your_secure_password
   DB_SSL=true
   ```

## Database Schema Management

### Development Mode
- **Auto-sync**: Enabled (creates tables if they don't exist)
- **Views**: Automatically recreated after sync
- **Migrations**: Safe mode (no destructive alterations)

### Production Mode
- **Auto-sync**: Disabled (uses existing schema)
- **Migrations**: Should be run manually
- **Views**: Assumes they already exist

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Ensure PostgreSQL is running
   - Check host, port, and credentials
   - Verify database exists

2. **Schema Sync Errors**:
   - The system uses safe sync mode to avoid data loss
   - For major schema changes, run migrations manually

3. **View Dependencies**:
   - Views are automatically managed in development
   - In production, ensure views exist before starting

### Manual Database Reset (Development Only)

If you need to reset your local database:

```bash
# Drop and recreate the database
dropdb timepulse_local
createdb timepulse_local

# Restart the server to recreate schema
npm start
```

## Environment Variables Reference

| Variable | Description | Local Default | Required |
|----------|-------------|---------------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `USE_LOCAL_DB` | Force local config | `true` in dev | No |
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_PORT` | Database port | `5432` | No |
| `DB_NAME` | Database name | `timepulse_local` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | `password` | Yes |
| `DB_SSL` | Enable SSL | `false` | No |

## Configuration Switching

The system automatically chooses the configuration:

- **Local**: When `NODE_ENV=development` OR `USE_LOCAL_DB=true`
- **Remote**: When `NODE_ENV=production/staging` AND `USE_LOCAL_DB≠true`

You can override this by setting `USE_LOCAL_DB=true` in any environment to force local configuration.
