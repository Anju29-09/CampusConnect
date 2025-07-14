'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Upload, FileText, Download } from 'lucide-react';
import { isSessionValid, getUserRole, clearSession } from '../../../utils/sessionUtils';

type Student = {
  id: string;
  full_name: string;
  class: string;
};

type FeeInput = {
  total: string;
  paid: string;
  due: string;
  file?: File | null;
  fileURL?: string;
};

export default function OfficeFeesPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [year, setYear] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [feeInputs, setFeeInputs] = useState<{ [studentId: string]: FeeInput }>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

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

  // Fetch students for selected class
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setFeeInputs({});
      return;
    }

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('students_list')
        .select('id, full_name, class')
        .eq('class', selectedClass);
      if (!error && data) {
        setStudents(data);
        // Initialize feeInputs for new students
        const newInputs: { [studentId: string]: FeeInput } = {};
        data.forEach((student: Student) => {
          newInputs[student.id] = feeInputs[student.id] || { total: '', paid: '', due: '' };
        });
        setFeeInputs(newInputs);
      }
    };
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const handleFeeChange = (studentId: string, field: 'total' | 'paid', value: string) => {
    setFeeInputs((prev) => {
      const prevPaid = field === 'paid' ? value : prev[studentId]?.paid || '';
      const prevTotal = field === 'total' ? value : prev[studentId]?.total || '';
      // Calculate due
      const due = (Number(prevTotal) || 0) - (Number(prevPaid) || 0);
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [field]: value,
          due: due.toString(),
        },
      };
    });
  };

  const handleFileChange = (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFeeInputs((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          file: e.target.files![0],
        },
      }));
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

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    // Save each student's data with their individual file
    for (const student of students) {
      const feeData = feeInputs[student.id];
      if (!feeData) continue;

      const { total, paid, due, file } = feeData;
      if (total === undefined || paid === undefined) continue;

      let uploadedFileUrl = '';

      // Upload file if selected for this student
      if (file) {
        const filePath = `fees_files/${student.id}_${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('school-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload failed for student:', student.full_name, uploadError.message);
          continue; // Skip this student but continue with others
        }

        const { data: publicUrlData } = supabase.storage
          .from('school-files')
          .getPublicUrl(filePath);

        uploadedFileUrl = publicUrlData?.publicUrl || '';
      }

      // Save to 'fees' table
      await supabase.from('fees').upsert({
        student_id: student.id,
        class: selectedClass,
        year,
        total: Number(total) || 0,
        paid: Number(paid) || 0,
        due: (Number(total) || 0) - (Number(paid) || 0),
        file_url: uploadedFileUrl || null,
      });

      // Update the fileURL in state after successful upload
      if (uploadedFileUrl) {
        setFeeInputs((prev) => ({
          ...prev,
          [student.id]: {
            ...prev[student.id],
            fileURL: uploadedFileUrl,
            file: null, // Clear the file input
          },
        }));
      }
    }

    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only accept positive numbers
    if (value === '' || (Number(value) > 0)) {
      setYear(value);
    }
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
                <h1 className="text-xl sm:text-3xl font-bold">💸 Fee Management</h1>
                <p className="text-yellow-100 text-xs sm:text-sm">Add and manage student fees and payments</p>
              </div>
            </div>
            <div className="self-end sm:self-auto">
              <button
                onClick={() => router.push('/office')}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="space-y-2">
              <label className="block font-semibold text-gray-700 mb-1 sm:mb-2">🏫 Class</label>
              <select
                className="w-full p-2 sm:p-3 border-2 border-amber-300 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur-sm focus:ring-4 focus:ring-amber-400 focus:border-amber-500 focus:outline-none transition-all duration-300 text-black shadow-lg hover:shadow-xl hover:border-amber-400 hover:from-amber-100 hover:to-yellow-100 transform hover:-translate-y-1 text-sm sm:text-base"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classList.map(cls => (
                  <option key={cls} value={cls} className="text-black">{cls}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block font-semibold text-gray-700 mb-1 sm:mb-2">📅 Year</label>
              <input
                className="w-full p-2 sm:p-3 border-2 border-amber-300 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur-sm focus:ring-4 focus:ring-amber-400 focus:border-amber-500 focus:outline-none transition-all duration-300 text-black placeholder-gray-600 shadow-lg hover:shadow-xl hover:border-amber-400 hover:from-amber-100 hover:to-yellow-100 transform hover:-translate-y-1 text-sm sm:text-base"
                type="number"
                placeholder="Year"
                value={year}
                onChange={handleYearChange}
                min="1"
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => router.push('/office/fees/view')}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
              >
                View
              </button>
            </div>
          </div>

          {selectedClass && (
            <>
              {year && (
                <div className="mb-2 text-black font-semibold">Year: {year}</div>
              )}
              <div className="overflow-auto rounded-xl">
                <table className="w-full min-w-[600px] text-center text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
                    <tr>
                      <th className="p-2 sm:p-4 font-semibold">Student Name</th>
                      <th className="p-2 sm:p-4 font-semibold">Total</th>
                      <th className="p-2 sm:p-4 font-semibold">Paid</th>
                      <th className="p-2 sm:p-4 font-semibold">Due</th>
                      <th className="p-2 sm:p-4 font-semibold">File Upload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-yellow-50 transition-colors duration-200">
                        <td className="p-2 sm:p-3 text-left text-gray-800">{student.full_name}</td>
                        <td className="p-2 sm:p-3 text-center text-gray-800">
                          <input
                            type="number"
                            className="w-16 sm:w-24 p-1 sm:p-2 border border-gray-300 rounded-lg text-center text-black placeholder-black bg-white/80 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm"
                            value={feeInputs[student.id]?.total || ''}
                            onChange={e => handleFeeChange(student.id, 'total', e.target.value)}
                          />
                        </td>
                        <td className="p-2 sm:p-3 text-center text-gray-800">
                          <input
                            type="number"
                            className="w-16 sm:w-24 p-1 sm:p-2 border border-gray-300 rounded-lg text-center text-black placeholder-black bg-white/80 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm"
                            value={feeInputs[student.id]?.paid || ''}
                            onChange={e => handleFeeChange(student.id, 'paid', e.target.value)}
                          />
                        </td>
                        <td className="p-2 sm:p-3 text-center text-gray-800">
                          <input
                            type="number"
                            className="w-16 sm:w-24 p-1 sm:p-2 border border-gray-300 rounded-lg text-center text-black placeholder-black bg-gray-100 text-xs sm:text-sm"
                            value={
                              (Number(feeInputs[student.id]?.total || 0) - Number(feeInputs[student.id]?.paid || 0)) || 0
                            }
                            readOnly
                          />
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            {/* File Upload Input */}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.csv,.xlsx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(student.id, e)}
                              className="block w-full text-xs text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                            />
                            
                            {/* Show uploaded file info */}
                            {feeInputs[student.id]?.file && (
                              <div className="flex items-center space-x-1 text-xs text-green-600">
                                <Upload size={12} />
                                <span>{feeInputs[student.id]?.file?.name}</span>
                              </div>
                            )}
                            
                            {/* Show existing file */}
                            {feeInputs[student.id]?.fileURL && (
                              <div className="flex items-center space-x-1 text-xs">
                                <span className="text-lg" title={getFileExtension(feeInputs[student.id]?.fileURL || '')}>
                                  {getFileIcon(feeInputs[student.id]?.fileURL || '')}
                                </span>
                                <a
                                  href={feeInputs[student.id]?.fileURL}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View File"
                                >
                                  <FileText size={12} />
                                </a>
                              </div>
                            )}
                          </div>
                    </td>
                  </tr>
                ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-2 sm:p-3 text-center text-gray-500 text-xs sm:text-sm">No students found for this class.</td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                {success && (
                  <div className="text-green-600 mt-2 font-medium">Saved successfully!</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 