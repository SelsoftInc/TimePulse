// src/components/clients/ClientOverview.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ClientOverview.css';

const ClientOverview = ({ clientId }) => {
  // Sample client data - in a real app, this would come from an API
  const clientData = {
    1: { name: "JPMC", employeeCount: 7 },
    2: { name: "Accenture", employeeCount: 5 },
    3: { name: "Virtusa", employeeCount: 3 },
    4: { name: "Cognizant", employeeCount: 5 },
    5: { name: "IBM", employeeCount: 10 }
  };

  // Sample employee data - in a real app, this would come from an API
  const employeeData = {
    1: [ // JPMC
      { id: 1, name: "John Doe", weeklyHours: 40, status: "Submitted" },
      { id: 2, name: "Jane Smith", weeklyHours: 36, status: "Draft" },
      { id: 3, name: "Robert Johnson", weeklyHours: 42, status: "Approved" },
      { id: 4, name: "Emily Davis", weeklyHours: 38, status: "Submitted" },
      { id: 5, name: "Michael Brown", weeklyHours: 40, status: "Draft" },
      { id: 6, name: "Sarah Wilson", weeklyHours: 35, status: "Submitted" },
      { id: 7, name: "David Miller", weeklyHours: 40, status: "Approved" }
    ],
    2: [ // Accenture
      { id: 8, name: "Thomas Anderson", weeklyHours: 40, status: "Submitted" },
      { id: 9, name: "Lisa Taylor", weeklyHours: 38, status: "Draft" },
      { id: 10, name: "James Martinez", weeklyHours: 40, status: "Approved" },
      { id: 11, name: "Jennifer Garcia", weeklyHours: 36, status: "Submitted" },
      { id: 12, name: "Daniel Rodriguez", weeklyHours: 40, status: "Draft" }
    ],
    // Other clients' employees would be here
  };

  const client = clientData[clientId];
  const employees = employeeData[clientId] || [];

  // Function to render status badge
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'Approved':
        return <span className="badge badge-success">✅ Approved</span>;
      case 'Submitted':
        return <span className="badge badge-info">✅ Submitted</span>;
      case 'Draft':
        return <span className="badge badge-light">📝 Draft</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">{client?.name}</h3>
                  <div className="nk-block-des text-soft">
                    <p>{client?.employeeCount} employees assigned</p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <button className="btn btn-primary">
                      <em className="icon ni ni-plus"></em>
                      <span>Add Employee</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="nk-block">
              <div className="card card-bordered card-stretch">
                <div className="card-inner-group">
                  <div className="card-inner position-relative">
                    <div className="card-title-group">
                      <div className="card-title">
                        <h5 className="title">Employee List</h5>
                      </div>
                      <div className="card-tools">
                        <div className="form-inline flex-nowrap gx-3">
                          <div className="form-wrap w-150px">
                            <select className="form-select form-select-sm" data-search="off">
                              <option value="all">All Status</option>
                              <option value="draft">Draft</option>
                              <option value="submitted">Submitted</option>
                              <option value="approved">Approved</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-inner p-0">
                    <div className="nk-tb-list nk-tb-ulist">
                      <div className="nk-tb-item nk-tb-head">
                        <div className="nk-tb-col"><span className="sub-text">Employee Name</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Current Week Hours</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Status</span></div>
                        <div className="nk-tb-col nk-tb-col-tools text-end">Actions</div>
                      </div>
                      
                      {employees.map(employee => (
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
                            <span>{employee.weeklyHours} hours</span>
                          </div>
                          <div className="nk-tb-col tb-col-md">
                            {renderStatusBadge(employee.status)}
                          </div>
                          <div className="nk-tb-col nk-tb-col-tools">
                            <ul className="nk-tb-actions gx-1">
                              <li>
                                <Link to={`/timesheets/edit/${employee.id}`} className="btn btn-trigger btn-icon">
                                  <em className="icon ni ni-edit-alt"></em>
                                </Link>
                              </li>
                              <li>
                                <Link to={`/timesheets/view/${employee.id}`} className="btn btn-trigger btn-icon">
                                  <em className="icon ni ni-eye"></em>
                                </Link>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOverview;
