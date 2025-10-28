from fastapi import UploadFile, HTTPException
from pathlib import Path
from loguru import logger
from config import Settings


async def validate_file(file: UploadFile, settings: Settings) -> None:
    """
    Validate uploaded file
    
    Args:
        file: Uploaded file
        settings: Application settings
    
    Raises:
        HTTPException: If file is invalid
    """
    # Check if file is provided
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file extension
    file_extension = Path(file.filename).suffix.lower().replace('.', '')
    
    if file_extension not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400,
            detail=f"File type '.{file_extension}' not allowed. Allowed types: {', '.join(settings.allowed_extensions_list)}"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Move to end of file
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    logger.info(f"File validated: {file.filename} ({file_size} bytes)")
