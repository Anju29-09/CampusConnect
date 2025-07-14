'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const showBack = pathname !== '/admin'; // only show if not already on dashboard

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="p-4">
        {children}
      </div>
    </ProtectedRoute>
  );
}
