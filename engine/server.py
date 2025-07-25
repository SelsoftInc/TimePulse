#!/usr/bin/env python3
"""
TimePulse Engine Server
A FastAPI server that provides timesheet to invoice conversion services.
"""

import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import logging

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the FastAPI application."""
    
    # Check if .env file exists
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if not os.path.exists(env_path):
        logger.warning(f".env file not found at {env_path}")
        logger.warning("Please create a .env file with your Azure credentials:")
        logger.warning("AZURE_OPENAI_ENDPOINT=your_endpoint")
        logger.warning("AZURE_OPENAI_API_KEY=your_api_key")
        logger.warning("AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment")
        logger.warning("DOCUMENTINTELLIGENCE_ENDPOINT=your_doc_intel_endpoint")
        logger.warning("DOCUMENTINTELLIGENCE_API_KEY=your_doc_intel_key")
    
    app = FastAPI(
        title="TimePulse Engine API",
        description="AI-powered timesheet to invoice conversion service",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",  # React development server
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "https://timepulse.app",  # Production domain (adjust as needed)
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Import and include routes from existing files
    try:
        # Try to import from main.py (FastAPI version)
        from main import app as main_app
        
        # Mount the main app routes
        for route in main_app.routes:
            app.router.routes.append(route)
            
        logger.info("Successfully loaded routes from main.py")
        
    except ImportError as e:
        logger.error(f"Failed to import from main.py: {e}")
        logger.info("Trying to create basic routes...")
        
        # Create basic health check route
        @app.get("/")
        async def root():
            return {"message": "TimePulse Engine API is running", "status": "healthy"}
        
        @app.get("/health")
        async def health_check():
            return {"status": "healthy", "service": "TimePulse Engine"}
    
    except Exception as e:
        logger.error(f"Error setting up routes: {e}")
        
        # Fallback basic routes
        @app.get("/")
        async def root():
            return {"message": "TimePulse Engine API is running", "status": "healthy", "error": str(e)}
    
    # Serve static files if templates directory exists
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    if os.path.exists(templates_dir):
        app.mount("/static", StaticFiles(directory=templates_dir), name="static")
        logger.info(f"Serving static files from {templates_dir}")
    
    # Serve uploads directory if it exists
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    if os.path.exists(uploads_dir):
        app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
        logger.info(f"Serving uploads from {uploads_dir}")
    
    return app

def main():
    """Main entry point for the server."""
    
    # Get configuration from environment variables
    host = os.getenv("ENGINE_HOST", "127.0.0.1")
    port = int(os.getenv("ENGINE_PORT", "8000"))
    reload = os.getenv("ENGINE_RELOAD", "true").lower() == "true"
    log_level = os.getenv("ENGINE_LOG_LEVEL", "info").lower()
    
    logger.info(f"Starting TimePulse Engine Server on {host}:{port}")
    logger.info(f"Reload: {reload}, Log Level: {log_level}")
    
    # Create the FastAPI app
    app = create_app()
    
    # Run the server
    try:
        uvicorn.run(
            app,
            host=host,
            port=port,
            reload=reload,
            log_level=log_level,
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
