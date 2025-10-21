# TimePulse Local Development Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

## Quick Setup Instructions

### 1. Setup Environment Configuration

Copy the environment configuration file:
```bash
cd server
copy .env.example .env
```

The `.env` file is already configured to use SQLite for local development. You can modify it if needed.

### 2. Install Dependencies

**Backend Dependencies:**
```bash
cd server
npm install
```

**Frontend Dependencies:**
```bash
cd ../frontend
npm install
```

### 3. Database Setup

The project supports both PostgreSQL and SQLite. For local development, SQLite is recommended as it requires no additional setup.

**Option A: SQLite (Recommended for local development)**
```bash
cd server
npm run setup-db
```

**Option B: PostgreSQL (if you prefer)**
1. Install and start PostgreSQL
2. Update `.env` file:
   ```
   USE_SQLITE=false
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=timepulse_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```
3. Run setup:
   ```bash
   npm run setup-db
   ```

### 4. Start the Application

**Start Backend Server:**
```bash
cd server
npm start
```
The backend will run on http://localhost:5001

**Start Frontend (in a new terminal):**
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000

### 5. Verify Setup

1. Backend health check: http://localhost:5001/health
2. Frontend application: http://localhost:3000

## Available Scripts

### Backend (server/)
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm run setup-db` - Initialize database and run migrations
- `npm run migrate:add-client-type` - Add client type migration
- `npm run migrate:create-vendors` - Create vendors migration
- `npm run migrate:add-employee-vendor-impl-partner` - Add employee vendor implementation partner migration

### Frontend (frontend/)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Project Structure

```
TimePulse/
├── server/                 # Backend Node.js/Express server
│   ├── routes/            # API route handlers
│   ├── models/            # Database models (Sequelize)
│   ├── database/          # Database schema and migrations
│   ├── scripts/           # Database setup and migration scripts
│   └── uploads/           # File upload directory
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   └── ...
└── engine/               # Additional processing engine
```

## Database Models

The application includes the following main models:
- **Tenants** - Multi-tenant support
- **Users** - User authentication and management
- **Employees** - Employee information and management
- **Clients** - Client management
- **Vendors** - Vendor management
- **Timesheets** - Timesheet tracking and approval
- **OnboardingLogs** - Tenant onboarding tracking

## Features

- Multi-tenant architecture
- Employee timesheet management
- Client and vendor management
- Invoice generation
- AI-powered document processing
- User authentication and authorization
- File upload and processing

## Troubleshooting

### Database Connection Issues
1. Ensure the database service is running (for PostgreSQL)
2. Check environment variables in `.env`
3. Verify database credentials
4. For SQLite, ensure write permissions in the database directory

### Port Conflicts
- Backend default port: 5001
- Frontend default port: 3000
- Modify `PORT` in `.env` if needed

### Node.js Version Issues
- Ensure Node.js v16 or higher is installed
- Use `node --version` to check your version

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 5001 |
| `NODE_ENV` | Environment mode | development |
| `USE_SQLITE` | Use SQLite instead of PostgreSQL | true |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | timepulse_db |
| `DB_USER` | Database username | postgres |
| `DB_PASSWORD` | Database password | password |
| `JWT_SECRET` | JWT signing secret | your_jwt_secret_key_here |
| `CORS_ORIGIN` | Frontend URL for CORS | http://localhost:3000 |
