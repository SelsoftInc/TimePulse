const fs = require('fs');
const path = require('path');

console.log('📄 Creating ALL Next.js pages from React routes...\n');

const appDir = path.join(__dirname, 'src', 'app');
const subdomainDir = path.join(appDir, '[subdomain]');

// Ensure subdomain directory exists
if (!fs.existsSync(subdomainDir)) {
  fs.mkdirSync(subdomainDir, { recursive: true });
}

// Define all routes from React App.js
const routes = [
  // Timesheets
  { path: 'timesheets', component: 'TimesheetSummary', dir: 'timesheets' },
  { path: 'timesheets/submit', component: 'TimesheetSubmit', dir: 'timesheets' },
  { path: 'timesheets/history', component: 'TimesheetHistory', dir: 'timesheets' },
  { path: 'timesheets/approval', component: 'TimesheetApproval', dir: 'timesheets' },
  { path: 'timesheets/mobile-upload', component: 'MobileTimesheetUpload', dir: 'timesheets' },
  { path: 'timesheets/to-invoice', component: 'TimesheetToInvoice', dir: 'timesheets' },
  { path: 'timesheets/auto-convert', component: 'TimesheetAutoConvert', dir: 'timesheets' },
  { path: 'timesheets/edit/[employeeId]', component: 'EmployeeTimesheet', dir: 'timesheets' },
  { path: 'timesheets/submit/[weekId]', component: 'TimesheetSubmit', dir: 'timesheets' },
  
  // Invoices
  { path: 'invoices', component: 'InvoiceDashboard', dir: 'invoices' },
  { path: 'invoices/create', component: 'InvoiceCreation', dir: 'invoices' },
  { path: 'invoices/manual', component: 'ManualInvoiceForm', dir: 'invoices' },
  { path: 'invoices/[id]', component: 'Invoice', dir: 'invoices' },
  { path: 'invoices/edit/[id]', component: 'InvoiceForm', dir: 'invoices' },
  
  // Clients
  { path: 'clients', component: 'ClientsList', dir: 'clients' },
  { path: 'clients/new', component: 'ClientForm', dir: 'clients' },
  { path: 'clients/[id]', component: 'ClientDetails', dir: 'clients' },
  { path: 'clients/edit/[id]', component: 'ClientEdit', dir: 'clients' },
  
  // Employees
  { path: 'employees', component: 'EmployeeList', dir: 'employees' },
  { path: 'employees/new', component: 'EmployeeForm', dir: 'employees' },
  { path: 'employees/invite', component: 'EmployeeInvite', dir: 'employees' },
  { path: 'employees/[id]', component: 'EmployeeDetail', dir: 'employees' },
  { path: 'employees/edit/[id]', component: 'EmployeeEdit', dir: 'employees' },
  { path: 'employees/settings', component: 'EmployeeSettings', dir: 'employees' },
  
  // Vendors
  { path: 'vendors', component: 'VendorList', dir: 'vendors' },
  { path: 'vendors/new', component: 'VendorForm', dir: 'vendors' },
  { path: 'vendors/[id]', component: 'VendorDetail', dir: 'vendors' },
  { path: 'vendors/edit/[id]', component: 'VendorEdit', dir: 'vendors' },
  
  // Implementation Partners
  { path: 'implementation-partners', component: 'ImplementationPartnerList', dir: 'implementationPartners' },
  { path: 'implementation-partners/new', component: 'ImplementationPartnerForm', dir: 'implementationPartners' },
  { path: 'implementation-partners/[id]', component: 'ImplementationPartnerDetail', dir: 'implementationPartners' },
  { path: 'implementation-partners/edit/[id]', component: 'ImplementationPartnerEdit', dir: 'implementationPartners' },
  
  // Settings
  { path: 'settings', component: 'EmployerSettings', dir: 'settings' },
  { path: 'settings/invoice', component: 'InvoiceSettings', dir: 'settings' },
  
  // Reports
  { path: 'reports', component: 'ReportsDashboard', dir: 'reports' },
  
  // Leave Management
  { path: 'leave-management', component: 'LeaveManagement', dir: 'leave' },
  { path: 'leave', component: 'LeaveManagement', dir: 'leave' },
  
  // Documents
  { path: 'documents', component: 'EmployeeDocuments', dir: 'documents' },
  
  // Employee Dashboard
  { path: 'employee-dashboard', component: 'EmployeeDashboard', dir: 'dashboard' },
];

let createdCount = 0;
let skippedCount = 0;

routes.forEach(route => {
  const routePath = path.join(subdomainDir, route.path);
  const pageFile = path.join(routePath, 'page.js');
  
  // Check if page already exists
  if (fs.existsSync(pageFile)) {
    console.log(`  ⏭️  Skipped (exists): ${route.path}`);
    skippedCount++;
    return;
  }
  
  // Create directory
  fs.mkdirSync(routePath, { recursive: true });
  
  // Create page.js content
  const pageContent = `import ${route.component} from '@/components/${route.dir}/${route.component}';

export default function Page() {
  return <${route.component} />;
}
`;
  
  // Write page file
  fs.writeFileSync(pageFile, pageContent, 'utf8');
  console.log(`  ✅ Created: ${route.path}/page.js`);
  createdCount++;
});

console.log(`\n${'='.repeat(70)}`);
console.log(`🎉 Page creation complete!`);
console.log(`${'='.repeat(70)}`);
console.log(`\n📊 Statistics:`);
console.log(`   Created: ${createdCount} pages`);
console.log(`   Skipped: ${skippedCount} pages (already exist)`);
console.log(`   Total routes: ${routes.length}`);
console.log(`\n✅ All Next.js pages created!`);
console.log(`\n📝 Next: npm run dev`);
