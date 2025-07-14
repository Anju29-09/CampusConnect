'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { FileText, Upload, Save, Eye, Calendar, Users, File, Image, X } from 'lucide-react';

type Notice = {
  id: string;
  class: string;
  date: string;
  notice: string;
  file_url: string | null;
  file_type: string | null;
};

export default function AdminNoticeboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      const { data, error } = await supabase.from('students_list').select('class');
      if (error) return console.error('Error loading classes:', error.message);
      const unique = Array.from(new Set(data.map((d) => d.class)));
      setClasses(unique);
    };
    loadClasses();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `notices/${uuidv4()}.${ext}`;

    const { data, error } = await supabase.storage.from('notices').upload(path, file);
    if (error) {
      console.error('Upload error:', error.message);
      setUploading(false);
      return;
    }

    const fullPath = data?.path ?? '';
    const { data: publicData } = supabase.storage.from('notices').getPublicUrl(fullPath);
    setFileUrl(publicData?.publicUrl ?? '');
    setFileType(file.type.includes('image') ? 'image' : 'pdf');
    setUploading(false);
    alert('File uploaded successfully!');
  };

  const handleSave = async () => {
    if (!selectedClass || !date) {
      alert('Please select class and date');
      return;
    }

    if (file && !fileUrl) {
      alert('Please upload the file first before saving.');
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase.from('noticeboard').insert({
      class: selectedClass,
      date,
      notice: noticeText || '',
      file_url: fileUrl,
      file_type: fileType,
    });

    if (insertError) {
      console.error('Error saving notice:', insertError.message);
      alert('Failed to save notice. Please try again.');
    } else {
      alert('Notice saved successfully!');
      setNoticeText('');
      setDate('');
      setFile(null);
      setFileUrl(null);
      setFileType(null);
    }

    setSaving(false);
  };

  const removeFile = () => {
    setFile(null);
    setFileUrl(null);
    setFileType(null);
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-4 h-4" />;
    return fileType === 'image' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/noticeboard.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">📌 Notice Board</h1>
                <p className="text-green-100 text-sm">Create and manage notices for students</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              title="Back to Dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <div className="rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Create New Notice
            </h2>
            <p className="text-blue-100 text-sm mt-1">Fill in the details below to create a new notice</p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Class and Date Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Target Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800"
                >
                  <option value="">-- Select a Class --</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Notice Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800"
                />
              </div>
            </div>

            {/* Notice Text */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Notice Content
              </label>
              <textarea
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800 resize-none"
                placeholder="Write your notice here... (Optional)"
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                File Attachment (Optional)
              </label>
              
              {!fileUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors duration-200">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-gray-600">Click to select a file</p>
                      <p className="text-sm text-gray-500">Supports: Images (JPG, PNG, GIF) and PDF files</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(fileType)}
                      <div>
                        <p className="text-sm font-medium text-green-800">File uploaded successfully!</p>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-green-600 hover:text-green-800 underline"
                        >
                          View uploaded file
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {file && !fileUrl && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                      </>
                    )}
                  </button>
                  <span className="text-sm text-gray-600">{file.name}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving || !selectedClass || !date}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Notice</span>
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/admin/noticeboard/view')}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Eye className="w-5 h-5" />
                <span>View Saved Notices</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
