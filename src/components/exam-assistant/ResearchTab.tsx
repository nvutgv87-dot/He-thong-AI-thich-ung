import React, { useState } from 'react';
import { ResearchExperimentRecord } from '../../types/examTypes';
import { Student } from '../../types/index';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import {
  GraduationCap,
  FlaskConical,
  Download,
  Plus,
  Trash2,
  TrendingUp,
  BarChart2,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

interface ResearchTabProps {
  students: Student[];
}

export const ResearchTab: React.FC<ResearchTabProps> = ({ students }) => {
  const [records, setRecords] = useState<ResearchExperimentRecord[]>(() =>
    examService.getResearchRecords()
  );

  // Form for new experiment entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [testPhase, setTestPhase] = useState<'PRE_TEST' | 'POST_TEST' | 'DELAYED_TEST'>('PRE_TEST');
  const [groupType, setGroupType] = useState<'THỰC_NGHIỆM' | 'ĐỐI_CHỨNG'>('THỰC_NGHIỆM');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'STU_04');
  const [overallScore, setOverallScore] = useState(7.5);
  const [knowScore, setKnowScore] = useState(3.0);
  const [understandScore, setUnderstandScore] = useState(3.0);
  const [applyScore, setApplyScore] = useState(1.5);
  const [interventionLog, setInterventionLog] = useState('');

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === selectedStudentId);
    const newRecord: ResearchExperimentRecord = {
      id: `RES_EXP_${Date.now()}`,
      title: `Nghiên cứu sư phạm Hóa 11 - Nhóm ${groupType}`,
      subject: 'Hóa học',
      testPhase,
      groupType,
      studentId: selectedStudentId,
      studentCode: stu?.code || 'HS04',
      overallScore,
      knowScore,
      understandScore,
      applyScore,
      interventionLog: interventionLog.trim() || 'Thực hiện kế hoạch hỗ trợ vi phân 15 phút/chặng',
      timestamp: new Date().toISOString(),
    };

    examService.saveResearchRecord(newRecord);
    setRecords(examService.getResearchRecords());
    setShowAddModal(false);
    toastService.success('Đã ghi nhận dữ liệu nghiên cứu sư phạm thành công!');
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      toastService.warning('Chưa có dữ liệu nghiên cứu để xuất CSV.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Mã nghiên cứu,Giai đoạn,Nhóm,Mã học sinh (Mã hóa),Điểm tổng,Điểm BIẾT,Điểm HIỂU,Điểm VẬN DỤNG,Nhật ký can thiệp,Ngày ghi nhận\n';

    records.forEach((r, idx) => {
      // De-identify student code for ethics: e.g. TN01, DC01
      const anonymousId = r.groupType === 'THỰC_NGHIỆM' ? `TN_${idx + 1}` : `ĐC_${idx + 1}`;
      const line = `"${r.id}","${r.testPhase}","${r.groupType}","${anonymousId}",${r.overallScore},${r.knowScore},${r.understandScore},${r.applyScore},"${r.interventionLog.replace(/"/g, '""')}","${new Date(r.timestamp).toLocaleDateString('vi-VN')}"`;
      csvContent += line + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DuLieu_NghienCuu_SuPham_Hoa11_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success('Đã xuất file CSV mã hóa danh tính phục vụ nghiên cứu sư phạm!');
  };

  // Group stats
  const tnRecords = records.filter((r) => r.groupType === 'THỰC_NGHIỆM');
  const dcRecords = records.filter((r) => r.groupType === 'ĐỐI_CHỨNG');

  const avgTN = tnRecords.length > 0 ? (tnRecords.reduce((s, r) => s + r.overallScore, 0) / tnRecords.length).toFixed(2) : '0';
  const avgDC = dcRecords.length > 0 ? (dcRecords.reduce((s, r) => s + r.overallScore, 0) / dcRecords.length).toFixed(2) : '0';

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Không gian Nghiên cứu Thực nghiệm Sư phạm (Tùy chọn)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Pre-test / Post-test
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ giáo viên đối sánh nhóm Thực nghiệm vs Đối chứng theo 3 mức độ nhận thức, xuất CSV mã hóa danh tính đảm bảo đạo đức nghiên cứu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dữ liệu thực nghiệm</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Xuất file CSV mã hóa danh tính"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất CSV mã hóa</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-slate-500">Nhóm Thực nghiệm (TN)</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{avgTN}đ</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{tnRecords.length} mẫu ghi nhận</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-slate-500">Nhóm Đối chứng (ĐC)</div>
          <div className="text-xl font-bold text-slate-600 mt-1">{avgDC}đ</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{dcRecords.length} mẫu ghi nhận</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-slate-500">Độ chênh lệch trung bình</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            +{(parseFloat(avgTN) - parseFloat(avgDC)).toFixed(2)}đ
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dữ liệu ghi nhận thật từ lớp học</div>
        </div>
      </div>

      {/* Table of records */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs overflow-x-auto text-xs">
        {records.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            Chưa có dữ liệu thực nghiệm sư phạm nào. Bấm &quot;Thêm dữ liệu thực nghiệm&quot; để ghi nhận các đợt Pre-test và Post-test.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
                <th className="pb-2">Đợt kiểm tra</th>
                <th className="pb-2">Nhóm</th>
                <th className="pb-2">Mã học sinh</th>
                <th className="pb-2 text-center">BIẾT</th>
                <th className="pb-2 text-center">HIỂU</th>
                <th className="pb-2 text-center">VẬN DỤNG</th>
                <th className="pb-2 text-center font-bold">Tổng điểm</th>
                <th className="pb-2">Nhật ký can thiệp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 font-bold text-indigo-600">{r.testPhase}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.groupType === 'THỰC_NGHIỆM'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {r.groupType}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono">{r.studentCode}</td>
                  <td className="py-2.5 text-center text-blue-600 font-bold">{r.knowScore.toFixed(1)}đ</td>
                  <td className="py-2.5 text-center text-purple-600 font-bold">{r.understandScore.toFixed(1)}đ</td>
                  <td className="py-2.5 text-center text-emerald-600 font-bold">{r.applyScore.toFixed(1)}đ</td>
                  <td className="py-2.5 text-center font-bold text-slate-900 dark:text-white">
                    {r.overallScore.toFixed(2)}đ
                  </td>
                  <td className="py-2.5 text-slate-500 max-w-xs truncate">{r.interventionLog}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Thêm dữ liệu thực nghiệm sư phạm
            </h3>

            <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Giai đoạn</label>
                  <select
                    value={testPhase}
                    onChange={(e) => setTestPhase(e.target.value as any)}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  >
                    <option value="PRE_TEST">Pre-test (Trước)</option>
                    <option value="POST_TEST">Post-test (Sau)</option>
                    <option value="DELAYED_TEST">Delayed-test (Duy trì)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Nhóm</label>
                  <select
                    value={groupType}
                    onChange={(e) => setGroupType(e.target.value as any)}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800"
                  >
                    <option value="THỰC_NGHIỆM">Thực nghiệm (TN)</option>
                    <option value="ĐỐI_CHỨNG">Đối chứng (ĐC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Học sinh</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Tổng điểm</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={overallScore}
                    onChange={(e) => setOverallScore(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-blue-600">BIẾT</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={knowScore}
                    onChange={(e) => setKnowScore(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-purple-600">HIỂU</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={understandScore}
                    onChange={(e) => setUnderstandScore(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-emerald-600">VẬN DỤNG</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={applyScore}
                    onChange={(e) => setApplyScore(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg dark:bg-slate-800 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nhật ký can thiệp / Phương pháp</label>
                <textarea
                  rows={2}
                  value={interventionLog}
                  onChange={(e) => setInterventionLog(e.target.value)}
                  placeholder="Ghi nhận phương pháp giảng dạy thích ứng đã áp dụng..."
                  className="w-full p-2 border rounded-lg dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg"
                >
                  Lưu dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
