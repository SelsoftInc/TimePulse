// src/components/reports/ReportsDashboard.jsx
import React, { useState } from 'react';
import './ReportsDashboard.css';

const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState('client');
  const [selectedMonth, setSelectedMonth] = useState('July');
  const [selectedYear, setSelectedYear] = useState('2023');
  
  // Sample client report data - in a real app, this would come from an API
  const clientReportData = [
    { 
      id: 1, 
      name: "JPMC", 
      totalHours: 800, 
      totalEmployees: 7, 
      totalBilled: 80000,
      projects: [
        { name: "TimePulse Development", hours: 400, employees: 3 },
        { name: "API Integration", hours: 250, employees: 2 },
        { name: "Client Portal Redesign", hours: 150, employees: 2 }
      ]
    },
    { 
      id: 2, 
      name: "Accenture", 
      totalHours: 500, 
      totalEmployees: 5, 
      totalBilled: 50000,
      projects: [
        { name: "Data Migration", hours: 300, employees: 3 },
        { name: "Cloud Infrastructure", hours: 200, employees: 2 }
      ]
    },
    { 
      id: 3, 
      name: "Virtusa", 
      totalHours: 300, 
      totalEmployees: 3, 
      totalBilled: 30000,
      projects: [
        { name: "Mobile App Development", hours: 300, employees: 3 }
      ]
    },
    { 
      id: 4, 
      name: "Cognizant", 
      totalHours: 450, 
      totalEmployees: 5, 
      totalBilled: 45000,
      projects: [
        { name: "UI/UX Redesign", hours: 250, employees: 3 },
        { name: "Testing Automation", hours: 200, employees: 2 }
      ]
    },
    { 
      id: 5, 
      name: "IBM", 
      totalHours: 900, 
      totalEmployees: 10, 
      totalBilled: 90000,
      projects: [
        { name: "AI Integration", hours: 400, employees: 4 },
        { name: "Data Analytics", hours: 300, employees: 3 },
        { name: "Security Implementation", hours: 200, employees: 3 }
      ]
    }
  ];
  
  // Sample employee report data - in a real app, this would come from an API
  const employeeReportData = [
    { 
      id: 1, 
      name: "John Doe", 
      totalHours: 160, 
      utilization: 100, 
      clientName: "JPMC",
      projectName: "TimePulse Development",
      weeklyBreakdown: [40, 40, 40, 40]
    },
    { 
      id: 2, 
      name: "Jane Smith", 
      totalHours: 152, 
      utilization: 95, 
      clientName: "JPMC",
      projectName: "API Integration",
      weeklyBreakdown: [40, 40, 36, 36]
    },
    { 
      id: 3, 
      name: "Robert Johnson", 
      totalHours: 168, 
      utilization: 105, 
      clientName: "Accenture",
      projectName: "Data Migration",
      weeklyBreakdown: [42, 42, 42, 42]
    },
    { 
      id: 4, 
      name: "Emily Davis", 
      totalHours: 144, 
      utilization: 90, 
      clientName: "IBM",
      projectName: "AI Integration",
      weeklyBreakdown: [36, 36, 36, 36]
    },
    { 
      id: 5, 
      name: "Michael Brown", 
      totalHours: 160, 
      utilization: 100, 
      clientName: "Cognizant",
      projectName: "UI/UX Redesign",
      weeklyBreakdown: [40, 40, 40, 40]
    }
  ];
  
  // Calculate total hours and amount for all clients
  const totalHours = clientReportData.reduce((sum, client) => sum + client.totalHours, 0);
  const totalAmount = clientReportData.reduce((sum, client) => sum + client.totalBilled, 0);
  
  // Function to render client-wise report
  const renderClientReport = () => {
    return (
      <>
        <div className="nk-block">
          <div className="row g-gs">
            <div className="col-md-6 col-lg-4">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Hours</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{totalHours}</span>
                      <span className="sub-title">{selectedMonth} {selectedYear}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-4">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Billed Amount</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">${totalAmount.toLocaleString()}</span>
                      <span className="sub-title">{selectedMonth} {selectedYear}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-12 col-lg-4">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Clients</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{clientReportData.length}</span>
                      <span className="sub-title">Active Clients</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="nk-block mt-4">
          <div className="card card-bordered card-stretch">
            <div className="card-inner-group">
              <div className="card-inner position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Client-wise Monthly Report</h5>
                  </div>
                </div>
              </div>
              
              <div className="card-inner p-0">
                <div className="nk-tb-list nk-tb-ulist">
                  <div className="nk-tb-item nk-tb-head">
                    <div className="nk-tb-col"><span className="sub-text">Client Name</span></div>
                    <div className="nk-tb-col tb-col-md"><span className="sub-text">Total Hours</span></div>
                    <div className="nk-tb-col tb-col-md"><span className="sub-text">Total Employees</span></div>
                    <div className="nk-tb-col"><span className="sub-text">Total Billed ($)</span></div>
                    <div className="nk-tb-col nk-tb-col-tools text-end">Actions</div>
                  </div>
                  
                  {clientReportData.map(client => (
                    <div key={client.id} className="nk-tb-item">
                      <div className="nk-tb-col">
                        <span className="tb-lead">{client.name}</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span>{client.totalHours}</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span>{client.totalEmployees}</span>
                      </div>
                      <div className="nk-tb-col">
                        <span className="tb-amount">${client.totalBilled.toLocaleString()}</span>
                      </div>
                      <div className="nk-tb-col nk-tb-col-tools">
                        <ul className="nk-tb-actions gx-1">
                          <li>
                            <button 
                              className="btn btn-trigger btn-icon" 
                              title="View Details"
                              onClick={() => alert(`Viewing details for ${client.name}`)}
                            >
                              <em className="icon ni ni-eye"></em>
                            </button>
                          </li>
                          <li>
                            <button 
                              className="btn btn-trigger btn-icon" 
                              title="Download Report"
                              onClick={() => alert(`Downloading report for ${client.name}`)}
                            >
                              <em className="icon ni ni-download"></em>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="nk-block mt-4">
          <div className="card card-bordered card-stretch">
            <div className="card-inner-group">
              <div className="card-inner position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Project Distribution</h5>
                  </div>
                </div>
              </div>
              
              <div className="card-inner">
                <div className="row g-gs">
                  {clientReportData.map(client => (
                    <div key={client.id} className="col-md-6 col-lg-4">
                      <div className="client-project-card">
                        <h6 className="client-name">{client.name}</h6>
                        <div className="project-list">
                          {client.projects.map((project, index) => (
                            <div key={index} className="project-item">
                              <div className="project-info">
                                <span className="project-name">{project.name}</span>
                                <div className="project-details">
                                  <span>{project.hours} hrs</span>
                                  <span>{project.employees} employees</span>
                                </div>
                              </div>
                              <div className="project-progress">
                                <div className="progress">
                                  <div 
                                    className="progress-bar" 
                                    style={{ width: `${(project.hours / client.totalHours) * 100}%` }}
                                  ></div>
                                </div>
                                <div className="progress-percent">
                                  {Math.round((project.hours / client.totalHours) * 100)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  // Function to render employee-wise report
  const renderEmployeeReport = () => {
    return (
      <>
        <div className="nk-block">
          <div className="card card-bordered card-stretch">
            <div className="card-inner-group">
              <div className="card-inner position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Employee-wise Timesheet Report</h5>
                  </div>
                </div>
              </div>
              
              <div className="card-inner p-0">
                <div className="nk-tb-list nk-tb-ulist">
                  <div className="nk-tb-item nk-tb-head">
                    <div className="nk-tb-col"><span className="sub-text">Employee Name</span></div>
                    <div className="nk-tb-col tb-col-md"><span className="sub-text">Client</span></div>
                    <div className="nk-tb-col tb-col-md"><span className="sub-text">Project</span></div>
                    <div className="nk-tb-col"><span className="sub-text">Total Hours</span></div>
                    <div className="nk-tb-col tb-col-md"><span className="sub-text">Utilization %</span></div>
                    <div className="nk-tb-col nk-tb-col-tools text-end">Actions</div>
                  </div>
                  
                  {employeeReportData.map(employee => (
                    <div key={employee.id} className="nk-tb-item">
                      <div className="nk-tb-col">
                        <div className="user-card">
                          <div className="user-avatar bg-primary">
                            <span>{employee.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <div className="user-info">
                            <span className="tb-lead">{employee.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span>{employee.clientName}</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span>{employee.projectName}</span>
                      </div>
                      <div className="nk-tb-col">
                        <span>{employee.totalHours} hrs</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <div className="d-flex align-items-center">
                          <div className="progress-status">
                            {employee.utilization}%
                          </div>
                          <div className="progress" style={{ width: '100px' }}>
                            <div 
                              className={`progress-bar ${
                                employee.utilization >= 100 ? 'bg-success' : 
                                employee.utilization >= 90 ? 'bg-info' : 'bg-warning'
                              }`} 
                              style={{ width: `${Math.min(employee.utilization, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="nk-tb-col nk-tb-col-tools">
                        <ul className="nk-tb-actions gx-1">
                          <li>
                            <button 
                              className="btn btn-trigger btn-icon" 
                              title="View Details"
                              onClick={() => alert(`Viewing details for ${employee.name}`)}
                            >
                              <em className="icon ni ni-eye"></em>
                            </button>
                          </li>
                          <li>
                            <button 
                              className="btn btn-trigger btn-icon" 
                              title="Download Report"
                              onClick={() => alert(`Downloading report for ${employee.name}`)}
                            >
                              <em className="icon ni ni-download"></em>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="nk-block mt-4">
          <div className="card card-bordered card-stretch">
            <div className="card-inner-group">
              <div className="card-inner position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Weekly Breakdown</h5>
                  </div>
                </div>
              </div>
              
              <div className="card-inner">
                <div className="row g-gs">
                  {employeeReportData.map(employee => (
                    <div key={employee.id} className="col-md-6 col-lg-4">
                      <div className="weekly-breakdown-card">
                        <h6 className="employee-name">{employee.name}</h6>
                        <div className="weekly-hours">
                          <div className="week-labels">
                            <span>Week 1</span>
                            <span>Week 2</span>
                            <span>Week 3</span>
                            <span>Week 4</span>
                          </div>
                          <div className="hour-bars">
                            {employee.weeklyBreakdown.map((hours, index) => (
                              <div key={index} className="hour-bar-container">
                                <div 
                                  className={`hour-bar ${hours >= 40 ? 'full' : 'partial'}`}
                                  style={{ height: `${(hours / 50) * 100}%` }}
                                >
                                  <span className="hour-value">{hours}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="total-summary">
                          <div className="summary-item">
                            <span className="label">Total Hours:</span>
                            <span className="value">{employee.totalHours}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">Utilization:</span>
                            <span className={`value ${
                              employee.utilization >= 100 ? 'text-success' : 
                              employee.utilization >= 90 ? 'text-info' : 'text-warning'
                            }`}>
                              {employee.utilization}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Reports & Analytics</h3>
                  <div className="nk-block-des text-soft">
                    <p>View detailed reports and analytics for clients and employees.</p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <div className="form-inline flex-nowrap gx-3">
                      <div className="form-wrap w-150px">
                        <select 
                          className="form-select form-select-sm" 
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          <option value="July">July</option>
                          <option value="June">June</option>
                          <option value="May">May</option>
                        </select>
                      </div>
                      <div className="form-wrap w-100px">
                        <select 
                          className="form-select form-select-sm" 
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                        >
                          <option value="2023">2023</option>
                          <option value="2022">2022</option>
                        </select>
                      </div>
                      <div className="btn-wrap">
                        <button className="btn btn-dim btn-outline-light">
                          <em className="icon ni ni-download-cloud"></em>
                          <span>Export</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nk-block">
              <div className="card card-bordered">
                <div className="card-inner">
                  <ul className="nav nav-tabs">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'client' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('client')}
                      >
                        Client-wise Report
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'employee' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('employee')}
                      >
                        Employee-wise Report
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {activeTab === 'client' ? renderClientReport() : renderEmployeeReport()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
