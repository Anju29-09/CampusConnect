'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BookOpen, Plus, Save, Eye, ArrowLeft } from 'lucide-react';
import { isSessionValid, getUserRole, hasPermission, clearSession } from '../../../utils/sessionUtils';

export default function AdminResultsEntryPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [date, setDate] = useState('');
  const [classList, setClassList] = useState<string[]>([]);
  const [studentList, setStudentList] = useState<{ full_name: string; class: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subjects, setSubjects] = useState([{ subject: '', marks: '' }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [examType, setExamType] = useState('');

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

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('students_list')
        .select('full_name, class');

      if (error) {
        console.error('Error fetching students:', error.message);
        return;
      }

      setStudentList(data || []);
      const classes = [...new Set((data || []).map((s) => s.class))];
      setClassList(classes);
    };

    fetchStudents();
  }, [router]);

  const handleAddSubject = () => {
    setSubjects([...subjects, { subject: '', marks: '' }]);
  };

  const handleSubjectChange = (index: number, key: 'subject' | 'marks', value: string) => {
    const updated = [...subjects];
    updated[index][key] = value;
    setSubjects(updated);
  };

  const getTotalMarks = () => {
    return subjects.reduce((sum, entry) => sum + Number(entry.marks || 0), 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const saveResults = async () => {
    if (!date || !selectedClass || !selectedStudent || subjects.length === 0) {
      alert('Please fill in all required fields.');
      return;
    }

    // Check if user has permission to insert
    if (!hasPermission('insert')) {
      alert('You do not have permission to add results.');
      return;
    }

    setSaving(true);
    let uploadedFileUrl = '';

    if (selectedFile) {
      try {
      const filePath = `results_files/${Date.now()}_${selectedFile.name}`;
        
        // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
          .from('school-files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('File upload failed:', uploadError.message);
          alert(`File upload failed: ${uploadError.message}`);
        setSaving(false);
        return;
      }

        // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('school-files')
        .getPublicUrl(filePath);

      uploadedFileUrl = publicUrlData?.publicUrl || '';
      setFileURL(uploadedFileUrl);
        
        console.log('File uploaded successfully:', uploadedFileUrl);
      } catch (error) {
        console.error('File upload error:', error);
        alert('File upload failed. Please try again.');
        setSaving(false);
        return;
      }
    }

    const records = subjects.map((entry) => ({
      class: selectedClass,
      full_name: selectedStudent,
      subject: entry.subject,
      marks: entry.marks,
      date: date,
      file_url: uploadedFileUrl || null,
      exam_type: examType,
    }));

    const { error } = await supabase.from('results_matrix').upsert(records, {
      onConflict: 'full_name,subject,date',
    });

    if (error) {
      console.error('Error saving results:', error.message);
      alert('Error saving results');
    } else {
      alert('Results saved successfully!');
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/results.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">📝 Enter Student Results</h1>
                <p className="text-purple-100 text-xs sm:text-sm">Add and manage student academic performance</p>
              </div>
            </div>
            <div className="self-end sm:self-auto">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl shadow-lg border border-white/20 p-4 sm:p-8 text-black">
          {/* Form Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="space-y-1 sm:space-y-2">
              <label className="block font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">📅 Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="block font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">🏫 Class</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStudent('');
                }}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-black text-sm sm:text-base"
              >
                <option value="">Select Class</option>
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="block font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">👤 Student Name</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-black text-sm sm:text-base"
                disabled={!selectedClass}
              >
                <option value="">Select Student</option>
                <option value="__ALL__">All Students</option>
                {studentList
                  .filter((s) => s.class === selectedClass)
                  .map((s, idx) => (
                    <option key={idx} value={s.full_name}>
                      {s.full_name}
                    </option>
                  ))}
              </select>
              {/* Exam Type Input */}
              <div className="mt-4">
                <label className="block font-semibold text-gray-700 mb-2">📝 Exam Type</label>
                <input
                  type="text"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g. Class Test, Unit Test, Semester, etc."
                />
              </div>
            </div>
          </div>

          {/* Subject Marks */}
          <div className="rounded-2xl p-6 border border-purple-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span>Subject Marks</span>
            </h3>

            <div className="overflow-auto rounded-xl">
              <table className="w-full text-center shadow-lg border border-white/20">
                <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <tr>
                    <th className="p-4 font-semibold">Subject</th>
                    <th className="p-4 font-semibold">Marks</th>
            </tr>
          </thead>
                <tbody>
            {subjects.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <td className="p-3">
                  <input
                    type="text"
                    value={entry.subject}
                    onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter subject name"
                  />
                </td>
                      <td className="p-3">
                  <input
                    type="number"
                    min="0"
                    value={entry.marks}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive numbers or empty string
                      if (value === '' || Number(value) >= 0) {
                        handleSubjectChange(index, 'marks', value);
                      }
                    }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter marks"
                  />
                </td>
              </tr>
            ))}
                  <tr className="font-bold">
                    <td className="p-4 text-gray-700">📊 Total Marks</td>
                    <td className="p-4 text-green-700 text-xl">{getTotalMarks()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAddSubject}
              className="mt-4 flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
      >
              <Plus className="w-4 h-4" />
              <span>Add Another Subject</span>
      </button>
          </div>

          {/* File Upload */}
          <div className="mt-8">
            <label className="block font-semibold text-gray-700 mb-2">📂 Upload Supporting File (Optional)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.csv,.xlsx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {fileURL && (
              <p className="text-green-600 mt-2">
                Uploaded: <a href={fileURL} target="_blank" rel="noreferrer" className="underline">View File</a>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={saveResults}
              disabled={saving}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Results'}</span>
        </button>

        <button
          onClick={() => router.push('/admin/results/view')}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
              <Eye className="w-5 h-5" />
              <span>View Saved Results</span>
        </button>
          </div>
        </div>
      </div>
    </div>
  );
}
