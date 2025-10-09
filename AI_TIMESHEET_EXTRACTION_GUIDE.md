# AI-Powered Timesheet Extraction - Complete Guide

## Overview

The TimePulse timesheet submission module includes a powerful AI-powered document analysis feature that can automatically extract timesheet data from various file formats. This eliminates manual data entry and reduces errors.

## Supported File Formats

### 📸 Images
- **JPG/JPEG** - Standard image format
- **PNG** - Portable Network Graphics
- **HEIC** - High Efficiency Image Format (iOS photos)
- **WEBP** - Modern web image format
- **BMP** - Bitmap images

**Technology**: Tesseract.js OCR (Optical Character Recognition)

### 📄 Documents
- **PDF** - Portable Document Format
- **DOC** - Microsoft Word (legacy)
- **DOCX** - Microsoft Word (modern)

**Technology**: 
- PDF: pdfjs-dist for text extraction
- Word: mammoth.js for document parsing (with fallback)

### 📊 Spreadsheets
- **XLSX** - Microsoft Excel (modern)
- **XLS** - Microsoft Excel (legacy)
- **CSV** - Comma-Separated Values

**Technology**: xlsx library for spreadsheet parsing

## Features

### 1. Intelligent Data Extraction
- **Employee Name**: Automatically detects employee names from documents
- **Client Name**: Identifies client/vendor names
- **Project Name**: Extracts project information
- **Daily Hours**: Parses hours for each day of the week (Mon-Sun)
- **Total Hours**: Calculates and validates total weekly hours
- **Week Dates**: Extracts start and end dates of the timesheet period

### 2. Confidence Scoring
The system provides a confidence score (0-100%) based on:
- Number of data points extracted
- Consistency of the data
- Presence of key fields (employee name, hours, dates)
- Format recognition

### 3. Validation
Automatic validation checks:
- ✅ Total hours don't exceed 168 hours per week
- ✅ Daily hours don't exceed 24 hours
- ✅ No negative hours
- ✅ At least some hours are present
- ⚠️ Warnings for missing employee/client names
- ⚠️ Warnings for low confidence extractions

### 4. Progress Tracking
Real-time progress updates during extraction:
- File upload
- Format detection
- Text/data extraction
- Parsing and validation
- Data mapping

## How to Use

### Step 1: Access the Feature
1. Navigate to the Timesheet Submit screen
2. Look for the **"AI-Powered Timesheet Upload"** section
3. Click **"Upload & Extract"** to expand the upload area

### Step 2: Upload Your File
1. **Drag and drop** your file into the dropzone, OR
2. **Click** the dropzone to browse and select a file
3. Supported file size: Up to 10MB

### Step 3: AI Processing
1. The system automatically detects the file type
2. Applies the appropriate extraction method
3. Shows progress indicators
4. Displays confidence score upon completion

### Step 4: Review and Apply
1. Review the extracted data:
   - Employee name
   - Client name
   - Daily hours breakdown
   - Total hours
2. Check the confidence score
3. Click **"Apply Data"** to populate the timesheet form
4. Or click **"Discard"** to try again

### Step 5: Verify and Submit
1. Verify the auto-populated data
2. Make any necessary corrections
3. Add notes if needed
4. Submit the timesheet

## File Format Guidelines

### For Best Results with Images
- **Resolution**: Use high-resolution images (at least 1200x800 pixels)
- **Lighting**: Ensure good lighting, avoid shadows
- **Orientation**: Keep the document straight (not tilted)
- **Clarity**: Avoid blurry images
- **Format**: Use a clear, structured timesheet format
- **Text**: Ensure text is legible and not handwritten

### For Best Results with PDFs
- **Text-based PDFs**: Work better than scanned PDFs
- **Structure**: Use tables or clear sections
- **Labels**: Include clear labels like "Day", "Hours", "Employee Name"

### For Best Results with Excel/CSV
- **Headers**: Include column headers (Day, Hours, etc.)
- **Format**: Use standard day names (Monday, Tuesday, etc.)
- **Data Types**: Use numbers for hours (not text)
- **Structure**: One row per day or clear tabular format

### For Best Results with Word Documents
- **Tables**: Use tables for timesheet data
- **Labels**: Include clear field labels
- **Format**: Use standard formatting (not complex layouts)

## Expected Timesheet Format

The AI engine works best with timesheets that include:

```
Employee Name: John Doe
Client: Cognizant
Project: Web Development
Week: 01/15/2024 to 01/21/2024

Day         Hours
Monday      8
Tuesday     8
Wednesday   7.5
Thursday    8
Friday      8
Saturday    0
Sunday      0

Total Hours: 39.5
```

## Extraction Methods by File Type

### Image Files (JPG, PNG, HEIC, BMP, WEBP)
1. **Preprocessing**: Image is loaded and prepared
2. **OCR**: Tesseract.js extracts text from the image
3. **Parsing**: Text is analyzed for timesheet patterns
4. **Extraction**: Hours, names, and dates are identified
5. **Confidence**: Based on OCR quality and pattern matching

### PDF Files
1. **Text Extraction**: pdfjs-dist extracts embedded text
2. **Parsing**: Text is analyzed for timesheet patterns
3. **Extraction**: Data points are identified
4. **Confidence**: Based on text structure and completeness

### Excel/CSV Files
1. **Parsing**: xlsx library reads spreadsheet data
2. **Header Detection**: Identifies column headers
3. **Data Mapping**: Maps columns to timesheet fields
4. **Extraction**: Reads values from cells
5. **Confidence**: High (structured data)

### Word Documents (DOC, DOCX)
1. **Conversion**: mammoth.js converts to text
2. **Fallback**: Basic text extraction if mammoth unavailable
3. **Parsing**: Text is analyzed for patterns
4. **Extraction**: Data points are identified
5. **Confidence**: Based on document structure

## Troubleshooting

### Low Confidence Score
- **Try a different format**: Convert to Excel or PDF
- **Improve image quality**: Use better lighting, higher resolution
- **Use structured format**: Tables work better than free text
- **Check labels**: Ensure clear field labels are present

### No Hours Extracted
- **Check format**: Ensure hours are clearly labeled
- **Use numbers**: Avoid text like "eight hours" (use "8")
- **Table structure**: Use tables or clear sections
- **Day names**: Use standard day names (Mon, Tue, etc.)

### Wrong Data Extracted
- **Review format**: Ensure timesheet follows expected structure
- **Clear labels**: Use explicit labels (Employee Name:, Hours:, etc.)
- **Avoid clutter**: Remove unnecessary text or graphics
- **Standard layout**: Use a simple, clear layout

### File Upload Fails
- **Check file size**: Must be under 10MB
- **Check format**: Must be a supported file type
- **Check permissions**: Ensure file is not corrupted or locked
- **Try different format**: Convert to a different supported format

## Technical Details

### Dependencies
```json
{
  "tesseract.js": "^4.1.4",      // OCR for images
  "pdfjs-dist": "^3.11.174",     // PDF text extraction
  "xlsx": "^0.18.5",             // Excel/CSV parsing
  "mammoth": "^1.x.x"            // Word document processing (optional)
}
```

### API Endpoints
- **Local Extraction**: Client-side processing (no server required)
- **Engine API**: Optional backend processing at `http://localhost:5000/api/engine`

### Performance
- **Images**: 5-15 seconds (depends on resolution and OCR)
- **PDFs**: 2-5 seconds (depends on page count)
- **Excel/CSV**: 1-2 seconds (fast, structured data)
- **Word**: 2-5 seconds (depends on document size)

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (not supported)

## Security & Privacy

- **Client-Side Processing**: Most extraction happens in the browser
- **No Data Storage**: Uploaded files are not stored on servers
- **Temporary Processing**: Files are processed in memory only
- **Secure Upload**: Files are validated before processing
- **Size Limits**: 10MB maximum to prevent abuse

## Advanced Features

### Auto-Convert to Invoice
Enable the toggle to automatically convert extracted timesheet data to invoice format:
- Calculates invoice amount based on hours and rate
- Generates invoice line items
- Includes timesheet period
- Ready for immediate invoice generation

### Multi-Client Support
The system can handle timesheets with multiple clients:
- Automatically detects client names
- Maps to existing clients in the system
- Creates separate entries for each client
- Maintains hourly rates per client

### Employee Selection (Admin/Manager)
Admins and managers can:
- Select employee before uploading
- Upload timesheets on behalf of employees
- Bulk process multiple timesheets
- Review and approve extracted data

## Best Practices

1. **Use Consistent Formats**: Stick to one timesheet template
2. **High Quality Files**: Use clear, high-resolution files
3. **Structured Data**: Use tables and clear sections
4. **Standard Labels**: Use common field names
5. **Verify Data**: Always review extracted data before submission
6. **Test First**: Try with a sample file first
7. **Backup Manual Entry**: Keep manual entry as fallback

## Future Enhancements

- 🔄 Batch processing (multiple files at once)
- 📱 Mobile camera capture with real-time preview
- 🤖 Machine learning for improved accuracy
- 📊 Custom template training
- 🌐 Multi-language support
- 📧 Email-to-timesheet (forward timesheet via email)
- 🔗 Integration with external timesheet systems

## Support

For issues or questions:
1. Check this guide first
2. Review the troubleshooting section
3. Contact your system administrator
4. Report bugs to the development team

## Version History

- **v1.0** - Initial release with basic extraction
- **v1.1** - Added Word document support
- **v1.2** - Enhanced OCR accuracy
- **v1.3** - Added confidence scoring
- **v1.4** - Improved validation and error handling
- **v2.0** - Complete multi-format support (current)

---

**Last Updated**: January 2025
**Maintained By**: TimePulse Development Team
