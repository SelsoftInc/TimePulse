/**
 * Static Authentication for UI Development
 * Works without backend server connection
 */

// Static admin credentials
export const STATIC_ADMIN = {
  email: 'shunmugavel@selsoftinc.com',
  password: 'test123#',
  user: {
    id: 'static-admin-001',
    email: 'shunmugavel@selsoftinc.com',
    firstName: 'Shunmugavel',
    lastName: 'Admin',
    name: 'Shunmugavel Admin',
    role: 'employee',
    tenantId: 'static-tenant-001',
    employeeId: 'EMP001'
  },
  tenant: {
    id: 'static-tenant-001',
    tenantName: 'Selsoft Inc',
    subdomain: 'selsoft',
    status: 'active',
    role: 'employee'
  },
  token: 'static-jwt-token-for-ui-development'
};

// Static mock data for UI development - Comprehensive data for all modules
export const STATIC_MOCK_DATA = {
  // Employees data
  employees: [
    {
      id: 'EMP001',
      employeeId: 'EMP001',
      name: 'Shunmugavel Admin',
      firstName: 'Shunmugavel',
      lastName: 'Admin',
      email: 'shunmugavel@selsoftinc.com',
      phone: '+1-555-0101',
      role: 'employee',
      department: 'Management',
      designation: 'CEO',
      status: 'active',
      joinDate: '2020-01-15',
      avatar: '/assets/images/avatars/admin.png',
      address: '123 Main St, San Francisco, CA',
      salary: 150000,
      reportingTo: null,
      skills: ['Leadership', 'Strategy', 'Management']
    },
    {
      id: 'EMP002',
      employeeId: 'EMP002',
      name: 'John Developer',
      firstName: 'John',
      lastName: 'Developer',
      email: 'john@selsoftinc.com',
      phone: '+1-555-0102',
      role: 'employee',
      department: 'Engineering',
      designation: 'Senior Developer',
      status: 'active',
      joinDate: '2021-03-20',
      avatar: '/assets/images/avatars/john.png',
      address: '456 Tech Ave, San Francisco, CA',
      salary: 120000,
      reportingTo: 'EMP001',
      skills: ['React', 'Node.js', 'TypeScript', 'Next.js']
    },
    {
      id: 'EMP003',
      employeeId: 'EMP003',
      name: 'Sarah Designer',
      firstName: 'Sarah',
      lastName: 'Designer',
      email: 'sarah@selsoftinc.com',
      phone: '+1-555-0103',
      role: 'employee',
      department: 'Design',
      designation: 'UI/UX Designer',
      status: 'active',
      joinDate: '2021-06-10',
      avatar: '/assets/images/avatars/sarah.png',
      address: '789 Design Blvd, San Francisco, CA',
      salary: 95000,
      reportingTo: 'EMP001',
      skills: ['Figma', 'Adobe XD', 'UI Design', 'Prototyping']
    },
    {
      id: 'EMP004',
      employeeId: 'EMP004',
      name: 'Mike Tester',
      firstName: 'Mike',
      lastName: 'Tester',
      email: 'mike@selsoftinc.com',
      phone: '+1-555-0104',
      role: 'employee',
      department: 'QA',
      designation: 'QA Engineer',
      status: 'active',
      joinDate: '2022-01-05',
      avatar: '/assets/images/avatars/mike.png',
      address: '321 Test Lane, San Francisco, CA',
      salary: 85000,
      reportingTo: 'EMP001',
      skills: ['Testing', 'Automation', 'Selenium', 'Jest']
    },
    {
      id: 'EMP005',
      employeeId: 'EMP005',
      name: 'Emily Manager',
      firstName: 'Emily',
      lastName: 'Manager',
      email: 'emily@selsoftinc.com',
      phone: '+1-555-0105',
      role: 'manager',
      department: 'Engineering',
      designation: 'Engineering Manager',
      status: 'active',
      joinDate: '2020-08-15',
      avatar: '/assets/images/avatars/emily.png',
      address: '654 Manager St, San Francisco, CA',
      salary: 130000,
      reportingTo: 'EMP001',
      skills: ['Team Management', 'Agile', 'Scrum', 'Leadership']
    }
  ],
  
  // Projects data
  projects: [
    {
      id: 'PRJ001',
      projectId: 'PRJ001',
      name: 'TimePulse Development',
      description: 'Main product development and feature enhancements',
      status: 'active',
      priority: 'high',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      budget: 500000,
      spent: 250000,
      progress: 60,
      client: 'Internal',
      projectManager: 'EMP005',
      teamMembers: ['EMP002', 'EMP003', 'EMP004'],
      tags: ['Development', 'Product', 'SaaS']
    },
    {
      id: 'PRJ002',
      projectId: 'PRJ002',
      name: 'Client Portal',
      description: 'Customer facing portal for client management',
      status: 'active',
      priority: 'medium',
      startDate: '2024-06-01',
      endDate: '2025-06-30',
      budget: 300000,
      spent: 120000,
      progress: 40,
      client: 'Acme Corp',
      projectManager: 'EMP005',
      teamMembers: ['EMP002', 'EMP003'],
      tags: ['Portal', 'Client', 'Web']
    },
    {
      id: 'PRJ003',
      projectId: 'PRJ003',
      name: 'Mobile App',
      description: 'iOS and Android mobile application',
      status: 'planning',
      priority: 'low',
      startDate: '2025-01-01',
      endDate: '2025-09-30',
      budget: 400000,
      spent: 0,
      progress: 5,
      client: 'Internal',
      projectManager: 'EMP005',
      teamMembers: ['EMP002'],
      tags: ['Mobile', 'iOS', 'Android']
    },
    {
      id: 'PRJ004',
      projectId: 'PRJ004',
      name: 'Analytics Dashboard',
      description: 'Real-time analytics and reporting dashboard',
      status: 'completed',
      priority: 'high',
      startDate: '2023-09-01',
      endDate: '2024-03-31',
      budget: 200000,
      spent: 195000,
      progress: 100,
      client: 'TechStart Inc',
      projectManager: 'EMP005',
      teamMembers: ['EMP002', 'EMP003', 'EMP004'],
      tags: ['Analytics', 'Dashboard', 'Reporting']
    }
  ],
  
  // Timesheets data
  timesheets: [
    {
      id: 'TS001',
      timesheetId: 'TS001',
      employeeId: 'EMP001',
      employeeName: 'Shunmugavel Admin',
      projectId: 'PRJ001',
      projectName: 'TimePulse Development',
      date: '2024-12-05',
      hours: 8,
      description: 'UI Development and code review',
      status: 'approved',
      taskType: 'Development',
      billable: true,
      submittedAt: '2024-12-05T18:00:00Z',
      approvedBy: 'EMP005',
      approvedAt: '2024-12-05T20:00:00Z'
    },
    {
      id: 'TS002',
      timesheetId: 'TS002',
      employeeId: 'EMP002',
      employeeName: 'John Developer',
      projectId: 'PRJ001',
      projectName: 'TimePulse Development',
      date: '2024-12-05',
      hours: 7.5,
      description: 'Backend API development',
      status: 'submitted',
      taskType: 'Development',
      billable: true,
      submittedAt: '2024-12-05T18:30:00Z',
      approvedBy: null,
      approvedAt: null
    },
    {
      id: 'TS003',
      timesheetId: 'TS003',
      employeeId: 'EMP003',
      employeeName: 'Sarah Designer',
      projectId: 'PRJ002',
      projectName: 'Client Portal',
      date: '2024-12-05',
      hours: 6,
      description: 'UI mockups and design system',
      status: 'draft',
      taskType: 'Design',
      billable: true,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null
    },
    {
      id: 'TS004',
      timesheetId: 'TS004',
      employeeId: 'EMP004',
      employeeName: 'Mike Tester',
      projectId: 'PRJ001',
      projectName: 'TimePulse Development',
      date: '2024-12-04',
      hours: 8,
      description: 'Automated testing and bug fixes',
      status: 'approved',
      taskType: 'Testing',
      billable: true,
      submittedAt: '2024-12-04T18:00:00Z',
      approvedBy: 'EMP005',
      approvedAt: '2024-12-04T19:00:00Z'
    }
  ],
  
  // Notifications data
  notifications: [
    {
      id: 'NOTIF001',
      title: 'Welcome to TimePulse',
      message: 'You are using static authentication for UI development',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
      link: null
    },
    {
      id: 'NOTIF002',
      title: 'Timesheet Approved',
      message: 'Your timesheet for Dec 5, 2024 has been approved',
      type: 'success',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      link: '/timesheets'
    },
    {
      id: 'NOTIF003',
      title: 'New Project Assigned',
      message: 'You have been assigned to Analytics Dashboard project',
      type: 'info',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      link: '/projects/PRJ004'
    },
    {
      id: 'NOTIF004',
      title: 'Meeting Reminder',
      message: 'Team standup meeting in 30 minutes',
      type: 'warning',
      read: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      link: '/calendar'
    }
  ],
  
  // Attendance data
  attendance: [
    {
      id: 'ATT001',
      employeeId: 'EMP001',
      employeeName: 'Shunmugavel Admin',
      date: '2024-12-05',
      checkIn: '09:00:00',
      checkOut: '18:00:00',
      status: 'present',
      workHours: 8,
      overtime: 0,
      location: 'Office'
    },
    {
      id: 'ATT002',
      employeeId: 'EMP002',
      employeeName: 'John Developer',
      date: '2024-12-05',
      checkIn: '09:15:00',
      checkOut: '18:30:00',
      status: 'present',
      workHours: 8.25,
      overtime: 0.25,
      location: 'Remote'
    },
    {
      id: 'ATT003',
      employeeId: 'EMP003',
      employeeName: 'Sarah Designer',
      date: '2024-12-05',
      checkIn: '10:00:00',
      checkOut: '17:00:00',
      status: 'present',
      workHours: 6,
      overtime: 0,
      location: 'Office'
    },
    {
      id: 'ATT004',
      employeeId: 'EMP004',
      employeeName: 'Mike Tester',
      date: '2024-12-05',
      checkIn: null,
      checkOut: null,
      status: 'leave',
      workHours: 0,
      overtime: 0,
      location: null
    }
  ],
  
  // Leave requests data
  leaves: [
    {
      id: 'LEAVE001',
      employeeId: 'EMP004',
      employeeName: 'Mike Tester',
      leaveType: 'Sick Leave',
      startDate: '2024-12-05',
      endDate: '2024-12-05',
      days: 1,
      reason: 'Medical appointment',
      status: 'approved',
      appliedAt: '2024-12-04T10:00:00Z',
      approvedBy: 'EMP005',
      approvedAt: '2024-12-04T14:00:00Z'
    },
    {
      id: 'LEAVE002',
      employeeId: 'EMP002',
      employeeName: 'John Developer',
      leaveType: 'Vacation',
      startDate: '2024-12-20',
      endDate: '2024-12-27',
      days: 6,
      reason: 'Year-end vacation',
      status: 'pending',
      appliedAt: '2024-12-03T09:00:00Z',
      approvedBy: null,
      approvedAt: null
    },
    {
      id: 'LEAVE003',
      employeeId: 'EMP003',
      employeeName: 'Sarah Designer',
      leaveType: 'Personal',
      startDate: '2024-12-10',
      endDate: '2024-12-10',
      days: 1,
      reason: 'Personal work',
      status: 'rejected',
      appliedAt: '2024-12-02T11:00:00Z',
      approvedBy: 'EMP005',
      approvedAt: '2024-12-02T15:00:00Z',
      rejectionReason: 'Critical project deadline'
    }
  ],
  
  // Tasks data
  tasks: [
    {
      id: 'TASK001',
      title: 'Implement OAuth Integration',
      description: 'Add Google OAuth authentication to login page',
      projectId: 'PRJ001',
      projectName: 'TimePulse Development',
      assignedTo: 'EMP002',
      assignedToName: 'John Developer',
      status: 'completed',
      priority: 'high',
      dueDate: '2024-12-05',
      completedAt: '2024-12-05T16:00:00Z',
      estimatedHours: 8,
      actualHours: 7.5,
      tags: ['Authentication', 'OAuth']
    },
    {
      id: 'TASK002',
      title: 'Design Dashboard UI',
      description: 'Create mockups for admin dashboard',
      projectId: 'PRJ001',
      projectName: 'TimePulse Development',
      assignedTo: 'EMP003',
      assignedToName: 'Sarah Designer',
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2024-12-10',
      completedAt: null,
      estimatedHours: 16,
      actualHours: 6,
      tags: ['Design', 'UI']
    },
    {
      id: 'TASK003',
      title: 'Write Unit Tests',
      description: 'Add test coverage for authentication module',
      projectId: 'PRJ001',
      projectName: 'TimePulse Development',
      assignedTo: 'EMP004',
      assignedToName: 'Mike Tester',
      status: 'todo',
      priority: 'low',
      dueDate: '2024-12-15',
      completedAt: null,
      estimatedHours: 12,
      actualHours: 0,
      tags: ['Testing', 'QA']
    }
  ],
  
  // Clients data
  clients: [
    {
      id: 'CLI001',
      name: 'Acme Corp',
      email: 'contact@acmecorp.com',
      phone: '+1-555-1001',
      address: '100 Business Park, New York, NY',
      status: 'active',
      projects: ['PRJ002'],
      contactPerson: 'Robert Johnson',
      industry: 'Technology',
      since: '2023-06-15'
    },
    {
      id: 'CLI002',
      name: 'TechStart Inc',
      email: 'hello@techstart.io',
      phone: '+1-555-1002',
      address: '200 Startup Ave, Austin, TX',
      status: 'active',
      projects: ['PRJ004'],
      contactPerson: 'Lisa Chen',
      industry: 'Startups',
      since: '2023-09-01'
    },
    {
      id: 'CLI003',
      name: 'Global Solutions',
      email: 'info@globalsolutions.com',
      phone: '+1-555-1003',
      address: '300 Enterprise Blvd, Chicago, IL',
      status: 'inactive',
      projects: [],
      contactPerson: 'Michael Brown',
      industry: 'Consulting',
      since: '2022-03-20'
    }
  ],
  
  // Reports/Analytics data
  reports: {
    dashboard: {
      totalEmployees: 5,
      activeProjects: 2,
      pendingTimesheets: 1,
      totalHours: 29.5,
      pendingLeaves: 1,
      todayAttendance: 4,
      monthlyRevenue: 125000,
      projectCompletion: 60
    },
    productivity: [
      { month: 'Jul', hours: 160, efficiency: 85 },
      { month: 'Aug', hours: 168, efficiency: 88 },
      { month: 'Sep', hours: 172, efficiency: 90 },
      { month: 'Oct', hours: 165, efficiency: 87 },
      { month: 'Nov', hours: 170, efficiency: 89 },
      { month: 'Dec', hours: 145, efficiency: 91 }
    ],
    projectStats: [
      { name: 'TimePulse', progress: 60, budget: 500000, spent: 250000 },
      { name: 'Client Portal', progress: 40, budget: 300000, spent: 120000 },
      { name: 'Mobile App', progress: 5, budget: 400000, spent: 0 },
      { name: 'Analytics', progress: 100, budget: 200000, spent: 195000 }
    ]
  },
  
  // Settings data
  settings: {
    company: {
      name: 'Selsoft Inc',
      email: 'info@selsoftinc.com',
      phone: '+1-555-0100',
      address: '123 Main St, San Francisco, CA 94102',
      website: 'https://selsoftinc.com',
      logo: '/assets/images/jsTree/TimePulseLogoAuth.png',
      timezone: 'America/Los_Angeles',
      currency: 'USD'
    },
    workHours: {
      startTime: '09:00',
      endTime: '18:00',
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursPerDay: 8
    },
    leave: {
      annualLeave: 20,
      sickLeave: 10,
      personalLeave: 5,
      carryForward: true,
      maxCarryForward: 5
    }
  }
};

/**
 * Validate static credentials
 */
export function validateStaticCredentials(email, password) {
  return email === STATIC_ADMIN.email && password === STATIC_ADMIN.password;
}

/**
 * Get static user session
 */
export function getStaticSession() {
  return {
    user: STATIC_ADMIN.user,
    tenant: STATIC_ADMIN.tenant,
    token: STATIC_ADMIN.token,
    isStatic: true
  };
}

/**
 * Check if running in static mode (no backend connection)
 */
export function isStaticMode() {
  // Check if API_BASE is unreachable or if we're in static mode
  return process.env.NEXT_PUBLIC_STATIC_MODE === 'true' || 
         typeof window !== 'undefined' && localStorage.getItem('staticMode') === 'true';
}

/**
 * Enable static mode
 */
export function enableStaticMode() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('staticMode', 'true');
  }
}

/**
 * Disable static mode
 */
export function disableStaticMode() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('staticMode');
  }
}
