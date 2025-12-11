'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import "./ManualInvoiceForm.css";

const ManualInvoiceForm = () => {
  const router = useRouter();
  const { subdomain } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data sources
  const [vendors, setVendors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    selectedVendor: "",
    selectedEmployee: "",
    selectedClient: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    periodStart: "",
    periodEnd: "",
    lineItems: [
      {
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0},
    ],
    subtotal: 0,
    tax: 0,
    taxRate: 0,
    total: 0,
    notes: "",
    status: "draft"});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      if (!userInfo.tenantId) {
        throw new Error("No tenant information available");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`};

      // Fetch all data in parallel
      const [vendorsRes, employeesRes, clientsRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/vendors?tenantId=${userInfo.tenantId}`,
          { headers }
        ),
        fetch(
          `${API_BASE}/api/employees?tenantId=${userInfo.tenantId}`,
          { headers }
        ),
        fetch(
          `${API_BASE}/api/clients?tenantId=${userInfo.tenantId}`,
          { headers }
        ),
      ]);

      const [vendorsData, employeesData, clientsData] = await Promise.all([
        vendorsRes.json(),
        employeesRes.json(),
        clientsRes.json(),
      ]);

      if (vendorsData.success) setVendors(vendorsData.vendors || []);
      if (employeesData.success) setEmployees(employeesData.employees || []);
      if (clientsData.success) setClients(clientsData.clients || []);

      // Generate invoice number
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber()}));
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `INV-${year}${month}${day}-${random}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value}));
  };

  const handleVendorChange = (e) => {
    const vendorId = e.target.value;
    const vendor = vendors.find((v) => v.id === vendorId);

    setFormData((prev) => ({
      ...prev,
      selectedVendor: vendorId,
      clientName: vendor ? vendor.name : "",
      clientEmail: vendor ? vendor.email : "",
      clientAddress: vendor ? formatAddress(vendor.address) : ""}));
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const employee = employees.find((emp) => emp.id === employeeId);

    if (employee) {
      setFormData((prev) => ({
        ...prev,
        selectedEmployee: employeeId,
        lineItems: [
          {
            description: `Services by ${employee.firstName} ${employee.lastName}`,
            quantity: 1,
            rate: employee.hourlyRate || 0,
            amount: employee.hourlyRate || 0},
        ]}));
      calculateTotals([
        {
          description: `Services by ${employee.firstName} ${employee.lastName}`,
          quantity: 1,
          rate: employee.hourlyRate || 0,
          amount: employee.hourlyRate || 0},
      ]);
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    const client = clients.find((c) => c.id === clientId);

    setFormData((prev) => ({
      ...prev,
      selectedClient: clientId,
      clientName: client ? client.clientName : "",
      clientEmail: client ? client.email : "",
      clientAddress: client ? formatAddress(client.address) : ""}));
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== "object") return "";
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]: value};

    // Calculate amount for this line item
    if (field === "quantity" || field === "rate") {
      const quantity =
        field === "quantity" ? parseFloat(value) : newLineItems[index].quantity;
      const rate =
        field === "rate" ? parseFloat(value) : newLineItems[index].rate;
      newLineItems[index].amount = quantity * rate;
    }

    setFormData((prev) => ({
      ...prev,
      lineItems: newLineItems}));

    calculateTotals(newLineItems);
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          description: "",
          quantity: 1,
          rate: 0,
          amount: 0},
      ]}));
  };

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      const newLineItems = formData.lineItems.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        lineItems: newLineItems}));
      calculateTotals(newLineItems);
    }
  };

  const calculateTotals = (lineItems) => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const tax = subtotal * (formData.taxRate / 100);
    const total = subtotal + tax;

    setFormData((prev) => ({
      ...prev,
      subtotal,
      tax,
      total}));
  };

  const handleTaxRateChange = (e) => {
    const taxRate = parseFloat(e.target.value) || 0;
    setFormData((prev) => ({
      ...prev,
      taxRate,
      tax: prev.subtotal * (taxRate / 100),
      total: prev.subtotal + prev.subtotal * (taxRate / 100)}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`};

      const invoiceData = {
        ...formData,
        tenantId: userInfo.tenantId,
        vendorId: formData.selectedVendor,
        employeeId: formData.selectedEmployee,
        clientId: formData.selectedClient,
        total: formData.total,
        status: "draft"};

      const response = await fetch(`${API_BASE}/api/invoices`, {
        method: "POST",
        headers,
        body: JSON.stringify(invoiceData)});

      const result = await response.json();

      if (result.success) {
        router.push(`/${subdomain}/invoices/new`);
      } else {
        throw new Error(result.error || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="manual-invoice-form-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manual-invoice-form-container">
      <div className="form-header">
        <button
          onClick={() => router.push(`/${subdomain}/invoices/new`)}
          className="btn btn-back"
        >
          <i className="fas fa-arrow-left mr-1"></i> Back to Options
        </button>
        <h1>Create Invoice - Manual Population</h1>
        <p>
          Select from existing vendors, employees, and clients to auto-populate
          invoice details
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="invoice-form">
        <div className="form-grid">
          {/* Left Column - Invoice Details */}
          <div className="form-section">
            <h3>Invoice Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Invoice Date *</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <h3>Select Vendor</h3>
            <div className="form-group">
              <label>Vendor *</label>
              <select
                name="selectedVendor"
                value={formData.selectedVendor}
                onChange={handleVendorChange}
                required
              >
                <option value="">Select a vendor...</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} - {vendor.category}
                  </option>
                ))}
              </select>
            </div>

            <h3>Select Employee</h3>
            <div className="form-group">
              <label>Employee *</label>
              <select
                name="selectedEmployee"
                value={formData.selectedEmployee}
                onChange={handleEmployeeChange}
                required
              >
                <option value="">Select an employee...</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - $
                    {employee.hourlyRate}/hr
                  </option>
                ))}
              </select>
            </div>

            <h3>Select Client</h3>
            <div className="form-group">
              <label>Client *</label>
              <select
                name="selectedClient"
                value={formData.selectedClient}
                onChange={handleClientChange}
                required
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.clientName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column - Client Details & Line Items */}
          <div className="form-section">
            <h3>Bill To</h3>

            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Client Email</label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Client Address</label>
              <textarea
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <h3>Line Items</h3>
            {formData.lineItems.map((item, index) => (
              <div key={index} className="line-item">
                <div className="form-row">
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          "quantity",
                          parseFloat(e.target.value)
                        )
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Rate</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          "rate",
                          parseFloat(e.target.value)
                        )
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="btn btn-danger btn-sm"
                      disabled={formData.lineItems.length === 1}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addLineItem}
              className="btn btn-outline-primary"
            >
              <i className="fas fa-plus mr-1"></i> Add Line Item
            </button>

            <div className="totals-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={handleTaxRateChange}
                  />
                </div>
              </div>

              <div className="totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax:</span>
                  <span>${formData.tax.toFixed(2)}</span>
                </div>
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>${formData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Additional notes or terms..."
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => router.push(`/${subdomain}/invoices/new`)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-1"></i>
                Create Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualInvoiceForm;
