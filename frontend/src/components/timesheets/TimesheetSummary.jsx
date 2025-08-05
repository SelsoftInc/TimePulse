import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '../../utils/roles';
import PermissionGuard from '../common/PermissionGuard';
import DataGridFilter from '../common/DataGridFilter';
import './TimesheetSummary.css';

const TimesheetSummary = () => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientType, setClientType] = useState('internal'); // 'internal' or 'external'
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: { from: '', to: '' },
    search: ''
  });

  useEffect(() => {
    loadTimesheetData();
  }, []);

  const loadTimesheetData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock timesheet data matching Cognizant format
      const mockTimesheets = [
        {
          id: 1,
          weekRange: '12-JUL-2025 To 18-JUL-2025',
          status: 'Pending',
          billableProjectHrs: '0.00',
          timeOffHolidayHrs: '0.00',
          totalTimeHours: 'N/A'
        },
        {
          id: 2,
          weekRange: '05-JUL-2025 To 11-JUL-2025',
          status: 'Submitted for Approval',
          billableProjectHrs: '40.00',
          timeOffHolidayHrs: '0.00',
          totalTimeHours: 'N/A'
        },
        {
          id: 3,
          weekRange: '28-JUN-2025 To 04-JUL-2025',
          status: 'Submitted for Approval',
          billableProjectHrs: '32.00',
          timeOffHolidayHrs: '0.00',
          totalTimeHours: 'N/A'
        },
        {
          id: 4,
          weekRange: '21-JUN-2025 To 27-JUN-2025',
          status: 'Approved',
          billableProjectHrs: '40.00',
          timeOffHolidayHrs: '0.00',
          totalTimeHours: 'N/A'
        },
        {
          id: 5,
          weekRange: '14-JUN-2025 To 20-JUN-2025',
          status: 'Approved',
          billableProjectHrs: '24.00',
          nonBillableProjectHrs: '0.00',
          timeOffHolidayHrs: '0.00',
          totalTimeHours: 'N/A'
        },
        {
          id: 6,
          weekRange: '07-JUN-2025 To 13-JUN-2025',
          status: 'Approved',
          billableProjectHrs: '40.00',
          timeOffHolidayHrs: '0.00',
          totalTimeHours: 'N/A'
        },
        {
          id: 7,
          weekRange: '31-MAY-2025 To 06-JUN-2025',
          status: 'Approved',
          billableProjectHrs: '40.00',
          timeOffHolidayHrs: '0.00',
          totalTimeHours: 'N/A'
        },
        {
          id: 8,
          weekRange: '24-MAY-2025 To 30-MAY-2025',
          status: 'Approved',
          billableProjectHrs: '32.00',
          timeOffHolidayHrs: '0.00',
          totalTimeHours: 'N/A'
        }
      ];
      
      setTimesheets(mockTimesheets);
      
      // Determine client type based on user's assigned clients or company settings
      // In a real app, this would come from user profile or API
      // For demo, we'll simulate this - you can change this logic based on your needs
      const userClientType = localStorage.getItem('userClientType') || 'internal';
      setClientType(userClientType);
      
    } catch (error) {
      console.error('Error loading timesheet data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter timesheets based on current filters
  const filteredTimesheets = timesheets.filter(timesheet => {
    // Status filter
    if (filters.status !== 'all' && timesheet.status.toLowerCase() !== filters.status.toLowerCase()) {
      return false;
    }
    
    // Search filter
    if (filters.search && !timesheet.weekRange.toLowerCase().includes(filters.search.toLowerCase())) {
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
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      dateRange: { from: '', to: '' },
      search: ''
    });
  };

  // Define filter configuration
  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      value: filters.status,
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'submitted for approval', label: 'Submitted for Approval' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      key: 'search',
      label: 'Search Week Range',
      type: 'text',
      value: filters.search,
      defaultValue: '',
      placeholder: 'Search by week range...'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange',
      value: filters.dateRange,
      defaultValue: { from: '', to: '' }
    }
  ];

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="badge badge-pending">Pending</span>;
      case 'submitted for approval':
        return <span className="badge badge-submitted">Submitted for Approval</span>;
      case 'approved':
        return <span className="badge badge-approved">Approved</span>;
      case 'rejected':
        return <span className="badge badge-rejected">Rejected</span>;
      default:
        return <span className="badge badge-default">{status}</span>;
    }
  };

  const handleNewTimesheet = () => {
    navigate(`/${subdomain}/timesheets/submit`);
  };

  // Helper function to toggle client type for testing
  const toggleClientType = () => {
    const newClientType = clientType === 'internal' ? 'external' : 'internal';
    setClientType(newClientType);
    localStorage.setItem('userClientType', newClientType);
  };

  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block-head nk-block-head-sm">
                <div className="nk-block-between">
                  <div className="nk-block-head-content">
                    <h3 className="nk-block-title page-title">Timesheets</h3>
                  </div>
                </div>
              </div>
              <div className="nk-block">
                <div className="card card-bordered">
                  <div className="card-inner">
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
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Timesheets</h3>
                  <div className="nk-block-des text-soft">
                    <p>Timesheet Summary</p>
                    <div className="mt-2">
                      <span className={`badge badge-${clientType === 'internal' ? 'primary' : 'warning'} mr-2`}>
                        {clientType === 'internal' ? 'Internal Client' : 'External Client'}
                      </span>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={toggleClientType}
                        title="Toggle between Internal and External client types"
                      >
                        Switch to {clientType === 'internal' ? 'External' : 'Internal'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <div className="toggle-content content-active">
                      <ul className="nk-block-tools g-3">
                        <PermissionGuard requiredPermission={PERMISSIONS.CREATE_TIMESHEET} fallback={null}>
                          {clientType === 'internal' ? (
                            // For internal clients: Show Enter/Fill Timesheet option
                            <li>
                              <button 
                                className="btn btn-primary"
                                onClick={handleNewTimesheet}
                              >
                                <em className="icon ni ni-edit"></em>
                                <span>Enter Timesheet</span>
                              </button>
                            </li>
                          ) : (
                            // For external clients: Show Upload Timesheet option only
                            <li>
                              <button 
                                className="btn btn-primary"
                                onClick={handleNewTimesheet}
                              >
                                <em className="icon ni ni-upload"></em>
                                <span>Upload Timesheet</span>
                              </button>
                            </li>
                          )}
                        </PermissionGuard>
                        <PermissionGuard requiredPermission={PERMISSIONS.APPROVE_TIMESHEETS} fallback={null}>
                          <li>
                            <button 
                              className="btn btn-outline-success"
                              onClick={() => navigate(`/${subdomain}/timesheets/approval`)}
                            >
                              <em className="icon ni ni-check-circle"></em>
                              <span>Approve Timesheets</span>
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-primary"
                              onClick={() => navigate(`/${subdomain}/timesheets/to-invoice`)}
                            >
                              <em className="icon ni ni-file-docs"></em>
                              <span>Convert to Invoice</span>
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-success"
                              onClick={() => navigate(`/${subdomain}/timesheets/auto-convert`)}
                            >
                              <em className="icon ni ni-upload"></em>
                              <span>🤖 Test Auto-Convert</span>
                            </button>
                          </li>
                        </PermissionGuard>
                        <PermissionGuard requiredPermission={PERMISSIONS.CREATE_INVOICE} fallback={null}>
                          <li>
                            <button 
                              className="btn btn-outline-info"
                              onClick={() => navigate(`/${subdomain}/timesheets/to-invoice`)}
                              title="Convert timesheet documents to invoices using AI"
                            >
                              <em className="icon ni ni-file-text"></em>
                              <span>Convert to Invoice</span>
                            </button>
                          </li>
                        </PermissionGuard>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="nk-block">
              <div className="card card-bordered card-stretch">
                <div className="card-inner-group">
                  <div className="card-inner">
                    <div className="card-title-group">
                      <div className="card-title">
                        <h6 className="title">
                          <span className="mr-2">Please follow basic troubleshooting if you face any discrepancies in accessing the page.</span>
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
                  <div className="card-inner p-0">
                    <div className="table-responsive">
                      <table className="table table-hover timesheet-summary-table">
                        <thead className="table-light">
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
                          {filteredTimesheets.map(timesheet => (
                            <tr 
                              key={timesheet.id}
                              className="timesheet-row"
                            >
                              <td>
                                <div className="timesheet-week">
                                  <span className="week-range">{timesheet.weekRange}</span>
                                </div>
                              </td>
                              <td>
                                {getStatusBadge(timesheet.status)}
                              </td>
                              <td className="text-center">
                                <span className="hours-value">{timesheet.billableProjectHrs}</span>
                              </td>
                              <td className="text-center">
                                <span className="hours-value">{timesheet.timeOffHolidayHrs}</span>
                              </td>
                              <td className="text-center">
                                <span className="hours-value">{timesheet.totalTimeHours}</span>
                              </td>
                              <td className="text-center">
                                <div className="btn-group btn-group-sm" role="group">
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/${subdomain}/timesheets/submit/${timesheet.id}`);
                                    }}
                                    title="Edit Timesheet"
                                  >
                                    <em className="icon ni ni-edit"></em>
                                  </button>
                                  {timesheet.status === 'Submitted for Approval' && (
                                    <PermissionGuard requiredPermission={PERMISSIONS.APPROVE_TIMESHEETS} fallback={null}>
                                      <button
                                        className="btn btn-outline-success btn-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/${subdomain}/timesheets/approval`);
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
                                      navigate(`/${subdomain}/timesheets/submit/${timesheet.id}`);
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
    </div>
  );
};

export default TimesheetSummary;
