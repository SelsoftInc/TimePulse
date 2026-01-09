from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from loguru import logger
import sys
from pathlib import Path

from config import get_settings
from models import HealthResponse, ErrorResponse
from routers import timesheet, gmail

# Configure logging
settings = get_settings()

logger.remove()
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)
logger.add(
    settings.LOG_FILE,
    rotation="10 MB",
    retention="7 days",
    level=settings.LOG_LEVEL
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-level API for extracting structured timesheet data from various document formats",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    default_response_class=JSONResponse
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(timesheet.router)
app.include_router(gmail.router)

# Serve static files for frontend
frontend_dir = Path(__file__).parent / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION
    )


@app.get("/api/v1/example-response", tags=["Documentation"])
async def example_response():
    """
    Example endpoint showing the expected JSON response format
    """
    from models import TimesheetResponse, EmployeeTimesheet, DailyHours
    
    example = TimesheetResponse(
        success=True,
        message="Successfully extracted 2 employee timesheet(s)",
        data=[
            EmployeeTimesheet(
                client_id="EMP001",
                client_name="John Doe",
                employee_name="John Doe",
                period="Week 1",
                week_start="2025-10-20",
                week_end="2025-10-26",
                week_hours=[
                    DailyHours(day="Mon", hours=8.0),
                    DailyHours(day="Tue", hours=7.5),
                    DailyHours(day="Wed", hours=8.0),
                    DailyHours(day="Thu", hours=8.0),
                    DailyHours(day="Fri", hours=6.0),
                    DailyHours(day="Sat", hours=0.0),
                    DailyHours(day="Sun", hours=0.0)
                ],
                total_hours=37.5
            ),
            EmployeeTimesheet(
                client_id="EMP002",
                client_name="Jane Smith",
                employee_name="Jane Smith",
                period="Week 1",
                week_start="2025-10-20",
                week_end="2025-10-26",
                week_hours=[
                    DailyHours(day="Mon", hours=8.0),
                    DailyHours(day="Tue", hours=8.0),
                    DailyHours(day="Wed", hours=8.0),
                    DailyHours(day="Thu", hours=8.0),
                    DailyHours(day="Fri", hours=8.0),
                    DailyHours(day="Sat", hours=0.0),
                    DailyHours(day="Sun", hours=0.0)
                ],
                total_hours=40.0
            )
        ],
        metadata={
            "filename": "timesheet.pdf",
            "file_type": "pdf",
            "employees_count": 2
        }
    )
    
    return example


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.DEBUG else "An unexpected error occurred"
        ).dict()
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
