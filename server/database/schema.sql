-- TimePulse Multi-Tenant Database Schema
-- PostgreSQL Database Schema for TimePulse Application

-- Create database (run this separately)
-- CREATE DATABASE timepulse_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TENANTS TABLE (Master tenant registry)
-- =============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_name VARCHAR(255) NOT NULL UNIQUE,
    legal_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    
    -- Contact Address
    contact_address JSONB DEFAULT '{}',
    
    -- Invoice Address
    invoice_address JSONB DEFAULT '{}',
    
    -- Contact Information
    contact_info JSONB DEFAULT '{}',
    
    -- Tax Information
    tax_info JSONB DEFAULT '{}',
    
    -- Tenant Settings
    settings JSONB DEFAULT '{}',
    
    -- Status and Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    onboarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VENDORS TABLE (Tenant's vendors)
-- =============================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Vendor Information
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Classification and Status
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
    
    -- Financials
    total_spent DECIMAL(12,2) DEFAULT 0,
    
    -- Address
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip VARCHAR(20),
    country VARCHAR(100),
    
    -- Web and Contract
    website VARCHAR(255),
    payment_terms VARCHAR(50),
    contract_start DATE,
    contract_end DATE,
    
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for vendors
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(tenant_id, name);

-- =============================================
-- USERS TABLE (All users across tenants)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Role and Permissions
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'accountant', 'hr', 'approver')),
    permissions JSONB DEFAULT '[]',
    
    -- Organization Details
    department VARCHAR(100),
    title VARCHAR(100),
    manager_id UUID REFERENCES users(id),
    
    -- Status and Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique email per tenant
    UNIQUE(tenant_id, email)
);

-- =============================================
-- EMPLOYEES TABLE (Employee-specific data)
-- =============================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to user account if exists
    
    -- Employee Information
    employee_id VARCHAR(50), -- Company-specific employee ID
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    
    -- Employment Details
    department VARCHAR(100),
    title VARCHAR(100),
    manager_id UUID REFERENCES employees(id),
    start_date DATE,
    end_date DATE,
    
    -- Compensation
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    salary_amount DECIMAL(12,2) DEFAULT 0,
    salary_type VARCHAR(20) DEFAULT 'hourly' CHECK (salary_type IN ('hourly', 'salary', 'contract')),
    
    -- Contact Information
    contact_info JSONB DEFAULT '{}',
    
    -- Status and Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique employee_id per tenant (if provided)
    UNIQUE(tenant_id, employee_id)
);

-- =============================================
-- CLIENTS TABLE (Tenant's clients)
-- =============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    
    -- Contact Information
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Address Information
    billing_address JSONB DEFAULT '{}',
    shipping_address JSONB DEFAULT '{}',
    
    -- Business Information
    tax_id VARCHAR(50),
    payment_terms INTEGER DEFAULT 30, -- Days
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    client_type VARCHAR(20) DEFAULT 'external' CHECK (client_type IN ('internal','external')),
    
    -- Status and Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PROJECTS TABLE (Client projects)
-- =============================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Project Information
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    project_code VARCHAR(50),
    
    -- Project Timeline
    start_date DATE,
    end_date DATE,
    estimated_hours INTEGER,
    
    -- Billing Information
    hourly_rate DECIMAL(10,2),
    budget DECIMAL(12,2),
    
    -- Status and Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TIMESHEETS TABLE
-- =============================================
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Timesheet Information
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Time Entries (stored as JSONB for flexibility)
    time_entries JSONB DEFAULT '[]', -- Array of daily time entries
    total_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Status and Approval
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one timesheet per employee per week
    UNIQUE(tenant_id, employee_id, week_start_date)
);

-- =============================================
-- INVOICES TABLE
-- =============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Invoice Information
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Invoice Items (stored as JSONB)
    line_items JSONB DEFAULT '[]',
    
    -- Amounts
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Payment Information
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_date DATE,
    payment_method VARCHAR(50),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique invoice number per tenant
    UNIQUE(tenant_id, invoice_number)
);

-- =============================================
-- ONBOARDING LOG TABLE
-- =============================================
CREATE TABLE onboarding_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Onboarding Information
    source_file VARCHAR(255),
    onboarding_data JSONB DEFAULT '{}',
    
    -- Statistics
    users_created INTEGER DEFAULT 0,
    employees_created INTEGER DEFAULT 0,
    clients_created INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES for Performance
-- =============================================

-- Tenant-based indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_timesheets_tenant_id ON timesheets(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);

-- User authentication indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- Employee lookup indexes
CREATE INDEX idx_employees_employee_id ON employees(tenant_id, employee_id);
CREATE INDEX idx_employees_email ON employees(tenant_id, email);

-- Timesheet indexes
CREATE INDEX idx_timesheets_employee_week ON timesheets(employee_id, week_start_date);
CREATE INDEX idx_timesheets_status ON timesheets(tenant_id, status);

-- Invoice indexes
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_date ON invoices(tenant_id, invoice_date);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, payment_status);

-- =============================================
-- ROW LEVEL SECURITY (RLS) for Multi-tenancy
-- =============================================

-- Enable RLS on all tenant-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (these will be set up based on application context)
-- Example policy for users table:
-- CREATE POLICY tenant_isolation_users ON users
--     USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA VIEWS
-- =============================================

-- View for tenant dashboard
CREATE VIEW tenant_dashboard AS
SELECT 
    t.id,
    t.tenant_name,
    t.subdomain,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT e.id) as total_employees,
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT ts.id) as total_timesheets,
    COUNT(DISTINCT i.id) as total_invoices
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN employees e ON t.id = e.tenant_id
LEFT JOIN clients c ON t.id = c.tenant_id
LEFT JOIN projects p ON t.id = p.tenant_id
LEFT JOIN timesheets ts ON t.id = ts.tenant_id
LEFT JOIN invoices i ON t.id = i.tenant_id
GROUP BY t.id, t.tenant_name, t.subdomain;
