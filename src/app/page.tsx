'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Shield, Users, DollarSign, GraduationCap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthMiddleware from '@/components/AuthMiddleware';

export default function AccessPage() {
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Define access codes for different roles
  const ACCESS_CODES = {
    admin: 'PROFESSOR2024',
    office: 'OFFICE2024', 
    student: 'STUDENT2024'
  };

  const handleAccess = async () => {
    setLoading(true);
    setError('');

    try {
      // Check which role the code corresponds to
      let role = '';
      if (accessCode === ACCESS_CODES.admin) {
        role = 'admin';
      } else if (accessCode === ACCESS_CODES.office) {
        role = 'office';
      } else if (accessCode === ACCESS_CODES.student) {
        role = 'student';
      } else {
        setError('Invalid access code. Please try again.');
        setLoading(false);
        return;
      }

      // Store access code and role in localStorage for session management
      localStorage.setItem('accessCode', accessCode);
      localStorage.setItem('userRole', role);
      localStorage.setItem('isAuthenticated', 'true');
        
      // Store session timestamp for security
      localStorage.setItem('sessionTimestamp', Date.now().toString());
        
        console.log('Session created successfully for role:', role);

      // Redirect based on role
      switch (role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'office':
          router.push('/office');
          break;
        case 'student':
          router.push('/student');
          break;
        default:
          setError('Invalid role. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAccess();
    }
  };

  return (
    <AuthMiddleware>
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 w-full h-full z-0"
          style={{
            backgroundImage: 'url(/background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 1,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
        {/* Content Card */}
        <div className="max-w-md w-full space-y-8 z-10 p-6">
          {/* Logo Header */}
          <div className="text-center">
            <img
              src="/education.png"
              alt="CampusConnect Logo"
              className="mx-auto mb-0"
              style={{ width: '180px', height: '180px', objectFit: 'contain', marginTop: '-48px' }}
            />
            <p
              className="text-lg font-extrabold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-wide drop-shadow-lg mb-0"
              style={{ letterSpacing: '0.04em', marginTop: '-12px' }}
            >
              Empowering Campuses, Seamlessly Connected.
            </p>
          </div>

          {/* Access Form */}
          <div className="rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="space-y-6">
              {/* Access Code Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your access code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-500"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Access Button */}
              <button
                onClick={handleAccess}
                disabled={loading || !accessCode.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Accessing...</span>
                  </>
                ) : (
                  <>
                    <span>Access Dashboard</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Secure Access
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Professor Dashboard Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Office Dashboard Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">Student Dashboard Access</span>
              </div>
            </div>
            <p className="text-sm mt-4 text-green-100">
              Contact your system administrator for access codes
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>School Management System</p>
            <p className="mt-1">Secure access with role-based permissions</p>
          </div>
        </div>
      </div>
    </AuthMiddleware>
  );
}
