# TimePulse Engine - Timesheet to Invoice Conversion

This engine provides AI-powered timesheet document analysis and invoice generation capabilities for the TimePulse application.

## Features

- **Document Analysis**: Extract structured data from timesheet documents (PDF, DOCX, XLSX, images)
- **AI Processing**: Use Azure OpenAI and Document Intelligence services for accurate data extraction
- **Invoice Generation**: Automatically convert timesheet data to invoice format
- **Multiple Formats**: Support for various document formats and file uploads
- **REST API**: FastAPI-based service with comprehensive documentation

## Setup Instructions

### 1. Install Dependencies

```bash
cd engine
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the template and fill in your Azure credentials:

```bash
cp .env.template .env
```

Edit `.env` file with your Azure credentials:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name

# Azure Document Intelligence Configuration
DOCUMENTINTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
DOCUMENTINTELLIGENCE_API_KEY=your_document_intelligence_api_key
```

### 3. Start the Engine Server

```bash
# Using the server script (recommended)
python server.py

# Or directly with uvicorn
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Or using the Flask app (alternative)
python app3.py
```

The server will start on `http://127.0.0.1:8000` by default.

### 4. Verify Installation

Visit `http://127.0.0.1:8000/docs` to see the API documentation.

## API Endpoints

### FastAPI Endpoints (main.py)

- `GET /analyze-document` - Analyze a document from URL
- `POST /convert-docx-to-pdf` - Convert DOCX files to PDF
- `POST /process-document` - Process document content directly

### Flask Endpoints (app3.py)

- `POST /` - Upload and process timesheet files
- `GET /` - Web interface for file upload

## Frontend Integration

The TimePulse frontend includes:

1. **TimesheetToInvoice Component** (`/timesheets/to-invoice`)
   - Upload timesheet documents
   - Configure client information
   - Preview extracted data
   - Generate invoice data

2. **InvoiceForm Component** (`/invoices/create`)
   - Create invoices manually or from timesheet data
   - Edit and customize invoice details
   - Save as draft or finalize

3. **Engine Service** (`engineService.js`)
   - API client for engine communication
   - Data transformation utilities
   - Health check functionality

## Usage Workflow

1. **Upload Timesheet**: Use the "Convert to Invoice" button in TimesheetSummary
2. **Process Document**: Engine analyzes the document using AI
3. **Review Data**: Preview extracted timesheet information
4. **Generate Invoice**: Transform data to invoice format
5. **Customize**: Edit invoice details in InvoiceForm
6. **Save**: Create final invoice or save as draft

## Supported File Formats

- **PDF**: Text extraction and OCR fallback
- **DOCX**: Text and embedded image extraction
- **XLSX**: Cell data and embedded image OCR
- **Images**: PNG, JPG, JPEG with OCR processing

## Configuration Options

### Server Configuration

```env
ENGINE_HOST=127.0.0.1        # Server host
ENGINE_PORT=8000             # Server port
ENGINE_RELOAD=true           # Auto-reload on changes
ENGINE_LOG_LEVEL=info        # Logging level
```

### Frontend Configuration

Add to your React `.env` file:

```env
REACT_APP_ENGINE_API_URL=http://localhost:8000
```

## Troubleshooting

### Common Issues

1. **Engine Service Unavailable**
   - Check if the server is running on the correct port
   - Verify CORS configuration allows your frontend domain
   - Check firewall settings

2. **Azure Credentials Error**
   - Verify your Azure OpenAI and Document Intelligence credentials
   - Check endpoint URLs and API keys
   - Ensure your Azure resources are active

3. **Document Processing Fails**
   - Check file format is supported
   - Verify file is not corrupted
   - Check Azure service quotas and limits

4. **CORS Issues**
   - Update allowed origins in `server.py`
   - Check frontend URL matches CORS configuration

### Logs and Debugging

- Server logs are displayed in the console
- Check browser network tab for API request/response details
- Use `/docs` endpoint to test API directly

## Development

### Adding New Features

1. **New Document Types**: Extend processing functions in `main.py` or `app3.py`
2. **Custom AI Prompts**: Modify prompt templates for different extraction needs
3. **Additional Endpoints**: Add new routes to the FastAPI application

### Testing

```bash
# Test document analysis
curl -X GET "http://localhost:8000/analyze-document" \
  -H "document-url: https://example.com/timesheet.pdf"

# Test health check
curl http://localhost:8000/health
```

## Security Considerations

- Store API keys securely in `.env` file
- Use HTTPS in production
- Implement proper authentication for production use
- Validate and sanitize file uploads
- Monitor API usage and costs

## Production Deployment

1. Set up proper environment variables
2. Use a production WSGI server (gunicorn, etc.)
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Monitor logs and performance
6. Implement backup and recovery procedures

## Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review logs for error details
3. Verify Azure service status
4. Check network connectivity

## License

This engine is part of the TimePulse application suite.
