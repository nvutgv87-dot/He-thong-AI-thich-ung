import React, { useState, useEffect } from 'react';
import {
  Student,
  LearningTask,
  LearningMaterial,
  StudentProductSubmission,
  DiscussionPost,
  DiscussionComment,
  TrashItem,
} from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { ProgressTab } from './ProgressTab';
import { TasksTab } from './TasksTab';
import { MaterialsTab } from './MaterialsTab';
import { SubmissionsTab } from './SubmissionsTab';
import { DiscussionsTab } from './DiscussionsTab';
import { TrashBinModal } from '../common/TrashBinModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  TrendingUp,
  CheckSquare,
  FolderArchive,
  UploadCloud,
  MessageSquare,
  BookOpen,
  Trash2,
  Sparkles,
  Users,
  Shield,
  Layers,
} from 'lucide-react';

export type LearningCornerTab =
  | 'PROGRESS'
  | 'TASKS'
  | 'MATERIALS'
  | 'SUBMISSIONS'
  | 'DISCUSSIONS';

interface LearningCornerViewProps {
  userRole: 'TEACHER' | 'STUDENT';
  students: Student[];
  currentStudent: Student;
  onRefreshData?: () => void;
}

export const LearningCornerView: React.FC<LearningCornerViewProps> = ({
  userRole,
  students,
  currentStudent,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<LearningCornerTab>('PROGRESS');

  // Core learning corner state
  const [tasks, setTasks] = useState<LearningTask[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [submissions, setSubmissions] = useState<StudentProductSubmission[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);

  // Modals state
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{
    type: 'TASK' | 'MATERIAL' | 'SUBMISSION' | 'DISCUSSION_POST' | 'DISCUSSION_COMMENT';
    id: string;
    postId?: string;
    title: string;
  } | null>(null);

  // Sync state from storage
  const loadData = () => {
    setTasks(storageService.getLearningTasks());
    setMaterials(storageService.getLearningMaterials());
    setSubmissions(storageService.getProductSubmissions());
    setDiscussions(storageService.getDiscussions());
    setTrashItems(storageService.getTrashItems());
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers for Tasks ---
  const handleSaveTask = (task: LearningTask) => {
    storageService.saveLearningTask(task);
    loadData();
    onRefreshData?.();
  };

  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    setDeleteCandidate({
      type: 'TASK',
      id: target.id,
      title: target.title,
    });
  };

  // --- Handlers for Materials ---
  const handleSaveMaterial = (material: LearningMaterial) => {
    storageService.saveLearningMaterial(material);
    loadData();
    onRefreshData?.();
  };

  const handleLogDownload = (material: LearningMaterial) => {
    storageService.logLearningEvent({
      studentId: currentStudent.id,
      studentCode: currentStudent.code || 'HS04',
      eventType: 'DOWNLOAD_MATERIAL',
      title: `Tải tài liệu: ${material.title}`,
      details: `Định dạng ${material.fileMeta?.extension || 'file'}, dung lượng ${material.fileMeta?.size ? Math.round(material.fileMeta.size / 1024) + ' KB' : '0 KB'}`,
      metadata: { materialId: material.id, fileName: material.fileMeta?.name },
    });
  };

  const handleLogView = (material: LearningMaterial) => {
    storageService.logLearningEvent({
      studentId: currentStudent.id,
      studentCode: currentStudent.code || 'HS04',
      eventType: 'VIEW_DOCUMENT',
      title: `Xem tài liệu trực tiếp: ${material.title}`,
      details: `Chuyên mục ${material.category} - ${material.topic}`,
      metadata: { materialId: material.id },
    });
  };

  // --- Handlers for Submissions ---
  const handleSaveSubmission = (submission: StudentProductSubmission) => {
    storageService.saveProductSubmission(submission);

    // If submitted, log real learning event
    if (submission.status === 'DA_NOP') {
      const task = tasks.find((t) => t.id === submission.taskId);
      const isLate = task && task.dueDate ? new Date() > new Date(task.dueDate) : false;

      storageService.logLearningEvent({
        studentId: submission.studentId,
        studentCode: submission.studentCode || 'HS04',
        eventType: isLate ? 'LATE_SUBMIT' : 'SUBMIT_ASSIGNMENT',
        title: `Nộp sản phẩm: ${submission.title}`,
        details: `Nhiệm vụ: ${submission.taskTitle}. Số file: ${submission.files?.length || 0}`,
        metadata: {
          taskId: submission.taskId,
          submissionId: submission.id,
          isLate,
        },
      });
    }

    loadData();
    onRefreshData?.();
  };

  // --- Handlers for Discussions ---
  const handleSavePost = (post: DiscussionPost) => {
    const existing = discussions.find((p) => p.id === post.id);
    if (existing) {
      storageService.updateDiscussionPost(post);
    } else {
      storageService.addDiscussionPost(post);
      storageService.logLearningEvent({
        studentId: userRole === 'TEACHER' ? 'GV' : currentStudent.id,
        studentCode: userRole === 'TEACHER' ? 'GV' : (currentStudent.code || 'HS04'),
        eventType: 'JOIN_DISCUSSION',
        title: `Đăng bài thảo luận: ${post.title}`,
        details: `Chủ đề: ${post.topic || 'Hóa học'}`,
        metadata: { postId: post.id },
      });
    }
    loadData();
  };

  const handleAddComment = (postId: string, comment: DiscussionComment) => {
    storageService.addDiscussionComment(postId, comment);
    storageService.logLearningEvent({
      studentId: userRole === 'TEACHER' ? 'GV' : currentStudent.id,
      studentCode: userRole === 'TEACHER' ? 'GV' : (currentStudent.code || 'HS04'),
      eventType: 'JOIN_DISCUSSION',
      title: `Bình luận thảo luận`,
      details: comment.content.slice(0, 60),
      metadata: { postId, commentId: comment.id },
    });
    loadData();
  };

  // --- Confirm Delete and Move to Trash ---
  const executeConfirmDelete = () => {
    if (!deleteCandidate) return;

    const actor = userRole === 'TEACHER' ? 'Giáo viên' : currentStudent.fullName;

    switch (deleteCandidate.type) {
      case 'TASK':
        storageService.deleteLearningTask(deleteCandidate.id, actor);
        toastService.success(`Đã chuyển nhiệm vụ "${deleteCandidate.title}" vào Thùng rác.`);
        break;
      case 'MATERIAL':
        storageService.deleteLearningMaterial(deleteCandidate.id, actor);
        toastService.success(`Đã chuyển tài liệu "${deleteCandidate.title}" vào Thùng rác.`);
        break;
      case 'SUBMISSION':
        storageService.deleteProductSubmission(deleteCandidate.id, actor);
        toastService.success(`Đã chuyển bài nộp "${deleteCandidate.title}" vào Thùng rác.`);
        break;
      case 'DISCUSSION_POST':
        storageService.deleteDiscussionPost(deleteCandidate.id, actor);
        toastService.success(`Đã chuyển bài thảo luận "${deleteCandidate.title}" vào Thùng rác.`);
        break;
      case 'DISCUSSION_COMMENT':
        if (deleteCandidate.postId) {
          storageService.deleteDiscussionComment(deleteCandidate.postId, deleteCandidate.id, actor);
          toastService.success(`Đã xóa bình luận vào Thùng rác.`);
        }
        break;
    }

    setDeleteCandidate(null);
    loadData();
    onRefreshData?.();
  };

  // --- Trash Restore & Permanent Delete ---
  const handleRestoreFromTrash = (item: TrashItem) => {
    const success = storageService.restoreFromTrash(item.id);
    if (success) {
      toastService.success(`Đã khôi phục thành công "${item.title}".`);
      loadData();
      onRefreshData?.();
    } else {
      toastService.error(`Không thể khôi phục mục này.`);
    }
  };

  const handlePermanentlyDelete = (itemId: string) => {
    storageService.deleteFromTrashPermanently(itemId);
    toastService.info('Đã xóa vĩnh viễn mục đã chọn khỏi Thùng rác.');
    loadData();
  };

  const handleEmptyTrash = () => {
    storageService.emptyTrash();
    toastService.info('Đã làm trống Thùng rác hoàn toàn.');
    loadData();
  };

  const TABS: { id: LearningCornerTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    {
      id: 'PROGRESS',
      label: 'Tiến độ học tập',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'TASKS',
      label: 'Nhiệm vụ',
      icon: <CheckSquare className="w-4 h-4" />,
      badgeCount: tasks.filter((t) => t.status === 'DANG_THUC_HIEN').length,
    },
    {
      id: 'MATERIALS',
      label: 'Kho tài liệu',
      icon: <FolderArchive className="w-4 h-4" />,
      badgeCount: materials.length,
    },
    {
      id: 'SUBMISSIONS',
      label: 'Nộp bài',
      icon: <UploadCloud className="w-4 h-4" />,
      badgeCount: submissions.filter((s) => s.status === 'DA_NOP').length,
    },
    {
      id: 'DISCUSSIONS',
      label: 'Thảo luận',
      icon: <MessageSquare className="w-4 h-4" />,
      badgeCount: discussions.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Góc học tập thích ứng · Lớp
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Phân hóa 3 Mức nhận thức
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
              Không gian quản lý nhiệm vụ, nộp sản phẩm đa định dạng, kho tài liệu học liệu số và thảo luận lớp học bám sát chuẩn chương trình SGK Kết nối tri thức.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Submit Button */}
          <button
            onClick={() => setActiveTab('SUBMISSIONS')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>📤 NỘP BÀI</span>
          </button>

          {/* Trash Bin Button */}
          <button
            onClick={() => setIsTrashOpen(true)}
            className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Thùng rác hệ thống (Khôi phục dữ liệu)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Thùng rác</span>
            {trashItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {trashItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 5 Tabs Navigation Bar (Scrollable on mobile) */}
      <div className="relative">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none border border-slate-200/60 dark:border-slate-700/60 touch-pan-x overscroll-x-contain">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="transition-all">
        {activeTab === 'PROGRESS' && (
          <ProgressTab
            userRole={userRole}
            students={students}
            currentStudent={currentStudent}
            tasks={tasks}
            submissions={submissions}
          />
        )}

        {activeTab === 'TASKS' && (
          <TasksTab
            userRole={userRole}
            tasks={tasks}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            onOpenSubmitModal={() => setActiveTab('SUBMISSIONS')}
            onRequestConfirmDelete={(task) =>
              setDeleteCandidate({
                type: 'TASK',
                id: task.id,
                title: task.title,
              })
            }
          />
        )}

        {activeTab === 'MATERIALS' && (
          <MaterialsTab
            userRole={userRole}
            materials={materials}
            onSaveMaterial={handleSaveMaterial}
            onRequestConfirmDelete={(mat) =>
              setDeleteCandidate({
                type: 'MATERIAL',
                id: mat.id,
                title: mat.title,
              })
            }
            onLogDownload={handleLogDownload}
            onLogView={handleLogView}
          />
        )}

        {activeTab === 'SUBMISSIONS' && (
          <SubmissionsTab
            userRole={userRole}
            submissions={submissions}
            tasks={tasks}
            currentStudent={currentStudent}
            onSaveSubmission={handleSaveSubmission}
            onRequestConfirmDelete={(sub) =>
              setDeleteCandidate({
                type: 'SUBMISSION',
                id: sub.id,
                title: sub.title,
              })
            }
          />
        )}

        {activeTab === 'DISCUSSIONS' && (
          <DiscussionsTab
            userRole={userRole}
            currentStudent={currentStudent}
            posts={discussions}
            onSavePost={handleSavePost}
            onDeletePost={(postId) => {
              const target = discussions.find((p) => p.id === postId);
              if (target) {
                setDeleteCandidate({
                  type: 'DISCUSSION_POST',
                  id: target.id,
                  title: target.title,
                });
              }
            }}
            onAddComment={handleAddComment}
            onDeleteComment={(postId, commentId) => {
              setDeleteCandidate({
                type: 'DISCUSSION_COMMENT',
                id: commentId,
                postId,
                title: 'Bình luận thảo luận',
              });
            }}
            onRequestConfirmDelete={(item) =>
              setDeleteCandidate({
                type: item.type === 'POST' ? 'DISCUSSION_POST' : 'DISCUSSION_COMMENT',
                id: item.id,
                postId: item.postId,
                title: item.title,
              })
            }
          />
        )}
      </div>

      {/* In-App Confirmation Modal (Replaces window.confirm) */}
      <ConfirmModal
        isOpen={deleteCandidate !== null}
        title={`Xác nhận chuyển vào Thùng rác`}
        message={`Bạn có chắc chắn muốn xóa "${deleteCandidate?.title || ''}"? Mục này sẽ được chuyển vào Thùng rác an toàn và thầy/cô có thể khôi phục lại bất kỳ lúc nào.`}
        confirmText="Xác nhận xóa vào Thùng rác"
        cancelText="Hủy bỏ"
        type="DANGER"
        onConfirm={executeConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />

      {/* Trash Bin Modal */}
      <TrashBinModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        trashItems={trashItems}
        onRestore={handleRestoreFromTrash}
        onPermanentlyDelete={handlePermanentlyDelete}
        onEmptyTrash={handleEmptyTrash}
      />
    </div>
  );
};
