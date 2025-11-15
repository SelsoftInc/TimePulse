/**
 * Email Service for sending notifications
 * Uses nodemailer for email delivery
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure email transporter
    // For production, use environment variables for email configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service configuration error:', error);
        } else {
          console.log('✅ Email service is ready to send messages');
        }
      });
    } else {
      console.warn('⚠️ Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    }
  }

  /**
   * Send invoice notification to vendor
   * @param {Object} params - Email parameters
   * @param {string} params.vendorEmail - Vendor email address
   * @param {string} params.vendorName - Vendor name
   * @param {string} params.employeeName - Employee name
   * @param {string} params.invoiceNumber - Invoice number
   * @param {string} params.invoiceLink - Secure invoice link with hash
   * @param {number} params.totalAmount - Invoice total amount
   * @param {string} params.weekRange - Timesheet week range
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendInvoiceToVendor({
    vendorEmail,
    vendorName,
    employeeName,
    invoiceNumber,
    invoiceLink,
    totalAmount,
    weekRange,
    tenantName,
  }) {
    try {
      // Skip if email service is not configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. Invoice details:');
        console.log({
          to: vendorEmail,
          invoiceNumber,
          invoiceLink,
          totalAmount,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <${process.env.SMTP_USER}>`,
        to: vendorEmail,
        subject: `Invoice ${invoiceNumber} - ${employeeName} - ${weekRange}`,
        html: this.getInvoiceEmailTemplate({
          vendorName,
          employeeName,
          invoiceNumber,
          invoiceLink,
          totalAmount,
          weekRange,
          tenantName,
        }),
        text: `
Dear ${vendorName},

A new invoice has been generated for ${employeeName}.

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Employee: ${employeeName}
- Period: ${weekRange}
- Total Amount: $${parseFloat(totalAmount).toFixed(2)}

You can view and download the invoice using the secure link below:
${invoiceLink}

This link is unique and secure. Please keep it confidential.

Best regards,
${tenantName}
TimePulse Timesheet Management System
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Invoice email sent successfully:', {
        messageId: info.messageId,
        to: vendorEmail,
        invoiceNumber,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Invoice email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending invoice email:', error);
      throw error;
    }
  }

  /**
   * Get HTML email template for invoice notification
   */
  getInvoiceEmailTemplate({
    vendorName,
    employeeName,
    invoiceNumber,
    invoiceLink,
    totalAmount,
    weekRange,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .invoice-details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .invoice-details table {
      width: 100%;
      border-collapse: collapse;
    }
    .invoice-details td {
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .invoice-details td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .invoice-details tr:last-child td {
      border-bottom: none;
    }
    .amount {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .button:hover {
      background: #5568d3;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
      font-size: 12px;
      color: #666;
    }
    .security-note {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📄 New Invoice Generated</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">TimePulse Timesheet Management</p>
  </div>
  
  <div class="content">
    <p>Dear <strong>${vendorName}</strong>,</p>
    
    <p>A new invoice has been generated for <strong>${employeeName}</strong>.</p>
    
    <div class="invoice-details">
      <table>
        <tr>
          <td>Invoice Number:</td>
          <td><strong>${invoiceNumber}</strong></td>
        </tr>
        <tr>
          <td>Employee:</td>
          <td>${employeeName}</td>
        </tr>
        <tr>
          <td>Period:</td>
          <td>${weekRange}</td>
        </tr>
        <tr>
          <td>Company:</td>
          <td>${tenantName}</td>
        </tr>
      </table>
    </div>
    
    <div class="amount">
      Total Amount: $${parseFloat(totalAmount).toFixed(2)}
    </div>
    
    <div class="button-container">
      <a href="${invoiceLink}" class="button">View Invoice</a>
    </div>
    
    <div class="security-note">
      <strong>🔒 Security Note:</strong> This link is unique and secure. Please keep it confidential and do not share it with others.
    </div>
    
    <p>If you have any questions about this invoice, please contact us.</p>
    
    <p>Best regards,<br>
    <strong>${tenantName}</strong><br>
    TimePulse Team</p>
  </div>
  
  <div class="footer">
    <p>This is an automated message from TimePulse Timesheet Management System.</p>
    <p>© ${new Date().getFullYear()} ${tenantName}. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send timesheet submission notification to reviewer
   * @param {Object} params - Email parameters
   * @param {string} params.reviewerEmail - Reviewer email address
   * @param {string} params.reviewerName - Reviewer name
   * @param {string} params.employeeName - Employee name
   * @param {string} params.weekRange - Timesheet week range
   * @param {string} params.timesheetLink - Link to view timesheet
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendTimesheetSubmittedNotification({
    reviewerEmail,
    reviewerName,
    employeeName,
    weekRange,
    timesheetLink,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. Timesheet submission notification:');
        console.log({
          to: reviewerEmail,
          employeeName,
          weekRange,
          timesheetLink,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <${process.env.SMTP_USER}>`,
        to: reviewerEmail,
        subject: `Timesheet Submitted for Review - ${employeeName} - ${weekRange}`,
        html: this.getTimesheetSubmittedTemplate({
          reviewerName,
          employeeName,
          weekRange,
          timesheetLink,
          tenantName,
        }),
        text: `
Dear ${reviewerName},

A new timesheet has been submitted for your review.

Employee: ${employeeName}
Period: ${weekRange}

Please review and approve or reject the timesheet using the link below:
${timesheetLink}

Best regards,
${tenantName}
TimePulse Timesheet Management System
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Timesheet submission email sent:', {
        messageId: info.messageId,
        to: reviewerEmail,
        employeeName,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Timesheet submission email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending timesheet submission email:', error);
      throw error;
    }
  }

  /**
   * Send timesheet approval notification to employee
   * @param {Object} params - Email parameters
   * @param {string} params.employeeEmail - Employee email address
   * @param {string} params.employeeName - Employee name
   * @param {string} params.reviewerName - Reviewer name
   * @param {string} params.weekRange - Timesheet week range
   * @param {string} params.timesheetLink - Link to view timesheet
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendTimesheetApprovedNotification({
    employeeEmail,
    employeeName,
    reviewerName,
    weekRange,
    timesheetLink,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. Timesheet approval notification:');
        console.log({
          to: employeeEmail,
          employeeName,
          weekRange,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <${process.env.SMTP_USER}>`,
        to: employeeEmail,
        subject: `Timesheet Approved - ${weekRange}`,
        html: this.getTimesheetApprovedTemplate({
          employeeName,
          reviewerName,
          weekRange,
          timesheetLink,
          tenantName,
        }),
        text: `
Dear ${employeeName},

Your timesheet has been approved.

Period: ${weekRange}
Approved by: ${reviewerName}

You can view your timesheet using the link below:
${timesheetLink}

Best regards,
${tenantName}
TimePulse Timesheet Management System
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Timesheet approval email sent:', {
        messageId: info.messageId,
        to: employeeEmail,
        employeeName,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Timesheet approval email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending timesheet approval email:', error);
      throw error;
    }
  }

  /**
   * Send timesheet rejection notification to employee
   * @param {Object} params - Email parameters
   * @param {string} params.employeeEmail - Employee email address
   * @param {string} params.employeeName - Employee name
   * @param {string} params.reviewerName - Reviewer name
   * @param {string} params.weekRange - Timesheet week range
   * @param {string} params.rejectionReason - Reason for rejection
   * @param {string} params.timesheetLink - Link to view timesheet
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendTimesheetRejectedNotification({
    employeeEmail,
    employeeName,
    reviewerName,
    weekRange,
    rejectionReason,
    timesheetLink,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. Timesheet rejection notification:');
        console.log({
          to: employeeEmail,
          employeeName,
          weekRange,
          rejectionReason,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <${process.env.SMTP_USER}>`,
        to: employeeEmail,
        subject: `Timesheet Rejected - ${weekRange} - Action Required`,
        html: this.getTimesheetRejectedTemplate({
          employeeName,
          reviewerName,
          weekRange,
          rejectionReason,
          timesheetLink,
          tenantName,
        }),
        text: `
Dear ${employeeName},

Your timesheet has been rejected and requires your attention.

Period: ${weekRange}
Rejected by: ${reviewerName}
Reason: ${rejectionReason || 'No reason provided'}

Please review the feedback and resubmit your timesheet using the link below:
${timesheetLink}

Best regards,
${tenantName}
TimePulse Timesheet Management System
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Timesheet rejection email sent:', {
        messageId: info.messageId,
        to: employeeEmail,
        employeeName,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Timesheet rejection email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending timesheet rejection email:', error);
      throw error;
    }
  }

  /**
   * Get HTML email template for timesheet submission
   */
  getTimesheetSubmittedTemplate({
    reviewerName,
    employeeName,
    weekRange,
    timesheetLink,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timesheet Submitted for Review</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Timesheet Submitted for Review</h1>
  </div>
  
  <div class="content">
    <p>Dear <strong>${reviewerName}</strong>,</p>
    
    <p>A new timesheet has been submitted for your review.</p>
    
    <div class="details">
      <p><strong>Employee:</strong> ${employeeName}</p>
      <p><strong>Period:</strong> ${weekRange}</p>
    </div>
    
    <div class="button-container">
      <a href="${timesheetLink}" class="button">Review Timesheet</a>
    </div>
    
    <p>Best regards,<br>
    <strong>${tenantName}</strong><br>
    TimePulse Team</p>
  </div>
  
  <div class="footer">
    <p>This is an automated message from TimePulse Timesheet Management System.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get HTML email template for timesheet approval
   */
  getTimesheetApprovedTemplate({
    employeeName,
    reviewerName,
    weekRange,
    timesheetLink,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timesheet Approved</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #28a745;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Timesheet Approved</h1>
  </div>
  
  <div class="content">
    <p>Dear <strong>${employeeName}</strong>,</p>
    
    <p>Your timesheet has been <strong>approved</strong>.</p>
    
    <div class="details">
      <p><strong>Period:</strong> ${weekRange}</p>
      <p><strong>Approved by:</strong> ${reviewerName}</p>
    </div>
    
    <div class="button-container">
      <a href="${timesheetLink}" class="button">View Timesheet</a>
    </div>
    
    <p>Best regards,<br>
    <strong>${tenantName}</strong><br>
    TimePulse Team</p>
  </div>
  
  <div class="footer">
    <p>This is an automated message from TimePulse Timesheet Management System.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get HTML email template for timesheet rejection
   */
  getTimesheetRejectedTemplate({
    employeeName,
    reviewerName,
    weekRange,
    rejectionReason,
    timesheetLink,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timesheet Rejected</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .rejection-reason {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #dc3545;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>❌ Timesheet Rejected</h1>
  </div>
  
  <div class="content">
    <p>Dear <strong>${employeeName}</strong>,</p>
    
    <p>Your timesheet has been <strong>rejected</strong> and requires your attention.</p>
    
    <div class="details">
      <p><strong>Period:</strong> ${weekRange}</p>
      <p><strong>Rejected by:</strong> ${reviewerName}</p>
    </div>
    
    <div class="rejection-reason">
      <p><strong>Reason:</strong></p>
      <p>${rejectionReason || 'No reason provided'}</p>
    </div>
    
    <div class="button-container">
      <a href="${timesheetLink}" class="button">Review & Resubmit</a>
    </div>
    
    <p>Please review the feedback above and resubmit your timesheet.</p>
    
    <p>Best regards,<br>
    <strong>${tenantName}</strong><br>
    TimePulse Team</p>
  </div>
  
  <div class="footer">
    <p>This is an automated message from TimePulse Timesheet Management System.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: toEmail,
        subject: 'TimePulse Email Service Test',
        text: 'This is a test email from TimePulse Email Service.',
        html: '<p>This is a test email from <strong>TimePulse Email Service</strong>.</p>',
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Test email failed:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
