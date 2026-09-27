import React, { useState, useRef } from 'react';
import {
  LogIn,
  Shield,
  BookOpen,
  Clock,
  Key,
  CheckCircle,
  GraduationCap,
  School,
  Share2,
  Copy,
  Check,
  X,
  QrCode,
  ExternalLink,
  Eye,
  RotateCcw,
  Layers,
  Sparkles,
  UserCheck,
  Search,
  Globe,
  Upload,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { ExamSettings, SubjectPackage } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';
import { compressImageFile } from '../utils/imageCompressor';
import { getPublicBaseUrl, getPublicStudentExamUrl } from '../utils/urlHelper';

interface PortalViewProps {
  subjects?: SubjectPackage[];
  activeSubjectId?: string;
  onSelectSubject?: (id: string) => void;
  settings: ExamSettings;
  activeSubject?: SubjectPackage;
  totalQuestions: number;
  onSelectRole: (role: 'siswa' | 'guru') => void;
  isSiswaOnly?: boolean;
  onToggleSiswaOnly?: (enable: boolean) => void;
  onUpdateLogo?: (newLogoUrl: string) => void;
}

export const PortalView: React.FC<PortalViewProps> = ({
  subjects = [],
  activeSubjectId = 'literasi-numerasi',
  onSelectSubject,
  settings,
  activeSubject,
  totalQuestions,
  onSelectRole,
  isSiswaOnly = false,
  onToggleSiswaOnly,
  onUpdateLogo,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyWebSuccess, setCopyWebSuccess] = useState(false);
  const [copyWaSuccess, setCopyWaSuccess] = useState(false);
  const [copyAllSuccess, setCopyAllSuccess] = useState(false);
  const [selectedShareSubjectId, setSelectedShareSubjectId] = useState<string>(activeSubjectId);

  // Logo upload state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState(false);
  const [logoErrorMsg, setLogoErrorMsg] = useState<string | null>(null);
  const [logoImgError, setLogoImgError] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Reset logo error whenever settings.logoUrl updates
  React.useEffect(() => {
    setLogoImgError(false);
  }, [settings.logoUrl]);

  const handleProcessLogoFile = async (file: File) => {
    setLogoErrorMsg(null);
    setIsProcessingLogo(true);

    const isImage =
      (file.type && file.type.startsWith('image/')) ||
      /\.(png|jpe?g|webp|svg|gif|bmp|ico)$/i.test(file.name);

    if (!isImage) {
      setLogoErrorMsg('Mohon pilih berkas gambar yang valid (PNG, JPG, WebP, SVG).');
      setIsProcessingLogo(false);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setLogoErrorMsg('Ukuran file maksimal 20MB.');
      setIsProcessingLogo(false);
      return;
    }

    try {
      // Kompresi otomatis di sisi browser agar ringan dan tidak membebani memori penyimpanan
      const compressedDataUrl = await compressImageFile(file, 360, 360, 0.88);
      onUpdateLogo?.(compressedDataUrl);
      setLogoImgError(false);
      setLogoSuccessMsg(true);
      setTimeout(() => setLogoSuccessMsg(false), 3500);
    } catch (err) {
      console.error('Gagal mengolah file logo:', err);
      // Fallback: baca langsung file sebagai DataURL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          onUpdateLogo?.(result);
          setLogoImgError(false);
          setLogoSuccessMsg(true);
          setTimeout(() => setLogoSuccessMsg(false), 3500);
        }
      };
      reader.onerror = () => {
        setLogoErrorMsg('Gagal membaca berkas gambar. Silakan coba berkas gambar lain.');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleApplyUrlLogo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onUpdateLogo?.(customUrl.trim());
    setLogoImgError(false);
    setLogoSuccessMsg(true);
    setShowUrlInput(false);
    setCustomUrl('');
    setTimeout(() => setLogoSuccessMsg(false), 3000);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleResetDefaultLogo = () => {
    const defaultLogo = "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png";
    onUpdateLogo?.(defaultLogo);
    setLogoImgError(false);
    setLogoSuccessMsg(true);
    setTimeout(() => setLogoSuccessMsg(false), 2500);
  };

  // Determine current active subject for sharing
  const currentShareSubject =
    subjects.find((s) => s.id === selectedShareSubjectId) ||
    activeSubject ||
    subjects[0] ||
    null;

  const currentShareSettings = currentShareSubject?.settings || settings;

  const getStudentShareUrl = (subjectId?: string) => {
    const targetId = subjectId || selectedShareSubjectId || activeSubjectId || 'literasi-numerasi';
    return getPublicStudentExamUrl(targetId);
  };

  const handleCopyLink = async (subjectId?: string) => {
    const url = getStudentShareUrl(subjectId);
    await copyTextToClipboard(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const getWaMessage = (sub?: SubjectPackage) => {
    const targetSub = sub || currentShareSubject;
    const subSettings = targetSub?.settings || settings;
    const subId = targetSub?.id || activeSubjectId || 'literasi-numerasi';
    const url = getStudentShareUrl(subId);
    return `📢 *INFORMASI PELAKSANAAN UJIAN CBT SISWA*\n\n🏫 *${subSettings.sekolah}*\n📝 *Ujian:* ${subSettings.judul}\n📚 *Mata Pelajaran:* ${subSettings.mapel}${targetSub?.guruPengampu ? `\n👨‍🏫 *Guru Pengampu:* ${targetSub.guruPengampu}` : ''}\n📅 *Tahun Ajaran:* ${subSettings.tahunAjaran || '2025/2026'}\n⏳ *Durasi:* ${subSettings.durasiMenit} Menit\n\n━━━━━━━━━━━━━━━━━━━━\n🔗 *Link Ujian Khusus Siswa (${subSettings.mapel}):*\n${url}\n\n🔑 *Token Masuk Ujian:*\n👉 *${subSettings.token}*\n━━━━━━━━━━━━━━━━━━━━\n\n📌 *Petunjuk Siswa:*\n1. Klik link di atas menggunakan Google Chrome / browser HP/Laptop.\n2. Masukkan Nama Lengkap, Kelas, dan Token ujian.\n3. Dilarang berpindah tab browser selama ujian berlangsung.`;
  };

  const handleCopyWa = async () => {
    await copyTextToClipboard(getWaMessage());
    setCopyWaSuccess(true);
    setTimeout(() => setCopyWaSuccess(false), 2500);
  };

  const handleCopyAllSubjectsSummary = async () => {
    if (!subjects || subjects.length === 0) return;
    let text = `📢 *JADWAL & LINK UJIAN CBT LENGKAP*\n🏫 *${settings.sekolah}* (Tahun Ajaran ${settings.tahunAjaran || '2025/2026'})\n\nBerikut link ujian CBT per mata pelajaran untuk siswa:\n━━━━━━━━━━━━━━━━━━━━\n`;
    subjects.forEach((sub, idx) => {
      const url = getPublicStudentExamUrl(sub.id);
      text += `\n${idx + 1}. *${sub.nama}* (${sub.kode})\n   ⏳ Durasi: ${sub.settings.durasiMenit} Menit | 🔑 Token: *${sub.settings.token}*\n   🔗 Link: ${url}\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━\n📌 *Catatan:* Klik link mata pelajaran sesuai jadwal yang sedang diujikan.`;
    await copyTextToClipboard(text);
    setCopyAllSuccess(true);
    setTimeout(() => setCopyAllSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056b3] via-[#004b9e] to-[#003875] text-white flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full flex flex-wrap items-center justify-between gap-4 py-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-2xl shadow-md">
            <img
              src={settings.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/480px-Logo_Tut_Wuri_Handayani.png"}
              alt="Logo"
              className="h-10 w-10 object-contain"
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
            <h2 className="text-xl font-black uppercase tracking-tight leading-tight">
              {settings.sekolah}
            </h2>
            <p className="text-xs text-blue-200 font-semibold tracking-wider uppercase">
              Portal Asesmen Unity School
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Website Online Button - only for teacher / non-student mode */}
          {!isSiswaOnly && (
            <button
              type="button"
              onClick={() => setShowWebsiteModal(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider transition shadow-md hover:scale-105 cursor-pointer"
              title="Lihat status website online, tautan publik, dan cara pasang domain sekolah"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website Online</span>
              <span className="w-2 h-2 rounded-full bg-emerald-950 animate-pulse" />
            </button>
          )}

          {/* Header tools for Teacher only */}
          {!isSiswaOnly && (
            <>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider transition shadow-md hover:scale-105"
                title="Buka menu bagikan link khusus siswa"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan Ke Siswa</span>
              </button>

              {onToggleSiswaOnly && (
                <button
                  onClick={() => onToggleSiswaOnly(true)}
                  className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-full border border-white/15 text-xs font-bold text-blue-100 transition"
                  title="Pratinjau tampilan yang dilihat siswa"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-200" />
                  <span>Cek Mode Siswa</span>
                </button>
              )}
            </>
          )}

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-xs font-bold text-blue-100">
            <School className="w-4 h-4 text-yellow-300" />
            <span>Tahun Ajaran {settings.tahunAjaran || '2025/2026'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full my-auto py-10 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-black tracking-widest uppercase mb-4 shadow-inner">
          <CheckCircle className="w-3.5 h-3.5 text-yellow-300" />
          <span>Sistem Ujian Berbasis Komputer & Tablet</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-none mb-6 drop-shadow-md">
          Asesmen Unity School
        </h1>

        {/* Bagian Logo Sekolah di Bagian Tengah Interface */}
        <div className="max-w-md mx-auto mb-10">
          <div
            onDragOver={!isSiswaOnly ? handleLogoDragOver : undefined}
            onDragLeave={!isSiswaOnly ? handleLogoDragLeave : undefined}
            onDrop={!isSiswaOnly ? handleLogoDrop : undefined}
            className={`relative bg-white/10 backdrop-blur-md border-2 ${
              isDraggingLogo && !isSiswaOnly
                ? 'border-yellow-400 bg-white/20 scale-105'
                : 'border-white/20'
            } rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-xl flex flex-col items-center group`}
          >
            {!isSiswaOnly && (
              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
              />
            )}

            {/* Logo Image Preview Container */}
            <div
              onClick={!isSiswaOnly ? () => logoInputRef.current?.click() : undefined}
              className={`relative w-28 h-28 bg-white rounded-2xl p-2.5 shadow-lg border-2 border-white/60 flex items-center justify-center overflow-hidden ${
                !isSiswaOnly ? 'cursor-pointer transition transform group-hover:scale-105' : ''
              }`}
              title={!isSiswaOnly ? "Klik untuk memilih file logo baru dari komputer/HP" : undefined}
            >
              {isProcessingLogo && !isSiswaOnly ? (
                <div className="flex flex-col items-center justify-center text-blue-600 p-2 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mb-1 text-blue-600" />
                  <span className="text-[10px] font-bold">Memproses...</span>
                </div>
              ) : settings.logoUrl && !logoImgError ? (
                <img
                  key={settings.logoUrl}
                  src={settings.logoUrl}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onLoad={() => setLogoImgError(false)}
                  onError={() => {
                    console.warn('Gagal memuat logo sekolah:', settings.logoUrl);
                    setLogoImgError(true);
                  }}
                />
              ) : (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/480px-Logo_Tut_Wuri_Handayani.png"
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              )}

              {/* Hover overlay with Camera icon - khusus proktor/guru */}
              {!isSiswaOnly && !isProcessingLogo && (
                <div className="absolute inset-0 bg-blue-700/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                  <Camera className="w-7 h-7 mb-1 text-yellow-300" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Ganti Logo</span>
                </div>
              )}
            </div>

            {/* Status / Feedback & Actions */}
            <div className="mt-4 flex flex-col items-center gap-1.5 w-full text-center">
              <span className="text-xs font-black uppercase tracking-wider text-yellow-300">
                {settings.sekolah || 'SD UNITY INTERNASIONAL'}
              </span>

              {/* Tombol aksi ganti logo (Unggah Berkas, Link URL, Reset Default) HANYA untuk guru / bukan tampilan siswa */}
              {!isSiswaOnly && (
                <>
                  {logoSuccessMsg ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-bold animate-fadeIn">
                      <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span>Logo sekolah berhasil diperbarui & disimpan!</span>
                    </div>
                  ) : logoErrorMsg ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/30 border border-rose-400/50 text-rose-200 text-xs font-bold">
                      <X className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                      <span>{logoErrorMsg}</span>
                    </div>
                  ) : isProcessingLogo ? (
                    <p className="text-[11px] text-yellow-300 font-bold animate-pulse">
                      Sedang memproses gambar...
                    </p>
                  ) : (
                    <p className="text-[11px] text-blue-100 font-medium">
                      Klik logo atau tombol di bawah untuk mengunggah logo sekolah
                    </p>
                  )}

                  {/* Action Buttons: Unggah Berkas, Link URL, Reset Default */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isProcessingLogo}
                      className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-900 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Berkas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput((prev) => !prev)}
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-blue-100 border border-white/20 px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
                      title="Gunakan tautan URL gambar dari web"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-blue-200" />
                      <span>Link URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetDefaultLogo}
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-blue-100 border border-white/20 px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
                      title="Kembalikan ke logo standar"
                    >
                      <RotateCcw className="w-3 h-3 text-yellow-300" />
                      <span>Reset Default</span>
                    </button>
                  </div>

                  {/* Tautan URL Input Box */}
                  {showUrlInput && (
                    <form
                      onSubmit={handleApplyUrlLogo}
                      className="w-full mt-3 flex items-center gap-1.5 bg-white/15 p-2 rounded-2xl border border-white/20"
                    >
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://domain-sekolah.sch.id/logo.png"
                        className="flex-1 bg-white px-3 py-2 rounded-xl text-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-yellow-400"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
                      >
                        Terapkan
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Portal Action Cards */}
        {isSiswaOnly ? (
          <div className="max-w-lg mx-auto">
            <div
              id="portal-card-siswa"
              onClick={() => onSelectRole('siswa')}
              className="group bg-white text-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-transparent hover:border-blue-400 flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-100 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:bg-blue-700 transition">
                    <GraduationCap className="w-9 h-9" />
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    Sesi Ujian Siswa
                  </span>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">
                  Mulai Ujian Sekarang
                </h3>
                <p className="text-slate-600 font-bold text-sm leading-relaxed mb-3">
                  {activeSubject?.nama || settings.mapel}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl text-xs font-bold">
                    {totalQuestions} Butir Soal
                  </span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold">
                    Durasi: {settings.durasiMenit} Menit
                  </span>
                  <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Token: <strong className="font-mono">{settings.token}</strong></span>
                  </span>
                </div>
              </div>
              <div className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-black uppercase text-sm tracking-widest text-center flex items-center justify-center gap-2 group-hover:bg-blue-700 transition shadow-md">
                <LogIn className="w-4 h-4" />
                <span>Masuk & Kerjakan Soal</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Student Entrance */}
            <div
              id="portal-card-siswa"
              onClick={() => onSelectRole('siswa')}
              className="group bg-white text-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-transparent hover:border-blue-400 flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
              <div>
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:bg-blue-700 transition">
                  <GraduationCap className="w-9 h-9" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">
                  Masuk Ujian
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                  Khusus peserta didik: Masuk untuk memulai pengerjaan asesmen.
                </p>
              </div>
              <div className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-black uppercase text-sm tracking-widest text-center flex items-center justify-center gap-2 group-hover:bg-blue-700 transition shadow-md">
                <LogIn className="w-4 h-4" />
                <span>Mulai Ujian</span>
              </div>
            </div>

            {/* Teacher / Admin Entrance */}
            <div
              id="portal-card-guru"
              onClick={() => onSelectRole('guru')}
              className="group bg-slate-900/90 text-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-white/10 hover:border-slate-500 flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
              <div>
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-blue-400 flex items-center justify-center mb-6 shadow-lg border border-slate-700">
                  <Shield className="w-9 h-9" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2">
                  Panel Guru
                </h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                  Akses proktor & administrator: Pengelolaan bank soal dan unduh laporan nilai.
                </p>
              </div>
              <div className="w-full bg-slate-800 text-white py-4 px-6 rounded-2xl font-black uppercase text-sm tracking-widest text-center flex items-center justify-center gap-2 group-hover:bg-slate-700 transition border border-slate-700">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Akses Manajemen</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-white/10 text-xs text-blue-200/60 font-semibold tracking-wider relative z-10">
        &copy; {new Date().getFullYear()} {settings.sekolah} • SD UNITY Computer Based Testing System
      </footer>

      {/* Quick Share Modal on Portal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white text-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative text-left max-h-[92vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  Bagikan Link Ujian Siswa
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tautan khusus per mata pelajaran (mode siswa otomatis & tanpa menu guru)
                </p>
              </div>
            </div>

            {/* Subject Selector within Share Modal */}
            {subjects && subjects.length > 0 && (
              <div className="mb-4">
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Pilih Mata Pelajaran:</span>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {subjects.length} Mapel Tersedia
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto custom-scrollbar">
                  {subjects.map((sub) => {
                    const isSelected = sub.id === selectedShareSubjectId;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedShareSubjectId(sub.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm font-black'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                          {sub.kode}
                        </span>
                        <span>{sub.nama}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Selected Subject Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Mapel Terpilih:
                </span>
                <span className="text-sm font-black text-slate-900">
                  {currentShareSettings.mapel}
                </span>
                {currentShareSubject?.guruPengampu && (
                  <span className="text-xs text-slate-500 block">
                    Guru: {currentShareSubject.guruPengampu}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Durasi & Soal:
                </span>
                <span className="text-xs font-bold text-blue-700">
                  {currentShareSettings.durasiMenit} Menit • {currentShareSubject?.questions?.length || totalQuestions} Soal
                </span>
              </div>
            </div>

            {/* Direct URL input for this subject */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 mb-4">
              <span className="text-xs font-bold text-blue-900 block mb-1">
                🔗 Tautan Langsung Siswa ({currentShareSettings.mapel}):
              </span>
              <div className="relative mb-2">
                <input
                  type="text"
                  readOnly
                  value={getStudentShareUrl(selectedShareSubjectId)}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-white border border-blue-300 rounded-xl p-2.5 pr-24 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  title="Klik untuk memilih seluruh tautan"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedShareSubjectId)}
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                💡 Tautan ini memuat parameter <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-blue-200">?mapel={selectedShareSubjectId}&mode=siswa</code> sehingga siswa langsung masuk ke ujian mata pelajaran ini.
              </p>
              <div className="mt-2.5 p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-[11px] text-emerald-950 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Link publik resmi (domain ais-pre-) dapat langsung diakses oleh seluruh siswa tanpa memerlukan login akun Google.</span>
              </div>
            </div>

            {/* QR Code and Token section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  QR Code {currentShareSettings.mapel}
                </span>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    getStudentShareUrl(selectedShareSubjectId)
                  )}`}
                  alt="QR Code Siswa"
                  className="w-28 h-28 rounded-xl border border-slate-200 shadow-sm bg-white p-1 mb-2"
                />
                <span className="text-[10px] text-slate-400 font-medium">Scan kamera untuk langsung buka</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Token Masuk Ujian:
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3 text-center mb-1">
                    {currentShareSettings.token}
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    Berikan token ini kepada siswa saat waktu ujian dimulai.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyWa}
                  className="w-full mt-2.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {copyWaSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Pesan WA Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Format WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Rekap Semua Mapel Button */}
            {subjects && subjects.length > 1 && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleCopyAllSubjectsSummary}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copyAllSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Rekap Semua Link ({subjects.length} Mapel) Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Salin Rekap Jadwal & Semua Link ({subjects.length} Mapel) untuk Grup WA</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2">
              <a
                href={getStudentShareUrl(selectedShareSubjectId)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Uji Tautan Siswa</span>
              </a>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white py-3 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL STATUS & PUBLIKASI WEBSITE ONLINE */}
      {showWebsiteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-slate-900 shadow-2xl relative border border-slate-200 my-8">
            <button
              type="button"
              onClick={() => setShowWebsiteModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Status: Aktif & Online</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  Website CBT Resmi & Akses Online
                </h3>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Box URL Website */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Alamat Website CBT Saat Ini:</span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Siap Dibuka di HP / Laptop
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getPublicBaseUrl()}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const publicUrl = getPublicBaseUrl();
                      if (publicUrl) {
                        await copyTextToClipboard(publicUrl);
                        setCopyWebSuccess(true);
                        setTimeout(() => setCopyWebSuccess(false), 2000);
                      }
                    }}
                    className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                  >
                    {copyWebSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code & Akses Cepat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Scan Barcode Website
                  </span>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      getPublicBaseUrl()
                    )}`}
                    alt="QR Code Website"
                    className="w-28 h-28 rounded-xl border border-slate-200 shadow-sm bg-white p-1 mb-2"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    Arahkan kamera HP untuk membuka website ujian
                  </p>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Buka Langsung Di Browser</span>
                    </span>
                    <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                      Website ini dapat langsung diakses dari browser apa pun (Chrome, Edge, Safari). Siswa tinggal memasukkan nama dan token untuk mulai ujian.
                    </p>
                  </div>

                  <a
                    href={getPublicBaseUrl() || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Buka Website Di Tab Baru</span>
                  </a>
                </div>
              </div>

              {/* 3 Langkah Menghubungkan ke Domain Sendiri */}
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-blue-950">
                    Cara Pasang Di Domain Sekolah Sendiri (Misal: cbt.sekolah.sch.id)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-700 font-medium">
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <strong className="text-blue-900 block font-bold mb-1">1. Unduh File Web</strong>
                    <span>Masuk ke Panel Guru &gt; Tab <strong>Export Standalone HTML</strong> &gt; Unduh file HTML.</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <strong className="text-blue-900 block font-bold mb-1">2. Upload ke Hosting</strong>
                    <span>Buka cPanel / server sekolah, upload file tadi sebagai <code className="text-blue-700 font-bold bg-blue-50 px-1 rounded">index.html</code>.</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <strong className="text-blue-900 block font-bold mb-1">3. Langsung Aktif</strong>
                    <span>Website CBT langsung berjalan 100% tanpa perlu server database terpisah!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWebsiteModal(false)}
                className="bg-slate-900 hover:bg-black text-white py-3 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
