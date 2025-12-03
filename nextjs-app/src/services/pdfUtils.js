import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

// Set the worker source
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

/**
 * Extract text from PDF file
 * @param {File} file - PDF file to extract text from
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async () => {
      try {
        const typedArray = new Uint8Array(fileReader.result);
        const loadingTask = pdfjs.getDocument(typedArray);
        const pdfDocument = await loadingTask.promise;
        
        let fullText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        
        resolve(fullText.trim());
      } catch (error) {
        console.error('Error extracting text from PDF:', error);
        reject(new Error('Failed to extract text from PDF'));
      }
    };
    
    fileReader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new Error('Failed to read PDF file'));
    };
    
    fileReader.readAsArrayBuffer(file);
  });
};

export default {
  extractTextFromPdf
};
