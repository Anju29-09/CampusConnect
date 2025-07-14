'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiTrash2 } from 'react-icons/fi';
import { ArrowLeft, DollarSign, FileText, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isSessionValid, getUserRole, clearSession } from '../../../../utils/sessionUtils';

type FeeRecord = {
  id: string;
  student_id: string;
  class: string;
  year: string;
  total: number;
  paid?: number;
  due: number;
  file_url?: string;
  student?: { full_name: string };
};

export default function OfficeFeesViewPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Check session validity on component mount
  useEffect(() => {
    if (!isSessionValid()) {
      clearSession();
      router.push('/');
      return;
    }

    // Check if user has office permissions
    const userRole = getUserRole();
    if (userRole !== 'office' && userRole !== 'admin') {
      router.push('/');
      return;
    }

    // Fetch all unique classes
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('students_list').select('class');
      if (!error && data) {
        const unique = Array.from(new Set(data.map((d: any) => d.class).filter(Boolean)));
        setClassList(unique);
      }
    };
    fetchClasses();
  }, [router]);

  // Fetch fees for selected class
  useEffect(() => {
    if (!selectedClass) {
      setFees([]);
      return;
    }
    const fetchFees = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('fees')
        .select('id, student_id, class, year, total, paid, due, file_url, student:student_id(full_name)')
        .eq('class', selectedClass);
      if (!error && data) {
        setFees(
          data.map((fee: any) => ({
            ...fee,
            student: Array.isArray(fee.student) ? fee.student[0] : fee.student
          }))
        );
      }
      setLoading(false);
    };
    fetchFees();
  }, [selectedClass]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee record?')) return;
    const { error } = await supabase.from('fees').delete().eq('id', id);
    if (!error) {
      setFees(fees => fees.filter(fee => fee.id !== id));
    } else {
      alert('Failed to delete record.');
    }
  };

  const getFileExtension = (url: string) => {
    const fileName = url.split('/').pop() || '';
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const getFileIcon = (url: string) => {
    const ext = getFileExtension(url).toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    return '📎';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" style={{ backgroundImage: 'url(/fees.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white p-4 sm:p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">💸 View Fee Records</h1>
                <p className="text-yellow-100 text-xs sm:text-sm">Review and manage student fee records</p>
              </div>
            </div>
            <div className="self-end sm:self-auto">
              <button
                onClick={() => router.push('/office/fees')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl p-4 sm:p-8 text-black">
          <div className="mb-6 sm:mb-8">
            <select
              className="w-full p-3 border-2 border-amber-300 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur-sm focus:ring-4 focus:ring-amber-400 focus:border-amber-500 focus:outline-none transition-all duration-300 text-black shadow-lg hover:shadow-xl hover:border-amber-400 hover:from-amber-100 hover:to-yellow-100 transform hover:-translate-y-1 text-sm sm:text-base"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classList.map(cls => (
                <option key={cls} value={cls} className="text-black">{cls}</option>
              ))}
            </select>
          </div>
          {selectedClass && (
            <>
              {loading ? (
                <div className="text-center text-black">Loading...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[600px] text-center text-xs sm:text-sm">
                    <thead className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
                      <tr>
                        <th className="p-2 sm:p-4 font-semibold">Student Name</th>
                        <th className="p-2 sm:p-4 font-semibold">Year</th>
                        <th className="p-2 sm:p-4 font-semibold">Total</th>
                        <th className="p-2 sm:p-4 font-semibold">Paid</th>
                        <th className="p-2 sm:p-4 font-semibold">Due</th>
                        <th className="p-2 sm:p-4 font-semibold">Status</th>
                        <th className="p-2 sm:p-4 font-semibold">Receipt</th>
                        <th className="p-2 sm:p-4 font-semibold">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-gray-500">No fee records found for this class.</td>
                        </tr>
                      ) : (
                        fees.map((fee, idx) => (
                          <tr key={fee.id} className="border-b border-gray-100 hover:bg-yellow-50 transition-colors duration-200">
                            <td className="p-3 text-left text-gray-800">{fee.student?.full_name || '-'}</td>
                            <td className="p-3 text-center text-gray-800">{fee.year}</td>
                            <td className="p-3 text-center text-gray-800">{fee.total}</td>
                            <td className="p-3 text-center text-gray-800">{fee.paid ?? 0}</td>
                            <td className="p-3 text-center text-gray-800">{fee.due}</td>
                            <td className="p-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                fee.due === 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {fee.due === 0 ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {fee.file_url ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-lg" title={getFileExtension(fee.file_url)}>
                                    {getFileIcon(fee.file_url)}
                                  </span>
                                  <a
                                    href={fee.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                    title="View File"
                                  >
                                    <FileText size={16} />
                                  </a>
                                  <a
                                    href={fee.file_url}
                                    download
                                    className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                    title="Download File"
                                  >
                                    <Download size={16} />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">No file</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDelete(fee.id)} className="text-red-600 hover:text-red-800" title="Delete">
                                <FiTrash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 