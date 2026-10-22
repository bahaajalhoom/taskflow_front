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
} from '@ant-design/icons';
import { Button, Input, Tooltip, Badge } from 'antd';
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
    'flex flex-col h-[700px] w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs',
  header:
    'flex items-center justify-between px-5 py-3.5 border-b border-[var(--line)] bg-[var(--surface-2)]/60 backdrop-blur-xs',
  messagesArea:
    'flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth focus:outline-none',
  inputDock:
    'p-3 sm:p-4 border-t border-[var(--line)] bg-[var(--surface-2)]/40 flex flex-col gap-2.5',
  myBubble:
    'max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--text)] shadow-2xs',
  theirBubble:
    'max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] shadow-2xs',
  avatar:
    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-[var(--line)] select-none',
  quickChip:
    'tactile-btn text-xs px-2.5 py-1 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--accent)]/40 transition-colors cursor-pointer select-none',
};

// ============================================================================
// 3. الأنواع والواجهات (Types & Interfaces)
// ============================================================================
interface ProjectChatViewProps {
  project: Project;
  currentUser: UserProfile | null;
}

interface MessageGroup {
  date: string;
  messages: ChatMessage[];
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

function formatGroupDate(dateString: string, isArabic: boolean): string {
  try {
    const d = new Date(dateString);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    if (isToday) return isArabic ? 'اليوم' : 'Today';

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return isArabic ? 'أمس' : 'Yesterday';

    return d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

// ============================================================================
// 5. المكونات الفرعية (Sub-Components)
// ============================================================================
function ChatHeader({
  project,
  messageCount,
  searchQuery,
  onSearchChange,
  isRefreshing,
  onRefresh,
  isArabic,
}: {
  project: Project;
  messageCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
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
              {isArabic ? 'شات فريق العمل' : 'Team Workspace Chat'}
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
              {isArabic ? 'متصل ومحدث' : 'Synced live'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder={isArabic ? 'بحث في المحادثة...' : 'Search messages...'}
          prefix={<SearchOutlined className="text-[var(--text-2)]" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          className="w-36 sm:w-56 text-xs h-8"
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
  isMine,
  isOwner,
  isArabic,
}: {
  message: ChatMessage;
  isMine: boolean;
  isOwner: boolean;
  isArabic: boolean;
}) {
  const timeFormatted = formatMessageTime(message.createdAt);
  const initials = getInitials(message.senderName);

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
          </div>
          <span className="text-[10px] font-mono tabular-nums text-[var(--text-2)] shrink-0">
            {timeFormatted}
          </span>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words m-0 select-text">
          {message.content}
        </p>

        {isMine && (
          <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-[var(--text-2)]">
            <CheckOutlined className="text-[9px] text-[var(--accent)]" />
            <span className="font-mono text-[9px]">
              {isArabic ? 'تم الحفظ' : 'Saved'}
            </span>
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
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // تحميل الرسائل
  const fetchMessages = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsRefreshing(true);
      try {
        const list = await DataService.getProjectMessages(project.id);
        setMessages(list);
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

  // التمرير التلقائي لأسفل عند وصول رسالة جديدة
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // إرسال رسالة
  const handleSendMessage = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : inputText;
    const content = raw.trim();
    if (!content || sending) return;

    setSending(true);
    setInputText('');

    // تحديث تفاؤلي
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      projectId: project.id,
      userId: currentUser?.id || currentUser?.uid || 'user',
      senderName: currentUser?.displayName || 'Teammate',
      senderEmail: currentUser?.email || 'user@taskflow.io',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const persisted = await DataService.sendProjectMessage(project.id, content);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? persisted : msg))
      );
    } catch (err) {
      console.error('Message failed to persist:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // تصفية الرسائل بالبحث
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q)
    );
  });

  const currentUserId = currentUser?.id || currentUser?.uid;

  // قوالب الردود السريعة
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
              {searchQuery
                ? isArabic
                  ? 'لا توجد نتائج بحث مطابقة'
                  : 'No matching search results'
                : isArabic
                ? 'لا توجد رسائل بعد في شات المشروع'
                : 'No messages yet in project chat'}
            </h4>
            <p className="text-xs text-[var(--text-2)] max-w-sm m-0">
              {searchQuery
                ? isArabic
                  ? 'جرب البحث بكلمات أخرى أو أفرغ شريط البحث.'
                  : 'Try adjusting your search query or clear the filter.'
                : isArabic
                ? 'ابدأ المحادثة مع زملائك في الفريق، ونسقوا المهام والاجتماعات بسهولة.'
                : 'Start the conversation with your team members to coordinate sprint milestones.'}
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
                isMine={Boolean(isMine)}
                isOwner={isOwner}
                isArabic={isArabic}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input & Quick Chips */}
      <div className={STYLES.inputDock}>
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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

        {/* Input Bar */}
        <div className="flex items-end gap-2">
          <Input.TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isArabic
                ? 'اكتب رسالتك هنا... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)'
                : 'Type your message... (Enter to send, Shift+Enter for newline)'
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
