import React, { useState } from 'react';
import {
  LearningMaterial,
  MaterialCategory,
  MaterialPermission,
} from '../../types';
import {
  formatFileSize,
  getFileExtension,
  isDirectPreviewSupported,
  saveFileToIndexedDB,
  downloadFileFromIndexedDB,
  downloadBlob,
} from '../../utils/indexedDbStorage';
import { toastService } from '../../services/toastService';
import {
  FileText,
  FileSpreadsheet,
  Video,
  Music,
  Image as ImageIcon,
  FolderArchive,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Lock,
  Users,
  AlertCircle,
  FileCode,
} from 'lucide-react';

interface MaterialsTabProps {
  userRole: 'TEACHER' | 'STUDENT';
  materials: LearningMaterial[];
  onSaveMaterial: (material: LearningMaterial) => void;
  onRequestConfirmDelete: (material: LearningMaterial) => void;
  onLogDownload: (material: LearningMaterial) => void;
  onLogView: (material: LearningMaterial) => void;
}

const CATEGORY_NAMES: Record<MaterialCategory, string> = {
  HOC_TAP: 'Học tập',
  BAI_TAP: 'Bài tập',
  DE_CUONG: 'Đề cương',
  ON_TAP: 'Ôn tập',
  THAM_KHAO: 'Tham khảo',
  VIDEO: 'Video thí nghiệm',
  AM_THANH: 'Âm thanh podcast',
  DU_LIEU: 'Dữ liệu thực nghiệm',
  KHAC: 'Khác',
};

const PERMISSION_NAMES: Record<MaterialPermission, { name: string; badge: string }> = {
  TOAN_LOP: { name: 'Toàn lớp', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  CHI_XEM: { name: 'Chỉ xem', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  CHINH_SUA: { name: 'Chỉnh sửa', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  CONG_TAC_NHOM: { name: 'Cộng tác nhóm', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
};

export const MaterialsTab: React.FC<MaterialsTabProps> = ({
  userRole,
  materials,
  onSaveMaterial,
  onRequestConfirmDelete,
  onLogDownload,
  onLogView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState<LearningMaterial | null>(null);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MaterialCategory>('HOC_TAP');
  const [formSubject, setFormSubject] = useState('Hóa học');
  const [formTopic, setFormTopic] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPermission, setFormPermission] = useState<MaterialPermission>('TOAN_LOP');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-5 h-5 text-blue-600" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (['ppt', 'pptx'].includes(ext)) return <FileText className="w-5 h-5 text-amber-600" />;
    if (['mp4', 'webm', 'mov'].includes(ext)) return <Video className="w-5 h-5 text-rose-600" />;
    if (['mp3', 'wav', 'm4a'].includes(ext)) return <Music className="w-5 h-5 text-indigo-600" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon className="w-5 h-5 text-teal-600" />;
    if (['zip', 'rar'].includes(ext)) return <FolderArchive className="w-5 h-5 text-amber-700" />;
    return <FileCode className="w-5 h-5 text-slate-500" />;
  };

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormTitle('');
    setFormCategory('HOC_TAP');
    setFormSubject('Hóa học');
    setFormTopic('Chương 1: Cân bằng hóa học');
    setFormDesc('');
    setFormPermission('TOAN_LOP');
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (mat: LearningMaterial) => {
    setEditingMaterial(mat);
    setFormTitle(mat.title);
    setFormCategory(mat.category);
    setFormSubject(mat.subject);
    setFormTopic(mat.topic);
    setFormDesc(mat.description);
    setFormPermission(mat.permission);
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        toastService.error('Dung lượng tệp vượt quá 50MB. Vui lòng nén hoặc giảm dung lượng!');
        return;
      }
      setSelectedFile(file);
      if (!formTitle) {
        setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toastService.warning('Vui lòng nhập tiêu đề tài liệu');
      return;
    }

    let fileMeta = editingMaterial?.fileMeta;

    if (selectedFile) {
      const fileKey = `FILE_${Date.now()}_${selectedFile.name}`;
      try {
        await saveFileToIndexedDB(fileKey, selectedFile, selectedFile.name);
      } catch (err) {
        console.warn('Could not save to IndexedDB, fallback memory:', err);
      }
      const previewMeta = isDirectPreviewSupported(selectedFile.name);
      fileMeta = {
        id: fileKey,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        extension: getFileExtension(selectedFile.name),
        indexedDbKey: fileKey,
        previewAvailable: previewMeta.supported,
      };
    } else if (!fileMeta) {
      fileMeta = {
        id: `FILE_${Date.now()}`,
        name: `${formTitle}.pdf`,
        size: 1024 * 512,
        type: 'application/pdf',
        extension: 'pdf',
        previewAvailable: true,
      };
    }

    const newMaterial: LearningMaterial = {
      id: editingMaterial ? editingMaterial.id : `MAT_${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      subject: formSubject.trim() || 'Hóa học',
      topic: formTopic.trim() || 'Hóa học 11',
      description: formDesc.trim(),
      permission: formPermission,
      fileMeta,
      uploadedBy: editingMaterial ? editingMaterial.uploadedBy : 'ThS. Nguyễn Hoàng Nam',
      uploadedAt: editingMaterial ? editingMaterial.uploadedAt : new Date().toLocaleString('vi-VN'),
      downloadCount: editingMaterial ? editingMaterial.downloadCount : 0,
      isDemo: true,
    };

    onSaveMaterial(newMaterial);
    setShowModal(false);
    toastService.success(editingMaterial ? 'Đã cập nhật tài liệu!' : 'Đã thêm tài liệu mới vào Kho!');
  };

  const handleDownload = async (mat: LearningMaterial) => {
    onLogDownload(mat);
    if (mat.fileMeta.indexedDbKey) {
      await downloadFileFromIndexedDB(mat.fileMeta.indexedDbKey, mat.fileMeta.name);
      toastService.success(`Đang tải xuống: ${mat.fileMeta.name}`);
    } else {
      const mockBlob = new Blob(
        [`Tài liệu học tập: ${mat.title}\nChủ đề: ${mat.topic}\nMôn: ${mat.subject}\nNgày tải: ${new Date().toLocaleString('vi-VN')}`],
        { type: 'text/plain;charset=utf-8' }
      );
      downloadBlob(mockBlob, mat.fileMeta.name);
      toastService.success(`Đã tải xuống: ${mat.fileMeta.name}`);
    }
  };

  const handlePreview = (mat: LearningMaterial) => {
    onLogView(mat);
    setPreviewMaterial(mat);
  };

  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileMeta.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'ALL' || m.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      {/* Search & Categories Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu, đề cương, video..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">Tất cả phân loại (9 mục)</option>
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>

          {userRole === 'TEACHER' && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm tài liệu mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 space-y-1">
            <FolderArchive className="w-8 h-8 mx-auto opacity-30" />
            <p className="font-semibold text-xs">Chưa có tài liệu nào trong danh mục này</p>
          </div>
        ) : (
          filteredMaterials.map((mat) => {
            const perm = PERMISSION_NAMES[mat.permission];
            const previewInfo = isDirectPreviewSupported(mat.fileMeta.name);

            return (
              <div
                key={mat.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getFileIcon(mat.fileMeta.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {CATEGORY_NAMES[mat.category]}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${perm.badge}`}>
                          {perm.name}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1 line-clamp-2 leading-snug">
                        {mat.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {mat.description || 'Tài liệu học tập bổ trợ chuyên đề Hóa học 11.'}
                  </p>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 font-mono flex items-center justify-between">
                    <span className="truncate max-w-[180px]">{mat.fileMeta.name}</span>
                    <span className="shrink-0 text-slate-400">{formatFileSize(mat.fileMeta.size)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="text-[11px] text-slate-400">
                    {mat.downloadCount} lượt tải
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePreview(mat)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={previewInfo.supported ? 'Xem trực tiếp tài liệu' : 'Xem thông tin file'}
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                    </button>

                    <button
                      onClick={() => handleDownload(mat)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors"
                      title="Tải về máy tính"
                    >
                      <Download className="w-3 h-3" />
                      <span>Tải về</span>
                    </button>

                    {userRole === 'TEACHER' && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(mat)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer transition-colors"
                          title="Chỉnh sửa tài liệu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRequestConfirmDelete(mat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                          title="Chuyển vào Thùng rác"
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

      {/* Preview Modal: PDF, Images, Videos, Audio vs Office Documents */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                {getFileIcon(previewMaterial.fileMeta.name)}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {previewMaterial.title}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    {previewMaterial.fileMeta.name} · {formatFileSize(previewMaterial.fileMeta.size)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              {/* Check preview type */}
              {(() => {
                const preview = isDirectPreviewSupported(previewMaterial.fileMeta.name);
                if (preview.type === 'OFFICE_DOWNLOAD_ONLY') {
                  return (
                    <div className="p-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm mx-auto flex items-center justify-center">
                        {getFileIcon(previewMaterial.fileMeta.name)}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          Tệp văn bản Microsoft Office ({previewMaterial.fileMeta.extension.toUpperCase()})
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                          Theo nguyên tắc kỹ thuật, trình duyệt không giả lập hiển thị trực tiếp file Word/Excel/PowerPoint.
                          Thầy/cô và học sinh vui lòng nhấn nút tải bên dưới để mở bằng phần mềm chuyên dụng.
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(previewMaterial)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Tải tệp {previewMaterial.fileMeta.name}</span>
                      </button>
                    </div>
                  );
                }

                // If PDF, image or video/audio
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Nội dung tóm lược:</div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {previewMaterial.description}
                      </p>
                      <div className="text-[11px] text-slate-400">
                        Chủ đề: {previewMaterial.topic} · Quyền: {PERMISSION_NAMES[previewMaterial.permission].name}
                      </div>
                    </div>
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                      <div className="text-emerald-600 font-semibold text-xs">
                        ✓ Tệp {previewMaterial.fileMeta.name} đã sẵn sàng
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Hỗ trợ mở trực tiếp hoặc tải về máy tính để nghiên cứu ngoại tuyến.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400">
                Đăng bởi: {previewMaterial.uploadedBy}
              </span>
              <button
                onClick={() => handleDownload(previewMaterial)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải về</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingMaterial ? 'Chỉnh sửa tài liệu học tập' : 'Tải lên tài liệu học tập mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề tài liệu *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Đề cương ôn tập giữa kỳ Hóa học 11"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phân loại danh mục
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MaterialCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                  >
                    {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quyền hạn truy cập
                  </label>
                  <select
                    value={formPermission}
                    onChange={(e) => setFormPermission(e.target.value as MaterialPermission)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                  >
                    <option value="TOAN_LOP">Toàn lớp</option>
                    <option value="CHI_XEM">Chỉ xem</option>
                    <option value="CHINH_SUA">Chỉnh sửa</option>
                    <option value="CONG_TAC_NHOM">Cộng tác nhóm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chủ đề / Chuyên đề
                </label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Ví dụ: Cân bằng hóa học và nguyên lý Le Chatelier"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả tài liệu
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ghi chú nội dung chính và cách sử dụng..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Real File Input */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Chọn tệp từ máy tính (Word, PDF, Excel, PPT, Video, Audio, Ảnh...)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.webm,.mov,.mp3,.wav,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip,.rar"
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {selectedFile && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center justify-between">
                    <span>Đã chọn: {selectedFile.name}</span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  {editingMaterial ? 'Lưu thay đổi' : 'Tải lên tài liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
