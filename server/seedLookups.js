/**
 * Seed Lookup Data
 * Run this script to populate the lookups table with initial data
 */

const { models, connectDB } = require('./models');

const seedLookups = async () => {
  try {
    console.log('🌱 Starting lookup data seeding...');
    
    await connectDB();
    
    // Payment Terms Lookups
    const paymentTerms = [
      { category: 'payment_terms', code: 'due_on_receipt', label: 'Due on Receipt', value: '0', displayOrder: 1 },
      { category: 'payment_terms', code: 'net15', label: 'Net 15', value: '15', displayOrder: 2 },
      { category: 'payment_terms', code: 'net30', label: 'Net 30', value: '30', displayOrder: 3 },
      { category: 'payment_terms', code: 'net45', label: 'Net 45', value: '45', displayOrder: 4 },
      { category: 'payment_terms', code: 'net60', label: 'Net 60', value: '60', displayOrder: 5 },
      { category: 'payment_terms', code: 'net90', label: 'Net 90', value: '90', displayOrder: 6 }
    ];

    // Client Type Lookups
    const clientTypes = [
      { category: 'client_type', code: 'direct', label: 'Direct Client', displayOrder: 1 },
      { category: 'client_type', code: 'vendor', label: 'Through Vendor', displayOrder: 2 },
      { category: 'client_type', code: 'partner', label: 'Implementation Partner', displayOrder: 3 }
    ];

    // Invoice Status Lookups
    const invoiceStatuses = [
      { category: 'invoice_status', code: 'draft', label: 'Draft', displayOrder: 1 },
      { category: 'invoice_status', code: 'sent', label: 'Sent', displayOrder: 2 },
      { category: 'invoice_status', code: 'paid', label: 'Paid', displayOrder: 3 },
      { category: 'invoice_status', code: 'overdue', label: 'Overdue', displayOrder: 4 },
      { category: 'invoice_status', code: 'cancelled', label: 'Cancelled', displayOrder: 5 }
    ];

    // Timesheet Status Lookups
    const timesheetStatuses = [
      { category: 'timesheet_status', code: 'draft', label: 'Draft', displayOrder: 1 },
      { category: 'timesheet_status', code: 'submitted', label: 'Submitted', displayOrder: 2 },
      { category: 'timesheet_status', code: 'approved', label: 'Approved', displayOrder: 3 },
      { category: 'timesheet_status', code: 'rejected', label: 'Rejected', displayOrder: 4 }
    ];

    // Combine all lookups
    const allLookups = [
      ...paymentTerms,
      ...clientTypes,
      ...invoiceStatuses,
      ...timesheetStatuses
    ];

    // Insert lookups (upsert to avoid duplicates)
    for (const lookup of allLookups) {
      await models.Lookup.findOrCreate({
        where: { category: lookup.category, code: lookup.code },
        defaults: lookup
      });
    }

    console.log('✅ Lookup data seeded successfully!');
    console.log(`   - Payment Terms: ${paymentTerms.length} records`);
    console.log(`   - Client Types: ${clientTypes.length} records`);
    console.log(`   - Invoice Statuses: ${invoiceStatuses.length} records`);
    console.log(`   - Timesheet Statuses: ${timesheetStatuses.length} records`);
    console.log(`   - Total: ${allLookups.length} records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding lookup data:', error);
    process.exit(1);
  }
};

seedLookups();
