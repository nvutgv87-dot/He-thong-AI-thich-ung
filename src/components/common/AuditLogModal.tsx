/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, History, Filter } from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditLogModalProps {
  logs: AuditLog[];
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ logs, onClose }) => {
  const [filterRole, setFilterRole] = useState<'ALL' | 'GIÁO_VIÊN' | 'HỆ_THỐNG' | 'HỌC_SINH'>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterRole === 'ALL') return true;
    return log.actorRole === filterRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Nhật ký kiểm toán hệ thống (Audit Trail)
              </h2>
              <p className="text-xs text-slate-500">
                Minh bạch lịch sử xem, chỉnh sửa dữ liệu, quyết định sư phạm và đề xuất AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc theo tác nhân:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterRole('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                filterRole === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tất cả ({logs.length})
            </button>
            <button
              onClick={() => setFilterRole('GIÁO_VIÊN')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                filterRole === 'GIÁO_VIÊN'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Giáo viên
            </button>
            <button
              onClick={() => setFilterRole('HỆ_THỐNG')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                filterRole === 'HỆ_THỐNG'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hệ thống AI
            </button>
          </div>
        </div>

        {/* Log Entries Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredLogs.map((log) => {
            const isSystem = log.actorRole === 'HỆ_THỐNG';
            return (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${
                      isSystem
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                    }`}
                  >
                    {log.action}
                  </span>
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {log.details}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span>Tác nhân: {log.actorName}</span>
                      <span>·</span>
                      <span>Vai trò: {log.actorRole}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono shrink-0 sm:text-right">
                  {log.timestamp}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center">
          Nhật ký được lưu trữ tự động trên thiết bị và mã hóa trong các bản xuất sao lưu JSON.
        </div>
      </div>
    </div>
  );
};
