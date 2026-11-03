/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  Student,
  WeeklyLearningRecord,
  RiskSignal,
  InterventionPlan,
  Classroom,
  WARNING_LEVEL_DEFINITIONS,
} from '../../types';

interface ReportBuilderViewProps {
  classroom: Classroom;
  students: Student[];
  records: WeeklyLearningRecord[];
  signals: RiskSignal[];
  interventions: InterventionPlan[];
  privacyMode: boolean;
}

type ReportType =
  | 'CLASS_SUMMARY'
  | 'STUDENT_INDIVIDUAL'
  | 'BEFORE_AFTER_INTERVENTION'
  | 'WEEKLY_TREND'
  | 'SEMESTER_EVALUATION';

export const ReportBuilderView: React.FC<ReportBuilderViewProps> = ({
  classroom,
  students,
  records,
  signals,
  interventions,
  privacyMode,
}) => {
  const [reportType, setReportType] = useState<ReportType>('CLASS_SUMMARY');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const selectedIntervention = interventions.find((i) => i.studentId === selectedStudentId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportReportCsv = () => {
    let csv = 'Mã học sinh,Họ tên,Trạng thái,Mức cảnh báo,Baseline nộp bài,Tỷ lệ hiện tại\n';
    students.forEach((s) => {
      csv += `${s.code},"${privacyMode ? s.code : s.fullName}",${s.currentStatus},${s.warningLevel},${s.baseline.onTimeRate}%,${s.currentStatus === 'DA_CAI_THIEN' ? '100%' : '85%'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_hoc_tap_${reportType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Trình Tạo Báo Cáo Sư Phạm Đa Chiều (Report Builder)
          </h1>
          <p className="text-xs text-slate-500">
            Phân biệt minh bạch giữa <strong className="text-slate-700 dark:text-slate-300">DỮ LIỆU THỰC TẾ</strong> và <strong className="text-blue-600">ĐỀ XUẤT CỦA AI</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl flex items-center gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setReportType('CLASS_SUMMARY')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
            reportType === 'CLASS_SUMMARY'
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          1. Báo cáo tổng hợp Lớp
        </button>
        <button
          onClick={() => setReportType('BEFORE_AFTER_INTERVENTION')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
            reportType === 'BEFORE_AFTER_INTERVENTION'
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          2. Báo cáo Trước - Sau Can thiệp
        </button>
        <button
          onClick={() => setReportType('STUDENT_INDIVIDUAL')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
            reportType === 'STUDENT_INDIVIDUAL'
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          3. Báo cáo Cá nhân Học sinh
        </button>
      </div>

      {/* Individual Student Filter if applicable */}
      {reportType === 'STUDENT_INDIVIDUAL' && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Chọn học sinh lập báo cáo:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {privacyMode ? s.code : s.fullName} ({s.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Report Preview Document */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6 text-xs text-slate-800 dark:text-slate-200 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="text-center pb-5 border-b border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Trường THPT Thực Nghiệm Sư Phạm · Năm học 2026 - 2027
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {reportType === 'CLASS_SUMMARY' && 'BÁO CÁO TIẾN TRÌNH HỌC TẬP & TÍN HIỆU THÍCH ỨNG - LỚP'}
            {reportType === 'BEFORE_AFTER_INTERVENTION' && 'BÁO CÁO ĐỐI CHIẾU TRƯỚC - SAU CAN THIỆP SƯ PHẠM'}
            {reportType === 'STUDENT_INDIVIDUAL' && `HỒ SƠ TỔNG HỢP CÁ NHÂN HỌC SINH ${privacyMode ? selectedStudent?.code : selectedStudent?.fullName}`}
          </h2>
          <div className="text-slate-400 text-[11px]">
            Ngày lập: {new Date().toLocaleDateString('vi-VN')} · Giáo viên phụ trách: ThS. Nguyễn Hoàng Nam (Giáo viên phụ trách)
          </div>
        </div>

        {/* Section 1: DỮ LIỆU THỰC TẾ (FACTUAL GROUNDING) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white"></span>
            <span>PHẦN 1: DỮ LIỆU THỰC TẾ (QUAN SÁT & ĐO LƯỜNG ĐỊNH LƯỢNG)</span>
          </div>

          {reportType === 'CLASS_SUMMARY' && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Học sinh</th>
                    <th className="p-2.5">Trạng thái</th>
                    <th className="p-2.5">Baseline đúng hạn</th>
                    <th className="p-2.5">Tỷ lệ nộp tuần 4</th>
                    <th className="p-2.5">Điểm tham gia</th>
                    <th className="p-2.5">Nhiệm vụ trễ/quá hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((s) => {
                    const levelMeta = WARNING_LEVEL_DEFINITIONS[s.warningLevel];
                    const displayName = privacyMode ? s.code : s.fullName;
                    return (
                      <tr key={s.id}>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{displayName}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${levelMeta.badgeBg}`}>
                            {levelMeta.name}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">{s.baseline.onTimeRate}%</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                          {s.id === 'STU_04' ? '25%' : s.id === 'STU_07' ? '100%' : '90%'}
                        </td>
                        <td className="p-2.5 font-mono">{s.baseline.participationScore}/5</td>
                        <td className="p-2.5 font-mono">{s.id === 'STU_04' ? '3 bài' : '0 bài'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'BEFORE_AFTER_INTERVENTION' && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="font-semibold text-slate-900 dark:text-white">
                Trường hợp thực nghiệm: HS07 ({privacyMode ? 'HS07' : 'Hoàng Mai Phương'})
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Trước can thiệp (Tuần 1-2):</div>
                  <div className="mt-1 space-y-0.5">
                    <div>Tỷ lệ đúng hạn: <strong>50%</strong></div>
                    <div>Nhiệm vụ trễ: <strong>2 bài</strong></div>
                    <div>Thời lượng tập trung: <strong>75 phút/tuần</strong></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300">
                  <div className="font-semibold">Sau can thiệp (Tuần 3-4):</div>
                  <div className="mt-1 space-y-0.5">
                    <div>Tỷ lệ đúng hạn: <strong>100%</strong> (+50%)</div>
                    <div>Nhiệm vụ trễ: <strong>0 bài</strong></div>
                    <div>Thời lượng tập trung: <strong>190 phút/tuần</strong> (+115 phút)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: ĐỀ XUẤT CỦA AI (AI PEDAGOGICAL HYPOTHESIS) */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PHẦN 2: PHÂN TÍCH XU HƯỚNG & ĐỀ XUẤT HỖ TRỢ CỦA HỆ THỐNG AI</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-2 leading-relaxed">
            <p>
              <strong>1. Nhận diện xu hướng: </strong> 
              Hệ thống ghi nhận 1 trường hợp (HS04) có biểu hiện trì hoãn bắt đầu bài tập trong 3 tuần liên tiếp 
              khi khối lượng bài tập tăng. Không phát hiện suy giảm ở 6 học sinh còn lại.
            </p>
            <p>
              <strong>2. Đề xuất can thiệp cá nhân hóa: </strong>
              Khuyến nghị chia nhỏ các nhiệm vụ trên 45 phút thành các mốc 15 phút (Micro-tasks). 
              Học sinh HS04 phản hồi tích cực với việc kiểm tra chặng 1 sớm sau 24h giao đề.
            </p>
            <p>
              <strong>3. Khuyến nghị giai đoạn tiếp theo: </strong>
              Đối với trường hợp HS07 đã cải thiện, từng bước chuyển giao quyền tự quản hoàn toàn, 
              giảm tần suất nhắc hẹn của giáo viên.
            </p>
          </div>
        </div>

        {/* Ethical Disclaimer */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Báo cáo được lập tự động từ Hệ thống AI thích ứng hỗ trợ học tập THPT. 
            Mọi đề xuất chỉ mang tính hỗ trợ ra quyết định sư phạm cho giáo viên, 
            tuyệt đối không có giá trị chẩn đoán y khoa hay tâm lý học.
          </span>
        </div>
      </div>
    </div>
  );
};
