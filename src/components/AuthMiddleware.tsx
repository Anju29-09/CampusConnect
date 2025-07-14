'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSessionValid, getUserRole } from '@/utils/sessionUtils';

export default function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    if (isSessionValid()) {
      const userRole = getUserRole();
      
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'office':
          router.replace('/office');
          break;
        case 'student':
          router.replace('/student');
          break;
        default:
          // If role is invalid, clear session and stay on home page
          break;
      }
    }
  }, [router]);

  return <>{children}</>;
} 