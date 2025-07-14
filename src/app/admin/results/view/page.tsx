'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Trash2, ArrowLeft, BookOpen, Calendar, Users, Edit, X, Save } from 'lucide-react';
import { isSessionValid, getUserRole, hasPermission, clearSession } from '../../../../utils/sessionUtils';

type Result = {
  id: string;
  full_name: string;
  subject: string;
  marks: string;
  date: string;
  class: string;
  file_url?: string;
  exam_type?: string;
};

export default function ResultsViewPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [grouped, setGrouped] = useState<{ [key: string]: Result[] }>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [studentList, setStudentList] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // Update result state variables
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateResultId, setUpdateResultId] = useState('');
  const [updateMarks, setUpdateMarks] = useState('');
  const [updateStudent, setUpdateStudent] = useState('');
  const [updateSubject, setUpdateSubject] = useState('');
  const [updateDate, setUpdateDate] = useState('');

  // Check session validity on component mount
  useEffect(() => {
    if (!isSessionValid()) {
      clearSession();
      router.push('/');
      return;
    }

    // Check if user has admin permissions
    if (!hasPermission('read')) {
      router.push('/');
      return;
    }

    fetchClasses();
  }, [router]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchResults();
    } else {
      setGrouped({});
      setStudentList([]);
      setSelectedStudent('');
      setLoading(false);
    }
  }, [selectedClass]);

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

  const fetchStudents = async () => {
    if (!selectedClass) return;
    const { data, error } = await supabase
      .from('students_list')
      .select('full_name')
      .eq('class', selectedClass);
    if (error) {
      console.error('Error fetching students:', error.message);
      setStudentList([]);
      return;
    }
    setStudentList(data.map((s: any) => s.full_name));
  };

  const groupResultsByDateAndExamType = (results: Result[]) => {
    const grouped: { [key: string]: Result[] } = {};
    results.forEach((entry) => {
      const key = `${entry.date}||${entry.exam_type || ''}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });
    return grouped;
  };

  const fetchResults = async () => {
    if (!selectedClass) return;
    setLoading(true);
    let query = supabase
      .from('results_matrix')
      .select('*')
      .eq('class', selectedClass.trim())
      .order('full_name', { ascending: true });
    if (selectedStudent) {
      query = query.eq('full_name', selectedStudent);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching results:', error.message);
    } else {
      setGrouped(groupResultsByDateAndExamType(data));
    }
    setLoading(false);
  };

  const deleteResultsByDate = async (date: string) => {
    if (!confirm(`Are you sure you want to delete all results for ${date}? This action cannot be undone.`)) {
      return;
    }

    // Check if user has permission to delete
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete results.');
      return;
    }

    setDeleting(date);
    
    try {
      const { error } = await supabase
        .from('results_matrix')
        .delete()
        .eq('date', date)
        .eq('class', selectedClass);

      if (error) {
        console.error('Error deleting results:', error.message);
        alert('Failed to delete results. Please try again.');
      } else {
        alert('Results deleted successfully!');
        // Refresh the data
        fetchResults();
      }
    } catch (error) {
      console.error('Error deleting results:', error);
      alert('Failed to delete results. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const openUpdateModal = (result: Result) => {
    setUpdateResultId(result.id);
    setUpdateMarks(result.marks);
    setUpdateStudent(result.full_name);
    setUpdateSubject(result.subject);
    setUpdateDate(result.date);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setUpdateResultId('');
    setUpdateMarks('');
    setUpdateStudent('');
    setUpdateSubject('');
    setUpdateDate('');
  };

  const updateResult = async () => {
    if (!updateMarks) {
      alert('Please enter marks.');
      return;
    }

    // Check if user has permission to update
    if (!hasPermission('update')) {
      alert('You do not have permission to update results.');
      return;
    }

    setUpdating(updateResultId);
    
    const { error } = await supabase
      .from('results_matrix')
      .update({
        marks: updateMarks
      })
      .eq('id', updateResultId);

    if (error) {
      console.error('Error updating result:', error.message);
      alert('Failed to update result. Please try again.');
    } else {
      alert('Result updated successfully!');
      closeUpdateModal();
      fetchResults();
    }
    
    setUpdating(null);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/results.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📊 Saved Results Records</h1>
                <p className="text-green-100 text-sm">View and manage all student academic results</p>
              </div>
            </div>
      <button
        onClick={() => router.push('/admin/results')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              title="Back to Results Entry"
      >
              <ArrowLeft className="w-6 h-6" />
      </button>
          </div>
        </div>

        {/* Class & Student Selection */}
        <div className="rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="block font-semibold text-gray-700 mb-2">🏫 Select Class</label>
              <select
                value={selectedClass}
                onChange={e => {
                  setSelectedClass(e.target.value);
                  setSelectedStudent('');
                }}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-black"
              >
                <option value="">-- Select a Class --</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        )}

        {/* Results Content */}
        {!loading && (
          <>
            {!selectedClass ? (
              <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Class</h3>
                <p className="text-gray-600">Choose a class from the dropdown above to view its results.</p>
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Results Found</h3>
                <p className="text-gray-600 mb-6">No results have been saved for <strong>{selectedClass}</strong> yet.</p>
                <button
                  onClick={() => router.push('/admin/results')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Add First Results
                </button>
              </div>
      ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([key, records]) => {
          const [date, examType] = key.split('||');
          const students = Array.from(new Set(records.map((r) => r.full_name)));
          const subjects = Array.from(new Set(records.map((r) => r.subject)));

          const studentClassMap: { [student: string]: string } = {};
          const marksMap: {
            [student: string]: { [subject: string]: string };
          } = {};

          records.forEach((r) => {
            studentClassMap[r.full_name] = r.class;
            if (!marksMap[r.full_name]) marksMap[r.full_name] = {};
            marksMap[r.full_name][r.subject] = r.marks;
          });

          return (
                    <div key={key} className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                      {/* Date Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Results for {selectedClass} - {date}</h2>
                              {examType && (
                                <p className="text-blue-100 text-sm font-semibold mt-1">📝 Exam Type: {examType}</p>
                              )}
                              <p className="text-blue-100 text-sm">
                                {students.length} students • {subjects.length} subjects
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteResultsByDate(date)}
                            disabled={deleting === date}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            title={`Delete all results for ${date}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{deleting === date ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Uploaded File (if any) */}
                      {(() => {
                        const fileRecord = records.find(r => r.file_url);
                        if (!fileRecord) return null;
                        return (
                          <div className="mx-6 mt-4 mb-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-500 rounded-lg">
                                {/* File icon */}
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7v10M17 7v10M7 7h10M7 17h10" /></svg>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Supporting File</p>
                                <p className="font-medium text-gray-800 break-all max-w-xs">
                                  {fileRecord.file_url?.split('/').pop() ?? ''}
                                </p>
                              </div>
                            </div>
                            <a
                              href={fileRecord.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                              <span>View File</span>
                            </a>
                          </div>
                        );
                      })()}

                      {/* Results Table */}
                      <div className="p-6">
                        <div className="overflow-auto rounded-xl">
                          <table className="w-full text-center">
                            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <tr>
                                <th className="p-4 font-semibold text-gray-700 border-b border-gray-300">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Users className="w-4 h-4" />
                                    <span>Student</span>
                                  </div>
                                </th>
                                <th className="p-4 font-semibold text-gray-700 border-b border-gray-300">Class</th>
                      {subjects.map((subject) => (
                                  <th key={subject} className="p-4 font-semibold text-gray-700 border-b border-gray-300">
                                    {subject}
                                  </th>
                      ))}
                    </tr>
                  </thead>
                            <tbody>
                              {students.map((student, index) => (
                                <tr key={student} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200`}>
                                  <td className="p-4 font-medium text-gray-800">{student}</td>
                                  <td className="p-4 text-gray-600">{studentClassMap[student]}</td>
                                  {subjects.map((subject) => {
                                    // Find the result record for this student and subject
                                    const result = records.find(r => r.full_name === student && r.subject === subject);
                                    return (
                                      <td key={subject} className="p-4">
                                        <div className="flex items-center justify-center space-x-2">
                                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                            marksMap[student]?.[subject] 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-gray-100 text-gray-500'
                                          }`}>
                                            {marksMap[student]?.[subject] || '—'}
                                          </span>
                                          {result && (
                                            <button
                                              onClick={() => openUpdateModal(result)}
                                              className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                                              title="Update Mark"
                                            >
                                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </button>
                                          )}
                                        </div>
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
          </>
      )}

        {/* Update Result Modal */}
        {isUpdateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-semibold">Update Result</h3>
                <button 
                  onClick={closeUpdateModal}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <div className="font-medium text-gray-700 mb-1">Student:</div>
                  <div className="text-gray-800">{updateStudent}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium text-gray-700 mb-1">Subject:</div>
                  <div className="text-gray-800">{updateSubject}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium text-gray-700 mb-1">Date:</div>
                  <div className="text-gray-800">{updateDate}</div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter marks"
                    className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800"
                    value={updateMarks}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive numbers or empty string
                      if (value === '' || Number(value) >= 0) {
                        setUpdateMarks(value);
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={updateResult}
                  disabled={updating === updateResultId || !updateMarks}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
                >
                  {updating === updateResultId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
