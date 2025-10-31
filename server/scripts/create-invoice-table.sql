-- Create invoices table with all required columns
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    tenant_id uuid NOT NULL,
    invoice_number character varying(100) NOT NULL,
    client_id uuid,
    timesheet_id uuid,
    invoice_hash character varying(255),
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
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoices_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'deleted'::character varying])::text[])))
);

-- Add foreign key constraints
ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_timesheet_id_fkey FOREIGN KEY (timesheet_id) REFERENCES public.timesheets(id) ON DELETE SET NULL;

ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS invoices_tenant_id_idx ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS invoices_timesheet_id_idx ON public.invoices(timesheet_id);
CREATE INDEX IF NOT EXISTS invoices_invoice_number_idx ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS invoices_invoice_hash_idx ON public.invoices(invoice_hash);
CREATE INDEX IF NOT EXISTS invoices_payment_status_idx ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);

-- Grant permissions
ALTER TABLE public.invoices OWNER TO postgres;

-- Verify table was created
SELECT 'Invoice table created successfully!' as message;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;
