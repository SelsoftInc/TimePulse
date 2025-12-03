import dynamic from 'next/dynamic';

// Dynamic import with no SSR to prevent hydration issues
const InvoiceDashboard = dynamic(
  () => import('@/components/invoices/InvoiceDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }
);

export default function Page() {
  return <InvoiceDashboard />;
}
