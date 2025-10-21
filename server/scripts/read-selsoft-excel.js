/**
 * Script to read and display contents of Selsoft Excel file
 * Shows what data is available in the Excel file
 * 
 * Usage: node scripts/read-selsoft-excel.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const ONBOARD_FOLDER = path.join(__dirname, '../Onboard');
const TENANT_NAME = 'Selsoft';

function readSelsoftExcel() {
  console.log('📖 Reading Selsoft Excel file...\n');

  try {
    const tenantFolder = path.join(ONBOARD_FOLDER, TENANT_NAME);
    
    if (!fs.existsSync(tenantFolder)) {
      console.error(`❌ Tenant folder not found: ${tenantFolder}`);
      return;
    }

    // Find Excel file
    const files = fs.readdirSync(tenantFolder)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
    
    if (files.length === 0) {
      console.error('❌ No Excel file found in tenant folder');
      return;
    }

    const fileName = files[0];
    const filePath = path.join(tenantFolder, fileName);
    
    console.log(`✅ Found Excel file: ${fileName}`);
    console.log(`   Path: ${filePath}\n`);

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    
    console.log(`📊 Sheets in workbook: ${workbook.SheetNames.join(', ')}\n`);

    // Read each sheet
    workbook.SheetNames.forEach(sheetName => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 Sheet: ${sheetName}`);
      console.log('='.repeat(80));
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`   Total Rows: ${jsonData.length}\n`);
      
      if (jsonData.length === 0) {
        console.log('   ⚠️  No data in this sheet\n');
        return;
      }

      // Display column headers
      const headers = Object.keys(jsonData[0]);
      console.log('   Columns:', headers.join(', '));
      console.log('');

      // Display all rows
      jsonData.forEach((row, index) => {
        console.log(`   Row ${index + 1}:`);
        headers.forEach(header => {
          console.log(`      ${header}: ${row[header] || 'N/A'}`);
        });
        console.log('   ' + '-'.repeat(76));
      });
    });

    console.log('\n✅ Excel file read successfully!');

  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    console.error(error.stack);
  }
}

// Run the script
readSelsoftExcel();
