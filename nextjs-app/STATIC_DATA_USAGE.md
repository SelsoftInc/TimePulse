# 📦 Static Data System - Complete Guide

## Overview

The TimePulse app now has **comprehensive hardcoded data** for all modules. When the backend server is not connected, the app automatically uses static mock data, allowing UI developers to work independently.

---

## 🎯 How It Works

### Automatic Detection

The system automatically detects if the server is connected:

- **Server Connected** → Uses real API data
- **Server Not Connected** → Uses static mock data
- **No configuration needed** → Works automatically!

### Login Triggers Static Mode

When you login with static credentials, the app enters "Static Mode":

```
Email:    shunmugavel@selsoftinc.com
Password: test123#
```

---

## 📊 Available Mock Data

### 1. **Employees** (5 employees)
- Shunmugavel Admin (CEO, Admin)
- John Developer (Senior Developer)
- Sarah Designer (UI/UX Designer)
- Mike Tester (QA Engineer)
- Emily Manager (Engineering Manager)

**Fields:** id, name, email, phone, role, department, designation, status, joinDate, salary, skills, etc.

### 2. **Projects** (4 projects)
- TimePulse Development (Active, 60% complete)
- Client Portal (Active, 40% complete)
- Mobile App (Planning, 5% complete)
- Analytics Dashboard (Completed, 100%)

**Fields:** id, name, description, status, priority, budget, spent, progress, client, team members, etc.

### 3. **Timesheets** (4 entries)
- Various statuses: approved, submitted, draft
- Different employees and projects
- Realistic hours and descriptions

**Fields:** id, employeeId, projectId, date, hours, description, status, billable, etc.

### 4. **Attendance** (4 records)
- Present, remote, and leave statuses
- Check-in/check-out times
- Work hours and overtime

**Fields:** id, employeeId, date, checkIn, checkOut, status, workHours, overtime, location

### 5. **Leave Requests** (3 requests)
- Approved, pending, and rejected statuses
- Different leave types: sick, vacation, personal
- Approval workflow data

**Fields:** id, employeeId, leaveType, startDate, endDate, days, reason, status, approvedBy

### 6. **Tasks** (3 tasks)
- Completed, in-progress, and todo statuses
- Assigned to different employees
- Estimated vs actual hours

**Fields:** id, title, description, projectId, assignedTo, status, priority, dueDate, hours, tags

### 7. **Clients** (3 clients)
- Active and inactive clients
- Contact information
- Associated projects

**Fields:** id, name, email, phone, address, status, projects, contactPerson, industry

### 8. **Notifications** (4 notifications)
- Info, success, warning types
- Read/unread status
- Links to relevant pages

**Fields:** id, title, message, type, read, createdAt, link

### 9. **Reports & Analytics**
- Dashboard statistics
- Productivity charts (6 months)
- Project stats with budget tracking

**Fields:** totalEmployees, activeProjects, revenue, productivity data, project stats

### 10. **Settings**
- Company information
- Work hours configuration
- Leave policies

**Fields:** company details, workHours, leave policies

---

## 💻 Usage in Components

### Method 1: Using apiClient (Recommended)

```javascript
import apiClient from '@/utils/apiClient';

// Automatically uses static data if server is down
const employees = await apiClient.get('/api/employees');
const projects = await apiClient.get('/api/projects');
const timesheets = await apiClient.get('/api/timesheets', { employeeId: 'EMP001' });
```

### Method 2: Using apiRequest

```javascript
import { apiRequest } from '@/services/staticApiService';

// Explicitly use static data
const employees = await apiRequest('GET', '/api/employees');
const result = await apiRequest('POST', '/api/timesheets', timesheetData);
```

### Method 3: Direct Access to Mock Data

```javascript
import { STATIC_MOCK_DATA } from '@/utils/staticAuth';

// Direct access to static data
const employees = STATIC_MOCK_DATA.employees;
const projects = STATIC_MOCK_DATA.projects;
```

---

## 🔧 Example Components

### Employee List Component

```javascript
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const response = await apiClient.get('/api/employees');
      if (response.success) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Employees ({employees.length})</h2>
      {employees.map(emp => (
        <div key={emp.id} className="employee-card">
          <h3>{emp.name}</h3>
          <p>{emp.designation} - {emp.department}</p>
          <p>{emp.email}</p>
          <span className={`status-${emp.status}`}>{emp.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### Dashboard Stats Component

```javascript
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';

export default function DashboardStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const response = await apiClient.get('/api/dashboard');
    if (response.success) {
      setStats(response.data);
    }
  }

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Total Employees</h3>
        <p className="stat-value">{stats.totalEmployees}</p>
      </div>
      <div className="stat-card">
        <h3>Active Projects</h3>
        <p className="stat-value">{stats.activeProjects}</p>
      </div>
      <div className="stat-card">
        <h3>Pending Timesheets</h3>
        <p className="stat-value">{stats.pendingTimesheets}</p>
      </div>
      <div className="stat-card">
        <h3>Total Hours</h3>
        <p className="stat-value">{stats.totalHours}</p>
      </div>
    </div>
  );
}
```

### Timesheet Form Component

```javascript
'use client';

import { useState } from 'react';
import apiClient from '@/utils/apiClient';

export default function TimesheetForm() {
  const [formData, setFormData] = useState({
    projectId: '',
    date: '',
    hours: '',
    description: ''
  });

  async function handleSubmit(e) {
    e.preventDefault();
    
    const response = await apiClient.post('/api/timesheets', formData);
    
    if (response.success) {
      alert('Timesheet submitted successfully!');
      // Reset form
      setFormData({ projectId: '', date: '', hours: '', description: '' });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
        required
      />
      <input
        type="number"
        placeholder="Hours"
        value={formData.hours}
        onChange={(e) => setFormData({...formData, hours: e.target.value})}
        required
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        required
      />
      <button type="submit">Submit Timesheet</button>
    </form>
  );
}
```

---

## 🎨 Filtering & Parameters

### Filter Timesheets by Employee

```javascript
const myTimesheets = await apiClient.get('/api/timesheets', {
  employeeId: 'EMP001'
});
```

### Filter Timesheets by Status

```javascript
const pendingTimesheets = await apiClient.get('/api/timesheets', {
  status: 'submitted'
});
```

### Filter Tasks by Project

```javascript
const projectTasks = await apiClient.get('/api/tasks', {
  projectId: 'PRJ001'
});
```

### Filter Leaves by Status

```javascript
const pendingLeaves = await apiClient.get('/api/leaves', {
  status: 'pending'
});
```

---

## 🔄 CRUD Operations

### Create (POST)

```javascript
const newProject = await apiClient.post('/api/projects', {
  name: 'New Project',
  description: 'Project description',
  status: 'active'
});
```

### Read (GET)

```javascript
const projects = await apiClient.get('/api/projects');
```

### Update (PUT)

```javascript
const updated = await apiClient.put('/api/employees/EMP001', {
  phone: '+1-555-9999'
});
```

### Delete (DELETE)

```javascript
const result = await apiClient.delete('/api/projects/PRJ003');
```

---

## 🚦 Check Current Mode

```javascript
import { isStaticMode } from '@/services/staticApiService';

if (isStaticMode()) {
  console.log('Using static data - server not connected');
} else {
  console.log('Connected to real server');
}
```

---

## 📝 Adding More Mock Data

Edit `src/utils/staticAuth.js`:

```javascript
export const STATIC_MOCK_DATA = {
  employees: [
    // Add more employees
    {
      id: 'EMP006',
      name: 'New Employee',
      email: 'new@selsoftinc.com',
      // ... more fields
    }
  ],
  
  // Add new data types
  departments: [
    {
      id: 'DEPT001',
      name: 'Engineering',
      headCount: 10
    }
  ]
};
```

---

## ✅ Benefits

### For UI Developers

- ✅ **No backend dependency** - Work independently
- ✅ **Realistic data** - Test with proper data structures
- ✅ **All modules covered** - Every feature has mock data
- ✅ **Automatic fallback** - Seamless switching between modes

### For Testing

- ✅ **Consistent data** - Same data every time
- ✅ **All scenarios** - Different statuses and states
- ✅ **No database** - No need to seed data
- ✅ **Fast iteration** - No API delays

---

## 🎯 Quick Reference

### All Available Endpoints

```javascript
// Employees
GET    /api/employees
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

// Projects
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

// Timesheets
GET    /api/timesheets?employeeId=EMP001&status=submitted
POST   /api/timesheets
PUT    /api/timesheets/:id
DELETE /api/timesheets/:id

// Attendance
GET    /api/attendance?employeeId=EMP001&date=2024-12-05
POST   /api/attendance

// Leaves
GET    /api/leaves?employeeId=EMP001&status=pending
POST   /api/leaves
PUT    /api/leaves/:id

// Tasks
GET    /api/tasks?projectId=PRJ001&status=in-progress
POST   /api/tasks
PUT    /api/tasks/:id

// Clients
GET    /api/clients
POST   /api/clients
PUT    /api/clients/:id

// Notifications
GET    /api/notifications

// Dashboard
GET    /api/dashboard

// Reports
GET    /api/reports/dashboard
GET    /api/reports/productivity
GET    /api/reports/projectStats

// Settings
GET    /api/settings
PUT    /api/settings
```

---

## 🎉 You're Ready!

**Login with static credentials and start developing!**

```
Email:    shunmugavel@selsoftinc.com
Password: test123#
```

All modules will have realistic, hardcoded data. No null values, no empty arrays - just working data for UI development!

---

Last Updated: December 5, 2025
