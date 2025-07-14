'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Calendar, Users, BookOpen, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Attendance = {
  id: string;
  date: string;
  status: string;
  student: string;
  subject: string;
  roll_no: number;
  class: string;
};

export default function StudentAttendancePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from('students_list')
        .select('class');

      if (error) {
        console.error('Error fetching classes:', error.message);
        return;
      }

      const unique = Array.from(new Set(data.map((d) => d.class?.trim())));
      setClassList(unique.filter(Boolean));
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedClass) return;

      setLoading(true);

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .ilike('class', selectedClass.trim()) // case-insensitive match
        .order('date', { ascending: false })
        .order('roll_no', { ascending: true });

      if (error) {
        console.error('Error fetching attendance:', error.message);
        setAttendanceRecords([]);
      } else {
        setAttendanceRecords(data || []);
      }

      setLoading(false);
    };

    fetchAttendance();
  }, [selectedClass]);

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/attendance.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">📘 Class Attendance</h1>
                <p className="text-blue-100 text-xs sm:text-sm">View attendance records for all classes</p>
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
        <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <div className="space-y-1 sm:space-y-2">
            <label className="block font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">🏫 Select Class</label>
            <select
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black text-sm sm:text-base"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl p-4 sm:p-8 shadow-lg border border-white/20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading attendance records...</p>
          </div>
        )}

        {/* Attendance Records */}
        {!loading && selectedClass && attendanceRecords.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {Array.from(
              attendanceRecords.reduce((map, entry) => {
                if (!map.has(entry.date)) map.set(entry.date, []);
                map.get(entry.date)!.push(entry);
                return map;
              }, new Map<string, Attendance[]>())
            ).map(([date, records]) => {
              const subjects = Array.from(new Set(records.map(r => r.subject))).sort();
              const students = Array.from(
                records.reduce((map, r) => {
                  const key = `${r.roll_no}-${r.student}`;
                  if (!map.has(key)) {
                    map.set(key, {
                      roll_no: r.roll_no,
                      student: r.student,
                      statuses: {} as Record<string, string>
                    });
                  }
                  map.get(key)!.statuses[r.subject] = r.status;
                  return map;
                }, new Map<string, {roll_no: number, student: string, statuses: Record<string, string>}>())
              ).map(([key, value]) => value).sort((a, b) => a.roll_no - b.roll_no);

              return (
                <div key={date} className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold">Attendance for {selectedClass}</h2>
                        <p className="text-green-100 text-xs sm:text-sm">
                          Date: {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-green-100 text-xs sm:text-sm">
                          {students.length} students • {subjects.length} subjects
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <div className="p-4 sm:p-6">
                    <div className="overflow-auto rounded-xl border border-gray-200">
                      <table className="w-full text-center">
                        <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                          <tr>
                            <th className="p-3 sm:p-4 font-semibold text-gray-700 border-b border-gray-300">
                              <div className="flex items-center justify-center space-x-2">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm">Roll No</span>
                              </div>
                            </th>
                            <th className="p-3 sm:p-4 font-semibold text-gray-700 border-b border-gray-300 text-xs sm:text-sm">Student Name</th>
                            {subjects.map(subject => (
                              <th key={subject} className="p-3 sm:p-4 font-semibold text-gray-700 border-b border-gray-300">
                                <div className="flex items-center justify-center space-x-2">
                                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="text-xs sm:text-sm">{subject}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(({ roll_no, student, statuses }, index) => (
                            <tr key={`${roll_no}-${student}`} className={"border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"}>
                              <td className="p-3 sm:p-4 font-semibold text-gray-800 text-xs sm:text-sm">
                                {roll_no}
                              </td>
                              <td className="p-3 sm:p-4 font-medium text-gray-800 text-xs sm:text-sm">{student}</td>
                              {subjects.map(subject => (
                                <td key={subject} className="p-2 sm:p-4 text-xs sm:text-sm">
                                  <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                                    statuses[subject] === 'present'
                                      ? 'bg-green-100 text-green-800' 
                                      : statuses[subject] === 'absent'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {statuses[subject] === 'present' 
                                      ? 'Present' 
                                      : statuses[subject] === 'absent'
                                        ? 'Absent'
                                        : 'N/A'}
                                  </span>
                                </td>
                              ))}
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

        {/* Empty States */}
        {!loading && (
          <>
            {!selectedClass ? (
              <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Class</h3>
                <p className="text-gray-600">Choose a class from the dropdown above to view attendance records.</p>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Attendance Records</h3>
                <p className="text-gray-600">No attendance records found for <strong>{selectedClass}</strong>.</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
