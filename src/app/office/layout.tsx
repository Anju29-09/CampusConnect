'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const showBack = pathname !== '/office';

  return (
    <ProtectedRoute allowedRoles={['office']}>
      <div className="p-4">
        {children}
      </div>
    </ProtectedRoute>
  );
} 