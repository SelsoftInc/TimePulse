/**
 * User Approval Email Service
 * Sends emails for OAuth user approval workflow
 */

const nodemailer = require('nodemailer');

class UserApprovalEmailService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ User Approval Email service configuration error:', error);
        } else {
          console.log('✅ User Approval Email service is ready');
        }
      });
    }
  }
  /**
   * Send user approval notification email
   * @param {Object} params - Email parameters
   * @param {string} params.userEmail - User email address
   * @param {string} params.userName - User full name
   * @param {string} params.userRole - User role
   * @param {string} params.approvedBy - Admin who approved
   * @param {string} params.loginLink - Link to login
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendUserApprovedEmail({
    userEmail,
    userName,
    userRole,
    approvedBy,
    loginLink,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. User approval notification:');
        console.log({
          to: userEmail,
          userName,
          userRole,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
        to: userEmail,
        subject: `✅ Welcome to ${tenantName} - Your Account Has Been Approved`,
        html: this.getUserApprovedTemplate({
          userName,
          userRole,
          approvedBy,
          loginLink,
          tenantName,
        }),
        text: `
Dear ${userName},

Great news! Your registration for ${tenantName} has been approved.

Your account details:
- Name: ${userName}
- Role: ${userRole}
- Approved by: ${approvedBy}

You can now login to TimePulse and start using the system:
${loginLink}

If you have any questions, please contact your administrator.

Welcome aboard!

Best regards,
${tenantName}
TimePulse Team
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ User approval email sent successfully:', {
        messageId: info.messageId,
        to: userEmail,
        userName,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'User approval email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending user approval email:', error);
      throw error;
    }
  }

  /**
   * Send user rejection notification email
   * @param {Object} params - Email parameters
   * @param {string} params.userEmail - User email address
   * @param {string} params.userName - User full name
   * @param {string} params.rejectionReason - Reason for rejection
   * @param {string} params.rejectedBy - Admin who rejected
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendUserRejectedEmail({
    userEmail,
    userName,
    rejectionReason,
    rejectedBy,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. User rejection notification:');
        console.log({
          to: userEmail,
          userName,
          rejectionReason,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
        to: userEmail,
        subject: `Registration Status - ${tenantName}`,
        html: this.getUserRejectedTemplate({
          userName,
          rejectionReason,
          rejectedBy,
          tenantName,
        }),
        text: `
Dear ${userName},

Thank you for your interest in ${tenantName}.

After reviewing your registration request, we regret to inform you that we are unable to approve your account at this time.

${rejectionReason ? `Reason: ${rejectionReason}` : ''}

If you believe this is an error or have any questions, please contact your administrator or ${rejectedBy}.

Best regards,
${tenantName}
TimePulse Team
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ User rejection email sent successfully:', {
        messageId: info.messageId,
        to: userEmail,
        userName,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'User rejection email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending user rejection email:', error);
      throw error;
    }
  }

  /**
   * Get HTML email template for user approval
   */
  getUserApprovedTemplate({
    userName,
    userRole,
    approvedBy,
    loginLink,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header .icon {
      font-size: 64px;
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.95;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .message {
      font-size: 16px;
      color: #555;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .info-box {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 4px solid #28a745;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .info-box h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #dee2e6;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      font-size: 14px;
    }
    .info-value {
      color: #333;
      font-size: 14px;
      text-align: right;
      text-transform: capitalize;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      background: #28a745;
      color: white;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .button:hover {
      background: #218838;
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }
    .welcome-message {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
    }
    .welcome-message h2 {
      color: #155724;
      margin: 0 0 10px 0;
      font-size: 20px;
    }
    .welcome-message p {
      color: #155724;
      margin: 0;
      font-size: 14px;
    }
    .footer {
      background: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #28a745;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="icon">✅</div>
      <h1>Account Approved!</h1>
      <p>Welcome to ${tenantName}</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear <strong>${userName}</strong>,
      </div>
      
      <div class="message">
        Great news! Your registration for <strong>${tenantName}</strong> has been reviewed and approved. You now have full access to the TimePulse system.
      </div>
      
      <div class="welcome-message">
        <h2>🎉 Welcome Aboard!</h2>
        <p>We're excited to have you as part of our team.</p>
      </div>
      
      <div class="info-box">
        <h3>Your Account Details</h3>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${userName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Role:</span>
          <span class="info-value">${userRole}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Approved by:</span>
          <span class="info-value">${approvedBy}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value" style="color: #28a745; font-weight: 700;">Active</span>
        </div>
      </div>
      
      <div class="button-container">
        <a href="${loginLink}" class="button">Login to TimePulse</a>
      </div>
      
      <div class="message">
        You can now login to TimePulse using your Google account and start managing your timesheets, projects, and more.
      </div>
      
      <div class="message">
        If you have any questions or need assistance getting started, please don't hesitate to reach out to your administrator.
      </div>
      
      <div class="message">
        Best regards,<br>
        <strong>${tenantName}</strong><br>
        TimePulse Team
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated message from TimePulse Timesheet Management System.</p>
      <p>© ${new Date().getFullYear()} ${tenantName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get HTML email template for user rejection
   */
  getUserRejectedTemplate({
    userName,
    rejectionReason,
    rejectedBy,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Status</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header .icon {
      font-size: 64px;
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .message {
      font-size: 16px;
      color: #555;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    .reason-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .reason-box h3 {
      margin: 0 0 10px 0;
      color: #856404;
      font-size: 16px;
      font-weight: 600;
    }
    .reason-box p {
      margin: 0;
      color: #856404;
      font-size: 14px;
      line-height: 1.6;
    }
    .contact-box {
      background: #e7f3ff;
      border: 1px solid #b3d9ff;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
    }
    .contact-box h3 {
      color: #004085;
      margin: 0 0 10px 0;
      font-size: 18px;
    }
    .contact-box p {
      color: #004085;
      margin: 0;
      font-size: 14px;
    }
    .footer {
      background: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="icon">ℹ️</div>
      <h1>Registration Status Update</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear <strong>${userName}</strong>,
      </div>
      
      <div class="message">
        Thank you for your interest in joining <strong>${tenantName}</strong> through TimePulse.
      </div>
      
      <div class="message">
        After reviewing your registration request, we regret to inform you that we are unable to approve your account at this time.
      </div>
      
      ${rejectionReason ? `
      <div class="reason-box">
        <h3>Reason for Decision:</h3>
        <p>${rejectionReason}</p>
      </div>
      ` : ''}
      
      <div class="contact-box">
        <h3>Have Questions?</h3>
        <p>If you believe this is an error or have any questions, please contact ${rejectedBy || 'your administrator'} for more information.</p>
      </div>
      
      <div class="message">
        We appreciate your understanding.
      </div>
      
      <div class="message">
        Best regards,<br>
        <strong>${tenantName}</strong><br>
        TimePulse Team
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated message from TimePulse Timesheet Management System.</p>
      <p>© ${new Date().getFullYear()} ${tenantName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

module.exports = new UserApprovalEmailService();
