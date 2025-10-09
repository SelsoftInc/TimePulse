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
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });

    onProgress?.({ status: 'processing', message: 'Parsing extracted text...', progress: 60 });

    const parsedData = parseTimesheetText(rawText || '');
    parsedData.source = 'word';
    parsedData.fileName = file.name;
    return parsedData;
  } catch (error) {
    console.error('📝 Word extraction failed:', error);
    throw new Error(`Failed to extract text from Word document: ${error.message}`);
  }
};

/**
 * Extract data from Excel file
 */
const extractFromExcel = async (file) => {
  console.log('📊 Extracting from Excel file...');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('📊 Excel data extracted:', jsonData);
        
        // Parse the Excel data
        const parsedData = parseExcelData(jsonData);
        
        resolve(parsedData);
      } catch (error) {
        console.error('❌ Excel parsing failed:', error);
        reject(new Error('Failed to parse Excel file. Please ensure it follows the timesheet format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
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
const extractFromCSV = async (file) => {
  console.log('📋 Extracting from CSV file...');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
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
        
        console.log('📋 CSV data extracted:', data);
        
        // Parse the CSV data
        const parsedData = parseExcelData(data); // Same parser as Excel
        
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

  // Extract client name
  const clientLine = lines.find(line => /client\s*name|client:/i.test(line));
  if (clientLine) {
    const match = clientLine.match(/(?:client\s*name|client)[:\-\s]+(.+)/i);
    if (match) {
      clientName = match[1].trim();
    }
  }
  if (!clientName) {
    const knownClient = normalizedText.match(/cognizant|jpmc|ibm|accenture|microsoft|google|amazon|tcs|infosys/i);
    if (knownClient) {
      clientName = knownClient[0];
    }
  }

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
    const collected = [];
    let i = headerIndex + 1;
    while (i < lines.length && collected.length < 7) {
      const fragments = lines[i].split(/\s+/).filter(Boolean);
      collected.push(...fragments);
      i += 1;
    }
    if (collected.length >= 7) {
      assignHours(collected);
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

  totalHours = dayKeys.reduce((sum, key) => sum + (dailyHours[key] ?? 0), 0);

  if (totalHours === 0) {
    const totalMatch = normalizedText.match(/(?:total\s*hours?|grand\s*total)[^\d]*(\d+(?:\.\d+)?)/i) ||
                       normalizedText.match(/\b(\d+[.,]\d{2})\b(?!.+\d)/i);
    if (totalMatch) {
      const parsedTotal = parseHoursValue(totalMatch[1], { allowLarge: true });
      if (parsedTotal !== null) {
        totalHours = parsedTotal;
      }
    }
  }

  if (totalHours > 0 && Object.values(dailyHours).every(hours => hours === 0)) {
    const workDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
    const perDay = parseFloat((totalHours / workDays.length).toFixed(2));
    workDays.forEach(key => {
      setDayHour(key, perDay);
    });
  }

  const resolvedDailyHours = dayKeys.reduce((acc, key) => ({ ...acc, [key]: dailyHours[key] ?? 0 }), {});

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
 * Parse Excel/CSV data
 * Expected format:
 * Row 1: Headers (Day, Hours, etc.)
 * Subsequent rows: Data
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
  let weekStart = '';
  let weekEnd = '';
  
  if (data.length === 0) {
    throw new Error('Empty file');
  }
  
  // Find header row (usually first row)
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  
  // Find column indices
  const dayCol = headers.findIndex(h => h.includes('day'));
  const hoursCol = headers.findIndex(h => h.includes('hour'));
  
  // Map day names to keys
  const dayMap = {
    'monday': 'mon',
    'mon': 'mon',
    'tuesday': 'tue',
    'tue': 'tue',
    'wednesday': 'wed',
    'wed': 'wed',
    'thursday': 'thu',
    'thu': 'thu',
    'friday': 'fri',
    'fri': 'fri',
    'saturday': 'sat',
    'sat': 'sat',
    'sunday': 'sun',
    'sun': 'sun'
  };
  
  // Process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (row.length === 0) continue;
    
    // Extract day and hours
    if (dayCol >= 0 && hoursCol >= 0) {
      const dayName = String(row[dayCol]).toLowerCase().trim();
      const hours = parseFloat(row[hoursCol]) || 0;
      
      const dayKey = dayMap[dayName];
      if (dayKey) {
        dailyHours[dayKey] = hours;
        totalHours += hours;
      }
    } else {
      // Try to parse without headers
      // Assume format: Day, Hours
      const dayName = String(row[0]).toLowerCase().trim();
      const hours = parseFloat(row[1]) || 0;
      
      const dayKey = dayMap[dayName];
      if (dayKey) {
        dailyHours[dayKey] = hours;
        totalHours += hours;
      }
    }
  }
  
  // Look for employee name in first column
  if (data.length > 0 && data[0][0]) {
    const firstCell = String(data[0][0]).toLowerCase();
    if (firstCell.includes('employee') || firstCell.includes('name')) {
      employeeName = data[1] ? String(data[1][0]) : '';
    }
  }
  
  return {
    success: true,
    dailyHours,
    totalHours,
    employeeName,
    weekStart,
    weekEnd,
    rawData: data,
    confidence: totalHours > 0 ? 'high' : 'medium'
  };
};

/**
 * Validate extracted data
 */
const validateExtractedData = (data) => {
  const errors = [];
  
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
  for (const [day, hours] of Object.entries(data.dailyHours)) {
    if (hours > 24) {
      errors.push(`${day.toUpperCase()} hours exceed 24 hours`);
    }
    if (hours < 0) {
      errors.push(`${day.toUpperCase()} hours cannot be negative`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
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
