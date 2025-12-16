'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import EmployerLayout from '@/components/layout/EmployerLayout';

export default function SubdomainLayout({ children }) {
  return (
    <ProtectedRoute>
      <EmployerLayout>
        {children}
      </EmployerLayout>
    </ProtectedRoute>
  );
}
