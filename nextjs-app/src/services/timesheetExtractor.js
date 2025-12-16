/**
 * Timesheet Data Extractor Service
 * Extracts timesheet data from various file formats:
 * - Images (JPG, PNG, HEIC) - using OCR
 * - Excel (XLSX, XLS)
 * - PDF
 * - CSV
 */

import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import { extractTextFromPdf } from './pdfUtils';

/**
 * Main function to extract timesheet data from uploaded file
 * @param {File} file - The uploaded file
 * @param {Function} [onProgress] - Callback for progress updates
 * @returns {Promise<Object>} Extracted timesheet data
 */
export const extractTimesheetData = async (file, onProgress) => {
  console.log('📄 Extracting data from file:', file.name, 'Type:', file.type);
  
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const fileType = file.type.toLowerCase();
  
  onProgress?.({ status: 'started', message: 'Starting extraction...', progress: 0 });
  
  try {
    let result;
    
    // Determine file type and use appropriate extractor
    if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'heic', 'bmp', 'webp'].includes(fileExtension)) {
      result = await extractFromImage(file, onProgress);
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || ['xlsx', 'xls', 'xlsm'].includes(fileExtension)) {
      result = await extractFromExcel(file, onProgress);
    } else if (fileType.includes('pdf') || fileExtension === 'pdf') {
      result = await extractFromPDF(file, onProgress);
    } else if (fileType.includes('csv') || fileExtension === 'csv') {
      result = await extractFromCSV(file, onProgress);
    } else if (fileType.includes('word') || ['doc', 'docx'].includes(fileExtension)) {
      // For Word documents, we'll convert to text and process
      result = await extractFromWord(file, onProgress);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}. Please upload an image, PDF, Excel, or CSV file.`);
    }
    
    // Validate the extracted data
    const validation = validateExtractedData(result);
    if (!validation.isValid) {
      console.warn('Validation warnings:', validation.warnings);
      // We'll still return the data but with warnings
      result.validationWarnings = validation.warnings;
    }
    
    onProgress?.({ status: 'completed', message: 'Extraction completed', progress: 100 });
    return result;

  } catch (error) {
    console.error('❌ Error extracting timesheet data:', error);
    onProgress?.({
      status: 'error',
      message: `Extraction failed: ${error.message}`,
      progress: 100
    });
    throw error;
  }
};

/**
 * Enhanced image extraction with better OCR preprocessing
 */
const extractFromImage = async (file, onProgress) => {
  console.log('🖼️ Extracting from image using enhanced OCR...');
  
  try {
    onProgress?.({ status: 'processing', message: 'Preparing image for OCR...', progress: 10 });
    
    // Convert file to image and preprocess
    const imageUrl = URL.createObjectURL(file);
    
    // Enhanced OCR with better configuration
    onProgress?.({ status: 'processing', message: 'Extracting text from image...', progress: 30 });
    
    const { data: { text } } = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = 30 + Math.round(m.progress * 60);
            onProgress?.({
              status: 'processing',
              message: `Extracting text... (${progress}%)`,
              progress
            });
          }
        },
        tessedit_char_whitelist: '0123456789.\n\r\t /-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text
        tessedit_ocr_engine_mode: '3' // Default + LSTM
      }
    );
    
    console.log('📝 OCR Text extracted:', text);
    
    onProgress?.({ status: 'processing', message: 'Processing extracted data...', progress: 95 });
    
    // Parse the OCR text to extract timesheet data
    const parsedData = parseTimesheetText(text);
    
    // Clean up
    URL.revokeObjectURL(imageUrl);
    
    return parsedData;
  } catch (error) {
    console.error('❌ OCR extraction failed:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

/**
 * Extract data from Word document
 */
const extractFromWord = async (file, onProgress) => {
  console.log('📝 Extracting from Word document...');

  onProgress?.({ status: 'processing', message: 'Converting Word document to text...', progress: 20 });

  try {
    // Try to use mammoth if available, otherwise fall back to basic text extraction
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });

      onProgress?.({ status: 'processing', message: 'Parsing extracted text...', progress: 60 });

      const parsedData = parseTimesheetText(rawText || '');
      parsedData.source = 'word';
      parsedData.fileName = file.name;
      return parsedData;
    } catch (mammothError) {
      console.warn('📝 Mammoth not available, using fallback method:', mammothError);
      
      // Fallback: Try to read as text (works for .doc sometimes)
      const text = await file.text();
      
      onProgress?.({ status: 'processing', message: 'Parsing extracted text...', progress: 60 });
      
      const parsedData = parseTimesheetText(text || '');
      parsedData.source = 'word';
      parsedData.fileName = file.name;
      parsedData.extractionMethod = 'fallback';
      return parsedData;
    }
  } catch (error) {
    console.error('📝 Word extraction failed:', error);
    throw new Error(`Failed to extract text from Word document: ${error.message}. Please try converting to PDF or Excel format.`);
  }
};

/**
 * Extract data from Excel file with enhanced error handling
 */
const extractFromExcel = async (file, onProgress) => {
  console.log('📊 Extracting from Excel file...');
  
  onProgress?.({ status: 'processing', message: 'Reading Excel file...', progress: 20 });
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        onProgress?.({ status: 'processing', message: 'Parsing Excel data...', progress: 50 });
        
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel file is empty or corrupted');
        }
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with defval to handle empty cells
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false
        });
        
        console.log('📊 Excel data extracted, rows:', jsonData.length);
        
        onProgress?.({ status: 'processing', message: 'Extracting timesheet data...', progress: 70 });
        
        // Parse the Excel data
        const parsedData = parseExcelData(jsonData);
        parsedData.fileName = file.name;
        
        onProgress?.({ status: 'processing', message: 'Finalizing extraction...', progress: 90 });
        
        resolve(parsedData);
      } catch (error) {
        console.error('❌ Excel parsing failed:', error);
        reject(new Error(`Failed to parse Excel file: ${error.message}. Please ensure it follows the timesheet format.`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file. The file may be corrupted.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extract data from PDF file
 * @param {File} file - The PDF file to extract data from
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Extracted timesheet data
 */
const extractFromPDF = async (file, onProgress) => {
  console.log('📄 Extracting from PDF...');
  
  try {
    onProgress?.({ status: 'processing', message: 'Extracting text from PDF...', progress: 30 });
    
    // Use the extractTextFromPdf utility function
    const text = await extractTextFromPdf(file);
    console.log('Extracted PDF text:', text);
    
    onProgress?.({ status: 'processing', message: 'Processing extracted text...', progress: 70 });
    
    // Parse the extracted text
    const parsedData = parseTimesheetText(text);
    
    // Add metadata
    parsedData.source = 'pdf';
    parsedData.fileName = file.name;
    
    return parsedData;
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Extract data from CSV file
 */
const extractFromCSV = async (file, onProgress) => {
  console.log('📋 Extracting from CSV file...');
  
  onProgress?.({ status: 'processing', message: 'Reading CSV file...', progress: 30 });
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        onProgress?.({ status: 'processing', message: 'Parsing CSV data...', progress: 60 });
        
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Parse CSV
        const data = lines.map(line => {
          // Handle quoted fields
          const fields = [];
          let current = '';
          let inQuotes = false;
          
          for (let char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              fields.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          fields.push(current.trim());
          
          return fields;
        });
        
        console.log('📋 CSV data extracted, rows:', data.length);
        
        onProgress?.({ status: 'processing', message: 'Extracting timesheet data...', progress: 80 });
        
        // Parse the CSV data
        const parsedData = parseExcelData(data); // Same parser as Excel
        parsedData.fileName = file.name;
        parsedData.source = 'csv';
        
        resolve(parsedData);
      } catch (error) {
        console.error('❌ CSV parsing failed:', error);
        reject(new Error('Failed to parse CSV file. Please ensure it follows the timesheet format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse timesheet text (from OCR or PDF)
 * Enhanced for Cognizant timesheet format
 */
const parseTimesheetText = (text = '') => {
  console.log('🔍 Parsing timesheet text', text?.slice(0, 200));

  const normalizedText = (text || '').replace(/\r\n?/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(Boolean);

  const dayKeys = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
  const dailyHours = dayKeys.reduce((acc, key) => ({ ...acc, [key]: null }), {});

  const parseHoursValue = (raw, { allowLarge = false } = {}) => {
    if (raw === null || raw === undefined) return null;
    const cleaned = String(raw).trim();
    if (!cleaned) return null;

    const timeMatch = cleaned.match(/(\d{1,2})[:h](\d{1,2})/i);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10) || 0;
      const minutes = parseInt(timeMatch[2], 10) || 0;
      const value = parseFloat((hours + minutes / 60).toFixed(2));
      if (!allowLarge && value > 24) return null;
      return value;
    }

    const trimmed = cleaned.replace(/(hrs?|hours?|mins?|minutes?)/gi, '').trim();
    if (/[a-z]/i.test(trimmed)) {
      return null;
    }

    const numericMatch = trimmed.match(/-?\d+(?:[.,]\d+)?/);
    if (!numericMatch) {
      return null;
    }

    const value = parseFloat(numericMatch[0].replace(',', '.'));
    if (Number.isNaN(value)) {
      return null;
    }

    if (!allowLarge && (value < 0 || value > 24)) {
      return null;
    }

    if (allowLarge && (value < 0 || value > 240)) {
      return null;
    }

    return value;
  };

  const setDayHour = (key, value) => {
    if (!dayKeys.includes(key)) return;
    if (value === null) return;
    if (dailyHours[key] === null) {
      dailyHours[key] = value;
    }
  };

  let totalHours = 0;
  let employeeName = '';
  let clientName = '';
  let projectName = '';
  let weekStart = '';
  let weekEnd = '';

  // Extract employee name
  const employeeLine = lines.find(line => /employee\s*name|emp\.?\s*name|employee:/i.test(line));
  if (employeeLine) {
    const match = employeeLine.match(/(?:employee\s*name|emp\.?\s*name|name)[^A-Za-z]*([A-Za-z]+\s+[A-Za-z]+)/i);
    if (match) {
      employeeName = match[1].trim();
    }
  }
  if (!employeeName) {
    const fallbackEmployee = normalizedText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (fallbackEmployee) {
      employeeName = fallbackEmployee[1].trim();
    }
  }

  // Extract client name with enhanced patterns
  const clientLine = lines.find(line => /client\s*name|client:|vendor\s*name|vendor:|company:/i.test(line));
  if (clientLine) {
    const match = clientLine.match(/(?:client\s*name|client|vendor\s*name|vendor|company)[:\-\s]+(.+)/i);
    if (match) {
      clientName = match[1].trim().replace(/[^\w\s-]/g, ''); // Remove special chars
    }
  }
  
  // Try to find client in common formats
  if (!clientName) {
    // Look for "For: ClientName" or "To: ClientName" patterns
    const forMatch = normalizedText.match(/(?:for|to)[:\s]+([A-Z][A-Za-z\s&]+?)(?:\n|$|,)/i);
    if (forMatch) {
      clientName = forMatch[1].trim();
    }
  }
  
  // Fallback to known client names
  if (!clientName) {
    const knownClient = normalizedText.match(/cognizant|jpmc|ibm|accenture|microsoft|google|amazon|tcs|infosys|wipro|hcl/i);
    if (knownClient) {
      clientName = knownClient[0];
    }
  }
  
  console.log('📊 Extracted client name:', clientName);

  // Extract project name
  const projectLine = lines.find(line => /project\s*(name)?/i.test(line));
  if (projectLine) {
    const match = projectLine.match(/project[^A-Za-z]*([A-Za-z][A-Za-z\s-]+)/i);
    if (match) {
      projectName = match[1].trim();
    }
  }
  if (!projectName) {
    const fallbackProject = normalizedText.match(/(?:project|proj)[\s:]+([A-Za-z][A-Za-z\s-]+)/i);
    if (fallbackProject) {
      projectName = fallbackProject[1].trim();
    }
  }

  // Extract dates
  const dateMatches = normalizedText.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g);
  if (dateMatches && dateMatches.length >= 2) {
    weekStart = dateMatches[0];
    weekEnd = dateMatches[dateMatches.length - 1];
  }

  // Helper to assign hours array to dailyHours
  const assignHours = (values) => {
    if (!values || values.length === 0) return;
    const parsedValues = [];
    values.forEach((value) => {
      const parsed = parseHoursValue(value);
      if (parsed !== null) {
        parsedValues.push(parsed);
      }
    });
    if (parsedValues.length === 0) return;

    dayKeys.forEach((key, index) => {
      const parsed = parsedValues[index];
      if (parsed === undefined) return;
      setDayHour(key, parsed);
    });
  };

  // Attempt to read tabular format where hours follow day header row
  const headerRegex = /sat\b.*sun\b.*mon\b.*tue\b.*wed\b.*thu\b.*fri\b/i;
  const headerIndex = lines.findIndex(line => headerRegex.test(line.toLowerCase()));
  if (headerIndex !== -1) {
    console.log('📊 Found day header row at line:', headerIndex);
    const collected = [];
    let i = headerIndex + 1;
    while (i < lines.length && collected.length < 7) {
      const fragments = lines[i].split(/\s+/).filter(Boolean);
      collected.push(...fragments);
      i += 1;
      if (i - headerIndex > 5) break; // Don't search too far
    }
    console.log('📊 Collected values after header:', collected);
    if (collected.length >= 7) {
      assignHours(collected);
    }
  }
  
  // Try to find hours in a single line after days
  if (Object.values(dailyHours).every(h => h === null)) {
    const daysLine = lines.findIndex(line => 
      /sat.*sun.*mon.*tue.*wed.*thu.*fri/i.test(line.toLowerCase())
    );
    if (daysLine !== -1 && daysLine + 1 < lines.length) {
      const nextLine = lines[daysLine + 1];
      const numbers = nextLine.match(/\d+(?:\.\d+)?/g);
      if (numbers && numbers.length >= 7) {
        console.log('📊 Found hours in single line:', numbers);
        assignHours(numbers);
      }
    }
  }

  // Fallback: look for patterns like "Mon: 8" or "Monday - 8"
  const dayHourRegex = /(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)[\s.:\-=]+(-?\d+(?:\.\d+)?)/gi;
  let dayMatch;
  while ((dayMatch = dayHourRegex.exec(normalizedText)) !== null) {
    const key = dayMatch[1].slice(0, 3).toLowerCase();
    const hours = parseHoursValue(dayMatch[2]);
    setDayHour(key, hours);
  }

  // Fallback: parse delimited lines (CSV-like)
  lines.forEach(line => {
    const tokens = line.split(/[\s,|\t]+/).filter(Boolean);
    if (tokens.length < 2) return;
    const potentialDay = tokens[0].slice(0, 3).toLowerCase();
    const potentialHours = parseHoursValue(tokens[tokens.length - 1]);
    if (dayKeys.includes(potentialDay)) {
      setDayHour(potentialDay, potentialHours);
    }
  });

  // Fallback: scan token stream for day followed by value(s)
  const rawTokens = normalizedText.split(/\s+/).filter(Boolean);
  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    const key = token.slice(0, 3).toLowerCase();
    if (!dayKeys.includes(key)) continue;

    if (dailyHours[key] !== null) continue;

    let value;
    for (let lookahead = 1; lookahead <= 3; lookahead += 1) {
      const candidate = rawTokens[i + lookahead];
      const parsed = parseHoursValue(candidate);
      if (parsed !== null) {
        value = parsed;
        break;
      }
    }

    if (value) {
      setDayHour(key, value);
    }
  }

  // Calculate total from daily hours
  totalHours = dayKeys.reduce((sum, key) => sum + (dailyHours[key] ?? 0), 0);
  
  console.log('📊 Daily hours before total check:', dailyHours);
  console.log('📊 Calculated total hours:', totalHours);

  // If no total calculated, try to find it in text
  if (totalHours === 0) {
    const totalMatch = normalizedText.match(/(?:total\s*hours?|grand\s*total)[^\d]*(\d+(?:\.\d+)?)/i) ||
                       normalizedText.match(/\b(\d+[.,]\d{2})\b(?!.+\d)/i);
    if (totalMatch) {
      const parsedTotal = parseHoursValue(totalMatch[1], { allowLarge: true });
      if (parsedTotal !== null) {
        console.log('📊 Found total hours in text:', parsedTotal);
        totalHours = parsedTotal;
      }
    }
  }

  // If we have a total but no daily breakdown, distribute evenly
  if (totalHours > 0 && Object.values(dailyHours).every(hours => hours === null || hours === 0)) {
    console.log('📊 Distributing total hours across work days');
    const workDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
    const perDay = parseFloat((totalHours / workDays.length).toFixed(2));
    workDays.forEach(key => {
      dailyHours[key] = perDay;
    });
  }

  const resolvedDailyHours = dayKeys.reduce((acc, key) => ({ ...acc, [key]: dailyHours[key] ?? 0 }), {});
  
  // Recalculate total after resolution
  totalHours = Object.values(resolvedDailyHours).reduce((sum, hours) => sum + hours, 0);
  
  console.log('📊 Final resolved daily hours:', resolvedDailyHours);
  console.log('📊 Final total hours:', totalHours);

  const nonZeroDays = Object.values(resolvedDailyHours).filter(hours => hours > 0).length;
  let confidence = 0.2;
  if (totalHours > 0) confidence += 0.4;
  if (nonZeroDays >= 3) confidence += 0.2;
  if (employeeName) confidence += 0.1;
  if (weekStart && weekEnd) confidence += 0.1;

  const result = {
    success: totalHours > 0 || nonZeroDays > 0,
    dailyHours: resolvedDailyHours,
    totalHours,
    employeeName,
    clientName,
    projectName,
    weekStart,
    weekEnd,
    extractedText: text,
    confidence: Math.min(confidence, 1)
  };

  console.log('🎯 Final parsed result:', result);
  return result;
};

/**
 * Parse Excel/CSV data with enhanced format detection
 * Handles multiple timesheet formats
 */
const parseExcelData = (data) => {
  const dailyHours = {
    sat: 0,
    sun: 0,
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0
  };
  
  let totalHours = 0;
  let employeeName = '';
  let clientName = '';
  let projectName = '';
  let weekStart = '';
  let weekEnd = '';
  
  if (!data || data.length === 0) {
    throw new Error('Empty or invalid Excel file');
  }
  
  console.log('📊 Parsing Excel data, rows:', data.length);
  
  // Map day names to keys (more comprehensive)
  const dayMap = {
    'monday': 'mon', 'mon': 'mon', 'm': 'mon',
    'tuesday': 'tue', 'tue': 'tue', 't': 'tue', 'tues': 'tue',
    'wednesday': 'wed', 'wed': 'wed', 'w': 'wed',
    'thursday': 'thu', 'thu': 'thu', 'th': 'thu', 'thur': 'thu', 'thurs': 'thu',
    'friday': 'fri', 'fri': 'fri', 'f': 'fri',
    'saturday': 'sat', 'sat': 'sat', 's': 'sat',
    'sunday': 'sun', 'sun': 'sun', 'su': 'sun'
  };
  
  // Search for employee name, client, project in entire sheet
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    for (let j = 0; j < Math.min(row.length, 5); j++) {
      const cell = String(row[j] || '').toLowerCase().trim();
      const nextCell = row[j + 1] ? String(row[j + 1]).trim() : '';
      
      if ((cell.includes('employee') || cell.includes('emp name')) && nextCell && !employeeName) {
        employeeName = nextCell;
      }
      if ((cell.includes('client') || cell.includes('vendor')) && nextCell && !clientName) {
        clientName = nextCell;
      }
      if (cell.includes('project') && nextCell && !projectName) {
        projectName = nextCell;
      }
      if ((cell.includes('week') || cell.includes('period')) && nextCell) {
        const dateMatch = nextCell.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g);
        if (dateMatch && dateMatch.length >= 2) {
          weekStart = dateMatch[0];
          weekEnd = dateMatch[1];
        }
      }
    }
  }
  
  // Find the row with day headers
  let headerRowIndex = -1;
  let dayColIndex = -1;
  let hoursColIndex = -1;
  
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase().trim();
      
      // Check if this row contains day headers
      if (cell.includes('day') || cell === 'mon' || cell === 'monday') {
        headerRowIndex = i;
        dayColIndex = j;
        
        // Find hours column
        for (let k = j + 1; k < row.length; k++) {
          const headerCell = String(row[k] || '').toLowerCase().trim();
          if (headerCell.includes('hour') || headerCell.includes('hrs')) {
            hoursColIndex = k;
            break;
          }
        }
        
        // If no hours column found, assume next column
        if (hoursColIndex === -1 && j + 1 < row.length) {
          hoursColIndex = j + 1;
        }
        break;
      }
    }
    
    if (headerRowIndex !== -1) break;
  }
  
  console.log('📊 Found header row:', headerRowIndex, 'Day col:', dayColIndex, 'Hours col:', hoursColIndex);
  
  // Extract hours data
  if (headerRowIndex !== -1 && dayColIndex !== -1 && hoursColIndex !== -1) {
    // Process rows after header
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const dayCell = String(row[dayColIndex] || '').toLowerCase().trim();
      const hoursCell = row[hoursColIndex];
      
      // Skip empty or non-day rows
      if (!dayCell) continue;
      
      const dayKey = dayMap[dayCell];
      if (dayKey) {
        const hours = parseFloat(hoursCell) || 0;
        dailyHours[dayKey] = hours;
        totalHours += hours;
        console.log(`📊 Extracted ${dayKey}: ${hours} hours`);
      }
    }
  } else {
    // Fallback: Try to find days and hours in any format
    console.log('📊 Using fallback parsing method');
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;
      
      for (let j = 0; j < row.length - 1; j++) {
        const cell = String(row[j] || '').toLowerCase().trim();
        const dayKey = dayMap[cell];
        
        if (dayKey) {
          const hours = parseFloat(row[j + 1]) || 0;
          if (hours > 0 && hours <= 24) {
            dailyHours[dayKey] = hours;
            totalHours += hours;
            console.log(`📊 Fallback extracted ${dayKey}: ${hours} hours`);
          }
        }
      }
    }
  }
  
  // Calculate confidence
  const nonZeroDays = Object.values(dailyHours).filter(h => h > 0).length;
  let confidence = 0.5;
  if (totalHours > 0) confidence += 0.3;
  if (nonZeroDays >= 3) confidence += 0.1;
  if (employeeName) confidence += 0.1;
  
  console.log('📊 Final extraction:', { totalHours, nonZeroDays, employeeName, confidence });
  
  return {
    success: totalHours > 0,
    dailyHours,
    totalHours,
    employeeName,
    clientName,
    projectName,
    weekStart,
    weekEnd,
    rawData: data,
    confidence: Math.min(confidence, 1),
    source: 'excel'
  };
};

/**
 * Validate extracted data
 */
const validateExtractedData = (data) => {
  const errors = [];
  const warnings = [];
  
  if (!data.success) {
    errors.push('Data extraction failed');
  }
  
  if (data.totalHours === 0) {
    errors.push('No hours found in the file');
  }
  
  if (data.totalHours > 168) {
    errors.push('Total hours exceed maximum (168 hours per week)');
  }
  
  // Check individual days
  for (const [day, hours] of Object.entries(data.dailyHours || {})) {
    if (hours > 24) {
      errors.push(`${day.toUpperCase()} hours exceed 24 hours`);
    }
    if (hours < 0) {
      errors.push(`${day.toUpperCase()} hours cannot be negative`);
    }
  }
  
  // Add warnings for low confidence
  if (data.confidence && data.confidence < 0.5) {
    warnings.push('Low confidence extraction. Please verify the extracted data.');
  }
  
  if (!data.employeeName) {
    warnings.push('Employee name not found in document');
  }
  
  if (!data.clientName) {
    warnings.push('Client name not found in document');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Named exports for individual functions
export {
  extractFromImage,
  extractFromExcel,
  extractFromPDF,
  extractFromCSV,
  extractFromWord,
  parseTimesheetText,
  validateExtractedData,
  parseExcelData
};

// Default export for backwards compatibility
const timesheetExtractor = {
  extractTimesheetData,
  extractFromImage,
  extractFromExcel,
  extractFromPDF,
  extractFromCSV,
  extractFromWord,
  parseTimesheetText,
  parseExcelData,
  validateExtractedData
};

export default timesheetExtractor;
