'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { BookOpen, Users, GraduationCap, Calendar, TrendingUp, Award, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Result = {
  id: string;
  full_name: string;
  class: string;
  subject: string;
  marks: number | string | null;
  date: string;
  exam_type?: string;
  file_url?: string;
};

export default function StudentResultsPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  const [classList, setClassList] = useState<string[]>([]);
  const [studentList, setStudentList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch distinct class list
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from('students_list')
        .select('class')
        .neq('class', '');

      if (error) {
        console.error('Error fetching classes:', error.message);
        return;
      }

      const uniqueClasses = Array.from(new Set(data.map((r: any) => r.class)));
      setClassList(uniqueClasses);
    };

    fetchClasses();
  }, []);

  // Fetch students based on selected class
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;

      const { data, error } = await supabase
        .from('students_list')
        .select('full_name')
        .eq('class', selectedClass);

      if (error) {
        console.error('Error fetching students:', error.message);
        return;
      }

      const names = data.map((r: any) => r.full_name);
      setStudentList(names);
    };

    fetchStudents();
  }, [selectedClass]);

  const fetchResults = async () => {
    if (!selectedClass || !selectedStudent) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('results_matrix')
      .select('*')
      .eq('class', selectedClass)
      .eq('full_name', selectedStudent);

    if (error) {
      console.error('Error fetching results:', error.message);
      setResults([]);
    } else {
      setResults(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedClass && selectedStudent) {
      fetchResults();
    }
  }, [selectedClass, selectedStudent]);

  const totalMarks = results.reduce((sum, r) => {
    const mark = typeof r.marks === 'string' ? parseFloat(r.marks) : Number(r.marks);
    return sum + (isNaN(mark) ? 0 : mark);
  }, 0);
  const averageMarks = results.length > 0 ? (isNaN(totalMarks / results.length) ? '0.0' : (totalMarks / results.length).toFixed(1)) : '0.0';
  const maxMarks = results.length > 0 ? Math.max(...results.map(r => {
    const mark = typeof r.marks === 'string' ? parseFloat(r.marks) : Number(r.marks);
    return isNaN(mark) ? 0 : mark;
  })) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGrade = (marks: number) => {
    if (marks >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (marks >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (marks >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (marks >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (marks >= 50) return { grade: 'C+', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (marks >= 40) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/results.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">🎓 Student Results</h1>
                <p className="text-blue-100 text-xs sm:text-sm">View and analyze academic performance</p>
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

        {/* Selection Form */}
        <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Select Student
            </h2>
            <p className="text-green-100 text-xs sm:text-sm mt-1">Choose a class and student to view their results</p>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Class
                </label>
                <select
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800 text-xs sm:text-sm"
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudent('');
                    setResults([]);
                  }}
                >
                  <option value="">-- Select a Class --</option>
                  {classList.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Student
                </label>
                <select
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800 disabled:opacity-50 text-xs sm:text-sm"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">-- Select a Student --</option>
                  <option value="__ALL__">All Students</option>
                  {studentList.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Content */}
        {loading ? (
          <div className="rounded-2xl p-4 sm:p-8 shadow-lg border border-white/20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-xs sm:text-base">Loading results...</p>
          </div>
        ) : selectedStudent && results.length > 0 ? (
          <>
            {/* Performance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Marks</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{!isNaN(Number(totalMarks)) ? Number(totalMarks) : 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Average</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{!isNaN(Number(averageMarks)) ? `${averageMarks}%` : '0%'}</p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Subjects</p>
                    <p className="text-2xl font-bold text-gray-800">{results.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Academic Results
                </h2>
                <p className="text-purple-100 text-sm mt-1">Detailed performance breakdown by subject</p>
              </div>

              {/* Table Content */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Subject</th>
                        <th className="text-center py-4 px-6 font-semibold text-gray-700">Marks</th>
                        <th className="text-center py-4 px-6 font-semibold text-gray-700">Exam Type</th>
                        <th className="text-center py-4 px-6 font-semibold text-gray-700">File</th>
                        <th className="text-center py-4 px-6 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {results.map((result) => {
                        return (
                          <tr key={result.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="py-4 px-6 text-gray-800 font-medium">{result.subject}</td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                                {(() => {
                                  const mark = typeof result.marks === 'string' ? parseFloat(result.marks) : Number(result.marks);
                                  return isNaN(mark) ? 0 : mark;
                                })()}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center text-gray-600">
                              {result.exam_type || <span className="text-gray-400 italic">N/A</span>}
                            </td>
                            <td className="py-4 px-6 text-center">
                              {result.file_url ? (
                                <a
                                  href={result.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200"
                                >
                                  View File
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">No File</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center text-gray-600">
                              <div className="flex items-center justify-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(result.date)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="font-semibold">
                        <td className="py-4 px-6 text-gray-800 text-right">Total</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                            {!isNaN(Number(totalMarks)) ? Number(totalMarks) : 0}
                          </span>
                        </td>
                        <td className="py-4 px-6"></td>
                        <td className="py-4 px-6"></td>
                        <td className="py-4 px-6"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : selectedStudent ? (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Results Found</h3>
            <p className="text-gray-600">No results available for <strong>{selectedStudent}</strong> yet.</p>
          </div>
        ) : selectedClass ? (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Student</h3>
            <p className="text-gray-600">Choose a student from the dropdown above to view their results.</p>
          </div>
        ) : (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Results Portal</h3>
            <p className="text-gray-600">Select a class and student to view their academic results.</p>
          </div>
        )}
      </div>
    </div>
  );
}
