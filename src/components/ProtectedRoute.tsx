'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSessionValid, getUserRole, clearSession } from '@/utils/sessionUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  loadingComponent?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  loadingComponent 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!isSessionValid()) {
      clearSession();
      router.replace('/');
      return;
    }

    // Check if user has the correct role
    const userRole = getUserRole();
    if (!userRole || !allowedRoles.includes(userRole)) {
      clearSession();
      router.replace('/');
      return;
    }

    // User is authenticated and authorized
    setIsAuthorized(true);
    setLoading(false);
  }, [router, allowedRoles]);

  if (loading) {
    return loadingComponent || (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect to home page
  }

  return <>{children}</>;
} 