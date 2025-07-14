'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Calendar, Users, BookOpen, Save, Plus, Eye, ArrowLeft, Trash2 } from 'lucide-react';

type Student = {
  id: string;
  full_name: string;
  class: string;
  roll_no: number;
};

export default function AdminAttendancePage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subjects, setSubjects] = useState<string[]>(['']);
  const [attendance, setAttendance] = useState<Record<string, Record<string, 'present' | 'absent' | null>>>({});
  const [saving, setSaving] = useState(false);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('students_list').select('class');
      if (error) return console.error(error.message);
      const unique = Array.from(new Set(data.map((row: any) => row.class)));
      setClassList(unique);
    };
    fetchClasses();
  }, []);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('students_list')
        .select('*')
        .eq('class', selectedClass)
        .order('roll_no', { ascending: true });

      if (error) return console.error(error.message);
      setStudents(data || []);
      const initial: Record<string, Record<string, 'present' | 'absent' | null>> = {};
      data?.forEach((student) => {
        initial[student.id] = {};
        subjects.forEach((subj) => {
          if (subj) initial[student.id][subj] = null;
        });
      });
      setAttendance(initial);
    };
    fetchStudents();
  }, [selectedClass]);

  // Keep attendance state synced when subjects change
  useEffect(() => {
    setAttendance((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((studentId) => {
        subjects.forEach((subj) => {
          if (subj && !(subj in updated[studentId])) {
            updated[studentId][subj] = null;
          }
        });
        // Remove deleted subjects
        Object.keys(updated[studentId]).forEach((subj) => {
          if (!subjects.includes(subj)) {
            delete updated[studentId][subj];
          }
        });
      });
      return updated;
    });
  }, [subjects]);

  const handleStatusChange = (studentId: string, subject: string, status: 'present' | 'absent') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subject]: status,
      },
    }));
  };

  const handleSubjectChange = (index: number, value: string) => {
    setSubjects((prev) => {
      const newSubjects = [...prev];
      newSubjects[index] = value;
      return newSubjects;
    });
  };

  const addSubjectColumn = () => {
    setSubjects((prev) => [...prev, '']);
  };

  const removeSubjectColumn = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAttendance = async () => {
    if (!selectedClass || students.length === 0) {
      alert('Please select a class and ensure students are loaded.');
      return;
    }

    setSaving(true);

    try {
    const records = students.flatMap((student) =>
      subjects
        .filter((subj) => subj.trim() !== '')
        .map((subj) => ({
          student: student.full_name,
          roll_no: student.roll_no,
          class: selectedClass,
          date,
          subject: subj,
          status: attendance[student.id]?.[subj] ?? null,
        }))
    );

    const { error } = await supabase.from('attendance').insert(records);
    if (error) {
      alert('❌ Error saving attendance');
      console.error(error.message);
    } else {
        alert('✅ Attendance saved successfully!');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('❌ Error saving attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/attendance.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📝 Mark Attendance</h1>
                <p className="text-purple-100 text-sm">Track student attendance across subjects</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div className="rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="block font-semibold text-gray-700 mb-2">🏫 Class</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-black"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select class</option>
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-gray-700 mb-2">📅 Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-black"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-gray-700 mb-2">📄 View</label>
              <button
                onClick={() => router.push('/admin/attendance/view')}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Eye className="w-4 h-4" />
                <span>View Records</span>
              </button>
            </div>
          </div>

          {/* Class Info */}
          {selectedClass && students.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center space-x-4">
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">Class: {selectedClass}</h3>
                  <p className="text-gray-600 text-sm">{students.length} students enrolled</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attendance Table */}
        {selectedClass && students.length > 0 && (
          <>
            {/* Add Subject Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={addSubjectColumn}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            </div>

            {/* Attendance Table */}
            <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-center">
                  <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <tr>
                      <th className="p-4 font-semibold">Roll No</th>
                      <th className="p-4 font-semibold">Student Name</th>
                      {subjects.map((subj, index) => (
                        <th key={index} className="p-4 font-semibold min-w-[150px]">
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={subj}
                              onChange={(e) => handleSubjectChange(index, e.target.value)}
                              placeholder="Subject Name"
                              className="w-full px-2 py-1 border border-white/30 rounded text-black text-sm bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                            />
                            <button
                              className="text-xs text-red-200 hover:text-red-100 transition-colors duration-200"
                              onClick={() => removeSubjectColumn(index)}
                              title="Delete Subject"
                            >
                              <Trash2 className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} className="border-b border-gray-100">
                        <td className="p-4 font-semibold text-gray-800">
                          {student.roll_no}
                        </td>
                        <td className="p-4 font-medium text-gray-800">{student.full_name}</td>
                        {subjects.map((subj, idx) => (
                          <td key={idx} className="p-4 border-r border-gray-200">
                            <div className="flex items-center justify-center space-x-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`att-${student.id}-${subj}`}
                                  checked={attendance[student.id]?.[subj] === 'present'}
                                  onChange={() => handleStatusChange(student.id, subj, 'present')}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                                />
                                <span className="text-green-600 font-medium">Present</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`att-${student.id}-${subj}`}
                                  checked={attendance[student.id]?.[subj] === 'absent'}
                                  onChange={() => handleStatusChange(student.id, subj, 'absent')}
                                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                                />
                                <span className="text-red-600 font-medium">Absent</span>
                              </label>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Save Button */}
            <div className="rounded-2xl p-6 shadow-lg border border-white/20 mt-6">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedClass && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Class</h3>
            <p className="text-gray-600">Choose a class from the dropdown above to start marking attendance.</p>
          </div>
        )}
      </div>
    </div>
  );
}
