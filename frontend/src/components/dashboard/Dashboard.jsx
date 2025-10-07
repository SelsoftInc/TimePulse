import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css";

const DashCards = ({ stats }) => {

  const getBarColor = (value) => {
    if (value > 70) return 'green';
    if (value >= 40) return 'orange';
    return 'red';
  };
  return (
    <div className="row">
      <div className="col-xxl-3 col-sm-6">
        <div className="card">
          <div className="nk-ecwg nk-ecwg6">
            <div className="card-inne">
              <div className="card-title-group">
                <div className="card-title">
                  <h6 className="title">Total Hours</h6>
                </div>
              </div>
              <div className="data">
                <div className="data-group">
                  <div className="amount">{stats.totalHours}</div>
                  <div className="nk-ecwg6-ck">
                    <div className="chart-bar-background">
                      <div
                        className="chart-bar-fill"
                        style={{ width: "80%", backgroundColor: getBarColor('80') }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <span className="change up text-success">
                    <em className="icon ni ni-arrow-long-up"></em>
                    {stats.hoursTrend}%
                  </span>
                  <span> vs. last week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-sm-6">
        <div className="card">
          <div className="nk-ecwg nk-ecwg6">
            <div className="card-inne">
              <div className="card-title-group">
                <div className="card-title">
                  <h6 className="title">Pending Timesheets</h6>
                </div>
              </div>
              <div className="data">
                <div className="data-group">
                  <div className="amount">{stats.pendingCount}</div>
                  <div className="nk-ecwg6-ck">
                    <div className="chart-bar-background">
                      <div
                        className="chart-bar-fill"
                        style={{ width: "30%", backgroundColor: getBarColor('30') }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <span className="change down text-danger">
                    <em className="icon ni ni-arrow-long-down"></em>
                    {stats.pendingTrend}%
                  </span>
                  <span> vs. last week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-sm-6">
        <div className="card">
          <div className="nk-ecwg nk-ecwg6">
            <div className="card-inne">
              <div className="card-title-group">
                <div className="card-title">
                  <h6 className="title">Approved Timesheets</h6>
                </div>
              </div>
              <div className="data">
                <div className="data-group">
                  <div className="amount">{stats.approvedCount}</div>
                  <div className="nk-ecwg6-ck">
                    <div className="chart-bar-background">
                      <div
                        className="chart-bar-fill"
                        style={{ width: "60%", backgroundColor: getBarColor('60') }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <span className="change up text-success">
                    <em className="icon ni ni-arrow-long-up"></em>
                    {stats.approvedTrend}%
                  </span>
                  <span> vs. last week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xxl-3 col-sm-6">
        <div className="card">
          <div className="nk-ecwg nk-ecwg6">
            <div className="card-inne">
              <div className="card-title-group">
                <div className="card-title">
                  <h6 className="title">Overdue Timesheets</h6>
                </div>
              </div>
              <div className="data">
                <div className="data-group">
                  <div className="amount">{stats.overdueCount}</div>
                  <div className="nk-ecwg6-ck">
                    <div className="chart-bar-background">
                      <div
                        className="chart-bar-fill"
                        style={{ width: "15%", backgroundColor: getBarColor('15') }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <span className="change down text-danger">
                    <em className="icon ni ni-arrow-long-down"></em>
                    {stats.overdueTrend}%
                  </span>
                  <span> vs. last week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimesheetTable = ({ timesheetData, isEmployeeRole }) => {
  const { subdomain } = useParams();
  const navigate = useNavigate();

  const handleAddTimesheet = () => {
    navigate(`/${subdomain}/timesheets/submit`);
  };
  return (
    <div className="card card-bordered card-full">
      <div className="card-inne">
        <div className="card-title-group">
          <div className="card-title1">
            <h6 className="nk-block-titl page-titl">Recent Timesheets</h6>
          </div>
          <div className="card-tools">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddTimesheet}
            >
              <em className="icon ni ni-plus"></em>
              <span>Add Timesheet</span>
            </button>
          </div>
        </div>
      </div>
      <div className="card-inner p-0 border-top">
        <div className="nk-tb-list nk-tb-orders">
          <div className="nk-tb-item nk-tb-head">
            {!isEmployeeRole && (
              <div className="nk-tb-col">
                <span>Employee</span>
              </div>
            )}
            <div className="nk-tb-col">
              <span>Project</span>
            </div>
            <div className="nk-tb-col">
              <span>Client</span>
            </div>
            <div className="nk-tb-col">
              <span>Week</span>
            </div>
            <div className="nk-tb-col">
              <span>Hours</span>
            </div>
            <div className="nk-tb-col">
              <span>Status</span>
            </div>
            <div className="nk-tb-col nk-tb-col-tools"></div>
          </div>

          {timesheetData.map((timesheet, index) => (
            <div key={index} className="nk-tb-item">
              {!isEmployeeRole && (
                <div className="nk-tb-col">
                  <div className="user-card">
                    <div className="user-avatar sm bg-primary-dim">
                      <span>{timesheet.employee.initials}</span>
                    </div>
                    <div className="user-info">
                      <span className="tb-lead">
                        {timesheet.employee.name}{" "}
                        <span className="dot dot-success d-md-none ms-1"></span>
                      </span>
                      <span>{timesheet.employee.role}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="nk-tb-col">
                <span className="tb-lead">{timesheet.project}</span>
              </div>
              <div className="nk-tb-col">
                <span className="tb-sub">{timesheet.client}</span>
              </div>
              <div className="nk-tb-col">
                <span className="tb-sub">{timesheet.week}</span>
              </div>
              <div className="nk-tb-col">
                <span className="tb-sub text-primary">{timesheet.hours}</span>
              </div>
              <div className="nk-tb-col">
                <span className={`badge bg-outline-${timesheet.status.color}`}>
                  {timesheet.status.label}
                </span>
              </div>
              <div className="nk-tb-col nk-tb-col-tools">
                <ul className="nk-tb-actions gx-1">
                  <li>
                    <div className="dropdown">
                      <button
                        className="dropdown-toggle btn btn-icon btn-trigger"
                        data-bs-toggle="dropdown"
                      >
                        <em className="icon ni ni-more-h"></em>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end">
                        <ul className="link-list-opt no-bdr">
                          <li>
                            <button className="dropdown-item">
                              <em className="icon ni ni-eye"></em>
                              <span>View Details</span>
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item">
                              <em className="icon ni ni-edit"></em>
                              <span>Edit</span>
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item">
                              <em className="icon ni ni-check-circle"></em>
                              <span>Approve</span>
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item">
                              <em className="icon ni ni-na"></em>
                              <span>Reject</span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// TimesheetProgress component - Shows progress stats

const TimesheetProgress = ({ stats }) => {
  return (
    <div className="card card-bordered h-100">
      <div className="card-inne">
        <div className="card-title-group align-start mb-2">
          <div className="card-title1">
            <h6 className="nk-block-head-conten">Timesheet Progress</h6>
          </div>
        </div>
        <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
          <div className="nk-sale-data">
            <span className="amount">
              {stats.pendingCount}

              <em className="icon ni ni-clock"></em>
            </span>
            <span className="sub-title">Pending Approval</span>
          </div>
          <div className="nk-sale-data">
            <span className="amount">
              {stats.approvedCount}{" "}
              <em className="icon ni ni-check-circle"></em>
            </span>
            <span className="sub-title">Approved</span>
          </div>
        </div>
        <div className="progress progress-md mt-4">
          <div
            className="progress-bar bg-primary"
            style={{
              width: `${
                (stats.approvedCount /
                  (stats.approvedCount +
                    stats.pendingCount +
                    stats.overdueCount)) *
                100
              }%`,
            }}
          ></div>
          <div
            className="progress-bar bg-warning"
            style={{
              width: `${
                (stats.pendingCount /
                  (stats.approvedCount +
                    stats.pendingCount +
                    stats.overdueCount)) *
                100
              }%`,
            }}
          ></div>
          <div
            className="progress-bar bg-danger"
            style={{
              width: `${
                (stats.overdueCount /
                  (stats.approvedCount +
                    stats.pendingCount +
                    stats.overdueCount)) *
                100
              }%`,
            }}
          ></div>
        </div>
        <div className="progress-info mt-2">
          <div className="progress-info-item">
            <span className="progress-info-label">
              <span className="progress-info-swatch bg-primary"></span> Approved
            </span>
            <span className="progress-info-percent">
              {Math.round(
                (stats.approvedCount /
                  (stats.approvedCount +
                    stats.pendingCount +
                    stats.overdueCount)) *
                  100
              )}
              %
            </span>
          </div>
          <div className="progress-info-item">
            <span className="progress-info-label">
              <span className="progress-info-swatch bg-warning"></span> Pending
            </span>
            <span className="progress-info-percent">
              {Math.round(
                (stats.pendingCount /
                  (stats.approvedCount +
                    stats.pendingCount +
                    stats.overdueCount)) *
                  100
              )}
              %
            </span>
          </div>
          <div className="progress-info-item">
            <span className="progress-info-label">
              <span className="progress-info-swatch bg-danger"></span> Overdue
            </span>
            <span className="progress-info-percent">
              {Math.round(
                (stats.overdueCount /
                  (stats.approvedCount +
                    stats.pendingCount +
                    stats.overdueCount)) *
                  100
              )}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoiceWidget = ({ invoiceData }) => {
  return (
    <div className="card card-bordered h-100">
      <div className="card-inne">
        <div className="card-title-group align-start mb-2">
          <div className="card-title1">
            <h6 className="nk-block-head-conten">Recent Invoices</h6>
          </div>
          <div className="card-tools">
            <button className="btn btn-primary btn-sm">Create Invoice</button>
          </div>
        </div>
        <div className="tranx-list">
          {invoiceData.map((invoice, idx) => (
            <div key={idx} className="tranx-item">
              <div className="tranx-col">
                <div className="tranx-info">
                  <div className="tranx-badge">
                    <span
                      className={`badge bg-outline-${invoice.status.color}`}
                    >
                      {invoice.status.label}
                    </span>
                  </div>
                  <div className="tranx-data">
                    <div className="tranx-label">{invoice.id}</div>
                    <div className="tranx-date">{invoice.client}</div>
                  </div>
                </div>
              </div>
              <div className="tranx-col">
                <div className="tranx-amount">
                  <div className="number">${invoice.amount}</div>
                  <div className="number-sm">{invoice.dueDate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard component
const Dashboard = () => {
  const { currentEmployer } = useAuth();
  // const navigate = useNavigate();
  // const { subdomain } = useParams();

  // Redirect employees to their dedicated dashboard
  // Note: Temporarily disabled until role assignment is fixed in login flow
  // useEffect(() => {
  //   console.log('Dashboard - currentEmployer:', currentEmployer);
  //   console.log('Dashboard - currentEmployer.role:', currentEmployer?.role);
  //   
  //   // Only redirect if user is ONLY an employee (not admin or approver)
  //   if (currentEmployer?.role === "employee") {
  //     console.log('Redirecting employee to employee-dashboard');
  //     navigate(`/${subdomain}/employee-dashboard`, { replace: true });
  //   }
  // }, [currentEmployer, navigate, subdomain]);

  // Determine if user is in employee role
  const isEmployeeRole = currentEmployer?.role === "employee";

  // Dashboard stats
  const dashStats = {
    totalHours: isEmployeeRole ? "40.0" : "215.5",
    hoursTrend: 2.5,
    pendingCount: isEmployeeRole ? 1 : 5,
    pendingTrend: -1.5,
    approvedCount: isEmployeeRole ? 3 : 12,
    approvedTrend: 3.2,
    overdueCount: isEmployeeRole ? 0 : 1,
    overdueTrend: -2.0,
  };

  // Filter timesheets based on role
  const [timesheetData, setTimesheetData] = useState([]);

  useEffect(() => {
    const fetchEmployeesAndTimesheets = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
        if (!userInfo.tenantId) {
          console.error("No tenant information available");
          return;
        }

        // Fetch current week's timesheets from backend (creates drafts if missing)
        const resp = await fetch(
          `http://localhost:5000/api/timesheets/current?tenantId=${userInfo.tenantId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await resp.json();
        if (data.success && Array.isArray(data.timesheets)) {
          const allTimesheetData = data.timesheets;

          if (isEmployeeRole) {
            const fullName = `${userInfo.firstName || ""} ${
              userInfo.lastName || ""
            }`.trim();
            const currentUserTimesheets = allTimesheetData.filter(
              (ts) =>
                ts.employee?.name === fullName ||
                ts.employee?.id === userInfo.employeeId ||
                ts.employee?.id === userInfo.id
            );
            setTimesheetData(currentUserTimesheets);
          } else {
            setTimesheetData(allTimesheetData);
          }
        } else {
          console.error("Failed to fetch timesheets:", data.error || data);
        }
      } catch (error) {
        console.error("Error fetching timesheets:", error);
      }
    };

    fetchEmployeesAndTimesheets();
  }, [isEmployeeRole]);

  // Sample invoice data
  const invoiceData = [
    {
      id: "JPMC-INV-001",
      client: "JPMC",
      amount: "80,000",
      dueDate: "Due Jul 15, 2025",
      status: { label: "Pending", color: "warning" },
    },
    {
      id: "AccentureINV-002",
      client: "Accenture",
      amount: "50,000",
      dueDate: "Paid Jun 28, 2025",
      status: { label: "Paid", color: "success" },
    },
    {
      id: "VirtusaINV-003",
      client: "Virtusa",
      amount: "30,000",
      dueDate: "Due Jul 20, 2025",
      status: { label: "Pending", color: "warning" },
    },
    {
      id: "CognizantINV-004",
      client: "Cognizant",
      amount: "45,000",
      dueDate: "Due Jun 30, 2025",
      status: { label: "Overdue", color: "danger" },
    },
    {
      id: "IBMINV-005",
      client: "IBM",
      amount: "90,000",
      dueDate: "Paid Jul 5, 2025",
      status: { label: "Paid", color: "success" },
    },
  ];

  // Render dashboard content
  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-conten">
                <h1 className="nk-block-title page-title">Dashboard</h1>
                <div className="nk-block-des text-soft ">
                  <p>
                    {isEmployeeRole
                      ? "Your timesheet summary"
                      : "Timesheet summary for all employees"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <DashCards stats={dashStats} />

          <div className="nk-block">
            <div className="row">
              {/* Timesheet Table */}
              <div className={isEmployeeRole ? "col-xxl-12" : "col-xxl-8"}>
                <TimesheetTable
                  timesheetData={timesheetData}
                  isEmployeeRole={isEmployeeRole}
                />
              </div>

              {!isEmployeeRole && (
                <div className="row2">
                  {/* Timesheet Progress */}
                  <div className="col-xxl-3 col-sm-6">
                    <TimesheetProgress stats={dashStats} />
                  </div>

                  {/* Invoice Widget - Only shown for Admin/Manager roles */}
                  <div className="col-xxl-3 col-sm-6">
                    <InvoiceWidget invoiceData={invoiceData} />
                  </div>
                </div>
              )}

              {isEmployeeRole && (
                <div className="row g-2">
                  {/* Employee widgets in single row */}
                  <div className="col-12">
                    <div className="employee-cards-container">
                      {/* This Week */}
                      <div className="employee-card-wrapper">
                        <div className="card card-bordered h-100">
                          <div className="card-inner p-2 text-center">
                            <div className="d-flex align-items-center justify-content-center mb-1">
                              <em className="icon ni ni-clock text-primary fs-6 me-1"></em>
                              <h6 className="nk-block-head-content fw-semibold mb-0 fs-7">This Week</h6>
                            </div>
                            <div className="amount h4 mb-0 text-success fw-bold">
                              42.5 <span className="fs-7 fw-normal">hrs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* This Month */}
                      <div className="employee-card-wrapper">
                        <div className="card card-bordered h-100">
                          <div className="card-inner p-2 text-center">
                            <div className="d-flex align-items-center justify-content-center mb-1">
                              <em className="icon ni ni-activity text-info fs-6 me-1"></em>
                              <h6 className="nk-block-head-content fw-semibold mb-0 fs-7">This Month</h6>
                            </div>
                            <div className="amount h4 mb-0 text-info fw-bold">
                              168.0 <span className="fs-7 fw-normal">hrs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Current - Pending */}
                      <div className="employee-card-wrapper">
                        <div className="card card-bordered h-100">
                          <div className="card-inner p-2 text-center">
                            <div className="d-flex align-items-center justify-content-center mb-1">
                              <em className="icon ni ni-clock text-warning fs-6 me-1"></em>
                              <h6 className="nk-block-head-content fw-semibold mb-0 fs-7">Pending</h6>
                            </div>
                            <div className="amount h4 mb-0 text-warning fw-bold">
                              2 <span className="fs-7 fw-normal">items</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Last Week - Approved */}
                      <div className="employee-card-wrapper">
                        <div className="card card-bordered h-100">
                          <div className="card-inner p-2 text-center">
                            <div className="d-flex align-items-center justify-content-center mb-1">
                              <em className="icon ni ni-check-circle text-success fs-6 me-1"></em>
                              <h6 className="nk-block-head-content fw-semibold mb-0 fs-7">Approved</h6>
                            </div>
                            <div className="amount h4 mb-0 text-success fw-bold">
                              5 <span className="fs-7 fw-normal">items</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="nk-block nk-block-lg">
            <div className="card card-bordered card-full">
              <div className="card-inne">
                <div className="card-title-group">
                  <div className="card-title1">
                    <h6 className="nk-block-head-conten">Upcoming Deadlines</h6>
                  </div>
                  <div className="card-tools">
                    <button className="btn btn-sm btn-primary">
                      View Calendar
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-inner p-0 border-top">
                <div className="nk-tb-list nk-tb-orders">
                  <div className="nk-tb-item nk-tb-head">
                    <div className="nk-tb-col">
                      <span>Timesheet submission deadlines</span>
                    </div>
                  </div>
                  <div className="nk-tb-item">
                    <div className="nk-tb-col">
                      <span className="tb-lead">Weekly Timesheet</span>
                      <span className="tb-sub">Due: Friday, July 18, 2025</span>
                    </div>
                  </div>
                  <div className="nk-tb-item">
                    <div className="nk-tb-col">
                      <span className="tb-lead">Monthly Summary</span>
                      <span className="tb-sub">Due: July 31, 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
