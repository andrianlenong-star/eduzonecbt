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
  Check,
  X,
  Sparkles,
  AlertTriangle,
  Hourglass,
  Loader2,
  PenTool,
  FileText,
  Type,
} from 'lucide-react';
import { Question, ExamSettings } from '../types';
import { getLogoShapeClass, getLogoFitClass } from '../utils/logoHelper';

interface ExamViewProps {
  questions: Question[];
  settings: ExamSettings;
  siswaNama: string;
  siswaKelas: string;
  onFinishExam: (userAnswers: Record<number, string | string[]>, violations: number) => void;
  violations: number;
}

export const ExamView: React.FC<ExamViewProps> = ({
  questions,
  settings,
  siswaNama,
  siswaKelas,
  onFinishExam,
  violations,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | string[]>>({});
  const [userDoubts, setUserDoubts] = useState<Record<number, boolean>>({});
  
  // Total exam duration in seconds
  const totalDurationSeconds = Math.max(1, (settings.durasiMenit || 60) * 60);
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  // References to keep callbacks and latest state fresh without resetting the interval timer
  const latestAnswersRef = useRef(userAnswers);
  latestAnswersRef.current = userAnswers;

  const latestViolationsRef = useRef(violations);
  latestViolationsRef.current = violations;

  const onFinishExamRef = useRef(onFinishExam);
  onFinishExamRef.current = onFinishExam;

  const hasSubmittedRef = useRef(false);

  // Timer countdown effect - runs once and continuously ticks down every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            setIsAutoSubmitting(true);
            setShowTimeUpModal(true);
            setShowConfirmModal(false);

            // Auto-submit after 1.5 seconds grace period so student understands that time expired
            setTimeout(() => {
              onFinishExamRef.current(latestAnswersRef.current, latestViolationsRef.current);
            }, 1500);
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

  // Warning thresholds
  const isCritical = timeLeft <= 60; // 1 minute or less
  const isWarning = timeLeft <= 300 && !isCritical; // 5 minutes or less
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDurationSeconds) * 100));

  const currentQ = (questions && questions.length > 0) ? (questions[currentIdx] || questions[0]) : null;

  // Safe fallback if questions are not available
  if (!questions || questions.length === 0 || !currentQ) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black uppercase mb-2">Soal Sedang Dimuat</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6 font-medium">
          Daftar soal sedang disinkronkan dari bank soal sekolah. Silakan klik tombol di bawah untuk memuat soal.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  // Helper to check answered status
  const isQuestionAnswered = (idx: number) => {
    const ans = userAnswers[idx];
    if (ans === undefined || ans === null) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    return String(ans).trim() !== '';
  };

  // Answer handler for PG / BS
  const handleSelectSingle = (val: string) => {
    setUserAnswers((prev) => ({ ...prev, [currentIdx]: val }));
    // Remove doubt automatically when answered, or keep user choice
  };

  // Answer handler for PGK (multiple answers)
  const handleTogglePGK = (key: string) => {
    setUserAnswers((prev) => {
      const currentSelected = Array.isArray(prev[currentIdx])
        ? (prev[currentIdx] as string[])
        : [];
      if (currentSelected.includes(key)) {
        return {
          ...prev,
          [currentIdx]: currentSelected.filter((k) => k !== key),
        };
      } else {
        return {
          ...prev,
          [currentIdx]: [...currentSelected, key],
        };
      }
    });
  };

  // Toggle doubt state
  const handleToggleDoubt = () => {
    setUserDoubts((prev) => ({
      ...prev,
      [currentIdx]: !prev[currentIdx],
    }));
  };

  const answeredCount = Object.keys(userAnswers).filter((k) =>
    isQuestionAnswered(Number(k))
  ).length;

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <header className="bg-blue-700 text-white px-6 py-3.5 flex items-center justify-between shadow-md shrink-0 border-b-4 border-yellow-400 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <img
              src={settings.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/480px-Logo_Tut_Wuri_Handayani.png"}
              alt="Logo"
              className="w-full h-full object-contain rounded-xl drop-shadow-sm"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('Tut_Wuri_Handayani')) {
                  target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/480px-Logo_Tut_Wuri_Handayani.png";
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight">
              {settings.judul}
            </h1>
            <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
              {settings.mapel} • {settings.sekolah} • T.A. {settings.tahunAjaran || '2025/2026'}
            </p>
          </div>
        </div>

        {/* Center: Live Countdown Global Timer */}
        <div className="flex flex-col items-center">
          <div
            className={`flex items-center gap-2.5 px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl border transition-all duration-300 font-mono text-base sm:text-2xl font-black shadow-inner ${
              isCritical
                ? 'bg-rose-950/95 border-rose-500 text-rose-200 animate-pulse ring-4 ring-rose-500/30 shadow-rose-950'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-amber-950/40 ring-2 ring-amber-500/20'
                : 'bg-slate-900/90 border-white/20 text-yellow-300'
            }`}
            title={`Timer Global Ujian: ${settings.durasiMenit} Menit`}
          >
            <Clock
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isCritical
                  ? 'text-rose-400 animate-bounce'
                  : isWarning
                  ? 'text-amber-400 animate-pulse'
                  : 'text-yellow-300 animate-pulse'
              }`}
            />
            <span className="tracking-wider">{formatTimer(timeLeft)}</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest mt-0.5 text-blue-200 hidden sm:block">
            {isCritical ? (
              <span className="text-rose-300 font-black animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Waktu Kritis Segera Habis!
              </span>
            ) : isWarning ? (
              <span className="text-amber-300 font-bold">Sisa Waktu &lt; 5 Menit</span>
            ) : (
              <span>Sisa Waktu Global</span>
            )}
          </div>
        </div>

        {/* Right: Student Profile */}
        <div className="hidden sm:flex items-center gap-3 text-right">
          <div>
            <p className="text-sm font-black uppercase text-white">{siswaNama}</p>
            <p className="text-xs text-blue-200 font-semibold uppercase">Kelas: {siswaKelas}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 border border-white/30 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Visual Countdown Progress Bar based on settings */}
      <div className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 shadow-sm shrink-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded-lg ${
                isCritical
                  ? 'bg-rose-100 text-rose-600 animate-pulse'
                  : isWarning
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
            </div>
            <span className="font-black uppercase tracking-wider text-slate-700 text-[11px]">
              Sisa Waktu:
            </span>
            <span
              className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-md border ${
                isCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : isWarning
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              {formatTimer(timeLeft)}
            </span>
            <span
              className={`font-bold text-[10px] px-2 py-0.5 rounded-full border ${
                isCritical
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : isWarning
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              {Math.round(progressPercent)}% Tersisa
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span className="hidden md:inline">
              Terpakai:{' '}
              <strong className="text-slate-700 font-mono">
                {formatTimer(totalDurationSeconds - timeLeft)}
              </strong>
            </span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span>
              Total Alokasi:{' '}
              <strong className="text-slate-800 font-bold">
                {settings.durasiMenit || 60} Menit
              </strong>
            </span>
          </div>
        </div>

        {/* Progress Track & Fill with subtle milestone indicators */}
        <div
          className="relative w-full bg-slate-100 h-2.5 sm:h-3 rounded-full overflow-hidden border border-slate-200/80 shadow-inner"
          title={`Sisa waktu: ${Math.round(progressPercent)}% (${formatTimer(timeLeft)} dari ${settings.durasiMenit || 60} menit)`}
        >
          {/* Milestone markers at 25%, 50%, 75% */}
          <div className="absolute inset-0 flex justify-between px-[25%] pointer-events-none z-10">
            <div className="w-px h-full bg-slate-300/60" title="25% waktu tersisa" />
            <div className="w-px h-full bg-slate-300/60" title="50% waktu tersisa" />
          </div>
          <div
            className="absolute left-[75%] top-0 bottom-0 w-px bg-slate-300/60 pointer-events-none z-10"
            title="75% waktu tersisa"
          />

          {/* Animated Bar Fill */}
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              isCritical
                ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-sm shadow-rose-500/50 animate-pulse'
                : isWarning
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm shadow-amber-400/50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex p-4 sm:p-6 gap-6 overflow-hidden">
        {/* Left Side: Question Navigation Grid */}
        <aside className="w-72 sm:w-80 bg-white rounded-3xl shadow-sm p-6 flex flex-col h-full border border-slate-200 shrink-0">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Navigasi Soal
              </h3>
              <p className="text-sm font-bold text-slate-700">
                Terjawab {answeredCount} dari {questions.length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center">
              {Math.round((answeredCount / (questions.length || 1)) * 100)}%
            </div>
          </div>

          {/* Sisa Waktu Card in Sidebar */}
          <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Sisa Waktu</span>
              </span>
              <span
                className={`font-mono font-black text-xs ${
                  isCritical ? 'text-rose-600 animate-pulse' : isWarning ? 'text-amber-600' : 'text-slate-800'
                }`}
              >
                {formatTimer(timeLeft)}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>{Math.round(progressPercent)}% tersisa</span>
              <span>Total: {settings.durasiMenit || 60} menit</span>
            </div>
          </div>

          {/* Grid buttons */}
          <div className="grid grid-cols-5 gap-2.5 overflow-y-auto pr-1 flex-grow content-start custom-scrollbar">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const isAns = isQuestionAnswered(idx);
              const isDoubt = !!userDoubts[idx];

              let bgClass = 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200';
              if (isDoubt) {
                bgClass = 'bg-yellow-400 text-yellow-950 font-black border-yellow-500 shadow-sm';
              } else if (isAns) {
                bgClass = 'bg-emerald-600 text-white font-black border-emerald-700 shadow-sm';
              }

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-11 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center relative ${bgClass} ${
                    isCurrent ? 'ring-4 ring-blue-500 scale-105 z-10 border-white' : ''
                  }`}
                >
                  <span>{idx + 1}</span>
                  {q.difficulty === 'HOTS' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight text-center my-3">
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Sudah</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span>Ragu</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span>Belum</span>
            </div>
          </div>

          {/* Finish Button */}
          <button
            id="btn-selesai-ujian-nav"
            onClick={() => setShowConfirmModal(true)}
            className="w-full bg-red-600 text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-md hover:bg-red-700 active:scale-95 transition"
          >
            Selesai Ujian
          </button>
        </aside>

        {/* Right Side: Active Question */}
        <main className="flex-grow flex flex-col gap-4 h-full overflow-hidden">
          <div className="bg-white rounded-3xl shadow-sm flex-grow p-6 sm:p-10 overflow-y-auto border border-slate-200 relative flex flex-col justify-between">
            <div>
              {/* Question Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-sm">
                    SOAL NO {currentIdx + 1}
                  </span>
                  <span
                    className={`font-black px-3 py-1 rounded-full text-[11px] uppercase tracking-wider ${
                      currentQ.difficulty === 'HOTS'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {currentQ.difficulty === 'HOTS' ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-rose-500" />
                        HOTS
                      </span>
                    ) : (
                      'REGULER'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-900 border border-amber-200 font-bold px-3 py-1 rounded-full text-xs uppercase">
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
                </div>
              </div>

              {/* Optional Question Image */}
              {currentQ.image && (
                <div className="mb-6 relative group inline-block max-w-lg">
                  <img
                    src={currentQ.image}
                    alt="Ilustrasi Soal"
                    className="rounded-2xl max-h-64 object-contain border-4 border-slate-100 shadow-sm cursor-pointer group-hover:opacity-90 transition"
                    onClick={() => setZoomImage(currentQ.image)}
                  />
                  <button
                    onClick={() => setZoomImage(currentQ.image)}
                    className="absolute bottom-3 right-3 bg-slate-900/80 text-white p-2 rounded-xl text-xs flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Perbesar</span>
                  </button>
                </div>
              )}

              {/* Question Text */}
              <div className="text-lg sm:text-xl font-bold text-slate-800 leading-relaxed mb-8 max-w-4xl">
                {currentQ.content}
              </div>

              {/* Helpful Hint for PGK */}
              {currentQ.tipe === 'PGK' && (
                <div className="mb-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold">
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  <span>Petunjuk: Anda dapat memilih lebih dari satu jawaban yang benar.</span>
                </div>
              )}

              {/* Options Section */}
              <div className="space-y-3 max-w-4xl">
                {/* 1. Tipe PG (Pilihan Ganda biasa) */}
                {currentQ.tipe === 'PG' && (
                  <div className="space-y-3">
                    {currentQ.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i); // A, B, C, D
                      const isSelected = userAnswers[currentIdx] === letter;

                      return (
                        <div
                          key={i}
                          onClick={() => handleSelectSingle(letter)}
                          className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {letter}
                          </div>
                          <span className="text-base font-semibold text-slate-800 leading-relaxed">
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Tipe PGK (Pilihan Ganda Kompleks / Multi-choice) */}
                {currentQ.tipe === 'PGK' && (
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
                          className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {isSelected ? <Check className="w-5 h-5 stroke-[3]" /> : letter}
                          </div>
                          <div className="flex-grow">
                            <span className="text-base font-semibold text-slate-800 leading-relaxed">
                              {opt}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Tipe BS (Benar - Salah) */}
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
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-lg ring-4 ring-emerald-500/20'
                                : 'border-rose-600 bg-rose-50 text-rose-800 shadow-lg ring-4 ring-rose-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                              isBenar ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          >
                            {isBenar ? (
                              <Check className="w-6 h-6 stroke-[3]" />
                            ) : (
                              <X className="w-6 h-6 stroke-[3]" />
                            )}
                          </div>
                          <span>PERNYATAAN {val.toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Tipe ISIAN (Isian Singkat / Short Answer) */}
                {currentQ.tipe === 'ISIAN' && (
                  <div className="space-y-3 max-w-2xl bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-blue-600" />
                      <span>Lembar Jawaban Isian Singkat:</span>
                    </label>
                    <p className="text-xs text-slate-500 font-medium">
                      Ketikkan jawaban singkat (kata, istilah, angka, atau frasa) pada kolom di bawah ini:
                    </p>
                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={typeof userAnswers[currentIdx] === 'string' ? (userAnswers[currentIdx] as string) : ''}
                        onChange={(e) => handleSelectSingle(e.target.value)}
                        placeholder="Ketik jawaban singkat Anda di sini..."
                        className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-bold text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition shadow-sm"
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 pt-1">
                      <span>Status: {isQuestionAnswered(currentIdx) ? <span className="text-emerald-600">✓ Sudah Terjawab</span> : <span className="text-amber-600">Belum Terjawab</span>}</span>
                      <span>{String(userAnswers[currentIdx] || '').length} Karakter</span>
                    </div>
                  </div>
                )}

                {/* 5. Tipe URAIAN (Uraian / Essay) */}
                {currentQ.tipe === 'URAIAN' && (
                  <div className="space-y-3 max-w-3xl bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Lembar Jawaban Uraian / Essay:</span>
                    </label>
                    <p className="text-xs text-slate-500 font-medium">
                      Tuliskan penjelasan, argumen, atau uraian lengkap Anda secara runtut dan jelas:
                    </p>
                    <div className="relative mt-2">
                      <textarea
                        rows={6}
                        value={typeof userAnswers[currentIdx] === 'string' ? (userAnswers[currentIdx] as string) : ''}
                        onChange={(e) => handleSelectSingle(e.target.value)}
                        placeholder="Tuliskan jawaban uraian lengkap Anda di sini..."
                        className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-medium text-sm sm:text-base text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition shadow-sm leading-relaxed"
                        spellCheck="false"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 pt-1">
                      <span>Status: {isQuestionAnswered(currentIdx) ? <span className="text-emerald-600">✓ Sudah Diisi</span> : <span className="text-amber-600">Belum Diisi</span>}</span>
                      <span>
                        {String(userAnswers[currentIdx] || '').trim() ? String(userAnswers[currentIdx] || '').trim().split(/\s+/).length : 0} Kata • {String(userAnswers[currentIdx] || '').length} Karakter
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 mt-8">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-slate-200 font-bold uppercase text-xs tracking-wider text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <label className="flex items-center gap-3 bg-yellow-400 text-yellow-950 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm hover:bg-yellow-500 transition select-none">
                <input
                  type="checkbox"
                  checked={!!userDoubts[currentIdx]}
                  onChange={handleToggleDoubt}
                  className="w-4 h-4 accent-yellow-800 rounded"
                />
                <span>Ragu-Ragu</span>
              </label>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 font-black uppercase text-xs tracking-wider text-white shadow-lg hover:bg-blue-700 active:scale-95 transition"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 font-black uppercase text-xs tracking-wider text-white shadow-lg hover:bg-emerald-700 active:scale-95 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesaikan Ujian</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl text-center border-b-8 border-blue-600">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
              Konfirmasi Selesai Ujian
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-4">
              Anda telah menjawab <strong className="text-blue-600 font-bold">{answeredCount}</strong> dari{' '}
              <strong className="text-slate-900 font-bold">{questions.length}</strong> butir soal. Apakah Anda
              yakin ingin mengakhiri sesi ujian sekarang?
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Sisa Waktu Ujian:
              </span>
              <span className={`font-mono font-black ${isCritical ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                {formatTimer(timeLeft)}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 border-2 border-slate-200 rounded-2xl font-bold uppercase text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cek Kembali
              </button>
              <button
                id="btn-konfirmasi-selesai-final"
                onClick={() => {
                  setShowConfirmModal(false);
                  onFinishExam(userAnswers, violations);
                }}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg hover:bg-red-700 transition cursor-pointer"
              >
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time's Up Auto-Submission Overlay Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl text-center border-b-8 border-rose-600">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-5 ring-8 ring-rose-50">
              <Hourglass className="w-10 h-10 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hitung Mundur Selesai (00:00:00)</span>
            </div>

            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-3">
              Waktu Ujian Telah Habis!
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm font-medium mb-6 leading-relaxed">
              Batas durasi global ujian (<strong className="text-slate-900 font-bold">{settings.durasiMenit} Menit</strong>) telah mencapai batas akhir. Sistem secara otomatis mengunci lembar ujian dan menyimpan semua jawaban Anda.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-3 text-xs font-bold text-slate-700 mb-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span>Mengumpulkan lembar jawaban peserta otomatis...</span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Mohon tunggu sejenak, Anda dialihkan ke layar ringkasan nilai ujian...
            </p>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 cursor-zoom-out"
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
