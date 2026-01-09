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
   * @param {string} params.vendorEmail - Vendor Email
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
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
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
   * @param {string} params.reviewerEmail - Reviewer Email
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
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
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
   * @param {string} params.employeeEmail - Employee Email
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
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
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
   * @param {string} params.employeeEmail - Employee Email
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
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
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
        from: "TimePulse <noreply@timepulse.io>",
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

  /**
   * Send timesheet submission reminder to employee
   * @param {Object} params - Email parameters
   * @param {string} params.employeeEmail - Employee Email
   * @param {string} params.employeeName - Employee name
   * @param {string} params.weekRange - Timesheet week range (e.g., "Dec 23 - Dec 29, 2024")
   * @param {string} params.weekEndDate - Week end date (e.g., "December 29, 2024")
   * @param {string} params.daysOverdue - Number of days past the deadline
   * @param {string} params.timesheetLink - Link to submit timesheet
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendTimesheetReminder({
    employeeEmail,
    employeeName,
    weekRange,
    weekEndDate,
    daysOverdue,
    timesheetLink,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. Timesheet reminder notification:');
        console.log({
          to: employeeEmail,
          employeeName,
          weekRange,
          daysOverdue,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const subject = daysOverdue > 0
        ? `⏰ Reminder: Timesheet Due - ${weekRange} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue)`
        : `⏰ Reminder: Timesheet Due - ${weekRange}`;

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
        to: employeeEmail,
        subject: subject,
        html: this.getTimesheetReminderTemplate({
          employeeName,
          weekRange,
          weekEndDate,
          daysOverdue,
          timesheetLink,
          tenantName,
        }),
        text: `
Dear ${employeeName},

This is a friendly reminder that your timesheet for the week of ${weekRange} is ${daysOverdue > 0 ? `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue` : 'due'}.

Week: ${weekRange}
Week End Date: ${weekEndDate}
${daysOverdue > 0 ? `Days Overdue: ${daysOverdue}` : ''}

Please submit your timesheet as soon as possible using the link below:
${timesheetLink}

Thank you for your prompt attention to this matter.

Best regards,
${tenantName}
TimePulse Timesheet Management System
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Timesheet reminder email sent:', {
        messageId: info.messageId,
        to: employeeEmail,
        employeeName,
        weekRange,
        daysOverdue,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Timesheet reminder email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending timesheet reminder email:', error);
      throw error;
    }
  }

  /**
   * Get HTML email template for timesheet reminder
   */
  getTimesheetReminderTemplate({
    employeeName,
    weekRange,
    weekEndDate,
    daysOverdue,
    timesheetLink,
    tenantName,
  }) {
    const isOverdue = daysOverdue > 0;
    const urgencyColor = isOverdue ? '#dc3545' : '#ffc107';
    const urgencyText = isOverdue 
      ? `${daysOverdue} Day${daysOverdue > 1 ? 's' : ''} Overdue`
      : 'Due Soon';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timesheet Reminder</title>
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
      background: linear-gradient(135deg, ${isOverdue ? '#dc3545 0%, #c82333 100%' : '#ffc107 0%, #ff9800 100%'});
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .urgency-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 15px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .reminder-message {
      font-size: 16px;
      color: #555;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .timesheet-info {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 4px solid ${urgencyColor};
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .timesheet-info h3 {
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
    }
    .overdue-alert {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      display: ${isOverdue ? 'block' : 'none'};
    }
    .overdue-alert strong {
      color: #856404;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      background: ${urgencyColor};
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
      background: ${isOverdue ? '#c82333' : '#ff9800'};
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }
    .help-text {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #666;
    }
    .footer .company-name {
      font-weight: 600;
      color: #333;
      margin-top: 10px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .content {
        padding: 25px 20px;
      }
      .header {
        padding: 30px 20px;
      }
      .button {
        padding: 14px 30px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="icon">⏰</div>
      <h1>Timesheet Reminder</h1>
      <div class="urgency-badge">${urgencyText}</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear <strong>${employeeName}</strong>,
      </div>
      
      <div class="reminder-message">
        ${isOverdue 
          ? `This is a friendly reminder that your timesheet for the week of <strong>${weekRange}</strong> is <strong style="color: ${urgencyColor};">${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</strong>. Please submit it as soon as possible.`
          : `This is a friendly reminder that your timesheet for the week of <strong>${weekRange}</strong> is due. Please submit it at your earliest convenience.`
        }
      </div>
      
      ${isOverdue ? `
      <div class="overdue-alert">
        <strong>⚠️ Action Required:</strong> Your timesheet is overdue. Please submit it immediately to avoid any delays in processing.
      </div>
      ` : ''}
      
      <div class="timesheet-info">
        <h3>📋 Timesheet Details</h3>
        <div class="info-row">
          <span class="info-label">Week Period:</span>
          <span class="info-value"><strong>${weekRange}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Week End Date:</span>
          <span class="info-value">${weekEndDate}</span>
        </div>
        ${isOverdue ? `
        <div class="info-row">
          <span class="info-label" style="color: ${urgencyColor};">Days Overdue:</span>
          <span class="info-value" style="color: ${urgencyColor}; font-weight: 600;">${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="button-container">
        <a href="${timesheetLink}" class="button">
          ${isOverdue ? 'Submit Timesheet Now' : 'Submit Timesheet'}
        </a>
      </div>
      
      <div class="help-text">
        <p>If you have any questions or need assistance, please contact your manager or the HR department.</p>
        <p>Thank you for your prompt attention to this matter.</p>
      </div>
      
      <p style="margin-top: 30px; color: #666;">
        Best regards,<br>
        <strong style="color: #333;">${tenantName}</strong><br>
        <span style="font-size: 14px;">TimePulse Team</span>
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated reminder from TimePulse Timesheet Management System.</p>
      <p class="company-name">${tenantName}</p>
      <p>© ${new Date().getFullYear()} TimePulse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send reminder to manager about employees with missing timesheets
   * @param {Object} params - Email parameters
   * @param {string} params.managerEmail - Manager Email
   * @param {string} params.managerName - Manager name
   * @param {Array} params.missingEmployees - Array of employees who haven't submitted
   * @param {string} params.weekRange - Timesheet week range
   * @param {string} params.weekEndDate - Week end date
   * @param {number} params.daysOverdue - Number of days past the deadline
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendManagerTimesheetReminder({
    managerEmail,
    managerName,
    missingEmployees,
    weekRange,
    weekEndDate,
    daysOverdue,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. Manager timesheet reminder:');
        console.log({
          to: managerEmail,
          managerName,
          missingEmployees: missingEmployees.length,
          weekRange,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const subject = daysOverdue > 0
        ? `⚠️ Manager Alert: ${missingEmployees.length} Employee(s) Missing Timesheets - ${weekRange} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue)`
        : `⚠️ Manager Alert: ${missingEmployees.length} Employee(s) Missing Timesheets - ${weekRange}`;

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
        to: managerEmail,
        subject: subject,
        html: this.getManagerTimesheetReminderTemplate({
          managerName,
          missingEmployees,
          weekRange,
          weekEndDate,
          daysOverdue,
          tenantName,
        }),
        text: `
Dear ${managerName},

This is a notification that ${missingEmployees.length} employee(s) under your supervision have not submitted their timesheets for the week of ${weekRange}.

Week: ${weekRange}
Week End Date: ${weekEndDate}
${daysOverdue > 0 ? `Days Overdue: ${daysOverdue}` : ''}

Missing Timesheets:
${missingEmployees.map(emp => `- ${emp.name} (${emp.email})`).join('\n')}

Please follow up with these employees to ensure timely submission.

Best regards,
${tenantName}
TimePulse Timesheet Management System
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Manager timesheet reminder email sent:', {
        messageId: info.messageId,
        to: managerEmail,
        managerName,
        missingCount: missingEmployees.length,
        weekRange,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Manager timesheet reminder email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending manager timesheet reminder email:', error);
      throw error;
    }
  }

  /**
   * Send pending approval reminder to manager
   * @param {Object} params - Email parameters
   * @param {string} params.managerEmail - Manager Email
   * @param {string} params.managerName - Manager name
   * @param {Array} params.pendingTimesheets - Array of pending timesheets
   * @param {string} params.tenantName - Tenant/Company name
   */
  async sendPendingApprovalReminder({
    managerEmail,
    managerName,
    pendingTimesheets,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email service not configured. Pending approval reminder:');
        console.log({
          to: managerEmail,
          managerName,
          pendingCount: pendingTimesheets.length,
        });
        return {
          success: true,
          message: 'Email service not configured (development mode)',
          mockSent: true,
        };
      }

      const subject = `⏰ Pending Approval: ${pendingTimesheets.length} Timesheet(s) Awaiting Your Review`;

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
        to: managerEmail,
        subject: subject,
        html: this.getPendingApprovalReminderTemplate({
          managerName,
          pendingTimesheets,
          tenantName,
        }),
        text: `
Dear ${managerName},

You have ${pendingTimesheets.length} timesheet(s) pending your approval.

Pending Timesheets:
${pendingTimesheets.map(ts => `- ${ts.employeeName} - ${ts.weekRange} (Submitted: ${ts.submittedDate})`).join('\n')}

Please review and approve or reject these timesheets at your earliest convenience.

Best regards,
${tenantName}
TimePulse Timesheet Management System
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Pending approval reminder email sent:', {
        messageId: info.messageId,
        to: managerEmail,
        managerName,
        pendingCount: pendingTimesheets.length,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Pending approval reminder email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending pending approval reminder email:', error);
      throw error;
    }
  }

  /**
   * Get HTML email template for manager timesheet reminder
   */
  getManagerTimesheetReminderTemplate({
    managerName,
    missingEmployees,
    weekRange,
    weekEndDate,
    daysOverdue,
    tenantName,
  }) {
    const isOverdue = daysOverdue > 0;
    const urgencyColor = isOverdue ? '#dc3545' : '#ffc107';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manager Alert - Missing Timesheets</title>
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
      background: linear-gradient(135deg, ${urgencyColor} 0%, ${isOverdue ? '#c82333' : '#ff9800'} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .alert-message {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .alert-message strong {
      color: #856404;
      font-size: 16px;
    }
    .week-info {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 4px solid ${urgencyColor};
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .week-info h3 {
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
    }
    .employees-list {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .employees-list h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }
    .employee-item {
      padding: 12px;
      background: white;
      border-left: 3px solid ${urgencyColor};
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .employee-item:last-child {
      margin-bottom: 0;
    }
    .employee-name {
      font-weight: 600;
      color: #333;
      font-size: 15px;
    }
    .employee-email {
      color: #666;
      font-size: 13px;
      margin-top: 4px;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      background: ${urgencyColor};
      color: white;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="icon">⚠️</div>
      <h1>Manager Alert</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Missing Timesheets Notification</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear <strong>${managerName}</strong>,
      </div>
      
      <div class="alert-message">
        <strong>⚠️ Action Required:</strong> ${missingEmployees.length} employee(s) under your supervision have not submitted their timesheets for the week of <strong>${weekRange}</strong>.
        ${isOverdue ? `<br><br>These timesheets are <strong style="color: ${urgencyColor};">${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</strong>.` : ''}
      </div>
      
      <div class="week-info">
        <h3>📅 Week Information</h3>
        <div class="info-row">
          <span class="info-label">Week Period:</span>
          <span class="info-value"><strong>${weekRange}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Week End Date:</span>
          <span class="info-value">${weekEndDate}</span>
        </div>
        ${isOverdue ? `
        <div class="info-row">
          <span class="info-label" style="color: ${urgencyColor};">Days Overdue:</span>
          <span class="info-value" style="color: ${urgencyColor}; font-weight: 600;">${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="employees-list">
        <h3>👥 Employees with Missing Timesheets</h3>
        ${missingEmployees.map(emp => `
        <div class="employee-item">
          <div class="employee-name">${emp.name}</div>
          <div class="employee-email">${emp.email}</div>
        </div>
        `).join('')}
      </div>
      
      <div class="button-container">
        <a href="${process.env.FRONTEND_URL || 'https://app.timepulse.io'}/timesheets" class="button">
          View Timesheets Dashboard
        </a>
      </div>
      
      <p style="margin-top: 30px; color: #666;">
        Please follow up with these employees to ensure timely submission of their timesheets.
      </p>
      
      <p style="margin-top: 20px; color: #666;">
        Best regards,<br>
        <strong style="color: #333;">${tenantName}</strong><br>
        <span style="font-size: 14px;">TimePulse Team</span>
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated notification from TimePulse Timesheet Management System.</p>
      <p>© ${new Date().getFullYear()} TimePulse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get HTML email template for pending approval reminder
   */
  getPendingApprovalReminderTemplate({
    managerName,
    pendingTimesheets,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pending Approval Reminder</title>
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
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .alert-message {
      background: #d1ecf1;
      border-left: 4px solid #17a2b8;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .alert-message strong {
      color: #0c5460;
      font-size: 16px;
    }
    .timesheets-list {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .timesheets-list h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }
    .timesheet-item {
      padding: 15px;
      background: white;
      border-left: 3px solid #17a2b8;
      margin-bottom: 12px;
      border-radius: 4px;
    }
    .timesheet-item:last-child {
      margin-bottom: 0;
    }
    .timesheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .employee-name {
      font-weight: 600;
      color: #333;
      font-size: 15px;
    }
    .week-range {
      color: #666;
      font-size: 13px;
      margin-top: 4px;
    }
    .submitted-date {
      color: #999;
      font-size: 12px;
      margin-top: 6px;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      background: #17a2b8;
      color: white;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .button:hover {
      background: #138496;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="icon">⏰</div>
      <h1>Pending Approval</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear <strong>${managerName}</strong>,
      </div>
      
      <div class="alert-message">
        <strong>⏰ Reminder:</strong> You have <strong>${pendingTimesheets.length} timesheet(s)</strong> pending your approval.
      </div>
      
      <div class="timesheets-list">
        <h3>📋 Pending Timesheets</h3>
        ${pendingTimesheets.map(ts => `
        <div class="timesheet-item">
          <div class="timesheet-header">
            <div>
              <div class="employee-name">${ts.employeeName}</div>
              <div class="week-range">${ts.weekRange}</div>
            </div>
          </div>
          <div class="submitted-date">
            Submitted: ${ts.submittedDate}
            ${ts.daysPending > 0 ? ` • ${ts.daysPending} day${ts.daysPending > 1 ? 's' : ''} pending` : ''}
          </div>
        </div>
        `).join('')}
      </div>
      
      <div class="button-container">
        <a href="${process.env.FRONTEND_URL || 'https://app.timepulse.io'}/timesheets?status=pending" class="button">
          Review Pending Timesheets
        </a>
      </div>
      
      <p style="margin-top: 30px; color: #666;">
        Please review and approve or reject these timesheets at your earliest convenience.
      </p>
      
      <p style="margin-top: 20px; color: #666;">
        Best regards,<br>
        <strong style="color: #333;">${tenantName}</strong><br>
        <span style="font-size: 14px;">TimePulse Team</span>
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated reminder from TimePulse Timesheet Management System.</p>
      <p>© ${new Date().getFullYear()} TimePulse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

module.exports = new EmailService();
