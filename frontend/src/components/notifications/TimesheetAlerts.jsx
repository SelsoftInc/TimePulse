import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { apiFetch } from "../../config/api";
import "./TimesheetAlert.css";

const TimesheetAlerts = ({ subdomain }) => {
  const { user, currentEmployer } = useAuth();
  const { notifications, unreadCount, markNotificationAsRead, markAllAsRead } = useWebSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user || !currentEmployer) return;
      
      try {
        setLoading(true);
        
        const response = await apiFetch(
          `/api/notifications?tenantId=${currentEmployer.id}&userId=${user.id}&limit=20`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.success) {
          setAlerts(response.notifications);
        } else {
          console.error("Error fetching notifications:", response.error);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user, currentEmployer]);

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
      await apiFetch(`/api/notifications/${alertId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          tenantId: currentEmployer?.id,
          userId: user?.id,
        }),
      });

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, readAt: new Date().toISOString() } : alert
        )
      );
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await apiFetch(`/api/notifications/${alertId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          tenantId: currentEmployer?.id,
          userId: user?.id,
        }),
      });

      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  const getAlertClass = (priority) => {
    switch (priority) {
      case "high":
      case "urgent":
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
      case "urgent":
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
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  };

  const unreadCount = alerts.filter((alert) => !alert.readAt).length;

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
              <div className="loading">Loading notifications...</div>
            ) : alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item ${alert.readAt ? "" : "unread"}`}
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