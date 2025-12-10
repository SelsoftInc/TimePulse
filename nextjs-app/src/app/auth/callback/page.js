'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
          console.log('[OAuth Callback] API Base:', API_BASE);
          
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
          const data = await response.json();
          console.log('[OAuth Callback] Response data:', data);

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

          if (data.needsOnboarding) {
            // New user - redirect to onboarding
            const params = new URLSearchParams({
              email: session.user.email,
              googleId: session.user.id || '',
              name: session.user.name || ''
            });
            router.push(`/onboarding?${params.toString()}`);
            return;
          }

          if (data.exists && data.user) {
            // Existing user - store data and redirect to dashboard
            const userData = data.user;
            const tenantData = data.tenant;
            const token = data.token;

            // Store authentication data
            localStorage.setItem('token', token);
            
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
            }

            // Redirect based on role
            const subdomain = tenantData?.subdomain || 'selsoft';
            const dashboardPath = userData.role === 'employee' 
              ? `/${subdomain}/employee-dashboard`
              : `/${subdomain}/dashboard`;
            
            window.location.href = dashboardPath;
          } else {
            // Something went wrong, redirect to onboarding
            const params = new URLSearchParams({
              email: session.user.email,
              name: session.user.name || ''
            });
            router.push(`/onboarding?${params.toString()}`);
          }
        } catch (error) {
          console.error('[OAuth Callback] Error:', error);
          // On error, redirect to onboarding
          const params = new URLSearchParams({
            email: session.user.email,
            name: session.user.name || ''
          });
          console.log('[OAuth Callback] Redirecting to onboarding due to error');
          router.push(`/onboarding?${params.toString()}`);
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
