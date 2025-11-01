// src/components/reports/ReportsDashboard.jsx
import React, { useState, useEffect } from "react";
import "./ReportsDashboard.css";

const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleDateString('en-US', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real data from API
  const [clientReportData, setClientReportData] = useState([]);
  const [employeeReportData, setEmployeeReportData] = useState([]);
  const [invoiceReportData, setInvoiceReportData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Dropdown state for Actions
  const [openActionsId, setOpenActionsId] = useState(null);
  const [actionsType, setActionsType] = useState(null); // 'client', 'employee', 'invoice'

  // Fetch data from API
  useEffect(() => {
    fetchReportsData();
  }, [selectedMonth, selectedYear]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-dropdown')) {
        setOpenActionsId(null);
        setActionsType(null);
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

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      if (!userInfo.tenantId) {
        throw new Error("No tenant information available");
      }

      // Calculate date range based on selected month/year
      const year = parseInt(selectedYear);
      const monthIndex = new Date(`${selectedMonth} 1, ${year}`).getMonth();
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);

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
             `http://localhost:5001/api/reports/clients?tenantId=${
               userInfo.tenantId
             }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
             { headers }
           ).catch(err => {
             console.error('❌ Client reports fetch failed:', err);
             throw err;
           }),
           fetch(
             `http://localhost:5001/api/reports/employees?tenantId=${
               userInfo.tenantId
             }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
             { headers }
           ).catch(err => {
             console.error('❌ Employee reports fetch failed:', err);
             throw err;
           }),
           fetch(
             `http://localhost:5001/api/reports/invoices?tenantId=${
               userInfo.tenantId
             }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
             { headers }
           ).catch(err => {
             console.error('❌ Invoice reports fetch failed:', err);
             throw err;
           }),
           fetch(
             `http://localhost:5001/api/reports/analytics?tenantId=${userInfo.tenantId}&period=month`,
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
  };

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
                        <div className={`actions-dropdown ${openActionsId === client.id && actionsType === 'client' ? 'active' : ''}`}>
                          <button
                            className="btn-actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActions(client.id, 'client');
                            }}
                          >
                            Actions
                            <em className="icon ni ni-chevron-down"></em>
                          </button>
                          {openActionsId === client.id && actionsType === 'client' && (
                            <div className="actions-menu">
                              <button
                                className="actions-menu-item"
                                onClick={() => {
                                  alert(`Viewing details for ${client.name}`);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <em className="icon ni ni-eye"></em>
                                <span>View Details</span>
                              </button>
                              <button
                                className="actions-menu-item"
                                onClick={() => {
                                  alert(`Downloading report for ${client.name}`);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <em className="icon ni ni-download"></em>
                                <span>Download Report</span>
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
                        <div className={`actions-dropdown ${openActionsId === employee.id && actionsType === 'employee' ? 'active' : ''}`}>
                          <button
                            className="btn-actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActions(employee.id, 'employee');
                            }}
                          >
                            Actions
                            <em className="icon ni ni-chevron-down"></em>
                          </button>
                          {openActionsId === employee.id && actionsType === 'employee' && (
                            <div className="actions-menu">
                              <button
                                className="actions-menu-item"
                                onClick={() => {
                                  alert(`Viewing details for ${employee.name}`);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <em className="icon ni ni-eye"></em>
                                <span>View Details</span>
                              </button>
                              <button
                                className="actions-menu-item"
                                onClick={() => {
                                  alert(`Downloading report for ${employee.name}`);
                                  setOpenActionsId(null);
                                  setActionsType(null);
                                }}
                              >
                                <em className="icon ni ni-download"></em>
                                <span>Download Report</span>
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
                  <div key={invoice.id} className="nk-tb-item">
                    <div className="nk-tb-col">
                      <span className="tb-lead">{invoice.id}</span>
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
                      <div className={`actions-dropdown ${openActionsId === invoice.id && actionsType === 'invoice' ? 'active' : ''}`}>
                        <button
                          className="btn-actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActions(invoice.id, 'invoice');
                          }}
                        >
                          Actions
                          <em className="icon ni ni-chevron-down"></em>
                        </button>
                        {openActionsId === invoice.id && actionsType === 'invoice' && (
                          <div className="actions-menu">
                            <button
                              className="actions-menu-item"
                              onClick={() => {
                                alert(`Viewing details for invoice ${invoice.id}`);
                                setOpenActionsId(null);
                                setActionsType(null);
                              }}
                            >
                              <em className="icon ni ni-eye"></em>
                              <span>View Details</span>
                            </button>
                            <button
                              className="actions-menu-item"
                              onClick={() => {
                                alert(`Downloading invoice ${invoice.id}`);
                                setOpenActionsId(null);
                                setActionsType(null);
                              }}
                            >
                              <em className="icon ni ni-download"></em>
                              <span>Download Invoice</span>
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
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <div className="form-inline flex-nowrap gx-3">
                      <div className="form-wrap w-150px">
                        <select
                          className="form-select form-select-sm"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const date = new Date(0, i);
                            const monthName = date.toLocaleDateString('en-US', { month: 'long' });
                            return (
                              <option key={monthName} value={monthName}>
                                {monthName}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="form-wrap w-100px">
                        <select
                          className="form-select form-select-sm"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                        >
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="btn-wrap">
                        <button className="btn btn-dim btn-outline-light btn-export">
                          <em className="icon ni ni-download-cloud"></em>
                          <span>Export</span>
                        </button>
                      </div>
                    </div>
                  </div>
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
    </div>
  );
};

export default ReportsDashboard;
