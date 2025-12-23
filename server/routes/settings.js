const express = require('express');
const router = express.Router();
const { models, sequelize, Sequelize } = require('../models');
const { Op } = require('sequelize');

const { Tenant, User, NotificationPreference } = models;

// ==================== INVOICE SETTINGS ====================

// Get invoice settings for a tenant
router.get('/invoice-settings/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get settings from tenant.settings JSONB field
    const settings = tenant.settings || {};
    const invoiceSettings = settings.invoiceSettings || {};

    // Return invoice settings with defaults
    const response = {
      // Company Information
      companyName: tenant.tenantName || '',
      companyEmail: tenant.contactInfo?.email || '',
      companyAddress: tenant.contactAddress?.street || '',
      companyCity: tenant.contactAddress?.city || '',
      companyState: tenant.contactAddress?.state || '',
      companyZip: tenant.contactAddress?.zipCode || '',
      companyCountry: tenant.contactAddress?.country || 'US',
      companyPhone: tenant.contactInfo?.phone || '',
      taxId: tenant.taxInfo?.taxId || '',

      // Invoice Setup
      invoiceNumberPrefix: invoiceSettings.invoiceNumberPrefix || 'INV-',
      nextInvoiceNumber: invoiceSettings.nextInvoiceNumber || '001',
      invoiceNumberFormat: invoiceSettings.invoiceNumberFormat || 'sequential',

      // Invoice Cycle
      defaultPaymentTerms: invoiceSettings.defaultPaymentTerms || 'Net 30',
      customPaymentDays: invoiceSettings.customPaymentDays || 30,
      lateFeeEnabled: invoiceSettings.lateFeeEnabled || false,
      lateFeePercentage: invoiceSettings.lateFeePercentage || 1.5,
      lateFeeGracePeriod: invoiceSettings.lateFeeGracePeriod || 5,

      // Display Options
      currency: invoiceSettings.currency || 'USD',
      currencySymbol: invoiceSettings.currencySymbol || '$',
      currencyPosition: invoiceSettings.currencyPosition || 'before',
      decimalPlaces: invoiceSettings.decimalPlaces || 2,
      thousandsSeparator: invoiceSettings.thousandsSeparator || ',',
      decimalSeparator: invoiceSettings.decimalSeparator || '.',
      showHours: invoiceSettings.showHours !== undefined ? invoiceSettings.showHours : true,
      showRates: invoiceSettings.showRates !== undefined ? invoiceSettings.showRates : true,
      showTaxes: invoiceSettings.showTaxes !== undefined ? invoiceSettings.showTaxes : true,
      showDiscounts: invoiceSettings.showDiscounts || false,

      // Email Template
      emailSubject: invoiceSettings.emailSubject || 'Invoice #{invoice_number} from {company_name}',
      emailTemplate: invoiceSettings.emailTemplate || 'Dear {client_name},\n\nPlease find attached invoice #{invoice_number} for services rendered.\n\nThank you for your business!\n\nBest regards,\n{company_name}',
      emailHeaderColor: invoiceSettings.emailHeaderColor || '#bdd7ff',
      emailAccentColor: invoiceSettings.emailAccentColor || '#6c757d',
      emailBackgroundColor: invoiceSettings.emailBackgroundColor || '#fafafa',
      emailTextColor: invoiceSettings.emailTextColor || '#212529',
      emailFontFamily: invoiceSettings.emailFontFamily || 'Arial, sans-serif',
      emailFontSize: invoiceSettings.emailFontSize || '14',
      emailButtonColor: invoiceSettings.emailButtonColor || '#00378a',
      emailButtonTextColor: invoiceSettings.emailButtonTextColor || '#ffffff',

      // Automation
      autoSendInvoices: invoiceSettings.autoSendInvoices || false,
      sendReminders: invoiceSettings.sendReminders !== undefined ? invoiceSettings.sendReminders : true,
      reminderDays: invoiceSettings.reminderDays || [7, 3, 1],

      isConfigured: invoiceSettings.isConfigured || false
    };

    res.json({ success: true, settings: response });

  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoice settings',
      details: error.message 
    });
  }
});

// Update invoice settings for a tenant
router.put('/invoice-settings/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updateData = req.body;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get existing settings
    const settings = tenant.settings || {};
    
    // Update invoice settings
    settings.invoiceSettings = {
      ...settings.invoiceSettings,
      invoiceNumberPrefix: updateData.invoiceNumberPrefix,
      nextInvoiceNumber: updateData.nextInvoiceNumber,
      invoiceNumberFormat: updateData.invoiceNumberFormat,
      defaultPaymentTerms: updateData.defaultPaymentTerms,
      customPaymentDays: updateData.customPaymentDays,
      lateFeeEnabled: updateData.lateFeeEnabled,
      lateFeePercentage: updateData.lateFeePercentage,
      lateFeeGracePeriod: updateData.lateFeeGracePeriod,
      currency: updateData.currency,
      currencySymbol: updateData.currencySymbol,
      currencyPosition: updateData.currencyPosition,
      decimalPlaces: updateData.decimalPlaces,
      thousandsSeparator: updateData.thousandsSeparator,
      decimalSeparator: updateData.decimalSeparator,
      showHours: updateData.showHours,
      showRates: updateData.showRates,
      showTaxes: updateData.showTaxes,
      showDiscounts: updateData.showDiscounts,
      emailSubject: updateData.emailSubject,
      emailTemplate: updateData.emailTemplate,
      emailHeaderColor: updateData.emailHeaderColor,
      emailAccentColor: updateData.emailAccentColor,
      emailBackgroundColor: updateData.emailBackgroundColor,
      emailTextColor: updateData.emailTextColor,
      emailFontFamily: updateData.emailFontFamily,
      emailFontSize: updateData.emailFontSize,
      emailButtonColor: updateData.emailButtonColor,
      emailButtonTextColor: updateData.emailButtonTextColor,
      autoSendInvoices: updateData.autoSendInvoices,
      sendReminders: updateData.sendReminders,
      reminderDays: updateData.reminderDays,
      isConfigured: true
    };

    // Update tenant company information if provided
    const tenantUpdate = {
      settings: settings
    };

    if (updateData.companyName) {
      tenantUpdate.tenantName = updateData.companyName;
    }

    if (updateData.companyAddress || updateData.companyCity || updateData.companyState || updateData.companyZip || updateData.companyCountry) {
      tenantUpdate.contactAddress = {
        ...(tenant.contactAddress || {}),
        street: updateData.companyAddress || tenant.contactAddress?.street,
        city: updateData.companyCity || tenant.contactAddress?.city,
        state: updateData.companyState || tenant.contactAddress?.state,
        zipCode: updateData.companyZip || tenant.contactAddress?.zipCode,
        country: updateData.companyCountry || tenant.contactAddress?.country
      };
    }

    if (updateData.companyEmail || updateData.companyPhone) {
      tenantUpdate.contactInfo = {
        ...(tenant.contactInfo || {}),
        email: updateData.companyEmail || tenant.contactInfo?.email,
        phone: updateData.companyPhone || tenant.contactInfo?.phone
      };
    }

    if (updateData.taxId) {
      tenantUpdate.taxInfo = {
        ...(tenant.taxInfo || {}),
        taxId: updateData.taxId
      };
    }

    await tenant.update(tenantUpdate);

    res.json({ 
      success: true, 
      message: 'Invoice settings updated successfully' 
    });

  } catch (error) {
    console.error('Error updating invoice settings:', error);
    res.status(500).json({ 
      error: 'Failed to update invoice settings',
      details: error.message 
    });
  }
});

// ==================== NOTIFICATION PREFERENCES ====================

// Get notification preferences for a user
router.get('/notification-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if NotificationPreference table exists
    let preferences = null;
    try {
      preferences = await NotificationPreference.findOne({
        where: { userId: userId }
      });
    } catch (error) {
      console.log('NotificationPreference table may not exist, using defaults');
    }

    // Return preferences with defaults
    const response = {
      // Email Notifications
      emailTimeEntryReminders: preferences?.emailTimeEntryReminders !== undefined ? preferences.emailTimeEntryReminders : true,
      emailApprovalRequests: preferences?.emailApprovalRequests !== undefined ? preferences.emailApprovalRequests : true,
      emailWeeklyReports: preferences?.emailWeeklyReports !== undefined ? preferences.emailWeeklyReports : true,
      emailProjectUpdates: preferences?.emailProjectUpdates !== undefined ? preferences.emailProjectUpdates : false,
      emailSystemAnnouncements: preferences?.emailSystemAnnouncements !== undefined ? preferences.emailSystemAnnouncements : true,
      emailDigestFrequency: preferences?.emailDigestFrequency || 'daily',

      // Push Notifications (In-App)
      pushTimeEntryReminders: preferences?.pushTimeEntryReminders !== undefined ? preferences.pushTimeEntryReminders : false,
      pushApprovalRequests: preferences?.pushApprovalRequests !== undefined ? preferences.pushApprovalRequests : true,
      pushProjectUpdates: preferences?.pushProjectUpdates !== undefined ? preferences.pushProjectUpdates : true,
      pushSystemAnnouncements: preferences?.pushSystemAnnouncements !== undefined ? preferences.pushSystemAnnouncements : false
    };

    res.json({ success: true, preferences: response });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notification preferences',
      details: error.message 
    });
  }
});

// Update notification preferences for a user
router.put('/notification-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Try to find or create notification preferences
    let preferences = null;
    try {
      [preferences] = await NotificationPreference.findOrCreate({
        where: { userId: userId },
        defaults: {
          userId: userId,
          ...updateData
        }
      });

      // Update if it already existed
      await preferences.update(updateData);

    } catch (error) {
      // If table doesn't exist, store in user settings
      console.log('Storing notification preferences in user settings');
      const userSettings = user.settings || {};
      userSettings.notificationPreferences = updateData;
      await user.update({ settings: userSettings });
    }

    res.json({ 
      success: true, 
      message: 'Notification preferences updated successfully' 
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ 
      error: 'Failed to update notification preferences',
      details: error.message 
    });
  }
});

// ==================== USER PROFILE ====================

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📥 Fetching profile for user:', userId);

    // Only select fields that exist in User model
    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'tenantId', 'department', 'title', 'managerId']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.email);

    // Try to get employee information
    let employeeInfo = null;
    let phone = null;
    let employeeId = null;

    if (models.Employee) {
      try {
        const { Employee } = models;
        // Find employee by user email or user ID
        const employee = await Employee.findOne({
          where: {
            [Op.or]: [
              { email: user.email },
              { id: userId }
            ],
            tenantId: user.tenantId
          },
          attributes: ['id', 'employeeId', 'phone', 'department', 'position', 'startDate']
        });
        
        if (employee) {
          phone = employee.phone;
          employeeId = employee.employeeId;
          employeeInfo = {
            employeeId: employee.id,
            department: employee.department || user.department,
            position: employee.position || user.title,
            startDate: employee.startDate
          };
          console.log('✅ Employee info found');
        } else {
          console.log('⚠️ No employee record found, using User data');
          employeeInfo = {
            department: user.department,
            position: user.title
          };
        }
      } catch (error) {
        console.log('⚠️ Could not fetch employee info:', error.message);
        // Fallback to User model data
        employeeInfo = {
          department: user.department,
          position: user.title
        };
      }
    } else {
      // Employee model doesn't exist, use User data
      employeeInfo = {
        department: user.department,
        position: user.title
      };
    }

    const response = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: phone || '',
      role: user.role,
      tenantId: user.tenantId,
      employeeId: employeeId || '',
      employee: employeeInfo,
      settings: {}
    };

    console.log('📤 Sending profile response');
    res.json({ success: true, user: response });

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch user profile',
      details: error.message 
    });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    console.log('📝 Updating profile for user:', userId);
    console.log('📦 Update data:', updateData);

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields that exist in User model
    const userUpdate = {};
    
    if (updateData.firstName !== undefined) userUpdate.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) userUpdate.lastName = updateData.lastName;
    if (updateData.email !== undefined) userUpdate.email = updateData.email;
    if (updateData.department !== undefined) userUpdate.department = updateData.department;
    if (updateData.position !== undefined) userUpdate.title = updateData.position; // Map position to title

    console.log('💾 Updating user with:', userUpdate);
    await user.update(userUpdate);
    console.log('✅ User updated successfully');

    // Update employee information if Employee model exists
    if (updateData.phone !== undefined || updateData.department !== undefined || updateData.position !== undefined) {
      try {
        if (models.Employee) {
          const { Employee } = models;
          // Find employee by user email or ID
          let employee = await Employee.findOne({
            where: {
              [Op.or]: [
                { email: user.email },
                { id: userId }
              ],
              tenantId: user.tenantId
            }
          });
          
          if (employee) {
            const employeeUpdate = {};
            if (updateData.phone !== undefined) employeeUpdate.phone = updateData.phone;
            if (updateData.department !== undefined) employeeUpdate.department = updateData.department;
            if (updateData.position !== undefined) employeeUpdate.position = updateData.position;
            console.log('💾 Updating employee with:', employeeUpdate);
            await employee.update(employeeUpdate);
            console.log('✅ Employee updated successfully');
          } else {
            console.log('⚠️ No employee record found, data updated in User table only');
          }
        }
      } catch (error) {
        console.log('⚠️ Could not update employee info:', error.message);
        // Don't fail the request if employee update fails
      }
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update user profile',
      details: error.message 
    });
  }
});

module.exports = router;
