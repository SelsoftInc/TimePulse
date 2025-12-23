# Timesheet Extractor API

A high-performance FastAPI application that extracts structured timesheet data from various document formats using **AWS Bedrock Claude** in a **unified single-model pipeline**.

## 🚀 Key Features

- ⚡ **Single Model Pipeline**: One Bedrock Claude call does everything - **3x faster** than multi-step approaches
- 📊 **Multiple Document Formats**: PNG, JPG, JPEG, PDF, CSV, DOCX, XLSX
- 🤖 **Direct Vision Processing**: Claude analyzes images/PDFs directly - no separate OCR needed
- � **Smart Extraction**: AI understands context, handles tables, multiple employees, and various formats
- 📝 **Structured JSON Output**: Clean, validated timesheet data ready to use
- 🔒 **Production Ready**: Error handling, logging, CORS, file validation
- 🐳 **Docker Support**: Containerized deployment

## 💡 How It Works

**Traditional Multi-Step Approach (Slow):**
```
Document → IDP/OCR → Text → LLM → JSON
         (2-5 sec)  (1-3 sec)
         Total: 3-8 seconds
```

**Our Unified Pipeline (Fast):**
```
Document → Bedrock Claude → JSON
         (1-2 seconds only!)
```

One model call extracts text AND structures data simultaneously!

## Quick Start

### Prerequisites

- Python 3.8+
- AWS Bedrock access (AWS credentials)
- Bedrock Claude model access enabled in your region

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd TImepulse-InvoiceBackend-SELSOFT
   ```

2. **Install dependencies:**
   ```bash
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

4. **Set your AWS Bedrock credentials in `.env`:**
   ```env
   AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
   AWS_REGION=us-east-1
   CLAUDE_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
   ```

5. **Run the application:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Access the application:**
   - Web Interface: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## 🧪 Testing with Postman

### Quick Postman Setup

1. **Create a New Request**
   - Method: **POST**
   - URL: `http://localhost:8000/api/v1/timesheet/extract`

2. **Configure Request Body**
   - Go to **Body** tab
   - Select **form-data**
   - Add key: `file` (change type from "Text" to **"File"**)
   - Click "Select Files" and choose your timesheet document (PDF/PNG/etc.)

3. **Send Request**
   - Click **Send**
   - View the extracted timesheet data in JSON format

### Import Postman Collection

Save this as `timesheet-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Timesheet Extractor API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Extract Timesheet",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": []
            }
          ]
        },
        "url": {
          "raw": "http://localhost:8000/api/v1/timesheet/extract",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8000",
          "path": ["api", "v1", "timesheet", "extract"]
        }
      },
      "response": []
    },
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:8000/health"
      }
    }
  ]
}
```

Then: **Import** → Paste JSON → **Import**

### Expected Response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully extracted 1 employee timesheet(s)",
  "data": [
    {
      "client_id": null,
      "client_name": "John Doe",
      "employee_name": null,
      "week_hours": [
        {"day": "Mon", "hours": 8.0},
        {"day": "Tue", "hours": 7.5},
        {"day": "Wed", "hours": 8.0},
        {"day": "Thu", "hours": 8.0},
        {"day": "Fri", "hours": 6.0},
        {"day": "Sat", "hours": 0.0},
        {"day": "Sun", "hours": 0.0}
      ],
      "total_hours": 37.5
    }
  ],
  "metadata": {
    "filename": "document.png",
    "file_type": "png",
    "employees_count": 1
  }
}
```

**Error Response (400/500):**
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Testing Tips

- ✅ Make sure the FastAPI server is running (`uvicorn main:app --reload`)
- ✅ Check the terminal logs for detailed processing information
- ✅ You'll see "FULL MODEL RESPONSE" in logs showing exactly what Claude returned
- ✅ Start with a clear, high-quality timesheet image for best results
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set your Bedrock / Claude credentials in `.env`:**
```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1
CLAUDE_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

5. **Run the application:**
   ```bash
   python main.py
   ```

6. **Access the application:**
   - Web Interface: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | `Timesheet Generator API` |
| `APP_VERSION` | Application version | `1.0.0` |
| `DEBUG` | Debug mode | `False` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `BEDROCK_CLAUDE_API_KEY` | Bedrock / Claude API key or token | Optional |
| `BEDROCK_CLAUDE_MODEL` | Bedrock model id or full invoke URL | `anthropic.claude-v1` |
| `CLAUDE_MODEL_ID` | Claude model id for boto3 usage | Optional |
| `BEDROCK_IDP_ENDPOINT` | Optional Bedrock IDP endpoint for document processing | (empty) |
| `MAX_FILE_SIZE_MB` | Maximum file size | `10` |
| `ALLOWED_EXTENSIONS` | Allowed file types | `png,jpg,jpeg,pdf,csv,docx,xlsx` |
| `CORS_ORIGINS` | CORS allowed origins | `https://goggly-casteless-torri.ngrok-free.dev,http://localhost:8000` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `RATE_LIMIT_PER_MINUTE` | API rate limit | `30` |

| `BEDROCK_CLAUDE_API_KEY` | Bedrock / Claude API key or token | Optional |

### Extract Timesheet Data
- **POST** `/api/v1/timesheet/extract`
- Upload a timesheet document and extract structured data
- **Request**: Multipart form with file
- **Response**: JSON with extracted timesheet data

### Batch Processing
- **POST** `/api/v1/timesheet/extract-batch`
- Process multiple documents at once (max 10 files)

### Health Check
- **GET** `/health`
- Returns application health status

## Supported File Formats

| Format | Description | OCR Required |
|--------|-------------|--------------|
| **PNG/JPG/JPEG** | Image files with timesheet data | ✅ Bedrock IDP (if configured) |
| **PDF** | PDF documents | ❌ |
| **CSV** | Comma-separated values | ❌ |
| **DOCX** | Microsoft Word documents | ❌ |
| **XLSX** | Microsoft Excel spreadsheets | ❌ |

## OCR Technology

This application can use a Bedrock IDP endpoint for optical character recognition, which:
- ✅ Requires no system-level dependencies on the application host
- ✅ Works with managed Bedrock runtimes or proxies
- ✅ Supports multiple languages and can return structured fields
- ✅ Scales without local GPU requirements

### Why Bedrock IDP?

- **Managed Service**: Offloads OCR/IDP to a managed runtime (Bedrock or your chosen provider)
- **Higher Accuracy**: Use IDP models trained for document extraction
- **Scalable**: No need to manage local OCR resources
- **Flexible**: Return structured outputs (text, fields, detected entities)

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

### Using Docker

```bash
# Build image
docker build -t timesheet-generator .

# Run container
docker run -p 8000:8000 \
   -e AWS_ACCESS_KEY_ID=your_key_here \
   -e AWS_SECRET_ACCESS_KEY=your_secret_here \
  timesheet-generator
```

## Development

### Project Structure

```
TImepulse-InvoiceBackend-SELSOFT/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration management
├── models.py              # Pydantic models
├── routers/               # API route handlers
│   └── timesheet.py       # Timesheet extraction endpoints
├── services/              # Business logic
│   └── llm_service.py     # Unified Bedrock Claude service
├── utils/                 # Utility functions
│   ├── file_handler.py    # File upload/temp handling
│   └── validators.py      # Input validation
├── frontend/              # Web interface
│   ├── index.html
│   ├── script.js
│   └── styles.css
└── tests/                 # Test files
    └── test_api.postman_collection.json
```

### Running Tests

```bash
pytest tests/
```

### Logging

The application uses structured logging with Loguru:
- Console output with colors
- File rotation (10MB files, 7 days retention)
- Configurable log levels

## 💻 Example Usage

### Web Interface
1. Open http://localhost:8000
2. Drag and drop or browse for a timesheet file
3. Click "Extract Timesheet Data"
4. View structured results instantly

### cURL Example

```bash
curl -X POST "http://localhost:8000/api/v1/timesheet/extract" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@timesheet.pdf"
```

### Python Example

```python
import requests

# Single file upload
with open('timesheet.png', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/v1/timesheet/extract',
        files={'file': f}
    )

data = response.json()
print(f"✅ Found {data['metadata']['employees_count']} employees")
print(f"📊 Total hours: {data['data'][0]['total_hours']}")
```

### Expected Output Format

```json
{
  "success": true,
  "message": "Successfully extracted 2 employee timesheet(s)",
  "data": [
    {
      "client_id": "EMP001",
      "client_name": "John Doe",
      "employee_name": "John Doe",
      "week_hours": [
        {"day": "Mon", "hours": 8.0},
        {"day": "Tue", "hours": 8.0},
        {"day": "Wed", "hours": 7.5},
        {"day": "Thu", "hours": 8.0},
        {"day": "Fri", "hours": 8.0},
        {"day": "Sat", "hours": 0.0},
        {"day": "Sun", "hours": 0.0}
      ],
      "total_hours": 39.5
    }
  ],
  "metadata": {
    "filename": "timesheet.png",
    "file_type": "png",
    "employees_count": 1
  },
  "processed_at": "2025-10-14T18:00:00Z"
}
```

## Troubleshooting

### Common Issues

1. **Google Gemini API Errors**
   - Verify your API key is correct
   - Check your Google Cloud billing and quotas
   - Ensure the Gemini API is enabled

2. **File Upload Issues**
   - Check file size (max 10MB by default)
   - Verify file format is supported
   - Ensure CORS is configured for your domain

3. **OCR Not Working**
   - EasyOCR will download models on first use
   - Ensure internet connection for initial setup
   - Check image quality and resolution

### Performance Tips

- **Image Quality**: Higher resolution images give better OCR results
- **File Formats**: PDF and DOCX files process faster than images
- **GPU Acceleration**: Set `gpu=True` in EasyOCR for faster processing (requires CUDA)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation at `/docs`
3. Open an issue on the repository