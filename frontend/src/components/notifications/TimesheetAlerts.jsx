import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./TimesheetAlert.css";

const TimesheetAlerts = ({ subdomain }) => {
  useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockAlerts = [
          {
            id: "1",
            type: "missing",
            week: "Jul 17, 2025",
            dueDate: "2025-07-17",
            message: "Your timesheet for the week of Jul 17, 2025 is missing",
            priority: "high",
            read: false,
            createdAt: "2025-07-18T10:00:00Z",
          },
          {
            id: "2",
            type: "reminder",
            week: "Jul 24, 2025",
            dueDate: "2025-07-24",
            message:
              "Reminder: Your timesheet for the week of Jul 24, 2025 is due tomorrow",
            priority: "medium",
            read: false,
            createdAt: "2025-07-23T10:00:00Z",
          },
          {
            id: "3",
            type: "approval",
            week: "Jul 3, 2025",
            dueDate: "2025-07-03",
            message:
              "Your timesheet for the week of Jul 3, 2025 has been approved",
            priority: "low",
            read: true,
            createdAt: "2025-07-05T14:30:00Z",
          },
        ];

        setAlerts(mockAlerts);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    const alertInterval = setInterval(() => {
      fetchAlerts();
    }, 60000);

    return () => clearInterval(alertInterval);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const markAsRead = async (alertId) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  const getAlertClass = (priority) => {
    switch (priority) {
      case "high":
        return "#f8d7da";
      case "medium":
        return "#fff3cd";
      case "low":
        return "#d4edda";
      default:
        return "#d1ecf1";
    }
  };

  const getAlertTextColor = (priority) => {
    switch (priority) {
      case "high":
        return "#721c24";
      case "medium":
        return "#856404";
      case "low":
        return "#155724";
      default:
        return "#0c5460";
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "missing":
        return "⚠️";
      case "reminder":
        return "⏰";
      case "approval":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  const unreadCount = alerts.filter((alert) => !alert.read).length;

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <div
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        onClick={toggleDropdown}
        aria-label={`You have ${unreadCount} unread notifications`}
        className="notification-bell-button"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="bell-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className="notification-badge"
            aria-live="polite"
            aria-atomic="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div
          className="dropdown-menu"
          style={{ right: 0, left: "auto", zIndex: 9999 }}
        >
          <div className="dropdown-head">
            <span className="dropdown-title">Notifications</span>
            <div className="dropdown-head-actions">
              {unreadCount > 0 && (
                <span className="badge-unread">{unreadCount} Unread</span>
              )}
              <Link
                to={`/${subdomain}/settings?tab=notifications`}
                className="settings-link"
                onClick={() => setDropdownOpen(false)}
              >
                <i className="fas fa-cog"></i>
                Settings
              </Link>
            </div>
          </div>

          <div className="dropdown-body">
            {loading ? (
              <div className="loading">Loading alerts...</div>
            ) : alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item ${alert.read ? "" : "unread"}`}
                  onClick={() => markAsRead(alert.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") markAsRead(alert.id);
                  }}
                >
                  <div
                    className="alert-icon"
                    style={{
                      backgroundColor: getAlertClass(alert.priority),
                      color: getAlertTextColor(alert.priority),
                    }}
                  >
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-meta">
                      <time dateTime={alert.createdAt}>
                        {new Date(alert.createdAt).toLocaleString()}
                      </time>
                      <button
                        className="dismiss-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alert.id);
                        }}
                        aria-label="Dismiss alert"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-alerts">No notifications</div>
            )}
          </div>

          <div className="dropdown-footer">
            <Link
              to={`/${subdomain}/employee-dashboard`}
              className="view-all-btn"
            >
              View All
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetAlerts;
