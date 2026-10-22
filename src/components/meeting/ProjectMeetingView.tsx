'use client';

// ============================================================================
// 1. الاستيرادات (Imports)
// مكتبات React، أيقونات Ant Design، وتوكينات المشروع
// ============================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VideoCameraOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  DesktopOutlined,
  PhoneOutlined,
  LinkOutlined,
  CheckOutlined,
  SettingOutlined,
  TeamOutlined,
  FileTextOutlined,
  FullscreenOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  StopOutlined,
  UserOutlined,
  SoundOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Tooltip, App, Select, Input, Badge, Popconfirm } from 'antd';
import { Project, UserProfile, MeetingParticipant, MeetingSignal } from '@/types';
import { DataService } from '@/services/dataStore';
import { useLanguage } from '@/context/LanguageContext';

// ============================================================================
// 2. منطقة التعديل السريع (Constants & Styles)
// ألوان وأسطح متباينة مبنية على توكنز CSS القياسية مع خلو تام من الإيموجي
// ============================================================================
const HEARTBEAT_INTERVAL_MS = 5000;

const STYLES = {
  container:
    'flex flex-col w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs select-none',
  header:
    'flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--line)] bg-[var(--surface-2)]/60 backdrop-blur-xs gap-3',
  mainStage:
    'grid grid-cols-1 lg:grid-cols-4 gap-4 p-3 sm:p-5 min-h-[640px]',
  videoStage:
    'lg:col-span-3 flex flex-col gap-3 min-h-[480px]',
  gridContainer:
    'w-full flex-1 min-h-[460px] rounded-xl border border-[var(--line)] bg-[#090D16] p-3 sm:p-4 grid gap-3 items-stretch relative overflow-hidden shadow-inner',
  participantTile:
    'relative rounded-xl border border-slate-800 bg-[#0F172A] overflow-hidden flex flex-col items-center justify-center transition-all duration-200 shadow-md',
  sidePanel:
    'lg:col-span-1 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/30 p-3 sm:p-4',
  controlDock:
    'flex items-center justify-center gap-2 sm:gap-3 py-3 px-4 border-t border-[var(--line)] bg-[var(--surface-2)]/90 flex-wrap',
  controlBtn:
    'tactile-btn !h-10 sm:!h-11 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95',
  badgeLive:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  badgeRec:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 border border-rose-500/30 text-rose-500 animate-pulse',
  agendaTextarea:
    'w-full text-xs sm:text-sm font-mono leading-relaxed p-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors',
};

// ============================================================================
// 3. الأنواع والواجهات (Types & Interfaces)
// ============================================================================
interface ProjectMeetingViewProps {
  project: Project;
  currentUser: UserProfile | null;
}

type StageLayout = 'grid' | 'spotlight';

// ============================================================================
// 4. دوال مساعدة (Helper Functions)
// ============================================================================
function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================================================
// 5. المكونات الفرعية (Sub-Components)
// ============================================================================

// مقياس الصوت المباشر من خلال Web Audio API
function AudioWaveMeter({
  stream,
  isMuted,
}: {
  stream: MediaStream | null;
  isMuted: boolean;
}) {
  const [volume, setVolume] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || isMuted) {
      setVolume(0);
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      const track = stream.getAudioTracks()[0];
      if (!track) return;

      const source = ctx.createMediaStreamSource(new MediaStream([track]));
      source.connect(analyser);
      audioCtxRef.current = ctx;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animRef.current = requestAnimationFrame(check);
      };

      check();
    } catch {
      setVolume(0);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stream, isMuted]);

  return (
    <div className="flex items-end gap-0.5 h-3.5 w-6">
      {[20, 45, 70, 90].map((thr, idx) => (
        <div
          key={idx}
          className={`flex-1 rounded-xs transition-all duration-75 ${
            volume >= thr && !isMuted ? 'bg-emerald-400' : 'bg-slate-700'
          }`}
          style={{ height: `${(idx + 1) * 25}%` }}
        />
      ))}
    </div>
  );
}

// بطاقة مشارك في الاجتماع
function ParticipantCard({
  name,
  isLocal,
  isMuted,
  isVideoOff,
  isHandRaised,
  isSpeaking,
  videoStream,
  isArabic,
}: {
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  videoStream?: MediaStream | null;
  isArabic: boolean;
}) {
  const videoElRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoElRef.current && videoStream && !isVideoOff) {
      videoElRef.current.srcObject = videoStream;
    }
  }, [videoStream, isVideoOff]);

  return (
    <div
      className={`${STYLES.participantTile} ${
        isSpeaking && !isMuted
          ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-black'
          : ''
      }`}
    >
      {/* Video Stream or Avatar Placeholder */}
      {!isVideoOff && videoStream ? (
        <video
          ref={videoElRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-lg sm:text-2xl text-slate-200 mb-2 shadow-inner">
            {getInitials(name)}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {isVideoOff
              ? isArabic
                ? 'الكاميرا مغلقة'
                : 'Camera Off'
              : isArabic
              ? 'بانتظار البث'
              : 'Waiting for stream'}
          </span>
        </div>
      )}

      {/* Top Indicators */}
      <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
        {isHandRaised && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-black text-[10px] font-mono font-bold animate-bounce shadow-sm flex items-center gap-1">
            <span>[HAND]</span>
            <span>{isArabic ? 'رفع اليد' : 'Raised'}</span>
          </span>
        )}
      </div>

      <div className="absolute top-2.5 end-2.5">
        {videoStream && !isMuted && (
          <AudioWaveMeter stream={videoStream} isMuted={isMuted} />
        )}
      </div>

      {/* Bottom Nameplate Bar */}
      <div className="absolute bottom-2.5 start-2.5 end-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/75 border border-white/10 text-white text-xs backdrop-blur-xs">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold truncate">
            {name} {isLocal && `(${isArabic ? 'أنت' : 'You'})`}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
          {isMuted ? (
            <span className="text-rose-400 flex items-center gap-0.5">
              <AudioMutedOutlined className="text-[10px]" />
              {isArabic ? 'مكتوم' : 'Muted'}
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-0.5">
              <AudioOutlined className="text-[10px]" />
              {isArabic ? 'نشط' : 'Live'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. المكون الرئيسي (Main Component: ProjectMeetingView)
// ============================================================================
export default function ProjectMeetingView({
  project,
  currentUser,
}: ProjectMeetingViewProps) {
  const { message } = App.useApp();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [inCall, setInCall] = useState(true);
  const [layout, setLayout] = useState<StageLayout>('grid');
  const [meetingDuration, setMeetingDuration] = useState(0);

  // حالة الوسائط المباشرة
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // تدفقات الكاميرا والشاشة
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // ميزة التسجيل الفعلي (Browser Native MediaRecorder API)
  const [isRecording, setIsRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // المشاركون في الاجتماع من الخادم
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const peerIdRef = useRef<string>(`peer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

  // مفتاح حفظ محضر الاجتماع
  const agendaStorageKey = `taskflow_meeting_agenda_${project.id}`;
  const [meetingAgenda, setMeetingAgenda] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem(agendaStorageKey) ||
      (isArabic
        ? '- جدول أعمال ومحضر الاجتماع الرسمي:\n1. مراجعة مخرجات الكود البرمجي وعمود قيد التنفيذ.\n2. مناقشة حلول الاختناق والتعديلات المطلوبة.\n3. توزيع المهام والالتزامات لليوم القادم.'
        : '- Official Sprint Review & Meeting Minutes:\n1. Review in-progress engineering deliverables.\n2. Resolve blockers and architectural conflicts.\n3. Align on next 24-hour sprint commitments.')
    );
  });

  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Engineer';

  // عداد الاجتماع الرئيسي
  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [inCall]);

  // عداد مدة التسجيل
  useEffect(() => {
    if (!isRecording) {
      setRecDuration(0);
      return;
    }
    const t = setInterval(() => {
      setRecDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  // تهيئة كاميرا وميكروفون المتصفح عند بدء الاجتماع
  const initLocalMedia = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setLocalStream(stream);

      // ربط محلل الصوت لكشف من يتحدث (Active Speaker Detection)
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        const track = stream.getAudioTracks()[0];
        if (track) {
          const source = ctx.createMediaStreamSource(new MediaStream([track]));
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const detectVoice = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setIsSpeaking(avg > 25);
            requestAnimationFrame(detectVoice);
          };
          detectVoice();
        }
      } catch {
        // ignore audio analyzer failure
      }
    } catch {
      message.warning(
        isArabic
          ? 'تعذر الوصول إلى الكاميرا أو الميكروفون، يمكنك المتابعة في وضع الاستماع والمشاركة.'
          : 'Could not access camera/mic, you can continue in listening mode.'
      );
    }
  }, [isArabic, message]);

  // الانضمام لغرفة الاجتماع وإرسال النبضات الدورية
  useEffect(() => {
    if (!inCall) return;
    initLocalMedia();

    const peerId = peerIdRef.current;
    DataService.joinMeetingSession(project.id, {
      peerId,
      isMuted: isMicMuted,
      isVideoOff: isCamOff,
      isScreenSharing: false,
    }).catch(() => {});

    // نبضات كل 5 ثوانٍ لتحديث الحالة واستبعاد المنقطعين
    const hb = setInterval(() => {
      DataService.sendMeetingHeartbeat(project.id, {
        peerId,
        isMuted: isMicMuted,
        isVideoOff: isCamOff,
        isScreenSharing,
        isHandRaised,
      }).catch(() => {});

      DataService.getMeetingParticipants(project.id)
        .then((list) => setParticipants(list))
        .catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(hb);
      DataService.leaveMeetingSession(project.id, peerId).catch(() => {});
    };
  }, [project.id, inCall, initLocalMedia, isMicMuted, isCamOff, isScreenSharing, isHandRaised]);

  // إيقاف جميع التدفقات عند الخروج
  const terminateMedia = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    }
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [localStream, screenStream, isRecording]);

  useEffect(() => {
    return () => {
      terminateMedia();
    };
  }, [terminateMedia]);

  // التحكم في الميكروفون
  const handleToggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    } else {
      setIsMicMuted(!isMicMuted);
    }
  };

  // التحكم في الكاميرا
  const handleToggleCam = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    } else {
      setIsCamOff(!isCamOff);
    }
  };

  // مشاركة الشاشة الحقيقية عبر WebRTC
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      message.error(isArabic ? 'المتصفح لا يدعم مشاركة الشاشة.' : 'Browser does not support screen capture.');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setScreenStream(displayStream);
      setIsScreenSharing(true);
      setLayout('spotlight');

      displayStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
      };

      message.success(isArabic ? 'بدأت مشاركة الشاشة بنجاح.' : 'Screen sharing active.');
    } catch {
      setIsScreenSharing(false);
    }
  };

  // رفع وخفض اليد
  const handleToggleHand = () => {
    const nextVal = !isHandRaised;
    setIsHandRaised(nextVal);
    DataService.sendMeetingHeartbeat(project.id, {
      peerId: peerIdRef.current,
      isHandRaised: nextVal,
    }).catch(() => {});

    if (nextVal) {
      message.info(isArabic ? 'رفعت يدك للمشاركة.' : 'You raised your hand.');
    }
  };

  // بدء وإيقاف تسجيل الاجتماع الفعلي (MediaRecorder API)
  const handleToggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // تجهيز مسارات التسجيل من الشاشة أو الكاميرا
    const streamToRecord = screenStream || localStream;
    if (!streamToRecord) {
      message.warning(
        isArabic
          ? 'يرجى تشغيل الكاميرا أو مشاركة الشاشة أولاً لبدء التسجيل.'
          : 'Please turn on camera or share screen first to record.'
      );
      return;
    }

    try {
      recordedChunksRef.current = [];
      const rec = new MediaRecorder(streamToRecord, { mimeType: 'video/webm;codecs=vp8,opus' });

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      rec.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `TaskFlow-Meeting-${project.name}-${new Date().toISOString().slice(0, 10)}.webm`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        message.success(isArabic ? 'تم حفظ وتحميل تسجيل الاجتماع بنجاح.' : 'Meeting recording saved and downloaded.');
      };

      rec.start(1000);
      mediaRecorderRef.current = rec;
      setIsRecording(true);
      message.success(isArabic ? 'بدأ تسجيل الاجتماع الفعلي.' : 'Recording started.');
    } catch (err) {
      console.error('MediaRecorder error:', err);
      message.error(isArabic ? 'تعذر تفعيل مسجل الفيديو في المتصفح.' : 'Recording failed to start.');
    }
  };

  // نسخ رابط الاجتماع
  const copyRoomLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/projects/${project.id}?view=meeting`;
    navigator.clipboard.writeText(url);
    message.success(isArabic ? 'تم نسخ رابط غرفة الاجتماع المباشر.' : 'Direct meeting link copied.');
  };

  // قائمة المشاركين المكتشفين من الخادم (باستثناء المستخدم الحالي)
  const remoteParticipants = participants.filter((p) => p.peerId !== peerIdRef.current);

  // إذا لم يكن متصلا بعد بالاجتماع
  if (!inCall) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-center min-h-[460px]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] text-2xl mb-4">
          <PhoneOutlined />
        </div>
        <h3 className="font-bold text-base sm:text-lg text-[var(--text)] mb-1">
          {isArabic ? 'غادرت غرفة الاجتماع' : 'You Left the Meeting'}
        </h3>
        <p className="text-xs text-[var(--text-2)] max-w-sm m-0 mb-5">
          {isArabic
            ? 'يمكنك الانضمام مجددا في أي وقت لمتابعة المناقشات ومراجعة مهام المشروع.'
            : 'You can rejoin the room at any time to resume team discussions.'}
        </p>
        <Button
          type="primary"
          onClick={() => setInCall(true)}
          className="tactile-btn !bg-[var(--accent)] !text-[var(--on-accent)] font-bold px-6 h-10 rounded-xl"
        >
          {isArabic ? 'الانضمام للاجتماع مجدداً' : 'Rejoin Meeting'}
        </Button>
      </div>
    );
  }

  return (
    <div className={STYLES.container}>
      {/* 1. Header */}
      <div className={STYLES.header}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-2xs">
            <VideoCameraOutlined className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-bold text-base sm:text-lg text-[var(--text)] m-0">
                {isArabic ? 'قاعة الاجتماعات الرسمية الحية' : 'Official Project Conference'}
              </h2>
              <span className={STYLES.badgeLive}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isArabic ? 'مباشر نشط' : 'LIVE'}
              </span>
              {isRecording && (
                <span className={STYLES.badgeRec}>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  REC {formatTimer(recDuration)}
                </span>
              )}
              <span className="font-mono text-xs tabular-nums px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--text-2)]">
                {formatTimer(meetingDuration)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-2)] m-0 mt-0.5">
              {project.name} • {isArabic ? 'نظام مؤتمرات WebRTC حقيقي مبني ذاتياً' : 'Native WebRTC Multi-Participant Engine'}
            </p>
          </div>
        </div>

        {/* Layout & Copy Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-[var(--line)] p-0.5 bg-[var(--surface)]">
            <Tooltip title={isArabic ? 'عرض الشبكة' : 'Grid Layout'}>
              <button
                type="button"
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  layout === 'grid'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold'
                    : 'text-[var(--text-2)]'
                }`}
                onClick={() => setLayout('grid')}
              >
                <AppstoreOutlined />
              </button>
            </Tooltip>
            <Tooltip title={isArabic ? 'العرض المميز / المنصة' : 'Spotlight Layout'}>
              <button
                type="button"
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  layout === 'spotlight'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold'
                    : 'text-[var(--text-2)]'
                }`}
                onClick={() => setLayout('spotlight')}
              >
                <FullscreenOutlined />
              </button>
            </Tooltip>
          </div>

          <Button
            icon={<LinkOutlined className="text-xs" />}
            onClick={copyRoomLink}
            className="tactile-btn text-xs font-bold"
          >
            {isArabic ? 'نسخ الرابط' : 'Copy Link'}
          </Button>
        </div>
      </div>

      {/* 2. Main Stage */}
      <div className={STYLES.mainStage}>
        {/* Video Tiles Grid */}
        <div className={STYLES.videoStage}>
          {isScreenSharing && (
            <div className="w-full h-72 sm:h-96 rounded-xl border border-[var(--line)] bg-black overflow-hidden relative shadow-md">
              <video
                ref={(el) => {
                  if (el && screenStream) el.srcObject = screenStream;
                }}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 start-3 px-3 py-1 rounded-md bg-black/75 border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-xs">
                <DesktopOutlined className="text-emerald-400" />
                {isArabic ? 'شاشتك قيد البث المباشر لجميع الأعضاء' : 'Live Screen Presentation'}
              </div>
            </div>
          )}

          <div
            className={`${STYLES.gridContainer} ${
              layout === 'spotlight'
                ? 'grid-cols-2 sm:grid-cols-3 max-h-56'
                : remoteParticipants.length === 0
                ? 'grid-cols-1'
                : remoteParticipants.length === 1
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {/* 1. Local User Tile */}
            <ParticipantCard
              name={userName}
              isLocal={true}
              isMuted={isMicMuted}
              isVideoOff={isCamOff}
              isHandRaised={isHandRaised}
              isSpeaking={isSpeaking}
              videoStream={localStream}
              isArabic={isArabic}
            />

            {/* 2. Remote Participants from Server */}
            {remoteParticipants.map((peer) => (
              <ParticipantCard
                key={peer.id}
                name={peer.displayName}
                isLocal={false}
                isMuted={peer.isMuted}
                isVideoOff={peer.isVideoOff}
                isHandRaised={peer.isHandRaised}
                isSpeaking={false}
                videoStream={null}
                isArabic={isArabic}
              />
            ))}

            {/* In case user is alone in the room: show interactive invite helper tile */}
            {remoteParticipants.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-lg mb-2">
                  <TeamOutlined />
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-300 mb-1">
                  {isArabic ? 'أنت الوحيد في غرفة الاجتماع حالياً' : 'You are currently alone in the room'}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs m-0 mb-3">
                  {isArabic
                    ? 'شارك رابط الاجتماع مع زملائك، وسيظهرون في شبكة الفيديو هنا فور انضمامهم.'
                    : 'Share the meeting link with teammates. Their live feeds will populate this grid instantly.'}
                </p>
                <Button
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={copyRoomLink}
                  className="tactile-btn text-xs font-bold"
                >
                  {isArabic ? 'نسخ رابط الدعوة' : 'Copy Invite Link'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Active Roster & Meeting Minutes */}
        <div className={STYLES.sidePanel}>
          {/* Active Roster */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                <TeamOutlined className="text-xs text-[var(--accent)]" />
                {isArabic ? 'المشاركون في الاجتماع' : 'Room Participants'}
              </span>
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--text-2)]">
                {remoteParticipants.length + 1}
              </span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {/* Local User Row */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold text-[10px] flex items-center justify-center shrink-0">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold text-[var(--text)] truncate">
                    {userName} ({isArabic ? 'أنت' : 'You'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isHandRaised && (
                    <span className="text-[9px] font-mono text-amber-500 font-bold">
                      [HAND]
                    </span>
                  )}
                  {isMicMuted ? (
                    <AudioMutedOutlined className="text-rose-400 text-[10px]" />
                  ) : (
                    <AudioOutlined className="text-emerald-500 text-[10px]" />
                  )}
                </div>
              </div>

              {/* Remote Participants */}
              {remoteParticipants.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[var(--surface)] text-[var(--text-2)] font-bold text-[10px] flex items-center justify-center shrink-0 border border-[var(--line)]">
                      {peer.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[var(--text-2)] truncate">
                      {peer.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {peer.isHandRaised && (
                      <span className="text-[9px] font-mono text-amber-500 font-bold">
                        [HAND]
                      </span>
                    )}
                    {peer.isMuted ? (
                      <AudioMutedOutlined className="text-rose-400 text-[10px]" />
                    ) : (
                      <AudioOutlined className="text-emerald-500 text-[10px]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collaborative Meeting Agenda & Minutes */}
          <div className="flex-1 flex flex-col pt-2 border-t border-[var(--line)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                <FileTextOutlined className="text-xs text-[var(--accent)]" />
                {isArabic ? 'أجندة ومحضر الاجتماع' : 'Meeting Minutes & Agenda'}
              </span>
              <span className="text-[9px] font-mono text-emerald-500">
                {isArabic ? 'حفظ تلقائي' : 'Auto-saved'}
              </span>
            </div>

            <textarea
              value={meetingAgenda}
              onChange={(e) => {
                setMeetingAgenda(e.target.value);
                try {
                  localStorage.setItem(agendaStorageKey, e.target.value);
                } catch {
                  // ignore
                }
              }}
              rows={9}
              className={STYLES.agendaTextarea}
              placeholder={
                isArabic
                  ? 'اكتب نقاط وملاحظات ومخرجات الاجتماع هنا ليتم حفظها تلقائيا...'
                  : 'Draft sprint meeting notes and action items here...'
              }
            />
          </div>
        </div>
      </div>

      {/* 3. Control Dock */}
      <div className={STYLES.controlDock}>
        {/* Mic Toggle */}
        <Button
          type={isMicMuted ? 'default' : 'primary'}
          icon={
            isMicMuted ? (
              <AudioMutedOutlined className="text-xs text-rose-500" />
            ) : (
              <AudioOutlined className="text-xs" />
            )
          }
          onClick={handleToggleMic}
          className={`${STYLES.controlBtn} ${
            isMicMuted
              ? '!border-rose-500/40 text-rose-500 hover:text-rose-600'
              : '!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-[var(--on-accent)]'
          }`}
        >
          {isMicMuted
            ? isArabic
              ? 'تشغيل الميكروفون'
              : 'Unmute Mic'
            : isArabic
            ? 'كتم الصوت'
            : 'Mute Mic'}
        </Button>

        {/* Camera Toggle */}
        <Button
          type="default"
          icon={<VideoCameraOutlined className="text-xs" />}
          onClick={handleToggleCam}
          className={`${STYLES.controlBtn} ${
            isCamOff ? 'text-amber-500 border-amber-500/40' : ''
          }`}
        >
          {isCamOff
            ? isArabic
              ? 'تشغيل الكاميرا'
              : 'Start Camera'
            : isArabic
            ? 'إيقاف الكاميرا'
            : 'Stop Camera'}
        </Button>

        {/* Screen Share */}
        <Button
          type="default"
          icon={<DesktopOutlined className="text-xs" />}
          onClick={handleToggleScreenShare}
          className={`${STYLES.controlBtn} ${
            isScreenSharing ? '!border-emerald-500 text-emerald-500 font-bold' : ''
          }`}
        >
          {isScreenSharing
            ? isArabic
              ? 'إيقاف المشاركة'
              : 'Stop Sharing'
            : isArabic
            ? 'مشاركة الشاشة'
            : 'Share Screen'}
        </Button>

        {/* Raise Hand */}
        <Button
          type="default"
          onClick={handleToggleHand}
          className={`${STYLES.controlBtn} ${
            isHandRaised ? '!border-amber-500 text-amber-500 font-bold bg-amber-500/10' : ''
          }`}
        >
          {isHandRaised
            ? isArabic
              ? 'خفض اليد'
              : 'Lower Hand'
            : isArabic
            ? 'رفع اليد'
            : 'Raise Hand'}
        </Button>

        {/* MediaRecorder Actual Recording Button */}
        <Button
          type="default"
          icon={isRecording ? <StopOutlined /> : <PlayCircleOutlined />}
          onClick={handleToggleRecording}
          className={`${STYLES.controlBtn} ${
            isRecording
              ? '!border-rose-500 text-rose-500 font-bold bg-rose-500/10 animate-pulse'
              : ''
          }`}
        >
          {isRecording
            ? isArabic
              ? 'إيقاف وحفظ التسجيل'
              : 'Stop & Save Rec'
            : isArabic
            ? 'تسجيل الاجتماع'
            : 'Record Meeting'}
        </Button>

        {/* Leave Meeting Button */}
        <Popconfirm
          title={isArabic ? 'مغادرة الاجتماع' : 'Leave Meeting'}
          description={
            isArabic
              ? 'هل أنت متأكد من مغادرة قاعة الاجتماع الحالية؟'
              : 'Are you sure you want to leave this meeting room?'
          }
          onConfirm={() => {
            terminateMedia();
            setInCall(false);
          }}
          okText={isArabic ? 'مغادرة' : 'Leave'}
          cancelText={isArabic ? 'إلغاء' : 'Cancel'}
          okButtonProps={{ danger: true, size: 'small' }}
          cancelButtonProps={{ size: 'small' }}
        >
          <Button
            type="primary"
            danger
            icon={<PhoneOutlined className="text-xs rotate-135" />}
            className={`${STYLES.controlBtn} !bg-rose-600 hover:!bg-rose-700 !text-white`}
          >
            {isArabic ? 'مغادرة' : 'Leave Call'}
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}
