const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'Onboard/Selsoft/Selsoft.xlsx');
const workbook = XLSX.readFile(excelPath);

console.log('Sheet names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log('\n=== ' + sheetName + ' ===');
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log('Total rows:', data.length);
  
  if (sheetName === 'Employees') {
    console.log('\nEmployees in Excel:');
    data.forEach((row, i) => {
      console.log(`${i+1}. ${row['First Name']} ${row['Last Name']} - ${row['Email']}`);
    });
  }
});
