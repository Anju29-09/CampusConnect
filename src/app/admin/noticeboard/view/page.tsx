'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, FileText, Image, File, Calendar, Users, Trash2 } from 'lucide-react';

type Notice = {
  id: string;
  class: string;
  date: string;
  notice: string;
  file_url: string | null;
  file_type: string | null;
};

export default function NoticeboardViewPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchClassList();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchNotices(selectedClass);
    } else {
      setNotices([]);
    }
  }, [selectedClass]);

  const fetchClassList = async () => {
    const { data, error } = await supabase.from('students_list').select('class');
    if (!error && data) {
      const unique = Array.from(new Set(data.map((d) => d.class)));
      setClassList(unique);
    }
  };

  const fetchNotices = async (className: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('noticeboard')
      .select('*')
      .eq('class', className)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching notices:', error.message);
    } else {
      setNotices(data || []);
    }
    setLoading(false);
  };

  const deleteNotice = async (id: string, file_url: string | null) => {
    const confirmed = window.confirm('Are you sure you want to delete this notice?');
    if (!confirmed) return;

    setDeleting(id);
    
    if (file_url) {
      const { error: storageError } = await supabase.storage
        .from('notices')
        .remove([file_url]);

      if (storageError) {
        console.error('Storage delete error:', storageError.message);
      }
    }
    
    const { error } = await supabase.from('noticeboard').delete().eq('id', id);
    if (error) {
      console.error('Delete error:', error.message);
      alert('❌ Failed to delete notice.');
    } else {
      alert('🗑️ Notice deleted successfully.');
      if (selectedClass) {
        fetchNotices(selectedClass);
      }
    }
    setDeleting(null);
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="w-4 h-4" />;
    return fileType === 'image' ? <Image className="w-4 h-4" /> : <File className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/noticeboard.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📌 Notice Board</h1>
                <p className="text-green-100 text-sm">View and manage all notices</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/noticeboard')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              title="Back to Notice Board"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Class Selection */}
        <div className="rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700 mb-2">🏫 Select Class to View Notices</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-black"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose a class...</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Select Class Prompt */}
        {!selectedClass && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Class</h3>
            <p className="text-gray-600">
              Please select a class from the dropdown above to view its notices.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && selectedClass && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notices for {selectedClass}...</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && selectedClass && notices.length === 0 && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📌</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Notices Found</h3>
            <p className="text-gray-600">
              No notices available for <strong>{selectedClass}</strong>.
            </p>
          </div>
        )}

        {/* Notices Grid */}
        {!loading && selectedClass && notices.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notices.map((notice) => (
              <div key={notice.id} className="rounded-2xl border border-white/20 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1">
                {/* Notice Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-200" />
                      <span className="text-sm font-medium text-blue-200">{notice.class}</span>
                    </div>
                    <button
                      onClick={() => deleteNotice(notice.id, notice.file_url)}
                      disabled={deleting === notice.id}
                      className="text-red-300 hover:text-red-200 transition-colors duration-200 disabled:opacity-50"
                      title="Delete Notice"
                    >
                      {deleting === notice.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-300"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(notice.date)}</span>
                  </div>
                </div>

                {/* Notice Content */}
                <div className="p-4">
                  <div className="text-gray-800 mb-4 whitespace-pre-line leading-relaxed">
                    {notice.notice || 'No notice text provided.'}
                  </div>

                  {/* File Attachment */}
                  {notice.file_url && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <a
                        href={notice.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 rounded-lg hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-200 border border-blue-500/30"
                      >
                        {getFileIcon(notice.file_type)}
                        <span className="text-sm">
                          View {notice.file_type === 'image' ? 'Image' : 'Document'}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && selectedClass && notices.length > 0 && (
          <div className="rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📊 Summary</h3>
              <p className="text-gray-600">
                Showing {notices.length} notice{notices.length !== 1 ? 's' : ''} for {selectedClass}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 