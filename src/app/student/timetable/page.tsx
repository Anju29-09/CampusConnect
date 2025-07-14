'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Calendar, Clock, BookOpen, ArrowLeft, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';

type TimetableEntry = {
  id: string;
  class: string;
  day: string;
  period: number;
  subject: string;
  time?: string;
  date: string;
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentTimetablePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState('');
  const [classList, setClassList] = useState<string[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [maxPeriods, setMaxPeriods] = useState(7);
  const [loading, setLoading] = useState(false);
  const [timetableDate, setTimetableDate] = useState<string>('');

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from('students_list')
        .select('class');

      if (error) return console.error('Error fetching classes:', error.message);

      const uniqueClasses = Array.from(new Set(data.map((row: any) => row.class)));
      setClassList(uniqueClasses);
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchTimetable = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .eq('class', selectedClass);

      if (error) return console.error('Error fetching timetable:', error.message);

      setTimetable(data || []);
      const max = Math.max(...(data || []).map((e) => e.period), 7);
      setMaxPeriods(max);
      
      // Extract date from the first entry if available
      if (data && data.length > 0 && data[0].date) {
        setTimetableDate(data[0].date);
      } else {
        setTimetableDate('');
      }
      
      setLoading(false);
    };

    fetchTimetable();
  }, [selectedClass]);

  const renderCell = (day: string, period: number) => {
    const entry = timetable.find((e) => e.day === day && e.period === period);

    if (!entry) return null;

    return (
      <div className="p-1 sm:p-2 text-center">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-1 sm:p-3 border border-blue-200 hover:shadow-md transition-all duration-200">
          <div className="font-semibold text-blue-800 text-xs sm:text-sm mb-0.5 sm:mb-1">{entry.subject}</div>
          {entry.time && (
            <div className="flex items-center justify-center text-xs text-blue-600">
              <Clock className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
              <span className="text-[10px] sm:text-xs">{entry.time}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getDayColor = (day: string) => {
    const colors = {
      'Monday': 'from-red-500 to-pink-500',
      'Tuesday': 'from-orange-500 to-red-500',
      'Wednesday': 'from-yellow-500 to-orange-500',
      'Thursday': 'from-green-500 to-emerald-500',
      'Friday': 'from-blue-500 to-indigo-500',
      'Saturday': 'from-purple-500 to-pink-500'
    };
    return colors[day as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getSubjectColor = (subject: string) => {
    const colors = [
      'from-blue-500 to-indigo-500',
      'from-green-500 to-emerald-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-teal-500 to-cyan-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-emerald-500 to-teal-500'
    ];
    const index = subject.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getTimetableStats = () => {
    const totalSubjects = new Set(timetable.map(entry => entry.subject)).size;
    const totalPeriods = timetable.length;
    const daysWithClasses = new Set(timetable.map(entry => entry.day)).size;
    return { totalSubjects, totalPeriods, daysWithClasses };
  };

  const stats = getTimetableStats();

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/timetable.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">📚 Class Timetable</h1>
                <p className="text-blue-100 text-xs sm:text-sm">View your daily class schedule</p>
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
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700 mb-1 sm:mb-2 flex items-center text-sm sm:text-base">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Select Your Class
            </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 text-sm sm:text-base"
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

        {/* Timetable Content */}
        {loading ? (
          <div className="rounded-2xl p-4 sm:p-8 shadow-lg border border-white/20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading timetable...</p>
          </div>
        ) : selectedClass && timetable.length > 0 ? (
          <>
            {/* Timetable Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Subjects</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalSubjects}</p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Periods</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalPeriods}</p>
                  </div>
                </div>
      </div>

              <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Active Days</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.daysWithClasses}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timetable Table */}
            <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Weekly Schedule - {selectedClass}
                </h2>
                <p className="text-purple-100 text-xs sm:text-sm mt-1">Your complete class timetable for the week</p>
                {timetableDate && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <p className="text-white text-xs sm:text-sm font-medium flex items-center">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Timetable Created: {new Date(timetableDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Table Content */}
              <div className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b-2 border-r-2 border-gray-200 p-3 bg-gray-50 text-left text-gray-600 font-semibold text-xs sm:text-sm">Days / Periods</th>
                        {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((period) => (
                          <th key={period} className="border-b-2 border-r-2 border-gray-200 p-2 sm:p-3 bg-gray-50 text-center text-gray-600 font-semibold text-xs sm:text-sm">
                            Period {period}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day) => (
                        <tr key={day}>
                          <td className={`border-b-2 border-r-2 border-gray-200 p-2 sm:p-3 text-xs sm:text-sm font-semibold bg-gradient-to-r ${getDayColor(day)} text-white`}>
                            {day}
                          </td>
                          {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((period) => (
                            <td key={`${day}-${period}`} className="border-b-2 border-r-2 border-gray-200 p-0">
                              {renderCell(day, period)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* No Timetable Data Message */}
                {timetable.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm sm:text-base">No timetable entries available.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : selectedClass ? (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Timetable Found</h3>
            <p className="text-gray-600">No timetable available for <strong>{selectedClass}</strong> yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Timetable Portal</h3>
            <p className="text-gray-600">Select your class to view your weekly timetable.</p>
        </div>
      )}
      </div>
    </div>
  );
}
