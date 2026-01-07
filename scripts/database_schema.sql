-- TimePulse Database Schema
-- Generated from existing database


-- Table: employment_types
CREATE TABLE IF NOT EXISTS employment_types (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name CHARACTER VARYING(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    title CHARACTER VARYING(255) NOT NULL,
    message TEXT NOT NULL,
    type CHARACTER VARYING(50) NOT NULL DEFAULT 'info'::character varying,
    category CHARACTER VARYING(50) NOT NULL DEFAULT 'general'::character varying,
    priority CHARACTER VARYING(20) NOT NULL DEFAULT 'medium'::character varying,
    read_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    action_url CHARACTER VARYING(500),
    metadata JSONB
);


-- Table: lookups
CREATE TABLE IF NOT EXISTS lookups (
    id INTEGER NOT NULL DEFAULT nextval('lookups_id_seq'::regclass),
    category CHARACTER VARYING(50) NOT NULL,
    code CHARACTER VARYING(50) NOT NULL,
    label CHARACTER VARYING(100) NOT NULL,
    value CHARACTER VARYING(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tenant_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Table: tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID NOT NULL,
    tenant_name CHARACTER VARYING(255) NOT NULL,
    legal_name CHARACTER VARYING(255) NOT NULL,
    subdomain CHARACTER VARYING(100) NOT NULL,
    contact_address JSONB DEFAULT '{}'::jsonb,
    invoice_address JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    tax_info JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    logo TEXT,
    status USER-DEFINED DEFAULT 'active'::enum_tenants_status,
    onboarded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_customer_id CHARACTER VARYING(100),
    stripe_subscription_id CHARACTER VARYING(100),
    plan CHARACTER VARYING(30),
    billing_interval CHARACTER VARYING(10),
    seat_limit INTEGER,
    current_period_end TIMESTAMP WITHOUT TIME ZONE
);


-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    first_name CHARACTER VARYING(100) NOT NULL,
    last_name CHARACTER VARYING(100) NOT NULL,
    email CHARACTER VARYING(255) NOT NULL,
    password_hash CHARACTER VARYING(255),
    must_change_password BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    role USER-DEFINED DEFAULT 'employee'::enum_users_role,
    permissions JSONB DEFAULT '[]'::jsonb,
    department CHARACTER VARYING(100),
    title CHARACTER VARYING(100),
    manager_id UUID,
    status USER-DEFINED DEFAULT 'active'::enum_users_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    employee_id UUID,
    reset_password_token CHARACTER VARYING(255),
    reset_password_expires TIMESTAMP WITHOUT TIME ZONE,
    google_id CHARACTER VARYING(255),
    auth_provider CHARACTER VARYING(50) DEFAULT 'local'::character varying,
    email_verified BOOLEAN DEFAULT false,
    approval_status CHARACTER VARYING(20) NOT NULL DEFAULT 'approved'::character varying,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);


-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    client_name CHARACTER VARYING(500) NOT NULL,
    legal_name CHARACTER VARYING(500),
    contact_person CHARACTER VARYING(500),
    email CHARACTER VARYING(500),
    phone CHARACTER VARYING(500),
    billing_address JSONB DEFAULT '{}'::jsonb,
    shipping_address JSONB DEFAULT '{}'::jsonb,
    tax_id CHARACTER VARYING(500),
    payment_terms INTEGER DEFAULT 30,
    hourly_rate NUMERIC DEFAULT 0,
    client_type CHARACTER VARYING(20) DEFAULT 'external'::character varying,
    status USER-DEFINED DEFAULT 'active'::enum_clients_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);


-- Table: vendors
CREATE TABLE IF NOT EXISTS vendors (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    name CHARACTER VARYING(500) NOT NULL,
    contact_person CHARACTER VARYING(500),
    email CHARACTER VARYING(500),
    phone CHARACTER VARYING(500),
    category CHARACTER VARYING(100),
    status USER-DEFINED DEFAULT 'active'::enum_vendors_status,
    total_spent NUMERIC DEFAULT 0,
    address CHARACTER VARYING(1000),
    city CHARACTER VARYING(100),
    state CHARACTER VARYING(100),
    zip CHARACTER VARYING(20),
    country CHARACTER VARYING(100),
    website CHARACTER VARYING(255),
    payment_terms CHARACTER VARYING(50),
    contract_start DATE,
    contract_end DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);


-- Table: onboarding_logs
CREATE TABLE IF NOT EXISTS onboarding_logs (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    source_file CHARACTER VARYING(255),
    onboarding_data JSONB DEFAULT '{}'::jsonb,
    users_created INTEGER DEFAULT 0,
    employees_created INTEGER DEFAULT 0,
    clients_created INTEGER DEFAULT 0,
    status USER-DEFINED DEFAULT 'completed'::enum_onboarding_logs_status,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);


-- Table: invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    invoice_number CHARACTER VARYING(50) NOT NULL,
    client_id UUID NOT NULL,
    timesheet_id UUID,
    invoice_hash CHARACTER VARYING(32),
    invoice_date DATE,
    due_date DATE,
    line_items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    payment_status USER-DEFINED DEFAULT 'pending'::enum_invoices_payment_status,
    payment_date DATE,
    payment_method CHARACTER VARYING(50),
    notes TEXT,
    created_by UUID,
    status USER-DEFINED DEFAULT 'active'::enum_invoices_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    employee_id UUID,
    vendor_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    company_logo TEXT,
    timesheet_file TEXT,
    timesheet_file_name CHARACTER VARYING(255)
);


-- Table: timesheets
CREATE TABLE IF NOT EXISTS timesheets (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    client_id UUID,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    daily_hours JSONB DEFAULT '{"fri": 0, "mon": 0, "sat": 0, "sun": 0, "thu": 0, "tue": 0, "wed": 0}'::jsonb,
    total_hours NUMERIC DEFAULT 0,
    status USER-DEFINED DEFAULT 'draft'::enum_timesheets_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    attachments TEXT DEFAULT '[]'::text,
    submitted_at TIMESTAMP WITHOUT TIME ZONE,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    reviewer_id UUID,
    approved_by UUID,
    rejection_reason TEXT,
    time_entries JSONB DEFAULT '[]'::jsonb,
    overtime_comment TEXT,
    overtime_days JSONB,
    employee_name CHARACTER VARYING(255)
);


-- Table: employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID,
    employee_id CHARACTER VARYING(50),
    first_name CHARACTER VARYING(500) NOT NULL,
    last_name CHARACTER VARYING(500) NOT NULL,
    email CHARACTER VARYING(500),
    phone CHARACTER VARYING(500),
    department CHARACTER VARYING(100),
    title CHARACTER VARYING(100),
    manager_id UUID,
    start_date DATE,
    end_date DATE,
    hourly_rate NUMERIC DEFAULT 0,
    salary_amount NUMERIC DEFAULT 0,
    salary_type USER-DEFINED DEFAULT 'hourly'::enum_employees_salary_type,
    contact_info TEXT,
    status USER-DEFINED DEFAULT 'active'::enum_employees_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    client_id UUID,
    vendor_id UUID,
    impl_partner_id UUID,
    employment_type_id UUID,
    approver_id UUID
);


-- Table: leave_balances
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID NOT NULL,
    employee_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    year INTEGER NOT NULL,
    leave_type USER-DEFINED NOT NULL,
    total_days NUMERIC NOT NULL DEFAULT 0,
    used_days NUMERIC NOT NULL DEFAULT 0,
    pending_days NUMERIC NOT NULL DEFAULT 0,
    carry_forward_days NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);


-- Table: leave_requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID NOT NULL,
    employee_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    leave_type USER-DEFINED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC NOT NULL,
    reason TEXT,
    status USER-DEFINED NOT NULL DEFAULT 'pending'::enum_leave_requests_status,
    attachment_url CHARACTER VARYING(500),
    attachment_name CHARACTER VARYING(255),
    approver_id UUID,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);


-- Table: implementation_partners
CREATE TABLE IF NOT EXISTS implementation_partners (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name CHARACTER VARYING(500) NOT NULL,
    legal_name CHARACTER VARYING(500),
    contact_person CHARACTER VARYING(500),
    email CHARACTER VARYING(500),
    phone CHARACTER VARYING(100),
    address JSONB DEFAULT '{}'::jsonb,
    category CHARACTER VARYING(50) DEFAULT 'implementation_partner'::character varying,
    specialization CHARACTER VARYING(500),
    status CHARACTER VARYING(20) DEFAULT 'active'::character varying,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Table: account_requests
CREATE TABLE IF NOT EXISTS account_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID,
    first_name CHARACTER VARYING(100) NOT NULL,
    last_name CHARACTER VARYING(100) NOT NULL,
    email CHARACTER VARYING(255) NOT NULL,
    phone CHARACTER VARYING(20) NOT NULL,
    country_code CHARACTER VARYING(5) NOT NULL DEFAULT '+1'::character varying,
    password_hash CHARACTER VARYING(255),
    requested_role CHARACTER VARYING(50) NOT NULL DEFAULT 'employee'::character varying,
    requested_approver_id UUID,
    company_name CHARACTER VARYING(255),
    department CHARACTER VARYING(100),
    status CHARACTER VARYING(20) NOT NULL DEFAULT 'pending'::character varying,
    approved_by UUID,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    rejected_by UUID,
    rejected_at TIMESTAMP WITHOUT TIME ZONE,
    rejection_reason TEXT,
    temporary_password CHARACTER VARYING(255),
    user_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);
