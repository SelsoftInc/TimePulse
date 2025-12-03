'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginComponent from '@/components/auth/Login';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, currentEmployer } = useAuth();

  useEffect(() => {
    if (isAuthenticated && currentEmployer) {
      // Redirect to appropriate dashboard based on role
      const subdomain = currentEmployer.subdomain || 'selsoft';
      const dashboardPath = currentEmployer.role === 'employee' 
        ? `/${subdomain}/employee-dashboard`
        : `/${subdomain}/dashboard`;
      router.push(dashboardPath);
    }
  }, [isAuthenticated, currentEmployer, router]);

  return <LoginComponent />;
}
