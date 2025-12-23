'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { decryptAuthResponse } from '@/utils/encryption';

export default function AuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      console.log('[OAuth Callback] Status:', status);
      console.log('[OAuth Callback] Session:', session);
      
      if (status === 'loading') {
        console.log('[OAuth Callback] Still loading session...');
        return;
      }

      if (status === 'unauthenticated') {
        console.log('[OAuth Callback] Not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (session?.user?.email && !checking) {
        console.log('[OAuth Callback] Checking user:', session.user.email);
        setChecking(true);
        
        try {
          // Check if user exists in our database
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://44.222.217.57:5001';
          console.log('[OAuth Callback] API Base:', API_BASE);
          console.log('[OAuth Callback] Calling check-user endpoint...');
          
          const response = await fetch(`${API_BASE}/api/oauth/check-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: session.user.email,
              googleId: session.user.id
            })
          });

          console.log('[OAuth Callback] Response status:', response.status);
          console.log('[OAuth Callback] Response OK:', response.ok);
          
          if (!response.ok && response.status !== 403) {
            // If response is not OK and not 403 (pending/rejected), throw error
            throw new Error(`API call failed with status ${response.status}`);
          }
          
          const rawData = await response.json();
          console.log('[OAuth Callback] Raw response data:', JSON.stringify(rawData, null, 2));
          
          // Decrypt the response if encrypted, handle errors gracefully
          let data;
          try {
            data = decryptAuthResponse(rawData);
            console.log('[OAuth Callback] Decrypted response data:', JSON.stringify(data, null, 2));
          } catch (decryptError) {
            console.error('[OAuth Callback] Decryption error:', decryptError.message);
            console.log('[OAuth Callback] Using raw data as fallback');
            // If decryption fails, use raw data (might be unencrypted)
            data = rawData;
          }
          console.log('[OAuth Callback] Data properties:', {
            exists: data.exists,
            needsOnboarding: data.needsOnboarding,
            isPending: data.isPending,
            isRejected: data.isRejected,
            hasUser: !!data.user,
            hasTenant: !!data.tenant,
            hasToken: !!data.token
          });

          // Handle non-200 responses (403 for pending/rejected)
          if (!response.ok && (response.status === 403 || response.status === 401)) {
            console.log('[OAuth Callback] Non-OK response, checking for pending/rejected status');
          }

          // Check if user is pending approval
          if (data.isPending) {
            console.log('[OAuth Callback] User is pending approval, redirecting to pending page');
            // Store pending user info
            const pendingUser = {
              email: session.user.email,
              firstName: data.user?.firstName || session.user.name?.split(' ')[0] || '',
              lastName: data.user?.lastName || session.user.name?.split(' ')[1] || '',
              role: data.user?.role || '',
              status: 'pending'
            };
            localStorage.setItem('pendingUser', JSON.stringify(pendingUser));
            router.push('/pending-approval');
            return;
          }

          // Check if user is rejected
          if (data.isRejected) {
            console.log('[OAuth Callback] User registration was rejected');
            // Store rejection info
            const rejectedUser = {
              email: session.user.email,
              firstName: data.user?.firstName || session.user.name?.split(' ')[0] || '',
              lastName: data.user?.lastName || session.user.name?.split(' ')[1] || '',
              role: data.user?.role || '',
              status: 'rejected',
              reason: data.user?.rejectionReason || data.message
            };
            localStorage.setItem('rejectedUser', JSON.stringify(rejectedUser));
            router.push('/pending-approval'); // Can show rejection message on same page
            return;
          }

          // Check if user exists and has complete data (existing user login)
          if (data.exists && data.user && data.token) {
            // Existing user - store data and redirect to dashboard
            console.log('[OAuth Callback] ✅ Existing user found, processing login...');
            const userData = data.user;
            const tenantData = data.tenant;
            const token = data.token;

            console.log('[OAuth Callback] User data:', userData);
            console.log('[OAuth Callback] Tenant data:', tenantData);
            console.log('[OAuth Callback] Token present:', !!token);

            // Store authentication data
            localStorage.setItem('token', token);
            console.log('[OAuth Callback] Token stored in localStorage');
            
            const userInfo = {
              id: userData.id,
              email: userData.email,
              name: `${userData.firstName} ${userData.lastName}`,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              tenantId: userData.tenantId,
              employeeId: userData.employeeId,
              status: userData.status
            };
            localStorage.setItem('user', JSON.stringify(userInfo));
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            console.log('[OAuth Callback] User info stored in localStorage');

            // Store tenant info
            if (tenantData) {
              const tenantInfo = {
                id: tenantData.id,
                name: tenantData.tenantName,
                subdomain: tenantData.subdomain,
                status: tenantData.status,
                role: userData.role
              };
              localStorage.setItem('tenants', JSON.stringify([tenantInfo]));
              localStorage.setItem('currentTenant', JSON.stringify(tenantInfo));
              localStorage.setItem('currentEmployer', JSON.stringify(tenantInfo));
              console.log('[OAuth Callback] Tenant info stored in localStorage');
            }

            // Redirect based on role
            const subdomain = tenantData?.subdomain || 'selsoft';
            const dashboardPath = userData.role === 'employee' 
              ? `/${subdomain}/employee-dashboard`
              : `/${subdomain}/dashboard`;
            
            console.log('[OAuth Callback] 🚀 Redirecting to dashboard:', dashboardPath);
            console.log('[OAuth Callback] User role:', userData.role);
            console.log('[OAuth Callback] Subdomain:', subdomain);
            
            // Use window.location.href for hard redirect
            window.location.href = dashboardPath;
            
            // Prevent further execution
            return;
          }
          
          // Check if user needs onboarding (new user)
          if (data.needsOnboarding) {
            // New user - redirect to onboarding
            console.log('[OAuth Callback] New user detected, redirecting to onboarding');
            const params = new URLSearchParams({
              email: session.user.email,
              googleId: session.user.id || '',
              name: session.user.name || ''
            });
            router.push(`/onboarding?${params.toString()}`);
            return;
          }
          
          // If we reach here, something unexpected happened
          console.error('[OAuth Callback] Unexpected state - no clear action to take');
          console.error('[OAuth Callback] Data state:', {
            exists: data.exists,
            needsOnboarding: data.needsOnboarding,
            hasUser: !!data.user,
            hasToken: !!data.token,
            hasTenant: !!data.tenant
          });
          
          // Default to onboarding for safety
          const params = new URLSearchParams({
            email: session.user.email,
            name: session.user.name || ''
          });
          router.push(`/onboarding?${params.toString()}`);
        } catch (error) {
          console.error('[OAuth Callback] Error:', error);
          console.error('[OAuth Callback] Error details:', error.message);
          
          // Don't redirect to onboarding on server errors
          // Show error message and redirect to login
          alert('Authentication error: ' + (error.message || 'Unable to complete sign in. Please try again.'));
          console.log('[OAuth Callback] Redirecting to login due to error');
          router.push('/login');
        }
      } else if (session?.user && !session.user.email) {
        console.error('[OAuth Callback] Session exists but no email found:', session.user);
      }
    };

    handleAuth();
    
    // Timeout fallback - if stuck for more than 10 seconds, redirect to onboarding
    const timeout = setTimeout(() => {
      if (session?.user?.email && status === 'authenticated') {
        console.warn('[OAuth Callback] Timeout - forcing redirect to onboarding');
        const params = new URLSearchParams({
          email: session.user.email,
          name: session.user.name || ''
        });
        router.push(`/onboarding?${params.toString()}`);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [session, status, router, checking]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>Authenticating...</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Please wait while we sign you in
        </p>
        {session?.user?.email && (
          <p style={{ color: '#999', fontSize: '12px' }}>
            Signing in as: {session.user.email}
          </p>
        )}
        {status === 'loading' && (
          <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
            Loading session...
          </p>
        )}
        {checking && (
          <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
            Checking account...
          </p>
        )}
        <p style={{ color: '#ccc', fontSize: '11px', marginTop: '20px' }}>
          Check browser console for details
        </p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
