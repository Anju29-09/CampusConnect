'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Calendar, Clock, BookOpen, Save, Eye, Edit, Plus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type TimetableEntry = {
  id?: string;
  class: string;
  day: string;
  period: number;
  subject: string;
  time?: string;
  date: string;
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminTimetablePage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [selectedClass, setSelectedClass] = useState('');
  const [classList, setClassList] = useState<string[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [maxPeriods, setMaxPeriods] = useState(7);
  const [date, setDate] = useState('');
  const [viewMode, setViewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('students_list').select('class');
      if (error) return console.error('Error fetching classes:', error.message);
      const uniqueClasses = Array.from(new Set(data.map((row: any) => row.class)));
      setClassList(uniqueClasses);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const fetchTimetable = async () => {
      const { data, error } = await supabase.from('timetable').select('*').eq('class', selectedClass);
      if (error) return console.error('Error fetching timetable:', error.message);
      setTimetable(data || []);
      const max = Math.max(...(data || []).map((e) => e.period), 7);
      setMaxPeriods(max);
    };
    fetchTimetable();
  }, [selectedClass]);

  const handleCellChange = async (day: string, period: number, field: 'subject' | 'time', value: string) => {
    if (!selectedClass || !date) return;
    const existing = timetable.find((e) => e.class === selectedClass && e.day === day && e.period === period && e.date === date);
    if (existing) {
      const updated = { ...existing, [field]: value };
      setTimetable((prev) => prev.map((e) => (e.day === day && e.period === period && e.date === date ? updated : e)));
    } else {
      const subject = field === 'subject' ? value : '';
      const time = field === 'time' ? value : '';
      const newEntry: TimetableEntry = {
        class: selectedClass,
        day,
        period,
        subject,
        time,
        date,
      };
      setTimetable((prev) => [...prev, newEntry]);
    }
  };

  const saveTimetable = async () => {
    if (!selectedClass || timetable.length === 0 || !date) {
      alert('Please select a class and date, and fill in the timetable.');
      return;
    }
    setSaving(true);
    try {
    for (const entry of timetable) {
      if (entry.id) {
          await supabase.from('timetable').update({ subject: entry.subject, time: entry.time, date }).eq('id', entry.id);
      } else {
        await supabase.from('timetable').insert([{ ...entry, date }]);
      }
    }
    alert('Timetable saved successfully!');
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Error saving timetable. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this entry?');
    if (!confirmed) return;
    const { error } = await supabase.from('timetable').delete().eq('id', id);
    if (error) {
      alert('Error deleting entry.');
      console.error(error);
      return;
    }
    setTimetable((prev) => prev.filter((entry) => entry.id !== id));
  };

  const renderCell = (day: string, period: number) => {
    const entry = timetable.find((e) => e.day === day && e.period === period);
    if (viewMode) {
      return (
        <div className="text-gray-800 text-xs whitespace-pre-line p-2 min-h-[80px] relative">
          <div className="font-medium text-gray-900">{entry?.subject || '—'}</div>
          {entry?.time && (
            <div className="text-gray-500 text-xs mt-1 flex items-center justify-center">
              <Clock className="w-3 h-3 mr-1" />
              {entry.time}
            </div>
          )}
          {entry?.id && (
            <button
              onClick={() => deleteEntry(entry.id!)}
              className="absolute top-1 right-1 text-red-500 hover:text-red-700 transition-colors"
              title="Delete Entry"
            >
              ✕
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 p-2 min-h-[80px]">
        <input
          type="text"
          placeholder="Subject"
          value={entry?.subject || ''}
          onChange={(e) => handleCellChange(day, period, 'subject', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-gray-800 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs"
        />
        <input
          type="text"
          placeholder="Time"
          value={entry?.time || ''}
          onChange={(e) => handleCellChange(day, period, 'time', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-gray-800 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/timetable.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📅 Timetable Management</h1>
                <p className="text-orange-100 text-sm">Create and manage class schedules</p>
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
      {!viewMode && (
          <div className="rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700 mb-2">🏫 Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-black"
        >
          <option value="">Select Class</option>
          {classList.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
              </div>
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700 mb-2">📅 Date</label>
                <div className="flex gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-black"
                  />
                  <button
                    onClick={() => router.push('/admin/timetable/view')}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            </div>
      </div>
      )}

        {/* Timetable Section */}
      {selectedClass && (
          <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {/* Timetable Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-bold">Class: {selectedClass}</h2>
                    <p className="text-orange-100 text-sm">
                      {date ? `Date: ${date}` : 'Select a date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {!viewMode && (
                    <button
                      onClick={() => setMaxPeriods((prev) => prev + 1)}
                      className="flex items-center space-x-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Period</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Timetable Table */}
            <div className="overflow-auto">
              <table className="w-full border-collapse text-center">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                <tr>
                    <th className="border-b border-gray-300 p-4 font-semibold text-gray-700 w-24">
                      <div className="flex items-center justify-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-gray-700">Days</span>
                      </div>
                    </th>
                  {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((p) => (
                      <th key={p} className="border-b border-gray-300 p-4 font-semibold text-gray-700 w-32">
                        <div className="flex items-center justify-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Period {p}</span>
                        </div>
                      </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {days.map((day, index) => (
                    <tr key={day} className={"border-b border-gray-100"}>
                      <td className="border-r border-gray-200 p-4 font-semibold text-gray-800">
                        {day}
                      </td>
                    {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((period) => (
                        <td key={period} className="border-r border-gray-200 align-top p-0">
                          {renderCell(day, period)}
                        </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {/* Action Buttons */}
            {!viewMode && (
              <div className="p-6 border-t border-gray-200">
            <button
                  onClick={saveTimetable}
                  disabled={saving}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Save Timetable'}</span>
            </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedClass && (
          <div className="rounded-2xl p-8 shadow-lg border border-white/20 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Class</h3>
            <p className="text-gray-600">Choose a class from the dropdown above to start managing the timetable.</p>
          </div>
      )}
      </div>
    </div>
  );
}
