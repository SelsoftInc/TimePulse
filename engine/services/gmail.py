import os.path
import base64
import argparse
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Scope for sending emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

# Define paths
BASE_DIR = Path(__file__).resolve().parent.parent
TOKEN_PATH = BASE_DIR / "utils" / "token" / "token.json"
LOGO_IMAGE_PATH = BASE_DIR / "utils" / "TimePulse4.png"
SENDER_EMAIL = "notification.timepulse@gmail.com"


def get_credentials():
    """Get valid user credentials from token.json."""
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Save the refreshed credentials
            TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(TOKEN_PATH, 'w') as token:
                token.write(creds.to_json())
        else:
            print(f"Error: {TOKEN_PATH} not found or invalid. Please run main.py first to authenticate.")
            return None
    
    return creds

def create_message(sender, to, subject, html_content, image_path=None):
    """Create a message for an email."""
    message = MIMEMultipart('related')
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject

    # Create the HTML part
    msg_alternative = MIMEMultipart('alternative')
    message.attach(msg_alternative)
    msg_html = MIMEText(html_content, 'html')
    msg_alternative.attach(msg_html)

    # Attach image if provided
    if image_path and os.path.exists(image_path):
        with open(image_path, 'rb') as f:
            msg_image = MIMEImage(f.read())
            msg_image.add_header('Content-ID', '<logo>')
            msg_image.add_header('Content-Disposition', 'inline', filename=os.path.basename(image_path))
            message.attach(msg_image)

    raw = base64.urlsafe_b64encode(message.as_bytes())
    raw = raw.decode()
    return {'raw': raw}

def send_message(service, user_id, message):
    """Send an email message."""
    try:
        message = service.users().messages().send(
            userId=user_id, body=message).execute()
        print(f'Message sent successfully! Message Id: {message["id"]}')
        return message
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None





def send_notification_email(to_email: str, recipient_name: str, subject: str, body: str) -> dict:
    """
    Send a notification email to a user.
    
    Args:
        to_email: Recipient's Email
        recipient_name: Recipient's name
        subject: Email subject
        body: Email body content
        
    Returns:
        dict: Response with success status and message
    """
    creds = get_credentials()
    if not creds:
        return {"success": False, "message": "Failed to get credentials. Please authenticate first."}
    
    try:
        service = build('gmail', 'v1', credentials=creds)
        
        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <img src="cid:logo" alt="TimePulse Logo" style="max-width: 150px; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">TimePulse Notification</h1>
                    </div>
                    <div style="padding: 40px; color: #333333; line-height: 1.6;">
                        <h2 style="color: #4a4a4a; margin-top: 0;">Hello {recipient_name},</h2>
                        <p style="font-size: 16px;">{body}</p>
                        
                        <div style="text-align: center; margin-top: 35px;">
                            <a href="https://qa.timepulse.io/" style="background-color: #764ba2; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; transition: background-color 0.3s;">Go to Dashboard</a>
                        </div>
                    </div>
                    <div style="background-color: #f1f1f1; padding: 20px; text-align: center; color: #888888; font-size: 12px;">
                        <p style="margin: 5px 0;">&copy; 2026 Selsoft Inc. All rights reserved.</p>
                        <p style="margin: 5px 0;">Allen, TX USA</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        message = create_message(SENDER_EMAIL, to_email, subject, html_content, LOGO_IMAGE_PATH)
        result = send_message(service, "me", message)
        
        if result:
            return {"success": True, "message": f"Notification email sent successfully. Message ID: {result['id']}"}
        else:
            return {"success": False, "message": "Failed to send notification email."}
            
    except HttpError as error:
        return {"success": False, "message": f"An error occurred: {str(error)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}


def send_forgot_password_email(to_email: str, recipient_name: str, reset_link: str) -> dict:
    """
    Send a forgot password email with a reset link.
    
    Args:
        to_email: Recipient's Email
        recipient_name: Recipient's name
        reset_link: Password reset link URL
        
    Returns:
        dict: Response with success status and message
    """
    creds = get_credentials()
    if not creds:
        return {"success": False, "message": "Failed to get credentials. Please authenticate first."}
    
    try:
        service = build('gmail', 'v1', credentials=creds)
        
        subject = "Reset Your TimePulse Password"
        
        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <img src="cid:logo" alt="TimePulse Logo" style="max-width: 150px; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
                    </div>
                    <div style="padding: 40px; color: #333333; line-height: 1.6;">
                        <h2 style="color: #4a4a4a; margin-top: 0;">Hello {recipient_name},</h2>
                        <p style="font-size: 16px;">We received a request to reset your password for your TimePulse account. Click the button below to reset your password:</p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="{reset_link}" style="background-color: #764ba2; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px; transition: background-color 0.3s;">Reset Password</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666666;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 25px;">
                            <p style="font-size: 12px; color: #888888; margin: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                            <p style="font-size: 12px; color: #764ba2; word-break: break-all; margin: 10px 0 0 0;">{reset_link}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #666666; margin-top: 25px;"><strong>Note:</strong> This password reset link will expire in 24 hours for security reasons.</p>
                    </div>
                    <div style="background-color: #f1f1f1; padding: 20px; text-align: center; color: #888888; font-size: 12px;">
                        <p style="margin: 5px 0;">&copy; 2026 Selsoft Inc. All rights reserved.</p>
                        <p style="margin: 5px 0;">Allen, TX USA</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        message = create_message(SENDER_EMAIL, to_email, subject, html_content, LOGO_IMAGE_PATH)
        result = send_message(service, "me", message)
        
        if result:
            return {"success": True, "message": f"Password reset email sent successfully. Message ID: {result['id']}"}
        else:
            return {"success": False, "message": "Failed to send password reset email."}
            
    except HttpError as error:
        return {"success": False, "message": f"An error occurred: {str(error)}"}
    except Exception as e:
        return {"success": False, "message": f"Unexpected error: {str(e)}"}