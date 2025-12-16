/**
 * Leave Management Email Service
 * Sends emails for leave request workflow
 */

const nodemailer = require('nodemailer');

class LeaveManagementEmailService {
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
          console.error('❌ Leave Management Email service configuration error:', error);
        } else {
          console.log('✅ Leave Management Email service is ready');
        }
      });
    } else {
      console.log('⚠️  Leave Management Email service not configured (development mode)');
    }
  }

  /**
   * Send leave request submitted notification to approver
   */
  async sendLeaveRequestSubmittedNotification({
    approverEmail,
    approverName,
    employeeName,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    leaveRequestLink,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 [DEV MODE] Leave request submitted notification:');
        console.log({
          to: approverEmail,
          approverName,
          employeeName,
          leaveType,
          startDate,
          endDate,
        });
        return { success: true, message: 'Email service not configured (development mode)', mockSent: true };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
        to: approverEmail,
        subject: `🔔 New Leave Request from ${employeeName}`,
        html: this.getLeaveRequestSubmittedTemplate({
          approverName,
          employeeName,
          leaveType,
          startDate,
          endDate,
          totalDays,
          reason,
          leaveRequestLink,
          tenantName,
        }),
        text: `
Dear ${approverName},

A new leave request requires your approval.

Employee: ${employeeName}
Leave Type: ${leaveType}
Duration: ${startDate} to ${endDate} (${totalDays} days)
Reason: ${reason || 'Not provided'}

Please review and approve/reject this request:
${leaveRequestLink}

Best regards,
${tenantName}
TimePulse Team
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Leave request submitted email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending leave request submitted email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send leave request approved notification to employee
   */
  async sendLeaveRequestApprovedNotification({
    employeeEmail,
    employeeName,
    approverName,
    leaveType,
    startDate,
    endDate,
    totalDays,
    comments,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 [DEV MODE] Leave request approved notification:');
        console.log({
          to: employeeEmail,
          employeeName,
          approverName,
          leaveType,
        });
        return { success: true, message: 'Email service not configured (development mode)', mockSent: true };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
        to: employeeEmail,
        subject: `✅ Leave Request Approved - ${leaveType}`,
        html: this.getLeaveRequestApprovedTemplate({
          employeeName,
          approverName,
          leaveType,
          startDate,
          endDate,
          totalDays,
          comments,
          tenantName,
        }),
        text: `
Dear ${employeeName},

Good news! Your leave request has been approved.

Leave Type: ${leaveType}
Duration: ${startDate} to ${endDate} (${totalDays} days)
Approved by: ${approverName}
${comments ? `Comments: ${comments}` : ''}

Enjoy your time off!

Best regards,
${tenantName}
TimePulse Team
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Leave request approved email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending leave request approved email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send leave request rejected notification to employee
   */
  async sendLeaveRequestRejectedNotification({
    employeeEmail,
    employeeName,
    approverName,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    tenantName,
  }) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 [DEV MODE] Leave request rejected notification:');
        console.log({
          to: employeeEmail,
          employeeName,
          approverName,
          leaveType,
        });
        return { success: true, message: 'Email service not configured (development mode)', mockSent: true };
      }

      const mailOptions = {
        from: `"${tenantName} - TimePulse" <noreply@timepulse.io>`,
        to: employeeEmail,
        subject: `❌ Leave Request Not Approved - ${leaveType}`,
        html: this.getLeaveRequestRejectedTemplate({
          employeeName,
          approverName,
          leaveType,
          startDate,
          endDate,
          totalDays,
          reason,
          tenantName,
        }),
        text: `
Dear ${employeeName},

Your leave request has not been approved.

Leave Type: ${leaveType}
Duration: ${startDate} to ${endDate} (${totalDays} days)
Reviewed by: ${approverName}
Reason: ${reason || 'Not provided'}

If you have questions, please contact your manager.

Best regards,
${tenantName}
TimePulse Team
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Leave request rejected email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending leave request rejected email:', error);
      return { success: false, error: error.message };
    }
  }

  // HTML Templates

  getLeaveRequestSubmittedTemplate({
    approverName,
    employeeName,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    leaveRequestLink,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Leave Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🔔 New Leave Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                Dear <strong>${approverName}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                <strong>${employeeName}</strong> has submitted a new leave request that requires your approval.
              </p>
              
              <!-- Leave Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Employee:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${employeeName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Leave Type:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right; text-transform: capitalize;">${leaveType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Start Date:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${startDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">End Date:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${endDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Total Days:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right; font-weight: 700;">${totalDays} days</td>
                      </tr>
                      ${reason ? `
                      <tr>
                        <td colspan="2" style="padding: 16px 0 8px; color: #4a5568; font-size: 14px; font-weight: 600;">Reason:</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0; color: #2d3748; font-size: 14px; line-height: 1.6;">${reason}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${leaveRequestLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                      Review Leave Request
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Please review this request at your earliest convenience.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #4a5568; font-size: 14px;">
                Best regards,<br>
                <strong>${tenantName}</strong><br>
                TimePulse Team
              </p>
              <p style="margin: 10px 0 0; color: #a0aec0; font-size: 12px;">
                This is an automated notification from TimePulse.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  getLeaveRequestApprovedTemplate({
    employeeName,
    approverName,
    leaveType,
    startDate,
    endDate,
    totalDays,
    comments,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Request Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✅ Leave Request Approved!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                Dear <strong>${employeeName}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Great news! Your leave request has been <strong style="color: #38a169;">approved</strong>.
              </p>
              
              <!-- Leave Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fff4; border-radius: 8px; border-left: 4px solid #48bb78; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Leave Type:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right; text-transform: capitalize;">${leaveType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Start Date:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${startDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">End Date:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${endDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Total Days:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right; font-weight: 700;">${totalDays} days</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Approved by:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${approverName}</td>
                      </tr>
                      ${comments ? `
                      <tr>
                        <td colspan="2" style="padding: 16px 0 8px; color: #4a5568; font-size: 14px; font-weight: 600;">Comments:</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0; color: #2d3748; font-size: 14px; line-height: 1.6;">${comments}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #4a5568; font-size: 16px; line-height: 1.6; text-align: center; font-style: italic;">
                Enjoy your time off! 🎉
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #4a5568; font-size: 14px;">
                Best regards,<br>
                <strong>${tenantName}</strong><br>
                TimePulse Team
              </p>
              <p style="margin: 10px 0 0; color: #a0aec0; font-size: 12px;">
                This is an automated notification from TimePulse.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  getLeaveRequestRejectedTemplate({
    employeeName,
    approverName,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    tenantName,
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Request Status</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #718096 0%, #4a5568 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">ℹ️ Leave Request Status Update</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                Dear <strong>${employeeName}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your leave request has been reviewed and could not be approved at this time.
              </p>
              
              <!-- Leave Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 8px; border-left: 4px solid #718096; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Leave Type:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right; text-transform: capitalize;">${leaveType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Start Date:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${startDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">End Date:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${endDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Total Days:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right; font-weight: 700;">${totalDays} days</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Reviewed by:</td>
                        <td style="padding: 8px 0; color: #2d3748; font-size: 14px; text-align: right;">${approverName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${reason ? `
              <!-- Reason Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border-radius: 8px; border-left: 4px solid #fc8181; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #4a5568; font-size: 14px; font-weight: 600;">Reason:</p>
                    <p style="margin: 0; color: #2d3748; font-size: 14px; line-height: 1.6;">${reason}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If you have any questions or would like to discuss this further, please contact <strong>${approverName}</strong> or your HR department.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #4a5568; font-size: 14px;">
                Best regards,<br>
                <strong>${tenantName}</strong><br>
                TimePulse Team
              </p>
              <p style="margin: 10px 0 0; color: #a0aec0; font-size: 12px;">
                This is an automated notification from TimePulse.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

module.exports = new LeaveManagementEmailService();
