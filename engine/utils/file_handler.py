import os
import tempfile
from pathlib import Path
from fastapi import UploadFile
from loguru import logger
from typing import Optional


class FileHandler:
    """Handle file operations"""
    
    @staticmethod
    async def save_temp_file(file: UploadFile) -> tuple[str, str]:
        """
        Save uploaded file to temporary location
        
        Args:
            file: Uploaded file
        
        Returns:
            Tuple of (temp_file_path, simple_filename)
        """
        try:
            logger.info(f"Received file: {file.filename}")
            
            # Get file extension
            file_extension = Path(file.filename).suffix.lower()
            
            # Create a simple, Bedrock-compliant filename
            simple_filename = f"document{file_extension}"
            logger.info(f"Using simplified filename for Bedrock: {simple_filename}")
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=file_extension
            ) as temp_file:
                # Read and write file content
                content = await file.read()
                
                # Validate content
                if not content or len(content) == 0:
                    raise ValueError(f"Uploaded file {file.filename} is empty")
                
                logger.info(f"Read {len(content)} bytes from uploaded file")
                
                temp_file.write(content)
                temp_file.flush()  # Ensure content is written
                temp_file_path = temp_file.name
                
            # Verify the file was written correctly
            if os.path.exists(temp_file_path):
                file_size = os.path.getsize(temp_file_path)
                logger.info(f"Saved temporary file: {temp_file_path} (size: {file_size} bytes) | Bedrock name: {simple_filename}")
                
                if file_size == 0:
                    raise ValueError(f"Temporary file was written but is empty")
            else:
                raise ValueError(f"Failed to create temporary file at {temp_file_path}")
            
            # Return both path and simple filename for downstream callers
            return temp_file_path, simple_filename
            
        except Exception as e:
            logger.error(f"Error saving temporary file: {str(e)}")
            raise
    
    @staticmethod
    def cleanup_temp_file(file_path: str) -> None:
        """Remove temporary file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Removed temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Could not remove temp file {file_path}: {str(e)}")
