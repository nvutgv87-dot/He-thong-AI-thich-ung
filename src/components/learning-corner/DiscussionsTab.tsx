import React, { useState } from 'react';
import {
  DiscussionPost,
  DiscussionComment,
  Student,
} from '../../types';
import { toastService } from '../../services/toastService';
import {
  MessageSquare,
  Send,
  Plus,
  Edit2,
  Trash2,
  Pin,
  Heart,
  Search,
  Filter,
  User,
  CheckCircle,
  X,
  MessageCircle,
} from 'lucide-react';

interface DiscussionsTabProps {
  userRole: 'TEACHER' | 'STUDENT';
  currentStudent: Student;
  posts: DiscussionPost[];
  onSavePost: (post: DiscussionPost) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, comment: DiscussionComment) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onRequestConfirmDelete: (item: { type: 'POST' | 'COMMENT'; id: string; postId?: string; title: string }) => void;
}

export const DiscussionsTab: React.FC<DiscussionsTabProps> = ({
  userRole,
  currentStudent,
  posts,
  onSavePost,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  onRequestConfirmDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // New post modal
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<DiscussionPost | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTopic, setPostTopic] = useState('Hóa học hữu cơ - Dẫn xuất Hydrocarbon');
  const [postTags, setPostTags] = useState('Trao đổi bài tập, Hỏi đáp');
  const [postIsPinned, setPostIsPinned] = useState(false);

  // Active comment input
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const authorName = userRole === 'TEACHER' ? 'Thầy Cô Bộ Môn Hóa' : currentStudent.fullName;
  const authorRole: 'GIÁO_VIÊN' | 'HỌC_SINH' = userRole === 'TEACHER' ? 'GIÁO_VIÊN' : 'HỌC_SINH';

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchQuery =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTag =
      selectedTag === 'ALL' ||
      (p.tags && p.tags.includes(selectedTag)) ||
      p.topic === selectedTag;

    return matchQuery && matchTag;
  });

  const handleOpenCreate = () => {
    setEditingPost(null);
    setPostTitle('');
    setPostContent('');
    setPostTopic('Hóa học hữu cơ - Dẫn xuất Hydrocarbon');
    setPostTags('Hỏi đáp');
    setPostIsPinned(false);
    setShowModal(true);
  };

  const handleOpenEdit = (p: DiscussionPost) => {
    // Only author or teacher can edit
    if (userRole !== 'TEACHER' && p.authorId !== currentStudent.id) {
      toastService.warning('Bạn chỉ có thể chỉnh sửa bài đăng do chính mình tạo.');
      return;
    }
    setEditingPost(p);
    setPostTitle(p.title);
    setPostContent(p.content);
    setPostTopic(p.topic || 'Hóa học');
    setPostTags((p.tags || []).join(', '));
    setPostIsPinned(!!p.isPinned);
    setShowModal(true);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) {
      toastService.warning('Vui lòng nhập tiêu đề thảo luận.');
      return;
    }
    if (!postContent.trim()) {
      toastService.warning('Vui lòng nhập nội dung thảo luận.');
      return;
    }

    const tagList = postTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingPost) {
      const updated: DiscussionPost = {
        ...editingPost,
        title: postTitle.trim(),
        content: postContent.trim(),
        topic: postTopic.trim(),
        tags: tagList,
        isPinned: userRole === 'TEACHER' ? postIsPinned : editingPost.isPinned,
        updatedAt: new Date().toISOString(),
      };
      onSavePost(updated);
      toastService.success('Đã cập nhật bài thảo luận thành công!');
    } else {
      const newPost: DiscussionPost = {
        id: `POST_${Date.now()}`,
        authorId: userRole === 'TEACHER' ? 'TEACHER' : currentStudent.id,
        authorName,
        authorRole,
        title: postTitle.trim(),
        content: postContent.trim(),
        topic: postTopic.trim(),
        tags: tagList,
        isPinned: userRole === 'TEACHER' ? postIsPinned : false,
        likes: 0,
        likeCount: 0,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSavePost(newPost);
      toastService.success('Đã đăng bài thảo luận thành công!');
    }

    setShowModal(false);
  };

  const handleAddCommentSubmit = (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) {
      toastService.warning('Vui lòng nhập nội dung bình luận.');
      return;
    }

    const newComment: DiscussionComment = {
      id: `CMT_${Date.now()}`,
      postId,
      authorId: userRole === 'TEACHER' ? 'TEACHER' : currentStudent.id,
      authorName,
      authorRole,
      content: text,
      createdAt: new Date().toISOString(),
    };

    onAddComment(postId, newComment);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    toastService.success('Đã gửi phản hồi vào bài thảo luận.');
  };

  const handleToggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const current = !!prev[postId];
      const next = !current;
      toastService.info(next ? 'Đã thích bài viết' : 'Đã bỏ thích');
      return { ...prev, [postId]: next };
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề thảo luận, người đăng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Tất cả chủ đề</option>
              <option value="Hỏi đáp">Hỏi đáp thắc mắc</option>
              <option value="Trao đổi bài tập">Trao đổi bài tập</option>
              <option value="Thí nghiệm">Thí nghiệm Hóa học</option>
              <option value="Ôn tập">Ôn tập kiểm tra</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng bài thảo luận</span>
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            Chưa có bài thảo luận nào phù hợp với bộ lọc. Hãy bấm &quot;Đăng bài thảo luận&quot; để trao đổi cùng lớp!
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isAuthor =
              (userRole === 'STUDENT' && post.authorId === currentStudent.id) ||
              (userRole === 'TEACHER' && post.authorRole === 'GIÁO_VIÊN');
            const canManage = userRole === 'TEACHER' || isAuthor;
            const isLiked = !!likedPosts[post.id];

            return (
              <div
                key={post.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-5 transition-all shadow-2xs space-y-3 ${
                  post.isPinned
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        post.authorRole === 'GIÁO_VIÊN'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                      }`}
                    >
                      {post.authorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {post.authorName}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            post.authorRole === 'GIÁO_VIÊN'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {post.authorRole === 'GIÁO_VIÊN' ? 'Giáo viên' : 'Học sinh'}
                        </span>
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                            <Pin className="w-2.5 h-2.5 fill-current" />
                            Ghim bởi Giáo viên
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {post.createdAt ? new Date(post.createdAt).toLocaleString('vi-VN') : ''}
                        {post.topic && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                            · {post.topic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(post)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Chỉnh sửa bài đăng"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          onRequestConfirmDelete({
                            type: 'POST',
                            id: post.id,
                            title: post.title,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
                        title="Xóa vào Thùng rác"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Reactions & Comment toggle */}
                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isLiked
                        ? 'text-rose-600 font-semibold'
                        : 'hover:text-rose-600 text-slate-500'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{(post.likes || 0) + (isLiked ? 1 : 0)} thích</span>
                  </button>

                  <div className="inline-flex items-center gap-1.5 text-slate-500">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{(post.comments || []).length} phản hồi</span>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-slate-50/70 dark:bg-slate-850 rounded-xl p-3.5 space-y-3">
                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-2.5">
                      {post.comments.map((cmt) => {
                        const canDeleteComment =
                          userRole === 'TEACHER' ||
                          (userRole === 'STUDENT' && cmt.authorId === currentStudent.id);

                        return (
                          <div
                            key={cmt.id}
                            className="flex items-start justify-between gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/70 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  cmt.authorRole === 'GIÁO_VIÊN'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {cmt.authorName.slice(0, 1)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-900 dark:text-white text-[11px]">
                                    {cmt.authorName}
                                  </span>
                                  {cmt.authorRole === 'GIÁO_VIÊN' && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 rounded">
                                      GV
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    {cmt.createdAt ? new Date(cmt.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                                  {cmt.content}
                                </p>
                              </div>
                            </div>

                            {canDeleteComment && (
                              <button
                                onClick={() =>
                                  onRequestConfirmDelete({
                                    type: 'COMMENT',
                                    id: cmt.id,
                                    postId: post.id,
                                    title: 'Bình luận thảo luận',
                                  })
                                }
                                className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                                title="Xóa bình luận"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Viết phản hồi hoặc đặt câu hỏi trao đổi..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCommentSubmit(post.id);
                        }
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      onClick={() => handleAddCommentSubmit(post.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Create/Edit Discussion Post */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>{editingPost ? 'Chỉnh sửa bài thảo luận' : 'Đăng bài thảo luận mới'}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề thảo luận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thắc mắc về cơ chế phản ứng este hóa..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chủ đề môn học
                  </label>
                  <input
                    type="text"
                    value={postTopic}
                    onChange={(e) => setPostTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thẻ phân loại (ngăn cách bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="Hỏi đáp, Ôn tập, Thí nghiệm..."
                    value={postTags}
                    onChange={(e) => setPostTags(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả cụ thể câu hỏi hoặc nội dung bạn muốn cùng trao đổi với thầy cô và các bạn..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 leading-relaxed"
                />
              </div>

              {userRole === 'TEACHER' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pin-post"
                    checked={postIsPinned}
                    onChange={(e) => setPostIsPinned(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="pin-post" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Ghim bài viết lên đầu trang thảo luận của lớp
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {editingPost ? 'Lưu cập nhật' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
