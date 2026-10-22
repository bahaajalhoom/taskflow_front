'use client';

// ============================================================================
// 1. الاستيرادات (Imports)
// مكتبات واجهة المستخدم، الأيقونات المتجهية، وسياق التطبيق
// ============================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SendOutlined,
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  MessageOutlined,
  SyncOutlined,
  CrownOutlined,
  TeamOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  RollbackOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { Button, Input, Tooltip, Badge, Popconfirm, App } from 'antd';
import { Project, UserProfile, ChatMessage } from '@/types';
import { DataService } from '@/services/dataStore';
import { useLanguage } from '@/context/LanguageContext';

// ============================================================================
// 2. منطقة التعديل السريع (Constants & Styles)
// ألوان وأسطح متباينة مبنية على توكنز CSS القياسية مع خلو تام من الإيموجي
// ============================================================================
const POLL_INTERVAL_MS = 3000;

const STYLES = {
  container:
    'flex flex-col h-[740px] w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs',
  header:
    'flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--line)] bg-[var(--surface-2)]/60 backdrop-blur-xs',
  messagesArea:
    'flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scroll-smooth focus:outline-none',
  inputDock:
    'p-3 sm:p-4 border-t border-[var(--line)] bg-[var(--surface-2)]/40 flex flex-col gap-2 relative',
  myBubble:
    'max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--text)] shadow-2xs group relative',
  theirBubble:
    'max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] shadow-2xs group relative',
  avatar:
    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-[var(--line)] select-none',
  quickChip:
    'tactile-btn text-xs px-2.5 py-1 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--accent)]/40 transition-colors cursor-pointer select-none shrink-0',
  mentionTag:
    'inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[11px] bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 mx-0.5',
};

// ============================================================================
// 3. الأنواع والواجهات (Types & Interfaces)
// ============================================================================
interface ProjectChatViewProps {
  project: Project;
  currentUser: UserProfile | null;
}

// ============================================================================
// 4. دوال مساعدة (Helper Functions)
// ============================================================================
function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMessageTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// معالجة نصوص المنشن (@name) وتحويلها إلى شارات بصرية
function renderContentWithMentions(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_\u0600-\u06FF\s]+?\b)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className={STYLES.mentionTag}>
          {part}
        </span>
      );
    }
    return part;
  });
}

// ============================================================================
// 5. المكونات الفرعية (Sub-Components)
// ============================================================================

// مؤشر حالة الرسالة (انبعتت - استلمت - قرأت)
function MessageStatusIndicator({
  status,
  isArabic,
}: {
  status?: 'sent' | 'delivered' | 'read';
  isArabic: boolean;
}) {
  if (status === 'read') {
    return (
      <Tooltip title={isArabic ? 'تمت القراءة' : 'Read'}>
        <span className="flex items-center text-[var(--accent)] font-mono text-[9px] gap-0.5">
          <CheckOutlined className="text-[9px]" />
          <CheckOutlined className="text-[9px] -ms-1.5" />
          <span className="text-[8px]">{isArabic ? 'قرأت' : 'Read'}</span>
        </span>
      </Tooltip>
    );
  }

  if (status === 'delivered') {
    return (
      <Tooltip title={isArabic ? 'تم الاستلام' : 'Delivered'}>
        <span className="flex items-center text-[var(--text-2)] font-mono text-[9px] gap-0.5">
          <CheckOutlined className="text-[9px]" />
          <CheckOutlined className="text-[9px] -ms-1.5" />
          <span className="text-[8px]">{isArabic ? 'استلمت' : 'Delivered'}</span>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={isArabic ? 'تم الإرسال' : 'Sent'}>
      <span className="flex items-center text-[var(--text-2)]/70 font-mono text-[9px] gap-0.5">
        <CheckOutlined className="text-[9px]" />
        <span className="text-[8px]">{isArabic ? 'انبعتت' : 'Sent'}</span>
      </span>
    </Tooltip>
  );
}

function ChatHeader({
  project,
  messageCount,
  searchQuery,
  onSearchChange,
  isRefreshing,
  onRefresh,
  filterMentionsOnly,
  onToggleMentionsFilter,
  isArabic,
}: {
  project: Project;
  messageCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  filterMentionsOnly: boolean;
  onToggleMentionsFilter: () => void;
  isArabic: boolean;
}) {
  const memberCount = project.memberIds?.length || 1;

  return (
    <div className={STYLES.header}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0">
          <MessageOutlined className="text-base" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)] truncate">
              {isArabic ? 'شات فريق العمل الرسمي' : 'Official Team Workspace Chat'}
            </h3>
            <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--text-2)]">
              {messageCount} {isArabic ? 'رسالة' : 'msgs'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-2)]">
            <span className="flex items-center gap-1">
              <TeamOutlined className="text-[11px]" />
              {memberCount} {isArabic ? 'أعضاء في المشروع' : 'project members'}
            </span>
            <span>•</span>
            <span className="text-[var(--accent)] font-medium">
              {isArabic ? 'مزامنة لحظية' : 'Live Sync'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Tooltip
          title={
            isArabic
              ? 'تصفية الرسائل الموجهة لي فقط (@mention)'
              : 'Show only mentions directed to me'
          }
        >
          <Button
            size="small"
            type={filterMentionsOnly ? 'primary' : 'default'}
            icon={<FilterOutlined className="text-xs" />}
            onClick={onToggleMentionsFilter}
            className={`tactile-btn text-xs font-semibold ${
              filterMentionsOnly
                ? '!bg-[var(--accent)] !text-[var(--on-accent)]'
                : 'text-[var(--text-2)]'
            }`}
          >
            {isArabic ? 'منشنات لي' : 'Mentions'}
          </Button>
        </Tooltip>

        <Input
          placeholder={isArabic ? 'بحث في المحادثة...' : 'Search messages...'}
          prefix={<SearchOutlined className="text-[var(--text-2)]" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          className="w-32 sm:w-48 text-xs h-8"
        />

        <Tooltip title={isArabic ? 'تحديث الرسائل' : 'Refresh messages'}>
          <Button
            type="text"
            size="small"
            icon={<SyncOutlined spin={isRefreshing} className="text-xs" />}
            onClick={onRefresh}
            className="text-[var(--text-2)] hover:text-[var(--text)]"
          />
        </Tooltip>
      </div>
    </div>
  );
}

function ChatMessageItem({
  message,
  allMessages,
  isMine,
  isOwner,
  onReply,
  onEdit,
  onDelete,
  isArabic,
}: {
  message: ChatMessage;
  allMessages: ChatMessage[];
  isMine: boolean;
  isOwner: boolean;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage, newContent: string) => Promise<void>;
  onDelete: (msgId: string) => Promise<void>;
  isArabic: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [savingEdit, setSavingEdit] = useState(false);

  const timeFormatted = formatMessageTime(message.createdAt);
  const initials = getInitials(message.senderName);

  // البحث عن الرسالة المردود عليها إن وجدت
  const repliedMessage = message.replyToId
    ? allMessages.find((m) => m.id === message.replyToId)
    : null;

  const handleSaveEdit = async () => {
    if (!editText.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      await onEdit(message, editText.trim());
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div
      className={`flex items-start gap-2.5 ${
        isMine ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isMine && (
        <div
          className={`${STYLES.avatar} bg-[var(--surface-2)] text-[var(--text-2)]`}
          title={message.senderName}
        >
          {initials}
        </div>
      )}

      <div className={isMine ? STYLES.myBubble : STYLES.theirBubble}>
        {/* Reply Context Header if message is a reply */}
        {repliedMessage && (
          <div className="mb-2 p-1.5 rounded-lg border-s-2 border-[var(--accent)] bg-[var(--surface)]/80 text-[11px] text-[var(--text-2)] flex flex-col">
            <span className="font-bold text-[10px] text-[var(--accent)]">
              {repliedMessage.senderName}
            </span>
            <span className="truncate italic">
              {repliedMessage.isDeleted
                ? isArabic
                  ? 'رسالة محذوفة'
                  : 'Deleted message'
                : repliedMessage.content}
            </span>
          </div>
        )}

        {/* Sender Name & Controls Row */}
        <div className="flex items-center justify-between gap-3 mb-1 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold">
            <span className={isMine ? 'text-[var(--accent)]' : 'text-[var(--text)]'}>
              {isMine ? (isArabic ? 'أنت' : 'You') : message.senderName}
            </span>
            {isOwner && (
              <span className="text-[9px] px-1 py-0.2 rounded border border-[var(--accent)]/30 text-[var(--accent)] font-mono">
                {isArabic ? 'المالك' : 'Owner'}
              </span>
            )}
            {message.isEdited && (
              <span className="text-[9px] text-[var(--text-2)] font-mono italic">
                ({isArabic ? 'معدلة' : 'edited'})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono tabular-nums text-[var(--text-2)] shrink-0">
              {timeFormatted}
            </span>

            {/* Quick Action Buttons (Reply / Edit / Delete) */}
            {!message.isDeleted && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Tooltip title={isArabic ? 'رد' : 'Reply'}>
                  <button
                    type="button"
                    onClick={() => onReply(message)}
                    className="p-1 rounded text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                  >
                    <RollbackOutlined className="text-[10px]" />
                  </button>
                </Tooltip>

                {isMine && !isEditing && (
                  <Tooltip title={isArabic ? 'تعديل' : 'Edit'}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditText(message.content);
                        setIsEditing(true);
                      }}
                      className="p-1 rounded text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                    >
                      <EditOutlined className="text-[10px]" />
                    </button>
                  </Tooltip>
                )}

                {(isMine || isOwner) && (
                  <Popconfirm
                    title={isArabic ? 'حذف الرسالة' : 'Delete Message'}
                    description={
                      isArabic
                        ? 'هل أنت متأكد من حذف هذه الرسالة من شات المشروع؟'
                        : 'Are you sure you want to delete this message?'
                    }
                    onConfirm={() => onDelete(message.id)}
                    okText={isArabic ? 'نعم، احذف' : 'Delete'}
                    cancelText={isArabic ? 'إلغاء' : 'Cancel'}
                    okButtonProps={{ danger: true, size: 'small' }}
                    cancelButtonProps={{ size: 'small' }}
                  >
                    <button
                      type="button"
                      className="p-1 rounded text-[var(--text-2)] hover:text-rose-500 hover:bg-[var(--surface)] transition-colors cursor-pointer"
                    >
                      <DeleteOutlined className="text-[10px]" />
                    </button>
                  </Popconfirm>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message Content or Inline Edit Form */}
        {isEditing ? (
          <div className="flex flex-col gap-1.5 mt-1">
            <Input.TextArea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="text-xs bg-[var(--surface)] border-[var(--line)] rounded-lg"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="small"
                onClick={() => setIsEditing(false)}
                className="text-[10px] h-6 px-2"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="primary"
                size="small"
                loading={savingEdit}
                onClick={handleSaveEdit}
                className="text-[10px] h-6 px-2.5 !bg-[var(--accent)] !text-[var(--on-accent)] font-bold"
              >
                {isArabic ? 'حفظ التعديل' : 'Save'}
              </Button>
            </div>
          </div>
        ) : message.isDeleted ? (
          <p className="text-xs italic text-[var(--text-2)] m-0 select-none">
            {isArabic ? 'تم حذف هذه الرسالة' : 'This message was deleted'}
          </p>
        ) : (
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words m-0 select-text">
            {renderContentWithMentions(message.content)}
          </p>
        )}

        {/* Message Status Bar (Only for User's own messages) */}
        {isMine && !message.isDeleted && (
          <div className="flex justify-end items-center gap-1 mt-1 text-[10px]">
            <MessageStatusIndicator status={message.status} isArabic={isArabic} />
          </div>
        )}
      </div>

      {isMine && (
        <div
          className={`${STYLES.avatar} bg-[var(--accent)]/20 text-[var(--accent)] font-bold`}
          title={message.senderName}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. المكون الرئيسي (Main Component: ProjectChatView)
// ============================================================================
export default function ProjectChatView({
  project,
  currentUser,
}: ProjectChatViewProps) {
  const { message: antMessage } = App.useApp();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMentionsOnly, setFilterMentionsOnly] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);

  // نظام المنشن الذكي (@mention autocomplete)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // قائمة أعضاء المشروع المتاحين للمنشن
  const projectMembersList = Object.values(project.memberDetails || {}).map((m) => ({
    id: m.id || m.uid,
    displayName: m.displayName || m.email.split('@')[0],
    email: m.email,
  }));

  // جلب الرسائل من الخادم
  const fetchMessages = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsRefreshing(true);
      try {
        const list = await DataService.getProjectMessages(project.id);
        setMessages(list);

        // وضع علامة مقروءة على الرسائل الواردة
        DataService.markProjectMessagesRead(project.id).catch(() => {});
      } catch (err) {
        console.error('Failed to load project messages:', err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [project.id]
  );

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // مراقبة كتابة الـ @ لإظهار قائمة المنشن
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || /\s/.test(val[lastAtIdx - 1]))) {
      const query = val.slice(lastAtIdx + 1);
      if (!/\s/.test(query)) {
        setMentionQuery(query.toLowerCase());
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  // اختيار عضو من قائمة المنشن
  const selectMentionMember = (name: string) => {
    if (!mentionQuery && mentionQuery !== '') return;
    const lastAtIdx = inputText.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const before = inputText.slice(0, lastAtIdx);
      const after = inputText.slice(lastAtIdx + 1 + mentionQuery.length);
      setInputText(`${before}@${name} ${after}`);
    }
    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  // إرسال رسالة جديدة
  const handleSendMessage = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : inputText;
    const content = raw.trim();
    if (!content || sending) return;

    setSending(true);
    setInputText('');
    const replyTargetId = replyingTo?.id || null;
    setReplyingTo(null);
    setShowMentionMenu(false);

    // استخراج المنشنات الموجودة في النص
    const extractedMentions = (content.match(/@([a-zA-Z0-9_\u0600-\u06FF\s]+?\b)/g) || []).map(
      (m) => m.slice(1).trim()
    );

    // تحديث تفاؤلي سريع
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      projectId: project.id,
      userId: currentUser?.id || currentUser?.uid || 'user',
      senderName: currentUser?.displayName || 'Teammate',
      senderEmail: currentUser?.email || 'user@taskflow.io',
      content,
      status: 'sent',
      isEdited: false,
      isDeleted: false,
      replyToId: replyTargetId,
      mentions: extractedMentions,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const persisted = await DataService.sendProjectMessage(project.id, content, {
        replyToId: replyTargetId,
        mentions: extractedMentions,
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...persisted, status: 'delivered' } : msg))
      );
    } catch {
      antMessage.error(isArabic ? 'فشل إرسال الرسالة للخادم.' : 'Message failed to send.');
    } finally {
      setSending(false);
    }
  };

  // تعديل رسالة
  const handleEditMessage = async (msg: ChatMessage, newContent: string) => {
    try {
      await DataService.editProjectMessage(project.id, msg.id, newContent);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, content: newContent, isEdited: true } : m
        )
      );
      antMessage.success(isArabic ? 'تم تعديل الرسالة بنجاح.' : 'Message edited successfully.');
    } catch {
      antMessage.error(isArabic ? 'فشل تعديل الرسالة.' : 'Failed to edit message.');
    }
  };

  // حذف رسالة
  const handleDeleteMessage = async (msgId: string) => {
    try {
      await DataService.deleteProjectMessage(project.id, msgId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: 'تم حذف هذه الرسالة', isDeleted: true } : m
        )
      );
      antMessage.success(isArabic ? 'تم حذف الرسالة.' : 'Message deleted.');
    } catch {
      antMessage.error(isArabic ? 'فشل حذف الرسالة.' : 'Failed to delete message.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // تصفية الرسائل بالبحث والمنشن
  const currentUserName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
  const filteredMessages = messages.filter((m) => {
    if (filterMentionsOnly) {
      if (
        !m.mentions?.some(
          (mention) =>
            mention.toLowerCase().includes(currentUserName.toLowerCase()) ||
            mention.toLowerCase() === 'all' ||
            mention === 'الكل'
        )
      ) {
        return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q)
    );
  });

  const currentUserId = currentUser?.id || currentUser?.uid;

  // أعضاء مقترحين للمنشن بناءً على البحث
  const filteredMembersForMention = projectMembersList.filter(
    (mem) =>
      !mentionQuery ||
      mem.displayName.toLowerCase().includes(mentionQuery) ||
      mem.email.toLowerCase().includes(mentionQuery)
  );

  const quickChips = isArabic
    ? [
        'تم التعديل على بطاقة الكانبان',
        'يرجى مراجعة المهمة قيد التنفيذ',
        'جاهز للاجتماع المباشر الآن',
        'تم الانتهاء من مراجعة الكود البرمجي',
      ]
    : [
        'Task updated on Kanban',
        'Please review in-progress task',
        'Ready for live meeting',
        'Code review completed',
      ];

  return (
    <div className={STYLES.container}>
      {/* 1. Header */}
      <ChatHeader
        project={project}
        messageCount={messages.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchMessages(false)}
        filterMentionsOnly={filterMentionsOnly}
        onToggleMentionsFilter={() => setFilterMentionsOnly(!filterMentionsOnly)}
        isArabic={isArabic}
      />

      {/* 2. Messages List */}
      <div
        ref={messagesContainerRef}
        className={STYLES.messagesArea}
        tabIndex={0}
        aria-label={isArabic ? 'قائمة رسائل الفريق' : 'Team message list'}
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--text-2)] mb-3">
              <MessageOutlined className="text-2xl" />
            </div>
            <h4 className="font-bold text-sm text-[var(--text)] mb-1">
              {searchQuery || filterMentionsOnly
                ? isArabic
                  ? 'لا توجد نتائج بحث مطابقة'
                  : 'No matching search results'
                : isArabic
                ? 'لا توجد رسائل بعد في شات المشروع'
                : 'No messages yet in project chat'}
            </h4>
            <p className="text-xs text-[var(--text-2)] max-w-sm m-0">
              {isArabic
                ? 'ابدأ المحادثة مع زملائك، استخدم @ للمنشن، ونسقوا المهام والاجتماعات بسهولة.'
                : 'Start the conversation with your team members, use @ to mention, and coordinate sprint milestones.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMine =
              msg.userId === currentUserId ||
              (currentUser?.email && msg.senderEmail === currentUser.email);
            const isOwner = msg.userId === project.ownerId;

            return (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                allMessages={messages}
                isMine={Boolean(isMine)}
                isOwner={isOwner}
                onReply={(target) => setReplyingTo(target)}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                isArabic={isArabic}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Autocomplete Dropdown */}
      {showMentionMenu && filteredMembersForMention.length > 0 && (
        <div className="absolute bottom-28 start-6 z-40 w-64 rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-lg overflow-hidden p-1 space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-mono text-[var(--text-2)] border-b border-[var(--line)]">
            {isArabic ? 'تحديد عضو للمنشن (@)' : 'Select teammate to mention (@)'}
          </div>
          {filteredMembersForMention.map((member) => (
            <button
              key={member.id}
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--surface-2)] text-start cursor-pointer transition-colors"
              onClick={() => selectMentionMember(member.displayName)}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold text-[9px] flex items-center justify-center">
                  {getInitials(member.displayName)}
                </div>
                <span className="font-bold text-[var(--text)]">{member.displayName}</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-2)] truncate max-w-[90px]">
                {member.email}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Input & Reply Context */}
      <div className={STYLES.inputDock}>
        {/* Reply Context Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text-2)] animate-fadeIn">
            <div className="flex items-center gap-2 truncate">
              <RollbackOutlined className="text-[var(--accent)] text-xs" />
              <span>
                {isArabic ? 'الرد على' : 'Replying to'}{' '}
                <strong className="text-[var(--text)]">{replyingTo.senderName}:</strong>{' '}
                <span className="italic truncate max-w-xs">{replyingTo.content}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:text-[var(--text)] cursor-pointer text-xs"
            >
              <CloseOutlined />
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className={STYLES.quickChip}
              onClick={() => handleSendMessage(chip)}
              disabled={sending}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Textarea Input Bar */}
        <div className="flex items-end gap-2">
          <Input.TextArea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isArabic
                ? 'اكتب رسالتك... (استخدم @ للمنشن، اضغط Enter للإرسال، Shift+Enter لسطر جديد)'
                : 'Type your message... (Use @ for mention, Enter to send, Shift+Enter for newline)'
            }
            autoSize={{ minRows: 1, maxRows: 4 }}
            maxLength={3000}
            className="flex-1 text-xs sm:text-sm resize-none rounded-xl bg-[var(--surface)] border-[var(--line)]"
          />

          <Button
            type="primary"
            icon={<SendOutlined className="text-xs" />}
            onClick={() => handleSendMessage()}
            loading={sending}
            disabled={!inputText.trim()}
            className="tactile-btn !h-9 sm:!h-10 px-4 !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-[var(--on-accent)] !border-none font-bold text-xs shrink-0 rounded-xl"
          >
            {isArabic ? 'إرسال' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
