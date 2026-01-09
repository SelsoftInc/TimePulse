from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from datetime import datetime


class DailyHours(BaseModel):
    """Model for daily working hours"""
    day: str = Field(..., description="Day of the week (Mon, Tue, Wed, etc.)")
    # Allow hours > 24 because some LLM outputs may include totals or unexpected values; validation
    # can be performed downstream if needed.
    hours: float = Field(..., ge=0, description="Hours worked on that day")


class EmployeeTimesheet(BaseModel):
    """Model for individual employee timesheet"""
    client_id: Optional[str] = Field(None, description="Client or employee ID")
    # Make client_name optional to accept LLM responses that may omit it or use null
    client_name: Optional[str] = Field(None, description="Client or employee name")
    employee_name: Optional[str] = Field(None, description="Employee name if different from client")
    # week_hours can be missing when the document only contains totals
    week_hours: Optional[List[DailyHours]] = Field(None, description="Hours worked each day of the week (optional)")
    # total_hours is always expected (for weekly or total-only cases)
    total_hours: float = Field(..., ge=0, description="Total hours for the period")
    # Optional period metadata to support multiple weeks
    period: Optional[str] = Field(None, description="Period label, e.g., 'Week 1', '2025-10-06 to 2025-10-12'")
    week_start: Optional[str] = Field(None, description="Week start date if available (YYYY-MM-DD)")
    week_end: Optional[str] = Field(None, description="Week end date if available (YYYY-MM-DD)")
    
    @validator('total_hours')
    def validate_total_hours(cls, v, values):
        """Validate that total hours match sum of daily hours"""
        if 'week_hours' in values and values['week_hours']:
            calculated_total = sum(day.hours for day in values['week_hours'])
            if abs(calculated_total - v) > 0.1:  # Allow small floating point differences
                return calculated_total
        return v


class TimesheetResponse(BaseModel):
    """Response model for timesheet extraction"""
    success: bool = Field(default=True)
    message: str = Field(default="Timesheet extracted successfully")
    data: List[EmployeeTimesheet] = Field(..., description="List of employee timesheets")
    metadata: Optional[Dict] = Field(default_factory=dict, description="Additional metadata")
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Successfully extracted 1 employee timesheet(s)",
                "data": [
                    {
                        "client_id": None,
                        "client_name": "John Doe",
                        "employee_name": None,
                        "period": None,
                        "week_start": None,
                        "week_end": None,
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
                    "filename": "timesheet.png",
                    "file_type": "png",
                    "employees_count": 1
                },
                "processed_at": "2025-10-22T10:30:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = Field(default=False)
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    app_name: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Email schemas
class NotificationEmailRequest(BaseModel):
    """Request model for sending notification emails"""
    to_email: str = Field(..., description="Recipient's email address")
    recipient_name: str = Field(..., description="Recipient's name for personalization")
    subject: str = Field(default="TimePulse Notification", description="Email subject line")
    body: str = Field(..., description="Email body content/message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "user@example.com",
                "recipient_name": "John Doe",
                "subject": "Your Weekly Timesheet Reminder",
                "body": "This is a friendly reminder to submit your weekly timesheet before the deadline."
            }
        }


class ForgotPasswordEmailRequest(BaseModel):
    """Request model for sending forgot password emails"""
    to_email: str = Field(..., description="Recipient's email address")
    recipient_name: str = Field(..., description="Recipient's name for personalization")
    reset_link: str = Field(..., description="Password reset link URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "user@example.com",
                "recipient_name": "John Doe",
                "reset_link": "https://qa.timepulse.io/reset-password?token=abc123xyz"
            }
        }


class EmailResponse(BaseModel):
    """Response model for email operations"""
    success: bool = Field(..., description="Whether the email was sent successfully")
    message: str = Field(..., description="Status message or error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Email sent successfully. Message ID: 12345abc",
                "timestamp": "2026-01-08T10:30:00Z"
            }
        }

