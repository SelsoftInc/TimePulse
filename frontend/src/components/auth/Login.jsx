import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";
import { API_BASE, apiFetch } from "../../config/api";
import logo2 from "../../assets/images/jsTree/TimePulseLogoAuth.png";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [backgroundTheme, setBackgroundTheme] = useState("default");

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData({
        email: savedEmail,
        password: "",
      });
      setRememberMe(true);
    } else {
      setFormData({
        email: "",
        password: "",
      });
    }
  }, []);

  // Cycle through background themes
  const cycleBackground = () => {
    const themes = [
      "default",
      "corporate-1",
      "corporate-2",
      "corporate-3",
      "corporate-4",
      "corporate-5",
      "corporate-6",
    ];
    const currentIndex = themes.indexOf(backgroundTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setBackgroundTheme(themes[nextIndex]);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Handle remember me functionality
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", formData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    try {
      // Check for demo credentials first
      if (
        (formData.email === "test" ||
          formData.email === "test@example.com" ||
          formData.email === "pushban@selsoftinc.com") &&
        (formData.password === "password" || formData.password === "test123#")
      ) {
        // Use real authentication for test user
        console.log("=== DEBUGGING LOGIN ===");
        console.log("Making request to: http://localhost:5001/api/auth/login");

        let response, data;
        try {
          response = await fetch("http://localhost:5001/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email:
                formData.email === "test"
                  ? "pushban@selsoftinc.com"
                  : formData.email,
              password:
                formData.password === "password"
                  ? "test123#"
                  : formData.password,
            }),
          });

          console.log("Response status:", response.status);
          console.log("Response ok:", response.ok);

          data = await response.json();
          console.log("Response data:", data);
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          setError("Network error: " + fetchError.message);
          return;
        }

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

          // Use window.location for full page reload to ensure proper state initialization
          window.location.href = "/workspaces";
        } else {
          setError(data.message || "Login failed");
        }
      } else {
        // Try real authentication with backend
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
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

          // Redirect based on user role
          const subdomain = data.tenant?.subdomain || "selsoft";
          if (data.user.role === "employee") {
            window.location.href = `/${subdomain}/dashboard`;
          } else {
            window.location.href = `/${subdomain}/dashboard`;
          }
        } else {
          setError(
            data.message ||
              "Invalid credentials. Please check your username and password."
          );
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${backgroundTheme}`}>
      {/* Floating Elements */}
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>

      {/* Background Theme Selector */}
      <button
        className="theme-selector"
        onClick={cycleBackground}
        title="Change background theme"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
        </svg>
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <img src={logo2} alt="TimePulse Logo" className="auth-logo" />
          <h2>Welcome to TimePulse</h2>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label htmlFor="email">Username or Email</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter username or email"
              className="form-control"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="form-control password-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-footer">
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember Me</label>
            </div>
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
