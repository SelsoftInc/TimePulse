# Tenant Onboarding System

The TimePulse tenant onboarding system allows you to automatically create tenants, users, employees, and clients from Excel files.

## Setup

### 1. Database Setup

First, ensure PostgreSQL is installed and running, then set up the database:

```bash
# Install dependencies
npm install

# Set up database (creates database and applies schema)
npm run setup-db
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update the database credentials:

```bash
cp .env.example .env
```

Update the database configuration in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timepulse_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## Excel File Format

Place Excel files in the `Onboard/` folder. Each file should contain three sheets:

### Client Sheet
| Column | Description | Required |
|--------|-------------|----------|
| Client Name | Name of the client | Yes |
| Legal Name | Legal business name | No |
| Contact Person | Primary contact | No |
| Email | Client email | No |
| Phone | Client phone | No |
| Billing Address | Address for billing | No |
| City | City | No |
| State | State/Province | No |
| Zip Code | Postal code | No |
| Country | Country (defaults to US) | No |
| Tax ID | Tax identification number | No |
| Payment Terms | Payment terms in days (default 30) | No |
| Hourly Rate | Default hourly rate | No |

### Users Sheet
| Column | Description | Required |
|--------|-------------|----------|
| First Name | User's first name | Yes |
| Last Name | User's last name | Yes |
| Email | User's email address | Yes |
| Role | User role (admin, manager, employee, etc.) | No |
| Department | Department name | No |
| Title | Job title | No |

### Employees Sheet
| Column | Description | Required |
|--------|-------------|----------|
| Employee ID | Unique employee identifier | No |
| First Name | Employee's first name | Yes |
| Last Name | Employee's last name | Yes |
| Email | Employee's email address | No |
| Department | Department name | No |
| Title | Job title | No |
| Start Date | Employment start date | No |
| Hourly Rate | Employee's hourly rate | No |
| Salary | Annual salary amount | No |
| Salary Type | hourly, salary, or contract | No |

## API Endpoints

### List Available Tenants
```
GET /api/onboarding/tenants
```

Returns all Excel files in the Onboard folder with their onboarding status.

### Preview Tenant Data
```
GET /api/onboarding/tenants/:tenantName/preview
```

Preview the data that would be created from an Excel file without actually onboarding.

### Onboard Tenant
```
POST /api/onboarding/tenants/:tenantName/onboard
Content-Type: application/json

{
  "subdomain": "tenant-subdomain"
}
```

Process the Excel file and create the tenant with all associated data.

### Check Onboarding Status
```
GET /api/onboarding/tenants/:tenantName/status
```

Check if a tenant has been onboarded and get summary information.

## Example Usage

1. **Place Excel File**: Put `AcmeCorp.xlsx` in the `Onboard/` folder
2. **Preview Data**: `GET /api/onboarding/tenants/AcmeCorp/preview`
3. **Onboard Tenant**: `POST /api/onboarding/tenants/AcmeCorp/onboard` with `{"subdomain": "acme"}`
4. **Check Status**: `GET /api/onboarding/tenants/AcmeCorp/status`

## Default Credentials

All users created during onboarding will have:
- **Password**: `TempPass123!`
- **Must Change Password**: `true`

Users will be required to change their password on first login.

## Database Structure

The system creates the following database records:

- **Tenant**: Main tenant record with company information
- **Users**: User accounts with authentication and roles
- **Employees**: Employee records with HR information
- **Clients**: Client records for project management
- **Onboarding Log**: Audit trail of the onboarding process

## Multi-Tenant Isolation

The system uses PostgreSQL Row Level Security (RLS) to ensure complete data isolation between tenants. Each tenant can only access their own data.

## Error Handling

The system includes comprehensive error handling:
- File validation
- Data transformation errors
- Database constraint violations
- Transaction rollback on failures

## Security Features

- Password hashing with bcrypt
- JWT token authentication (planned)
- Row-level security for tenant isolation
- Input validation and sanitization
- Audit logging of all onboarding activities
