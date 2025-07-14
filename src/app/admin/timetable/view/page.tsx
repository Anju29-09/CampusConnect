'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Trash2, Calendar, Clock, BookOpen, ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';

type TimetableEntry = {
  id: string;
  class: string;
  day: string;
  period: number;
  subject: string;
  time: string | null;
  created_at: string;
  date: string;
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ViewTimetablePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [grouped, setGrouped] = useState<{ [date: string]: TimetableEntry[] }>({});
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchTimetable();
  }, [selectedClass]);

  const fetchClasses = async () => {
    const { data, error } = await supabase.from('students_list').select('class');
    if (error) return console.error('Error loading classes:', error.message);
    const unique = Array.from(new Set(data.map((e) => e.class)));
    setClassList(unique);
  };

  const fetchTimetable = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timetable')
      .select('*')
      .eq('class', selectedClass)
      .order('created_at', { ascending: false });

    if (error) return console.error('Error loading timetable:', error.message);

    setTimetables(data || []);
    const grouped = (data || []).reduce((acc, e) => {
      const date = e.date;
      acc[date] ||= [];
      acc[date].push(e);
      return acc;
    }, {} as { [key: string]: TimetableEntry[] });
    setGrouped(grouped);
    setLoading(false);
  };

  const deleteGroup = async (date: string) => {
    if (!confirm(`Are you sure you want to delete the timetable for ${selectedClass} created on ${date}? This action cannot be undone.`)) return;
    
    setDeleting(date);
    const ids = grouped[date].map((e) => e.id);
    const { error } = await supabase.from('timetable').delete().in('id', ids);
    
    if (error) {
      console.error('Error deleting:', error.message);
      alert('Failed to delete timetable. Please try again.');
    } else {
      alert('Timetable deleted successfully!');
      fetchTimetable();
    }
    
    setDeleting(null);
  };

  const renderTimetableTable = (entries: TimetableEntry[]) => {
    const maxPeriods = Math.max(...entries.map((e) => e.period));
    
    return (
      <div className="overflow-auto rounded-xl border border-gray-200">
        <table className="w-full text-center">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              <th className="p-4 font-semibold">
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Days</span>
                </div>
              </th>
              {Array.from({ length: maxPeriods }, (_, i) => (
                <th key={i + 1} className="p-4 font-semibold">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Period {i + 1}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, index) => (
              <tr key={day} className="border-b border-gray-100">
                <td className="p-4 font-semibold text-gray-800">
                  {day}
                </td>
                {Array.from({ length: maxPeriods }, (_, i) => {
                  const entry = entries.find((e) => e.day === day && e.period === i + 1);
                  return (
                    <td key={i} className="p-4 border-r border-gray-200">
                      {entry ? (
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {entry.subject}
                          </div>
                          {entry.time && (
                            <div className="text-gray-500 text-xs flex items-center justify-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{entry.time}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/timetable.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📅 View Timetables</h1>
                <p className="text-blue-100 text-sm">Browse and manage saved class schedules</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/timetable')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              title="Back to Timetable Management"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Class Selection */}
        <div className="rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700 mb-2">🏫 Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
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
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading timetables...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && selectedClass && Object.keys(grouped).length === 0 && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Timetables Found</h3>
            <p className="text-gray-600 mb-6">No timetables have been created for <strong>{selectedClass}</strong> yet.</p>
            <button
              onClick={() => router.push('/admin/timetable')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create First Timetable
            </button>
          </div>
        )}

        {/* Timetables Display */}
        {!loading && selectedClass && Object.keys(grouped).length > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date} className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                {/* Date Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Timetable for {selectedClass}</h2>
                        <p className="text-green-100 text-sm">
                          Created on {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-green-100 text-sm">
                          {entries.length} entries • {Math.max(...entries.map(e => e.period))} periods
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGroup(date)}
                      disabled={deleting === date}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      title={`Delete timetable created on ${date}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{deleting === date ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* Timetable Table */}
                <div className="p-6">
                  {renderTimetableTable(entries)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Initial State */}
        {!selectedClass && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Class</h3>
            <p className="text-gray-600">Choose a class from the dropdown above to view its timetables.</p>
          </div>
        )}
      </div>
    </div>
  );
}
