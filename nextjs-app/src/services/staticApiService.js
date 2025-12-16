/**
 * Static API Service for UI Development
 * Provides mock data when backend server is not connected
 */

import { STATIC_MOCK_DATA } from '@/utils/staticAuth';

/**
 * Check if we're in static mode
 */
export function isStaticMode() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('staticMode') === 'true';
}

/**
 * Static API responses with realistic delays
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const staticApiService = {
  /**
   * Get employees list
   */
  async getEmployees() {
    await delay(300); // Simulate network delay
    return {
      success: true,
      data: STATIC_MOCK_DATA.employees
    };
  },

  /**
   * Get projects list
   */
  async getProjects() {
    await delay(300);
    return {
      success: true,
      data: STATIC_MOCK_DATA.projects
    };
  },

  /**
   * Get timesheets
   */
  async getTimesheets(params = {}) {
    await delay(300);
    let data = [...STATIC_MOCK_DATA.timesheets];
    
    // Filter by employee
    if (params.employeeId) {
      data = data.filter(t => t.employeeId === params.employeeId);
    }
    
    // Filter by status
    if (params.status) {
      data = data.filter(t => t.status === params.status);
    }
    
    return {
      success: true,
      data: data,
      total: data.length
    };
  },

  /**
   * Get notifications
   */
  async getNotifications() {
    await delay(200);
    return {
      success: true,
      data: STATIC_MOCK_DATA.notifications,
      unreadCount: STATIC_MOCK_DATA.notifications.filter(n => !n.read).length
    };
  },

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    await delay(400);
    return {
      success: true,
      data: STATIC_MOCK_DATA.reports.dashboard
    };
  },

  /**
   * Get attendance records
   */
  async getAttendance(params = {}) {
    await delay(300);
    let data = [...STATIC_MOCK_DATA.attendance];
    
    if (params.employeeId) {
      data = data.filter(a => a.employeeId === params.employeeId);
    }
    
    if (params.date) {
      data = data.filter(a => a.date === params.date);
    }
    
    return {
      success: true,
      data: data,
      total: data.length
    };
  },

  /**
   * Get leave requests
   */
  async getLeaves(params = {}) {
    await delay(300);
    let data = [...STATIC_MOCK_DATA.leaves];
    
    if (params.employeeId) {
      data = data.filter(l => l.employeeId === params.employeeId);
    }
    
    if (params.status) {
      data = data.filter(l => l.status === params.status);
    }
    
    return {
      success: true,
      data: data,
      total: data.length
    };
  },

  /**
   * Get tasks
   */
  async getTasks(params = {}) {
    await delay(300);
    let data = [...STATIC_MOCK_DATA.tasks];
    
    if (params.assignedTo) {
      data = data.filter(t => t.assignedTo === params.assignedTo);
    }
    
    if (params.projectId) {
      data = data.filter(t => t.projectId === params.projectId);
    }
    
    if (params.status) {
      data = data.filter(t => t.status === params.status);
    }
    
    return {
      success: true,
      data: data,
      total: data.length
    };
  },

  /**
   * Get clients
   */
  async getClients() {
    await delay(300);
    return {
      success: true,
      data: STATIC_MOCK_DATA.clients,
      total: STATIC_MOCK_DATA.clients.length
    };
  },

  /**
   * Get reports
   */
  async getReports(type = 'dashboard') {
    await delay(400);
    return {
      success: true,
      data: STATIC_MOCK_DATA.reports[type] || STATIC_MOCK_DATA.reports.dashboard
    };
  },

  /**
   * Get settings
   */
  async getSettings() {
    await delay(200);
    return {
      success: true,
      data: STATIC_MOCK_DATA.settings
    };
  },

  /**
   * Submit timesheet (mock)
   */
  async submitTimesheet(data) {
    await delay(500);
    const newTimesheet = {
      id: `TS${Date.now()}`,
      ...data,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    STATIC_MOCK_DATA.timesheets.push(newTimesheet);
    return {
      success: true,
      data: newTimesheet,
      message: 'Timesheet submitted successfully (static mode)'
    };
  },

  /**
   * Update employee (mock)
   */
  async updateEmployee(id, data) {
    await delay(400);
    const index = STATIC_MOCK_DATA.employees.findIndex(e => e.id === id);
    if (index !== -1) {
      STATIC_MOCK_DATA.employees[index] = { ...STATIC_MOCK_DATA.employees[index], ...data };
      return {
        success: true,
        data: STATIC_MOCK_DATA.employees[index],
        message: 'Employee updated successfully (static mode)'
      };
    }
    return {
      success: false,
      message: 'Employee not found'
    };
  },

  /**
   * Create project (mock)
   */
  async createProject(data) {
    await delay(500);
    const newProject = {
      id: `PRJ${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    STATIC_MOCK_DATA.projects.push(newProject);
    return {
      success: true,
      data: newProject,
      message: 'Project created successfully (static mode)'
    };
  },

  /**
   * Generic GET request handler
   */
  async get(endpoint, params = {}) {
    await delay(300);
    
    // Route to appropriate handler based on endpoint
    if (endpoint.includes('/employees')) return this.getEmployees();
    if (endpoint.includes('/projects')) return this.getProjects();
    if (endpoint.includes('/timesheets')) return this.getTimesheets(params);
    if (endpoint.includes('/notifications')) return this.getNotifications();
    if (endpoint.includes('/dashboard')) return this.getDashboardStats();
    if (endpoint.includes('/attendance')) return this.getAttendance(params);
    if (endpoint.includes('/leaves') || endpoint.includes('/leave')) return this.getLeaves(params);
    if (endpoint.includes('/tasks')) return this.getTasks(params);
    if (endpoint.includes('/clients')) return this.getClients();
    if (endpoint.includes('/reports')) {
      const type = endpoint.split('/').pop();
      return this.getReports(type);
    }
    if (endpoint.includes('/settings')) return this.getSettings();
    
    // Default response
    return {
      success: true,
      data: [],
      message: 'Static mode - no data available for this endpoint'
    };
  },

  /**
   * Generic POST request handler
   */
  async post(endpoint, data) {
    await delay(400);
    
    if (endpoint.includes('/timesheets')) return this.submitTimesheet(data);
    if (endpoint.includes('/projects')) return this.createProject(data);
    
    return {
      success: true,
      data: data,
      message: 'Operation completed (static mode)'
    };
  },

  /**
   * Generic PUT request handler
   */
  async put(endpoint, data) {
    await delay(400);
    
    if (endpoint.includes('/employees/')) {
      const id = endpoint.split('/').pop();
      return this.updateEmployee(id, data);
    }
    
    return {
      success: true,
      data: data,
      message: 'Update completed (static mode)'
    };
  },

  /**
   * Generic DELETE request handler
   */
  async delete(endpoint) {
    await delay(300);
    return {
      success: true,
      message: 'Delete completed (static mode)'
    };
  }
};

/**
 * Wrapper function to use static API or real API based on mode
 */
export async function apiRequest(method, endpoint, data = null) {
  if (isStaticMode()) {
    console.log(`📦 Static API: ${method} ${endpoint}`);
    
    switch (method.toUpperCase()) {
      case 'GET':
        return staticApiService.get(endpoint);
      case 'POST':
        return staticApiService.post(endpoint, data);
      case 'PUT':
        return staticApiService.put(endpoint, data);
      case 'DELETE':
        return staticApiService.delete(endpoint);
      default:
        return { success: false, message: 'Invalid method' };
    }
  }
  
  // If not in static mode, make real API call
  // This would be your existing API call logic
  console.log(`🌐 Real API: ${method} ${endpoint}`);
  throw new Error('Real API not implemented - use static mode for UI development');
}
