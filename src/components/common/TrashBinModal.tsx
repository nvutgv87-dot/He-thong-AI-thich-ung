import React from 'react';
import { TrashItem } from '../../types';
import { Trash2, RotateCcw, X, AlertCircle } from 'lucide-react';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: TrashItem[];
  onRestore: (item: TrashItem) => void;
  onPermanentlyDelete: (itemId: string) => void;
  onEmptyTrash: () => void;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  trashItems,
  onRestore,
  onPermanentlyDelete,
  onEmptyTrash,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Thùng rác hệ thống (Khôi phục dữ liệu)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Các mục đã xóa sẽ được lưu trữ an toàn tại đây và có thể khôi phục bất cứ lúc nào
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {trashItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Trash2 className="w-8 h-8 mx-auto opacity-30" />
              <p className="font-medium text-xs">Thùng rác hiện đang trống</p>
              <p className="text-[11px] text-slate-500">Mọi thao tác xóa bài, tài liệu, nhiệm vụ sẽ chuyển vào đây để bảo toàn dữ liệu sư phạm.</p>
            </div>
          ) : (
            trashItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.itemTypeName}
                    </span>
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>Xóa lúc: {new Date(item.deletedAt).toLocaleString('vi-VN')}</span>
                    <span>·</span>
                    <span>Bởi: {item.deletedBy}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRestore(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                    title="Khôi phục lại mục này"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục</span>
                  </button>
                  <button
                    onClick={() => onPermanentlyDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                    title="Xóa vĩnh viễn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Tổng cộng: {trashItems.length} mục trong thùng rác</span>
          </div>
          <div className="flex items-center gap-2">
            {trashItems.length > 0 && (
              <button
                onClick={onEmptyTrash}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
              >
                Dọn sạch thùng rác
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
