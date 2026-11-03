import React, { useState } from 'react';
import {
  LearningTask,
  Student,
  COGNITIVE_LEVEL_META,
  CognitiveLevel,
  WARNING_LEVEL_DEFINITIONS,
  WarningLevel,
} from '../../types';
import {
  Plus,
  Calendar,
  Clock,
  BookOpen,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Paperclip,
  CheckCircle2,
  Search,
  Filter,
  FileText,
} from 'lucide-react';
import { toastService } from '../../services/toastService';

interface TasksTabProps {
  userRole: 'TEACHER' | 'STUDENT';
  tasks: LearningTask[];
  onSaveTask: (task: LearningTask) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenSubmitModal: (task: LearningTask) => void;
  onRequestConfirmDelete: (task: LearningTask) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  userRole,
  tasks,
  onSaveTask,
  onDeleteTask,
  onOpenSubmitModal,
  onRequestConfirmDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal create/edit task state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<LearningTask | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Hóa học');
  const [formTopic, setFormTopic] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formReq, setFormReq] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCognitiveLevel, setFormCognitiveLevel] = useState<CognitiveLevel>('UNDERSTAND');
  const [formSupportLevel, setFormSupportLevel] = useState<WarningLevel>(0);
  const [formStatus, setFormStatus] = useState<LearningTask['status']>('DANG_THUC_HIEN');
  const [formAccepting, setFormAccepting] = useState(true);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormSubject('Hóa học');
    setFormTopic('Chương 1: Cân bằng hóa học');
    setFormDesc('');
    setFormReq('');
    setFormDueDate('15/10/2026');
    setFormCognitiveLevel('UNDERSTAND');
    setFormSupportLevel(0);
    setFormStatus('DANG_THUC_HIEN');
    setFormAccepting(true);
    setShowTaskModal(true);
  };

  const handleOpenEdit = (task: LearningTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormSubject(task.subject || 'Hóa học');
    setFormTopic(task.topic);
    setFormDesc(task.description);
    setFormReq(task.requirements);
    setFormDueDate(task.dueDate);
    setFormCognitiveLevel(task.cognitiveLevel || 'UNDERSTAND');
    setFormSupportLevel(task.supportLevelTarget ?? 0);
    setFormStatus(task.status);
    setFormAccepting(task.isAcceptingSubmissions);
    setShowTaskModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toastService.warning('Vui lòng nhập tên nhiệm vụ học tập');
      return;
    }

    const newTask: LearningTask = {
      id: editingTask ? editingTask.id : `TASK_${Date.now()}`,
      classId: 'LOP_11A1',
      subject: formSubject.trim() || 'Hóa học',
      topic: formTopic.trim() || 'Hóa học 11',
      title: formTitle.trim(),
      description: formDesc.trim(),
      requirements: formReq.trim(),
      dueDate: formDueDate.trim() || '15/10/2026',
      assignedDate: editingTask ? editingTask.assignedDate : new Date().toLocaleDateString('vi-VN'),
      attachments: editingTask ? editingTask.attachments : [
        { id: `ATT_${Date.now()}`, name: 'Huong_dan_nhiem_vu.pdf', size: 1024 * 320, type: 'application/pdf', extension: 'pdf', previewAvailable: true }
      ],
      cognitiveLevel: formCognitiveLevel,
      supportLevelTarget: formSupportLevel,
      status: formStatus,
      isAcceptingSubmissions: formAccepting,
      createdAt: editingTask ? editingTask.createdAt : new Date().toLocaleString('vi-VN'),
      isDemo: true,
    };

    onSaveTask(newTask);
    setShowTaskModal(false);
    toastService.success(editingTask ? 'Đã cập nhật nhiệm vụ thành công!' : 'Đã tạo nhiệm vụ mới thành công!');
  };

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = filterLevel === 'ALL' || t.cognitiveLevel === filterLevel;
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchLevel && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhiệm vụ, chủ đề Hóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="ALL">Tất cả mức nhận thức</option>
            <option value="KNOW">Mức BIẾT</option>
            <option value="UNDERSTAND">Mức HIỂU</option>
            <option value="APPLY">Mức VẬN DỤNG</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DANG_THUC_HIEN">Đang thực hiện</option>
            <option value="SAP_DEN_HAN">Sắp đến hạn</option>
            <option value="QUA_HAN">Quá hạn</option>
            <option value="DA_HOAN_THANH">Đã hoàn thành</option>
          </select>

          {userRole === 'TEACHER' && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao nhiệm vụ mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 space-y-1">
            <BookOpen className="w-8 h-8 mx-auto opacity-30" />
            <p className="font-semibold text-xs">Không tìm thấy nhiệm vụ nào phù hợp</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const cogMeta = COGNITIVE_LEVEL_META[task.cognitiveLevel || 'UNDERSTAND'];
            const supportMeta = WARNING_LEVEL_DEFINITIONS[task.supportLevelTarget || 0];

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${cogMeta.badgeClass}`}>
                        {cogMeta.name}
                      </span>
                      {task.supportLevelTarget !== undefined && task.supportLevelTarget > 0 && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${supportMeta.badgeBg}`}>
                          Giao theo {supportMeta.name}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        Môn: {task.subject} · {task.topic}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Hạn: {task.dueDate}</span>
                    </span>

                    {task.isAcceptingSubmissions ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Unlock className="w-3 h-3 text-emerald-500" />
                        Đang mở nhận bài
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <Lock className="w-3 h-3 text-rose-500" />
                        Đã khóa nhận bài
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {task.description}
                </p>

                {task.requirements && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 border border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">Yêu cầu cụ thể:</div>
                    <div className="whitespace-pre-line leading-relaxed">{task.requirements}</div>
                  </div>
                )}

                {/* Attachments & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    {task.attachments.length > 0 ? (
                      task.attachments.map((att) => (
                        <span
                          key={att.id}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300"
                        >
                          {att.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px]">Không có đính kèm</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Student Action: Nộp bài */}
                    {task.isAcceptingSubmissions && (
                      <button
                        onClick={() => onOpenSubmitModal(task)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer transition-colors"
                      >
                        <span>📤 Nộp bài</span>
                      </button>
                    )}

                    {/* Teacher Edit & Delete */}
                    {userRole === 'TEACHER' && (
                      <>
                        <button
                          onClick={() => {
                            const updated = {
                              ...task,
                              isAcceptingSubmissions: !task.isAcceptingSubmissions,
                            };
                            onSaveTask(updated);
                            toastService.info(`Đã ${updated.isAcceptingSubmissions ? 'mở' : 'khóa'} nhận bài cho "${task.title}"`);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
                          title={task.isAcceptingSubmissions ? 'Khóa nhận bài' : 'Mở nhận bài'}
                        >
                          {task.isAcceptingSubmissions ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer transition-colors"
                          title="Chỉnh sửa nhiệm vụ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onRequestConfirmDelete(task)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                          title="Xóa nhiệm vụ vào Thùng rác"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingTask ? 'Chỉnh sửa nhiệm vụ học tập' : 'Giao nhiệm vụ học tập mới'}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên nhiệm vụ học tập *
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Môn học
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chủ đề / Bài học
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Ví dụ: Cân bằng hóa học"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mức độ nhận thức *
                  </label>
                  <select
                    value={formCognitiveLevel}
                    onChange={(e) => setFormCognitiveLevel(e.target.value as CognitiveLevel)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <option value="KNOW">KNOW — BIẾT (Nhận biết)</option>
                    <option value="UNDERSTAND">UNDERSTAND — HIỂU (Thông hiểu)</option>
                    <option value="APPLY">APPLY — VẬN DỤNG</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn nộp bài
                  </label>
                  <input
                    type="text"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    placeholder="Ví dụ: 15/10/2026"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mức hỗ trợ học sinh mục tiêu (Cá nhân hóa)
                </label>
                <select
                  value={formSupportLevel}
                  onChange={(e) => setFormSupportLevel(Number(e.target.value) as WarningLevel)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                >
                  <option value={0}>Mức 0 — Cả lớp (Chung)</option>
                  <option value={1}>Mức 1 — Nhóm theo dõi (Hỗ trợ định hướng)</option>
                  <option value={2}>Mức 2 — Nhóm cần hỗ trợ (Vi phân 15 phút)</option>
                  <option value={3}>Mức 3 — Nhóm cần trao đổi trực tiếp</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả nhiệm vụ
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mô tả bối cảnh và mục tiêu học tập..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Yêu cầu nộp bài
                </label>
                <textarea
                  rows={2}
                  value={formReq}
                  onChange={(e) => setFormReq(e.target.value)}
                  placeholder="Ví dụ: Đính kèm file Word hoặc ảnh chụp bài làm..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  {editingTask ? 'Lưu thay đổi' : 'Giao nhiệm vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
