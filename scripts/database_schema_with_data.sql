-- TimePulse Database Schema with Data
-- Generated from existing database
-- Database: timepulse_db


-- ============================================
-- Table: employment_types
-- ============================================
DROP TABLE IF EXISTS employment_types CASCADE;
CREATE TABLE employment_types (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name CHARACTER VARYING(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE employment_types ADD PRIMARY KEY (id);

-- Data for table: employment_types
INSERT INTO employment_types (id, tenant_id, name, description, is_active, created_at, updated_at) VALUES ('e3ea0404-68a4-4a7b-938f-48780eb86114', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'W2', 'Full-time employee with W2 tax classification', TRUE, '2025-10-24 18:18:24.104300+05:30', '2025-10-24 18:18:24.104300+05:30');
INSERT INTO employment_types (id, tenant_id, name, description, is_active, created_at, updated_at) VALUES ('ac659a1c-03f4-4bf0-b3cb-15fc264027a4', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'Sub-Contract', 'Independent contractor or subcontractor', TRUE, '2025-10-24 18:18:24.104300+05:30', '2025-10-24 18:18:24.104300+05:30');


-- ============================================
-- Table: notifications
-- ============================================
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
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

ALTER TABLE notifications ADD PRIMARY KEY (id);

-- Data for table: notifications
INSERT INTO notifications (id, tenant_id, user_id, title, message, type, category, priority, read_at, created_at, updated_at, expires_at, action_url, metadata) VALUES ('42074377-45ce-4132-a108-0fe7e317f606', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'e54903c1-7535-46f3-9385-08cdc1d19f7b', 'New User Registration Pending Approval', 'Shunmugavel S (shunmugavelsv05@gmail.com) has registered via Google OAuth and is awaiting approval.', 'warning', 'approval', 'high', NULL, '2025-12-10 05:33:09.278000', '2025-12-10 05:33:09.278000', NULL, '/user-approvals', '{"pendingUserId": "a1e3352a-9aed-4eab-a7af-0c47cdf99d2b", "pendingUserName": "Shunmugavel S", "pendingUserRole": "employee", "pendingUserEmail": "shunmugavelsv05@gmail.com", "registrationDate": "2025-12-10T05:33:09.278Z"}');
INSERT INTO notifications (id, tenant_id, user_id, title, message, type, category, priority, read_at, created_at, updated_at, expires_at, action_url, metadata) VALUES ('6ea81d18-1a9f-4c3d-88db-ea49b9aa6e58', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'New User Registration Pending Approval', 'Shunmugavel S (shunmugavelsv05@gmail.com) has registered via Google OAuth and is awaiting approval.', 'warning', 'approval', 'high', '2025-12-10 06:21:05.870000', '2025-12-10 05:33:09.294000', '2025-12-10 06:21:05.874548', NULL, '/user-approvals', '{"pendingUserId": "a1e3352a-9aed-4eab-a7af-0c47cdf99d2b", "pendingUserName": "Shunmugavel S", "pendingUserRole": "employee", "pendingUserEmail": "shunmugavelsv05@gmail.com", "registrationDate": "2025-12-10T05:33:09.294Z"}');
INSERT INTO notifications (id, tenant_id, user_id, title, message, type, category, priority, read_at, created_at, updated_at, expires_at, action_url, metadata) VALUES ('0da8858a-9b29-4a49-a801-7ca79d804749', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'e54903c1-7535-46f3-9385-08cdc1d19f7b', 'Timesheet Pending Approval', 'Selvakumar Murugesan has submitted a timesheet for week of 2025-12-14 and is waiting for your approval.', 'info', 'approval', 'medium', NULL, '2025-12-29 08:31:43.752000', '2025-12-29 08:31:43.752000', NULL, '/timesheets/approval', '{"weekEndDate": "2025-12-20", "approvalType": "timesheet", "employeeName": "Selvakumar Murugesan", "weekStartDate": "2025-12-14"}');
INSERT INTO notifications (id, tenant_id, user_id, title, message, type, category, priority, read_at, created_at, updated_at, expires_at, action_url, metadata) VALUES ('292e55d9-9a21-4fac-9072-e506e4855416', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '1a778527-c08f-4077-afbf-fe2103dcf92f', 'Timesheet Pending Approval', 'Selvakumar Murugesan has submitted a timesheet for week of 2025-12-14 and is waiting for your approval.', 'info', 'approval', 'medium', NULL, '2025-12-29 08:31:43.753000', '2025-12-29 08:31:43.753000', NULL, '/timesheets/approval', '{"weekEndDate": "2025-12-20", "approvalType": "timesheet", "employeeName": "Selvakumar Murugesan", "weekStartDate": "2025-12-14"}');
INSERT INTO notifications (id, tenant_id, user_id, title, message, type, category, priority, read_at, created_at, updated_at, expires_at, action_url, metadata) VALUES ('4f08fdcc-f511-449b-9c47-8c264c9eed4d', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'c77c27dd-13df-49a0-9774-168c17f7f129', 'Timesheet Pending Approval', 'Selvakumar Murugesan has submitted a timesheet for week of 2025-12-14 and is waiting for your approval.', 'info', 'approval', 'medium', NULL, '2025-12-29 08:31:43.753000', '2025-12-29 08:31:43.753000', NULL, '/timesheets/approval', '{"weekEndDate": "2025-12-20", "approvalType": "timesheet", "employeeName": "Selvakumar Murugesan", "weekStartDate": "2025-12-14"}');
INSERT INTO notifications (id, tenant_id, user_id, title, message, type, category, priority, read_at, created_at, updated_at, expires_at, action_url, metadata) VALUES ('b2d83886-0246-47a8-83aa-51a4adfc017e', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'Timesheet Pending Approval', 'Selvakumar Murugesan has submitted a timesheet for week of 2025-12-14 and is waiting for your approval.', 'info', 'approval', 'medium', '2025-12-29 08:33:58.724000', '2025-12-29 08:31:43.753000', '2025-12-29 08:33:58.726293', NULL, '/timesheets/approval', '{"weekEndDate": "2025-12-20", "approvalType": "timesheet", "employeeName": "Selvakumar Murugesan", "weekStartDate": "2025-12-14"}');

-- ============================================
-- Table: lookups
-- ============================================
DROP TABLE IF EXISTS lookups CASCADE;
CREATE TABLE lookups (
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

ALTER TABLE lookups ADD PRIMARY KEY (id);

-- Data for table: lookups
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (1, 'user_role', 'admin', 'Admin', NULL, 1, TRUE, NULL, '2025-11-19 06:54:26.598027', '2025-11-19 06:54:26.598027');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (2, 'user_role', 'manager', 'Manager', NULL, 2, TRUE, NULL, '2025-11-19 06:54:26.598027', '2025-11-19 06:54:26.598027');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (3, 'user_role', 'approver', 'Approver', NULL, 3, TRUE, NULL, '2025-11-19 06:54:26.598027', '2025-11-19 06:54:26.598027');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (4, 'user_role', 'employee', 'Employee', NULL, 4, TRUE, NULL, '2025-11-19 06:54:26.598027', '2025-11-19 06:54:26.598027');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (5, 'user_role', 'accountant', 'Accountant', NULL, 5, TRUE, NULL, '2025-11-19 06:54:26.598027', '2025-11-19 06:54:26.598027');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (6, 'user_role', 'hr', 'HR', NULL, 6, TRUE, NULL, '2025-11-19 06:54:26.598027', '2025-11-19 06:54:26.598027');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (7, 'payment_terms', 'due_on_receipt', 'Due on Receipt', 'due_on_receipt', 1, TRUE, NULL, '2025-12-09 07:02:29.942000', '2025-12-09 07:02:29.942000');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (8, 'payment_terms', 'net15', 'Net 15', 'net15', 2, TRUE, NULL, '2025-12-09 07:02:29.985000', '2025-12-09 07:02:29.985000');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (9, 'payment_terms', 'net30', 'Net 30', 'net30', 3, TRUE, NULL, '2025-12-09 07:02:29.991000', '2025-12-09 07:02:29.991000');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (10, 'payment_terms', 'net45', 'Net 45', 'net45', 4, TRUE, NULL, '2025-12-09 07:02:29.994000', '2025-12-09 07:02:29.994000');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (11, 'payment_terms', 'net60', 'Net 60', 'net60', 5, TRUE, NULL, '2025-12-09 07:02:29.997000', '2025-12-09 07:02:29.997000');
INSERT INTO lookups (id, category, code, label, value, display_order, is_active, tenant_id, created_at, updated_at) VALUES (12, 'payment_terms', 'net90', 'Net 90', 'net90', 6, TRUE, NULL, '2025-12-09 07:02:30', '2025-12-09 07:02:30');


-- ============================================
-- Table: tenants
-- ============================================
DROP TABLE IF EXISTS tenants CASCADE;
CREATE TABLE tenants (
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

ALTER TABLE tenants ADD PRIMARY KEY (id);

-- Data for table: tenants
INSERT INTO tenants (id, tenant_name, legal_name, subdomain, contact_address, invoice_address, contact_info, tax_info, settings, logo, status, onboarded_at, created_at, updated_at, stripe_customer_id, stripe_subscription_id, plan, billing_interval, seat_limit, current_period_end) VALUES ('3f54ba53-7fb5-4353-a8d7-dd2b2e6ddb57', 'Shunmugavel Subbiah''s Company', 'Shunmugavel Subbiah''s Company', 'shunmugavel', '{}', '{}', '{}', '{}', '{}', NULL, 'active', '2025-12-08 12:55:27.666000+05:30', '2025-12-08 12:55:27.668000+05:30', '2025-12-08 12:55:27.668000+05:30', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO tenants (id, tenant_name, legal_name, subdomain, contact_address, invoice_address, contact_info, tax_info, settings, logo, status, onboarded_at, created_at, updated_at, stripe_customer_id, stripe_subscription_id, plan, billing_interval, seat_limit, current_period_end) VALUES ('81acbb0e-74ba-4436-b1b3-40b52c155932', 'selsoft', 'Chandralekha Veerasami''s Company', 'chandralekha', '{}', '{}', '{}', '{}', '{}', NULL, 'active', '2025-12-08 14:58:46.993000+05:30', '2025-12-08 14:58:46.993000+05:30', '2025-12-09 10:30:09.168000+05:30', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO tenants (id, tenant_name, legal_name, subdomain, contact_address, invoice_address, contact_info, tax_info, settings, logo, status, onboarded_at, created_at, updated_at, stripe_customer_id, stripe_subscription_id, plan, billing_interval, seat_limit, current_period_end) VALUES ('5eda5596-b1d9-4963-953d-7af9d0511ce8', 'Selsoft', 'Selsoft Inc', 'selsoft', '{}', '{}', '{}', '{}', '{}', NULL, 'active', '2025-09-29 16:48:08.312000+05:30', '2025-09-29 16:48:08.315000+05:30', '2025-12-17 15:30:45.674000+05:30', NULL, NULL, NULL, NULL, NULL, NULL);


-- ============================================
-- Table: users
-- ============================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
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

ALTER TABLE users ADD PRIMARY KEY (id);

-- Data for table: users


INSERT INTO users (id, tenant_id, first_name, last_name, email, password_hash, must_change_password, last_login, role, permissions, department, title, manager_id, status, created_at, updated_at, employee_id, reset_password_token, reset_password_expires, google_id, auth_provider, email_verified, approval_status, approved_by, approved_at, rejection_reason) VALUES ('db4c0bae-6ac6-449b-a55b-9308a6fcdf4d', '3f54ba53-7fb5-4353-a8d7-dd2b2e6ddb57', 'Shunmugavel', 'Subbiah', 'shunmugavel@selsoftinc.com', '$2a$10$c2uQg38AIbSwBJyEDqUR0.jBaBlGUxd41ZQMV/SDGJkik.j2hz53K', FALSE, '2026-01-06 17:06:22.167000+05:30', 'employee', '[]', NULL, NULL, NULL, 'active', '2025-12-08 12:55:27.836000+05:30', '2026-01-06 17:06:22.168000+05:30', NULL, NULL, NULL, NULL, 'local', FALSE, 'approved', NULL, NULL, NULL);
INSERT INTO users (id, tenant_id, first_name, last_name, email, password_hash, must_change_password, last_login, role, permissions, department, title, manager_id, status, created_at, updated_at, employee_id, reset_password_token, reset_password_expires, google_id, auth_provider, email_verified, approval_status, approved_by, approved_at, rejection_reason) VALUES ('e70433fd-c849-4433-b4bd-7588476adfd3', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'Pushban', 'User', 'pushban@selsoftinc.com', '$2a$10$2Y9OhxSLvcFnTH839TJip.3FEEuHS87q8lX2gBO3JskV2KToSeHT.', FALSE, '2026-01-07 08:43:28.786000+05:30', 'admin', '[]', 'Management', 'Administrator', NULL, 'active', '2025-09-29 16:59:28.293000+05:30', '2026-01-07 08:43:28.796000+05:30', NULL, NULL, NULL, NULL, 'local', FALSE, 'approved', NULL, NULL, NULL);
INSERT INTO users (id, tenant_id, first_name, last_name, email, password_hash, must_change_password, last_login, role, permissions, department, title, manager_id, status, created_at, updated_at, employee_id, reset_password_token, reset_password_expires, google_id, auth_provider, email_verified, approval_status, approved_by, approved_at, rejection_reason) VALUES ('2d639e96-2f26-4577-8ce7-2570e5ca0ad0', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'Selvakumar', 'Murugesan', 'selvakumar@selsoftinc.com', '$2a$10$3QEUwcfewei3jzzrcfFLl.nsKwGq1PmboLgBVuMz0cIC7s4XOzfG6', FALSE, '2026-01-06 14:12:12.502000+05:30', 'employee', '["VIEW_DASHBOARD", "VIEW_TIMESHEETS", "CREATE_TIMESHEETS", "EDIT_TIMESHEETS"]', 'Executive', 'CEO', NULL, 'active', '2025-10-03 08:45:29.535000+05:30', '2026-01-06 14:12:12.503000+05:30', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', NULL, NULL, NULL, 'local', FALSE, 'approved', NULL, NULL, NULL);

-- ============================================
-- Table: clients
-- ============================================
DROP TABLE IF EXISTS clients CASCADE;
CREATE TABLE clients (
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

ALTER TABLE clients ADD PRIMARY KEY (id);

-- Data for table: clients
INSERT INTO clients (id, tenant_id, client_name, legal_name, contact_person, email, phone, billing_address, shipping_address, tax_id, payment_terms, hourly_rate, client_type, status, created_at, updated_at) VALUES ('a3889c22-ace2-40f9-9f29-1a1556c0a444', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'c5b97829a854678a98138fd3ee2e2149:6278c8421a06cfb87e4779ba1db602c4:95f6079504e25a6390', 'Cognizant', '8a38e436de53778acd01f43e31631d98:e4f3fa7940ebe1932edb04a5d0a8a1cc:45f73f55902789a4ea', 'a76f8469988be452f8eb8986ce14c4fd:6a453efe3c96a89ac75009a5563d2c07:0b06cac6b3ab50e97896ac8235e50da2b2', 'aa3b8428a483394b1698d699faf66f30:582f9ec3eee23374299cf403021c5bdf:c487da1affd7564319480780', '{"zip": "56666", "city": "", "line1": "", "state": "", "country": "United States"}', '{"zip": "56666", "city": "", "line1": "", "state": "", "country": "United States"}', 'b97329cb0458dc4aedefa17f72a863b1:39d09080e9a2ca21c91f9762f1b17882:8b7e63e9504ea2904f', 30, NULL, 'internal', 'active', '2025-09-30 08:14:04.684000+05:30', '2025-12-22 15:09:31.779000+05:30');
INSERT INTO clients (id, tenant_id, client_name, legal_name, contact_person, email, phone, billing_address, shipping_address, tax_id, payment_terms, hourly_rate, client_type, status, created_at, updated_at) VALUES ('0adcb197-d8b9-4fb9-a78c-4d7eb5b07887', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'de14492b3af1878a6dc8519ae1c8e780:40a7155243160a91b657e68f3f38acc5:99910639e9c59ca1', NULL, 'd1849e5e6cdd40ac4f04171afaf9382d:d5134a5c79a39903bbd0754d8f746c5f:2131e3745658b28bdcf079', 'f90999889d120a1f997426b295b19d59:d6ccbb65a4992cb59e5f1d3d4f5fdb46:f48d2092c5bc337f9cc94f236c7147928932d12a29cc932a', 'cc79a89db22aab105c184e026d24b2fa:62aab588d545e181003cf7ce1cea4ca7:8cddad0c2d69e3f88d9e2535d1', '{"zip": "601401", "city": "Trichy", "line1": "Trichy", "state": "Tamil Nadu", "country": "India"}', '{"zip": "601401", "city": "Trichy", "line1": "Trichy", "state": "Tamil Nadu", "country": "India"}', NULL, 30, NULL, 'external', 'active', '2025-12-23 02:43:09.800000+05:30', '2025-12-23 02:48:51.876000+05:30');
INSERT INTO clients (id, tenant_id, client_name, legal_name, contact_person, email, phone, billing_address, shipping_address, tax_id, payment_terms, hourly_rate, client_type, status, created_at, updated_at) VALUES ('ccbd6497-0a81-405b-90d6-5d9bf1496be4', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'Acme Corporation', 'Acme Corporation Inc.', 'John Smith', 'john.smith@acme.com', '+11555019944', '{"zip": "10001", "city": "New York", "line1": "123 Business St", "state": "NY", "country": "United States"}', '{"zip": "10001", "city": "New York", "line1": "123 Business St", "state": "NY", "country": "United States"}', '123456789', 30, NULL, 'external', 'active', '2025-09-29 17:07:49.185000+05:30', '2026-01-01 11:05:34.945000+05:30');
INSERT INTO clients (id, tenant_id, client_name, legal_name, contact_person, email, phone, billing_address, shipping_address, tax_id, payment_terms, hourly_rate, client_type, status, created_at, updated_at) VALUES ('d117cae4-3504-4f50-9b39-c2118a2269eb', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'aswini traders', NULL, 'kamal s', 'kamal@selsoft.com', '+14454545445', '{"zip": "", "city": "", "line1": "", "state": "", "country": "United States"}', '{"zip": "", "city": "", "line1": "", "state": "", "country": "United States"}', NULL, 30, NULL, 'external', 'active', '2026-01-06 13:18:04.310000+05:30', '2026-01-06 13:18:04.310000+05:30');


-- ============================================
-- Table: vendors
-- ============================================
DROP TABLE IF EXISTS vendors CASCADE;
CREATE TABLE vendors (
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

ALTER TABLE vendors ADD PRIMARY KEY (id);

-- Data for table: vendors
INSERT INTO vendors (id, tenant_id, name, contact_person, email, phone, category, status, total_spent, address, city, state, zip, country, website, payment_terms, contract_start, contract_end, notes, created_at, updated_at) VALUES ('3e355460-ce60-44bc-82a0-882da2533137', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'Hays', 'Kumar s', 'kumar101@hays.com', '(963) 258-7410', 'consultant', 'active', '0.00', 'chennai', 'chennai', 'Tamil Nadu', '600005', 'India', NULL, 'net45', NULL, NULL, NULL, '2025-10-24 14:12:42.307000+05:30', '2026-01-06 12:47:30.734000+05:30');


-- ============================================
-- Table: onboarding_logs
-- ============================================
DROP TABLE IF EXISTS onboarding_logs CASCADE;
CREATE TABLE onboarding_logs (
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

ALTER TABLE onboarding_logs ADD PRIMARY KEY (id);

-- No data in table: onboarding_logs


-- ============================================
-- Table: invoices
-- ============================================
DROP TABLE IF EXISTS invoices CASCADE;
CREATE TABLE invoices (
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

ALTER TABLE invoices ADD PRIMARY KEY (id);

-- Data for table: invoices
INSERT INTO invoices (id, tenant_id, invoice_number, client_id, timesheet_id, invoice_hash, invoice_date, due_date, line_items, subtotal, tax_amount, total_amount, payment_status, payment_date, payment_method, notes, created_by, status, created_at, updated_at, issue_date, employee_id, vendor_id, approved_by, approved_at, company_logo, timesheet_file, timesheet_file_name) VALUES ('0795c151-8f91-4708-bf85-b0a95b3a5096', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'IN-2025-002', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '2e5c56e2-75c3-4f84-ba55-6fc6e34c21f9', 'c7b2be0bd9e1979bc6e9f16124081a86', '2025-11-03', '2025-12-03', '[{"rate": 200, "hours": 20, "amount": 4000, "description": "Timesheet for Selvakumar Murugesan - Sep 29, 2025 - Oct 05, 2025"}]', '8000.00', '0.00', '8000.00', 'pending', NULL, NULL, '', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'active', '2025-11-03 09:53:14.429000+05:30', '2025-11-10 18:06:49.074000+05:30', '2025-11-04 14:55:44.687700+05:30', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', '3e355460-ce60-44bc-82a0-882da2533137', NULL, NULL, NULL, NULL, NULL);
INSERT INTO invoices (id, tenant_id, invoice_number, client_id, timesheet_id, invoice_hash, invoice_date, due_date, line_items, subtotal, tax_amount, total_amount, payment_status, payment_date, payment_method, notes, created_by, status, created_at, updated_at, issue_date, employee_id, vendor_id, approved_by, approved_at, company_logo, timesheet_file, timesheet_file_name) VALUES ('bdcd474c-205a-420f-9dca-9287423ded9f', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'IN-2025-003', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '71b9fc71-644f-44b1-a5b1-57b96b22313f', '3c5ac50195b295c8910f5af51f99a84b', '2025-11-03', '2025-12-03', '[{"rate": 20, "hours": 48.07, "amount": 961.4, "description": "Timesheet for Selvakumar Murugesan - Sep 28, 2025 - Oct 04, 2025"}]', '9614.00', '0.00', '9614.00', 'pending', NULL, NULL, '', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'active', '2025-11-03 12:39:08.695000+05:30', '2025-11-11 13:56:21.752000+05:30', '2025-11-04 14:55:44.687700+05:30', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', '3e355460-ce60-44bc-82a0-882da2533137', NULL, NULL, NULL, NULL, NULL);
INSERT INTO invoices (id, tenant_id, invoice_number, client_id, timesheet_id, invoice_hash, invoice_date, due_date, line_items, subtotal, tax_amount, total_amount, payment_status, payment_date, payment_method, notes, created_by, status, created_at, updated_at, issue_date, employee_id, vendor_id, approved_by, approved_at, company_logo, timesheet_file, timesheet_file_name) VALUES ('8d1ed1be-9aab-4421-9169-c387f375f7c5', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'INV-2025-00005', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '179da1c0-41ec-4d34-829d-cafab199a874', '38ae1d4911c42ed655693ba88bd985cd', '2025-11-04', '2025-12-04', '[{"rate": 200, "hours": 33, "amount": 6600, "description": "Timesheet for Selvakumar Murugesan - Oct 05, 2025 - Oct 11, 2025"}]', '8000.00', '0.00', '6600.00', 'pending', NULL, NULL, '', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'active', '2025-11-04 16:30:43.029000+05:30', '2025-11-13 11:57:36.349000+05:30', '2025-11-04 16:30:43.027000+05:30', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', '3e355460-ce60-44bc-82a0-882da2533137', NULL, NULL, NULL, NULL, NULL);
INSERT INTO invoices (id, tenant_id, invoice_number, client_id, timesheet_id, invoice_hash, invoice_date, due_date, line_items, subtotal, tax_amount, total_amount, payment_status, payment_date, payment_method, notes, created_by, status, created_at, updated_at, issue_date, employee_id, vendor_id, approved_by, approved_at, company_logo, timesheet_file, timesheet_file_name) VALUES ('41ad46fa-98eb-419f-ab3d-c04a1661a208', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'IN-2025-001', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', 'a58d797e-5095-4e91-b6b7-b5a27b4da47b', '222a2e1a8fc201fc03996df6cea65d97', '2025-11-03', '2025-12-03', '[{"rate": 200, "hours": 48.5, "amount": 9700, "description": "Timesheet for Selvakumar Murugesan - Oct 26, 2025 - Nov 01, 2025"}]', '9700.00', '0.00', '9700.00', 'pending', NULL, NULL, '', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'active', '2025-11-03 09:52:07.122000+05:30', '2025-11-12 18:35:21.637000+05:30', '2025-11-04 14:55:44.687700+05:30', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', '3e355460-ce60-44bc-82a0-882da2533137', NULL, NULL, NULL, NULL, NULL);
INSERT INTO invoices (id, tenant_id, invoice_number, client_id, timesheet_id, invoice_hash, invoice_date, due_date, line_items, subtotal, tax_amount, total_amount, payment_status, payment_date, payment_method, notes, created_by, status, created_at, updated_at, issue_date, employee_id, vendor_id, approved_by, approved_at, company_logo, timesheet_file, timesheet_file_name) VALUES ('c2488648-397b-4c1b-bee7-af9e1029b813', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'IN-2025-004', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '04d0911d-bfe5-4424-87fd-67039ca1bd49', 'a67462a03d73bc3d286938a9854997fc', '2025-11-03', '2025-12-03', '[{"rate": 200, "hours": 39, "amount": 7800, "description": "Timesheet for Selvakumar Murugesan - Sep 21, 2025 - Sep 27, 2025"}]', '8000.00', '0.00', '7800.00', 'pending', NULL, NULL, '', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'active', '2025-11-03 12:49:48.622000+05:30', '2025-11-13 03:49:38.846000+05:30', '2025-11-04 14:55:44.687700+05:30', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', '3e355460-ce60-44bc-82a0-882da2533137', NULL, NULL, NULL, NULL, NULL);
INSERT INTO invoices (id, tenant_id, invoice_number, client_id, timesheet_id, invoice_hash, invoice_date, due_date, line_items, subtotal, tax_amount, total_amount, payment_status, payment_date, payment_method, notes, created_by, status, created_at, updated_at, issue_date, employee_id, vendor_id, approved_by, approved_at, company_logo, timesheet_file, timesheet_file_name) VALUES ('9a3f5127-0a43-4863-8cd8-eb3381614b60', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'INV-2026-00040', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', 'd12224ea-a73a-4722-9cf0-9d9910ea6fd5', 'a654a6b7c5ce78738037717bcbd0be64', '2026-01-06', '2026-02-05', '[{"rate": 200, "hours": 53.98, "amount": 10796, "description": "Timesheet for Selvakumar Murugesan - Dec 21, 2025 - Dec 27, 2025"}]', '10796.00', '0.00', '10796.00', 'pending', NULL, NULL, NULL, 'e70433fd-c849-4433-b4bd-7588476adfd3', 'active', '2026-01-06 13:13:59.405000+05:30', '2026-01-06 13:13:59.405000+05:30', '2026-01-06 13:13:59.405000+05:30', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', '1f820e96-c6d8-4343-b8ea-aed6c03e7519', NULL, NULL, NULL, NULL, NULL);
INSERT INTO invoices (id, tenant_id, invoice_number, client_id, timesheet_id, invoice_hash, invoice_date, due_date, line_items, subtotal, tax_amount, total_amount, payment_status, payment_date, payment_method, notes, created_by, status, created_at, updated_at, issue_date, employee_id, vendor_id, approved_by, approved_at, company_logo, timesheet_file, timesheet_file_name) VALUES ('4101e67a-e7f9-43d1-a018-07e999946659', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'INV-2026-00041', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '3654bfda-c1a3-425f-ac74-51bebd29c003', 'e58c5de0e97fd0f02251788cd6fa96fb', '2026-01-06', '2026-02-05', '[{"rate": 200, "hours": 58.35, "amount": 11670, "description": "Timesheet for Selvakumar Murugesan - Dec 07, 2025 - Dec 13, 2025"}]', '11670.00', '0.00', '11670.00', 'pending', NULL, NULL, NULL, 'e70433fd-c849-4433-b4bd-7588476adfd3', 'active', '2026-01-06 14:58:39.223000+05:30', '2026-01-06 14:58:39.223000+05:30', '2026-01-06 14:58:39.222000+05:30', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', '1f820e96-c6d8-4343-b8ea-aed6c03e7519', NULL, NULL, NULL, NULL, NULL);


-- ============================================
-- Table: timesheets
-- ============================================
DROP TABLE IF EXISTS timesheets CASCADE;
CREATE TABLE timesheets (
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

ALTER TABLE timesheets ADD PRIMARY KEY (id);

-- Data for table: timesheets
INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start, week_end, daily_hours, total_hours, status, created_at, updated_at, notes, attachments, submitted_at, approved_at, reviewer_id, approved_by, rejection_reason, time_entries, overtime_comment, overtime_days, employee_name) VALUES ('2e5c56e2-75c3-4f84-ba55-6fc6e34c21f9', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '2025-09-29', '2025-10-05', '{"fri": 8, "mon": 8, "sat": 0, "sun": 0, "thu": 8, "tue": 8, "wed": 8}', '40.00', 'approved', '2025-10-06 11:51:28.544000+05:30', '2025-10-07 11:09:36.029000+05:30', 'Worked on TimePulse timesheet approval feature implementation', '[]', '2025-10-06 06:21:28.543000', '2025-10-07 05:05:18.069000', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', NULL, '[]', NULL, NULL, 'Selvakumar Murugesan');
INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start, week_end, daily_hours, total_hours, status, created_at, updated_at, notes, attachments, submitted_at, approved_at, reviewer_id, approved_by, rejection_reason, time_entries, overtime_comment, overtime_days, employee_name) VALUES ('a58d797e-5095-4e91-b6b7-b5a27b4da47b', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '2025-10-26', '2025-11-01', '{"fri": 6.78, "mon": 5.78, "sat": 5.54, "sun": 7.63, "thu": 8.56, "tue": 8.56, "wed": 5.65}', '48.50', 'approved', '2025-10-29 11:48:47.632000+05:30', '2025-10-31 08:05:28.448000+05:30', 'Extracted from AquaLogic_BS68111_20251201.png: Employee: Neha Menon, Client: AquaLogic, Project: Week, Total Hours: 48.5

[AI Extracted Data]
Confidence: 95%
Source: python_engine
Extracted: 31/10/2025, 08:04:08', '[]', '2025-10-31 02:34:26.778000', '2025-10-31 02:35:28.448000', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', NULL, '[]', NULL, NULL, 'Selvakumar Murugesan');
INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start, week_end, daily_hours, total_hours, status, created_at, updated_at, notes, attachments, submitted_at, approved_at, reviewer_id, approved_by, rejection_reason, time_entries, overtime_comment, overtime_days, employee_name) VALUES ('71b9fc71-644f-44b1-a5b1-57b96b22313f', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '2025-09-28', '2025-10-04', '{"fri": 5.99, "mon": 5.8, "sat": 7.84, "sun": 7.12, "thu": 8.1, "tue": 6.93, "wed": 6.29}', '48.07', 'approved', '2025-10-09 15:01:52.718000+05:30', '2025-10-31 08:31:54.433000+05:30', 'Extracted from BlueSkyITSolutions_CV29797_20250818.png: Employee: Neha Das, Client: BlueSky IT Solutions, Project: Week: 18-Aug-2025 to 24-Aug-2025, Total Hours: 48.07

[AI Extracted Data]
Confidence: 95%
Source: python_engine
Extracted: 29/10/2025, 16:18:37', '[]', '2025-10-29 10:48:46.204000', '2025-10-31 03:01:54.432000', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', NULL, '[]', NULL, NULL, 'Selvakumar Murugesan');
INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start, week_end, daily_hours, total_hours, status, created_at, updated_at, notes, attachments, submitted_at, approved_at, reviewer_id, approved_by, rejection_reason, time_entries, overtime_comment, overtime_days, employee_name) VALUES ('179da1c0-41ec-4d34-829d-cafab199a874', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '2025-10-05', '2025-10-11', '{"fri": 8, "mon": 8, "sat": 0, "sun": 0, "thu": 8, "tue": 8, "wed": 8}', '40.00', 'approved', '2025-10-07 14:30:39.371000+05:30', '2025-10-10 15:10:38.153000+05:30', 'Extracted from TimeSheet.jpeg: Employee: Raj Sl, Client: , Project: Manager, Total Hours: 40

[AI Extracted Data]
Confidence: 100%
Source: unknown
Extracted: 09/10/2025, 15:15:23', '[]', '2025-10-10 04:27:27.001000', '2025-10-10 09:40:38.152000', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'The TimeSheet has mock data', '[]', NULL, NULL, 'Selvakumar Murugesan');
INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start, week_end, daily_hours, total_hours, status, created_at, updated_at, notes, attachments, submitted_at, approved_at, reviewer_id, approved_by, rejection_reason, time_entries, overtime_comment, overtime_days, employee_name) VALUES ('04d0911d-bfe5-4424-87fd-67039ca1bd49', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '2025-09-21', '2025-09-27', '{"fri": 8, "mon": 8, "sat": 0, "sun": 0, "thu": 8, "tue": 8, "wed": 8}', '40.00', 'approved', '2025-10-07 16:46:57.677000+05:30', '2025-10-07 16:59:04.525000+05:30', '', '[]', '2025-10-07 11:16:57.676000', '2025-10-07 11:29:04.525000', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', NULL, '[]', NULL, NULL, 'Selvakumar Murugesan');
INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start, week_end, daily_hours, total_hours, status, created_at, updated_at, notes, attachments, submitted_at, approved_at, reviewer_id, approved_by, rejection_reason, time_entries, overtime_comment, overtime_days, employee_name) VALUES ('d14052d2-8def-4a2c-b642-385fc23e2425', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '96fe6af0-7e3e-4cb5-bfdc-e707a203c7bf', 'ccbd6497-0a81-405b-90d6-5d9bf1496be4', '2025-10-12', '2025-10-18', '{"fri": 8, "mon": 8, "sat": 0, "sun": 0, "thu": 8, "tue": 8, "wed": 8}', '40.00', 'approved', '2025-10-13 16:46:51.961000+05:30', '2025-10-30 15:19:29.413000+05:30', 'Extracted from TimeSheet.jpeg: Employee: Raj Sl, Client: , Project: Manager, Total Hours: 40


[AI Extracted Data]
Confidence: 90%
Source: unknown
Extracted: 13/10/2025, 12:48:10', '[]', '2025-10-13 07:18:55.377000', '2025-10-15 04:22:43.135000', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'Check the time sheet data.', '[]', NULL, NULL, 'Selvakumar Murugesan');
INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start, week_end, daily_hours, total_hours, status, created_at, updated_at, notes, attachments, submitted_at, approved_at, reviewer_id, approved_by, rejection_reason, time_entries, overtime_comment, overtime_days, employee_name) VALUES ('fbe1d2d1-d89d-4e30-b303-4328eca20a3e', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', 'a3889c22-ace2-40f9-9f29-1a1556c0a444', '2025-09-07', '2025-09-13', '{"fri": 8, "mon": 8, "sat": 0, "sun": 0, "thu": 8, "tue": 8, "wed": 8}', '40.00', 'approved', '2025-10-08 07:56:08.242000+05:30', '2025-11-07 09:22:45.254000+05:30', 'Extracted from TimeSheet.jpeg: Employee: Raj Sl, Client: Cognizant, Project: MSRaj Sl Ao, Total Hours: 40', '[]', '2025-10-10 04:28:15.373000', '2025-11-07 03:52:45.253000', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', NULL, '[]', NULL, NULL, 'Selvakumar Murugesan');
INSERT INTO timesheets (id, tenant_id, employee_id, client_id, week_start, week_end, daily_hours, total_hours, status, created_at, updated_at, notes, attachments, submitted_at, approved_at, reviewer_id, approved_by, rejection_reason, time_entries, overtime_comment, overtime_days, employee_name) VALUES ('492890fd-113e-42d6-9f71-b8ac2ba94b0a', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '96fe6af0-7e3e-4cb5-bfdc-e707a203c7bf', 'ccbd6497-0a81-405b-90d6-5d9bf1496be4', '2025-09-28', '2025-10-04', '{"fri": 7.34, "mon": 8.27, "sat": 9.3, "sun": 8.34, "thu": 7.21, "tue": 5.91, "wed": 8.66}', '55.03', 'approved', '2025-10-30 15:16:50.817000+05:30', '2025-11-13 03:52:08.843000+05:30', 'Extracted from AquaLogic_IP45237_20250616.jpg: Employee: Kamal Das, Client: AquaLogic, Project: Week: 16-Jun-2025 to 22-Jun-2025, Total Hours: 55.03


[AI Extracted Data]
Confidence: 95%
Source: python_engine
Extracted: 30/12/2025, 11:02:27', '[]', '2025-12-30 05:32:40.857000', '2025-12-30 05:33:36.459000', 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', NULL, '[]', 'aws
', '[{"day": "Saturday", "hours": "6.70", "isHoliday": false, "isWeekend": true}, {"day": "Sunday", "hours": "7.57", "isHoliday": false, "isWeekend": true}, {"day": "Monday", "hours": "8.60", "isHoliday": false, "isWeekend": false}, {"day": "Wednesday", "hours": "8.59", "isHoliday": false, "isWeekend": false}]', NULL);


-- ============================================
-- Table: employees
-- ============================================
DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE employees (
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

ALTER TABLE employees ADD PRIMARY KEY (id);

-- Data for table: employees
INSERT INTO employees (id, tenant_id, user_id, employee_id, first_name, last_name, email, phone, department, title, manager_id, start_date, end_date, hourly_rate, salary_amount, salary_type, contact_info, status, created_at, updated_at, client_id, vendor_id, impl_partner_id, employment_type_id, approver_id) VALUES ('5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '2d639e96-2f26-4577-8ce7-2570e5ca0ad0', '100', 'Selvakumar', 'Murugesan', 'selvakumar@selsoftinc.com', NULL, 'Executive', 'CEO', NULL, '2025-10-03', NULL, '200.00', '0.00', 'hourly', '{}', 'active', '2025-10-03 08:45:29.606000+05:30', '2025-12-29 12:43:56.718000+05:30', NULL, '1f820e96-c6d8-4343-b8ea-aed6c03e7519', NULL, NULL, NULL);
INSERT INTO employees (id, tenant_id, user_id, employee_id, first_name, last_name, email, phone, department, title, manager_id, start_date, end_date, hourly_rate, salary_amount, salary_type, contact_info, status, created_at, updated_at, client_id, vendor_id, impl_partner_id, employment_type_id, approver_id) VALUES ('2d639e96-2f26-4577-8ce7-2570e5ca0ad0', '5eda5596-b1d9-4963-953d-7af9d0511ce8', NULL, NULL, 'Selvakumar', 'Murugesan', 'selvakumar@selsoftinc.com', 'N/A', 'N/A', NULL, NULL, NULL, NULL, '10.00', '0.00', 'hourly', '"{\"address\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"country\":\"United States\"}"', 'active', '2025-11-21 15:05:23.840000+05:30', '2026-01-06 13:10:40.851000+05:30', NULL, '3e355460-ce60-44bc-82a0-882da2533137', NULL, NULL, NULL);


-- ============================================
-- Table: leave_balances
-- ============================================
DROP TABLE IF EXISTS leave_balances CASCADE;
CREATE TABLE leave_balances (
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

ALTER TABLE leave_balances ADD PRIMARY KEY (id);


-- ============================================
-- Table: leave_requests
-- ============================================
DROP TABLE IF EXISTS leave_requests CASCADE;
CREATE TABLE leave_requests (
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

ALTER TABLE leave_requests ADD PRIMARY KEY (id);

-- Data for table: leave_requests
INSERT INTO leave_requests (id, employee_id, tenant_id, leave_type, start_date, end_date, total_days, reason, status, attachment_url, attachment_name, approver_id, reviewed_by, reviewed_at, review_comments, created_at, updated_at) VALUES ('9c7f91bc-92b9-4711-8e18-d9c44b6e4d0d', '2d639e96-2f26-4577-8ce7-2570e5ca0ad0', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'casual', '2026-01-07', '2026-01-09', '3.00', NULL, 'approved', NULL, NULL, 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', '2026-01-06 11:20:50.794000+05:30', NULL, '2026-01-06 11:19:49.819000+05:30', '2026-01-06 23:03:50.671629+05:30');
INSERT INTO leave_requests (id, employee_id, tenant_id, leave_type, start_date, end_date, total_days, reason, status, attachment_url, attachment_name, approver_id, reviewed_by, reviewed_at, review_comments, created_at, updated_at) VALUES ('7f9357df-e768-47e0-905c-2b1395e6e57d', '2d639e96-2f26-4577-8ce7-2570e5ca0ad0', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'casual', '2026-01-19', '2026-01-21', '3.00', NULL, 'approved', NULL, NULL, 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', '2026-01-07 00:21:18.867000+05:30', NULL, '2026-01-06 13:56:53.431000+05:30', '2026-01-07 00:21:18.867000+05:30');
INSERT INTO leave_requests (id, employee_id, tenant_id, leave_type, start_date, end_date, total_days, reason, status, attachment_url, attachment_name, approver_id, reviewed_by, reviewed_at, review_comments, created_at, updated_at) VALUES ('3a3b696f-2879-4ba2-a6c8-69825669b7af', '2d639e96-2f26-4577-8ce7-2570e5ca0ad0', '5eda5596-b1d9-4963-953d-7af9d0511ce8', 'casual', '2026-01-12', '2026-01-13', '2.00', NULL, 'rejected', NULL, NULL, 'e70433fd-c849-4433-b4bd-7588476adfd3', 'e70433fd-c849-4433-b4bd-7588476adfd3', '2026-01-07 00:21:30.734000+05:30', 'not valid', '2026-01-06 13:08:25.626000+05:30', '2026-01-07 00:21:30.734000+05:30');


-- ============================================
-- Table: implementation_partners
-- ============================================
DROP TABLE IF EXISTS implementation_partners CASCADE;
CREATE TABLE implementation_partners (
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

ALTER TABLE implementation_partners ADD PRIMARY KEY (id);

-- Data for table: implementation_partners
INSERT INTO implementation_partners (id, tenant_id, name, legal_name, contact_person, email, phone, address, category, specialization, status, notes, created_at, updated_at) VALUES ('2a538fb6-8e70-4a10-ba26-970cd877b13c', '5eda5596-b1d9-4963-953d-7af9d0511ce8', '3e30da5dce0feda26d4179dc0006fe9b:0f36862efa07f9f8a9d7989f9ea28f58:92ba79858e3f28752e585f9658', 'c17c184287e3c753d26ff10cf2cb48cc:96a382c83bbc61b765871516a3ddb213:99', '321e467329b5d80a0f5d608c599bd762:ef9db8d614ae89530b937e0dc3d81556:d5f0c2252e2f52', 'a9072dded76d5ca8040c6e7bab653fee:7339ed4d8bbd4f30d5120dc16e9b62c7:fecfaa378a04f0b9f8399788f537b7e170979131', '18d1e58a0798dd3da66123676cc64abc:577368e7bc81ad369b8937b1c5e76910:c394f5abb150559e56c7776e51', '{"zip": "600005", "city": "chennai", "state": "Tamil Nadu", "street": "chennai", "country": "India"}', 'implementation_partner', '', 'active', '', '2025-12-18 17:22:17.300000+05:30', '2026-01-06 13:19:03.933000+05:30');


-- ============================================
-- Table: account_requests
-- ============================================
DROP TABLE IF EXISTS account_requests CASCADE;
CREATE TABLE account_requests (
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

ALTER TABLE account_requests ADD PRIMARY KEY (id);

-- Data for table: account_requests


-- ============================================
-- Foreign Key Constraints
-- ============================================

ALTER TABLE users ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE users ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users(id);
ALTER TABLE employees ADD CONSTRAINT employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE employees ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE employees ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES employees(id);
ALTER TABLE clients ADD CONSTRAINT clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE onboarding_logs ADD CONSTRAINT onboarding_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE vendors ADD CONSTRAINT vendors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE timesheets ADD CONSTRAINT timesheets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE timesheets ADD CONSTRAINT timesheets_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE timesheets ADD CONSTRAINT timesheets_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE employees ADD CONSTRAINT employees_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE timesheets ADD CONSTRAINT timesheets_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES users(id);
ALTER TABLE timesheets ADD CONSTRAINT timesheets_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE users ADD CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE leave_balances ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE leave_balances ADD CONSTRAINT leave_balances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES users(id);
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id);
ALTER TABLE implementation_partners ADD CONSTRAINT implementation_partners_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE employees ADD CONSTRAINT employees_impl_partner_id_fkey FOREIGN KEY (impl_partner_id) REFERENCES implementation_partners(id);
ALTER TABLE employment_types ADD CONSTRAINT employment_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE notifications ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_timesheet_id_fkey FOREIGN KEY (timesheet_id) REFERENCES timesheets(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE employees ADD CONSTRAINT employees_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES users(id);
ALTER TABLE account_requests ADD CONSTRAINT account_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE account_requests ADD CONSTRAINT account_requests_requested_approver_id_fkey FOREIGN KEY (requested_approver_id) REFERENCES users(id);
ALTER TABLE account_requests ADD CONSTRAINT account_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE account_requests ADD CONSTRAINT account_requests_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES users(id);
ALTER TABLE account_requests ADD CONSTRAINT account_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);