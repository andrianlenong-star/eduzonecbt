import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  Hourglass,
  Loader2,
  PenTool,
  FileText,
  Camera,
  Video,
  VideoOff,
  ShieldAlert,
  ShieldCheck,
  Flag,
  Grid,
  Type,
  Lock,
  Eye,
  LogOut,
} from 'lucide-react';
import { Question, ExamSettings } from '../types';

interface ExamViewProps {
  questions: Question[];
  settings: ExamSettings;
  siswaNama: string;
  siswaKelas: string;
  siswaNisn?: string;
  onFinishExam: (
    userAnswers: Record<number, string | string[]>,
    violations: number,
    isAutoTerminated?: boolean,
    autoTerminationReason?: string,
    proctoringPhotos?: string[]
  ) => void;
  violations: number;
}

export const ExamView: React.FC<ExamViewProps> = ({
  questions,
  settings,
  siswaNama,
  siswaKelas,
  siswaNisn,
  onFinishExam,
  violations,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | string[]>>({});
  const [userDoubts, setUserDoubts] = useState<Record<number, boolean>>({});
  
  // EduZone CBT Font Scaling: 'sm' | 'md' | 'lg'
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  
  // Total exam duration in seconds
  const totalDurationSeconds = Math.max(1, (settings.durasiMenit || 60) * 60);
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  
  // Modals & Drawers
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDaftarSoalModal, setShowDaftarSoalModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showAutoTerminatedModal, setShowAutoTerminatedModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Automatic Camera Proctoring (Rekam Otomatis Gadget)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [proctoringPhotos, setProctoringPhotos] = useState<string[]>([]);
  const [isCameraMinimized, setIsCameraMinimized] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // References to keep callbacks fresh
  const latestAnswersRef = useRef(userAnswers);
  latestAnswersRef.current = userAnswers;

  const latestViolationsRef = useRef(violations);
  latestViolationsRef.current = violations;

  const latestProctoringPhotosRef = useRef(proctoringPhotos);
  latestProctoringPhotosRef.current = proctoringPhotos;

  const onFinishExamRef = useRef(onFinishExam);
  onFinishExamRef.current = onFinishExam;

  const hasSubmittedRef = useRef(false);

  // Anti-Cheat protection: startup grace period and camera request flag
  const mountTimeRef = useRef(Date.now());
  const isRequestingCameraRef = useRef(true);
  const hasEnteredFullscreenRef = useRef(false);
  const blurDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current moment is exempt from cheat penalties (startup grace period or camera prompt)
  const isExemptFromCheatCheck = () => {
    // 8-second startup grace period for camera authorization, DOM mount, and fullscreen
    if (Date.now() - mountTimeRef.current < 8000) return true;
    if (isRequestingCameraRef.current) return true;
    if (hasSubmittedRef.current) return true;
    return false;
  };

  // Capture a snapshot frame from the webcam
  const captureProctoringSnapshot = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240);
          // Add timestamp & integrity badge watermark
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(0, 210, 320, 30);
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`EDUZONE PROCTOR • ${new Date().toLocaleTimeString('id-ID')}`, 8, 228);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText(`Soal #${currentIdx + 1}`, 260, 228);

          const photoData = canvas.toDataURL('image/jpeg', 0.65);
          setProctoringPhotos((prev) => {
            const updated = [...prev, photoData];
            // Keep up to 10 latest snapshots to conserve memory
            return updated.slice(-10);
          });
        }
      }
    } catch (e) {
      console.warn('Gagal menangkap foto pengawas:', e);
    }
  };

  // Start Proctoring Webcam stream
  useEffect(() => {
    let mounted = true;
    isRequestingCameraRef.current = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Perangkat tidak mendukung kamera web');
          isRequestingCameraRef.current = false;
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (mounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraActive(true);
          setCameraError(null);

          // Initial snapshot after 2 seconds
          setTimeout(() => {
            if (mounted) captureProctoringSnapshot();
          }, 2000);
        }
      } catch (err: any) {
        console.warn('Izin kamera tidak diberikan atau perangkat kamera tidak ditemukan:', err);
        if (mounted) {
          setCameraActive(false);
          setCameraError('Kamera tidak aktif / izin belum diberikan');
        }
      } finally {
        setTimeout(() => {
          isRequestingCameraRef.current = false;
        }, 1500);
      }
    }

    initCamera();

    // Auto-capture snapshots every 90 seconds
    const photoInterval = setInterval(() => {
      captureProctoringSnapshot();
    }, 90000);

    return () => {
      mounted = false;
      clearInterval(photoInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Request Fullscreen Lock automatically on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (settings.kunciLayarPenuh !== false && document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
          hasEnteredFullscreenRef.current = true;
        }
      } catch {
        // Browser requires user gesture; user can use the fullscreen toggle
      }
    };
    enterFullscreen();

    const handleFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);

      if (inFs) {
        hasEnteredFullscreenRef.current = true;
      } else {
        // If strict mode is enabled and user leaves fullscreen outside grace period
        if (hasEnteredFullscreenRef.current && !isExemptFromCheatCheck() && settings.akhiriOtomatisJikaCurang !== false) {
          captureProctoringSnapshot();
          triggerAutoTermination('Terdeteksi Keluar dari Mode Layar Penuh (Fullscreen Lock)');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Trigger Automatic Exam Termination (Akhiri Ujian Saat Peserta Mencoba Buka Tab Lain)
  const triggerAutoTermination = (reasonText: string) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    captureProctoringSnapshot();
    setTerminationReason(reasonText);
    setShowAutoTerminatedModal(true);

    setTimeout(() => {
      onFinishExamRef.current(
        latestAnswersRef.current,
        latestViolationsRef.current + 1,
        true,
        reasonText,
        latestProctoringPhotosRef.current
      );
    }, 2500);
  };

  // Kunci Tombol Lain (Keyboard Lockdown) & Anti-Cheat Tab-Switch Detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Block F1 to F12
      if (e.key.startsWith('F') && !isNaN(Number(e.key.slice(1)))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 2. Block Ctrl / Cmd shortcut combos
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        // r = refresh, w = close tab, t = new tab, n = new window, p = print, u = view source,
        // s = save, c = copy, v = paste, x = cut, a = select all, i/j = devtools
        if (['r', 'w', 't', 'n', 'p', 'u', 's', 'c', 'v', 'x', 'a', 'i', 'j'].includes(k)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // 3. Block Alt combos (Alt+Tab, Alt+F4)
      if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 4. Block Escape (avoid exiting fullscreen accidentally)
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Tab blur / switch window detection
    const handleBlur = () => {
      if (isExemptFromCheatCheck()) return;

      if (blurDebounceRef.current) {
        clearTimeout(blurDebounceRef.current);
      }

      // If document is explicitly hidden (true tab switch or minimized window)
      if (document.hidden) {
        if (settings.akhiriOtomatisJikaCurang !== false) {
          triggerAutoTermination('Terdeteksi Berpindah Tab / Membuka Aplikasi Lain Saat Ujian Berlangsung');
        }
        return;
      }

      // If document merely lost focus (e.g. browser chrome click, system notification)
      // Debounce 2.5 seconds to avoid false positives
      blurDebounceRef.current = setTimeout(() => {
        if (!isExemptFromCheatCheck() && !document.hasFocus() && settings.akhiriOtomatisJikaCurang !== false) {
          triggerAutoTermination('Terdeteksi Jendela Ujian Kehilangan Fokus / Membuka Aplikasi Lain');
        }
      }, 2500);
    };

    const handleFocus = () => {
      // Regained focus: cancel transient blur check
      if (blurDebounceRef.current) {
        clearTimeout(blurDebounceRef.current);
        blurDebounceRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (isExemptFromCheatCheck()) return;

      if (document.hidden) {
        if (settings.akhiriOtomatisJikaCurang !== false) {
          triggerAutoTermination('Terdeteksi Meminimalkan / Meninggalkan Jendela Ujian');
        }
      } else {
        if (blurDebounceRef.current) {
          clearTimeout(blurDebounceRef.current);
          blurDebounceRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (blurDebounceRef.current) {
        clearTimeout(blurDebounceRef.current);
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            setShowTimeUpModal(true);
            setShowConfirmModal(false);

            setTimeout(() => {
              onFinishExamRef.current(
                latestAnswersRef.current,
                latestViolationsRef.current,
                false,
                'Waktu Habis',
                latestProctoringPhotosRef.current
              );
            }, 1800);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isCritical = timeLeft <= 60; // <= 1 min
  const isWarning = timeLeft <= 300 && !isCritical; // <= 5 min
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDurationSeconds) * 100));

  const currentQ = questions && questions.length > 0 ? questions[currentIdx] || questions[0] : null;

  if (!questions || questions.length === 0 || !currentQ) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black uppercase mb-2">Soal Sedang Disinkronkan</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6 font-medium">
          Daftar soal sedang disiapkan oleh sistem EduZone CBT.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  const isQuestionAnswered = (idx: number) => {
    const ans = userAnswers[idx];
    if (ans === undefined || ans === null) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    return String(ans).trim() !== '';
  };

  const handleSelectSingle = (val: string) => {
    setUserAnswers((prev) => ({ ...prev, [currentIdx]: val }));
    captureProctoringSnapshot();
  };

  const handleTogglePGK = (key: string) => {
    setUserAnswers((prev) => {
      const currentSelected = Array.isArray(prev[currentIdx])
        ? (prev[currentIdx] as string[])
        : [];
      const updated = currentSelected.includes(key)
        ? currentSelected.filter((k) => k !== key)
        : [...currentSelected, key];
      return { ...prev, [currentIdx]: updated };
    });
    captureProctoringSnapshot();
  };

  const handleToggleDoubt = () => {
    setUserDoubts((prev) => ({
      ...prev,
      [currentIdx]: !prev[currentIdx],
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const answeredCount = Object.keys(userAnswers).filter((k) =>
    isQuestionAnswered(Number(k))
  ).length;

  // Font sizing styles for EduZone CBT question reader
  const questionFontSizeClass =
    fontScale === 'sm'
      ? 'text-sm sm:text-base leading-relaxed'
      : fontScale === 'lg'
      ? 'text-xl sm:text-2xl leading-loose font-bold'
      : 'text-base sm:text-lg leading-relaxed font-semibold';

  const optionFontSizeClass =
    fontScale === 'sm'
      ? 'text-xs sm:text-sm'
      : fontScale === 'lg'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';

  return (
    <div className="h-screen flex flex-col bg-[#f0f4f8] overflow-hidden font-sans select-none text-slate-800">
      {/* Hidden canvas for taking proctoring camera snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* EDUZONE CBT TOP HEADER */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shrink-0 border-b-4 border-cyan-500 z-20">
        {/* Left: School Logo (Large & Oval) + School Identity */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-12 sm:w-20 sm:h-14 px-2 py-1 rounded-[999px] bg-white border-2 border-cyan-400 shadow-md flex items-center justify-center shrink-0">
            <img
              src={settings.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/480px-Logo_Tut_Wuri_Handayani.png"}
              alt="Logo Sekolah"
              className="w-full h-full object-contain rounded-[999px]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('Tut_Wuri_Handayani')) {
                  target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/480px-Logo_Tut_Wuri_Handayani.png";
                }
              }}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.2 rounded bg-cyan-600 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                EDUZONE CBT
              </span>
              <span className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider hidden sm:inline">
                {settings.mapel || 'Ujian Sekolah'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight text-white drop-shadow-sm">
              {settings.sekolah || 'EduZone'}
            </h1>
          </div>
        </div>

        {/* Center: EduZone CBT Iconic Countdown Timer Box */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-2xl border-2 transition-all duration-300 shadow-md flex items-center gap-2.5 ${
              isCritical
                ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                : isWarning
                ? 'bg-amber-500 border-amber-300 text-slate-950 font-black'
                : 'bg-slate-800 border-cyan-500 text-yellow-300 font-black'
            }`}
            title="Sisa Waktu Ujian"
          >
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isCritical ? 'animate-bounce' : 'animate-pulse'}`} />
            <div className="text-center">
              <span className="text-[9px] block uppercase font-bold tracking-widest leading-none text-white/80">
                Sisa Waktu
              </span>
              <span className="font-mono text-base sm:text-xl font-black tracking-wider leading-none">
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Student Profile */}
        <div className="flex items-center gap-3">
          {/* Font Sizer Controls (EduZone CBT A- A A+) */}
          <div className="hidden md:flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFontScale('sm')}
              className={`px-2 py-1 rounded-lg font-bold transition ${
                fontScale === 'sm' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Ukuran Tulisan Kecil"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontScale('md')}
              className={`px-2 py-1 rounded-lg font-bold transition ${
                fontScale === 'md' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Ukuran Tulisan Normal"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontScale('lg')}
              className={`px-2 py-1 rounded-lg font-bold transition ${
                fontScale === 'lg' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Ukuran Tulisan Besar"
            >
              A+
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 text-xs font-bold transition cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Kiosk)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Student Profile Card */}
          <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-black uppercase text-white leading-tight line-clamp-1 max-w-[120px]">
                {siswaNama}
              </p>
              <p className="text-[10px] text-cyan-300 font-bold uppercase leading-tight">
                {siswaKelas} {siswaNisn ? `• ${siswaNisn}` : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* EDUZONE CBT SUB-HEADER BAR */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Terjawab: <strong className="text-cyan-700">{answeredCount}</strong> dari {questions.length} Butir
          </span>
          <div className="hidden sm:inline-block w-24 bg-slate-100 h-2 rounded-full overflow-hidden ml-2">
            <div
              className="bg-cyan-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / (questions.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Kamera Pengawas */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold">
            <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`}></span>
            <span className={cameraActive ? 'text-red-700' : 'text-slate-500'}>
              {cameraActive ? 'Proctoring REC' : 'Kamera Nonaktif'}
            </span>
          </div>

          {/* Tombol Daftar Soal */}
          <button
            type="button"
            onClick={() => setShowDaftarSoalModal(true)}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Daftar Soal</span>
          </button>
        </div>
      </div>

      {/* EDUZONE CBT MAIN EXAM WORKSPACE */}
      <div className="flex-grow flex p-3 sm:p-5 overflow-hidden gap-4 max-w-7xl mx-auto w-full">
        {/* Main Active Question Container */}
        <main className="flex-grow flex flex-col h-full overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-md">
          {/* Question Top Subheader */}
          <div className="px-5 sm:px-7 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <span className="bg-cyan-600 text-white font-mono font-black px-4 py-1.5 rounded-xl text-xs uppercase tracking-wider shadow-sm">
                SOAL NO. {currentIdx + 1}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-slate-200 text-slate-700">
                {currentQ.tipe === 'PG'
                  ? 'Pilihan Ganda'
                  : currentQ.tipe === 'PGK'
                  ? 'Pilihan Ganda Kompleks'
                  : currentQ.tipe === 'BS'
                  ? 'Benar / Salah'
                  : currentQ.tipe === 'ISIAN'
                  ? 'Isian Singkat'
                  : 'Uraian / Essay'}
              </span>
              {currentQ.difficulty === 'HOTS' && (
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>HOTS</span>
                </span>
              )}
            </div>

            {/* Mobile Font Sizer shortcut */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={() => setFontScale('sm')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${fontScale === 'sm' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontScale('md')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${fontScale === 'md' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontScale('lg')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${fontScale === 'lg' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                A+
              </button>
            </div>
          </div>

          {/* Question Body Scrollable Area */}
          <div className="flex-grow p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-6">
            {/* Optional Question Image */}
            {currentQ.image && (
              <div className="relative group inline-block max-w-lg mb-2">
                <img
                  src={currentQ.image}
                  alt="Lampiran Soal"
                  className="rounded-2xl max-h-64 object-contain border-4 border-slate-100 shadow-sm cursor-pointer group-hover:opacity-90 transition"
                  onClick={() => setZoomImage(currentQ.image)}
                />
                <button
                  type="button"
                  onClick={() => setZoomImage(currentQ.image)}
                  className="absolute bottom-3 right-3 bg-slate-900/85 text-white p-2 rounded-xl text-xs flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Perbesar</span>
                </button>
              </div>
            )}

            {/* Question Text */}
            <div className={`${questionFontSizeClass} text-slate-900 select-none whitespace-pre-wrap`}>
              {currentQ.content}
            </div>

            {currentQ.tipe === 'PGK' && (
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Petunjuk EduZone CBT: Anda dapat memilih lebih dari satu jawaban benar.</span>
              </div>
            )}

            {/* OPTIONS SECTION - EDUZONE CBT SIGNATURE ROUND RADIO STYLE */}
            <div className="space-y-3 pt-2">
              {/* 1. PILIHAN GANDA (PG) */}
              {currentQ.tipe === 'PG' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = userAnswers[currentIdx] === letter;

                    return (
                      <div
                        key={i}
                        onClick={() => handleSelectSingle(letter)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'border-cyan-600 bg-cyan-50/70 shadow-md ring-2 ring-cyan-500/20'
                            : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50'
                        }`}
                      >
                        {/* EduZone CBT Round Letter Circle */}
                        <div
                          className={`w-10 h-10 rounded-full font-mono font-black text-sm flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                            isSelected
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {letter}
                        </div>
                        <span className={`${optionFontSizeClass} font-medium text-slate-800 leading-relaxed flex-grow`}>
                          {opt}
                        </span>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. PILIHAN GANDA KOMPLEKS (PGK) */}
              {currentQ.tipe === 'PGK' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const currentSelected = Array.isArray(userAnswers[currentIdx])
                      ? (userAnswers[currentIdx] as string[])
                      : [];
                    const isSelected = currentSelected.includes(letter);

                    return (
                      <div
                        key={i}
                        onClick={() => handleTogglePGK(letter)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'border-cyan-600 bg-cyan-50/70 shadow-md ring-2 ring-cyan-500/20'
                            : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl font-mono font-black text-sm flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                            isSelected
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {isSelected ? <Check className="w-5 h-5 stroke-[3]" /> : letter}
                        </div>
                        <span className={`${optionFontSizeClass} font-medium text-slate-800 leading-relaxed flex-grow`}>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. BENAR / SALAH (BS) */}
              {currentQ.tipe === 'BS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  {['Benar', 'Salah'].map((val) => {
                    const isSelected = userAnswers[currentIdx] === val;
                    const isBenar = val === 'Benar';

                    return (
                      <div
                        key={val}
                        onClick={() => handleSelectSingle(val)}
                        className={`p-6 rounded-2xl border-3 cursor-pointer transition-all flex items-center justify-center gap-4 font-black text-lg ${
                          isSelected
                            ? isBenar
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-md ring-4 ring-emerald-500/20'
                              : 'border-rose-600 bg-rose-50 text-rose-800 shadow-md ring-4 ring-rose-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            isBenar ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        >
                          {isBenar ? <Check className="w-6 h-6 stroke-[3]" /> : <X className="w-6 h-6 stroke-[3]" />}
                        </div>
                        <span>PERNYATAAN {val.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. ISIAN SINGKAT */}
              {currentQ.tipe === 'ISIAN' && (
                <div className="space-y-3 max-w-2xl bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-cyan-600" />
                    <span>Lembar Jawaban Isian Singkat:</span>
                  </label>
                  <input
                    type="text"
                    value={typeof userAnswers[currentIdx] === 'string' ? (userAnswers[currentIdx] as string) : ''}
                    onChange={(e) => handleSelectSingle(e.target.value)}
                    placeholder="Ketikkan jawaban Anda di sini..."
                    className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-bold text-base text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 transition shadow-sm"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 pt-1">
                    <span>
                      Status:{' '}
                      {isQuestionAnswered(currentIdx) ? (
                        <span className="text-emerald-600">✓ Sudah Terjawab</span>
                      ) : (
                        <span className="text-amber-600">Belum Terjawab</span>
                      )}
                    </span>
                    <span>{String(userAnswers[currentIdx] || '').length} Karakter</span>
                  </div>
                </div>
              )}

              {/* 5. URAIAN / ESSAY */}
              {currentQ.tipe === 'URAIAN' && (
                <div className="space-y-3 max-w-3xl bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    <span>Lembar Jawaban Uraian / Essay:</span>
                  </label>
                  <textarea
                    rows={6}
                    value={typeof userAnswers[currentIdx] === 'string' ? (userAnswers[currentIdx] as string) : ''}
                    onChange={(e) => handleSelectSingle(e.target.value)}
                    placeholder="Tuliskan uraian lengkap Anda di sini..."
                    className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-medium text-sm sm:text-base text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 transition shadow-sm leading-relaxed"
                    spellCheck="false"
                  />
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 pt-1">
                    <span>
                      Status:{' '}
                      {isQuestionAnswered(currentIdx) ? (
                        <span className="text-emerald-600">✓ Sudah Diisi</span>
                      ) : (
                        <span className="text-amber-600">Belum Diisi</span>
                      )}
                    </span>
                    <span>
                      {String(userAnswers[currentIdx] || '').trim() ? String(userAnswers[currentIdx] || '').trim().split(/\s+/).length : 0} Kata
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* EDUZONE CBT BOTTOM ACTION DOCKED BAR */}
          <footer className="p-4 sm:p-5 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 rounded-b-3xl">
            {/* Tombol Sebelumnya (EduZone CBT Navy) */}
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold uppercase text-xs tracking-wider text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Tombol Ragu-Ragu (EduZone CBT Signature Yellow Button) */}
            <label className="flex items-center gap-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-5 sm:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition select-none">
              <input
                type="checkbox"
                checked={!!userDoubts[currentIdx]}
                onChange={handleToggleDoubt}
                className="w-4 h-4 accent-yellow-900 rounded"
              />
              <Flag className="w-4 h-4 text-yellow-950" />
              <span>Ragu-Ragu</span>
            </label>

            {/* Tombol Berikutnya / Selesai (EduZone CBT Cyan / Green) */}
            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase text-xs tracking-wider shadow-md transition cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-selesai-ujian-eduzone"
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider shadow-lg transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai Ujian</span>
              </button>
            )}
          </footer>
        </main>
      </div>

      {/* FLOATING PROCTORING WEBCAM PIP BOX (Rekam Otomatis Gadget) */}
      <div
        className={`fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 bg-slate-900/95 backdrop-blur-md rounded-2xl border-2 border-red-500 shadow-2xl p-2.5 text-white transition-all duration-300 ${
          isCameraMinimized ? 'w-14 h-14 overflow-hidden rounded-full cursor-pointer' : 'w-48 sm:w-56'
        }`}
      >
        {isCameraMinimized ? (
          <button
            type="button"
            onClick={() => setIsCameraMinimized(false)}
            className="w-full h-full flex items-center justify-center bg-red-600 rounded-full animate-pulse"
            title="Buka Kamera Pengawas"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] font-black uppercase">
              <div className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>Proctoring Aktif</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraMinimized(true)}
                className="text-slate-400 hover:text-white p-0.5"
                title="Kecilkan Kamera"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Video element */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-900/90 text-xs">
                  <VideoOff className="w-6 h-6 text-red-400 mb-1" />
                  <span className="text-[10px] text-slate-300 leading-tight">
                    {cameraError || 'Kamera memuat...'}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 font-bold px-0.5">
              <span>{siswaNama.split(' ')[0]}</span>
              <span className="text-emerald-400">● Live Monitor</span>
            </div>
          </div>
        )}
      </div>

      {/* EDUZONE CBT DAFTAR SOAL MODAL (Sliding / Modal Grid) */}
      {showDaftarSoalModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white max-w-xl w-full rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-cyan-500 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowDaftarSoalModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  Daftar Nomor Soal Ujian
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Klik nomor soal di bawah untuk langsung menuju naskah soal
                </p>
              </div>
            </div>

            {/* Grid 1 to N */}
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2.5 overflow-y-auto p-2 custom-scrollbar flex-grow">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAns = isQuestionAnswered(idx);
                const isDoubt = !!userDoubts[idx];

                let bgClass = 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100';
                if (isDoubt) {
                  bgClass = 'bg-yellow-400 text-slate-950 font-black border-yellow-500 shadow-sm';
                } else if (isAns) {
                  bgClass = 'bg-cyan-600 text-white font-black border-cyan-700 shadow-sm';
                }

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowDaftarSoalModal(false);
                    }}
                    className={`h-11 rounded-xl text-xs font-mono font-black border-2 transition-all flex flex-col items-center justify-center relative cursor-pointer ${bgClass} ${
                      isCurrent ? 'ring-4 ring-blue-500 scale-105 z-10' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isAns && typeof userAnswers[idx] === 'string' && (
                      <span className="text-[9px] opacity-90 leading-none">
                        ({String(userAnswers[idx])})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* EduZone CBT Legend Bar */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs font-bold text-center mt-4">
              <div className="flex items-center gap-2 justify-center p-2 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200">
                <span className="w-3.5 h-3.5 rounded-md bg-cyan-600" />
                <span>Sudah ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2 justify-center p-2 rounded-xl bg-yellow-50 text-yellow-800 border border-yellow-200">
                <span className="w-3.5 h-3.5 rounded-md bg-yellow-400" />
                <span>Ragu-Ragu</span>
              </div>
              <div className="flex items-center gap-2 justify-center p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                <span className="w-3.5 h-3.5 rounded-md bg-white border border-slate-400" />
                <span>Belum ({questions.length - answeredCount})</span>
              </div>
            </div>

            <div className="mt-4 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDaftarSoalModal(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase text-xs tracking-wider transition cursor-pointer"
              >
                Kembali Ke Lembar Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION FINISH MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl text-center border-b-8 border-cyan-600">
            <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
              Konfirmasi Selesai Ujian
            </h3>
            <p className="text-slate-600 text-sm font-medium mb-4 leading-relaxed">
              Anda telah menjawab <strong className="text-cyan-700 font-bold">{answeredCount}</strong> dari{' '}
              <strong className="text-slate-900 font-bold">{questions.length}</strong> butir soal. Apakah Anda
              yakin ingin mengakhiri sesi ujian ini?
            </p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-600" /> Sisa Waktu Ujian:
              </span>
              <span className={`font-mono font-black text-sm ${isCritical ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                {formatTimer(timeLeft)}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 border-2 border-slate-200 rounded-2xl font-bold uppercase text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cek Kembali
              </button>
              <button
                type="button"
                id="btn-konfirmasi-selesai-eduzone"
                onClick={() => {
                  setShowConfirmModal(false);
                  captureProctoringSnapshot();
                  onFinishExam(
                    userAnswers,
                    violations,
                    false,
                    'Selesai Normal',
                    proctoringPhotos
                  );
                }}
                className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg hover:bg-emerald-700 transition cursor-pointer"
              >
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTO-TERMINATED MODAL (Saat peserta mencoba buka tab lain / curang) */}
      {showAutoTerminatedModal && (
        <div className="fixed inset-0 bg-red-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-6 text-white text-center animate-in fade-in select-none">
          <div className="bg-white text-slate-900 max-w-lg w-full rounded-3xl p-8 shadow-2xl border-4 border-red-600 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-200 animate-pulse">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-black uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Sistem Integritas EduZone CBT</span>
            </div>

            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
              Ujian Diakhiri Oleh Sistem!
            </h3>

            <p className="text-slate-600 text-sm font-medium mb-4 leading-relaxed">
              Anda terdeteksi mencoba <strong>berpindah tab / membuka aplikasi lain</strong> di luar lembar ujian.
              Sesuai aturan keamanan CBT profesional, ujian Anda <strong>otomatis dihentikan dan lembar jawaban dikumpulkan</strong> saat itu juga.
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold mb-5">
              Alasan: {terminationReason || 'Pelanggaran batas jendela ujian terdeteksi'}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              <span>Mengalihkan ke lembar ringkasan hasil...</span>
            </div>
          </div>
        </div>
      )}

      {/* TIME UP MODAL */}
      {showTimeUpModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl text-center border-b-8 border-rose-600">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-5 ring-8 ring-rose-50">
              <Hourglass className="w-10 h-10 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Waktu Ujian Berakhir (00:00:00)</span>
            </div>

            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-3">
              Waktu Pengerjaan Habis!
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
              Durasi pengerjaan telah berakhir. Sistem EduZone CBT secara otomatis menyimpan dan mengumpulkan lembar jawaban Anda.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-3 text-xs font-bold text-slate-700">
              <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
              <span>Menyimpan nilai ke cloud database...</span>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="max-w-4xl max-h-[85vh] relative">
            <img
              src={zoomImage}
              alt="Zoomed"
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl border-4 border-white"
            />
            <p className="text-white text-center text-xs mt-3 font-semibold">
              Klik di mana saja untuk menutup pratinjau gambar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
