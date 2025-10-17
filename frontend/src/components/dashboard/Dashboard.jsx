import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css";

const DashCards = ({ stats }) => {
  const getBarColor = (value) => {
    if (value > 70) return "green";
    if (value >= 40) return "orange";
    return "red";
  };

  // Calculate dynamic percentages for progress bars
  const calculatePercentage = (value, max) => {
    if (!max || max === 0) return 0;
    return Math.min((value / max) * 100, 100);
  };

  // Get max values for normalization - use total timesheets as baseline
  const totalTimesheets =
    stats.pendingCount + stats.approvedCount + stats.overdueCount;
  const maxTimesheets = totalTimesheets || 1;
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
                        style={{
                          width: "100%",
                          backgroundColor: getBarColor(100),
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <span
                    className={`change ${
                      stats.hoursTrend >= 0
                        ? "up text-success"
                        : "down text-danger"
                    }`}
                  >
                    <em
                      className={`icon ni ni-arrow-long-${
                        stats.hoursTrend >= 0 ? "up" : "down"
                      }`}
                    ></em>
                    {Math.abs(stats.hoursTrend)}%
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
                        style={{
                          width: `${calculatePercentage(
                            stats.pendingCount,
                            maxTimesheets
                          )}%`,
                          backgroundColor: getBarColor(
                            calculatePercentage(
                              stats.pendingCount,
                              maxTimesheets
                            )
                          ),
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <span
                    className={`change ${
                      stats.pendingTrend >= 0
                        ? "up text-danger"
                        : "down text-success"
                    }`}
                  >
                    <em
                      className={`icon ni ni-arrow-long-${
                        stats.pendingTrend >= 0 ? "up" : "down"
                      }`}
                    ></em>
                    {Math.abs(stats.pendingTrend)}%
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
                        style={{
                          width: `${calculatePercentage(
                            stats.approvedCount,
                            maxTimesheets
                          )}%`,
                          backgroundColor: getBarColor(
                            calculatePercentage(
                              stats.approvedCount,
                              maxTimesheets
                            )
                          ),
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <span
                    className={`change ${
                      stats.approvedTrend >= 0
                        ? "up text-success"
                        : "down text-danger"
                    }`}
                  >
                    <em
                      className={`icon ni ni-arrow-long-${
                        stats.approvedTrend >= 0 ? "up" : "down"
                      }`}
                    ></em>
                    {Math.abs(stats.approvedTrend)}%
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
                        style={{
                          width: `${calculatePercentage(
                            stats.overdueCount,
                            maxTimesheets
                          )}%`,
                          backgroundColor: getBarColor(
                            calculatePercentage(
                              stats.overdueCount,
                              maxTimesheets
                            )
                          ),
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <span
                    className={`change ${
                      stats.overdueTrend >= 0
                        ? "up text-danger"
                        : "down text-success"
                    }`}
                  >
                    <em
                      className={`icon ni ni-arrow-long-${
                        stats.overdueTrend >= 0 ? "up" : "down"
                      }`}
                    ></em>
                    {Math.abs(stats.overdueTrend)}%
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination
  const totalPages = Math.ceil(timesheetData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = timesheetData.slice(startIndex, endIndex);

  const handleAddTimesheet = () => {
    navigate(`/${subdomain}/timesheets/submit`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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

          {currentData.map((timesheet, index) => (
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
                    <button
                      className="btn btn-icon btn-trigger"
                      onClick={() =>
                        navigate(
                          `/${subdomain}/timesheets/submit/${timesheet.id}`
                        )
                      }
                      title="View Timesheet Details"
                    >
                      <em className="icon ni ni-eye"></em>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-inner">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, timesheetData.length)} of{" "}
              {timesheetData.length} entries
            </div>
            <ul className="pagination pagination-sm">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <em className="icon ni ni-chevron-left"></em>
                </button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li
                  key={i}
                  className={`page-item ${
                    currentPage === i + 1 ? "active" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <em className="icon ni ni-chevron-right"></em>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
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
  const [dashStats, setDashStats] = useState({
    totalHours: "0.0",
    hoursTrend: 0,
    pendingCount: 0,
    pendingTrend: 0,
    approvedCount: 0,
    approvedTrend: 0,
    overdueCount: 0,
    overdueTrend: 0,
    thisWeekHours: "0.0",
    thisMonthHours: "0.0",
  });

  // Filter timesheets based on role
  const [timesheetData, setTimesheetData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
        console.log("👤 User Info from localStorage:", userInfo);
        console.log("🔑 Employee ID:", userInfo.employeeId);
        console.log("🏢 Tenant ID:", userInfo.tenantId);

        if (!userInfo.tenantId) {
          console.error("No tenant information available");
          return;
        }

        // Fetch dashboard data based on role
        let dashboardResp;
        if (isEmployeeRole && userInfo.employeeId) {
          console.log("🌐 Fetching EMPLOYEE dashboard from API...");
          dashboardResp = await fetch(
            `http://localhost:5000/api/employee-dashboard?employeeId=${userInfo.employeeId}&tenantId=${userInfo.tenantId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
        } else {
          // Admin/Manager role - fetch aggregated data
          console.log("🌐 Fetching ADMIN dashboard from API...");
          dashboardResp = await fetch(
            `http://localhost:5000/api/employee-dashboard/admin?tenantId=${userInfo.tenantId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
        }

        if (dashboardResp) {
          const dashboardData = await dashboardResp.json();
          console.log("📊 Dashboard API Response:", dashboardData);

          if (dashboardData.success && dashboardData.data) {
            const { data } = dashboardData;
            console.log("✅ Dashboard Data:", data);
            console.log("📈 Timesheets:", data.timesheets);
            console.log("📋 Recent Timesheets:", data.timesheets.recent);

            // Update dashboard stats with real data from API
            console.log("🔍 Raw API Data:", {
              totalHoursAllTime: data.timesheets.totalHoursAllTime,
              totalHoursThisMonth: data.timesheets.totalHoursThisMonth,
              thisWeekHours: data.timesheets.thisWeekHours,
              pending: data.timesheets.pending,
              approved: data.timesheets.approved,
              rejected: data.timesheets.rejected,
            });

            const totalHours = data.timesheets.totalHoursAllTime
              ? data.timesheets.totalHoursAllTime.toFixed(1)
              : "0.0";
            const thisWeek = data.timesheets.thisWeekHours
              ? data.timesheets.thisWeekHours.toFixed(1)
              : "0.0";
            const thisMonth = data.timesheets.totalHoursThisMonth
              ? data.timesheets.totalHoursThisMonth.toFixed(1)
              : "0.0";

            console.log("📊 Calculated Values:", {
              totalHours,
              thisWeek,
              thisMonth,
            });

            setDashStats({
              totalHours: totalHours,
              hoursTrend: 2.5,
              pendingCount: data.timesheets.pending || 0,
              pendingTrend: -1.2,
              approvedCount: data.timesheets.approved || 0,
              approvedTrend: 3.2,
              overdueCount: data.timesheets.rejected || 0,
              overdueTrend: -2.0,
              thisWeekHours: thisWeek,
              thisMonthHours: thisMonth,
            });
            console.log("📊 Stats Updated:", {
              totalHours,
              thisWeek,
              thisMonth,
              pending: data.timesheets.pending,
              approved: data.timesheets.approved,
              rejected: data.timesheets.rejected,
            });

            // Transform recent timesheets for display
            if (data.timesheets.recent && data.timesheets.recent.length > 0) {
              const transformedTimesheets = data.timesheets.recent.map((ts) => {
                // For admin, use employee data from API; for employee, use current user
                const employeeName = isEmployeeRole
                  ? `${userInfo.firstName || ""} ${
                      userInfo.lastName || ""
                    }`.trim()
                  : ts.employeeName || "Unknown";
                const employeeInitials = isEmployeeRole
                  ? `${userInfo.firstName?.[0] || "E"}${
                      userInfo.lastName?.[0] || "E"
                    }`
                  : employeeName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2);

                return {
                  id: ts.id,
                  employee: {
                    name: employeeName,
                    initials: employeeInitials,
                    // role: 'Employee'
                  },
                  project: ts.projectName || "N/A",
                  client: ts.clientName || "N/A",
                  week: new Date(ts.weekStartDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  }),
                  hours: parseFloat(ts.totalHours) || 0,
                  status: {
                    label:
                      ts.status === "submitted"
                        ? "Pending"
                        : ts.status.charAt(0).toUpperCase() +
                          ts.status.slice(1),
                    color:
                      ts.status === "approved"
                        ? "success"
                        : ts.status === "submitted"
                        ? "warning"
                        : ts.status === "rejected"
                        ? "danger"
                        : "info",
                  },
                };
              });
              console.log("✅ Transformed Timesheets:", transformedTimesheets);
              setTimesheetData(transformedTimesheets);
            } else {
              console.warn("⚠️ No recent timesheets in response");
              setTimesheetData([]);
            }
            return;
          } else {
            console.error(
              "❌ API returned unsuccessful response:",
              dashboardData
            );
          }
        }

        // Fallback: Fetch current week's timesheets from backend
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
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [isEmployeeRole]);

  // Real invoice data from API
  const [invoiceData, setInvoiceData] = useState([]);

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
        if (!userInfo.tenantId) return;

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        };

        const response = await fetch(
          `http://localhost:5001/api/reports/invoices?tenantId=${userInfo.tenantId}`,
          { headers }
        );

        const data = await response.json();
        if (data.success && data.data) {
          // Transform data for display
          const transformedInvoices = data.data.slice(0, 5).map((invoice) => ({
            id: invoice.id,
            client: invoice.clientName,
            amount: invoice.amount.toLocaleString(),
            dueDate:
              invoice.status === "Paid"
                ? `Paid ${invoice.month} ${invoice.year}`
                : `Due ${invoice.month} ${invoice.year}`,
            status: {
              label: invoice.status,
              color:
                invoice.status === "Paid"
                  ? "success"
                  : invoice.status === "Pending"
                  ? "warning"
                  : "danger",
            },
          }));
          setInvoiceData(transformedInvoices);
        }
      } catch (error) {
        console.error("Error fetching invoice data:", error);
      }
    };

    if (!isEmployeeRole) {
      fetchInvoiceData();
    }
  }, [isEmployeeRole]);

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
                              <h6 className="nk-block-head-content fw-semibold mb-0 fs-7">
                                This Week
                              </h6>
                            </div>
                            <div className="amount h4 mb-0 text-success fw-bold">
                              {dashStats.thisWeekHours}{" "}
                              <span className="fs-7 fw-normal">hrs</span>
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
                              <h6 className="nk-block-head-content fw-semibold mb-0 fs-7">
                                This Month
                              </h6>
                            </div>
                            <div className="amount h4 mb-0 text-info fw-bold">
                              {dashStats.thisMonthHours}{" "}
                              <span className="fs-7 fw-normal">hrs</span>
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
                              <h6 className="nk-block-head-content fw-semibold mb-0 fs-7">
                                Pending
                              </h6>
                            </div>
                            <div className="amount h4 mb-0 text-warning fw-bold">
                              {dashStats.pendingCount}{" "}
                              <span className="fs-7 fw-normal">items</span>
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
                              <h6 className="nk-block-head-content fw-semibold mb-0 fs-7">
                                Approved
                              </h6>
                            </div>
                            <div className="amount h4 mb-0 text-success fw-bold">
                              {dashStats.approvedCount}{" "}
                              <span className="fs-7 fw-normal">items</span>
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
