'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function TestOAuth() {
  const { data: session, status } = useSession();
  const [envCheck, setEnvCheck] = useState({});

  useEffect(() => {
    // Check environment variables (client-side)
    setEnvCheck({
      hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'Not set',
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
    });
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '30px' }}>OAuth Configuration Test</h1>

      {/* Environment Check */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginTop: 0 }}>Environment Variables</h2>
        <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          <p>
            <strong>NEXT_PUBLIC_API_URL:</strong>{' '}
            <span style={{ color: envCheck.hasApiUrl ? 'green' : 'red' }}>
              {envCheck.apiUrl}
            </span>
          </p>
          <p>
            <strong>NEXT_PUBLIC_APP_URL:</strong>{' '}
            <span style={{ color: envCheck.hasAppUrl ? 'green' : 'red' }}>
              {envCheck.appUrl}
            </span>
          </p>
        </div>
      </div>

      {/* Session Status */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginTop: 0 }}>Session Status</h2>
        <p>
          <strong>Status:</strong>{' '}
          <span style={{ 
            color: status === 'authenticated' ? 'green' : status === 'loading' ? 'orange' : 'red',
            fontWeight: 'bold'
          }}>
            {status.toUpperCase()}
          </span>
        </p>
        
        {status === 'authenticated' && session?.user && (
          <div style={{ marginTop: '15px' }}>
            <h3>User Information:</h3>
            <pre style={{ 
              backgroundColor: '#fff', 
              padding: '15px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(session.user, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginTop: 0 }}>Actions</h2>
        
        {status === 'unauthenticated' && (
          <div>
            <button
              onClick={() => signIn('google', { callbackUrl: '/auth/callback' })}
              style={{
                backgroundColor: '#4285F4',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Sign in with Google
            </button>
            
            <button
              onClick={() => window.location.href = '/login'}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Go to Login Page
            </button>
          </div>
        )}

        {status === 'authenticated' && (
          <div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Sign Out
            </button>

            <button
              onClick={() => window.location.href = '/auth/callback'}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Go to Callback Handler
            </button>
          </div>
        )}

        {status === 'loading' && (
          <p style={{ color: '#6c757d' }}>Loading session...</p>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Setup Instructions</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Ensure <code>.env.local</code> file exists in <code>nextjs-app</code> directory</li>
          <li>Add your Google OAuth credentials:
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              marginTop: '10px',
              fontSize: '12px'
            }}>
{`GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5001`}
            </pre>
          </li>
          <li>Restart the Next.js development server</li>
          <li>Click "Sign in with Google" above to test</li>
        </ol>
      </div>
    </div>
  );
}
