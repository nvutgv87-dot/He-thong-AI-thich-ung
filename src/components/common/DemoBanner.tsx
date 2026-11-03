/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, RotateCcw, ShieldCheck } from 'lucide-react';

interface DemoBannerProps {
  onResetDemo: () => void;
  privacyMode: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onResetDemo, privacyMode }) => {
  return (
    <div className="bg-slate-900 text-slate-200 text-xs px-4 py-2 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            DEMO DATA
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">
            Hệ thống hỗ trợ ra quyết định sư phạm THPT. Dữ liệu thử nghiệm phản ánh 5 kịch bản thực tế.
          </span>
          {privacyMode && (
            <>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Mã hóa danh tính (Privacy Mode: ON)
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 hidden sm:inline">
            Không chẩn đoán y khoa · Không gán nhãn học sinh
          </span>
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Khôi phục lại 8 hồ sơ học sinh mẫu chuẩn"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại dữ liệu mẫu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
