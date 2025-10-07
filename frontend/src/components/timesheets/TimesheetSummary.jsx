import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PERMISSIONS } from "../../utils/roles";
import PermissionGuard from "../common/PermissionGuard";
import DataGridFilter from "../common/DataGridFilter";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import {
  uploadAndProcessTimesheet,
  transformTimesheetToInvoice,
} from "../../services/engineService";
import "./TimesheetSummary.css";

const TimesheetSummary = () => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientType, setClientType] = useState("internal");
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: { from: "", to: "" },
    search: "",
  });
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState("");
  const [invoiceError, setInvoiceError] = useState("");

  useEffect(() => {
    if (user?.tenantId) {
      loadTimesheetData();
    }
  }, [user]);

  const loadTimesheetData = async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenantId;
      const userEmail = user?.email;

      console.log('🔍 Loading timesheets...', { tenantId, userEmail, user });

      if (!tenantId || !userEmail) {
        console.error('❌ No tenant ID or email found', { tenantId, userEmail });
        setLoading(false);
        return;
      }

      // First, get the employee ID from email
      console.log('📡 Fetching employee by email...');
      const empResponse = await axios.get(`/api/timesheets/employees/by-email/${encodeURIComponent(userEmail)}?tenantId=${tenantId}`);
      
      if (!empResponse.data.success || !empResponse.data.employee) {
        console.error('❌ Employee not found');
        setLoading(false);
        return;
      }

      const employeeId = empResponse.data.employee.id;
      console.log('✅ Got employeeId:', employeeId);

      // Fetch all timesheets for the employee from API
      const apiUrl = `/api/timesheets/employee/${employeeId}/all?tenantId=${tenantId}`;
      console.log('📡 Calling API:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('✅ API Response:', response.data);

      if (response.data.success) {
        // Format timesheets to match UI expectations
        const formattedTimesheets = response.data.timesheets.map(ts => ({
          id: ts.id,
          weekRange: ts.week,
          status: ts.status.label === 'SUBMITTED' ? 'Submitted for Approval' : 
                  ts.status.label === 'APPROVED' ? 'Approved' :
                  ts.status.label === 'REJECTED' ? 'Rejected' : 
                  ts.status.label === 'DRAFT' ? 'Pending' : ts.status.label,
          billableProjectHrs: ts.hours,
          timeOffHolidayHrs: "0.00",
          totalTimeHours: "N/A",
          weekStart: ts.weekStart,
          weekEnd: ts.weekEnd,
          dailyHours: ts.dailyHours,
          notes: ts.notes,
          reviewer: ts.reviewer
        }));

        console.log('📊 Formatted timesheets:', formattedTimesheets);
        setTimesheets(formattedTimesheets);
      }

      // Determine client type
      const userClientType = localStorage.getItem("userClientType") || "internal";
      setClientType(userClientType);
    } catch (error) {
      console.error("❌ Error loading timesheet data:", error);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter timesheets based on current filters
  const filteredTimesheets = timesheets.filter((timesheet) => {
    // Status filter
    if (
      filters.status !== "all" &&
      timesheet.status.toLowerCase() !== filters.status.toLowerCase()
    ) {
      return false;
    }

    // Search filter
    if (
      filters.search &&
      !timesheet.weekRange.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Date range filter (basic implementation)
    if (filters.dateRange.from || filters.dateRange.to) {
      // For now, we'll skip complex date filtering since weekRange is in a specific format
      // In a real app, you'd parse the date properly
    }

    return true;
  });

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: "all",
      dateRange: { from: "", to: "" },
      search: "",
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Define filter configuration
  const filterConfig = [
    {
      key: "status",
      label: "Status",
      type: "select",
      value: filters.status,
      defaultValue: "all",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "pending", label: "Pending" },
        { value: "submitted for approval", label: "Submitted for Approval" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
    },
    {
      key: "search",
      label: "Search Week Range",
      type: "text",
      value: filters.search,
      defaultValue: "",
      placeholder: "Search by week range...",
    },
    {
      key: "dateRange",
      label: "Date Range",
      type: "dateRange",
      value: filters.dateRange,
      defaultValue: { from: "", to: "" },
    },
  ];

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <span className="badge badge-pending">Pending</span>;
      case "submitted for approval":
        return (
          <span className="badge badge-submitted">Submitted for Approval</span>
        );
      case "approved":
        return <span className="badge badge-approved">Approved</span>;
      case "rejected":
        return <span className="badge badge-rejected">Rejected</span>;
      default:
        return <span className="badge badge-default">{status}</span>;
    }
  };

  // Generate invoice from timesheet using engine API
  const handleGenerateInvoice = async (file) => {
    setGeneratingInvoice(true);
    setInvoiceError("");
    setInvoiceSuccess("");

    try {
      // Step 1: Upload and process timesheet using engine
      const timesheetData = await uploadAndProcessTimesheet(file);

      // Step 2: Transform engine response to invoice format
      const clientInfo = {
        name: "Sample Client", // You can get this from timesheet data or user selection
        email: "client@example.com",
        hourlyRate: 125, // Default rate, can be customized
        address: "123 Business St, City, State 12345",
      };

      const invoiceData = transformTimesheetToInvoice(
        timesheetData,
        clientInfo
      );

      // Step 3: Show success and navigate to invoice creation
      setInvoiceSuccess(
        `Invoice generated successfully! Total: $${invoiceData.total}`
      );

      // Auto-navigate after 2 seconds or show confirmation
      setTimeout(() => {
        if (
          window.confirm(
            "Invoice data is ready! Would you like to create the invoice now?"
          )
        ) {
          navigate(`/${subdomain}/invoices/create`, {
            state: {
              invoiceData,
              sourceTimesheet: {
                fileName: file.name,
                processedData: timesheetData,
              },
            },
          });
        }
      }, 2000);
    } catch (error) {
      console.error("Invoice generation error:", error);
      setInvoiceError(`Failed to generate invoice: ${error.message}`);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleNewTimesheet = () => {
    navigate(`/${subdomain}/timesheets/submit`);
  };

  // Helper function to toggle client type for testing
  const toggleClientType = () => {
    const newClientType = clientType === "internal" ? "external" : "internal";
    setClientType(newClientType);
    localStorage.setItem("userClientType", newClientType);
  };

  if (loading) {
    return (
      <div className="nk-conten">
        <div className="container-fluid">
          <div className="nk-content-inne">
            <div className="nk-content-body">
              <div className="nk-block-head nk-block-head-sm">
                <div className="nk-block-between">
                  <div className="nk-block-head-content">
                    <h1 className="nk-block-title page-title">Timesheets</h1>
                  </div>
                </div>
              </div>
              <div className="nk-bloc">
                <div className="card card-bordered">
                  <div className="card-inne">
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading timesheets...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="containe">
      <div className="container-fluid">
        <div className="nk-content-inne">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h1 className="nk-block-title page-title">Timesheets</h1>
                  <div className="nk-block-des text-soft">
                    {/* <p>Timesheet Summary</p> */}
                    <div className="mt-2 toggle-container">
                      <label
                        className="toggle-switch"
                        title="Switch the Toggle between Internal and External client types"
                      >
                        <input
                          type="checkbox"
                          checked={clientType === "external"}
                          onChange={toggleClientType}
                        />
                        <span className="slider"></span>
                        <span className="label-text">
                          Switch to{" "}
                          {clientType === "internal"
                            ? "External Client"
                            : "Internal Client"}
                        </span>
                      </label>

                      <span
                        className={`badge-toggle ${
                          clientType === "internal"
                            ? "badge-internal"
                            : "badge-external"
                        } mr-2`}
                      >
                        {clientType === "internal"
                          ? "Internal Client"
                          : "External Client"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="actions-dropdown" ref={dropdownRef}>
                  {/* Dropdown toggle button */}
                  <button
                    className="dropdown-toggle-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    aria-label="Toggle actions menu"
                  >
                    <em className="icon ni ni-menu"></em> Actions
                  </button>

                  {/* Dropdown menu */}
                  {isOpen && (
                    <ul className="dropdown-menu">
                      <PermissionGuard
                        requiredPermission={PERMISSIONS.CREATE_TIMESHEET}
                        fallback={null}
                      >
                        {clientType === "internal" ? (
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleNewTimesheet();
                                setIsOpen(false);
                              }}
                            >
                              <em className="icon ni ni-edit"></em> Enter
                              Timesheet
                            </button>
                          </li>
                        ) : (
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleNewTimesheet();
                                setIsOpen(false);
                              }}
                            >
                              <em className="icon ni ni-upload"></em> Upload
                              Timesheet
                            </button>
                          </li>
                        )}
                      </PermissionGuard>

                      <PermissionGuard
                        requiredPermission={PERMISSIONS.APPROVE_TIMESHEETS}
                        fallback={null}
                      >
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/${subdomain}/timesheets/approval`);
                              setIsOpen(false);
                            }}
                          >
                            <em className="icon ni ni-check-circle"></em>{" "}
                            Approve Timesheets
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/${subdomain}/timesheets/to-invoice`);
                              setIsOpen(false);
                            }}
                          >
                            <em className="icon ni ni-file-docs"></em> Convert
                            to Invoice
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/${subdomain}/timesheets/auto-convert`);
                              setIsOpen(false);
                            }}
                          >
                            <em className="icon ni ni-upload"></em> Test
                            Auto-Convert
                          </button>
                        </li>
                      </PermissionGuard>

                      <PermissionGuard
                        requiredPermission={PERMISSIONS.CREATE_INVOICE}
                        fallback={null}
                      >
                        <li>
                          <label
                            htmlFor="invoiceFileInput"
                            className="dropdown-item file-upload-label"
                            title="Upload timesheet and generate invoice using AI"
                          >
                            <em className="icon ni ni-file-plus"></em>
                            <span>
                              {generatingInvoice
                                ? "Generating..."
                                : "Generate Invoice"}
                            </span>
                          </label>
                          <input
                            type="file"
                            id="invoiceFileInput"
                            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleGenerateInvoice(file);
                                setIsOpen(false);
                              }
                            }}
                            disabled={generatingInvoice}
                          />
                        </li>

                        {generatingInvoice && (
                          <li className="dropdown-info">
                            <em className="icon ni ni-loader"></em> Processing
                            timesheet and generating invoice...
                          </li>
                        )}

                        {invoiceSuccess && (
                          <li className="dropdown-success">
                            <em className="icon ni ni-check-circle"></em>{" "}
                            {invoiceSuccess}
                          </li>
                        )}

                        {invoiceError && (
                          <li className="dropdown-error">
                            <em className="icon ni ni-cross-circle"></em>{" "}
                            {invoiceError}
                          </li>
                        )}

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              navigate(`/${subdomain}/timesheets/to-invoice`);
                              setIsOpen(false);
                            }}
                            title="Convert timesheet documents to invoices using AI"
                          >
                            <em className="icon ni ni-file-text"></em> Convert
                            to Invoice
                          </button>
                        </li>
                      </PermissionGuard>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="nk-block">
            <div className="card card-bordered card-stretch">
              <div className="card-inner-group">
                <div className="card-inne">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">
                        <span className="mr-2">
                          Please follow basic troubleshooting if you face any
                          discrepancies in accessing the page.
                        </span>
                      </h6>
                    </div>
                  </div>
                </div>

                {/* Filter Section */}
                <div className="card-inner border-top">
                  <DataGridFilter
                    filters={filterConfig}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    resultCount={filteredTimesheets.length}
                    totalCount={timesheets.length}
                  />
                </div>

                {/* Timesheet Table */}
                <div className="card-inner">
                  <div className="table-responsive">
                    <table className="table table-hove timesheet-summary-tabl">
                      <thead className="">
                        <tr>
                          <th>Week Range</th>
                          <th>Status</th>
                          <th>Hours</th>
                          <th>Time off/Holiday Hrs</th>
                          <th>Total Time Hours</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTimesheets.map((timesheet) => (
                          <tr key={timesheet.id} className="timesheet-row">
                            <td>
                              <div className="timesheet-week">
                                <span className="week-range">
                                  {timesheet.weekRange}
                                </span>
                              </div>
                            </td>
                            <td>{getStatusBadge(timesheet.status)}</td>
                            <td className="text-center">
                              <span className="hours-value">
                                {timesheet.billableProjectHrs}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="hours-value">
                                {timesheet.timeOffHolidayHrs}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="hours-value">
                                {timesheet.totalTimeHours}
                              </span>
                            </td>
                            <td className="text-center">
                              <div
                                className="btn-group btn-group-sm"
                                role="group"
                              >
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/${subdomain}/timesheets/submit/${timesheet.id}`
                                    );
                                  }}
                                  title="Edit Timesheet"
                                >
                                  <em className="icon ni ni-edit"></em>
                                </button>
                                {timesheet.status ===
                                  "Submitted for Approval" && (
                                  <PermissionGuard
                                    requiredPermission={
                                      PERMISSIONS.APPROVE_TIMESHEETS
                                    }
                                    fallback={null}
                                  >
                                    <button
                                      className="btn btn-outline-success btn-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/${subdomain}/timesheets/approval`
                                        );
                                      }}
                                      title="Approve Timesheet"
                                    >
                                      <em className="icon ni ni-check"></em>
                                    </button>
                                  </PermissionGuard>
                                )}
                                <button
                                  className="btn btn-outline-info btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/${subdomain}/timesheets/submit/${timesheet.id}`
                                    );
                                  }}
                                  title="View Details"
                                >
                                  <em className="icon ni ni-eye"></em>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default TimesheetSummary;
