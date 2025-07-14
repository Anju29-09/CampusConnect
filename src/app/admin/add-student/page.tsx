'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { UserPlus, Users, GraduationCap, Hash, ArrowLeft, Plus, Trash2, Edit, X, Save } from 'lucide-react';
import { isSessionValid, getUserRole, hasPermission, clearSession } from '../../../utils/sessionUtils';

type Student = {
  id: string;
  full_name: string;
  class: string;
  roll_no: number;
};

export default function AdminStudentsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [fullName, setFullName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [rollNo, setRollNo] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [classSearch, setClassSearch] = useState('');
  
  // Update student state variables
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateFullName, setUpdateFullName] = useState('');
  const [updateStudentClass, setUpdateStudentClass] = useState('');
  const [updateRollNo, setUpdateRollNo] = useState<number | ''>('');
  const [updateStudentId, setUpdateStudentId] = useState('');

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

    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('students_list').select('*').order('class').order('roll_no');
    if (error) {
      console.error('Error fetching students:', error.message);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const addStudent = async () => {
    if (!fullName || !studentClass || rollNo === '') {
      alert('Please enter full name, class, and roll number.');
      return;
    }

    // Check if user has permission to insert
    if (!hasPermission('insert')) {
      alert('You do not have permission to add students.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('students_list').insert({
      full_name: fullName,
      class: studentClass,
      roll_no: Number(rollNo),
    });

    if (error) {
      console.error('Error adding student:', error.message);
      alert('Failed to add student. Please try again.');
    } else {
      alert('Student added successfully!');
      setFullName('');
      setStudentClass('');
      setRollNo('');
      fetchStudents();
    }
    setSaving(false);
  };

  const deleteStudent = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this student? This will also delete all associated fee records.');
    if (!confirmed) return;

    // Check if user has permission to delete
    if (!hasPermission('delete')) {
      alert('You do not have permission to delete students.');
      return;
    }

    setDeleting(id);
    
    try {
      // First, delete all fee records associated with this student
      const { error: feesError } = await supabase
        .from('fees')
        .delete()
        .eq('student_id', id);

      if (feesError) {
        console.error('Error deleting fee records:', feesError.message);
        alert('Failed to delete associated fee records. Please try again.');
        setDeleting(null);
        return;
      }

      // Then delete the student
      const { error: studentError } = await supabase
        .from('students_list')
        .delete()
        .eq('id', id);

      if (studentError) {
        console.error('Error deleting student:', studentError.message);
      alert('Failed to delete student. Please try again.');
    } else {
        alert('Student and associated fee records deleted successfully!');
      fetchStudents();
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      alert('An error occurred during deletion. Please try again.');
    }
    
    setDeleting(null);
  };

  const openUpdateModal = (student: Student) => {
    setUpdateStudentId(student.id);
    setUpdateFullName(student.full_name);
    setUpdateStudentClass(student.class);
    setUpdateRollNo(student.roll_no);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setUpdateStudentId('');
    setUpdateFullName('');
    setUpdateStudentClass('');
    setUpdateRollNo('');
  };

  const updateStudent = async () => {
    if (!updateFullName || !updateStudentClass || updateRollNo === '') {
      alert('Please enter full name, class, and roll number.');
      return;
    }

    // Check if user has permission to update
    if (!hasPermission('update')) {
      alert('You do not have permission to update students.');
      return;
    }

    setUpdating(updateStudentId);
    
    const { error } = await supabase
      .from('students_list')
      .update({
        full_name: updateFullName,
        class: updateStudentClass,
        roll_no: Number(updateRollNo),
      })
      .eq('id', updateStudentId);

    if (error) {
      console.error('Error updating student:', error.message);
      alert('Failed to update student. Please try again.');
    } else {
      alert('Student updated successfully!');
      closeUpdateModal();
      fetchStudents();
    }
    
    setUpdating(null);
  };

  const getClassStats = () => {
    const classCounts: { [key: string]: number } = {};
    students.forEach(student => {
      classCounts[student.class] = (classCounts[student.class] || 0) + 1;
    });
    return classCounts;
  };

  const classStats = getClassStats();

  // Group students by class
  const studentsByClass = students.reduce((acc: { [key: string]: Student[] }, student) => {
    if (!acc[student.class]) acc[student.class] = [];
    acc[student.class].push(student);
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/add-student.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserPlus className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">🎓 Students & Class Management</h1>
                <p className="text-green-100 text-xs sm:text-sm">Add and manage students and classes</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Students</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{students.length}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Classes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{Object.keys(classStats).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Student Form */}
        <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add New Student
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">Fill in the details below to add a new student</p>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter student's full name"
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800 text-sm sm:text-base"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Class
                </label>
                <input
                  type="text"
                  placeholder="e.g., 10A, 12B"
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800 text-sm sm:text-base"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <Hash className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Roll Number
                </label>
                <input
                  type="number"
                  placeholder="Enter roll number"
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800 text-sm sm:text-base"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 sm:pt-4 border-t border-gray-200">
              <button
                onClick={addStudent}
                disabled={saving || !fullName || !studentClass || rollNo === ''}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center space-x-2 text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Add Student</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Students List
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm mt-1">View and manage all registered students, grouped by class</p>
          </div>
          {/* Search Box */}
          <div className="p-4 sm:p-6 pb-0">
            <input
              type="text"
              placeholder="Search class (e.g., 10A, 12B)"
              className="w-full p-2 sm:p-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-800 mb-4 text-sm sm:text-base"
              value={classSearch}
              onChange={e => setClassSearch(e.target.value)}
            />
          </div>
          {/* Table Content */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-6 sm:py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-6 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-4">👥</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Students Found</h3>
                <p className="text-gray-600 text-sm sm:text-base">Add your first student using the form above.</p>
              </div>
            ) : !classSearch.trim() ? (
              <div className="text-center py-6 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-4">🏫</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Search or Select a Class</h3>
                <p className="text-gray-600 text-sm sm:text-base">Please enter a class name above to view students.</p>
              </div>
            ) : (
              <div className="space-y-8 sm:space-y-12">
                {Object.keys(studentsByClass)
                  .sort()
                  .filter(className => className.toLowerCase().includes(classSearch.toLowerCase()))
                  .map((className) => (
                    <div key={className} className="mb-6 sm:mb-8">
                      <h3 className="text-base sm:text-lg font-bold text-purple-700 mb-3 sm:mb-4 flex items-center">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        Class {className}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm">Roll No</th>
                              <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm">Full Name</th>
                              <th className="text-center py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 text-xs sm:text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {studentsByClass[className].map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-800 font-medium">
                                  <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full text-xs sm:text-sm font-bold">
                                    {student.roll_no}
                                  </span>
                                </td>
                                <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-800 text-xs sm:text-sm">{student.full_name}</td>
                                <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                                  <div className="flex items-center justify-center space-x-3">
                                    <button
                                      onClick={() => openUpdateModal(student)}
                                      className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                                      title="Update Student"
                                    >
                                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteStudent(student.id)}
                                      disabled={deleting === student.id}
                                      className="text-red-500 hover:text-red-700 transition-colors duration-200 disabled:opacity-50"
                                      title="Delete Student"
                                    >
                                      {deleting === student.id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-500 mx-auto"></div>
                                      ) : (
                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Class Distribution */}
        {Object.keys(classStats).length > 0 && (
          <div className="rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Class Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {Object.entries(classStats).map(([className, count]) => (
                <div key={className} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 sm:p-4 rounded-xl text-center">
                  <p className="text-xl sm:text-2xl font-bold">{count}</p>
                  <p className="text-indigo-100 text-xs sm:text-sm">{className}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Update Student Modal */}
        {isUpdateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-semibold">Update Student</h3>
                <button 
                  onClick={closeUpdateModal}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter student's full name"
                    className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800"
                    value={updateFullName}
                    onChange={(e) => setUpdateFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Class
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 10A, 12B"
                    className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800"
                    value={updateStudentClass}
                    onChange={(e) => setUpdateStudentClass(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Roll Number
                  </label>
                  <input
                    type="number"
                    placeholder="Enter roll number"
                    className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800"
                    value={updateRollNo}
                    onChange={(e) => setUpdateRollNo(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={updateStudent}
                  disabled={updating === updateStudentId || !updateFullName || !updateStudentClass || updateRollNo === ''}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
                >
                  {updating === updateStudentId ? (
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
  );
}
