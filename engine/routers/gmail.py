from fastapi import APIRouter, HTTPException
from models import NotificationEmailRequest, ForgotPasswordEmailRequest, EmailResponse
from services.gmail import send_notification_email, send_forgot_password_email

router = APIRouter(prefix="/api/v1/gmail", tags=["Gmail"])


@router.post(
    "/notification",
    response_model=EmailResponse,
    summary="Send Notification Email",
    description="Send a notification email to a user with customizable subject and body content."
)
async def send_notification(request: NotificationEmailRequest):
    """
    Send a notification email to a specified user.
    
    - **to_email**: Recipient's Email
    - **recipient_name**: Name of the recipient for personalization
    - **subject**: Email subject line (optional, defaults to "TimePulse Notification")
    - **body**: The main message content of the email
    """
    result = send_notification_email(
        to_email=request.to_email,
        recipient_name=request.recipient_name,
        subject=request.subject,
        body=request.body
    )
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])
    
    return EmailResponse(
        success=result["success"],
        message=result["message"]
    )


@router.post(
    "/forgot-password",
    response_model=EmailResponse,
    summary="Send Forgot Password Email",
    description="Send a password reset email with a reset link to the user."
)
async def send_forgot_password(request: ForgotPasswordEmailRequest):
    """
    Send a forgot password email with a reset link.
    
    - **to_email**: Recipient's Email
    - **recipient_name**: Name of the recipient for personalization
    - **reset_link**: The URL link for password reset
    """
    result = send_forgot_password_email(
        to_email=request.to_email,
        recipient_name=request.recipient_name,
        reset_link=request.reset_link
    )
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])
    
    return EmailResponse(
        success=result["success"],
        message=result["message"]
    )