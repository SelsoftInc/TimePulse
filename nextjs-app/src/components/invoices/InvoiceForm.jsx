'use client';

import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import './InvoiceForm.css';

const InvoiceForm = () => {
  const router = useRouter();
  const { subdomain } = useParams();
  const pathname = usePathname();
  
  // Get pre-filled data from navigation state (from timesheet conversion)
  const preFilledData = location.state?.invoiceData;
  const fromTimesheet = location.state?.fromTimesheet || false;
  
  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    periodStart: '',
    periodEnd: '',
    lineItems: [
      {
        description: '',
        quantity: 0,
        rate: 0,
        amount: 0}
    ],
    subtotal: 0,
    tax: 0,
    taxRate: 0,
    total: 0,
    notes: '',
    status: 'draft'});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form with pre-filled data if available
  useEffect(() => {
    if (preFilledData) {
      setFormData({
        invoiceNumber: preFilledData.invoiceNumber || generateInvoiceNumber(),
        invoiceDate: preFilledData.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: preFilledData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clientName: preFilledData.clientName || '',
        clientEmail: preFilledData.clientEmail || '',
        clientAddress: preFilledData.clientAddress || '',
        periodStart: preFilledData.periodStart || '',
        periodEnd: preFilledData.periodEnd || '',
        lineItems: preFilledData.lineItems || [
          {
            description: '',
            quantity: 0,
            rate: 0,
            amount: 0}
        ],
        subtotal: preFilledData.subtotal || 0,
        tax: preFilledData.tax || 0,
        taxRate: 0,
        total: preFilledData.total || 0,
        notes: preFilledData.notes || '',
        status: preFilledData.status || 'draft'});
      
      if (fromTimesheet) {
        setSuccess('Invoice data successfully imported from timesheet analysis!');
      }
    } else {
      // Generate invoice number for new invoices
      setFormData(prev => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber()
      }));
    }
  }, [preFilledData, fromTimesheet]);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Recalculate totals if relevant fields change
    if (field === 'taxRate') {
      calculateTotals({ ...formData, [field]: value });
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedLineItems = [...formData.lineItems];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [field]: value
    };
    
    // Calculate amount for this line item
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : updatedLineItems[index].quantity;
      const rate = field === 'rate' ? parseFloat(value) || 0 : updatedLineItems[index].rate;
      updatedLineItems[index].amount = quantity * rate;
    }
    
    const newFormData = {
      ...formData,
      lineItems: updatedLineItems
    };
    
    setFormData(newFormData);
    calculateTotals(newFormData);
  };

  const calculateTotals = (data = formData) => {
    const subtotal = data.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = subtotal * (data.taxRate / 100);
    const total = subtotal + tax;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          description: '',
          quantity: 0,
          rate: 0,
          amount: 0}
      ]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      const updatedLineItems = formData.lineItems.filter((_, i) => i !== index);
      const newFormData = {
        ...formData,
        lineItems: updatedLineItems
      };
      setFormData(newFormData);
      calculateTotals(newFormData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.clientName.trim()) {
        throw new Error('Client name is required');
      }
      
      if (formData.lineItems.length === 0 || !formData.lineItems[0].description.trim()) {
        throw new Error('At least one line item with description is required');
      }
      
      // Simulate API call to save invoice
      console.log('Saving invoice:', formData);
      
      // In a real app, you would make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Invoice created successfully!');
      
      // Navigate back to invoices list after a short delay
      setTimeout(() => {
        router.push(`/${subdomain}/invoices`);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError(error.message || 'Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const draftData = {
        ...formData,
        status: 'draft'
      };
      
      console.log('Saving draft:', draftData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccess('Draft saved successfully!');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Failed to save draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="invoice-form-container">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title">
                  {preFilledData ? 'Create Invoice from Timesheet' : 'Create New Invoice'}
                </h3>
                <div className="nk-block-des text-soft">
                  <p>
                    {fromTimesheet 
                      ? 'Review and customize the invoice generated from timesheet data.'
                      : 'Create a new invoice for your client.'
                    }
                  </p>
                </div>
              </div>
              <div className="nk-block-head-content">
                <button 
                  className="btn btn-outline-light bg-white d-none d-sm-inline-flex"
                  onClick={() => router.push(`/${subdomain}/invoices`)}
                >
                  <em className="icon ni ni-arrow-left"></em>
                  <span>Back to Invoices</span>
                </button>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="nk-block">
              <div className="alert alert-danger">
                <em className="icon ni ni-alert-circle"></em>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="nk-block">
              <div className="alert alert-success">
                <em className="icon ni ni-check-circle"></em>
                {success}
              </div>
            </div>
          )}

          {/* Timesheet Source Info */}
          {fromTimesheet && preFilledData?.timesheetData && (
            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  <h6 className="card-title">Source Timesheet Information</h6>
                  <div className="timesheet-source-info">
                    <div className="row gy-3">
                      <div className="col-md-4">
                        <div className="info-item">
                          <span className="info-label">Vendor:</span>
                          <span className="info-value">
                            {preFilledData.timesheetData.Vendor_Name || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="info-item">
                          <span className="info-label">Hours:</span>
                          <span className="info-value">
                            {preFilledData.timesheetData['Total Hours'] || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="info-item">
                          <span className="info-label">Period:</span>
                          <span className="info-value">
                            {preFilledData.timesheetData.Duration || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {preFilledData.processingCost && (
                      <div className="processing-cost">
                        <small className="text-muted">
                          AI Processing Cost: {preFilledData.processingCost}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Invoice Header */}
            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  <h6 className="card-title">Invoice Information</h6>
                  <div className="row gy-3">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Invoice Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.invoiceNumber}
                          onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Invoice Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.invoiceDate}
                          onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Due Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.dueDate}
                          onChange={(e) => handleInputChange('dueDate', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  <h6 className="card-title">Client Information</h6>
                  <div className="row gy-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Client Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.clientName}
                          onChange={(e) => handleInputChange('clientName', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Client Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.clientEmail}
                          onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Client Address</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.clientAddress}
                          onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Period */}
            {(formData.periodStart || formData.periodEnd) && (
              <div className="nk-block">
                <div className="card">
                  <div className="card-inner">
                    <h6 className="card-title">Service Period</h6>
                    <div className="row gy-3">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Period Start</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.periodStart}
                            onChange={(e) => handleInputChange('periodStart', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Period End</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.periodEnd}
                            onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Line Items */}
            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  <div className="card-title-group">
                    <h6 className="card-title">Line Items</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={addLineItem}
                    >
                      <em className="icon ni ni-plus"></em>
                      Add Item
                    </button>
                  </div>
                  
                  <div className="line-items-container">
                    {formData.lineItems.map((item, index) => (
                      <div key={index} className="line-item">
                        <div className="row gy-3">
                          <div className="col-md-5">
                            <div className="form-group">
                              <label className="form-label">Description</label>
                              <input
                                type="text"
                                className="form-control"
                                value={item.description}
                                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                placeholder="Service description"
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-2">
                            <div className="form-group">
                              <label className="form-label">Quantity</label>
                              <input
                                type="number"
                                className="form-control"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                min="0"
                                step="0.01"
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-2">
                            <div className="form-group">
                              <label className="form-label">Rate ($)</label>
                              <input
                                type="number"
                                className="form-control"
                                value={item.rate}
                                onChange={(e) => handleLineItemChange(index, 'rate', e.target.value)}
                                min="0"
                                step="0.01"
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-2">
                            <div className="form-group">
                              <label className="form-label">Amount ($)</label>
                              <input
                                type="text"
                                className="form-control"
                                value={item.amount.toFixed(2)}
                                readOnly
                              />
                            </div>
                          </div>
                          <div className="col-md-1">
                            <div className="form-group">
                              <label className="form-label">&nbsp;</label>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeLineItem(index)}
                                disabled={formData.lineItems.length === 1}
                              >
                                <em className="icon ni ni-trash"></em>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  <h6 className="card-title">Invoice Totals</h6>
                  <div className="row gy-3">
                    <div className="col-md-8">
                      <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Additional notes or terms..."
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="totals-section">
                        <div className="total-line">
                          <span>Subtotal:</span>
                          <span>${formData.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="total-line">
                          <div className="d-flex align-items-center">
                            <span>Tax:</span>
                            <input
                              type="number"
                              className="form-control form-control-sm ms-2"
                              style={{ width: '80px' }}
                              value={formData.taxRate}
                              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0"
                            />
                            <span className="ms-1">%</span>
                          </div>
                          <span>${formData.tax.toFixed(2)}</span>
                        </div>
                        <div className="total-line total-final">
                          <span><strong>Total:</strong></span>
                          <span><strong>${formData.total.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="nk-block">
              <div className="card">
                <div className="card-inner">
                  <div className="form-group">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Invoice...
                        </>
                      ) : (
                        <>
                          <em className="icon ni ni-check"></em>
                          Create Invoice
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      className="btn btn-outline-primary ms-2"
                      onClick={handleSaveDraft}
                      disabled={isSubmitting}
                    >
                      <em className="icon ni ni-save"></em>
                      Save as Draft
                    </button>
                    
                    <button
                      type="button"
                      className="btn btn-outline-light ms-2"
                      onClick={() => router.push(`/${subdomain}/invoices`)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
