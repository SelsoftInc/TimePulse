/**
 * Email Service Utility
 * Handles sending emails for employee onboarding and password reset
 */

const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Generate a random temporary password
 * @returns {string} Temporary password
 */
const generateTemporaryPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Send welcome email with temporary password to new employee
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.employeeName - Employee's full name
 * @param {string} options.temporaryPassword - Temporary password
 * @param {string} options.companyName - Company/tenant name
 * @param {string} options.loginUrl - Login URL
 */
const sendWelcomeEmail = async ({ to, employeeName, temporaryPassword, companyName, loginUrl }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${companyName} - TimePulse" <${process.env.SMTP_USER}>`,
      to,
      subject: `Welcome to ${companyName} - Your TimePulse Account`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .credentials-box {
              background: white;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .password {
              font-family: 'Courier New', monospace;
              font-size: 18px;
              font-weight: bold;
              color: #667eea;
              background: #f0f0f0;
              padding: 10px;
              border-radius: 5px;
              display: inline-block;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to TimePulse!</h1>
          </div>
          <div class="content">
            <p>Dear ${employeeName},</p>
            
            <p>Welcome to <strong>${companyName}</strong>! Your TimePulse account has been created successfully.</p>
            
            <div class="credentials-box">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${to}</p>
              <p><strong>Temporary Password:</strong></p>
              <div class="password">${temporaryPassword}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <p>This is a temporary password. For security reasons, you will be required to change your password upon first login.</p>
            </div>
            
            <p>To get started, please click the button below to log in:</p>
            
            <a href="${loginUrl}" class="button">Login to TimePulse</a>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #667eea;">${loginUrl}</p>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Click the login button above</li>
              <li>Enter your email and temporary password</li>
              <li>You'll be prompted to create a new secure password</li>
              <li>Complete your profile setup</li>
            </ol>
            
            <p>If you have any questions or need assistance, please contact your HR department or system administrator.</p>
            
            <p>Best regards,<br>
            <strong>${companyName} Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from TimePulse. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} TimePulse. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to ${companyName}!

Dear ${employeeName},

Your TimePulse account has been created successfully.

Login Credentials:
Email: ${to}
Temporary Password: ${temporaryPassword}

⚠️ IMPORTANT: This is a temporary password. You will be required to change it upon first login.

Login URL: ${loginUrl}

Next Steps:
1. Visit the login page
2. Enter your email and temporary password
3. Create a new secure password
4. Complete your profile setup

If you have any questions, please contact your HR department.

Best regards,
${companyName} Team
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.employeeName - Employee's full name
 * @param {string} options.resetToken - Password reset token
 * @param {string} options.companyName - Company/tenant name
 * @param {string} options.resetUrl - Password reset URL
 */
const sendPasswordResetEmail = async ({ to, employeeName, resetToken, companyName, resetUrl }) => {
  try {
    const transporter = createTransporter();
    
    const fullResetUrl = `${resetUrl}?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${companyName} - TimePulse" <${process.env.SMTP_USER}>`,
      to,
      subject: `Password Reset Request - ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Dear ${employeeName},</p>
            
            <p>We received a request to reset your password for your TimePulse account at <strong>${companyName}</strong>.</p>
            
            <p>To reset your password, please click the button below:</p>
            
            <a href="${fullResetUrl}" class="button">Reset Password</a>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #667eea; word-break: break-all;">${fullResetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p>This password reset link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this password reset, please ignore this email or contact your system administrator if you have concerns.</p>
            </div>
            
            <p>Best regards,<br>
            <strong>${companyName} Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from TimePulse. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} TimePulse. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

Dear ${employeeName},

We received a request to reset your password for your TimePulse account at ${companyName}.

To reset your password, please visit:
${fullResetUrl}

⚠️ IMPORTANT: This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
${companyName} Team
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

module.exports = {
  generateTemporaryPassword,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
