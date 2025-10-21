# 📄 AI-Powered Timesheet File Extraction - Implementation Guide

## Overview
The timesheet extraction system can automatically extract data from uploaded files in multiple formats:
- **Images** (JPG, PNG, HEIC, BMP) - using OCR (Tesseract.js)
- **Excel** (XLSX, XLS) - using SheetJS
- **PDF** - using PDF.js
- **CSV** - using custom parser

## Installation

### Step 1: Install Dependencies

```bash
cd d:\selsoft\WebApp\TimePulse\frontend
npm install xlsx tesseract.js pdfjs-dist
```

**Dependencies Added:**
- `xlsx@^0.18.5` - Excel file parsing
- `tesseract.js@^4.1.1` - OCR for images
- `pdfjs-dist@^3.11.174` - PDF text extraction

### Step 2: Verify Installation

```bash
npm list xlsx tesseract.js pdfjs-dist
```

Should show all three packages installed.

## File Created

### `frontend/src/services/timesheetExtractor.js`

**Main Functions:**
1. `extractTimesheetData(file)` - Main extraction function
2. `validateExtractedData(data)` - Validates extracted data
3. `extractFromImage(file)` - OCR for images
4. `extractFromExcel(file)` - Parse Excel files
5. `extractFromPDF(file)` - Extract from PDF
6. `extractFromCSV(file)` - Parse CSV files

## How It Works

### 1. Image Files (JPG, PNG, HEIC)

```javascript
import { extractTimesheetData } from './services/timesheetExtractor';

const file = event.target.files[0]; // User uploaded image
const data = await extractTimesheetData(file);

// Returns:
{
  success: true,
  dailyHours: {
    sat: 0,
    sun: 0,
    mon: 8,
    tue: 8,
    wed: 8,
    thu: 8,
    fri: 8
  },
  totalHours: 40,
  employeeName: "John Doe",
  weekStart: "10/06/2025",
  weekEnd: "10/12/2025",
  confidence: "high"
}
```

**OCR Process:**
1. Converts image to URL
2. Uses Tesseract.js to extract text
3. Parses text for day names and hours
4. Looks for patterns like "Monday: 8 hours"
5. Extracts employee name and dates
6. Returns structured data

### 2. Excel Files (XLSX, XLS)

```javascript
const data = await extractTimesheetData(excelFile);

// Expected Excel Format:
// Row 1: Day | Hours
// Row 2: Monday | 8
// Row 3: Tuesday | 8
// etc.
```

**Excel Process:**
1. Reads file as ArrayBuffer
2. Uses XLSX library to parse
3. Converts to JSON array
4. Maps day names to hours
5. Returns structured data

### 3. PDF Files

```javascript
const data = await extractTimesheetData(pdfFile);
```

**PDF Process:**
1. Uses PDF.js to extract text from all pages
2. Parses text similar to OCR
3. Looks for day/hour patterns
4. Returns structured data

### 4. CSV Files

```javascript
const data = await extractTimesheetData(csvFile);

// Expected CSV Format:
// Day,Hours
// Monday,8
// Tuesday,8
// etc.
```

**CSV Process:**
1. Reads file as text
2. Parses CSV (handles quoted fields)
3. Maps data to timesheet structure
4. Returns structured data

## Integration with TimesheetSubmit Component

### Current AI Upload Section

The component already has an AI upload section. We need to integrate the extractor:

```javascript
// In TimesheetSubmit.jsx

import { extractTimesheetData, validateExtractedData } from '../../services/timesheetExtractor';

// Add state for extraction
const [extracting, setExtracting] = useState(false);
const [extractedData, setExtractedData] = useState(null);

// Handle file upload for AI extraction
const handleAIFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  setExtracting(true);
  setError('');
  
  try {
    console.log('🤖 Starting AI extraction...');
    
    // Extract data from file
    const data = await extractTimesheetData(file);
    
    console.log('✅ Extraction complete:', data);
    
    // Validate extracted data
    const validation = validateExtractedData(data);
    
    if (!validation.isValid) {
      setError(`Extraction errors: ${validation.errors.join(', ')}`);
      return;
    }
    
    // Store extracted data
    setExtractedData(data);
    
    // Show success toast
    showToast(`Successfully extracted ${data.totalHours} hours from ${file.name}`, 'success');
    
    // Optionally auto-populate the form
    if (data.dailyHours) {
      // Update clientHours with extracted data
      const updatedClientHours = clientHours.map((client, index) => {
        if (index === 0) { // Update first client
          return {
            ...client,
            hours: [
              data.dailyHours.sat,
              data.dailyHours.sun,
              data.dailyHours.mon,
              data.dailyHours.tue,
              data.dailyHours.wed,
              data.dailyHours.thu,
              data.dailyHours.fri
            ]
          };
        }
        return client;
      });
      
      setClientHours(updatedClientHours);
    }
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    showToast(error.message || 'Failed to extract data from file', 'error');
  } finally {
    setExtracting(false);
  }
};
```

## Supported File Formats

### Images
- **JPG/JPEG** - ✅ Supported
- **PNG** - ✅ Supported
- **HEIC** - ✅ Supported (iOS photos)
- **BMP** - ✅ Supported

**Requirements:**
- Clear, readable text
- Good contrast
- Horizontal orientation preferred
- Minimum 300 DPI recommended

### Excel
- **XLSX** - ✅ Supported (Excel 2007+)
- **XLS** - ✅ Supported (Excel 97-2003)

**Expected Format:**
```
| Day       | Hours |
|-----------|-------|
| Monday    | 8     |
| Tuesday   | 8     |
| Wednesday | 8     |
| Thursday  | 8     |
| Friday    | 8     |
```

### PDF
- **PDF** - ✅ Supported

**Requirements:**
- Text-based PDF (not scanned images)
- Readable text layer
- Standard timesheet format

### CSV
- **CSV** - ✅ Supported

**Expected Format:**
```csv
Day,Hours
Monday,8
Tuesday,8
Wednesday,8
Thursday,8
Friday,8
```

## Data Extraction Patterns

### Text Patterns Recognized

**Day Names:**
- Monday, Mon
- Tuesday, Tue
- Wednesday, Wed
- Thursday, Thu
- Friday, Fri
- Saturday, Sat
- Sunday, Sun

**Hour Patterns:**
- "8 hours"
- "8 hrs"
- "8.5 hours"
- "Monday: 8"
- "Mon - 8"

**Date Patterns:**
- "10/06/2025 to 10/12/2025"
- "10-06-2025 - 10-12-2025"
- "Oct 6, 2025 to Oct 12, 2025"

**Employee Name:**
- "Employee: John Doe"
- "Name: John Doe"
- "Emp: John Doe"

## Validation

The `validateExtractedData()` function checks:

1. ✅ **Total hours** - Must be > 0 and ≤ 168
2. ✅ **Daily hours** - Each day ≤ 24 hours
3. ✅ **No negative hours**
4. ✅ **Data extraction success**

## Error Handling

### Common Errors

**1. Unsupported File Type**
```
Error: Unsupported file type: docx
```
**Solution**: Use JPG, PNG, XLSX, PDF, or CSV

**2. OCR Failed**
```
Error: Failed to extract text from image
```
**Solution**: 
- Ensure image is clear and readable
- Check image orientation
- Try higher resolution image

**3. No Hours Found**
```
Error: No hours found in the file
```
**Solution**:
- Check file format matches expected structure
- Ensure hours are clearly labeled
- Try manual entry

**4. Invalid Hours**
```
Error: MON hours exceed 24 hours
```
**Solution**:
- Check source data for errors
- Verify hours are reasonable

## Testing

### Test Files

Create test files in each format:

**1. test-timesheet.csv**
```csv
Day,Hours
Monday,8
Tuesday,8
Wednesday,8
Thursday,8
Friday,8
```

**2. test-timesheet.xlsx**
- Create Excel file with same structure

**3. test-timesheet.jpg**
- Screenshot of timesheet with clear text

**4. test-timesheet.pdf**
- PDF with timesheet data

### Test Script

```javascript
// Test extraction
const testExtraction = async () => {
  const testFiles = [
    'test-timesheet.csv',
    'test-timesheet.xlsx',
    'test-timesheet.jpg',
    'test-timesheet.pdf'
  ];
  
  for (const fileName of testFiles) {
    const file = await fetch(`/test-files/${fileName}`).then(r => r.blob());
    const data = await extractTimesheetData(file);
    console.log(`${fileName}:`, data);
  }
};
```

## Performance

### Extraction Times (Approximate)

- **CSV**: < 1 second
- **Excel**: 1-2 seconds
- **PDF**: 2-5 seconds
- **Image (OCR)**: 5-15 seconds

### Optimization Tips

1. **Images**: Use compressed JPG instead of PNG
2. **Excel**: Keep files small (< 1MB)
3. **PDF**: Use text-based PDFs, not scanned images
4. **CSV**: Most efficient format

## Next Steps

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Test Extraction
- Upload test files
- Check console logs
- Verify extracted data

### 3. Integrate with UI
- Connect to AI upload button
- Show extraction progress
- Display extracted data for review
- Allow user to edit before submitting

### 4. Add Preview
- Show extracted data in a modal
- Allow user to confirm/edit
- Highlight confidence level

## Summary

✅ **Extraction Service Created** - `timesheetExtractor.js`  
✅ **Dependencies Added** - xlsx, tesseract.js, pdfjs-dist  
✅ **Multiple Formats Supported** - Image, Excel, PDF, CSV  
✅ **Validation Included** - Data quality checks  
✅ **Error Handling** - Comprehensive error messages  

---

**Ready to test! Install dependencies and try uploading different file formats to see the extraction in action.**
