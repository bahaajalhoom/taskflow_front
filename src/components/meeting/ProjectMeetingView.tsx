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
  SafetyCertificateOutlined,
  FullscreenOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Button, Tooltip, App, Select, Input } from 'antd';
import { Project, UserProfile } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

// ============================================================================
// 2. منطقة التعديل السريع (Constants & Styles)
// ألوان وأسطح متباينة مبنية على توكنز CSS القياسية مع خلو تام من الإيموجي
// ============================================================================
const STYLES = {
  container:
    'flex flex-col w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs',
  header:
    'flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--surface-2)]/60 backdrop-blur-xs gap-3',
  mainStage:
    'grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 sm:p-6 min-h-[620px]',
  videoContainer:
    'lg:col-span-3 relative rounded-xl border border-[var(--line)] bg-[#0B0F19] overflow-hidden flex flex-col items-center justify-center min-h-[460px] shadow-inner',
  sidePanel:
    'lg:col-span-1 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/30 p-3.5',
  controlDock:
    'flex items-center justify-center gap-2 sm:gap-3 py-3 px-4 border-t border-[var(--line)] bg-[var(--surface-2)]/80 flex-wrap',
  controlBtn:
    'tactile-btn !h-10 sm:!h-11 px-3 sm:px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95',
  badgeLive:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
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

type MeetingMode = 'jitsi_room' | 'native_bench';

// ============================================================================
// 4. دوال مساعدة (Helper Functions)
// ============================================================================
function sanitizeRoomName(name: string, id: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '') || 'Project';
  const cleanId = id.replace(/-/g, '').slice(0, 8);
  return `TaskFlow-${clean}-Room-${cleanId}`;
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============================================================================
// 5. المكونات الفرعية (Sub-Components)
// ============================================================================

// مقياس الصوت اللحظي (Microphone Audio Level Visualizer)
function AudioVisualizer({
  stream,
  isMuted,
}: {
  stream: MediaStream | null;
  isMuted: boolean;
}) {
  const [level, setLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || isMuted) {
      setLevel(0);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      setLevel(0);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stream, isMuted]);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
      <div className="flex items-end gap-0.5 h-4 w-12">
        {[20, 40, 60, 80, 100].map((threshold, idx) => (
          <div
            key={idx}
            className={`flex-1 rounded-xs transition-all duration-75 ${
              level >= threshold && !isMuted
                ? 'bg-emerald-500'
                : 'bg-[var(--line)]'
            }`}
            style={{ height: `${(idx + 1) * 20}%` }}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono tabular-nums text-[var(--text-2)]">
        {isMuted ? 'Muted' : `${level}%`}
      </span>
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

  const [mode, setMode] = useState<MeetingMode>('jitsi_room');
  const [meetingDuration, setMeetingDuration] = useState(0);

  // حالة الوسائط المباشرة (Native WebRTC Bench)
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [hasMediaPermissions, setHasMediaPermissions] = useState<boolean | null>(null);

  // الأجندة ومحضر الاجتماع
  const agendaStorageKey = `taskflow_meeting_agenda_${project.id}`;
  const [meetingAgenda, setMeetingAgenda] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem(agendaStorageKey) ||
      (isArabic
        ? '- جدول أعمال الاجتماع:\n1. مراجعة إنجازات مهام السبرنت الحالي.\n2. مناقشة الاختناقات في عمود قيد التنفيذ.\n3. تحديد أولويات التوزيع لليوم القادم.'
        : '- Meeting Agenda:\n1. Review completed sprint milestones.\n2. Discuss bottlenecks in In-Progress column.\n3. Align on delivery commitments.')
    );
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  const roomName = sanitizeRoomName(project.name, project.id);
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Engineer';
  const jitsiConferenceUrl = `https://meet.jit.si/${roomName}#userInfo.displayName=${encodeURIComponent(
    userName
  )}&config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  // عداد الاجتماع
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // حفظ محضر الاجتماع تلقائيا
  const handleAgendaChange = (val: string) => {
    setMeetingAgenda(val);
    try {
      localStorage.setItem(agendaStorageKey, val);
    } catch {
      // ignore
    }
  };

  // تهيئة كاميرا ومايكروفون المتصفح عند تشغيل وضع الفحص المباشر
  const startNativeMedia = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setMediaStream(stream);
      setHasMediaPermissions(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setHasMediaPermissions(false);
    }
  }, []);

  const stopNativeMedia = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    }
  }, [mediaStream, screenStream]);

  useEffect(() => {
    if (mode === 'native_bench') {
      startNativeMedia();
    } else {
      stopNativeMedia();
    }
    return () => {
      stopNativeMedia();
    };
  }, [mode, startNativeMedia, stopNativeMedia]);

  // التحكم في المايك والكاميرا
  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    } else {
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCam = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    } else {
      setIsCamOff(!isCamOff);
    }
  };

  // مشاركة الشاشة الحقيقية عبر WebRTC getDisplayMedia
  const toggleScreenShare = async () => {
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

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream;
      }

      displayStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
      };

      message.success(isArabic ? 'بدأت مشاركة الشاشة بنجاح.' : 'Screen sharing started.');
    } catch {
      setIsScreenSharing(false);
    }
  };

  // نسخ رابط الاجتماع
  const copyRoomLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(`https://meet.jit.si/${roomName}`);
    message.success(
      isArabic
        ? 'تم نسخ رابط غرفة الاجتماع المشفرة إلى الحافظة.'
        : 'Meeting room link copied to clipboard.'
    );
  };

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
                {isArabic ? 'قاعة الاجتماعات الرسمية' : 'Official Project Conference'}
              </h2>
              <span className={STYLES.badgeLive}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isArabic ? 'مباشر نشط' : 'LIVE ROOM'}
              </span>
              <span className="font-mono text-xs tabular-nums px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--text-2)]">
                {formatTimer(meetingDuration)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-2)] m-0 mt-0.5">
              {project.name} • {isArabic ? 'اجتماع مشفر عبر WebRTC عالي الجودة' : 'Encrypted WebRTC HD Session'}
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switch */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Tabs */}
          <div className="flex items-center rounded-lg border border-[var(--line)] p-0.5 bg-[var(--surface)]">
            <button
              type="button"
              className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors select-none ${
                mode === 'jitsi_room'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-2xs'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
              onClick={() => setMode('jitsi_room')}
            >
              <GlobalOutlined className="me-1 text-xs" />
              {isArabic ? 'قاعة المؤتمر المشفرة' : 'Live Video Room'}
            </button>
            <button
              type="button"
              className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors select-none ${
                mode === 'native_bench'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-2xs'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
              onClick={() => setMode('native_bench')}
            >
              <SettingOutlined className="me-1 text-xs" />
              {isArabic ? 'استوديو الفحص المباشر' : 'Native AV Bench'}
            </button>
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
      {mode === 'jitsi_room' ? (
        /* MODE A: EMBEDDED REAL JITSI CONFERENCE ROOM */
        <div className="p-3 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--line)] text-xs text-[var(--text-2)]">
            <div className="flex items-center gap-2">
              <SafetyCertificateOutlined className="text-[var(--accent)] text-sm" />
              <span>
                {isArabic
                  ? 'قاعة مشفرة مباشرة بدون تسجيل أو خوادم وسيطة، يمكن لأي عضو مشاركة الكاميرا والشاشة والصوت فوريا.'
                  : 'Direct peer-to-peer WebRTC mesh session. Any teammate with the link joins instantly.'}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[var(--text)]">
              Room: {roomName}
            </span>
          </div>

          <div className="relative w-full h-[640px] rounded-xl border border-[var(--line)] bg-[#0B0F19] overflow-hidden shadow-sm">
            <iframe
              src={jitsiConferenceUrl}
              title={isArabic ? 'غرفة اجتماعات المشروع' : 'Project Video Conference'}
              allow="camera; microphone; display-capture; autoplay; clipboard-write"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      ) : (
        /* MODE B: NATIVE WEBRTC BENCH (CAMERA + AUDIO ANALYZER + SCREEN SHARING + AGENDA) */
        <div className={STYLES.mainStage}>
          {/* Main Video & Screen Pane */}
          <div className={STYLES.videoContainer}>
            {isScreenSharing ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative p-2">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute top-4 start-4 px-3 py-1 rounded-md bg-black/70 border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-xs">
                  <DesktopOutlined className="text-emerald-400" />
                  {isArabic ? 'مشاركة الشاشة قيد البث المباشر' : 'Live Screen Share Active'}
                </div>
              </div>
            ) : hasMediaPermissions === false ? (
              <div className="text-center p-8 text-slate-400 select-none">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <VideoCameraOutlined className="text-2xl" />
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">
                  {isArabic ? 'إذن الكاميرا أو الميكروفون غير مفعل' : 'Camera or Mic Permissions Not Granted'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm m-0 mb-4">
                  {isArabic
                    ? 'يرجى السماح للمتصفح بالوصول إلى الكاميرا والميكروفون لتفعيل المعاينة اللحظية.'
                    : 'Please grant browser permission to camera and microphone to activate real-time feed.'}
                </p>
                <Button
                  type="primary"
                  onClick={startNativeMedia}
                  className="tactile-btn text-xs font-bold"
                >
                  {isArabic ? 'إعادة طلب الإذن' : 'Request Permissions Again'}
                </Button>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center relative">
                {isCamOff ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 select-none">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xl text-slate-300 mb-2">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {isArabic ? 'الكاميرا مغلقة حالياً' : 'Camera is turned off'}
                    </span>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-lg scale-x-[-1]"
                  />
                )}

                {/* Overlaid Status Bar */}
                <div className="absolute bottom-4 start-4 flex items-center gap-2">
                  <div className="px-3 py-1 rounded-md bg-black/70 border border-white/20 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-2">
                    <span>{userName}</span>
                    {isMicMuted && (
                      <span className="text-rose-400 text-[10px] uppercase font-mono">
                        ({isArabic ? 'مكتوم' : 'Muted'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="absolute top-4 end-4">
                  <AudioVisualizer stream={mediaStream} isMuted={isMicMuted} />
                </div>
              </div>
            )}
          </div>

          {/* Side Panel: Team Roster & Meeting Minutes */}
          <div className={STYLES.sidePanel}>
            {/* Team Roster */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                  <TeamOutlined className="text-xs text-[var(--accent)]" />
                  {isArabic ? 'المشاركون في الغرفة' : 'Room Participants'}
                </span>
                <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--line)] text-[var(--text-2)]">
                  {project.memberIds?.length || 1}
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-[var(--text)] truncate">
                      {userName} ({isArabic ? 'أنت' : 'You'})
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-mono font-bold">
                    {isArabic ? 'نشط' : 'Active'}
                  </span>
                </div>

                {project.memberDetails &&
                  Object.values(project.memberDetails)
                    .filter((m) => m.email !== currentUser?.email)
                    .map((m) => (
                      <div
                        key={m.id || m.uid}
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[var(--surface)] text-[var(--text-2)] font-bold text-[10px] flex items-center justify-center shrink-0 border border-[var(--line)]">
                            {m.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[var(--text-2)] truncate">
                            {m.displayName}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-2)] font-mono">
                          {isArabic ? 'متاح' : 'Idle'}
                        </span>
                      </div>
                    ))}
              </div>
            </div>

            {/* Meeting Agenda & Minutes */}
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
                onChange={(e) => handleAgendaChange(e.target.value)}
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
      )}

      {/* 3. Media Controls Bar (Only in Native Bench Mode) */}
      {mode === 'native_bench' && (
        <div className={STYLES.controlDock}>
          {/* Mute Mic */}
          <Button
            type={isMicMuted ? 'default' : 'primary'}
            icon={
              isMicMuted ? (
                <AudioMutedOutlined className="text-xs text-rose-500" />
              ) : (
                <AudioOutlined className="text-xs" />
              )
            }
            onClick={toggleMic}
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

          {/* Toggle Camera */}
          <Button
            type="default"
            icon={<VideoCameraOutlined className="text-xs" />}
            onClick={toggleCam}
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
            onClick={toggleScreenShare}
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

          {/* Jump to Full Jitsi Conference */}
          <Button
            type="primary"
            icon={<GlobalOutlined className="text-xs" />}
            onClick={() => setMode('jitsi_room')}
            className={`${STYLES.controlBtn} !bg-indigo-600 hover:!bg-indigo-700 !text-white`}
          >
            {isArabic ? 'الانتقال للقاعة الجماعية' : 'Launch Group Room'}
          </Button>
        </div>
      )}
    </div>
  );
}
