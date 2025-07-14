'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Calendar, 
  FileText, 
  Download, 
  ArrowLeft, 
  Bell, 
  Users,
  GraduationCap,
  Clock,
  ExternalLink
} from 'lucide-react';

type Notice = {
  id: string;
  class: string;
  date: string;
  notice: string;
  file_url: string | null;
  file_type: string | null;
};

export default function StudentNoticeboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  // Load unique classes from students_list
  useEffect(() => {
    const loadClasses = async () => {
      const { data, error } = await supabase
        .from('students_list')
        .select('class');

      if (error) {
        console.error('Error loading classes:', error.message);
        return;
      }

      const unique = Array.from(new Set(data.map((d) => d.class?.trim())));
      setClasses(unique.filter(Boolean));
    };

    loadClasses();
  }, []);

  // Load notices when class changes
  useEffect(() => {
    const fetchNotices = async () => {
      if (!selectedClass) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('noticeboard')
        .select('*')
        .eq('class', selectedClass)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching notices:', error.message);
        setNotices([]);
      } else {
        setNotices(data || []);
      }

      setLoading(false);
    };

    fetchNotices();
  }, [selectedClass]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="w-4 h-4" />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (type.includes('doc')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (type.includes('image')) return <FileText className="w-4 h-4 text-green-500" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/noticeboard.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">📢 Notice Board</h1>
                <p className="text-orange-100 text-xs sm:text-sm">Stay updated with important announcements</p>
              </div>
            </div>
            <div className="self-end sm:self-auto">
              <button
                onClick={() => router.push('/student')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Class Selection */}
        <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Selection Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Select Your Class
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">Choose your class to view relevant notices</p>
          </div>

          {/* Selection Content */}
          <div className="p-4 sm:p-6">
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Class
              </label>
              <select
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 text-sm sm:text-lg"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">-- Select Your Class --</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notices Content */}
        {loading ? (
          <div className="rounded-2xl p-4 sm:p-8 shadow-lg border border-white/20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading notices...</p>
          </div>
        ) : selectedClass && notices.length === 0 ? (
          <div className="rounded-2xl p-4 sm:p-8 shadow-lg border border-white/20 text-center">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📭</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Notices Available</h3>
            <p className="text-sm sm:text-base text-gray-600">No notices have been posted for <strong>{selectedClass}</strong> yet.</p>
          </div>
        ) : selectedClass ? (
          <div className="space-y-6">
            {/* Notices Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Class Notices</h2>
                    <p className="text-green-100 text-xs sm:text-sm">{notices.length} notice{notices.length !== 1 ? 's' : ''} found</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-green-100">Class</p>
                  <p className="font-semibold text-sm sm:text-base">{selectedClass}</p>
                </div>
              </div>
            </div>

            {/* Notices List */}
            <div className="space-y-4">
              {notices.map((notice, index) => (
                <div 
                  key={notice.id} 
                  className="rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Notice Header */}
                  <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Posted on</p>
                          <p className="font-semibold text-gray-800 text-xs sm:text-sm">{formatDate(notice.date)}</p>
                        </div>
                      </div>
                      <div className="self-end sm:self-auto">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Notice #{index + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notice Content */}
                  <div className="p-4 sm:p-6">
                    <div className="prose prose-gray max-w-none">
                      <div className="text-gray-800 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                        {notice.notice}
                      </div>
                    </div>

                    {/* File Attachment */}
                    {notice.file_url && (
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border border-blue-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                          <div className="flex items-center space-x-3">
                            <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                              {getFileIcon(notice.file_type)}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">Attachment</p>
                              <p className="font-medium text-gray-800 text-xs sm:text-sm">
                                {notice.file_type?.toUpperCase() || 'File'}
                              </p>
                            </div>
                          </div>
                          <div className="self-end sm:self-auto mt-2 sm:mt-0">
                            <a
                              href={notice.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm"
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>View File</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Notice Board</h3>
            <p className="text-gray-600">Select your class from the dropdown above to view important announcements and updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
