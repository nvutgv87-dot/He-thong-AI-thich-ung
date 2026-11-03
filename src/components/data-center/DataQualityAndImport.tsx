/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  FileJson,
  Trash2,
  FileUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DataQualityIssue, Student, WeeklyLearningRecord } from '../../types';
import { storageService } from '../../services/storageService';

interface DataQualityAndImportProps {
  issues: DataQualityIssue[];
  students: Student[];
  privacyMode: boolean;
  onRefreshData: () => void;
  onResetDemo: () => void;
}

export const DataQualityAndImport: React.FC<DataQualityAndImportProps> = ({
  issues,
  students,
  privacyMode,
  onRefreshData,
  onResetDemo,
}) => {
  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [restoreMessage, setRestoreMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [importStatus, setImportStatus] = useState<{ count: number; filename: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Export full JSON Backup
  const handleExportJson = () => {
    const jsonStr = storageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `adaptive_student_support_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Restore JSON Backup from Text
  const handleRestoreJsonText = () => {
    if (!restoreJsonText.trim()) return;
    const result = storageService.restoreBackupJson(restoreJsonText);
    if (result.success) {
      setRestoreMessage({ success: true, text: 'Khôi phục bản sao lưu thành công!' });
      onRefreshData();
      setRestoreJsonText('');
    } else {
      setRestoreMessage({ success: false, text: result.error || 'Lỗi khi khôi phục' });
    }
  };

  // Upload JSON File Directly
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = storageService.restoreBackupJson(text);
        if (result.success) {
          setRestoreMessage({ success: true, text: `Đã khôi phục thành công từ tệp ${file.name}!` });
          onRefreshData();
        } else {
          setRestoreMessage({ success: false, text: result.error || 'Lỗi xử lý file JSON' });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download Sample Excel (.xlsx) Template for Learning Data
  const handleDownloadExcelTemplate = () => {
    const sampleData = [
      {
        MaHocSinh: 'HS01',
        TuanHoc: 5,
        TenTuan: 'Tuần 5 (29/09 - 04/10)',
        DiemKiemTra: 9.0,
        DiemQuaTrinh: 8.8,
        MucDoThamGia: 5,
        NhiemVuGiao: 4,
        DungHan: 4,
        Muon: 0,
        QuaHan: 0,
        SoLanNhac: 0,
        PhutTapTrung: 180,
      },
      {
        MaHocSinh: 'HS04',
        TuanHoc: 5,
        TenTuan: 'Tuần 5 (29/09 - 04/10)',
        DiemKiemTra: 6.5,
        DiemQuaTrinh: 7.0,
        MucDoThamGia: 3,
        NhiemVuGiao: 4,
        DungHan: 2,
        Muon: 1,
        QuaHan: 1,
        SoLanNhac: 2,
        PhutTapTrung: 80,
      },
      {
        MaHocSinh: 'HS06',
        TuanHoc: 5,
        TenTuan: 'Tuần 5 (29/09 - 04/10)',
        DiemKiemTra: 7.0,
        DiemQuaTrinh: 7.2,
        MucDoThamGia: 2,
        NhiemVuGiao: 4,
        DungHan: 3,
        Muon: 1,
        QuaHan: 0,
        SoLanNhac: 1,
        PhutTapTrung: 90,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DuLieuHocTap');
    XLSX.writeFile(workbook, 'mau_nhap_du_lieu_hoc_tap.xlsx');
  };

  // Download Sample Excel (.xlsx) Template for Student Roster
  const handleDownloadStudentRosterExcel = () => {
    const sampleStudents = [
      {
        MaHocSinh: 'HS09',
        HoVaTen: 'Trần Gia Hưng',
        GioiTinh: 'Nam',
        DiemTrungBinh: 7.8,
        TyLeDungHan: 85,
        MucDoThamGia: 4,
        GhiChu: 'Học sinh mới chuyển vào từ tuần 5',
      },
      {
        MaHocSinh: 'HS10',
        HoVaTen: 'Ngô Thảo My',
        GioiTinh: 'Nữ',
        DiemTrungBinh: 8.2,
        TyLeDungHan: 90,
        MucDoThamGia: 5,
        GhiChu: 'Tự giác làm bài tập về nhà',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleStudents);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachHocSinh');
    XLSX.writeFile(workbook, 'mau_danh_sach_hoc_sinh.xlsx');
  };

  // Download Sample CSV Template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'MaHocSinh,TuanHoc,TenTuan,DiemKiemTra,DiemQuaTrinh,MucDoThamGia,NhiemVuGiao,DungHan,Muon,QuaHan,SoLanNhac,PhutTapTrung\n' +
      'HS01,5,Tuần 5,9.0,8.8,5,4,4,0,0,0,180\n' +
      'HS04,5,Tuần 5,6.5,7.0,3,4,2,1,1,2,80\n' +
      'HS06,5,Tuần 5,7.0,7.2,2,4,3,1,0,1,90\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau_nhap_du_lieu_hoc_tap.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Upload & Parse Excel / CSV File (Handles both Learning Records and Student Roster)
  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(sheet);

        if (!rawRows || rawRows.length === 0) {
          setImportError('Tệp rỗng hoặc không có dữ liệu hàng.');
          return;
        }

        const currentRecords = storageService.getLearningRecords();
        const existingStudents = storageService.getStudents();
        let importedCount = 0;
        let studentsAdded = 0;

        rawRows.forEach((row: any, idx: number) => {
          // Check if row has student roster fields
          const fullName = row['HoVaTen'] || row['Họ và tên'] || row['HoTen'] || row['Họ tên'] || row['FullName'];
          const studentCode = row['MaHocSinh'] || row['Mã học sinh'] || row['HS'] || row['Mã HS'] || `HS0${(idx % 8) + 1}`;

          if (fullName) {
            const existingIdx = existingStudents.findIndex(
              (s) => s.code.toLowerCase() === String(studentCode).toLowerCase()
            );
            if (existingIdx !== -1) {
              existingStudents[existingIdx].fullName = String(fullName);
              if (row['GioiTinh'] || row['Giới tính']) {
                existingStudents[existingIdx].gender = row['GioiTinh'] === 'Nữ' || row['Giới tính'] === 'Nữ' ? 'Nữ' : 'Nam';
              }
            } else {
              existingStudents.push({
                id: `STU_${Date.now()}_${idx}`,
                code: String(studentCode),
                fullName: String(fullName),
                birthDate: '15/01/2009',
                classId: 'LOP_11A1',
                gender: row['GioiTinh'] === 'Nữ' || row['Giới tính'] === 'Nữ' ? 'Nữ' : 'Nam',
                currentStatus: 'ON_DINH',
                warningLevel: 0,
                activeSignalsCount: 0,
                activeInterventionsCount: 0,
                baseline: {
                  avgScore: Number(row['DiemTrungBinh'] || row['Điểm TB'] || 7.5),
                  onTimeRate: Number(row['TyLeDungHan'] || row['Tỷ lệ đúng hạn'] || 85),
                  participationScore: Number(row['MucDoThamGia'] || 4.0),
                  avgDelayHours: 1.0,
                  focusMinutesAvg: 35,
                  recordedPeriod: 'Tuần 1 - 4',
                },
                profile: {
                  personalGoals: ['Nâng cao kết quả học tập'],
                  strengths: ['Tập trung tốt khi có hướng dẫn rõ ràng'],
                  currentDifficulties: [],
                  taskCompletionHabits: 'Nộp bài đúng hạn',
                  participationStyle: 'Tương tác bình thường',
                  triedStrategies: [],
                  effectiveStrategies: ['Chia nhỏ bài tập'],
                  ineffectiveStrategies: [],
                  lastUpdated: new Date().toLocaleDateString('vi-VN'),
                },
                lastDataUpdate: new Date().toLocaleDateString('vi-VN'),
                notes: String(row['GhiChu'] || row['Ghi chú'] || 'Được nạp từ tệp bảng tính.'),
              });
              studentsAdded++;
            }
          }

          // Check if row has weekly learning record fields
          const hasRecordFields = row['TuanHoc'] || row['Tuần'] || row['DiemKiemTra'] || row['Điểm KT'] || row['DiemQuaTrinh'] || row['Điểm QT'] || row['NhiemVuGiao'];

          if (hasRecordFields) {
            const targetStudent = existingStudents.find(
              (s) => s.code.toLowerCase() === String(studentCode).toLowerCase()
            );
            const stuId = targetStudent ? targetStudent.id : `STU_${studentCode}`;

            const newRecord: WeeklyLearningRecord = {
              id: `LR_IMPORT_${Date.now()}_${idx}`,
              studentId: stuId,
              weekNumber: Number(row['TuanHoc'] || row['Tuần'] || 5),
              academicWeek: String(row['TenTuan'] || `Tuần ${row['TuanHoc'] || 5}`),
              testScore: Number(row['DiemKiemTra'] || row['Điểm KT'] || 7.5),
              processScore: Number(row['DiemQuaTrinh'] || row['Điểm QT'] || 7.5),
              participationLevel: Number(row['MucDoThamGia'] || row['Tham gia'] || 4),
              tasksAssigned: Number(row['NhiemVuGiao'] || row['Số bài'] || 4),
              tasksCompletedOnTime: Number(row['DungHan'] || row['Đúng hạn'] || 3),
              tasksCompletedLate: Number(row['Muon'] || row['Muộn'] || 1),
              tasksOverdue: Number(row['QuaHan'] || row['Quá hạn'] || 0),
              reminderCount: Number(row['SoLanNhac'] || row['Nhắc nhở'] || 0),
              focusMinutesLogged: Number(row['PhutTapTrung'] || row['Phút tập trung'] || 90),
            };

            currentRecords.push(newRecord);
            importedCount++;
          }
        });

        if (studentsAdded > 0) {
          storageService.saveStudents(existingStudents);
        }
        if (importedCount > 0) {
          storageService.saveLearningRecords(currentRecords);
        }

        const msg = [
          importedCount > 0 ? `${importedCount} bản ghi học tập` : null,
          studentsAdded > 0 ? `${studentsAdded} học sinh mới` : null,
        ].filter(Boolean).join(' và ');

        storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã nạp thành công ${msg || 'dữ liệu'} từ tệp ${file.name}`);
        setImportStatus({ count: importedCount || studentsAdded, filename: file.name });
        onRefreshData();
      } catch (err: any) {
        console.error('Error importing spreadsheet:', err);
        setImportError(err.message || 'Lỗi khi phân tích tệp bảng tính.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Trung Tâm Kiểm Tra Chất Lượng Dữ Liệu & Nạp File Đa Định Dạng
        </h1>
        <p className="text-xs text-slate-500">
          Hỗ trợ nạp đầy đủ tệp Excel (.xlsx, .xls), CSV và sao lưu JSON toàn diện; tự động khóa cảnh báo sai lệch khi dữ liệu chưa đủ.
        </p>
      </div>

      {/* Data Quality Issues */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Kiểm toán Chất lượng Dữ liệu Học tập ({issues.length} cảnh báo)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Tự động quét định kỳ
          </span>
        </div>

        {issues.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Chất lượng dữ liệu đạt tiêu chuẩn 100%. Đầy đủ baseline và tự phản tư.</span>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            {issues.map((issue) => {
              const student = students.find((s) => s.id === issue.studentId);
              const displayName = student ? (privacyMode ? student.code : student.fullName) : issue.studentCode;

              return (
                <div
                  key={issue.id}
                  className="p-3.5 rounded-lg border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{displayName}</span>
                      <span className="text-slate-400">({issue.studentCode})</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                        {issue.type}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{issue.description}</p>
                    <div className="text-[11px] text-slate-500">
                      <strong>Hệ thống bảo vệ: </strong>{issue.impact}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      {issue.actionRequired}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSV & Excel Data Importer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Excel & CSV Upload Box */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nạp tệp Excel (.xlsx, .xls) hoặc CSV</span>
          </div>
          <p className="text-slate-500">
            Hỗ trợ nhập trực tiếp điểm kiểm tra, điểm quá trình, tỷ lệ hoàn thành nhiệm vụ từ bảng tính của giáo viên.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleDownloadExcelTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tải file Excel: Điểm học tập (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadStudentRosterExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tải file Excel: Danh sách học sinh (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadCsvTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Tải file CSV mẫu (.csv)</span>
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa sạch bản ghi học tập</span>
            </button>
          </div>

          <div className="pt-2">
            <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-colors">
              <FileUp className="w-5 h-5 text-blue-600" />
              <div className="text-center">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Chọn tệp Excel / CSV</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">Hỗ trợ .xlsx, .xls, .csv</span>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSpreadsheetUpload}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Đã nạp thành công {importStatus.count} dòng từ tệp {importStatus.filename}!</span>
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        {/* JSON Full Backup & File Upload */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
            <FileJson className="w-4 h-4 text-blue-600" />
            <span>Sao lưu & Nạp tệp JSON toàn diện</span>
          </div>
          <p className="text-slate-500">
            Xuất hoặc nạp đầy đủ bản sao lưu hệ thống: hồ sơ học sinh, chuỗi dữ liệu, tín hiệu cảnh báo, can thiệp và nhật ký kiểm toán.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất bản sao lưu (.json)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 cursor-pointer font-medium shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Tải lên tệp sao lưu (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleJsonFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={onResetDemo}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại Demo gốc</span>
            </button>
          </div>
        </div>
      </div>

      {/* JSON Direct Paste Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs text-xs space-y-3">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
          Hoặc dán trực tiếp mã JSON sao lưu
        </h3>
        <p className="text-slate-500">
          Dán nội dung tệp JSON sao lưu vào ô dưới đây để khôi phục trạng thái:
        </p>
        <textarea
          rows={3}
          placeholder='{"appName": "ADAPTIVE STUDENT SUPPORT AI", "schemaVersion": "1.2.0", ...}'
          value={restoreJsonText}
          onChange={(e) => setRestoreJsonText(e.target.value)}
          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-[11px] text-slate-800 dark:text-slate-200"
        />

        {restoreMessage && (
          <div className={`p-2.5 rounded-lg font-medium flex items-center gap-1.5 ${
            restoreMessage.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {restoreMessage.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{restoreMessage.text}</span>
          </div>
        )}

        <button
          onClick={handleRestoreJsonText}
          className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer hover:bg-blue-700"
        >
          Khôi phục từ văn bản JSON
        </button>
      </div>

      {/* Clear Records Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Xác nhận xóa sạch bản ghi học tập</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ các bản ghi học tập theo tuần?
              Thao tác này cho phép bạn kiểm thử tính năng nạp tệp Excel/CSV mới từ đầu.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  storageService.clearAllLearningRecords();
                  setShowClearConfirm(false);
                  onRefreshData();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Xóa sạch ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
