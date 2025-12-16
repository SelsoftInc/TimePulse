'use client';

import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import axios from 'axios';
import "./Timesheet.css";

const TimesheetHistory = () => {
  const { subdomain } = useParams();
  const router = useRouter();
  const { user, isAdmin, isEmployee } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    employeeId: "",
    from: "",
    to: "",
    status: ""});
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0});
  const [availableEmployees, setAvailableEmployees] = useState([]);

  // Load employees for filter (if admin/manager)
  useEffect(() => {
    const loadEmployees = async () => {
      if (!isEmployee() && user?.tenantId) {
        try {
          const response = await axios.get(
            `${API_BASE}/api/employees?tenantId=${user.tenantId}`
          );
          if (response.data.success && response.data.employees) {
            setAvailableEmployees(
              response.data.employees
                .filter((emp) => emp.role !== "admin")
                .map((emp) => ({
                  id: emp.id,
                  name: `${emp.firstName} ${emp.lastName}`,
                  email: emp.email}))
            );
          }
        } catch (error) {
          console.error("Error loading employees:", error);
        }
      }
    };

    loadEmployees();
  }, [user, isEmployee]);

  // Load timesheet history
  const loadHistory = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    try {
      const params = {
        tenantId: user.tenantId,
        limit: pagination.limit,
        offset: pagination.offset};

      // Add filters
      if (filters.employeeId) params.employeeId = filters.employeeId;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;

      // If employee, only show their timesheets
      if (isEmployee()) {
        params.employeeId = user.id;
      }

      const response = await axios.get(`${API_BASE}/api/timesheets/history`, {
        params});

      if (response.data.success) {
        setTimesheets(response.data.timesheets);
        setTotal(response.data.total);
      } else {
        throw new Error(response.data.message || "Failed to load history");
      }
    } catch (error) {
      console.error("Error loading timesheet history:", error);
      toast.error(
        `Failed to load history: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, filters, user]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: "badge-secondary", label: "Draft" },
      submitted: { class: "badge-warning", label: "Submitted" },
      approved: { class: "badge-success", label: "Approved" },
      rejected: { class: "badge-danger", label: "Rejected" }};

    const badge = badges[status] || badges.draft;
    return (
      <span className={`badge ${badge.class}`}>{badge.label}</span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"});
  };

  const viewTimesheet = (timesheetId) => {
    router.push(`/${subdomain}/timesheets/submit/${timesheetId}`);
  };

  const totalPages = Math.ceil(total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="timesheet-history-page">
      <div className="nk-block-head nk-block-head-lg">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h2 className="nk-block-title">Timesheet History</h2>
            <p className="nk-block-des">
              View and manage your timesheet history
            </p>
          </div>
          <div className="nk-block-head-content">
            <button
              className="btn btn-primary"
              onClick={() => router.push(`/${subdomain}/timesheets/submit`)}
            >
              <em className="icon ni ni-plus"></em>
              <span>New Timesheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-bordered mb-4">
        <div className="card-inner">
          <div className="row g-3">
            {!isEmployee() && (
              <div className="col-md-3">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={filters.employeeId}
                  onChange={(e) => handleFilterChange("employeeId", e.target.value)}
                >
                  <option value="">All Employees</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-md-3">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.from}
                onChange={(e) => handleFilterChange("from", e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.to}
                onChange={(e) => handleFilterChange("to", e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setFilters({
                  employeeId: "",
                  from: "",
                  to: "",
                  status: ""});
                setPagination({ limit: 20, offset: 0 });
              }}
            >
              <em className="icon ni ni-reload"></em>
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timesheet List */}
      <div className="card card-bordered">
        <div className="card-inner">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading timesheet history...</p>
            </div>
          ) : timesheets.length === 0 ? (
            <div className="text-center py-5">
              <em className="icon ni ni-file-text" style={{ fontSize: "48px", opacity: 0.3 }}></em>
              <p className="mt-3 text-muted">No timesheets found</p>
              <button
                className="btn btn-primary mt-2"
                onClick={() => router.push(`/${subdomain}/timesheets/submit`)}
              >
                Create Your First Timesheet
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Week</th>
                      {!isEmployee() && <th>Employee</th>}
                      <th>Client</th>
                      <th>Total Hours</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timesheets.map((ts) => (
                      <tr key={ts.id}>
                        <td>
                          <div>
                            <strong>{formatDate(ts.weekStart)}</strong>
                            <br />
                            <small className="text-muted">to {formatDate(ts.weekEnd)}</small>
                          </div>
                        </td>
                        {!isEmployee() && (
                          <td>
                            {ts.employee
                              ? `${ts.employee.firstName} ${ts.employee.lastName}`
                              : "N/A"}
                          </td>
                        )}
                        <td>
                          {ts.client ? ts.client.clientName : "N/A"}
                        </td>
                        <td>
                          <strong>{ts.totalHours || 0}</strong> hrs
                        </td>
                        <td>{getStatusBadge(ts.status)}</td>
                        <td>
                          {ts.submittedAt
                            ? formatDate(ts.submittedAt)
                            : "Not submitted"}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => viewTimesheet(ts.id)}
                            title="View Timesheet"
                          >
                            <em className="icon ni ni-eye"></em>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted">
                    Showing {pagination.offset + 1} to{" "}
                    {Math.min(pagination.offset + pagination.limit, total)} of{" "}
                    {total} timesheets
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li
                        className={`page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() =>
                            handlePageChange(
                              Math.max(0, pagination.offset - pagination.limit)
                            )
                          }
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <li
                                key={page}
                                className={`page-item ${
                                  page === currentPage ? "active" : ""
                                }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() =>
                                    handlePageChange((page - 1) * pagination.limit)
                                  }
                                >
                                  {page}
                                </button>
                              </li>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <li key={page} className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            );
                          }
                          return null;
                        }
                      )}
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() =>
                            handlePageChange(
                              Math.min(
                                (totalPages - 1) * pagination.limit,
                                pagination.offset + pagination.limit
                              )
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimesheetHistory;
