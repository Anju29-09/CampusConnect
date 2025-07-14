'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft } from 'lucide-react';

type Attendance = {
  id: string;
  student: string;
  roll_no: number;
  class: string;
  subject: string;
  status: string;
  date: string;
};

export default function AttendanceViewPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [groupedByDate, setGroupedByDate] = useState<{ [key: string]: { [key: string]: Attendance[] } }>({});
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchClassList();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchAttendance(selectedClass);
  }, [selectedClass]);

  const fetchClassList = async () => {
    const { data, error } = await supabase.from('students_list').select('class');
    if (!error && data) {
      const unique = Array.from(new Set(data.map((d) => d.class)));
      setClassList(unique);
    }
  };

  const fetchAttendance = async (className: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .ilike('class',className.trim())
      .order('date', { ascending: false })
      .order('roll_no', { ascending: true });

    if (error) {
      console.error('Error fetching attendance:', error.message);
    } else {
      const groupedData: { [key: string]: { [key: string]: Attendance[] } } = {};
      
      data.forEach((entry: Attendance) => {
        const entryDate = entry.date;
        const subject = entry.subject;

        if (!groupedData[entryDate]) groupedData[entryDate] = {};
        if (!groupedData[entryDate][subject]) groupedData[entryDate][subject] = [];
        
        groupedData[entryDate][subject].push(entry);
      });
      
      setGroupedByDate(groupedData);
    }
    setLoading(false);
  };

  const deleteDateGroup = async (date: string) => {
    const confirmed = window.confirm(`Delete all attendance records for ${date}?`);
    if (!confirmed) return;

    setDeleting(date);
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('class', selectedClass)
      .eq('date', date);

    if (error) {
      console.error('Delete error:', error.message);
      alert('❌ Failed to delete attendance records.');
    } else {
      alert('🗑️ Attendance records deleted.');
      fetchAttendance(selectedClass);
    }
    setDeleting(null);
  };

  const getStudentStatus = (date: string, subject: string, student: string) => {
    const subjectData = groupedByDate[date]?.[subject];
    if (!subjectData) return null;
    
    const studentRecord = subjectData.find(record => record.student === student);
    return studentRecord?.status || null;
  };

  const getAllStudents = () => {
    const allStudents = new Set<string>();
    Object.values(groupedByDate).forEach(dateData => {
      Object.values(dateData).forEach(subjectData => {
        subjectData.forEach(record => {
          allStudents.add(record.student);
        });
      });
    });
    return Array.from(allStudents).sort((a, b) => {
      const aRecord = Object.values(groupedByDate)[0]?.[Object.keys(Object.values(groupedByDate)[0] || {})[0]]?.find(r => r.student === a);
      const bRecord = Object.values(groupedByDate)[0]?.[Object.keys(Object.values(groupedByDate)[0] || {})[0]]?.find(r => r.student === b);
      return (aRecord?.roll_no || 0) - (bRecord?.roll_no || 0);
    });
  };

  const getAllSubjects = () => {
    const allSubjects = new Set<string>();
    Object.values(groupedByDate).forEach(dateData => {
      Object.keys(dateData).forEach(subject => {
        allSubjects.add(subject);
      });
    });
    return Array.from(allSubjects);
  };

  // Helper to get all students for a date
  const getStudentsForDate = (dateData: { [subject: string]: Attendance[] }) => {
    const all = new Map<string, Attendance>();
    Object.values(dateData).forEach(subjectData => {
      subjectData.forEach(record => {
        if (!all.has(record.student)) {
          all.set(record.student, record);
        }
      });
    });
    // Sort by roll_no
    return Array.from(all.values()).sort((a, b) => (a.roll_no || 0) - (b.roll_no || 0));
  };

  // Helper to get all subjects for a date
  const getSubjectsForDate = (dateData: { [subject: string]: Attendance[] }) => {
    return Object.keys(dateData);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/attendance.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">📊 Attendance History</h1>
                <p className="text-green-100 text-xs sm:text-sm">View and manage student attendance records</p>
              </div>
            </div>
            <div className="self-end sm:self-auto">
              <button
                onClick={() => router.push('/admin/attendance')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                title="Back to Attendance"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Class Selection */}
        <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <div className="space-y-1 sm:space-y-2">
            <label className="block font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">🏫 Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-black text-sm sm:text-base"
            >
              <option value="">-- Select a Class --</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl p-4 sm:p-8 shadow-lg border border-white/20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading attendance data...</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && Object.keys(groupedByDate).length === 0 && selectedClass && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Attendance Records</h3>
            <p className="text-gray-600">No attendance records available for <strong>{selectedClass}</strong>.</p>
          </div>
        )}

        {/* Select Class Prompt */}
        {!loading && !selectedClass && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Class</h3>
            <p className="text-gray-600">Choose a class from the dropdown above to view its attendance records.</p>
          </div>
        )}

        {/* Attendance Data */}
        {!loading && Object.keys(groupedByDate).length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, subjectsData]) => {
              const students = getStudentsForDate(subjectsData);
              const subjects = getSubjectsForDate(subjectsData);
          return (
                <div key={date} className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">📅</div>
                        <div>
                          <h2 className="text-xl font-bold">{new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}</h2>
                          <p className="text-blue-100 text-sm">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} • {students.length} student{students.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                <button
                  onClick={() => deleteDateGroup(date)}
                        disabled={deleting === date}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                        {deleting === date ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <span>🗑️</span>
                            <span>Delete</span>
                          </>
                        )}
                </button>
              </div>
                  </div>
                  {/* Single Table for all subjects */}
                  <div className="p-6">
              <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Roll No</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Name</th>
                            {subjects.map(subject => (
                              <th key={subject} className="text-center py-3 px-4 font-semibold text-gray-700">{subject}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='shadow-lg border border-white/20'>
                          {students.map((student, index) => (
                            <tr key={student.id} className={"border-b border-gray-100 "}>
                              <td className="py-3 px-4 text-gray-700 font-medium">{student.roll_no || '-'}</td>
                              <td className="py-3 px-4 text-gray-800">{student.student}</td>
                              {subjects.map(subject => {
                                const record = subjectsData[subject]?.find(r => r.student === student.student);
                                const status = record?.status || 'Not Marked';
                      return (
                                  <td key={subject} className="py-3 px-4 text-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      status === 'Present'
                                        ? 'bg-green-100 text-green-800'
                                        : status === 'Absent'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {status}
                                    </span>
                              </td>
                            );
                          })}
                        </tr>
                          ))}
                  </tbody>
                </table>
                    </div>
              </div>
            </div>
          );
            })}
          </div>
      )}
      </div>
    </div>
  );
}
