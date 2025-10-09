# Test Files for AI Timesheet Extraction

This directory contains sample timesheet files in various formats that you can use to test the AI extraction feature.

## Available Test Files

### 1. sample-timesheet-text.txt
**Format**: Plain Text  
**Purpose**: Test basic text parsing  
**Expected Results**:
- Employee: John Doe
- Client: Cognizant Technology Solutions
- Total Hours: 39.5
- Confidence: 90%+

### How to Create Your Own Test Files

#### For Images (JPG, PNG)
1. Create a timesheet in Word or Excel
2. Take a screenshot or export as image
3. Ensure:
   - Resolution: At least 1200x800 pixels
   - Clear text (not handwritten)
   - Good contrast
   - Straight orientation

#### For PDF
1. Create timesheet in any application
2. Export/Print to PDF
3. Ensure it's text-based (not scanned image)

#### For Excel (XLSX)
Create a spreadsheet with this structure:
```
| Day       | Hours |
|-----------|-------|
| Monday    | 8     |
| Tuesday   | 8     |
| Wednesday | 7.5   |
| Thursday  | 8     |
| Friday    | 8     |
| Saturday  | 0     |
| Sunday    | 0     |
```

#### For CSV
Create a comma-separated file:
```csv
Day,Hours
Monday,8
Tuesday,8
Wednesday,7.5
Thursday,8
Friday,8
Saturday,0
Sunday,0
```

#### For Word (DOCX)
Create a document with:
- Clear labels (Employee Name:, Client:, etc.)
- Table for daily hours
- Total hours calculation

## Testing Checklist

- [ ] Test with high-quality image
- [ ] Test with low-quality image
- [ ] Test with PDF (text-based)
- [ ] Test with Excel file
- [ ] Test with CSV file
- [ ] Test with Word document
- [ ] Test with various timesheet formats
- [ ] Test with missing employee name
- [ ] Test with missing client name
- [ ] Test with decimal hours
- [ ] Test with time format (8:30)
- [ ] Test with abbreviated day names
- [ ] Test with full day names
- [ ] Test error handling (invalid file)
- [ ] Test file size limit (>10MB)

## Expected Confidence Scores

| File Type | Quality | Expected Confidence |
|-----------|---------|---------------------|
| Excel/CSV | Any     | 95-100%            |
| PDF       | Good    | 85-95%             |
| Image     | High    | 80-90%             |
| Image     | Medium  | 70-80%             |
| Image     | Low     | 60-70%             |
| Word      | Good    | 75-85%             |

## Troubleshooting Test Issues

### Low Confidence Score
- Improve image quality
- Use structured format (tables)
- Add clear labels
- Try different file format

### No Hours Extracted
- Check day name format
- Ensure hours are numbers
- Add "Hours" label
- Use tabular format

### Wrong Data Extracted
- Simplify layout
- Remove extra text
- Use standard labels
- Check for typos

## Creating Realistic Test Data

For realistic testing, create timesheets with:
- Real employee names
- Actual client names from your organization
- Realistic hour distributions (not all 8s)
- Some days with 0 hours
- Decimal hours (7.5, 8.25, etc.)
- Notes and comments
- Multiple projects/clients

## Automated Testing

To run automated tests:
```bash
cd frontend
npm test -- timesheetExtractor.test.js
```

## Reporting Issues

If you find extraction issues:
1. Save the problematic file
2. Note the confidence score
3. Document what was extracted vs. expected
4. Report to development team with file attached

---

**Last Updated**: January 2025
