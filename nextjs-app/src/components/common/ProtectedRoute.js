'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children, requiredPermission }) {
  const router = useRouter();
  const { isAuthenticated, checkPermission, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requiredPermission && !checkPermission(requiredPermission)) {
        router.push('/workspaces');
      }
    }
  }, [isAuthenticated, loading, requiredPermission, checkPermission, router]);

  // Show loading state while auth is being initialized
  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return null;
  }

  // If permission is required, check if user has it
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return null;
  }

  // User is authenticated and has required permission
  return children;
}
