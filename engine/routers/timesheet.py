from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
import os
from pathlib import Path
from loguru import logger

from config import get_settings, Settings
from models import TimesheetResponse, ErrorResponse
from services.llm_service import LLMService
from utils.file_handler import FileHandler
from utils.validators import validate_file


router = APIRouter(prefix="/api/v1/timesheet", tags=["Timesheet"])

# Initialize services (DocumentParser no longer needed - unified pipeline!)
llm_service = LLMService()
file_handler = FileHandler()


@router.post(
    "/extract",
    response_model=TimesheetResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Extract timesheet data from document",
    description="Upload a timesheet document (PNG, PDF, CSV, DOCX) and extract structured data",
    response_model_exclude_none=False
)
async def extract_timesheet(
    file: UploadFile = File(..., description="Timesheet document to process"),
    settings: Settings = Depends(get_settings)
):
    """
    Extract timesheet data from uploaded document
    
    - **file**: The timesheet document (PNG, JPG, PDF, CSV, DOCX, XLSX)
    
    Returns structured JSON with employee names, daily hours, and totals
    """
    temp_file_path = None
    
    try:
        logger.info(f"📥 Received file: {file.filename}")
        
        # Validate file
        await validate_file(file, settings)
        
        # Save file temporarily (returns path and sanitized filename)
        temp_file_path, sanitized_name = await file_handler.save_temp_file(file)
        
        # Get file extension
        file_extension = Path(file.filename).suffix.lower().replace('.', '')
        
        logger.info(f"🚀 Processing with UNIFIED pipeline (single model call)")
        
        # UNIFIED PIPELINE: One call does everything!
        # No more separate IDP + LLM steps - much faster!
        timesheets = await llm_service.extract_timesheet_from_document(temp_file_path, file_extension)
        
        if not timesheets:
            raise HTTPException(
                status_code=400,
                detail="No timesheet data found in document"
            )
        
        # Create response
        response = TimesheetResponse(
            success=True,
            message=f"Successfully extracted {len(timesheets)} employee timesheet(s)",
            data=timesheets,
            metadata={
                "filename": sanitized_name,
                "file_type": file_extension,
                "employees_count": len(timesheets)
            }
        )
        
        logger.info(f"✅ Successfully processed timesheet with {len(timesheets)} employees")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing timesheet: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing timesheet: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                logger.warning(f"Could not remove temp file: {str(e)}")


@router.post(
    "/extract-batch",
    response_model=List[TimesheetResponse],
    summary="Extract timesheet data from multiple documents",
    description="Upload multiple timesheet documents and extract structured data from all"
)
async def extract_timesheet_batch(
    files: List[UploadFile] = File(..., description="Multiple timesheet documents"),
    settings: Settings = Depends(get_settings)
):
    """Extract timesheet data from multiple documents"""
    
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 files allowed per batch request"
        )
    
    responses = []
    
    for file in files:
        try:
            response = await extract_timesheet(file, settings)
            responses.append(response)
        except Exception as e:
            logger.error(f"Error processing file {file.filename}: {str(e)}")
            # Continue processing other files
            responses.append(TimesheetResponse(
                success=False,
                message=f"Error: {str(e)}",
                data=[],
                metadata={"filename": file.filename, "error": str(e)}
            ))
    
    return responses
