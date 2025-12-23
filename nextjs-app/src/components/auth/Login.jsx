'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import "./Auth.css";
import { API_BASE } from '@/config/api';
import { validateStaticCredentials, getStaticSession, STATIC_ADMIN } from '@/utils/staticAuth';
import { decryptAuthResponse } from '@/utils/encryption';

const Login = () => {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: ""});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [backgroundTheme, setBackgroundTheme] = useState("default");
  const [isOAuthConfigured, setIsOAuthConfigured] = useState(true);

  // Check for OAuth errors and configuration
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError('Google OAuth is not configured. Please use email/password login or contact administrator.');
      setIsOAuthConfigured(false);
    }
    
    // Check if OAuth is configured by checking environment variables
    const checkOAuthConfig = async () => {
      try {
        const response = await fetch('/api/auth/providers');
        const providers = await response.json();
        const hasGoogle = providers && providers.google;
        setIsOAuthConfigured(hasGoogle);
      } catch (error) {
        console.log('OAuth check failed, assuming not configured');
        setIsOAuthConfigured(false);
      }
    };
    
    checkOAuthConfig();
  }, [searchParams]);

  // Load saved email only (NOT password for security)
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData({
        email: savedEmail,
        password: ""});
      setRememberMe(true);
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
      [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Check if redirected due to token expiration
    const sessionExpired = new URLSearchParams(window.location.search).get('sessionExpired');
    if (sessionExpired === 'true') {
      setError("Session expired, please login again");
    }

    // Handle remember me functionality - store ONLY email (NOT password for security)
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", formData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    const persistAuth = (token, userInfo, tenantInfo) => {
      // Always use localStorage for auth data (Remember Me only affects email prefill)
      // Clear any old session storage data
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('userInfo');
      sessionStorage.removeItem('tenants');
      sessionStorage.removeItem('currentTenant');
      sessionStorage.removeItem('currentEmployer');

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      if (tenantInfo) {
        localStorage.setItem('tenants', JSON.stringify([tenantInfo]));
        localStorage.setItem('currentTenant', JSON.stringify(tenantInfo));
        localStorage.setItem('currentEmployer', JSON.stringify(tenantInfo));
      }
    };

    try {
      // ===== STATIC AUTHENTICATION FOR UI DEVELOPMENT =====
      // Check for static admin credentials first (works without backend)
      if (validateStaticCredentials(formData.email, formData.password)) {
        console.log("✅ Static authentication successful");
        
        const staticSession = getStaticSession();
        
        // Store authentication token
        persistAuth(
          staticSession.token,
          {
            id: staticSession.user.id,
            email: staticSession.user.email,
            name: staticSession.user.name,
            firstName: staticSession.user.firstName,
            lastName: staticSession.user.lastName,
            role: staticSession.user.role,
            tenantId: staticSession.user.tenantId,
            employeeId: staticSession.user.employeeId,
            isStatic: true
          },
          {
            id: staticSession.tenant.id,
            name: staticSession.tenant.tenantName,
            subdomain: staticSession.tenant.subdomain,
            status: staticSession.tenant.status,
            role: staticSession.tenant.role,
            isStatic: true
          }
        );
        // Keep staticMode flag for UI dev; store it alongside token
        (rememberMe ? localStorage : sessionStorage).setItem('staticMode', 'true');
        
        // Redirect to dashboard
        const subdomain = staticSession.tenant.subdomain;
        const dashboardPath = `/${subdomain}/dashboard`;
        window.location.href = dashboardPath;
        return;
      }
      // ===== END STATIC AUTHENTICATION =====
      // Check for demo credentials first
      if (
        (formData.email === "test" ||
          formData.email === "test@example.com" ||
          formData.email === "pushban@selsoftinc.com") &&
        (formData.password === "password" || formData.password === "test123#")
      ) {
        // Use real authentication for test user
        console.log("=== DEBUGGING LOGIN ===");
        console.log("Making request to:", `${API_BASE}api/auth/login`);

        let response, data;
        try {
          response = await fetch(`${API_BASE}api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"},
            body: JSON.stringify({
              email:
                formData.email === "test"
                  ? "pushban@selsoftinc.com"
                  : formData.email,
              password:
                formData.password === "password"
                  ? "test123#"
                  : formData.password})});

          console.log("Response status:", response.status);
          console.log("Response ok:", response.ok);

          const rawData = await response.json();
          console.log("Raw response data:", rawData);
          
          // Decrypt the response if encrypted
          data = decryptAuthResponse(rawData);
          console.log("Decrypted response data:", data);
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          setError("Network error: " + fetchError.message);
          return;
        }

        if (response.ok && data.success) {
          // Check if user must change password (temporary password)
          if (data.user.mustChangePassword) {
            // Store user info temporarily for password change
            sessionStorage.setItem('tempUserId', data.user.id);
            sessionStorage.setItem('tempUserEmail', data.user.email);
            sessionStorage.setItem('tempUserName', `${data.user.firstName} ${data.user.lastName}`);
            sessionStorage.setItem('tempToken', data.token);
            sessionStorage.setItem('tempTenantId', data.user.tenantId);
            
            // Redirect to password change page
            window.location.href = '/change-password';
            return;
          }

          // Store user info
          const userInfo = {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.firstName} ${data.user.lastName}`,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            tenantId: data.user.tenantId,
            employeeId: data.user.employeeId};
          const tenantInfo = data.tenant
            ? {
              id: data.tenant.id,
              name: data.tenant.tenantName,
              subdomain: data.tenant.subdomain,
              status: 'active',
              role: data.user.role
            }
            : null;

          persistAuth(data.token, userInfo, tenantInfo);

          // Redirect based on user role
          const subdomain = data.tenant?.subdomain || "selsoft";
          const dashboardPath = data.user.role === 'employee' 
            ? `/${subdomain}/employee-dashboard`
            : `/${subdomain}/dashboard`;
          window.location.href = dashboardPath;
        } else {
          // Check if error is due to token expiration
          if (data.message && (data.message.includes('token') || data.message.includes('expired') || data.message.includes('unauthorized'))) {
            setError("Session expired, please login again");
          } else {
            setError(data.message || "Login failed");
          }
        }
      } else {
        // Try real authentication with backend
        const response = await fetch(`${API_BASE}api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"},
          body: JSON.stringify({
            email: formData.email,
            password: formData.password})});

        const rawData = await response.json();
        
        // Decrypt the response if encrypted
        const data = decryptAuthResponse(rawData);

        if (response.ok && data.success) {
          // Check if user must change password (temporary password)
          if (data.user.mustChangePassword) {
            // Store user info temporarily for password change
            sessionStorage.setItem('tempUserId', data.user.id);
            sessionStorage.setItem('tempUserEmail', data.user.email);
            sessionStorage.setItem('tempUserName', `${data.user.firstName} ${data.user.lastName}`);
            sessionStorage.setItem('tempToken', data.token);
            sessionStorage.setItem('tempTenantId', data.user.tenantId);
            
            // Redirect to password change page
            window.location.href = '/change-password';
            return;
          }

          // Store user info
          const userInfo = {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.firstName} ${data.user.lastName}`,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            tenantId: data.user.tenantId,
            employeeId: data.user.employeeId};
          const tenantInfo = data.tenant
            ? {
              id: data.tenant.id,
              name: data.tenant.tenantName,
              subdomain: data.tenant.subdomain,
              status: 'active',
              role: data.user.role
            }
            : null;

          persistAuth(data.token, userInfo, tenantInfo);

          // Redirect based on user role
          const subdomain = data.tenant?.subdomain || "selsoft";
          const dashboardPath = data.user.role === 'employee' 
            ? `/${subdomain}/employee-dashboard`
            : `/${subdomain}/dashboard`;
          window.location.href = dashboardPath;
        } else {
          // Check if error is due to token expiration
          if (data.message && (data.message.includes('token') || data.message.includes('expired') || data.message.includes('unauthorized'))) {
            setError("Session expired, please login again");
          } else {
            setError(
              data.message ||
                "Invalid credentials. Please check your username and password."
            );
          }
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      // Check if error is due to token expiration or network issues
      if (err.message && (err.message.includes('token') || err.message.includes('expired') || err.message.includes('unauthorized'))) {
        setError("Session expired, please login again");
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Add global error handler for token expiration
  useEffect(() => {
    const handleUnauthorized = (event) => {
      if (event.detail && event.detail.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userInfo');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userInfo');
        window.location.href = '/login?sessionExpired=true';
      }
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

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
          <img src="/assets/images/jsTree/TimePulse4.png" alt="TimePulse Logo" className="auth-logo" />
          <h2 style={{ color: '#ffffff' }}>Welcome to TimePulse</h2>
          <p style={{ color: '#ffffff', opacity: 1 }}>Sign in to your account</p>
        </div>

        {error && <div className="auth-error !text-white">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label htmlFor="email" className='!text-white/80'>Username or Email</label>
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
            <label htmlFor="password" className='!text-white/80'>Password</label>
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
              <label htmlFor="remember" className='!text-white/80'>Remember Me</label>
            </div>
            <Link href="/forgot-password" className="forgot-link">
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

        {/* OAuth Divider - Only show if OAuth is configured */}
        {isOAuthConfigured && (
          <div className="auth-divider">
            <span className='!text-white/80'>OR</span>
          </div>
        )}

        {/* Google OAuth Button - Only show if OAuth is configured */}
        {isOAuthConfigured && (
          <button
            type="button"
            className="btn-google btn-block"
            onClick={() => {
              setLoading(true);
              signIn('google', { 
                callbackUrl: '/auth/callback',
                redirect: true
              });
            }}
            disabled={loading}
          >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
        )}
      </div>
    </div>
  );
};

export default Login;
