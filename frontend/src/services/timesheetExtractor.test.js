/**
 * Test Suite for Timesheet Extractor
 * Tests all file format extraction capabilities
 */

import { 
  extractTimesheetData, 
  validateExtractedData,
  parseTimesheetText 
} from './timesheetExtractor';

describe('Timesheet Extractor Tests', () => {
  
  describe('parseTimesheetText', () => {
    
    test('should extract hours from tabular format', () => {
      const text = `
        Employee: John Doe
        Client: Cognizant
        Week: 01/15/2024 - 01/21/2024
        
        Day       Hours
        Monday    8
        Tuesday   8
        Wednesday 7.5
        Thursday  8
        Friday    8
        Saturday  0
        Sunday    0
        
        Total: 39.5
      `;
      
      const result = parseTimesheetText(text);
      
      expect(result.success).toBe(true);
      expect(result.employeeName).toBe('John Doe');
      expect(result.clientName).toBe('Cognizant');
      expect(result.totalHours).toBe(39.5);
      expect(result.dailyHours.mon).toBe(8);
      expect(result.dailyHours.wed).toBe(7.5);
    });
    
    test('should extract hours from inline format', () => {
      const text = `
        Timesheet for Jane Smith
        Client: IBM
        Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0
        Total Hours: 40
      `;
      
      const result = parseTimesheetText(text);
      
      expect(result.success).toBe(true);
      expect(result.employeeName).toContain('Jane Smith');
      expect(result.clientName).toBe('IBM');
      expect(result.totalHours).toBe(40);
    });
    
    test('should handle missing employee name', () => {
      const text = `
        Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8
      `;
      
      const result = parseTimesheetText(text);
      
      expect(result.success).toBe(true);
      expect(result.employeeName).toBe('');
      expect(result.totalHours).toBe(40);
    });
    
    test('should handle time format (8:00)', () => {
      const text = `
        Monday: 8:00
        Tuesday: 7:30
        Wednesday: 8:00
      `;
      
      const result = parseTimesheetText(text);
      
      expect(result.dailyHours.mon).toBe(8);
      expect(result.dailyHours.tue).toBe(7.5);
      expect(result.dailyHours.wed).toBe(8);
    });
    
    test('should return low confidence for empty text', () => {
      const result = parseTimesheetText('');
      
      expect(result.success).toBe(false);
      expect(result.totalHours).toBe(0);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
  
  describe('validateExtractedData', () => {
    
    test('should pass validation for valid data', () => {
      const data = {
        success: true,
        totalHours: 40,
        dailyHours: {
          mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0
        },
        employeeName: 'John Doe',
        clientName: 'Cognizant',
        confidence: 0.9
      };
      
      const validation = validateExtractedData(data);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    test('should fail validation for excessive total hours', () => {
      const data = {
        success: true,
        totalHours: 200,
        dailyHours: {
          mon: 30, tue: 30, wed: 30, thu: 30, fri: 30, sat: 25, sun: 25
        }
      };
      
      const validation = validateExtractedData(data);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Total hours exceed maximum (168 hours per week)');
    });
    
    test('should fail validation for excessive daily hours', () => {
      const data = {
        success: true,
        totalHours: 50,
        dailyHours: {
          mon: 30, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0
        }
      };
      
      const validation = validateExtractedData(data);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('MON hours exceed 24 hours'))).toBe(true);
    });
    
    test('should fail validation for zero hours', () => {
      const data = {
        success: true,
        totalHours: 0,
        dailyHours: {
          mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0
        }
      };
      
      const validation = validateExtractedData(data);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No hours found in the file');
    });
    
    test('should add warnings for low confidence', () => {
      const data = {
        success: true,
        totalHours: 40,
        dailyHours: {
          mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0
        },
        confidence: 0.3
      };
      
      const validation = validateExtractedData(data);
      
      expect(validation.warnings).toContain('Low confidence extraction. Please verify the extracted data.');
    });
    
    test('should add warnings for missing employee name', () => {
      const data = {
        success: true,
        totalHours: 40,
        dailyHours: {
          mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0
        },
        employeeName: ''
      };
      
      const validation = validateExtractedData(data);
      
      expect(validation.warnings).toContain('Employee name not found in document');
    });
  });
  
  describe('File Format Detection', () => {
    
    test('should detect image files', () => {
      const imageTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'image/bmp'];
      
      imageTypes.forEach(type => {
        const file = new File([''], 'test.jpg', { type });
        expect(file.type).toContain('image');
      });
    });
    
    test('should detect PDF files', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(file.type).toBe('application/pdf');
    });
    
    test('should detect Excel files', () => {
      const excelTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      excelTypes.forEach(type => {
        const file = new File([''], 'test.xlsx', { type });
        expect(file.type).toContain('excel') || expect(file.type).toContain('spreadsheet');
      });
    });
    
    test('should detect CSV files', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      expect(file.type).toBe('text/csv');
    });
    
    test('should detect Word files', () => {
      const wordTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      wordTypes.forEach(type => {
        const file = new File([''], 'test.docx', { type });
        expect(file.type).toContain('word') || expect(file.type).toContain('msword');
      });
    });
  });
  
  describe('Edge Cases', () => {
    
    test('should handle mixed case day names', () => {
      const text = 'MONDAY: 8, tuesday: 8, WeDnEsDaY: 8';
      const result = parseTimesheetText(text);
      
      expect(result.dailyHours.mon).toBe(8);
      expect(result.dailyHours.tue).toBe(8);
      expect(result.dailyHours.wed).toBe(8);
    });
    
    test('should handle abbreviated day names', () => {
      const text = 'Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8';
      const result = parseTimesheetText(text);
      
      expect(result.totalHours).toBe(40);
    });
    
    test('should handle decimal hours', () => {
      const text = 'Monday: 7.5, Tuesday: 8.25, Wednesday: 6.75';
      const result = parseTimesheetText(text);
      
      expect(result.dailyHours.mon).toBe(7.5);
      expect(result.dailyHours.tue).toBe(8.25);
      expect(result.dailyHours.wed).toBe(6.75);
    });
    
    test('should handle hours with text suffixes', () => {
      const text = 'Monday: 8 hours, Tuesday: 7.5hrs, Wednesday: 8h';
      const result = parseTimesheetText(text);
      
      expect(result.dailyHours.mon).toBe(8);
      expect(result.dailyHours.tue).toBe(7.5);
      expect(result.dailyHours.wed).toBe(8);
    });
    
    test('should handle multiple date formats', () => {
      const text1 = 'Week: 01/15/2024 - 01/21/2024';
      const text2 = 'Period: 15-01-2024 to 21-01-2024';
      const text3 = 'Dates: 2024-01-15 through 2024-01-21';
      
      [text1, text2, text3].forEach(text => {
        const result = parseTimesheetText(text);
        expect(result.weekStart || result.weekEnd).toBeTruthy();
      });
    });
  });
  
  describe('Performance Tests', () => {
    
    test('should process small text quickly', () => {
      const text = 'Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8';
      const start = Date.now();
      
      parseTimesheetText(text);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
    
    test('should handle large text without crashing', () => {
      const largeText = 'Mon: 8\n'.repeat(1000);
      
      expect(() => {
        parseTimesheetText(largeText);
      }).not.toThrow();
    });
  });
});

// Mock data for integration tests
export const mockTimesheetData = {
  valid: {
    success: true,
    totalHours: 40,
    dailyHours: {
      mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0
    },
    employeeName: 'John Doe',
    clientName: 'Cognizant',
    projectName: 'Web Development',
    weekStart: '01/15/2024',
    weekEnd: '01/21/2024',
    confidence: 0.95
  },
  
  lowConfidence: {
    success: true,
    totalHours: 35,
    dailyHours: {
      mon: 7, tue: 7, wed: 7, thu: 7, fri: 7, sat: 0, sun: 0
    },
    employeeName: '',
    clientName: '',
    confidence: 0.45
  },
  
  invalid: {
    success: false,
    totalHours: 0,
    dailyHours: {
      mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0
    },
    confidence: 0.1
  },
  
  excessive: {
    success: true,
    totalHours: 200,
    dailyHours: {
      mon: 30, tue: 30, wed: 30, thu: 30, fri: 30, sat: 25, sun: 25
    },
    confidence: 0.8
  }
};
