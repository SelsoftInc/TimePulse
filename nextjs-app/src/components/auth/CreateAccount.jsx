'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COUNTRY_OPTIONS, getCountryCode, getPhoneMaxLength } from '@/config/lookups';
import { validatePhoneNumber } from '@/utils/validations';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CreateAccount = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'United States',
    requestedRole: 'employee',
    requestedApproverId: '',
    companyName: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch approvers when role is employee
  useEffect(() => {
    if (formData.requestedRole === 'employee') {
      fetchApprovers();
    } else {
      setApprovers([]);
      setFormData(prev => ({ ...prev, requestedApproverId: '' }));
    }
  }, [formData.requestedRole, formData.email]);

  const fetchApprovers = async () => {
    try {
      setLoadingApprovers(true);
      console.log('🔍 Fetching approvers...');
      
      const emailDomain = formData.email.includes('@') 
        ? formData.email.split('@')[1] 
        : '';
      
      const url = emailDomain 
        ? `${API_BASE}/api/oauth/approvers?emailDomain=${emailDomain}`
        : `${API_BASE}/api/oauth/approvers`;
      
      console.log('📡 Approvers URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('✅ Approvers response:', data);
      
      if (data.success && data.approvers) {
        setApprovers(data.approvers);
      }
    } catch (err) {
      console.error('❌ Error fetching approvers:', err);
    } finally {
      setLoadingApprovers(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!minLength) return 'Password must be at least 8 characters';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumber) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    if (name === 'phone') {
      const maxLength = getPhoneMaxLength(formData.country);
      const validation = validatePhoneNumber(value, formData.country);
      setPhoneError(validation.error || '');
    }

    if (name === 'password') {
      const error = validatePassword(value);
      setPasswordError(error);
    }

    if (name === 'confirmPassword' && formData.password) {
      if (value !== formData.password) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🚀 Starting form submission...');
    console.log('📝 Form data:', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      country: formData.country,
      requestedRole: formData.requestedRole,
      requestedApproverId: formData.requestedApproverId,
    });

    try {
      // Validate passwords match
      console.log('✅ Checking password match...');
      if (formData.password !== formData.confirmPassword) {
        console.log('❌ Passwords do not match');
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      console.log('✅ Passwords match');

      // Validate password strength
      console.log('✅ Validating password strength...');
      const passwordValidation = validatePassword(formData.password);
      if (passwordValidation) {
        console.log('❌ Password validation failed:', passwordValidation);
        setError(passwordValidation);
        setLoading(false);
        return;
      }
      console.log('✅ Password is strong');

      // Validate phone
      console.log('✅ Validating phone number:', formData.phone, 'for country:', formData.country);
      const phoneValidation = validatePhoneNumber(formData.phone, formData.country);
      console.log('📞 Phone validation result:', phoneValidation);
      if (!phoneValidation.isValid) {
        console.log('❌ Phone validation failed:', phoneValidation.error);
        setError(phoneValidation.error);
        setLoading(false);
        return;
      }
      console.log('✅ Phone number is valid');

      // Prepare submission data
      const countryCode = getCountryCode(formData.country);
      const fullPhone = formData.phone.replace(/\D/g, '');

      // Validate approver is selected for employee role
      if (formData.requestedRole === 'employee' && !formData.requestedApproverId) {
        setError('Please select an approver for Employee role');
        setLoading(false);
        return;
      }

      const submitData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
        countryCode: countryCode,
        requestedRole: formData.requestedRole,
        requestedApproverId: formData.requestedApproverId || null,
        companyName: formData.companyName.trim(),
        department: formData.department.trim(),
        password: formData.password,
      };

      console.log('📤 Submitting to:', `${API_BASE}/api/account-request/create`);
      console.log('📦 Data:', { ...submitData, password: '***' });

      const response = await fetch(`${API_BASE}/api/account-request/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Success! Request ID:', data.requestId);
        setSuccess(true);
        setLoading(false);
        
        setTimeout(() => {
          router.push(`/account-status?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        const errorMsg = data.message || data.error || data.errors?.[0]?.msg || 'Failed to create account request';
        console.error('❌ Error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Submission error:', err);
      setError(`Network error: ${err.message}. Please check if the server is running.`);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-green-600 mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Your account request has been submitted successfully. You will receive an email once it's approved.
          </p>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-semibold">
              Redirecting to status page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 text-lg">Join TimePulse - Request Access</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 px-5 py-4 rounded-lg mb-6 font-semibold">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                First Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder=""
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Last Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder=""
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="off"
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder=""
            />
          </div>

          {/* Country & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Country <span className="text-red-600">*</span>
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {COUNTRY_OPTIONS.map(country => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Phone <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold pointer-events-none">
                  {getCountryCode(formData.country)}
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  maxLength={getPhoneMaxLength(formData.country)}
                  className="w-full px-4 py-3 pl-16 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder=""
                />
              </div>
              {phoneError && <p className="text-red-600 text-sm mt-1 font-semibold">{phoneError}</p>}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Requested Role <span className="text-red-600">*</span>
            </label>
            <select
              name="requestedRole"
              value={formData.requestedRole}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="approver">Approver</option>
              <option value="hr">HR</option>
              <option value="accountant">Accountant</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Approver (only for employee role) */}
          {formData.requestedRole === 'employee' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Approver <span className="text-red-600">*</span>
              </label>
              <select
                name="requestedApproverId"
                value={formData.requestedApproverId}
                onChange={handleChange}
                required
                disabled={loadingApprovers}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
              >
                <option value="">-- Select an approver --</option>
                {approvers.map(approver => (
                  <option key={approver.id} value={approver.id}>
                    {approver.firstName} {approver.lastName} ({approver.email})
                  </option>
                ))}
              </select>
              {loadingApprovers && <p className="text-gray-600 text-sm mt-1 font-semibold">Loading approvers...</p>}
            </div>
          )}

          {/* Company & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Company Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder=""
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Department <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder=""
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors text-xl"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Confirm Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors text-xl"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>
          {passwordError && <p className="text-red-600 text-sm -mt-3 font-semibold">{passwordError}</p>}

          {/* Password Requirements */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-900 font-bold mb-2">Password Requirements:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• At least 8 characters</li>
              <li>• One uppercase letter</li>
              <li>• One lowercase letter</li>
              <li>• One number</li>
              <li>• One special character (!@#$%^&*)</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading || !!passwordError || !!phoneError}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg">Submitting Request...</span>
              </span>
            ) : (
              <span className="text-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Request
              </span>
            )}
          </button>

          {/* Back to Login */}
          <div className="text-center pt-4">
            <Link 
              href="/login" 
              className="inline-block px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 font-semibold"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccount;
