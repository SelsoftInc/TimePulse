import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TimesheetSummary.css';

const TimesheetSummary = () => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchBy, setSearchBy] = useState('');

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
    } catch (error) {
      console.error('Error loading timesheet data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchBy);
  };

  const handleNewTimesheet = () => {
    navigate(`/${subdomain}/timesheets/submit`);
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
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <div className="toggle-content">
                      <ul className="nk-block-tools g-3">
                        <li>
                          <button 
                            className="btn btn-primary"
                            onClick={handleNewTimesheet}
                          >
                            <em className="icon ni ni-plus"></em>
                            <span>New Timesheet</span>
                          </button>
                        </li>
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
                  
                  {/* Search Section */}
                  <div className="card-inner border-top">
                    <div className="row g-4">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="form-label">Search By</label>
                          <select 
                            className="form-select"
                            value={searchBy}
                            onChange={(e) => setSearchBy(e.target.value)}
                          >
                            <option value="">Select...</option>
                            <option value="week">Week</option>
                            <option value="status">Status</option>
                            <option value="hours">Hours</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="form-label">&nbsp;</label>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-success"
                              onClick={handleSearch}
                            >
                              Search
                            </button>
                            <button className="btn btn-outline-secondary">
                              <em className="icon ni ni-setting"></em>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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
                          </tr>
                        </thead>
                        <tbody>
                          {timesheets.map((timesheet) => (
                            <tr 
                              key={timesheet.id}
                              className="timesheet-row"
                              onClick={() => navigate(`/${subdomain}/timesheets/submit/${timesheet.id}`)}
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
