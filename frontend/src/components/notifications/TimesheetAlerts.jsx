import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TimesheetAlerts = ({ subdomain }) => {
  // We'll use the auth context for future personalized alerts
  useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        // In a real app, fetch from API
        // For now, using mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock alerts data
        const mockAlerts = [
          {
            id: '1',
            type: 'missing',
            week: 'Jul 17, 2025',
            dueDate: '2025-07-17',
            message: 'Your timesheet for the week of Jul 17, 2025 is missing',
            priority: 'high',
            read: false,
            createdAt: '2025-07-18T10:00:00Z'
          },
          {
            id: '2',
            type: 'reminder',
            week: 'Jul 24, 2025',
            dueDate: '2025-07-24',
            message: 'Reminder: Your timesheet for the week of Jul 24, 2025 is due tomorrow',
            priority: 'medium',
            read: false,
            createdAt: '2025-07-23T10:00:00Z'
          },
          {
            id: '3',
            type: 'approval',
            week: 'Jul 3, 2025',
            dueDate: '2025-07-03',
            message: 'Your timesheet for the week of Jul 3, 2025 has been approved',
            priority: 'low',
            read: true,
            createdAt: '2025-07-05T14:30:00Z'
          }
        ];
        
        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
    
    // In a real app, you might set up a WebSocket or polling for real-time alerts
    const alertInterval = setInterval(() => {
      fetchAlerts();
    }, 60000); // Check for new alerts every minute
    
    return () => clearInterval(alertInterval);
  }, []);
  
  const markAsRead = async (alertId) => {
    try {
      // In a real app, call API to mark as read
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };
  
  const dismissAlert = async (alertId) => {
    try {
      // In a real app, call API to dismiss alert
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };
  
  const getAlertClass = (priority) => {
    switch(priority) {
      case 'high': return 'alert-danger';
      case 'medium': return 'alert-warning';
      case 'low': return 'alert-success';
      default: return 'alert-info';
    }
  };
  
  const getAlertIcon = (type) => {
    switch(type) {
      case 'missing': return 'ni-alert-circle';
      case 'reminder': return 'ni-clock';
      case 'approval': return 'ni-check-circle';
      default: return 'ni-info';
    }
  };
  
  const unreadCount = alerts.filter(alert => !alert.read).length;
  
  if (loading) {
    return (
      <div className="dropdown-menu dropdown-menu-xl dropdown-menu-end">
        <div className="dropdown-head">
          <span className="sub-title nk-dropdown-title">Loading alerts...</span>
        </div>
        <div className="dropdown-body">
          <div className="nk-notification">
            <div className="nk-notification-item">
              <div className="nk-notification-icon">
                <em className="icon icon-circle bg-warning-dim ni ni-curve-down-right"></em>
              </div>
              <div className="nk-notification-content">
                <div className="nk-notification-text">Loading...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Dropdown toggle button with notification count */}
      <button 
        className="dropdown-toggle nk-quick-nav-icon" 
        data-bs-toggle="dropdown"
      >
        <div className="icon-status icon-status-info">
          <em className="icon ni ni-bell"></em>
          {unreadCount > 0 && (
            <span className="badge badge-pill badge-danger">{unreadCount}</span>
          )}
        </div>
      </button>
      
      {/* Dropdown menu */}
      <div className="dropdown-menu dropdown-menu-xl dropdown-menu-end">
        <div className="dropdown-head">
          <span className="sub-title nk-dropdown-title">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge badge-pill badge-danger">{unreadCount} Unread</span>
          )}
        </div>
        <div className="dropdown-body">
          <div className="nk-notification">
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`nk-notification-item ${!alert.read ? 'is-unread' : ''}`}
                  onClick={() => markAsRead(alert.id)}
                >
                  <div className="nk-notification-icon">
                    <em className={`icon icon-circle ${getAlertClass(alert.priority)} ni ${getAlertIcon(alert.type)}`}></em>
                  </div>
                  <div className="nk-notification-content">
                    <div className="nk-notification-text">
                      {alert.message}
                    </div>
                    <div className="nk-notification-time">
                      {new Date(alert.createdAt).toLocaleString()}
                      <button 
                        className="btn btn-sm btn-icon btn-trigger ms-2" 
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alert.id);
                        }}
                      >
                        <em className="icon ni ni-cross"></em>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="nk-notification-item">
                <div className="nk-notification-content">
                  <div className="nk-notification-text text-center">
                    No notifications
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="dropdown-foot center">
          <Link to={`/${subdomain}/employee-dashboard`} className="btn btn-primary">View All</Link>
        </div>
      </div>
    </>
  );
};

export default TimesheetAlerts;
