--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_clients_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_clients_status AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.enum_clients_status OWNER TO postgres;

--
-- Name: enum_employees_salary_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employees_salary_type AS ENUM (
    'hourly',
    'salary',
    'contract'
);


ALTER TYPE public.enum_employees_salary_type OWNER TO postgres;

--
-- Name: enum_employees_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employees_status AS ENUM (
    'active',
    'inactive',
    'terminated'
);


ALTER TYPE public.enum_employees_status OWNER TO postgres;

--
-- Name: enum_onboarding_logs_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_onboarding_logs_status AS ENUM (
    'in_progress',
    'completed',
    'failed'
);


ALTER TYPE public.enum_onboarding_logs_status OWNER TO postgres;

--
-- Name: enum_tenants_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_tenants_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE public.enum_tenants_status OWNER TO postgres;

--
-- Name: enum_timesheets_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_timesheets_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected'
);


ALTER TYPE public.enum_timesheets_status OWNER TO postgres;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_role AS ENUM (
    'admin',
    'manager',
    'approver',
    'employee',
    'accountant',
    'hr'
);


ALTER TYPE public.enum_users_role OWNER TO postgres;

--
-- Name: enum_users_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE public.enum_users_status OWNER TO postgres;

--
-- Name: enum_vendors_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_vendors_status AS ENUM (
    'active',
    'inactive',
    'pending'
);


ALTER TYPE public.enum_vendors_status OWNER TO postgres;

--
-- Name: update_notifications_updated_at(); Type: FUNCTION; Schema: public; Owner: selva
--

CREATE FUNCTION public.update_notifications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_notifications_updated_at() OWNER TO selva;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    client_name character varying(255) NOT NULL,
    legal_name character varying(255),
    contact_person character varying(255),
    email character varying(255),
    phone character varying(50),
    billing_address jsonb DEFAULT '{}'::jsonb,
    shipping_address jsonb DEFAULT '{}'::jsonb,
    tax_id character varying(50),
    payment_terms integer DEFAULT 30,
    hourly_rate numeric(10,2) DEFAULT 0,
    client_type character varying(20) DEFAULT 'external'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT clients_client_type_check CHECK (((client_type)::text = ANY ((ARRAY['internal'::character varying, 'external'::character varying])::text[]))),
    CONSTRAINT clients_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    employee_id character varying(50),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    department character varying(100),
    title character varying(100),
    manager_id uuid,
    start_date date,
    end_date date,
    hourly_rate numeric(10,2) DEFAULT 0,
    salary_amount numeric(12,2) DEFAULT 0,
    salary_type character varying(20) DEFAULT 'hourly'::character varying,
    contact_info jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(20),
    client_id uuid,
    vendor_id uuid,
    impl_partner_id uuid,
    employment_type_id uuid,
    CONSTRAINT employees_salary_type_check CHECK (((salary_type)::text = ANY ((ARRAY['hourly'::character varying, 'salary'::character varying, 'contract'::character varying])::text[]))),
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'terminated'::character varying])::text[])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employment_types; Type: TABLE; Schema: public; Owner: selva
--

CREATE TABLE public.employment_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employment_types OWNER TO selva;

--
-- Name: implementation_partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.implementation_partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    legal_name character varying(255),
    contact_person character varying(255),
    email character varying(255),
    phone character varying(20),
    address jsonb DEFAULT '{}'::jsonb,
    category character varying(50) DEFAULT 'implementation_partner'::character varying,
    specialization character varying(255),
    status character varying(20) DEFAULT 'active'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT implementation_partners_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.implementation_partners OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    client_id uuid NOT NULL,
    invoice_number character varying(100) NOT NULL,
    invoice_date date NOT NULL,
    due_date date NOT NULL,
    line_items jsonb DEFAULT '[]'::jsonb,
    subtotal numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) DEFAULT 0,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    payment_date date,
    payment_method character varying(50),
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    CONSTRAINT invoices_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'deleted'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    year integer NOT NULL,
    leave_type character varying(20) NOT NULL,
    total_days numeric(5,2) DEFAULT 0 NOT NULL,
    used_days numeric(5,2) DEFAULT 0 NOT NULL,
    pending_days numeric(5,2) DEFAULT 0 NOT NULL,
    carry_forward_days numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT leave_balances_leave_type_check CHECK (((leave_type)::text = ANY ((ARRAY['vacation'::character varying, 'sick'::character varying, 'personal'::character varying, 'unpaid'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.leave_balances OWNER TO postgres;

--
-- Name: TABLE leave_balances; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leave_balances IS 'Stores employee leave balances by year and type';


--
-- Name: COLUMN leave_balances.year; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_balances.year IS 'Year for which this balance applies';


--
-- Name: COLUMN leave_balances.total_days; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_balances.total_days IS 'Total days allocated for this leave type';


--
-- Name: COLUMN leave_balances.used_days; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_balances.used_days IS 'Days already used (approved leaves)';


--
-- Name: COLUMN leave_balances.pending_days; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_balances.pending_days IS 'Days in pending leave requests';


--
-- Name: COLUMN leave_balances.carry_forward_days; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_balances.carry_forward_days IS 'Days carried forward from previous year';


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    leave_type character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days numeric(5,2) NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attachment_url character varying(500),
    attachment_name character varying(255),
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    review_comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    approver_id uuid,
    CONSTRAINT leave_requests_leave_type_check CHECK (((leave_type)::text = ANY ((ARRAY['vacation'::character varying, 'sick'::character varying, 'personal'::character varying, 'unpaid'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT leave_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: TABLE leave_requests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leave_requests IS 'Stores employee leave requests';


--
-- Name: COLUMN leave_requests.leave_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_requests.leave_type IS 'Type of leave: vacation, sick, personal, unpaid, other';


--
-- Name: COLUMN leave_requests.total_days; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_requests.total_days IS 'Total number of days (can be fractional for half days)';


--
-- Name: COLUMN leave_requests.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_requests.status IS 'Current status: pending, approved, rejected, cancelled';


--
-- Name: COLUMN leave_requests.reviewed_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_requests.reviewed_by IS 'User ID who approved/rejected the request';


--
-- Name: COLUMN leave_requests.review_comments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_requests.review_comments IS 'Comments from reviewer (especially for rejections)';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: selva
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    action_url character varying(500),
    metadata jsonb
);


ALTER TABLE public.notifications OWNER TO selva;

--
-- Name: onboarding_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    source_file character varying(255),
    onboarding_data jsonb DEFAULT '{}'::jsonb,
    users_created integer DEFAULT 0,
    employees_created integer DEFAULT 0,
    clients_created integer DEFAULT 0,
    status character varying(20) DEFAULT 'completed'::character varying,
    error_message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT onboarding_logs_status_check CHECK (((status)::text = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.onboarding_logs OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    client_id uuid NOT NULL,
    project_name character varying(255) NOT NULL,
    description text,
    project_code character varying(50),
    start_date date,
    end_date date,
    estimated_hours integer,
    hourly_rate numeric(10,2),
    budget numeric(12,2),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT projects_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'on_hold'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_name character varying(255) NOT NULL,
    legal_name character varying(255) NOT NULL,
    subdomain character varying(100) NOT NULL,
    contact_address jsonb DEFAULT '{}'::jsonb,
    invoice_address jsonb DEFAULT '{}'::jsonb,
    contact_info jsonb DEFAULT '{}'::jsonb,
    tax_info jsonb DEFAULT '{}'::jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    onboarded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    logo text,
    stripe_customer_id character varying(100),
    stripe_subscription_id character varying(100),
    plan character varying(30),
    billing_interval character varying(10),
    seat_limit integer,
    current_period_end timestamp with time zone,
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[])))
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: COLUMN tenants.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tenants.status IS 'Subscription status (active, past_due, cancelled, inactive)';


--
-- Name: COLUMN tenants.stripe_customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tenants.stripe_customer_id IS 'Stripe customer ID for billing management';


--
-- Name: COLUMN tenants.stripe_subscription_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tenants.stripe_subscription_id IS 'Stripe subscription ID for plan management';


--
-- Name: COLUMN tenants.plan; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tenants.plan IS 'Current subscription plan (starter, professional, enterprise)';


--
-- Name: COLUMN tenants.billing_interval; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tenants.billing_interval IS 'Billing interval (monthly, annual)';


--
-- Name: COLUMN tenants.seat_limit; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tenants.seat_limit IS 'Maximum number of seats/users allowed';


--
-- Name: COLUMN tenants.current_period_end; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tenants.current_period_end IS 'End date of current billing period';


--
-- Name: timesheets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timesheets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    project_id uuid,
    week_start_date date NOT NULL,
    week_end_date date NOT NULL,
    time_entries jsonb DEFAULT '[]'::jsonb,
    total_hours numeric(5,2) DEFAULT 0,
    status character varying(20) DEFAULT 'draft'::character varying,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    approved_by uuid,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    client_id uuid,
    CONSTRAINT timesheets_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying, 'deleted'::character varying])::text[])))
);


ALTER TABLE public.timesheets OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    must_change_password boolean DEFAULT true,
    last_login timestamp with time zone,
    role character varying(50) DEFAULT 'employee'::character varying NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb,
    department character varying(100),
    title character varying(100),
    manager_id uuid,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'employee'::character varying, 'accountant'::character varying, 'hr'::character varying, 'approver'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    contact_person character varying(255),
    email character varying(255),
    phone character varying(50),
    category character varying(100),
    status character varying(20) DEFAULT 'active'::character varying,
    total_spent numeric(12,2) DEFAULT 0,
    address character varying(255),
    city character varying(100),
    state character varying(100),
    zip character varying(20),
    country character varying(100),
    website character varying(255),
    payment_terms character varying(50),
    contract_start date,
    contract_end date,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendors_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_tenant_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_tenant_id_employee_id_key UNIQUE (tenant_id, employee_id);


--
-- Name: employment_types employment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: selva
--

ALTER TABLE ONLY public.employment_types
    ADD CONSTRAINT employment_types_pkey PRIMARY KEY (id);


--
-- Name: employment_types employment_types_tenant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: selva
--

ALTER TABLE ONLY public.employment_types
    ADD CONSTRAINT employment_types_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: implementation_partners implementation_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.implementation_partners
    ADD CONSTRAINT implementation_partners_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_tenant_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_invoice_number_key UNIQUE (tenant_id, invoice_number);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: selva
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: onboarding_logs onboarding_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_logs
    ADD CONSTRAINT onboarding_logs_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);


--
-- Name: tenants tenants_subdomain_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_subdomain_key1 UNIQUE (subdomain);


--
-- Name: tenants tenants_subdomain_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_subdomain_key2 UNIQUE (subdomain);


--
-- Name: tenants tenants_tenant_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_tenant_name_key UNIQUE (tenant_name);


--
-- Name: tenants tenants_tenant_name_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_tenant_name_key1 UNIQUE (tenant_name);


--
-- Name: tenants tenants_tenant_name_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_tenant_name_key2 UNIQUE (tenant_name);


--
-- Name: timesheets timesheets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_pkey PRIMARY KEY (id);


--
-- Name: timesheets timesheets_tenant_id_employee_id_week_start_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_tenant_id_employee_id_week_start_date_key UNIQUE (tenant_id, employee_id, week_start_date);


--
-- Name: leave_balances unique_employee_year_leave_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT unique_employee_year_leave_type UNIQUE (employee_id, tenant_id, year, leave_type);


--
-- Name: implementation_partners unique_tenant_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.implementation_partners
    ADD CONSTRAINT unique_tenant_name UNIQUE (tenant_id, name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_tenant_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: employees_tenant_id_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX employees_tenant_id_employee_id ON public.employees USING btree (tenant_id, employee_id) WHERE (employee_id IS NOT NULL);


--
-- Name: idx_clients_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_tenant_id ON public.clients USING btree (tenant_id);


--
-- Name: idx_employees_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_client_id ON public.employees USING btree (client_id);


--
-- Name: idx_employees_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_email ON public.employees USING btree (tenant_id, email);


--
-- Name: idx_employees_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_employee_id ON public.employees USING btree (tenant_id, employee_id);


--
-- Name: idx_employees_employment_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_employment_type_id ON public.employees USING btree (employment_type_id);


--
-- Name: idx_employees_impl_partner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_impl_partner_id ON public.employees USING btree (impl_partner_id);


--
-- Name: idx_employees_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_tenant_id ON public.employees USING btree (tenant_id);


--
-- Name: idx_employees_vendor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_vendor_id ON public.employees USING btree (vendor_id);


--
-- Name: idx_employment_types_tenant_id; Type: INDEX; Schema: public; Owner: selva
--

CREATE INDEX idx_employment_types_tenant_id ON public.employment_types USING btree (tenant_id);


--
-- Name: idx_implementation_partners_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_implementation_partners_tenant_status ON public.implementation_partners USING btree (tenant_id, status);


--
-- Name: idx_invoices_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_client ON public.invoices USING btree (client_id);


--
-- Name: idx_invoices_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_date ON public.invoices USING btree (tenant_id, invoice_date);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (tenant_id, payment_status);


--
-- Name: idx_invoices_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_tenant_id ON public.invoices USING btree (tenant_id);


--
-- Name: idx_leave_balances_employee_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_balances_employee_tenant ON public.leave_balances USING btree (employee_id, tenant_id);


--
-- Name: idx_leave_balances_tenant_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_balances_tenant_year ON public.leave_balances USING btree (tenant_id, year);


--
-- Name: idx_leave_requests_approver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_approver_id ON public.leave_requests USING btree (approver_id);


--
-- Name: idx_leave_requests_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_dates ON public.leave_requests USING btree (start_date, end_date);


--
-- Name: idx_leave_requests_employee_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_employee_tenant ON public.leave_requests USING btree (employee_id, tenant_id);


--
-- Name: idx_leave_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_status ON public.leave_requests USING btree (status);


--
-- Name: idx_leave_requests_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_tenant_status ON public.leave_requests USING btree (tenant_id, status);


--
-- Name: idx_notifications_category; Type: INDEX; Schema: public; Owner: selva
--

CREATE INDEX idx_notifications_category ON public.notifications USING btree (category);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: selva
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_priority; Type: INDEX; Schema: public; Owner: selva
--

CREATE INDEX idx_notifications_priority ON public.notifications USING btree (priority);


--
-- Name: idx_notifications_read_at; Type: INDEX; Schema: public; Owner: selva
--

CREATE INDEX idx_notifications_read_at ON public.notifications USING btree (read_at);


--
-- Name: idx_notifications_tenant_id; Type: INDEX; Schema: public; Owner: selva
--

CREATE INDEX idx_notifications_tenant_id ON public.notifications USING btree (tenant_id);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: selva
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: selva
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_projects_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_tenant_id ON public.projects USING btree (tenant_id);


--
-- Name: idx_tenants_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenants_status ON public.tenants USING btree (status);


--
-- Name: idx_tenants_stripe_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenants_stripe_customer_id ON public.tenants USING btree (stripe_customer_id);


--
-- Name: idx_tenants_stripe_subscription_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenants_stripe_subscription_id ON public.tenants USING btree (stripe_subscription_id);


--
-- Name: idx_timesheets_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_timesheets_client_id ON public.timesheets USING btree (client_id);


--
-- Name: idx_timesheets_employee_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_timesheets_employee_week ON public.timesheets USING btree (employee_id, week_start_date);


--
-- Name: idx_timesheets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_timesheets_status ON public.timesheets USING btree (tenant_id, status);


--
-- Name: idx_timesheets_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_timesheets_tenant_id ON public.timesheets USING btree (tenant_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_tenant_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_tenant_email ON public.users USING btree (tenant_id, email);


--
-- Name: idx_users_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: idx_vendors_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_name ON public.vendors USING btree (tenant_id, name);


--
-- Name: idx_vendors_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_status ON public.vendors USING btree (tenant_id, status);


--
-- Name: idx_vendors_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_tenant_id ON public.vendors USING btree (tenant_id);


--
-- Name: users_tenant_id_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_tenant_id_email ON public.users USING btree (tenant_id, email);


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: employees update_employees_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notifications update_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: selva
--

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_notifications_updated_at();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: timesheets update_timesheets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendors update_vendors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients clients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employees employees_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: employees employees_employment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employment_type_id_fkey FOREIGN KEY (employment_type_id) REFERENCES public.employment_types(id);


--
-- Name: employees employees_impl_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_impl_partner_id_fkey FOREIGN KEY (impl_partner_id) REFERENCES public.implementation_partners(id) ON DELETE SET NULL;


--
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id);


--
-- Name: employees employees_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: employees employees_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- Name: employment_types employment_types_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: selva
--

ALTER TABLE ONLY public.employment_types
    ADD CONSTRAINT employment_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: implementation_partners implementation_partners_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.implementation_partners
    ADD CONSTRAINT implementation_partners_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: leave_balances leave_balances_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: leave_requests leave_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: selva
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: selva
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: onboarding_logs onboarding_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_logs
    ADD CONSTRAINT onboarding_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: projects projects_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: timesheets timesheets_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: timesheets timesheets_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: timesheets timesheets_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: timesheets timesheets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: timesheets timesheets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheets
    ADD CONSTRAINT timesheets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: timesheets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

