import React, { useState } from 'react';
import {
  StudentProductSubmission,
  LearningTask,
  Student,
  SubmissionStatus,
  FileAttachmentMeta,
  COGNITIVE_LEVEL_META,
} from '../../types';
import {
  formatFileSize,
  getFileExtension,
  saveFileToIndexedDB,
  downloadFileFromIndexedDB,
  downloadBlob,
} from '../../utils/indexedDbStorage';
import { toastService } from '../../services/toastService';
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Paperclip,
  Trash2,
  X,
  Search,
  Filter,
  MessageSquare,
  Award,
  Download,
  RotateCcw,
} from 'lucide-react';

interface SubmissionsTabProps {
  userRole: 'TEACHER' | 'STUDENT';
  submissions: StudentProductSubmission[];
  tasks: LearningTask[];
  currentStudent: Student;
  onSaveSubmission: (submission: StudentProductSubmission) => void;
  onRequestConfirmDelete: (submission: StudentProductSubmission) => void;
}

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; badge: string }> = {
  CHUA_NOP: { label: 'Chưa nộp', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  NHAP: { label: 'Bản nháp', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300' },
  DA_NOP: { label: 'Đã nộp bài', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300' },
  DA_NHAN_XET: { label: 'Đã nhận xét', badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300' },
  DA_HOAN_THANH: { label: 'Đã hoàn thành', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' },
  CAN_NOP_LAI: { label: 'Cần nộp lại', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300' },
};

export const SubmissionsTab: React.FC<SubmissionsTabProps> = ({
  userRole,
  submissions,
  tasks,
  currentStudent,
  onSaveSubmission,
  onRequestConfirmDelete,
}) => {
  const [viewScope, setViewScope] = useState<'MY' | 'CLASS'>(userRole === 'STUDENT' ? 'MY' : 'CLASS');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [editingSub, setEditingSub] = useState<StudentProductSubmission | null>(null);

  // Form state
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileAttachmentMeta[]>([]);

  // Teacher feedback modal state
  const [feedbackSub, setFeedbackSub] = useState<StudentProductSubmission | null>(null);
  const [teacherComment, setTeacherComment] = useState('');
  const [teacherScore, setTeacherScore] = useState<number>(8.5);

  const handleOpenSubmit = (task?: LearningTask) => {
    setEditingSub(null);
    setSelectedTaskId(task ? task.id : tasks[0]?.id || '');
    setFormTitle(task ? `Sản phẩm: ${task.title}` : '');
    setFormDesc('');
    setFormNotes('');
    setUploadedFiles([]);
    setExistingFiles([]);
    setShowSubmitModal(true);
  };

  const handleOpenResubmit = (sub: StudentProductSubmission) => {
    setEditingSub(sub);
    setSelectedTaskId(sub.taskId);
    setFormTitle(sub.title);
    setFormDesc(sub.description);
    setFormNotes(sub.studentNotes);
    setUploadedFiles([]);
    setExistingFiles(sub.files);
    setShowSubmitModal(true);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setUploadedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (fileId: string) => {
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmitProduct = async (status: 'DA_NOP' | 'NHAP') => {
    if (!formTitle.trim()) {
      toastService.warning('Vui lòng nhập tiêu đề sản phẩm nộp');
      return;
    }

    const task = tasks.find((t) => t.id === selectedTaskId);

    // Save new files to IndexedDB
    const newFileMetas: FileAttachmentMeta[] = [];
    for (const f of uploadedFiles) {
      const key = `SUB_FILE_${Date.now()}_${f.name}`;
      try {
        await saveFileToIndexedDB(key, f, f.name);
      } catch (err) {
        console.warn('Failed to save to IndexedDB:', err);
      }
      newFileMetas.push({
        id: key,
        name: f.name,
        size: f.size,
        type: f.type,
        extension: getFileExtension(f.name),
        indexedDbKey: key,
        previewAvailable: true,
      });
    }

    const finalFiles = [...existingFiles, ...newFileMetas];

    const submission: StudentProductSubmission = {
      id: editingSub ? editingSub.id : `SUB_${Date.now()}`,
      taskId: selectedTaskId,
      taskTitle: task?.title || 'Nhiệm vụ Hóa học',
      studentId: editingSub ? editingSub.studentId : currentStudent.id,
      studentCode: editingSub ? editingSub.studentCode : currentStudent.code,
      studentName: editingSub ? editingSub.studentName : currentStudent.fullName,
      title: formTitle.trim(),
      description: formDesc.trim(),
      studentNotes: formNotes.trim(),
      files: finalFiles,
      status: status,
      submittedAt: new Date().toLocaleString('vi-VN'),
      resubmissionCount: editingSub ? (editingSub.resubmissionCount || 0) + 1 : 0,
      cognitiveLevel: task?.cognitiveLevel || 'UNDERSTAND',
      isDemo: true,
    };

    onSaveSubmission(submission);
    setShowSubmitModal(false);
    toastService.success(status === 'NHAP' ? 'Đã lưu bản nháp thành công!' : 'Đã nộp sản phẩm học tập thành công!');
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSub) return;

    const updated: StudentProductSubmission = {
      ...feedbackSub,
      status: 'DA_NHAN_XET',
      score: teacherScore,
      teacherFeedback: {
        comment: teacherComment.trim() || 'Thầy đã xem và đánh giá bài nộp.',
        score: teacherScore,
        feedbackAt: new Date().toLocaleString('vi-VN'),
        teacherName: 'ThS. Nguyễn Hoàng Nam',
      },
    };

    onSaveSubmission(updated);
    setFeedbackSub(null);
    toastService.success('Đã gửi nhận xét và điểm đánh giá cho học sinh!');
  };

  const handleDownloadSubmissionFile = async (file: FileAttachmentMeta) => {
    if (file.indexedDbKey) {
      await downloadFileFromIndexedDB(file.indexedDbKey, file.name);
      toastService.success(`Đang tải tệp: ${file.name}`);
    } else {
      const mockBlob = new Blob([`Tệp sản phẩm học sinh: ${file.name}`], { type: 'text/plain;charset=utf-8' });
      downloadBlob(mockBlob, file.name);
      toastService.success(`Đã tải tệp: ${file.name}`);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchScope = viewScope === 'CLASS' ? true : sub.studentId === currentStudent.id;
    const matchSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || sub.status === filterStatus;
    return matchScope && matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner with Nộp bài Button */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Nộp bài & Thư viện sản phẩm học tập
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Học sinh nộp sản phẩm thí nghiệm, báo cáo Hóa học và nhận phản hồi chi tiết từ giáo viên
          </p>
        </div>

        {/* Big Prominent Nộp bài Button */}
        <button
          onClick={() => handleOpenSubmit()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Upload className="w-4 h-4" />
          <span>📤 NỘP BÀI</span>
        </button>
      </div>

      {/* Scope switch & Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewScope('MY')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                viewScope === 'MY'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bài nộp của tôi
            </button>
            <button
              onClick={() => setViewScope('CLASS')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                viewScope === 'CLASS'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Thư viện sản phẩm lớp
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, tên học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 space-y-1">
            <FileText className="w-8 h-8 mx-auto opacity-30" />
            <p className="font-semibold text-xs">Chưa có bài nộp nào trong danh mục này</p>
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const statusConfig = STATUS_CONFIG[sub.status];

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Nhiệm vụ: {sub.taskTitle}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {sub.title}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Người nộp: <strong>{sub.studentName} ({sub.studentCode})</strong></span>
                      <span>·</span>
                      <span>Thời điểm nộp: {sub.submittedAt}</span>
                      {sub.resubmissionCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600">Đã nộp lại lần {sub.resubmissionCount}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {sub.score !== undefined && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 shrink-0">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-sm">
                        {sub.score.toFixed(1)}đ
                      </span>
                    </div>
                  )}
                </div>

                {sub.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {sub.description}
                  </p>
                )}

                {sub.studentNotes && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú của học sinh: </span>
                    <span>{sub.studentNotes}</span>
                  </div>
                )}

                {/* Attached files */}
                {sub.files && sub.files.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-500">Tệp sản phẩm đính kèm:</div>
                    <div className="flex flex-wrap gap-2">
                      {sub.files.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-2 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{f.name}</span>
                          <span className="text-slate-400">({formatFileSize(f.size)})</span>
                          <button
                            onClick={() => handleDownloadSubmissionFile(f)}
                            className="p-1 hover:text-emerald-600 cursor-pointer"
                            title="Tải tệp này"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher feedback view */}
                {sub.teacherFeedback && (
                  <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-950/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        <span>Nhận xét sư phạm từ {sub.teacherFeedback.teacherName}:</span>
                      </div>
                      <span className="text-[10px] text-purple-500">{sub.teacherFeedback.feedbackAt}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {sub.teacherFeedback.comment}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {/* Resubmit for student */}
                  {userRole === 'STUDENT' && sub.studentId === currentStudent.id && (
                    <button
                      onClick={() => handleOpenResubmit(sub)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Nộp lại sản phẩm</span>
                    </button>
                  )}

                  {/* Teacher feedback button */}
                  {userRole === 'TEACHER' && (
                    <button
                      onClick={() => {
                        setFeedbackSub(sub);
                        setTeacherComment(sub.teacherFeedback?.comment || '');
                        setTeacherScore(sub.score || 8.5);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{sub.teacherFeedback ? 'Sửa nhận xét & Điểm' : 'Nhận xét & Chấm điểm'}</span>
                    </button>
                  )}

                  {/* Delete button */}
                  {(userRole === 'TEACHER' || sub.studentId === currentStudent.id) && (
                    <button
                      onClick={() => onRequestConfirmDelete(sub)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      title="Chuyển vào Thùng rác"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nộp sản phẩm học tập */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingSub ? 'Cập nhật / Nộp lại sản phẩm học tập' : 'NỘP SẢN PHẨM HỌC TẬP'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Học sinh: {currentStudent.fullName} ({currentStudent.code}) · Lớp
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn nhiệm vụ học tập *
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    const t = tasks.find((item) => item.id === e.target.value);
                    if (t && !formTitle) setFormTitle(`Sản phẩm: ${t.title}`);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} (Hạn: {t.dueDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề sản phẩm nộp *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Báo cáo thực nghiệm chuyển dịch cân bằng"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả kết quả đạt được
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Tóm tắt các bước thực hiện, hiện tượng quan sát và kết luận..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú cho giáo viên (khó khăn gặp phải, câu hỏi cần giải đáp)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ghi chú thêm nếu có..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Drag and Drop File Upload Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors space-y-2"
              >
                <Upload className="w-6 h-6 mx-auto text-emerald-600" />
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                  Kéo thả nhiều tệp vào đây, hoặc nhấn để chọn
                </div>
                <p className="text-[11px] text-slate-400">
                  Hỗ trợ Word (.docx, .doc), PDF, Excel (.xlsx, .csv), Ảnh, Video, Văn bản.
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="submission-file-input"
                />
                <label
                  htmlFor="submission-file-input"
                  className="inline-block px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer hover:bg-slate-50"
                >
                  Chọn tệp từ máy tính
                </label>
              </div>

              {/* List of files ready to upload */}
              {(existingFiles.length > 0 || uploadedFiles.length > 0) && (
                <div className="space-y-1.5">
                  <div className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                    Danh sách tệp đính kèm ({existingFiles.length + uploadedFiles.length} tệp):
                  </div>

                  {existingFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-mono truncate">{f.name}</span>
                        <span className="text-slate-400">({formatFileSize(f.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingFile(f.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {uploadedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono truncate">{f.name}</span>
                        <span className="text-slate-400">({formatFileSize(f.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedFile(i)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons: Lưu nháp & Nộp bài */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSubmitProduct('NHAP')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Lưu bản nháp
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitProduct('DA_NOP')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận Nộp bài</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Teacher Feedback */}
      {feedbackSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nhận xét & Chấm điểm sản phẩm học tập
              </h3>
              <button
                onClick={() => setFeedbackSub(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="space-y-3.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {feedbackSub.title}
                </div>
                <div className="text-[11px] text-slate-500">
                  Học sinh: {feedbackSub.studentName} ({feedbackSub.studentCode}) · Nhiệm vụ: {feedbackSub.taskTitle}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Điểm số (Thang điểm 10,0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={teacherScore}
                  onChange={(e) => setTeacherScore(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nhận xét sư phạm mang tính nâng đỡ (không gán nhãn)
                </label>
                <textarea
                  rows={4}
                  required
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  placeholder="Ghi nhận điểm tốt, chỉ rõ phần cần bổ sung và hướng khắc phục..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackSub(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-xs cursor-pointer"
                >
                  Lưu nhận xét & Điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
