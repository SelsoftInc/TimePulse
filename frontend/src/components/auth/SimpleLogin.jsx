import React, { useState } from "react";
import "./Auth.css";
import { API_BASE, apiFetch } from "../../config/api";

const SimpleLogin = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSimpleLogin = async () => {
    setIsLoggingIn(true);
    console.log("Simple login button clicked");

    try {
      // Clear any existing data first
      localStorage.clear();

      // Use real authentication
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "pushban@selsoftinc.com",
          password: "test123#",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store authentication token
        localStorage.setItem("token", data.token);

        // Store user info
        const userInfo = {
          id: data.user.id,
          email: data.user.email,
          name: `${data.user.firstName} ${data.user.lastName}`,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          tenantId: data.user.tenantId,
          employeeId: data.user.employeeId,
        };
        localStorage.setItem("user", JSON.stringify(userInfo));
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        // Store tenant info
        if (data.tenant) {
          const tenantInfo = {
            id: data.tenant.id,
            name: data.tenant.tenantName,
            subdomain: data.tenant.subdomain,
            status: "active",
            role: data.user.role,
          };
          localStorage.setItem("tenants", JSON.stringify([tenantInfo]));
          localStorage.setItem("currentTenant", JSON.stringify(tenantInfo));
          localStorage.setItem("currentEmployer", JSON.stringify(tenantInfo));
        }

        console.log("Authentication data set, navigating to workspaces");

        // Use window.location for a full page reload to ensure app state is reset
        window.location.href = "/workspaces";
      } else {
        console.error("Login failed:", data.message);
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error("Error during login:", error);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card simple-login">
        <div className="auth-header">
          <h2>TimePulse Simple Login</h2>
          <p>One-click access to the demo account</p>
        </div>

        <div className="simple-login-content">
          <p>
            Click the button below to instantly access the TimePulse demo with
            pre-configured settings.
          </p>

          <button
            onClick={handleSimpleLogin}
            className="btn-primary btn-block btn-lg"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Logging in..." : "Access Demo Account"}
          </button>

          <div className="simple-login-info">
            <p>
              <strong>Note:</strong> This is a simplified login for
              demonstration purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
