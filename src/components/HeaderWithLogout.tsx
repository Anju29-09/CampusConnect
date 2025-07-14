'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearSession } from '../utils/sessionUtils';

interface HeaderWithLogoutProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export default function HeaderWithLogout({ title, subtitle, onBack }: HeaderWithLogoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white p-6 rounded-2xl shadow-lg border border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <div className="w-8 h-8 flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-yellow-100 text-sm">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              title="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
