"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, DollarSign, FileText, Download } from 'lucide-react';
import { useRouter } from "next/navigation";

export default function StudentFeesPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [studentList, setStudentList] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [fee, setFee] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all unique classes
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from("students_list").select("class");
      if (!error && data) {
        const unique = Array.from(new Set(data.map((d: any) => d.class).filter(Boolean)));
        setClassList(unique);
      }
    };
    fetchClasses();
  }, []);

  // Fetch students for selected class
  useEffect(() => {
    if (!selectedClass) {
      setStudentList([]);
      setSelectedStudent("");
      return;
    }
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("students_list")
        .select("id, full_name")
        .eq("class", selectedClass);
      if (!error && data) {
        setStudentList(data);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  // Fetch fee for selected student
  useEffect(() => {
    if (!selectedStudent) {
      setFee(null);
      return;
    }
    const fetchFee = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("fees")
        .select("total, paid, due, year, file_url")
        .eq("student_id", selectedStudent)
        .order("year", { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        setFee(data[0]);
      } else {
        setFee(null);
      }
      setLoading(false);
    };
    fetchFee();
  }, [selectedStudent]);

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

  const upiLink = fee?.due
  ? `upi://pay?pa=schooltest@upi&pn=TestSchool&am=${fee.due}&cu=INR`
  : "";

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'url(/fees.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white p-4 sm:p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold">💸 Fees & Payments</h1>
                <p className="text-yellow-100 text-xs sm:text-sm">View and pay your school fees</p>
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

        {/* Main Content */}
        <div className="rounded-2xl p-4 sm:p-8 shadow-lg border border-white/20 text-black">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black">View Your Fee Details</h1>
          <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6 items-start sm:items-center">
            <select
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-black text-sm sm:text-base"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classList.map(cls => (
                <option key={cls} value={cls} className="text-black">{cls}</option>
              ))}
            </select>
            <select
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-black text-sm sm:text-base"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select Name</option>
              {studentList.map(student => (
                <option key={student.id} value={student.id} className="text-black">{student.full_name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center text-black">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-3"></div>
              <p className="text-sm">Loading...</p>
            </div>
          ) : fee ? (
            <>
              <div className="p-2 sm:p-4 mt-4">
                <div className="mb-2 text-black font-semibold text-sm sm:text-base">Year: {fee.year}</div>
                <div className="overflow-auto shadow-lg border border-white/20 rounded-xl">
                  <table className="w-full text-center">
                    <thead className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
                      <tr>
                        <th className="p-3 sm:p-4 font-semibold text-xs sm:text-sm">Total</th>
                        <th className="p-3 sm:p-4 font-semibold text-xs sm:text-sm">Paid</th>
                        <th className="p-3 sm:p-4 font-semibold text-xs sm:text-sm">Due</th>
                        <th className="p-3 sm:p-4 font-semibold text-xs sm:text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 sm:p-3 text-center text-gray-800 text-xs sm:text-sm">₹{fee.total}</td>
                        <td className="p-2 sm:p-3 text-center text-gray-800 text-xs sm:text-sm">₹{fee.paid ?? 0}</td>
                        <td className="p-2 sm:p-3 text-center text-gray-800 text-xs sm:text-sm">₹{fee.due}</td>
                        <td className="p-2 sm:p-3 text-center">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                            fee.due === 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {fee.due === 0 ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Uploaded Files Section */}
                {fee.file_url && (
                  <div className="rounded-xl p-3 sm:p-6 shadow-lg border border-blue-200 mt-4">
                    <h3 className="text-md sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl">{getFileIcon(fee.file_url)}</span>
                      <span className="text-sm sm:text-base">Uploaded Receipts & Documents</span>
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                        <span className="text-lg" title={getFileExtension(fee.file_url)}>
                          {getFileIcon(fee.file_url)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-800 text-sm sm:text-base">Fee Receipt</p>
                          <p className="text-xs sm:text-sm text-gray-500">{getFileExtension(fee.file_url)} Document</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={fee.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-50"
                          title="View File"
                        >
                          <FileText size={14} className="sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">View</span>
                        </a>
                        <a
                          href={fee.file_url}
                          download
                          className="flex items-center space-x-1 text-green-600 hover:text-green-800 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-green-50"
                          title="Download File"
                        >
                          <Download size={14} className="sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {fee.due > 0 && (
                  <>
                    <div className="text-center mt-4 shadow-lg border border-white/20 rounded-xl p-3 sm:p-4">
                      <p className="text-red-600 font-medium mb-2 text-sm sm:text-base">Pending Payment: ₹{fee.due}</p>
                      <a
                        href={upiLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-green-600 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm hover:bg-green-700 transition-all"
                      >
                        Pay with UPI (Google Pay / PhonePe)
                      </a>
                      <div className="mt-4 flex justify-center">
                        <QRCodeSVG value={upiLink} size={120} className="sm:w-[180px] sm:h-[180px] w-[120px] h-[120px]" />
                      </div>
                      <p className="text-xs sm:text-sm mt-2 text-gray-500">Scan this QR code with any UPI app</p>
                    </div>
                    <div className="bg-green-50 border border-green-400 rounded p-3 sm:p-4 mt-4 text-black shadow">
                      <h2 className="text-md sm:text-lg font-semibold text-green-700 mb-2">Receipt</h2>
                      <p className="text-xs sm:text-sm"><span className="font-medium">Student:</span> {studentList.find(s => s.id === selectedStudent)?.full_name}</p>
                      <p className="text-xs sm:text-sm"><span className="font-medium">Class:</span> {selectedClass}</p>
                      <p className="text-xs sm:text-sm"><span className="font-medium">Year:</span> {fee.year}</p>
                      <p className="text-xs sm:text-sm"><span className="font-medium">Total Fee:</span> ₹{fee.total}</p>
                      <p className="text-xs sm:text-sm"><span className="font-medium">Amount Paid:</span> ₹{fee.paid}</p>
                      <p className="text-xs sm:text-sm"><span className="font-medium">Payment Status:</span> {fee.due === 0 ? "Paid" : "Pending"}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">Thank you for your payment.</p>
                    </div>
                  </>
                )}
                {fee.due === 0 && (
                  <div className="border border-green-400 rounded p-4 mt-4 text-black shadow">
                    <h2 className="text-lg font-semibold text-green-700 mb-2">Receipt</h2>
                    <p><span className="font-medium">Student:</span> {studentList.find(s => s.id === selectedStudent)?.full_name}</p>
                    <p><span className="font-medium">Class:</span> {selectedClass}</p>
                    <p><span className="font-medium">Year:</span> {fee.year}</p>
                    <p><span className="font-medium">Total Fee:</span> ₹{fee.total}</p>
                    <p><span className="font-medium">Amount Paid:</span> ₹{fee.paid}</p>
                    <p><span className="font-medium">Payment Status:</span> Paid</p>
                    <p className="text-sm text-gray-600 mt-2">Thank you for your payment.</p>
                  </div>
                )}
              </div>
            </>
          ) : selectedStudent ? (
            <div className="text-center text-gray-500 mt-4">No fee records found for this student.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
