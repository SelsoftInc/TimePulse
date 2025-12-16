# 🔄 AXIOS PATTERNS - Quick Reference

## 📋 Common Patterns from Original React App

### **1. GET Requests**

```javascript
// Simple GET
const response = await axios.get(`${API_BASE}/api/endpoint`, {
  params: { tenantId }
});
const data = response.data;

// GET with path params
const response = await axios.get(`${API_BASE}/api/employees/${id}`, {
  params: { tenantId }
});

// GET with multiple params
const response = await axios.get(`${API_BASE}/api/timesheets`, {
  params: { tenantId, status: 'approved', date: dateStr }
});
```

### **2. POST Requests**

```javascript
// POST with body
const response = await axios.post(`${API_BASE}/api/invoices`, invoiceData);

// POST with query params
const response = await axios.post(
  `${API_BASE}/api/timesheets/${id}/generate-invoice?tenantId=${tenantId}`,
  { userId: user.id }
);
```

### **3. PUT Requests**

```javascript
// PUT with body and query params
const response = await axios.put(
  `${API_BASE}/api/invoices/${id}?tenantId=${tenantId}`,
  updatedData
);
```

### **4. DELETE Requests**

```javascript
// DELETE with query params
const response = await axios.delete(
  `${API_BASE}/api/employees/${id}?tenantId=${tenantId}`
);
```

---

## 🎯 Module-Specific Patterns

### **Invoice Module**

```javascript
// Get all invoices
const response = await axios.get(`${API_BASE}/api/invoices`, {
  params: { tenantId, startDate, endDate }
});

// Get invoice by ID
const response = await axios.get(`${API_BASE}/api/invoices/${id}`, {
  params: { tenantId }
});

// Create invoice
const response = await axios.post(`${API_BASE}/api/invoices`, invoiceData);

// Update invoice
const response = await axios.put(
  `${API_BASE}/api/invoices/${id}?tenantId=${tenantId}`,
  invoiceData
);

// Get PDF data
const response = await axios.get(
  `${API_BASE}/api/invoices/${id}/pdf-data?tenantId=${tenantId}`
);
```

### **Employee Module**

```javascript
// Get all employees
const response = await axios.get(`${API_BASE}/api/employees`, {
  params: { tenantId }
});

// Get employee by ID
const response = await axios.get(`${API_BASE}/api/employees/${id}`, {
  params: { tenantId }
});

// Create employee
const response = await axios.post(`${API_BASE}/api/employees`, employeeData);

// Update employee
const response = await axios.put(
  `${API_BASE}/api/employees/${id}?tenantId=${tenantId}`,
  employeeData
);

// Delete employee
const response = await axios.delete(
  `${API_BASE}/api/employees/${id}?tenantId=${tenantId}`
);
```

### **Timesheet Module**

```javascript
// Get pending approval
const response = await axios.get(`${API_BASE}/api/timesheets/pending-approval`, {
  params: { tenantId }
});

// Get by employee
const response = await axios.get(
  `${API_BASE}/api/timesheets/employee/${employeeId}/all?tenantId=${tenantId}`
);

// Get approved timesheets
const response = await axios.get(`${API_BASE}/api/timesheets/employee/approved`, {
  params: { tenantId }
});

// Generate invoice from timesheet
const response = await axios.post(
  `${API_BASE}/api/timesheets/${id}/generate-invoice?tenantId=${tenantId}`,
  { userId: user.id }
);
```

### **Client Module**

```javascript
// Get all clients
const response = await axios.get(`${API_BASE}/api/clients`, {
  params: { tenantId }
});

// Create client
const response = await axios.post(`${API_BASE}/api/clients`, clientData);

// Update client
const response = await axios.put(
  `${API_BASE}/api/clients/${id}?tenantId=${tenantId}`,
  clientData
);
```

### **Vendor Module**

```javascript
// Get all vendors
const response = await axios.get(`${API_BASE}/api/vendors`, {
  params: { tenantId }
});

// Create vendor
const response = await axios.post(`${API_BASE}/api/vendors`, vendorData);

// Update vendor
const response = await axios.put(
  `${API_BASE}/api/vendors/${id}?tenantId=${tenantId}`,
  vendorData
);
```

---

## ⚠️ IMPORTANT NOTES

1. **Always access data via `response.data`**
2. **tenantId is REQUIRED** for most endpoints
3. **Use params object** for query parameters in GET requests
4. **Use query string** for POST/PUT/DELETE if needed
5. **Check response.data.success** before using data

---

## ✅ RESPONSE STRUCTURE

```javascript
{
  success: true,
  data: [...],  // or single object
  message: "Success message",
  // ... other fields
}
```

Access like:
```javascript
if (response.data.success) {
  const items = response.data.data || response.data.employees || response.data.invoices;
  // use items
}
```
