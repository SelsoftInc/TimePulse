#!/usr/bin/env python3
"""
Simple TimePulse Engine Server
A basic FastAPI server for testing without Azure dependencies.
"""

import os
import sys
import json
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TimePulse Engine API (Simple)",
    description="Basic timesheet to invoice conversion service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "TimePulse Engine API is running",
        "status": "healthy",
        "version": "1.0.0 (Simple Mode)",
        "features": ["basic_processing", "file_upload", "mock_analysis"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "TimePulse Engine (Simple)",
        "timestamp": "2025-01-26T10:54:25-05:00"
    }

@app.get("/analyze-document")
async def analyze_document(document_url: str = Header(..., alias="document-url")):
    """
    Mock document analysis endpoint
    Returns sample timesheet data for testing
    """
    try:
        logger.info(f"Analyzing document: {document_url}")
        
        # Mock response for testing
        mock_response = {
            "status": "Processed successfully",
            "results": {
                "Entry": [
                    {
                        "Vendor_Name": "John Doe Consulting",
                        "Total Hours": "40",
                        "Duration": "01/20/2025 to 01/26/2025"
                    }
                ]
            },
            "cost": "Total Cost (USD): $0.05"
        }
        
        return mock_response
        
    except Exception as e:
        logger.error(f"Error analyzing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-document")
async def process_document(content: str):
    """
    Mock document content processing
    """
    try:
        logger.info("Processing document content")
        
        # Mock response
        mock_response = {
            "summary": f"Processed document with {len(content)} characters. This is a mock response for testing.",
            "cost": "Total Cost (USD): $0.02"
        }
        
        return mock_response
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/")
async def upload_and_process(file: UploadFile = File(...)):
    """
    Mock file upload and processing
    Compatible with the Flask app endpoint
    """
    try:
        logger.info(f"Processing uploaded file: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        # Mock processing based on file type
        file_ext = file.filename.split('.')[-1].lower() if file.filename else 'unknown'
        
        mock_data = {
            "Vendor Name": "Sample Vendor",
            "Start Date": "01/20/2025",
            "End Date": "01/26/2025",
            "Total Hours": {
                "Billable Project Hrs": "35",
                "Non-Billable Project Hrs": "3",
                "Time off/Holiday Hrs": "2"
            },
            "Invoice Amount": "$3500.00"
        }
        
        return mock_data
        
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/convert-docx-to-pdf")
async def convert_docx_to_pdf(docx_url: str = Header(..., alias="docx-url")):
    """
    Mock DOCX to PDF conversion
    """
    try:
        logger.info(f"Converting DOCX to PDF: {docx_url}")
        
        # In a real implementation, this would convert the file
        # For now, return a mock response
        return JSONResponse(
            content={"message": "Mock PDF conversion completed"},
            headers={"Content-Type": "application/json"}
        )
        
    except Exception as e:
        logger.error(f"Error converting DOCX: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Serve static files if available
uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
if os.path.exists(templates_dir):
    app.mount("/static", StaticFiles(directory=templates_dir), name="static")

def main():
    """Main entry point"""
    host = os.getenv("ENGINE_HOST", "127.0.0.1")
    port = int(os.getenv("ENGINE_PORT", "8000"))
    
    logger.info(f"Starting Simple TimePulse Engine Server on {host}:{port}")
    logger.info("This is a mock server for testing without Azure dependencies")
    
    try:
        uvicorn.run(
            app,
            host=host,
            port=port,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
