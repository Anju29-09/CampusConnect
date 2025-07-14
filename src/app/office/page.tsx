'use client';

import { Home, DollarSign, LogOut } from 'lucide-react';
import DashboardTile from '@/components/DashboardTile';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clearSession } from '../../utils/sessionUtils';

export default function OfficeDashboard() {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };



  return (
    <div className="relative min-h-screen flex flex-col p-6 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full z-0"
        style={{
          backgroundImage: 'url(/office.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <div className="max-w-4xl mx-auto space-y-6 z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Home className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">CampusConnect</h1>
                <p className="text-cyan-100 text-xs sm:text-sm">School Management System</p>
              </div>
            </div>
            <div className="flex items-center sm:space-x-4 self-end sm:self-center">
              <button 
                onClick={() => setShowLogoutConfirm(true)} 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Label */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Office Dashboard</h2>
              <p className="text-yellow-100 text-xs sm:text-sm">Manage school fees and payments</p>
            </div>
          </div>
        </div>

        {/* Dashboard Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <DashboardTile 
            label="Fees Management" 
            icon={<DollarSign />} 
            href="/office/fees" 
            bgColor="bg-amber-500" 
          />
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs sm:max-w-md shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Confirm Logout</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-5">
              Are you sure you want to logout from CampusConnect?
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 