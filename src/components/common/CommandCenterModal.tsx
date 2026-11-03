/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  X,
  AlertTriangle,
  Lightbulb,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { ActiveView } from './Header';

interface CommandCenterModalProps {
  onClose: () => void;
  onNavigate: (view: ActiveView, studentId?: string) => void;
}

interface CommandAction {
  id: string;
  title: string;
  description: string;
  view: ActiveView;
  category: 'QUAN_SÁT' | 'CAN_THIỆP' | 'BÁO_CÁO' | 'DỮ_LIỆU';
  icon: React.ReactNode;
}

export const CommandCenterModal: React.FC<CommandCenterModalProps> = ({
  onClose,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const COMMANDS: CommandAction[] = [
    {
      id: 'cmd_1',
      title: 'Xem học sinh cần quan sát thêm',
      description: 'Lọc danh sách học sinh đang có tín hiệu thay đổi (Mức 1 & Mức 2)',
      view: 'DASHBOARD',
      category: 'QUAN_SÁT',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'cmd_2',
      title: 'Phân tích tiến độ học tập và nề nếp của lớp',
      description: 'Xem biểu đồ chuỗi thời gian 6 tuần của cả lớp',
      view: 'DASHBOARD',
      category: 'QUAN_SÁT',
      icon: <Clock className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'cmd_3',
      title: 'Xem học sinh có nhiệm vụ nộp muộn / quá hạn',
      description: 'Kiểm tra chi tiết nộp bài tập tuần 4 và tuần 5',
      view: 'STUDENTS',
      category: 'DỮ_LIỆU',
      icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
    },
    {
      id: 'cmd_4',
      title: 'Tạo kế hoạch hỗ trợ cá nhân hóa mới',
      description: 'Thiết lập các mốc vi phân nhiệm vụ 15 phút với gợi ý từ AI',
      view: 'INTERVENTIONS',
      category: 'CAN_THIỆP',
      icon: <Lightbulb className="w-4 h-4 text-indigo-500" />,
    },
    {
      id: 'cmd_5',
      title: 'Xem kết quả đo lường sau can thiệp (Trước vs Sau)',
      description: 'Đối chiếu tỷ lệ nộp bài và mức độ tham gia trước - sau hỗ trợ',
      view: 'INTERVENTIONS',
      category: 'CAN_THIỆP',
      icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'cmd_6',
      title: 'Tạo báo cáo tháng / học kỳ cho Ban giám hiệu',
      description: 'Xuất báo cáo tiến độ, minh bạch số liệu định lượng',
      view: 'REPORTS',
      category: 'BÁO_CÁO',
      icon: <FileText className="w-4 h-4 text-teal-500" />,
    },
    {
      id: 'cmd_7',
      title: 'Mở công cụ soạn Prompt sư phạm cho AI',
      description: 'Sử dụng các mẫu câu chuẩn để phân tích xu hướng hoặc vi phân bài học',
      view: 'PROMPT_BUILDER',
      category: 'CAN_THIỆP',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'cmd_8',
      title: 'Kiểm tra chất lượng dữ liệu & Sao lưu JSON',
      description: 'Phát hiện học sinh thiếu dữ liệu hoặc cần nhập thêm',
      view: 'DATA_QUALITY',
      category: 'DỮ_LIỆU',
      icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
    },
  ];

  const filtered = COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Bạn muốn làm gì? (ví dụ: xem học sinh cần quan sát, tạo báo cáo...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-50 dark:divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Không tìm thấy lệnh phù hợp với từ khóa "{searchTerm}".
            </div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => {
                  onNavigate(cmd.view);
                  onClose();
                }}
                className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 transition-colors shrink-0">
                    {cmd.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {cmd.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {cmd.description}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Nhấn vào tác vụ để điều hướng nhanh</span>
          <span className="font-mono">ESC để đóng</span>
        </div>
      </div>
    </div>
  );
};
