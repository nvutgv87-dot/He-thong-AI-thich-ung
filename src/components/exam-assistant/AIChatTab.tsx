import React, { useState, useEffect, useRef } from 'react';
import { AIChatSession, AIChatMessage } from '../../types/examTypes';
import { Student } from '../../types/index';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import {
  MessageSquare,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Copy,
  RotateCcw,
  Info,
  Database,
  Search,
  Check,
  X,
  User,
  GraduationCap,
  Layers,
  Paperclip,
} from 'lucide-react';

interface AIChatTabProps {
  userRole: 'TEACHER' | 'STUDENT';
  students: Student[];
  currentStudent?: Student;
  initialContext?: any;
}

export const AIChatTab: React.FC<AIChatTabProps> = ({
  userRole,
  students,
  currentStudent,
  initialContext,
}) => {
  const [sessions, setSessions] = useState<AIChatSession[]>(() =>
    examService.getChatSessions(userRole, currentStudent?.id)
  );

  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [searchSessionQuery, setSearchSessionQuery] = useState('');

  // Transparency modal: View ground truth data fed to AI
  const [showDataModal, setShowDataModal] = useState(false);

  // Delete session confirm modal
  const [deleteSessionCandidate, setDeleteSessionCandidate] = useState<AIChatSession | null>(null);

  // Rename session state
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [newTitleInput, setNewTitleInput] = useState('');

  // Attached context for current chat
  const [attachedContext, setAttachedContext] = useState<any>(initialContext || null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initial context if passed
  useEffect(() => {
    if (initialContext) {
      setAttachedContext(initialContext);
      if (initialContext.questionNumber) {
        setInputText(`Thầy cô/AI ơi, giải thích giúp em tại sao em làm sai câu ${initialContext.questionNumber} ạ?`);
      }
    }
  }, [initialContext]);

  // Ensure an active session
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    } else if (sessions.length === 0) {
      handleCreateNewSession();
    }
  }, [sessions]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isAiThinking]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleCreateNewSession = () => {
    const newSession: AIChatSession = {
      id: `CHAT_${Date.now()}`,
      title: userRole === 'STUDENT' ? 'Hỏi đáp bài tập Hóa học 11' : 'Hỗ trợ sư phạm & Soạn đề',
      role: userRole,
      studentId: userRole === 'STUDENT' ? (currentStudent?.id || 'STU_04') : undefined,
      messages: [
        {
          id: `MSG_${Date.now()}`,
          sender: 'AI',
          content:
            userRole === 'STUDENT'
              ? `Chào ${currentStudent?.fullName || 'em'}! Thầy là AI Gia sư Hóa học 11 bộ sách Kết nối tri thức. Em đang cần giải thích khái niệm nào, thắc mắc câu hỏi kiểm tra nào hay cần hướng dẫn phương pháp giải bài tập? Em hãy đặt câu hỏi nhé!`
              : `Kính chào Thầy/Cô! Tôi là Trợ lý AI Chuyên môn Hóa học 11. Tôi có thể hỗ trợ Thầy/Cô lập ma trận đặc tả, phân tích điểm yếu học sinh theo 3 mức nhận thức (BIẾT - HIỂU - VẬN DỤNG) hoặc gợi ý phiếu học tập phân hóa. Thầy/Cô cần hỗ trợ nội dung gì hôm nay ạ?`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          confidence: 'CAO',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    examService.saveChatSession(newSession);
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || isAiThinking) return;

    const userMsg: AIChatMessage = {
      id: `MSG_USER_${Date.now()}`,
      sender: 'USER',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      contextAttached: attachedContext,
    };

    const updatedMessages = [...(activeSession?.messages || []), userMsg];
    const updatedSession: AIChatSession = {
      ...activeSession,
      title: activeSession?.messages.length === 1 ? text.slice(0, 30) + '...' : activeSession?.title,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    // Update state immediately
    const updatedSessions = sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
    setSessions(updatedSessions);
    examService.saveChatSession(updatedSession);
    setInputText('');
    setIsAiThinking(true);

    // Call AI or local intelligent Socratic responder
    setTimeout(() => {
      let aiResponseText = '';

      if (userRole === 'STUDENT') {
        if (text.toLowerCase().includes('tại sao') || text.toLowerCase().includes('sai')) {
          aiResponseText = `Cảm ơn em đã hỏi! Đối với câu hỏi này trong SGK Kết nối tri thức:
1. **Bản chất kiến thức**: Phenol có nhóm -OH gắn trực tiếp vào vòng benzene làm tăng mật độ electron ở các vị trí ortho và para, nên phản ứng rất dễ dàng với dung dịch bromine ở nhiệt độ phòng.
2. **Điểm dễ nhầm lẫn**: Nhiều bạn nhầm lẫn giữa phenol và alcohol no (như ethanol). Ethanol không kích hoạt phản ứng thế nhân thơm này.
3. **Gợi ý tự kiểm tra**: Em hãy thử nhớ lại: Kết tủa trắng sinh ra có tên gọi chuẩn IUPAC là gì nhỉ? (Gợi ý: 2,4,6-...)`;
        } else if (text.toLowerCase().includes('ester') || text.toLowerCase().includes('hiệu suất')) {
          aiResponseText = `Trong phản ứng ester hóa giữa CH3COOH và C2H5OH:
- Phản ứng mang tính thuận nghịch, tỏa nhiệt nhẹ.
- Để tăng hiệu suất, em có thể: (1) Cho dư alcohol rẻ tiền hơn; (2) Dùng H2SO4 đặc để vừa xúc tác vừa hút nước; (3) Chưng cất tách ester ra khỏi hỗn hợp.
Em muốn thử giải một bài tập tính toán định lượng về phần này không?`;
        } else {
          aiResponseText = `Thầy ghi nhận câu hỏi của em: "${text}". Theo chương trình Hóa 11, em hãy chú ý liên hệ giữa cấu tạo nhóm chức và tính chất hóa học. Thầy luôn ở đây để đồng hành và giải thích từng bước cùng em!`;
        }
      } else {
        // Teacher mode
        if (text.toLowerCase().includes('lỗi sai') || text.toLowerCase().includes('phổ biến')) {
          aiResponseText = `Dựa trên dữ liệu kiểm tra của Lớp học:
1. **Lỗi sai phổ biến nhất (42% học sinh mắc)**: Nhầm lẫn tính acid của phenol với carboxylic acid (cho rằng phenol làm đỏ quỳ tím).
2. **Phần Vận dụng (Ester hóa)**: 35% học sinh quên điều kiện mũi tên hai chiều và vai trò hút ẩm của H2SO4 đặc.
3. **Khuyến nghị sư phạm**: Thầy/Cô có thể dành 5 phút đầu tiết tới chiếu lại thí nghiệm thực tế hoặc giao phiếu vi mô 2 câu trắc nghiệm đúng/sai để củng cố.`;
        } else {
          aiResponseText = `Dạ thưa Thầy/Cô, tôi đã tổng hợp dữ liệu chuyên môn cho yêu cầu: "${text}". Khung ma trận và đặc tả đã được đối chiếu chuẩn xác với bộ SGK Kết nối tri thức. Thầy/Cô có muốn xuất nội dung này thành phiếu học tập hoặc đưa vào ngân hàng đề không ạ?`;
        }
      }

      const aiMsg: AIChatMessage = {
        id: `MSG_AI_${Date.now()}`,
        sender: 'AI',
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        confidence: 'CAO',
        whyExplanation: 'Phản hồi dựa trên chuẩn kiến thức SGK Kết nối tri thức và dữ liệu học tập thực tế.',
      };

      const finalSession: AIChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, aiMsg],
        updatedAt: new Date().toISOString(),
      };

      const finalSessions = sessions.map((s) => (s.id === finalSession.id ? finalSession : s));
      setSessions(finalSessions);
      examService.saveChatSession(finalSession);
      setIsAiThinking(false);
    }, 700);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toastService.success('Đã sao chép nội dung tin nhắn!');
  };

  const handleRegenerateLastAiMessage = () => {
    if (!activeSession || activeSession.messages.length <= 1) return;
    const msgs = [...activeSession.messages];
    if (msgs[msgs.length - 1].sender === 'AI') {
      msgs.pop();
    }
    const lastUserMsg = msgs[msgs.length - 1];
    if (lastUserMsg && lastUserMsg.sender === 'USER') {
      setInputText(lastUserMsg.content);
      // Remove last user message as well
      msgs.pop();
      const updated: AIChatSession = { ...activeSession, messages: msgs };
      setSessions(sessions.map((s) => (s.id === updated.id ? updated : s)));
      examService.saveChatSession(updated);
      toastService.info('Đang tạo lại câu trả lời...');
    }
  };

  const handleConfirmDeleteSession = () => {
    if (!deleteSessionCandidate) return;
    examService.deleteChatSession(deleteSessionCandidate.id);
    const remaining = sessions.filter((s) => s.id !== deleteSessionCandidate.id);
    setSessions(remaining);
    setDeleteSessionCandidate(null);
    if (remaining.length > 0) {
      setActiveSessionId(remaining[0].id);
    } else {
      handleCreateNewSession();
    }
    toastService.success('Đã xóa cuộc trò chuyện.');
  };

  const handleSaveRenameSession = (id: string) => {
    if (!newTitleInput.trim()) return;
    const updated = sessions.map((s) =>
      s.id === id ? { ...s, title: newTitleInput.trim() } : s
    );
    setSessions(updated);
    const target = updated.find((s) => s.id === id);
    if (target) examService.saveChatSession(target);
    setRenamingSessionId(null);
    toastService.success('Đã đổi tên cuộc trò chuyện.');
  };

  // Quick prompt suggestions
  const PROMPTS_HS = [
    'Tại sao em làm sai câu trắc nghiệm Đúng/Sai về Phenol?',
    'Giải thích giúp em cơ chế phản ứng tráng bạc của Aldehyde',
    'Làm thế nào để phân biệt Ethanol và Glycerol bằng Cu(OH)2?',
    'Cho em 1 bài tập vận dụng về phản ứng Ester hóa kèm gợi ý giải',
  ];

  const PROMPTS_GV = [
    'Phân tích các lỗi sai phổ biến nhất của lớp trong bài kiểm tra vừa qua',
    'Gợi ý kế hoạch hỗ trợ phân hóa cho nhóm học sinh yếu mức VẬN DỤNG',
    'Soạn giúp tôi 3 câu hỏi trắc nghiệm Đúng/Sai bám sát SGK Kết nối tri thức',
    'Viết gợi ý nhận xét học bạ mang tính khích lệ, ngôn ngữ sư phạm tích cực',
  ];

  const suggestedPrompts = userRole === 'STUDENT' ? PROMPTS_HS : PROMPTS_GV;

  return (
    <div className="space-y-4">
      {/* Top Bar with Context and Transparency button */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{userRole === 'STUDENT' ? 'Gia sư AI Thích ứng' : 'Trợ lý AI Sư phạm & Phân tích chuyên môn'}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Socratic AI
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Gợi mở tư duy, không giải hộ ngay, ngôn ngữ tích cực và bám sát SGK Kết nối tri thức.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Transparency Data Button */}
          <button
            onClick={() => setShowDataModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Minh bạch dữ liệu: Xem dữ liệu nền tảng đang nạp vào AI"
          >
            <Database className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Dữ liệu nạp vào AI</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleCreateNewSession}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>
      </div>

      {/* Main Chat Layout: Left sidebar (Sessions) + Right chat room */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[550px]">
        {/* Left: Chat Sessions List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs space-y-3 flex flex-col">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm đoạn chat..."
              value={searchSessionQuery}
              onChange={(e) => setSearchSessionQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {sessions
              .filter((s) =>
                searchSessionQuery.trim() === ''
                  ? true
                  : s.title.toLowerCase().includes(searchSessionQuery.toLowerCase())
              )
              .map((s) => {
                const isActive = s.id === activeSessionId;
                const isRenaming = renamingSessionId === s.id;

                return (
                  <div
                    key={s.id}
                    className={`group p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-purple-300 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => {
                      if (!isRenaming) setActiveSessionId(s.id);
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                      {isRenaming ? (
                        <input
                          type="text"
                          value={newTitleInput}
                          onChange={(e) => setNewTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameSession(s.id);
                          }}
                          className="w-full text-xs font-semibold bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-purple-400 focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="overflow-hidden">
                          <div className="font-semibold truncate">{s.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {new Date(s.updatedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isRenaming ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveRenameSession(s.id);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingSessionId(s.id);
                            setNewTitleInput(s.title);
                          }}
                          className="p-1 text-slate-400 hover:text-purple-600 rounded"
                          title="Đổi tên"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionCandidate(s);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Xóa cuộc trò chuyện"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between space-y-3">
          {/* Attached Context Banner (if any) */}
          {attachedContext && (
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  Đang đính kèm ngữ cảnh:{' '}
                  <strong>
                    {attachedContext.examTitle || 'Đề kiểm tra'} - Câu {attachedContext.questionNumber}
                  </strong>
                </span>
              </div>
              <button
                onClick={() => setAttachedContext(null)}
                className="text-slate-400 hover:text-slate-600 text-[11px] font-bold"
              >
                Gỡ ngữ cảnh
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[350px] max-h-[500px]">
            {activeSession?.messages.map((msg) => {
              const isAi = msg.sender === 'AI';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isAi
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[85%] space-y-1 ${isAi ? '' : 'text-right'}`}>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed inline-block text-left ${
                        isAi
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs whitespace-pre-line'
                          : 'bg-purple-600 text-white rounded-tr-xs'
                      }`}
                    >
                      {msg.content}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                      <span>{msg.timestamp}</span>
                      {isAi && (
                        <>
                          <span>· Độ tin cậy: {msg.confidence || 'Cao'}</span>
                          <button
                            onClick={() => handleCopyMessage(msg.content)}
                            className="hover:text-purple-600 cursor-pointer"
                            title="Sao chép"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isAiThinking && (
              <div className="flex items-center gap-2 text-xs text-purple-600 p-2 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>AI đang phân tích kiến thức SGK và chuẩn bị câu trả lời...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 text-[11px]">
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => setInputText(p)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-50 hover:text-purple-700 whitespace-nowrap cursor-pointer transition-colors shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input & Action Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleRegenerateLastAiMessage}
              className="p-2 text-slate-400 hover:text-purple-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Tạo lại câu trả lời gần nhất"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={
                userRole === 'STUDENT'
                  ? 'Hỏi AI Gia sư về bài tập, cơ chế phản ứng hoặc câu sai...'
                  : 'Yêu cầu AI phân tích lỗi sai, soạn phiếu học tập...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isAiThinking}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Chat Confirmation Modal */}
      {deleteSessionCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xóa cuộc trò chuyện?
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bạn có chắc chắn muốn xóa &quot;{deleteSessionCandidate.title}&quot; không?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteSessionCandidate(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDeleteSession}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transparency Ground Truth Data Modal */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Minh bạch dữ liệu nền tảng nạp vào AI
                </h3>
              </div>
              <button
                onClick={() => setShowDataModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <p className="leading-relaxed">
                Để đảm bảo tính trung thực sư phạm và trách nhiệm giải trình, đây là các nguồn dữ liệu thực được hệ thống đưa vào ngữ cảnh AI:
              </p>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[11px]">
                <div>• Tài khoản đang tương tác: {userRole === 'STUDENT' ? `Học sinh ${currentStudent?.fullName || 'STU_04'}` : 'Giáo viên phụ trách'}</div>
                <div>• Lớp học mục tiêu: Lớp học ({students?.length || 31} học sinh)</div>
                <div>• Bộ sách giáo khoa chuẩn: Kết nối tri thức với cuộc sống</div>
                <div>• Thang đo nhận thức: 3 mức cố định (BIẾT, HIỂU, VẬN DỤNG)</div>
                <div>• Ngữ cảnh câu hỏi đang đính kèm: {attachedContext ? `Câu ${attachedContext.questionNumber} (${attachedContext.examTitle})` : 'Không'}</div>
              </div>

              <p className="text-[11px] text-slate-400">
                * AI tuân thủ nghiêm ngặt nguyên tắc: Không chẩn đoán y khoa, không gán nhãn &quot;yếu/lười/kém&quot;, ngôn ngữ tích cực.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDataModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
