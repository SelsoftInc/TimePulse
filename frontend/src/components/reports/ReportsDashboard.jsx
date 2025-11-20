// src/components/reports/ReportsDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../../config/api";
import "./ReportsDashboard.css";
import '../common/ActionsDropdown.css';
import InvoicePDFPreviewModal from '../common/InvoicePDFPreviewModal';

// Helper functions outside component to avoid dependency issues
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getSunday = (date) => {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleDateString('en-US', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Week range state
  const [weekStart, setWeekStart] = useState(null);
  const [weekEnd, setWeekEnd] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  
  // Calendar picker state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Real data from API
  const [clientReportData, setClientReportData] = useState([]);
  const [employeeReportData, setEmployeeReportData] = useState([]);
  const [invoiceReportData, setInvoiceReportData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Dropdown state for Actions
  const [openActionsId, setOpenActionsId] = useState(null);
  const [actionsType, setActionsType] = useState(null); // 'client', 'employee', 'invoice'
  
  // Initialize week range on component mount
  useEffect(() => {
    const today = new Date();
    const monday = getMonday(today);
    const sunday = getSunday(today);
    setWeekStart(monday);
    setWeekEnd(sunday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() - 7);
    const newEnd = new Date(weekEnd);
    newEnd.setDate(weekEnd.getDate() - 7);
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + 7);
    const newEnd = new Date(weekEnd);
    newEnd.setDate(weekEnd.getDate() + 7);
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  };
  
  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    const monday = getMonday(today);
    const sunday = getSunday(today);
    setWeekStart(monday);
    setWeekEnd(sunday);
  };
  
  // Check if current week is selected
  const isCurrentWeek = () => {
    if (!weekStart || !weekEnd) return false;
    const today = new Date();
    const currentMonday = getMonday(today);
    const currentSunday = getSunday(today);
    return weekStart.toDateString() === currentMonday.toDateString() && 
           weekEnd.toDateString() === currentSunday.toDateString();
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const currentDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
    currentDate.setMonth(currentDate.getMonth() - 1);
    setSelectedMonth(currentDate.toLocaleDateString('en-US', { month: 'long' }));
    setSelectedYear(currentDate.getFullYear().toString());
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const currentDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
    currentDate.setMonth(currentDate.getMonth() + 1);
    setSelectedMonth(currentDate.toLocaleDateString('en-US', { month: 'long' }));
    setSelectedYear(currentDate.getFullYear().toString());
  };
  
  // Go to current month
  const goToCurrentMonth = () => {
    const today = new Date();
    setSelectedMonth(today.toLocaleDateString('en-US', { month: 'long' }));
    setSelectedYear(today.getFullYear().toString());
  };
  
  // Check if current month is selected
  const isCurrentMonth = () => {
    const today = new Date();
    const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
    const currentYear = today.getFullYear().toString();
    return selectedMonth === currentMonth && selectedYear === currentYear;
  };
  
  // Calendar functions
  const handleDateDisplayClick = () => {
    setShowCalendar(!showCalendar);
  };
  
  const handleCalendarMonthChange = (direction) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(calendarDate.getMonth() + direction);
    setCalendarDate(newDate);
  };
  
  const handleWeekSelect = (weekStartDate) => {
    const weekEndDate = getSunday(weekStartDate);
    setWeekStart(weekStartDate);
    setWeekEnd(weekEndDate);
    setShowCalendar(false);
  };
  
  const handleMonthSelect = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year.toString());
    setShowCalendar(false);
  };
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };
  
  const isDateInSelectedWeek = (date) => {
    if (!weekStart || !weekEnd) return false;
    return date >= weekStart && date <= weekEnd;
  };
  
  const isDateInSelectedMonth = (date) => {
    const dateMonth = date.toLocaleDateString('en-US', { month: 'long' });
    const dateYear = date.getFullYear().toString();
    return dateMonth === selectedMonth && dateYear === selectedYear;
  };
  
  // PDF Modal state
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState(null);
  
  // Invoice Details Modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState(null);

  // Fetch data from API - wrapped in useCallback to prevent infinite loops
  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      if (!userInfo.tenantId) {
        throw new Error("No tenant information available");
      }

      // Calculate date range based on view mode
      let startDate, endDate;
      
      if (viewMode === 'week' && weekStart && weekEnd) {
        startDate = new Date(weekStart);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(weekEnd);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Month view
        const year = parseInt(selectedYear);
        const monthIndex = new Date(`${selectedMonth} 1, ${year}`).getMonth();
        startDate = new Date(year, monthIndex, 1);
        endDate = new Date(year, monthIndex + 1, 0);
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };

      // Fetch all report data in parallel
      console.log('🔍 Fetching reports with:', {
        tenantId: userInfo.tenantId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const [clientsRes, employeesRes, invoicesRes, analyticsRes] =
        await Promise.all([
           fetch(
            `${API_BASE}/api/reports/clients?tenantId=${
              userInfo.tenantId
            }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            { headers }
          ).catch(err => {
             console.error('❌ Client reports fetch failed:', err);
             throw err;
           }),
           fetch(
            `${API_BASE}/api/reports/employees?tenantId=${
              userInfo.tenantId
            }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            { headers }
          ).catch(err => {
             console.error('❌ Employee reports fetch failed:', err);
             throw err;
           }),
           fetch(
            `${API_BASE}/api/reports/invoices?tenantId=${
              userInfo.tenantId
            }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            { headers }
          ).catch(err => {
             console.error('❌ Invoice reports fetch failed:', err);
             throw err;
           }),
           fetch(
            `${API_BASE}/api/reports/analytics?tenantId=${userInfo.tenantId}&period=month`,
            { headers }
          ).catch(err => {
             console.error('❌ Analytics fetch failed:', err);
             throw err;
           }),
        ]);

      // Process responses
      const [clientsData, employeesData, invoicesData, analyticsData] =
        await Promise.all([
          clientsRes.json(),
          employeesRes.json(),
          invoicesRes.json(),
          analyticsRes.json(),
        ]);

      if (clientsData.success) {
        setClientReportData(clientsData.data || []);
      } else {
        console.error("Failed to fetch client reports:", clientsData.error);
      }

      if (employeesData.success) {
        setEmployeeReportData(employeesData.data || []);
      } else {
        console.error("Failed to fetch employee reports:", employeesData.error);
      }

      if (invoicesData.success) {
        setInvoiceReportData(invoicesData.data || []);
      } else {
        console.error("Failed to fetch invoice reports:", invoicesData.error);
      }

      if (analyticsData.success) {
        setAnalyticsData(analyticsData.data || null);
      } else {
        console.error("Failed to fetch analytics:", analyticsData.error);
      }
    } catch (error) {
      console.error("Error fetching reports data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [viewMode, weekStart, weekEnd, selectedMonth, selectedYear]);

  useEffect(() => {
    if (viewMode === 'week' && weekStart && weekEnd) {
      fetchReportsData();
    } else if (viewMode === 'month') {
      fetchReportsData();
    }
  }, [viewMode, weekStart, weekEnd, selectedMonth, selectedYear, fetchReportsData]);

  // Close dropdown and calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-dropdown')) {
        setOpenActionsId(null);
        setActionsType(null);
      }
      if (!event.target.closest('.date-range-navigator') && !event.target.closest('.calendar-picker')) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Toggle Actions dropdown
  const toggleActions = (id, type) => {
    if (openActionsId === id && actionsType === type) {
      setOpenActionsId(null);
      setActionsType(null);
    } else {
      setOpenActionsId(id);
      setActionsType(type);
    }
  };

  // fetchReportsData moved above as useCallback

  // Calculate total hours and amount for all clients
  const totalHours = clientReportData.reduce(
    (sum, client) => sum + client.totalHours,
    0
  );
  const totalAmount = clientReportData.reduce(
    (sum, client) => sum + client.totalBilled,
    0
  );

  // Function to render client-wise report
  const renderClientReport = () => {
    return (
      <>
        <div className="nk-bloc">
          <div className="row g-g">
            <div className="col-md-6 col-lg-4">
              <div className="card card-bordered">
                <div className="card-inne">
                  <div className="card-title-group align-start mb-">
                    <div className="card-title">
                      <h6 className="title">Total Hours</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{totalHours}</span>
                      <span className="sub-title">
                        {selectedMonth} {selectedYear}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card card-bordered">
                <div className="card-inne">
                  <div className="card-title-group align-start mb-">
                    <div className="card-title">
                      <h6 className="title">Total Billed Amount</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">
                        ${totalAmount.toLocaleString()}
                      </span>
                      <span className="sub-title">
                        {selectedMonth} {selectedYear}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-12 col-lg-4">
              <div className="card card-bordered">
                <div className="card-inne">
                  <div className="card-title-group align-start mb-">
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
              <div className="card-inne position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Client-wise Monthly Report</h5>
                  </div>
                </div>
              </div>

              <div className="card-inner p-0">
                <div className="nk-tb-list nk-tb-ulis">
                  <div className="nk-tb-item nk-tb-head">
                    <div className="nk-tb-col">
                      <span className="sub-text">Client Name</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Total Hours</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Total Employees</span>
                    </div>
                    <div className="nk-tb-col">
                      <span className="sub-text">Total Billed ($)</span>
                    </div>
                    <div className="nk-tb-col nk-tb-col-tools text-end">
                      Actions
                    </div>
                  </div>

                  {clientReportData.map((client) => (
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
                        <span className="tb-amount">
                          ${client.totalBilled.toLocaleString()}
                        </span>
                      </div>
                      <div className="nk-tb-col nk-tb-col-tools">
                        <div className="dropdown" style={{ position: 'relative' }}>
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActions(client.id, 'client');
                            }}
                            type="button"
                          >
                            Actions
                          </button>
                          {openActionsId === client.id && actionsType === 'client' && (
                            <div className="dropdown-menu dropdown-menu-right show">
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  alert(`Viewing details for ${client.name}`);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <i className="fas fa-eye mr-1"></i> View Details
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  alert(`Downloading report for ${client.name}`);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <i className="fas fa-download mr-1"></i> Download Report
                              </button>
                            </div>
                          )}
                        </div>
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
              <div className="card-inne position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Project Distribution</h5>
                  </div>
                </div>
              </div>

              <div className="card-inne">
                <div className="card-grid">
                  {clientReportData.map((client) => (
                    <div key={client.id} className="client-project-card">
                      <h6 className="client-name">{client.name}</h6>
                      <div className="project-list">
                        {client.projects.map((project, index) => {
                          const percentage =
                            client.totalHours > 0
                              ? (project.hours / client.totalHours) * 100
                              : 0;

                          let progressColorClass = "";
                          if (percentage > 75) {
                            progressColorClass = "progress-green";
                          } else if (percentage >= 40) {
                            progressColorClass = "progress-orange";
                          } else {
                            progressColorClass = "progress-red";
                          }

                          return (
                            <div key={index} className="project-item">
                              <div className="project-info">
                                <span className="project-name">
                                  {project.name}
                                </span>
                                <div className="project-details">
                                  <span>{project.hours} hrs</span>
                                  <span>{project.employees} employees</span>
                                </div>
                              </div>
                              <div className="project-progress">
                                <div className="progress">
                                  <div
                                    className={`progress-bar ${progressColorClass}`}
                                    style={{ width: `${percentage}%` }}
                                  >
                                    <span className="progress-percent-inside">
                                      {Math.round(percentage)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
              <div className="card-inne position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Employee-wise Timesheet Report</h5>
                  </div>
                </div>
              </div>

              <div className="card-inner p-0">
                <div className="nk-tb-list nk-tb-ulist">
                  <div className="nk-tb-item nk-tb-head">
                    <div className="nk-tb-col">
                      <span className="sub-text">Employee Name</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Client</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Project</span>
                    </div>
                    <div className="nk-tb-col">
                      <span className="sub-text">Total Hours</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span className="sub-text">Utilization %</span>
                    </div>
                    <div className="nk-tb-col nk-tb-col-tools text-end">
                      Actions
                    </div>
                  </div>

                  {employeeReportData.map((employee) => (
                    <div key={employee.id} className="nk-tb-item">
                      <div className="nk-tb-col">
                        <div className="user-card">
                          <div className="user-avatar bg-primary">
                            <span>
                              {employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
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
                          <div className="progress" style={{ width: "100px" }}>
                            <div
                              className={`progress-bar ${
                                employee.utilization >= 100
                                  ? "bg-success"
                                  : employee.utilization >= 90
                                  ? "bg-info"
                                  : "bg-warning"
                              }`}
                              style={{
                                width: `${Math.min(
                                  employee.utilization,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="nk-tb-col nk-tb-col-tools">
                        <div className="dropdown" style={{ position: 'relative' }}>
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActions(employee.id, 'employee');
                            }}
                            type="button"
                          >
                            Actions
                          </button>
                          {openActionsId === employee.id && actionsType === 'employee' && (
                            <div className="dropdown-menu dropdown-menu-right show">
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  alert(`Viewing details for ${employee.name}`);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <i className="fas fa-eye mr-1"></i> View Details
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  alert(`Downloading report for ${employee.name}`);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <i className="fas fa-download mr-1"></i> Download Report
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="nk-block mt-">
          <div className="card card-borderd card-stretc">
            <div className="card-inner-grou">
              <div className="card-inne position-relative">
                <div className="card-title-group">
                  <div className="card-title">
                    <h5 className="title">Weekly Breakdown</h5>
                  </div>
                </div>
              </div>

              <div className="nk-block mt-4">
                <div className="row g-gs">
                  {employeeReportData.map((employee) => (
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
                                  className={`hour-bar ${
                                    hours >= 40 ? "full" : "partial"
                                  }`}
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
                            <span
                              className={`value ${
                                employee.utilization >= 100
                                  ? "text-success"
                                  : employee.utilization >= 90
                                  ? "text-info"
                                  : "text-warning"
                              }`}
                            >
                              {employee.utilization}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* */}
            </div>
          </div>
        </div>
      </>
    );
  };

  // Function to render invoice report
  const renderInvoiceReport = () => {
    return (
      <div className="nk-block">
        <div className="card card-bordered card-stretch">
          <div className="card-inner-group">
            <div className="card-inne position-relative">
              <div className="card-title-group">
                <div className="card-title">
                  <h5 className="title">Invoice Report</h5>
                </div>
              </div>
              <div className="nk-tb-list nk-tb-orders">
                <div className="nk-tb-item nk-tb-head">
                  <div className="nk-tb-col">
                    <span>Invoice ID</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span>Client</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span>Month</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span>Issue Date</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span>Hours</span>
                  </div>
                  <div className="nk-tb-col">
                    <span>Amount</span>
                  </div>
                  <div className="nk-tb-col">
                    <span>Status</span>
                  </div>
                  <div className="nk-tb-col nk-tb-col-tools text-end">
                    <span className="sub-text">Actions</span>
                  </div>
                </div>
                {invoiceReportData.map((invoice) => (
                  <div key={invoice.id} className={`nk-tb-item ${openActionsId === invoice.id ? 'dropdown-open' : ''}`}>
                    <div className="nk-tb-col">
                      <span className="tb-lead">{invoice.invoiceNumber || invoice.id}</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span>{invoice.clientName}</span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span>
                        {invoice.month} {invoice.year}
                      </span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span>
                        {invoice.issueDate 
                          ? new Date(invoice.issueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: '2-digit',
                              year: 'numeric'
                            })
                          : invoice.createdAt 
                            ? new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: '2-digit',
                                year: 'numeric'
                              })
                            : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="nk-tb-col tb-col-md">
                      <span>{invoice.totalHours}</span>
                    </div>
                    <div className="nk-tb-col">
                      <span className="tb-amount">
                        ${invoice.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="nk-tb-col">
                      <span
                        className={`badge bg-outline-${
                          invoice.status === "Paid"
                            ? "success"
                            : invoice.status === "Pending"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className="nk-tb-col nk-tb-col-tools">
                      <div className="dropdown" style={{ position: 'relative' }}>
                        <button
                          className="btn btn-sm btn-outline-secondary dropdown-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActions(invoice.id, 'invoice');
                          }}
                          type="button"
                          ref={(el) => {
                            if (el && openActionsId === invoice.id) {
                              const rect = el.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              if (spaceBelow < 200) {
                                el.nextElementSibling?.classList.add('dropup');
                              }
                            }
                          }}
                        >
                          Actions
                        </button>
                        {openActionsId === invoice.id && actionsType === 'invoice' && (
                          <div className="dropdown-menu dropdown-menu-right show">
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedInvoiceForDetails(invoice);
                                setShowDetailsModal(true);
                                setOpenActionsId(null);
                                setActionsType(null);
                              }}
                            >
                              <i className="fas fa-eye mr-1"></i> View Details
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedInvoiceForPDF(invoice);
                                setShowPDFModal(true);
                                setOpenActionsId(null);
                                setActionsType(null);
                              }}
                            >
                              <i className="fas fa-download mr-1"></i> Download Invoice
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render analytics report
  // eslint-disable-next-line no-unused-vars
  const renderAnalyticsReport = () => {
    if (!analyticsData) {
      return (
        <div className="nk-block">
          <div className="card">
            <div className="card-inner text-center p-4">
              <p className="text-muted">No analytics data available</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="nk-block">
        <div className="row g-gs">
          {/* Summary Cards */}
          <div className="col-md-3 col-sm-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Total Hours</h6>
                  </div>
                </div>
                <div className="amount">{analyticsData.summary.totalHours}</div>
                <div className="change up text-success">
                  <em className="icon ni ni-arrow-long-up"></em>
                  <span>vs last period</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Total Revenue</h6>
                  </div>
                </div>
                <div className="amount">
                  ${analyticsData.summary.totalRevenue.toLocaleString()}
                </div>
                <div className="change up text-success">
                  <em className="icon ni ni-arrow-long-up"></em>
                  <span>vs last period</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Active Employees</h6>
                  </div>
                </div>
                <div className="amount">
                  {analyticsData.summary.totalEmployees}
                </div>
                <div className="change up text-success">
                  <em className="icon ni ni-arrow-long-up"></em>
                  <span>vs last period</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Active Clients</h6>
                  </div>
                </div>
                <div className="amount">
                  {analyticsData.summary.totalClients}
                </div>
                <div className="change up text-success">
                  <em className="icon ni ni-arrow-long-up"></em>
                  <span>vs last period</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hours by Client */}
          <div className="col-md-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Hours by Client</h6>
                  </div>
                </div>
                <div className="nk-tb-list nk-tb-orders">
                  {analyticsData.hoursByClient
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={index} className="nk-tb-item">
                        <div className="nk-tb-col">
                          <span className="tb-lead">{client.name}</span>
                        </div>
                        <div className="nk-tb-col">
                          <span className="tb-amount">{client.hours} hrs</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hours by Employee */}
          <div className="col-md-6">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Hours by Employee</h6>
                  </div>
                </div>
                <div className="nk-tb-list nk-tb-orders">
                  {analyticsData.hoursByEmployee
                    .slice(0, 5)
                    .map((employee, index) => (
                      <div key={index} className="nk-tb-item">
                        <div className="nk-tb-col">
                          <span className="tb-lead">{employee.name}</span>
                        </div>
                        <div className="nk-tb-col">
                          <span className="tb-amount">
                            {employee.hours} hrs
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="nk-conten">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    Reports & Analytics
                  </h3>
                  <div className="nk-block-des text-soft">
                    <p>
                      View detailed reports and analytics for clients and
                      employees.
                    </p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="reports-header-controls">
                    {/* View Mode Toggle */}
                    <div className="view-mode-toggle">
                      <button
                        type="button"
                        className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                        onClick={() => setViewMode('month')}
                      >
                        <i className="fas fa-calendar-alt"></i>
                        <span>Month</span>
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
                        onClick={() => setViewMode('week')}
                      >
                        <i className="fas fa-calendar-week"></i>
                        <span>Week</span>
                      </button>
                    </div>
                    
                    {/* Date Range Navigator */}
                    <div className="date-range-navigator">
                      {viewMode === 'month' ? (
                        <>
                          <button
                            className="nav-btn"
                            onClick={goToPreviousMonth}
                            title="Previous Month"
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          
                          <div className="date-display" onClick={handleDateDisplayClick} style={{ cursor: 'pointer' }}>
                            <i className="fas fa-calendar-alt"></i>
                            <span className="date-text">{selectedMonth} {selectedYear}</span>
                            <i className="fas fa-caret-down" style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}></i>
                          </div>
                          
                          <button
                            className="nav-btn"
                            onClick={goToNextMonth}
                            title="Next Month"
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                          
                          {!isCurrentMonth() && (
                            <button
                              className="today-btn"
                              onClick={goToCurrentMonth}
                              title="Go to Current Month"
                            >
                              <i className="fas fa-calendar-day"></i>
                              <span>Today</span>
                            </button>
                          )}
                        </>
                      ) : (
                        weekStart && weekEnd && (
                          <>
                            <button
                              className="nav-btn"
                              onClick={goToPreviousWeek}
                              title="Previous Week"
                            >
                              <i className="fas fa-chevron-left"></i>
                            </button>
                            
                            <div className="date-display" onClick={handleDateDisplayClick} style={{ cursor: 'pointer' }}>
                              <i className="fas fa-calendar-week"></i>
                              <span className="date-text">
                                {formatDate(weekStart)} - {formatDate(weekEnd)}
                              </span>
                              <i className="fas fa-caret-down" style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}></i>
                            </div>
                            
                            <button
                              className="nav-btn"
                              onClick={goToNextWeek}
                              title="Next Week"
                            >
                              <i className="fas fa-chevron-right"></i>
                            </button>
                            
                            {!isCurrentWeek() && (
                              <button
                                className="today-btn"
                                onClick={goToCurrentWeek}
                                title="Go to Current Week"
                              >
                                <i className="fas fa-calendar-day"></i>
                                <span>Today</span>
                              </button>
                            )}
                          </>
                        )
                      )}
                    </div>
                    
                    {/* Export Button */}
                    <button className="export-btn">
                      <i className="fas fa-download"></i>
                      <span>Export</span>
                    </button>
                  </div>
                  
                  {/* Calendar Picker */}
                  {showCalendar && (
                    <div className="calendar-picker">
                      <div className="calendar-header">
                        <button className="calendar-nav-btn" onClick={() => handleCalendarMonthChange(-1)}>
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="calendar-title">
                          {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button className="calendar-nav-btn" onClick={() => handleCalendarMonthChange(1)}>
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                      
                      <div className="calendar-body">
                        <div className="calendar-weekdays">
                          <div className="calendar-weekday">Sun</div>
                          <div className="calendar-weekday">Mon</div>
                          <div className="calendar-weekday">Tue</div>
                          <div className="calendar-weekday">Wed</div>
                          <div className="calendar-weekday">Thu</div>
                          <div className="calendar-weekday">Fri</div>
                          <div className="calendar-weekday">Sat</div>
                        </div>
                        
                        <div className="calendar-days">
                          {(() => {
                            const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(calendarDate);
                            const days = [];
                            
                            // Empty cells for days before month starts
                            for (let i = 0; i < startingDayOfWeek; i++) {
                              days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                            }
                            
                            // Days of the month
                            for (let day = 1; day <= daysInMonth; day++) {
                              const date = new Date(year, month, day);
                              const monday = getMonday(date);
                              const isSelected = viewMode === 'week' 
                                ? isDateInSelectedWeek(date)
                                : isDateInSelectedMonth(date);
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isWeekStart = date.toDateString() === monday.toDateString();
                              
                              days.push(
                                <div
                                  key={day}
                                  className={`calendar-day ${
                                    isSelected ? 'selected' : ''
                                  } ${
                                    isToday ? 'today' : ''
                                  } ${
                                    viewMode === 'week' && isWeekStart ? 'week-start' : ''
                                  }`}
                                  onClick={() => {
                                    if (viewMode === 'week') {
                                      handleWeekSelect(monday);
                                    } else {
                                      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
                                      handleMonthSelect(monthName, year);
                                    }
                                  }}
                                >
                                  <span className="day-number">{day}</span>
                                  {viewMode === 'week' && isWeekStart && (
                                    <span className="week-indicator">Week</span>
                                  )}
                                </div>
                              );
                            }
                            
                            return days;
                          })()}
                        </div>
                      </div>
                      
                      <div className="calendar-footer">
                        <button 
                          className="calendar-today-btn"
                          onClick={() => {
                            if (viewMode === 'week') {
                              goToCurrentWeek();
                            } else {
                              goToCurrentMonth();
                            }
                            setShowCalendar(false);
                          }}
                        >
                          <i className="fas fa-calendar-day"></i>
                          <span>Today</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Loading State */}
            {loading && (
              <div className="nk-block">
                <div className="card">
                  <div className="card-inner text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 mb-0">Loading reports data...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="nk-block">
                <div className="card">
                  <div className="card-inner text-center p-4">
                    <div className="text-danger mb-3">
                      <em className="icon ni ni-alert-circle fs-2x"></em>
                    </div>
                    <h5 className="text-danger">Error Loading Reports</h5>
                    <p className="text-muted">{error}</p>
                    <button
                      className="btn btn-primary"
                      onClick={fetchReportsData}
                    >
                      <em className="icon ni ni-reload"></em>
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Content */}
            {!loading && !error && (
              <>
                <div className="report-toggle-container">
                  <div className="toggle-pill">
                    <div
                      className={`pill-option ${
                        activeTab === "client" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("client")}
                    >
                      Client
                    </div>
                    <div
                      className={`pill-option ${
                        activeTab === "employee" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("employee")}
                    >
                      Employee
                    </div>
                    <div
                      className={`pill-option ${
                        activeTab === "invoice" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("invoice")}
                    >
                      Invoice
                    </div>
                    {/* <div
                      className={`pill-option ${
                        activeTab === "analytics" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("analytics")}
                    >
                      Analytics
                    </div> */}
                    <div className={`pill-slider ${activeTab}`}></div>
                  </div>

                  <div className="toggle-status">
                    Viewing:{" "}
                    <strong>
                      {activeTab === "client"
                        ? "Client-wise Report"
                        : activeTab === "employee"
                        ? "Employee-wise Report"
                        : activeTab === "invoice"
                        ? "Invoice Report"
                        : "Analytics Dashboard"
                        }
                    </strong>
                  </div>
                </div>

                {activeTab === "client" && renderClientReport()}
                {activeTab === "employee" && renderEmployeeReport()}
                {activeTab === "invoice" && renderInvoiceReport()}
                {/* {activeTab === "analytics" && renderAnalyticsReport()} */}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Invoice PDF Preview Modal */}
      {showPDFModal && selectedInvoiceForPDF && (
        <InvoicePDFPreviewModal
          invoice={selectedInvoiceForPDF}
          onClose={() => {
            setShowPDFModal(false);
            setSelectedInvoiceForPDF(null);
          }}
        />
      )}
      
      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoiceForDetails && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content invoice-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Invoice Details</h4>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="details-container">
                <div className="details-section">
                  <h5 className="section-title">
                    <i className="fas fa-file-invoice"></i> Invoice Information
                  </h5>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Invoice ID:</label>
                      <span>{selectedInvoiceForDetails.invoiceNumber || selectedInvoiceForDetails.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Client:</label>
                      <span>{selectedInvoiceForDetails.clientName || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Month:</label>
                      <span>{selectedInvoiceForDetails.month || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Issue Date:</label>
                      <span>{selectedInvoiceForDetails.issueDate ? new Date(selectedInvoiceForDetails.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Hours:</label>
                      <span>{selectedInvoiceForDetails.totalHours || selectedInvoiceForDetails.hours || 0}</span>
                    </div>
                    <div className="detail-item">
                      <label>Amount:</label>
                      <span className="amount">${parseFloat(selectedInvoiceForDetails.amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${selectedInvoiceForDetails.status?.toLowerCase()}`}>
                        {selectedInvoiceForDetails.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedInvoiceForDetails.lineItems && selectedInvoiceForDetails.lineItems.length > 0 && (
                  <div className="details-section">
                    <h5 className="section-title">
                      <i className="fas fa-list"></i> Line Items
                    </h5>
                    <div className="line-items-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Hours</th>
                            <th>Rate</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoiceForDetails.lineItems.map((item, index) => (
                            <tr key={index}>
                              <td>{item.description || 'N/A'}</td>
                              <td>{item.hours || 0}</td>
                              <td>${parseFloat(item.rate || 0).toFixed(2)}</td>
                              <td>${parseFloat(item.amount || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {selectedInvoiceForDetails.notes && (
                  <div className="details-section">
                    <h5 className="section-title">
                      <i className="fas fa-sticky-note"></i> Notes
                    </h5>
                    <div className="notes-content">
                      {selectedInvoiceForDetails.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setSelectedInvoiceForPDF(selectedInvoiceForDetails);
                  setShowPDFModal(true);
                  setShowDetailsModal(false);
                }}
              >
                <i className="fas fa-download mr-1"></i> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
