import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  BookOpen,
  Users,
  Download,
  Plus,
  Trash2,
  Save,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Upload,
  Calendar,
  School,
  Building2,
  RefreshCw,
  Eye,
  FileText,
  Key,
  Clock,
  Link as LinkIcon,
  Shield,
  X,
  Share2,
  QrCode,
  Copy,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Award,
  TrendingUp,
  AlertCircle,
  PenTool,
  FileUp,
  FileQuestion,
  HelpCircle,
  Pencil,
  Edit3,
  Layers,
  FolderPlus,
  UserCheck,
  CheckCheck,
  KeyRound,
  Search,
  Globe,
  Lock,
  Unlock,
  EyeOff,
} from 'lucide-react';
import { Question, QuestionType, Difficulty, ExamSettings, ExamResult, SubjectPackage } from '../types';
import { ANBK_LITERASI_35_QUESTIONS } from '../anbkLiterasiData';
import { generateStandaloneHtml } from '../utils/exportHtml';
import { copyTextToClipboard } from '../utils/clipboard';
import { getPublicBaseUrl, getPublicStudentExamUrl } from '../utils/urlHelper';
import {
  parseJSONQuestions,
  parseCSVQuestions,
  parseExcelQuestions,
  parseWordQuestions,
  downloadCSVTemplate,
  downloadJSONTemplate,
  downloadExcelTemplate,
  downloadWordTemplateGuide,
} from '../utils/questionImporter';
import { AiQuestionGeneratorModal } from './AiQuestionGeneratorModal';
import { ResultsAnalyticsCharts } from './ResultsAnalyticsCharts';

const DEFAULT_TUT_WURI_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png';

interface TeacherPanelProps {
  subjects?: SubjectPackage[];
  activeSubjectId?: string;
  onSelectSubject?: (id: string) => void;
  onAddSubject?: (newSubject: SubjectPackage) => void;
  onUpdateSubject?: (updated: SubjectPackage) => void;
  onUpdateAllSubjects?: (updatedSubjects: SubjectPackage[]) => void;
  onDeleteSubject?: (id: string) => void;
  questions: Question[];
  settings: ExamSettings;
  results: ExamResult[];
  onUpdateQuestions: (questions: Question[]) => void;
  onUpdateSettings: (settings: ExamSettings) => void;
  onClearResults: (targetSubjectId?: string) => void;
  onDeleteResult?: (id: string) => void;
  onUpdateResults?: (results: ExamResult[]) => void;
  onExit: () => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  subjects = [],
  activeSubjectId = 'literasi-numerasi',
  onSelectSubject,
  onAddSubject,
  onUpdateSubject,
  onUpdateAllSubjects,
  onDeleteSubject,
  questions,
  settings,
  results,
  onUpdateQuestions,
  onUpdateSettings,
  onClearResults,
  onDeleteResult,
  onUpdateResults,
  onExit,
}) => {
  const [activeTab, setActiveTab] = useState<'mapel' | 'bank' | 'settings' | 'results' | 'share' | 'export'>('bank');
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [copyWaSuccess, setCopyWaSuccess] = useState(false);
  const [csvFeedback, setCsvFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Results Management States
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<ExamResult | null>(null);
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [isDeletingResults, setIsDeletingResults] = useState(false);

  // Multi-Subject Management State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubNama, setNewSubNama] = useState('');
  const [newSubKode, setNewSubKode] = useState('');
  const [newSubGuru, setNewSubGuru] = useState('');
  const [newSubKelas, setNewSubKelas] = useState('Kelas 5');
  const [newSubDurasi, setNewSubDurasi] = useState(60);
  const [newSubToken, setNewSubToken] = useState('');
  const [newSubDeskripsi, setNewSubDeskripsi] = useState('');
  const [newSubPassword, setNewSubPassword] = useState('guru123');
  const [newSubSeedTemplate, setNewSubSeedTemplate] = useState(true);

  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectPackage | null>(null);
  const [editSubNama, setEditSubNama] = useState('');
  const [editSubKode, setEditSubKode] = useState('');
  const [editSubGuru, setEditSubGuru] = useState('');
  const [editSubKelas, setEditSubKelas] = useState('');
  const [editSubDurasi, setEditSubDurasi] = useState(60);
  const [editSubToken, setEditSubToken] = useState('');
  const [editSubDeskripsi, setEditSubDeskripsi] = useState('');
  const [editSubPassword, setEditSubPassword] = useState('guru123');

  const [copiedSubjectLinkId, setCopiedSubjectLinkId] = useState<string | null>(null);
  const [copiedSubjectWaId, setCopiedSubjectWaId] = useState<string | null>(null);
  const [copiedAllMapelRecap, setCopiedAllMapelRecap] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  // Question Form State
  const [formTipe, setFormTipe] = useState<QuestionType>('PG');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('REGULER');
  const [formContent, setFormContent] = useState('');
  const [formImage, setFormImage] = useState<string>('');
  const [formOptions, setFormOptions] = useState<string[]>([
    'Pilihan A',
    'Pilihan B',
    'Pilihan C',
    'Pilihan D',
  ]);
  const [formAnswerSingle, setFormAnswerSingle] = useState('A');
  const [formAnswerMulti, setFormAnswerMulti] = useState<string[]>(['A']);
  const [formAnswerBS, setFormAnswerBS] = useState('Benar');
  const [formAnswerIsian, setFormAnswerIsian] = useState('');
  const [formAnswerUraian, setFormAnswerUraian] = useState('');

  // Question Editing State (In-form & Modal)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const questionFormRef = useRef<HTMLDivElement>(null);

  // Dedicated Edit Question Modal State
  const [modalEditingQuestion, setModalEditingQuestion] = useState<Question | null>(null);
  const [modalEditIndex, setModalEditIndex] = useState<number>(-1);
  const [modalEditTipe, setModalEditTipe] = useState<QuestionType>('PG');
  const [modalEditDifficulty, setModalEditDifficulty] = useState<Difficulty>('REGULER');
  const [modalEditContent, setModalEditContent] = useState('');
  const [modalEditImage, setModalEditImage] = useState('');
  const [modalEditOptions, setModalEditOptions] = useState<string[]>([
    'Pilihan A',
    'Pilihan B',
    'Pilihan C',
    'Pilihan D',
  ]);
  const [modalEditAnswerSingle, setModalEditAnswerSingle] = useState('A');
  const [modalEditAnswerMulti, setModalEditAnswerMulti] = useState<string[]>(['A']);
  const [modalEditAnswerBS, setModalEditAnswerBS] = useState('Benar');
  const [modalEditAnswerIsian, setModalEditAnswerIsian] = useState('');
  const [modalEditAnswerUraian, setModalEditAnswerUraian] = useState('');
  const modalImageFileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Import Questions State (JSON, Word DOCX, CSV)
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDraggingImportFile, setIsDraggingImportFile] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importInputMethod, setImportInputMethod] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [pastedFormat, setPastedFormat] = useState<'json' | 'csv'>('csv');
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // AI Question Generator Modal State
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);

  // Exam Settings Form State
  const [setJudul, setSetJudul] = useState(settings.judul);
  const [setMapel, setSetMapel] = useState(settings.mapel);
  const [setSekolah, setSetSekolah] = useState(settings.sekolah);
  const [setLogoUrl, setSetLogoUrl] = useState(settings.logoUrl);
  const [setTahunAjaran, setSetTahunAjaran] = useState(settings.tahunAjaran || '2025/2026');
  const [setDurasi, setSetDurasi] = useState(settings.durasiMenit);
  const [setToken, setSetToken] = useState(settings.token);
  const [setAdminPass, setSetAdminPass] = useState(settings.adminPass);
  const [setTampilkanNilai, setSetTampilkanNilai] = useState(settings.tampilkanNilai);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [logoInputTab, setLogoInputTab] = useState<'upload' | 'url'>('upload');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const currentActiveSubject =
    subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  // Filter Mata Pelajaran untuk Tab Hasil Asesmen Peserta
  const [resultsFilterSubjectId, setResultsFilterSubjectId] = useState<string>('all');

  // Gabungkan seluruh hasil ujian dari semua mata pelajaran agar laporan lengkap dan terdata
  const allResultsAcrossSubjects = React.useMemo(() => {
    const list: ExamResult[] = [];
    const seenIds = new Set<string>();

    (subjects || []).forEach((sub) => {
      (sub.results || []).forEach((r) => {
        const id = r.id || `res_${r.nama}_${r.selesaiPada}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          list.push({
            ...r,
            mapelId: r.mapelId || sub.id,
            mapelNama: r.mapelNama || sub.nama || sub.settings?.mapel || 'Ujian',
          });
        }
      });
    });

    (results || []).forEach((r) => {
      const id = r.id || `res_${r.nama}_${r.selesaiPada}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        list.push({
          ...r,
          mapelId: r.mapelId || activeSubjectId,
          mapelNama: r.mapelNama || currentActiveSubject?.nama || settings.mapel || 'Ujian',
        });
      }
    });

    return list;
  }, [subjects, results, activeSubjectId, currentActiveSubject, settings]);

  // Data hasil asesmen yang ditampilkan berdasarkan filter mapel aktif
  const displayedResults = React.useMemo(() => {
    if (resultsFilterSubjectId === 'all') {
      return allResultsAcrossSubjects;
    }
    return allResultsAcrossSubjects.filter((r) => (r.mapelId || activeSubjectId) === resultsFilterSubjectId);
  }, [allResultsAcrossSubjects, resultsFilterSubjectId, activeSubjectId]);

  const [setGuruPengampu, setSetGuruPengampu] = useState(
    currentActiveSubject?.guruPengampu || ''
  );
  const [setKelas, setSetKelas] = useState(
    currentActiveSubject?.kelas || 'Kelas 5'
  );

  // Dedicated Guru Pengampu & Password Editor State for All Subjects
  const [guruTableData, setGuruTableData] = useState<Record<string, { guru: string; kelas: string; password: string }>>({});
  const [savedGuruRowId, setSavedGuruRowId] = useState<string | null>(null);
  const [savedAllGuruSuccess, setSavedAllGuruSuccess] = useState(false);
  const [cardGuruMap, setCardGuruMap] = useState<Record<string, string>>({});
  const [cardPassMap, setCardPassMap] = useState<Record<string, string>>({});
  const [cardSavedGuruId, setCardSavedGuruId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Security Lock for Question Bank per Subject
  const [lockedSubjectIds, setLockedSubjectIds] = useState<string[]>([]);
  const [bankUnlockPassInput, setBankUnlockPassInput] = useState('');
  const [bankUnlockError, setBankUnlockError] = useState('');
  const [showBankPasswordText, setShowBankPasswordText] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newSubjectPasswordInput, setNewSubjectPasswordInput] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  // Master Admin Security Lock for all protected tabs - unlocked by default since teacher passed login
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true);
  const [adminUnlockPassInput, setAdminUnlockPassInput] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState('');
  const [showAdminPasswordText, setShowAdminPasswordText] = useState(false);
  const [copyLiveWebSuccess, setCopyLiveWebSuccess] = useState(false);

  const handleUnlockAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const masterAdminPass = settings.adminPass || '112233';
    const input = adminUnlockPassInput.trim();

    if (input === masterAdminPass || input === '112233') {
      setIsAdminUnlocked(true);
      setAdminUnlockError('');
      setAdminUnlockPassInput('');
    } else {
      setAdminUnlockError('Password Admin salah! Masukkan kata sandi administrator yang valid.');
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setAdminUnlockPassInput('');
  };

  const getTabSecurityInfo = (tab: string) => {
    switch (tab) {
      case 'mapel':
        return {
          title: 'Kelola Mata Pelajaran & Guru',
          desc: 'Halaman Kelola Mapel berisi manajemen kurikulum mata pelajaran, penambahan/penghapusan mapel, serta daftar sandi guru pengampu.',
        };
      case 'bank':
        return {
          title: 'Bank Soal & Kunci Jawaban',
          desc: 'Halaman Bank Soal diproteksi kata sandi agar seluruh butir naskah soal, kunci jawaban, dan rubrik penilaian tidak dapat diakses atau diubah oleh orang lain.',
        };
      case 'settings':
        return {
          title: 'Pengaturan Asesmen & Identitas',
          desc: 'Halaman Pengaturan Asesmen memuat token ujian, durasi menit, sistem anti-cheat, standar KKM, dan konfigurasi master asesmen.',
        };
      case 'results':
        return {
          title: 'Rekap Hasil Nilai Siswa',
          desc: 'Halaman Rekap Nilai memuat rekapan nilai seluruh siswa, rincian jawaban peserta, waktu pengerjaan, dan berkas ekspor nilai.',
        };
      case 'share':
        return {
          title: 'Bagikan Tautan & Token Ke Siswa',
          desc: 'Halaman Bagikan memuat token resmi ujian yang sedang aktif, tautan langsung portal siswa, dan format broadcast pesan WhatsApp.',
        };
      case 'export':
        return {
          title: 'Export Standalone HTML & Berkas Ujian',
          desc: 'Halaman Export memuat berkas mandiri aplikasi ujian offline, paket kode HTML, dan generator data asesmen.',
        };
      default:
        return {
          title: 'Panel Guru & Admin',
          desc: 'Panel ini diproteksi kata sandi agar hanya administrator berwenang yang dapat mengakses data ujian.',
        };
    }
  };

  // Synchronize guruTableData whenever subjects list changes
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const initialMap: Record<string, { guru: string; kelas: string; password: string }> = {};
      const cardMap: Record<string, string> = {};
      const cardPass: Record<string, string> = {};
      subjects.forEach((s) => {
        const pass = s.passwordBankSoal || 'guru123';
        initialMap[s.id] = {
          guru: s.guruPengampu || '',
          kelas: s.kelas || '',
          password: pass,
        };
        cardMap[s.id] = s.guruPengampu || '';
        cardPass[s.id] = pass;
      });
      setGuruTableData(initialMap);
      setCardGuruMap(cardMap);
      setCardPassMap(cardPass);
    }
  }, [subjects]);

  // Check if subject's bank soal is unlocked (accessible by default for authenticated teacher)
  const isSubjectUnlocked = (subId: string): boolean => {
    return isAdminUnlocked && !lockedSubjectIds.includes(subId);
  };

  const handleUnlockBankSoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentSub = subjects.find((s) => s.id === activeSubjectId);
    const expectedPass = currentSub?.passwordBankSoal || 'guru123';
    const masterAdminPass = settings.adminPass || '112233';

    if (
      bankUnlockPassInput.trim() === expectedPass.trim() ||
      bankUnlockPassInput.trim() === masterAdminPass.trim()
    ) {
      setLockedSubjectIds((prev) => prev.filter((id) => id !== activeSubjectId));
      setBankUnlockError('');
      setBankUnlockPassInput('');
    } else {
      setBankUnlockError(
        'Password salah! Masukkan password guru pembuat soal mapel ini atau password Master Admin.'
      );
    }
  };

  const handleLockBankSoal = (subId: string = activeSubjectId) => {
    setLockedSubjectIds((prev) => Array.from(new Set([...prev, subId])));
  };

  const handleChangeSubjectPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectPasswordInput.trim()) return;
    const currentSub = subjects.find((s) => s.id === activeSubjectId);
    if (!currentSub) return;

    const updated: SubjectPackage = {
      ...currentSub,
      passwordBankSoal: newSubjectPasswordInput.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateSubject) {
      onUpdateSubject(updated);
    }

    setChangePasswordSuccess(true);
    setTimeout(() => {
      setChangePasswordSuccess(false);
      setShowChangePasswordModal(false);
      setNewSubjectPasswordInput('');
    }, 1500);
  };

  // Sync settings form when activeSubjectId changes
  useEffect(() => {
    const current = subjects.find((s) => s.id === activeSubjectId);
    if (current) {
      setSetGuruPengampu(current.guruPengampu || '');
      setSetKelas(current.kelas || '');
      setSetMapel(current.settings.mapel || current.nama);
      setSetJudul(current.settings.judul);
      setSetSekolah(current.settings.sekolah);
      setSetLogoUrl(current.settings.logoUrl);
      setSetTahunAjaran(current.settings.tahunAjaran || '2025/2026');
      setSetDurasi(current.settings.durasiMenit);
      setSetToken(current.settings.token);
      setSetAdminPass(current.settings.adminPass);
      setSetTampilkanNilai(current.settings.tampilkanNilai);
    }
  }, [activeSubjectId, subjects]);

  const handleSaveSingleSubjectGuru = (subId: string) => {
    const targetSub = subjects.find((s) => s.id === subId);
    if (!targetSub) return;
    const entry = guruTableData[subId] || {
      guru: targetSub.guruPengampu || '',
      kelas: targetSub.kelas || '',
      password: targetSub.passwordBankSoal || 'guru123',
    };
    const updatedPkg: SubjectPackage = {
      ...targetSub,
      guruPengampu: entry.guru.trim(),
      kelas: entry.kelas.trim(),
      passwordBankSoal: (entry.password || 'guru123').trim(),
      updatedAt: new Date().toISOString(),
    };
    if (onUpdateSubject) {
      onUpdateSubject(updatedPkg);
    }
    setSavedGuruRowId(subId);
    setTimeout(() => setSavedGuruRowId(null), 2500);
  };

  const handleSaveAllSubjectsGuru = () => {
    if (!subjects || subjects.length === 0) return;
    const updatedList = subjects.map((sub) => {
      const entry = guruTableData[sub.id];
      if (entry) {
        return {
          ...sub,
          guruPengampu: entry.guru.trim(),
          kelas: entry.kelas.trim(),
          passwordBankSoal: (entry.password || sub.passwordBankSoal || 'guru123').trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return sub;
    });
    if (onUpdateAllSubjects) {
      onUpdateAllSubjects(updatedList);
    } else if (onUpdateSubject) {
      updatedList.forEach((s) => onUpdateSubject(s));
    }
    setSavedAllGuruSuccess(true);
    setTimeout(() => setSavedAllGuruSuccess(false), 3500);
  };

  const handleSaveCardGuru = (sub: SubjectPackage) => {
    const newGuru = (cardGuruMap[sub.id] !== undefined ? cardGuruMap[sub.id] : (sub.guruPengampu || '')).trim();
    const newPass = (cardPassMap[sub.id] !== undefined ? cardPassMap[sub.id] : (sub.passwordBankSoal || 'guru123')).trim();
    const updatedPkg: SubjectPackage = {
      ...sub,
      guruPengampu: newGuru,
      passwordBankSoal: newPass,
      updatedAt: new Date().toISOString(),
    };
    if (onUpdateSubject) {
      onUpdateSubject(updatedPkg);
    }
    setCardSavedGuruId(sub.id);
    setTimeout(() => setCardSavedGuruId(null), 2500);
  };

  // Handle logo file selection & drop
  const handleLogoFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Format file tidak didukung! Harap unggah berkas gambar (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal ukuran logo adalah 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSetLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoFileProcess(file);
    }
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLogoFileProcess(file);
    }
  };

  // Handle local image file upload into Data URL
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Option handlers for Main Form
  const handleAddOptionToForm = () => {
    if (formOptions.length >= 6) {
      alert('Maksimal 6 pilihan jawaban (A - F).');
      return;
    }
    const nextLetter = String.fromCharCode(65 + formOptions.length);
    setFormOptions([...formOptions, `Pilihan ${nextLetter}`]);
  };

  const handleRemoveOptionFromForm = (indexToRemove: number) => {
    if (formOptions.length <= 2) {
      alert('Minimal 2 pilihan jawaban.');
      return;
    }
    const updated = formOptions.filter((_, i) => i !== indexToRemove);
    setFormOptions(updated);
    const removedLetter = String.fromCharCode(65 + indexToRemove);
    if (formAnswerSingle === removedLetter) {
      setFormAnswerSingle('A');
    }
    setFormAnswerMulti(formAnswerMulti.filter((k) => k !== removedLetter));
  };

  // Start editing in sidebar form
  const handleStartEditInForm = (q: Question) => {
    setEditingQuestionId(q.id);
    setFormTipe(q.tipe);
    setFormDifficulty(q.difficulty || 'REGULER');
    setFormContent(q.content || '');
    setFormImage(q.image || '');
    setFormOptions(
      q.options && q.options.length > 0
        ? [...q.options]
        : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']
    );
    if (q.tipe === 'PG') {
      setFormAnswerSingle(typeof q.answer === 'string' ? q.answer : 'A');
    } else if (q.tipe === 'PGK') {
      setFormAnswerMulti(
        Array.isArray(q.answer)
          ? [...q.answer]
          : typeof q.answer === 'string'
          ? q.answer.split(',').map((s) => s.trim())
          : ['A']
      );
    } else if (q.tipe === 'BS') {
      setFormAnswerBS(String(q.answer) || 'Benar');
    } else if (q.tipe === 'ISIAN') {
      setFormAnswerIsian(String(q.answer) || '');
    } else if (q.tipe === 'URAIAN') {
      setFormAnswerUraian(String(q.answer) || '');
    }

    questionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Cancel editing in sidebar form
  const handleCancelEditInForm = () => {
    setEditingQuestionId(null);
    setFormContent('');
    setFormImage('');
    setFormOptions(['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']);
    setFormAnswerSingle('A');
    setFormAnswerMulti(['A']);
    setFormAnswerBS('Benar');
    setFormAnswerIsian('');
    setFormAnswerUraian('');
  };

  // Add or Update Question in Bank
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      alert('Teks pertanyaan wajib diisi!');
      return;
    }

    let finalAnswer: string | string[];
    let finalOptions = [...formOptions];

    if (formTipe === 'PG') {
      finalAnswer = formAnswerSingle;
    } else if (formTipe === 'PGK') {
      if (formAnswerMulti.length === 0) {
        alert('Pilih minimal satu kunci jawaban yang benar untuk PG Kompleks!');
        return;
      }
      finalAnswer = [...formAnswerMulti].sort();
    } else if (formTipe === 'BS') {
      finalOptions = ['Benar', 'Salah'];
      finalAnswer = formAnswerBS;
    } else if (formTipe === 'ISIAN') {
      if (!formAnswerIsian.trim()) {
        alert('Kunci jawaban isian singkat wajib diisi!');
        return;
      }
      finalOptions = [];
      finalAnswer = formAnswerIsian.trim();
    } else if (formTipe === 'URAIAN') {
      finalOptions = [];
      finalAnswer = formAnswerUraian.trim() || 'Rubrik / Pedoman Penilaian Guru';
    } else {
      finalAnswer = formAnswerSingle;
    }

    if (editingQuestionId) {
      const updatedQ: Question = {
        id: editingQuestionId,
        tipe: formTipe,
        difficulty: formDifficulty,
        content: formContent.trim(),
        image: formImage.trim() || null,
        options: finalOptions,
        answer: finalAnswer,
      };
      onUpdateQuestions(questions.map((q) => (q.id === editingQuestionId ? updatedQ : q)));
      setEditingQuestionId(null);
      setImportNotification({
        type: 'success',
        message: 'Perubahan butir soal berhasil disimpan ke Bank Soal!',
      });
    } else {
      const newQ: Question = {
        id: `q-${Date.now()}`,
        tipe: formTipe,
        difficulty: formDifficulty,
        content: formContent.trim(),
        image: formImage.trim() || null,
        options: finalOptions,
        answer: finalAnswer,
      };
      onUpdateQuestions([...questions, newQ]);
      setImportNotification({
        type: 'success',
        message: 'Butir soal baru berhasil ditambahkan ke Bank Soal!',
      });
    }

    // Reset question form
    setFormContent('');
    setFormImage('');
    setFormOptions(['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']);
    setFormAnswerSingle('A');
    setFormAnswerMulti(['A']);
    setFormAnswerBS('Benar');
    setFormAnswerIsian('');
    setFormAnswerUraian('');
  };

  // Open Dedicated Edit Modal
  const openEditModal = (q: Question, idx: number) => {
    setModalEditingQuestion(q);
    setModalEditIndex(idx);
    setModalEditTipe(q.tipe);
    setModalEditDifficulty(q.difficulty || 'REGULER');
    setModalEditContent(q.content || '');
    setModalEditImage(q.image || '');
    setModalEditOptions(
      q.options && q.options.length > 0
        ? [...q.options]
        : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']
    );
    if (q.tipe === 'PG') {
      setModalEditAnswerSingle(typeof q.answer === 'string' ? q.answer : 'A');
    } else if (q.tipe === 'PGK') {
      setModalEditAnswerMulti(
        Array.isArray(q.answer)
          ? [...q.answer]
          : typeof q.answer === 'string'
          ? q.answer.split(',').map((s) => s.trim())
          : ['A']
      );
    } else if (q.tipe === 'BS') {
      setModalEditAnswerBS(String(q.answer) || 'Benar');
    } else if (q.tipe === 'ISIAN') {
      setModalEditAnswerIsian(String(q.answer) || '');
    } else if (q.tipe === 'URAIAN') {
      setModalEditAnswerUraian(String(q.answer) || '');
    }
  };

  // Option handlers for Edit Modal
  const handleAddOptionToModal = () => {
    if (modalEditOptions.length >= 6) {
      alert('Maksimal 6 pilihan jawaban (A - F).');
      return;
    }
    const nextLetter = String.fromCharCode(65 + modalEditOptions.length);
    setModalEditOptions([...modalEditOptions, `Pilihan ${nextLetter}`]);
  };

  const handleRemoveOptionFromModal = (indexToRemove: number) => {
    if (modalEditOptions.length <= 2) {
      alert('Minimal 2 pilihan jawaban.');
      return;
    }
    const updated = modalEditOptions.filter((_, i) => i !== indexToRemove);
    setModalEditOptions(updated);
    const removedLetter = String.fromCharCode(65 + indexToRemove);
    if (modalEditAnswerSingle === removedLetter) {
      setModalEditAnswerSingle('A');
    }
    setModalEditAnswerMulti(modalEditAnswerMulti.filter((k) => k !== removedLetter));
  };

  const handleModalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Harap pilih berkas gambar!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setModalEditImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save changes from Edit Modal
  const handleSaveModalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditingQuestion) return;
    if (!modalEditContent.trim()) {
      alert('Teks pertanyaan wajib diisi!');
      return;
    }

    let finalAnswer: string | string[];
    let finalOptions = [...modalEditOptions];

    if (modalEditTipe === 'PG') {
      finalAnswer = modalEditAnswerSingle;
    } else if (modalEditTipe === 'PGK') {
      if (modalEditAnswerMulti.length === 0) {
        alert('Pilih minimal satu kunci jawaban yang benar untuk PG Kompleks!');
        return;
      }
      finalAnswer = [...modalEditAnswerMulti].sort();
    } else if (modalEditTipe === 'BS') {
      finalOptions = ['Benar', 'Salah'];
      finalAnswer = modalEditAnswerBS;
    } else if (modalEditTipe === 'ISIAN') {
      if (!modalEditAnswerIsian.trim()) {
        alert('Kunci jawaban isian singkat wajib diisi!');
        return;
      }
      finalOptions = [];
      finalAnswer = modalEditAnswerIsian.trim();
    } else if (modalEditTipe === 'URAIAN') {
      finalOptions = [];
      finalAnswer = modalEditAnswerUraian.trim() || 'Rubrik / Pedoman Penilaian Guru';
    } else {
      finalAnswer = modalEditAnswerSingle;
    }

    const updatedQ: Question = {
      ...modalEditingQuestion,
      tipe: modalEditTipe,
      difficulty: modalEditDifficulty,
      content: modalEditContent.trim(),
      image: modalEditImage.trim() || null,
      options: finalOptions,
      answer: finalAnswer,
    };

    const updatedQuestions = questions.map((q) =>
      q.id === modalEditingQuestion.id ? updatedQ : q
    );
    onUpdateQuestions(updatedQuestions);
    setModalEditingQuestion(null);
    setImportNotification({
      type: 'success',
      message: `Butir soal #${modalEditIndex + 1} berhasil diperbarui!`,
    });
  };

  // Bulk Import File Handler (Excel XLSX/XLS, CSV, JSON, Word DOCX)
  const handleImportFileProcess = async (file: File, directAutoApply = false) => {
    setImportFileName(file.name);
    setImportLoading(true);
    setImportErrors([]);
    setParsedQuestions([]);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let res: { questions: Question[]; errors: string[]; totalParsed: number };

      if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        res = parseExcelQuestions(buf);
      } else if (ext === 'json') {
        const text = await file.text();
        res = parseJSONQuestions(text);
      } else if (ext === 'docx' || ext === 'doc') {
        const buf = await file.arrayBuffer();
        res = await parseWordQuestions(buf);
      } else if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        res = parseCSVQuestions(text);
      } else {
        // Fallback: try parsing as text/CSV
        const text = await file.text();
        res = parseCSVQuestions(text);
      }

      setParsedQuestions(res.questions);
      setImportErrors(res.errors);

      if (res.questions.length > 0) {
        if (directAutoApply) {
          // DIRECT IMPORT: Langsung masukkan ke dalam bank soal tanpa hambatan!
          const updatedList =
            importMode === 'replace' ? res.questions : [...questions, ...res.questions];
          onUpdateQuestions(updatedList);
          setImportNotification({
            type: 'success',
            message: `Berhasil mengimpor langsung ${res.questions.length} butir soal dari "${file.name}"!`,
          });
          setShowImportModal(false);
        } else {
          setShowImportModal(true);
        }
      } else {
        // Jika tidak ada soal yang terdeteksi, buka modal untuk menampilkan penyebab/catatan
        setShowImportModal(true);
      }
    } catch (err: any) {
      setImportErrors([`Terjadi kesalahan saat memproses berkas: ${err.message || String(err)}`]);
      setShowImportModal(true);
    } finally {
      setImportLoading(false);
    }
  };

  // Direct synchronous triggers (NO setTimeout to avoid browser blocking user gestures)
  const handleTriggerDirectFile = () => {
    directFileInputRef.current?.click();
  };

  const handleTriggerCSV = () => {
    csvFileInputRef.current?.click();
  };

  const handleTriggerJSON = () => {
    jsonFileInputRef.current?.click();
  };

  const handleTriggerExcel = () => {
    excelFileInputRef.current?.click();
  };

  // Handler for inserting questions generated by AI
  const handleAddAiQuestions = (newQuestions: Question[], mode: 'append' | 'replace') => {
    const updatedList = mode === 'replace' ? newQuestions : [...questions, ...newQuestions];
    onUpdateQuestions(updatedList);

    if (onUpdateSubject && activeSubjectId) {
      const currentSub = subjects.find((s) => s.id === activeSubjectId);
      if (currentSub) {
        onUpdateSubject({
          ...currentSub,
          questions: updatedList,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    setImportNotification({
      type: 'success',
      message: `✨ Berhasil memasukkan ${newQuestions.length} butir soal dari AI Generator (${mode === 'replace' ? 'Mode Timpa Semua' : 'Mode Tambahkan'})!`,
    });
    setTimeout(() => setImportNotification(null), 5000);
  };

  // Process pasted text data (JSON or CSV)
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setImportErrors(['Harap masukkan teks data CSV atau JSON sebelum memproses.']);
      return;
    }
    setImportLoading(true);
    setImportErrors([]);
    setParsedQuestions([]);

    try {
      if (pastedFormat === 'json') {
        const res = parseJSONQuestions(pastedText);
        setParsedQuestions(res.questions);
        setImportErrors(res.errors);
        setImportFileName('Teks JSON yang Ditempel');
      } else {
        const res = parseCSVQuestions(pastedText);
        setParsedQuestions(res.questions);
        setImportErrors(res.errors);
        setImportFileName('Teks CSV yang Ditempel');
      }
    } catch (err: any) {
      setImportErrors([`Gagal membaca teks: ${err.message || String(err)}`]);
    } finally {
      setImportLoading(false);
    }
  };

  const handleApplyImport = () => {
    if (parsedQuestions.length === 0) {
      alert('Tidak ada butir soal yang valid untuk diimpor.');
      return;
    }

    let updatedList: Question[];
    if (importMode === 'replace') {
      updatedList = parsedQuestions;
    } else {
      updatedList = [...questions, ...parsedQuestions];
    }

    onUpdateQuestions(updatedList);
    setShowImportModal(false);
    const count = parsedQuestions.length;
    setParsedQuestions([]);
    setImportFileName('');
    setImportErrors([]);
    alert(`Berhasil mengimpor ${count} butir soal ke dalam ujian aktif!`);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) {
      onUpdateQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ExamSettings = {
      judul: setJudul.trim() || settings.judul,
      mapel: setMapel.trim() || settings.mapel,
      sekolah: setSekolah.trim() || settings.sekolah,
      logoUrl: setLogoUrl.trim() || settings.logoUrl,
      tahunAjaran: setTahunAjaran.trim() || '2025/2026',
      durasiMenit: Number(setDurasi) || 60,
      token: setToken.trim().toUpperCase() || 'EDUZONE2026',
      adminPass: setAdminPass.trim() || '112233',
      acakSoal: settings.acakSoal,
      tampilkanNilai: setTampilkanNilai,
    };
    onUpdateSettings(updated);

    const currentActiveSub = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
    if (currentActiveSub && onUpdateSubject) {
      onUpdateSubject({
        ...currentActiveSub,
        nama: setMapel.trim() || currentActiveSub.nama,
        guruPengampu: setGuruPengampu.trim(),
        kelas: setKelas.trim(),
        settings: updated,
        updatedAt: new Date().toISOString(),
      });
    }

    setSaveSuccessMsg('Pengaturan asesmen, guru pengampu & profil sekolah berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Export results to CSV
  const handleExportCSV = () => {
    const dataToExport = displayedResults.length > 0 ? displayedResults : results;
    if (dataToExport.length === 0) {
      setCsvFeedback({
        type: 'error',
        message: 'Belum ada data nilai peserta untuk diekspor ke CSV.',
      });
      setTimeout(() => setCsvFeedback(null), 4000);
      return;
    }

    // Helper to safely escape CSV fields according to RFC 4180
    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Include UTF-8 Byte Order Mark (\uFEFF) for native Excel & Google Sheets compatibility
    let csvContent = '\uFEFF';

    // Header row
    const headers = [
      'No',
      'Nama Siswa',
      'Kelas',
      'Mata Pelajaran',
      'Sekolah',
      'Tahun Ajaran',
      'Nilai Akhir',
      'Jawaban Benar',
      'Total Soal',
      'Persentase (%)',
      'Status Ketuntasan',
      'Waktu Selesai',
      'Pelanggaran Tab',
    ];
    csvContent += headers.map((h) => escapeCsv(h)).join(',') + '\r\n';

    // Data rows
    dataToExport.forEach((r, idx) => {
      const percentage = r.totalSoal > 0 ? ((r.benar / r.totalSoal) * 100).toFixed(1) : '0.0';
      const status = r.nilai >= 75 ? 'Tuntas' : 'Belum Tuntas';
      const mapelName = r.mapelNama || currentActiveSubject?.nama || settings.mapel || 'Ujian';
      const row = [
        idx + 1,
        r.nama,
        r.kelas,
        mapelName,
        settings.sekolah,
        settings.tahunAjaran || '2025/2026',
        r.nilai,
        r.benar,
        r.totalSoal,
        `${percentage}%`,
        status,
        r.selesaiPada,
        r.pelanggaran,
      ];
      csvContent += row.map((v) => escapeCsv(v)).join(',') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filterSubject = subjects.find((s) => s.id === resultsFilterSubjectId);
    const filterPrefix = resultsFilterSubjectId === 'all'
      ? 'Semua_Mapel'
      : (filterSubject?.nama || currentActiveSubject?.nama || settings.mapel || 'Ujian');
    const cleanMapel = filterPrefix.replace(/[^a-zA-Z0-9]/g, '_');
    const today = new Date().toISOString().split('T')[0];
    const fileName = `Rekap_Nilai_${cleanMapel}_${today}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvFeedback({
      type: 'success',
      message: `✓ Berhasil mengunduh "${fileName}" (${dataToExport.length} data siswa)!`,
    });
    setTimeout(() => setCsvFeedback(null), 4500);
  };

  const handleLoadSampleResults = () => {
    const totalQ = questions.length > 0 ? questions.length : 10;
    const currentMapelNama = currentActiveSubject?.nama || settings.mapel || 'Literasi & Numerasi';
    const sampleData: ExamResult[] = [
      {
        id: 'res-sim-1',
        nama: 'Ananda Bagas Pratama',
        kelas: 'VI-A',
        mapelId: activeSubjectId,
        mapelNama: currentMapelNama,
        nilai: 95,
        benar: Math.max(1, totalQ - 1),
        totalSoal: totalQ,
        selesaiPada: '08:45 WIB',
        pelanggaran: 0,
      },
      {
        id: 'res-sim-2',
        nama: 'Citra Kirana Putri',
        kelas: 'VI-A',
        mapelId: activeSubjectId,
        mapelNama: currentMapelNama,
        nilai: 85,
        benar: Math.max(1, Math.round(totalQ * 0.85)),
        totalSoal: totalQ,
        selesaiPada: '09:12 WIB',
        pelanggaran: 1,
      },
      {
        id: 'res-sim-3',
        nama: 'Dimas Aditya Saputra',
        kelas: 'VI-B',
        mapelId: activeSubjectId,
        mapelNama: currentMapelNama,
        nilai: 70,
        benar: Math.max(1, Math.round(totalQ * 0.7)),
        totalSoal: totalQ,
        selesaiPada: '09:20 WIB',
        pelanggaran: 2,
      },
      {
        id: 'res-sim-4',
        nama: 'Elsa Febriyanti',
        kelas: 'VI-B',
        mapelId: activeSubjectId,
        mapelNama: currentMapelNama,
        nilai: 100,
        benar: totalQ,
        totalSoal: totalQ,
        selesaiPada: '08:35 WIB',
        pelanggaran: 0,
      },
    ];

    if (onUpdateResults) {
      onUpdateResults(sampleData);
    }
    setCsvFeedback({
      type: 'info',
      message: '4 data nilai simulasi berhasil dimuat! Anda kini dapat mencoba download CSV.',
    });
    setTimeout(() => setCsvFeedback(null), 4500);
  };

  // Handlers for deleting results safely without window.confirm
  const handleConfirmClearAll = async () => {
    setIsDeletingResults(true);
    try {
      const targetSubId = resultsFilterSubjectId !== 'all' ? resultsFilterSubjectId : 'all';
      await onClearResults(targetSubId);
      setSelectedResultIds([]);
      setShowClearAllModal(false);
      setCsvFeedback({
        type: 'success',
        message: '✓ Berhasil membersihkan seluruh riwayat nilai peserta!',
      });
      setTimeout(() => setCsvFeedback(null), 4000);
    } catch (err) {
      console.error('Gagal menghapus riwayat nilai:', err);
      setCsvFeedback({
        type: 'error',
        message: 'Gagal menghapus data nilai. Silakan coba lagi.',
      });
    } finally {
      setIsDeletingResults(false);
    }
  };

  const handleConfirmDeleteOne = async () => {
    if (!resultToDelete?.id) return;
    setIsDeletingResults(true);
    try {
      const deletedName = resultToDelete.nama;
      const targetId = resultToDelete.id;

      if (onDeleteResult) {
        await onDeleteResult(targetId);
      } else if (onUpdateResults) {
        onUpdateResults(results.filter((r) => r.id !== targetId));
      }

      setSelectedResultIds((prev) => prev.filter((id) => id !== targetId));
      setResultToDelete(null);
      setCsvFeedback({
        type: 'success',
        message: `✓ Data nilai peserta "${deletedName}" berhasil dihapus.`,
      });
      setTimeout(() => setCsvFeedback(null), 4000);
    } catch (err) {
      console.error('Gagal menghapus nilai siswa:', err);
      setCsvFeedback({
        type: 'error',
        message: 'Gagal menghapus data siswa.',
      });
    } finally {
      setIsDeletingResults(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedResultIds.length === 0) return;
    setIsDeletingResults(true);
    try {
      for (const id of selectedResultIds) {
        if (onDeleteResult) {
          await onDeleteResult(id);
        }
      }
      if (!onDeleteResult && onUpdateResults) {
        const toDeleteSet = new Set(selectedResultIds);
        onUpdateResults(results.filter((r) => !toDeleteSet.has(r.id)));
      }
      const count = selectedResultIds.length;
      setSelectedResultIds([]);
      setCsvFeedback({
        type: 'success',
        message: `✓ Berhasil menghapus ${count} data nilai peserta terpilih.`,
      });
      setTimeout(() => setCsvFeedback(null), 4000);
    } catch (err) {
      console.error('Gagal menghapus data terpilih:', err);
    } finally {
      setIsDeletingResults(false);
    }
  };

  const handleToggleSelectAllResults = () => {
    if (selectedResultIds.length === displayedResults.length && displayedResults.length > 0) {
      setSelectedResultIds([]);
    } else {
      setSelectedResultIds(displayedResults.map((r, idx) => r.id || `res_${idx}`));
    }
  };

  const handleToggleSelectResult = (id: string) => {
    setSelectedResultIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Export Standalone Single HTML
  const handleDownloadStandaloneHtml = () => {
    const htmlCode = generateStandaloneHtml(questions, settings, results);
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `index.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyStandaloneHtml = async () => {
    const htmlCode = generateStandaloneHtml(questions, settings, results);
    await copyTextToClipboard(htmlCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const getStudentShareUrl = (subjectId?: string) => {
    const targetSubId = subjectId || activeSubjectId || 'literasi-numerasi';
    return getPublicStudentExamUrl(targetSubId);
  };

  const handleCopyStudentLink = async (subjectId?: string) => {
    const url = getStudentShareUrl(subjectId);
    await copyTextToClipboard(url);
    setCopyLinkSuccess(true);
    setTimeout(() => setCopyLinkSuccess(false), 2500);
  };

  const getWaMessage = (sub?: SubjectPackage) => {
    const targetSub = sub || subjects.find((s) => s.id === activeSubjectId);
    const subSettings = targetSub ? targetSub.settings : settings;
    const url = getStudentShareUrl(targetSub?.id);
    return `📢 *INFORMASI PELAKSANAAN ASESMEN / UJIAN CBT*\n\n🏫 *${subSettings.sekolah}*\n📝 *Ujian:* ${subSettings.judul}\n📚 *Mata Pelajaran:* ${subSettings.mapel}${targetSub?.guruPengampu ? `\n👨‍🏫 *Guru Pengampu:* ${targetSub.guruPengampu}` : ''}\n📅 *Tahun Ajaran:* ${subSettings.tahunAjaran || '2025/2026'}\n⏳ *Durasi:* ${subSettings.durasiMenit} Menit\n\n━━━━━━━━━━━━━━━━━━━━\n🔗 *Link Ujian Khusus Siswa (${subSettings.mapel}):*\n${url}\n\n🔑 *Token Masuk Ujian:*\n👉 *${subSettings.token}*\n━━━━━━━━━━━━━━━━━━━━\n\n📌 *Petunjuk Siswa:*\n1. Klik tautan ujian di atas pada Google Chrome / browser HP/Laptop.\n2. Masukkan Nama Lengkap, Kelas, dan Token ujian.\n3. Dilarang menutup atau berpindah tab aplikasi selama ujian (Sistem Anti-Cheat Aktif).`;
  };

  const handleCopyWaMessage = async (sub?: SubjectPackage) => {
    await copyTextToClipboard(getWaMessage(sub));
    setCopyWaSuccess(true);
    setTimeout(() => setCopyWaSuccess(false), 2500);
  };

  const handleCopySubjectLink = async (sub: SubjectPackage) => {
    const url = getStudentShareUrl(sub.id);
    await copyTextToClipboard(url);
    setCopiedSubjectLinkId(sub.id);
    setTimeout(() => setCopiedSubjectLinkId(null), 2500);
  };

  const handleCopySubjectWa = async (sub: SubjectPackage) => {
    const msg = getWaMessage(sub);
    await copyTextToClipboard(msg);
    setCopiedSubjectWaId(sub.id);
    setTimeout(() => setCopiedSubjectWaId(null), 2500);
  };

  const handleCopyAllMapelRecap = async () => {
    if (!subjects || subjects.length === 0) return;
    let text = `📢 *JADWAL & TAUTAN UJIAN CBT LENGKAP*\n🏫 *${settings.sekolah}* (T.A. ${settings.tahunAjaran || '2025/2026'})\n\nBerikut tautan langsung ujian CBT untuk masing-masing mata pelajaran:\n━━━━━━━━━━━━━━━━━━━━\n`;
    subjects.forEach((sub, idx) => {
      const url = getPublicStudentExamUrl(sub.id);
      text += `\n${idx + 1}. *${sub.nama}* (${sub.kode})\n   👨‍🏫 Guru: ${sub.guruPengampu || '-'}\n   ⏳ Durasi: ${sub.settings.durasiMenit} Menit | 🔑 Token: *${sub.settings.token}*\n   🔗 Link Siswa: ${url}\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━\n📌 *Catatan:* Siswa membuka link mata pelajaran sesuai jadwal yang sedang diujikan. Link otomatis mengunci mode siswa agar panel guru tidak dapat diakses.`;
    await copyTextToClipboard(text);
    setCopiedAllMapelRecap(true);
    setTimeout(() => setCopiedAllMapelRecap(false), 2500);
  };

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubNama.trim()) {
      alert('Nama mata pelajaran wajib diisi.');
      return;
    }
    const cleanId =
      newSubNama
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `mapel-${Date.now()}`;

    let finalId = cleanId;
    if (subjects?.some((s) => s.id === finalId)) {
      finalId = `${cleanId}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const generatedKode = newSubKode.trim().toUpperCase() || newSubNama.slice(0, 3).toUpperCase();
    const generatedToken = newSubToken.trim().toUpperCase() || `${generatedKode}2026`;

    const newSubSettings: ExamSettings = {
      ...settings,
      mapel: newSubNama.trim(),
      judul: `Asesmen ${newSubNama.trim()}`,
      token: generatedToken,
      durasiMenit: newSubDurasi > 0 ? newSubDurasi : 60,
    };

    const sampleQuestions: Question[] = newSubSeedTemplate
      ? [
          {
            id: `q-${finalId}-1`,
            tipe: 'PG',
            difficulty: 'REGULER',
            content: `Manakah di bawah ini yang merupakan materi konsep dasar dalam pembelajaran ${newSubNama.trim()}?`,
            image: null,
            options: [
              'Memahami prinsip dan kaidah utama materi',
              'Mengabaikan petunjuk dan pedoman pembelajaran',
              'Membaca tanpa menganalisis informasi',
              'Menghafal tanpa memahami konteks',
            ],
            answer: 'A',
          },
          {
            id: `q-${finalId}-2`,
            tipe: 'PGK',
            difficulty: 'HOTS',
            content: `Pilihlah DUA sikap ilmiah dan kebiasaan baik dalam mendalami ${newSubNama.trim()}!`,
            image: null,
            options: [
              'Rasa ingin tahu yang tinggi dan aktif bertanya',
              'Berpikir kritis serta memverifikasi data',
              'Menerima seluruh informasi tanpa memeriksa sumber',
              'Menyerah saat menemukan soal yang memerlukan analisis',
            ],
            answer: ['A', 'B'],
          },
          {
            id: `q-${finalId}-3`,
            tipe: 'ISIAN',
            difficulty: 'REGULER',
            content: `Sebutkan istilah utama yang menjadi pokok bahasan dalam kompetensi dasar ${newSubNama.trim()}!`,
            image: null,
            options: [],
            answer: 'kompetensi dasar',
          },
        ]
      : [];

    const newSubjectPkg: SubjectPackage = {
      id: finalId,
      nama: newSubNama.trim(),
      kode: generatedKode,
      guruPengampu: newSubGuru.trim() || 'Guru Pengampu',
      kelas: newSubKelas.trim() || 'Kelas 5',
      passwordBankSoal: (newSubPassword || 'guru123').trim(),
      deskripsi: newSubDeskripsi.trim(),
      settings: newSubSettings,
      questions: sampleQuestions,
      results: [],
      updatedAt: new Date().toISOString(),
    };

    if (onAddSubject) {
      onAddSubject(newSubjectPkg);
    }
    // Ensure the freshly created subject is unlocked
    setLockedSubjectIds((prev) => prev.filter((id) => id !== finalId));
    setShowAddSubjectModal(false);
    setNewSubNama('');
    setNewSubKode('');
    setNewSubGuru('');
    setNewSubToken('');
    setNewSubDeskripsi('');
    setNewSubPassword('guru123');
    setActiveTab('bank');
  };

  const handleOpenEditSubject = (sub: SubjectPackage) => {
    setEditingSubject(sub);
    setEditSubNama(sub.nama);
    setEditSubKode(sub.kode);
    setEditSubGuru(sub.guruPengampu || '');
    setEditSubKelas(sub.kelas || '');
    setEditSubDurasi(sub.settings.durasiMenit || 60);
    setEditSubToken(sub.settings.token || '');
    setEditSubDeskripsi(sub.deskripsi || '');
    setEditSubPassword(sub.passwordBankSoal || 'guru123');
    setShowEditSubjectModal(true);
  };

  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    if (!editSubNama.trim()) {
      alert('Nama mata pelajaran tidak boleh kosong.');
      return;
    }
    const updatedPkg: SubjectPackage = {
      ...editingSubject,
      nama: editSubNama.trim(),
      kode: editSubKode.trim().toUpperCase() || editingSubject.kode,
      guruPengampu: editSubGuru.trim(),
      kelas: editSubKelas.trim(),
      passwordBankSoal: (editSubPassword || 'guru123').trim(),
      deskripsi: editSubDeskripsi.trim(),
      settings: {
        ...editingSubject.settings,
        mapel: editSubNama.trim(),
        durasiMenit: editSubDurasi > 0 ? editSubDurasi : 60,
        token: editSubToken.trim().toUpperCase() || editingSubject.settings.token,
      },
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateSubject) {
      onUpdateSubject(updatedPkg);
    }
    setShowEditSubjectModal(false);
    setEditingSubject(null);
  };

  const handleDeleteSubjectClick = (sub: SubjectPackage) => {
    if ((subjects?.length || 0) <= 1) {
      alert('Tidak dapat menghapus mata pelajaran terakhir. Minimal harus ada 1 mata pelajaran.');
      return;
    }
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus mata pelajaran "${sub.nama}" (${sub.kode}) beserta seluruh ${sub.questions.length} butir soalnya? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      if (onDeleteSubject) {
        onDeleteSubject(sub.id);
      }
    }
  };

  const handleDownloadStudentOnlyHtml = () => {
    const htmlCode = generateStandaloneHtml(questions, settings, [], true);
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanMapel = settings.mapel.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Ujian_${cleanMapel}_Khusus_Siswa.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans select-none text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md overflow-hidden shrink-0 border border-slate-700">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <BookOpen className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <span>{settings.sekolah}</span>
              <span className="text-xs bg-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-full font-bold uppercase">
                Panel Proktor & Guru
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold uppercase">
              {settings.judul} • T.A. <span className="text-blue-300 font-bold">{settings.tahunAjaran || '2025/2026'}</span> • Token: <strong className="text-yellow-400">{settings.token}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {results.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-emerald-600/30"
              title="Unduh Rekap Nilai Peserta ke Berkas CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV ({results.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('share')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-blue-600/30"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan Ke Siswa</span>
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kembali Ke Beranda Siswa</span>
          </button>
        </div>
      </header>

      {/* Multi-Subject Bar below Header */}
      <div className="bg-slate-800 text-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 text-xs shrink-0">
        <div className="flex items-center gap-2 max-w-full overflow-hidden">
          <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5 text-yellow-400" />
            <span>Mapel ({subjects?.length || 1}):</span>
          </span>
          {subjects && subjects.length > 0 ? (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[55vw] sm:max-w-[65vw] custom-scrollbar">
              {subjects.map((sub) => {
                const isSelected = sub.id === activeSubjectId;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      if (onSelectSubject) onSelectSubject(sub.id);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-yellow-400 text-slate-950 font-black shadow-md scale-102 ring-2 ring-white/50'
                        : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600'
                    }`}
                  >
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                        isSelected ? 'bg-black/20 text-slate-900' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {sub.kode}
                    </span>
                    <span>{sub.nama}</span>
                    <span className="text-[10px] opacity-75 font-normal">({sub.questions?.length || 0})</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="font-bold text-yellow-300">{settings.mapel}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddSubjectModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat Mapel Baru</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mapel')}
            className={`border px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              activeTab === 'mapel'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 border-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-300" />
            <span>Daftar Semua Mapel ({subjects?.length || 1})</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('mapel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === 'mapel'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kelola Mapel ({subjects?.length || 1})</span>
            {!isAdminUnlocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === 'bank'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kelola Soal ({questions.length})</span>
            {!isAdminUnlocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Pengaturan Asesmen</span>
            {!isAdminUnlocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rekap Hasil Nilai ({results.length})</span>
            {!isAdminUnlocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === 'share'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan Ke Siswa</span>
            {!isAdminUnlocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Export Standalone HTML</span>
            {!isAdminUnlocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            )}
          </button>
        </div>

        {/* Lock Controls on Right */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdminUnlocked && (
            <button
              type="button"
              onClick={handleLockAdmin}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Kunci kembali seluruh panel admin"
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Kunci Panel Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Views */}
      <main className="flex-grow p-6 overflow-y-auto custom-scrollbar">
        {!isAdminUnlocked ? (
          /* Central Admin Password Gate for All Tabs (Bank Soal, Pengaturan Asesmen, Rekap Nilai, Bagikan Ke Siswa, Export, Kelola Mapel) */
          <div className="max-w-xl mx-auto py-10 px-4">
            <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-7 text-white text-center relative">
                <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/20">
                  <Lock className="w-8 h-8 text-indigo-300 animate-pulse" />
                </div>
                <span className="inline-block px-3 py-1 bg-black/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-200 border border-white/15 mb-1">
                  Proteksi Sandi Administrator
                </span>
                <h2 className="text-xl font-black text-white">
                  Autentikasi Hak Akses Admin
                </h2>
                <p className="text-xs text-indigo-200 font-semibold mt-1">
                  {getTabSecurityInfo(activeTab).title}
                </p>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-2">
                  <div className="flex items-center gap-2 font-black text-indigo-950">
                    <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Keamanan Data & Konfigurasi Asesmen</span>
                  </div>
                  <p className="leading-relaxed">
                    {getTabSecurityInfo(activeTab).desc} Masukkan kata sandi administrator untuk membuka akses.
                  </p>
                </div>

                <form onSubmit={handleUnlockAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      <span>Password Administrator</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPasswordText ? 'text' : 'password'}
                        value={adminUnlockPassInput}
                        onChange={(e) => {
                          setAdminUnlockPassInput(e.target.value);
                          setAdminUnlockError('');
                        }}
                        placeholder="Ketik password admin..."
                        autoFocus
                        className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPasswordText(!showAdminPasswordText)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showAdminPasswordText ? 'Sembunyikan' : 'Tampilkan password'}
                      >
                        {showAdminPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {adminUnlockError && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{adminUnlockError}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Buka Akses Admin Sekarang</span>
                    </button>
                    <button
                      type="button"
                      onClick={onExit}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-5 rounded-2xl text-xs uppercase transition cursor-pointer"
                    >
                      Kembali Ke Portal Siswa
                    </button>
                  </div>
                </form>

                <div className="text-center pt-3 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400">
                    Hanya administrator berwenang yang dapat mengakses halaman ini agar data asesmen tetap aman.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 0: KELOLA MATA PELAJARAN (MULTI-TEACHER & MULTI-SUBJECT BANK) */}
            {activeTab === 'mapel' && (
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-indigo-500/25 border border-indigo-400/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-indigo-300">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Platform Multi-Mapel & Multi-Guru</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                  Bank Soal & Tautan Tiap Mata Pelajaran
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl font-medium leading-relaxed">
                  Satu aplikasi ini dapat digunakan oleh banyak guru secara independen. Setiap mata pelajaran memiliki bank soal, token ujian, durasi, dan <strong>tautan link khusus siswa</strong> yang berbeda sehingga dapat dibagikan langsung ke siswa sesuai jadwal ujian.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(true)}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-emerald-500/30 transition flex items-center gap-2 cursor-pointer border border-emerald-400/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Mata Pelajaran</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllMapelRecap}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-white/20 transition flex items-center gap-2 cursor-pointer backdrop-blur-sm"
                  title="Salin rekap semua link mata pelajaran dalam format WhatsApp"
                >
                  {copiedAllMapelRecap ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Rekap Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-yellow-300" />
                      <span>Salin Rekap Semua Mapel (WA)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLockAdmin}
                  className="px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-rose-400/30 transition flex items-center gap-2 cursor-pointer backdrop-blur-sm"
                  title="Kunci kembali seluruh panel admin"
                >
                  <Lock className="w-4 h-4 text-rose-300" />
                  <span>Kunci Panel Admin</span>
                </button>
              </div>
            </div>

            {/* Bagian Edit Nama Guru Pengampu Tiap Pelajaran */}
            <div className="bg-white rounded-3xl border border-indigo-200/90 shadow-md p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                        Edit Nama Guru Pengampu Tiap Pelajaran
                      </h3>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        {subjects.length} Mapel
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">
                      Sesuaikan nama guru pengampu beserta gelar dan kelas untuk masing-masing mata pelajaran. Data guru yang disimpan otomatis diperbarui pada kop ujian CBT, portal login siswa, dan format pesan WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveAllSubjectsGuru}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4 text-emerald-300" />
                    <span>Simpan Semua Nama Guru</span>
                  </button>
                </div>
              </div>

              {savedAllGuruSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Seluruh nama guru pengampu untuk {subjects.length} mata pelajaran berhasil disimpan ke sistem!</span>
                </div>
              )}

              {/* Tabel Edit Cepat Guru Pengampu */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      <th className="py-3 px-3.5 w-12 text-center">No</th>
                      <th className="py-3 px-3.5 w-24">Kode</th>
                      <th className="py-3 px-4 min-w-[170px]">Mata Pelajaran</th>
                      <th className="py-3 px-4 min-w-[240px]">Nama Guru Pengampu (Beserta Gelar)</th>
                      <th className="py-3 px-4 min-w-[120px]">Sasaran Kelas</th>
                      <th className="py-3 px-4 min-w-[180px]">Password Guru (Buka Bank Soal)</th>
                      <th className="py-3 px-3.5 w-28 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((sub, idx) => {
                      const entry = guruTableData[sub.id] || { guru: sub.guruPengampu || '', kelas: sub.kelas || '' };
                      const isRowSaved = savedGuruRowId === sub.id;
                      const isCurrentActive = sub.id === activeSubjectId;

                      return (
                        <tr
                          key={sub.id}
                          className={`hover:bg-indigo-50/40 transition ${
                            isCurrentActive ? 'bg-indigo-50/20' : 'bg-white'
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                              {sub.kode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-900 leading-snug">
                              {sub.nama}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                              <span>{sub.questions.length} Soal</span>
                              <span>•</span>
                              <span>{sub.settings.durasiMenit} Menit</span>
                              {isCurrentActive && (
                                <span className="text-indigo-600 font-bold bg-indigo-100/60 px-1.5 py-0.2 rounded text-[9px] uppercase">
                                  Aktif
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={entry.guru}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGuruTableData((prev) => ({
                                  ...prev,
                                  [sub.id]: {
                                    ...(prev[sub.id] || { kelas: sub.kelas || '' }),
                                    guru: val,
                                  },
                                }));
                                setCardGuruMap((prev) => ({
                                  ...prev,
                                  [sub.id]: val,
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveSingleSubjectGuru(sub.id);
                                }
                              }}
                              placeholder="Contoh: Dra. Siti Rahmawati, M.Pd."
                              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={entry.kelas}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGuruTableData((prev) => ({
                                  ...prev,
                                  [sub.id]: {
                                    ...(prev[sub.id] || { guru: sub.guruPengampu || '' }),
                                    kelas: val,
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveSingleSubjectGuru(sub.id);
                                }
                              }}
                              placeholder="Contoh: Kelas 5"
                              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative">
                              <input
                                type={showPasswordMap[sub.id] ? 'text' : 'password'}
                                value={entry.password}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGuruTableData((prev) => ({
                                    ...prev,
                                    [sub.id]: {
                                      ...(prev[sub.id] || { guru: sub.guruPengampu || '', kelas: sub.kelas || '' }),
                                      password: val,
                                    },
                                  }));
                                  setCardPassMap((prev) => ({
                                    ...prev,
                                    [sub.id]: val,
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveSingleSubjectGuru(sub.id);
                                  }
                                }}
                                placeholder="Password guru..."
                                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-amber-500 rounded-xl pl-2.5 pr-8 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswordMap((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                title={showPasswordMap[sub.id] ? 'Sembunyikan' : 'Tampilkan password'}
                              >
                                {showPasswordMap[sub.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleSubjectGuru(sub.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-xs ${
                                isRowSaved
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600'
                              }`}
                              title="Simpan perubahan nama guru untuk mapel ini"
                            >
                              {isRowSaved ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-white" />
                                  <span>Tersimpan!</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subject Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={subjectSearchQuery}
                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                  placeholder="Cari mata pelajaran, kode mapel, atau nama guru pengampu..."
                  className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {subjectSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSubjectSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 font-bold">
                  {subjects ? subjects.filter((sub) => {
                    if (!subjectSearchQuery.trim()) return true;
                    const q = subjectSearchQuery.toLowerCase();
                    return (
                      sub.nama.toLowerCase().includes(q) ||
                      sub.kode.toLowerCase().includes(q) ||
                      (sub.guruPengampu && sub.guruPengampu.toLowerCase().includes(q))
                    );
                  }).length : 0} dari {subjects?.length || 0} Mapel Tersedia
                </span>
              </div>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects && subjects
                .filter((sub) => {
                  if (!subjectSearchQuery.trim()) return true;
                  const q = subjectSearchQuery.toLowerCase();
                  return (
                    sub.nama.toLowerCase().includes(q) ||
                    sub.kode.toLowerCase().includes(q) ||
                    (sub.guruPengampu && sub.guruPengampu.toLowerCase().includes(q))
                  );
                })
                .map((sub) => {
                const isActive = sub.id === activeSubjectId;
                const isCopiedLink = copiedSubjectLinkId === sub.id;
                const isCopiedWa = copiedSubjectWaId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={`bg-white rounded-3xl border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                      isActive
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-6 border-b border-slate-100 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-100 shrink-0">
                            {sub.kode}
                          </span>
                          <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                              {sub.nama}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-semibold">
                              {sub.guruPengampu ? `Guru: ${sub.guruPengampu}` : 'Guru: Belum diatur'}
                            </p>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectSubject) onSelectSubject(sub.id);
                            }}
                            className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-full border border-slate-200 transition cursor-pointer shrink-0"
                          >
                            Pilih Mapel
                          </button>
                        )}
                      </div>

                      {/* Details Badge Pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{sub.settings.durasiMenit} Menit</span>
                        </span>
                        <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-0.5 rounded-lg font-mono font-black flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span>Token: {sub.settings.token}</span>
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          <span>{sub.questions.length} Soal</span>
                        </span>
                        {sub.kelas && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium text-[10px]">
                            {sub.kelas}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body & Student URL Box */}
                    <div className="p-6 space-y-4">
                      {/* Quick Edit Guru Pengampu & Password pada Card */}
                      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px] font-black uppercase text-amber-900 tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                            <span>Guru & Password Soal:</span>
                          </span>
                          {cardSavedGuruId === sub.id ? (
                            <span className="text-emerald-700 font-black text-[10px] flex items-center gap-1 animate-fadeIn">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Tersimpan!</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold lowercase">
                              edit & simpan
                            </span>
                          )}
                        </div>

                        {/* Input Nama Guru */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase">
                            <span>Nama Guru Pengampu:</span>
                          </div>
                          <input
                            type="text"
                            value={cardGuruMap[sub.id] !== undefined ? cardGuruMap[sub.id] : (sub.guruPengampu || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCardGuruMap((prev) => ({ ...prev, [sub.id]: val }));
                              setGuruTableData((prev) => ({
                                ...prev,
                                [sub.id]: {
                                  ...(prev[sub.id] || { kelas: sub.kelas || '', password: sub.passwordBankSoal || 'guru123' }),
                                  guru: val,
                                },
                              }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCardGuru(sub);
                              }
                            }}
                            placeholder="Nama guru pengampu..."
                            className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                          />
                        </div>

                        {/* Input Password Guru Bank Soal */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase">
                            <span className="flex items-center gap-1 text-amber-900">
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Password Buka Bank Soal:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowPasswordMap((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                              className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold lowercase cursor-pointer"
                            >
                              {showPasswordMap[sub.id] ? 'sembunyikan' : 'intip'}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type={showPasswordMap[sub.id] ? 'text' : 'password'}
                              value={cardPassMap[sub.id] !== undefined ? cardPassMap[sub.id] : (sub.passwordBankSoal || 'guru123')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCardPassMap((prev) => ({ ...prev, [sub.id]: val }));
                                setGuruTableData((prev) => ({
                                  ...prev,
                                  [sub.id]: {
                                    ...(prev[sub.id] || { guru: sub.guruPengampu || '', kelas: sub.kelas || '' }),
                                    password: val,
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCardGuru(sub);
                                }
                              }}
                              placeholder="Password guru..."
                              className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCardGuru(sub)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                              title="Simpan guru & password untuk mapel ini"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* URL Box for Students */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-indigo-500" />
                            <span>Link Khusus Siswa:</span>
                          </span>
                          <span className="text-indigo-600 font-mono">?mapel={sub.id}</span>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={getStudentShareUrl(sub.id)}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-700 font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Action Buttons Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectSubject) onSelectSubject(sub.id);
                            setActiveTab('bank');
                          }}
                          className={`col-span-2 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                          }`}
                        >
                          {isSubjectUnlocked(sub.id) ? (
                            <Unlock className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <Lock className="w-4 h-4 text-amber-300" />
                          )}
                          <span>
                            {isSubjectUnlocked(sub.id)
                              ? 'Kelola Soal (Terbuka)'
                              : 'Kelola Soal (Terkunci)'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopySubjectLink(sub)}
                          className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Salin tautan langsung ujian untuk dibagikan ke siswa"
                        >
                          {isCopiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopySubjectWa(sub)}
                          className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Salin teks pengumuman WhatsApp lengkap dengan token dan link"
                        >
                          {isCopiedWa ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Format WA</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Edit / Delete Footer Controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubject(sub)}
                          className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit Data Mapel</span>
                        </button>

                        {subjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSubjectClick(sub)}
                            className="text-slate-400 hover:text-rose-600 font-bold flex items-center gap-1 text-[11px] cursor-pointer transition"
                            title="Hapus mata pelajaran ini beserta seluruh butir soalnya"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Zero state when no subject matches search */}
            {subjects && subjects.filter((sub) => {
              if (!subjectSearchQuery.trim()) return true;
              const q = subjectSearchQuery.toLowerCase();
              return (
                sub.nama.toLowerCase().includes(q) ||
                sub.kode.toLowerCase().includes(q) ||
                (sub.guruPengampu && sub.guruPengampu.toLowerCase().includes(q))
              );
            }).length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 mb-1">Mata Pelajaran Tidak Ditemukan</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Tidak ada mata pelajaran yang cocok dengan kata kunci &quot;{subjectSearchQuery}&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => setSubjectSearchQuery('')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tampilkan Semua 14 Mapel
                </button>
              </div>
            )}

            {/* Explanatory Guide Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 text-slate-700 space-y-3">
              <h4 className="text-sm font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Panduan Multi-Mapel & Pembagian Link Ujian Siswa</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-600 leading-relaxed">
                <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1">
                  <span className="font-bold text-slate-900 block">1. Satu Aplikasi, Banyak Guru</span>
                  <p>
                    Setiap guru mata pelajaran (Matematika, IPA, Bahasa Indonesia, dll.) dapat mengunggah dan mengedit naskah soalnya masing-masing tanpa saling menimpa.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1">
                  <span className="font-bold text-slate-900 block">2. Tautan Berbeda Tiap Mapel</span>
                  <p>
                    Siswa yang membuka tautan dengan parameter <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-700">?mapel=...</code> akan otomatis masuk ke mata pelajaran tersebut dan terkunci pada mode siswa.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1">
                  <span className="font-bold text-slate-900 block">3. Token & Hasil Terpisah</span>
                  <p>
                    Tiap mata pelajaran memiliki kode token masuk tersendiri, durasi pengerjaan masing-masing, serta rekap hasil nilai siswa yang dapat diekspor secara terpisah.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: BANK SOAL */}
        {activeTab === 'bank' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {!isSubjectUnlocked(activeSubjectId) ? (
              /* Dedicated Password Gate for Question Bank */
              <div className="max-w-xl mx-auto py-10 px-4">
                <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-7 text-white text-center relative">
                    <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
                      <Lock className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <span className="inline-block px-3 py-1 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-100 border border-white/20 mb-1">
                      Kelola Soal Terproteksi Sandi
                    </span>
                    <h2 className="text-xl font-black text-white">
                      Autentikasi Guru Pembuat Soal
                    </h2>
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-black text-amber-950">
                        <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Keamanan Naskah & Soal Asesmen</span>
                      </div>
                      <p className="leading-relaxed">
                        Halaman Kelola Soal & Bank Soal diproteksi password agar selain <strong>admin/guru mapel</strong> tidak dapat melihat kunci jawaban, membocorkan, ataupun mengedit butir naskah soal.
                      </p>
                    </div>

                    <form onSubmit={handleUnlockBankSoal} className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-amber-600" />
                          <span>Password Guru Pembuat Soal</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showBankPasswordText ? 'text' : 'password'}
                            value={bankUnlockPassInput}
                            onChange={(e) => {
                              setBankUnlockPassInput(e.target.value);
                              setBankUnlockError('');
                            }}
                            placeholder="Ketik password guru pembuat soal..."
                            autoFocus
                            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100 transition shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => setShowBankPasswordText(!showBankPasswordText)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title={showBankPasswordText ? 'Sembunyikan' : 'Tampilkan password'}
                          >
                            {showBankPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {bankUnlockError && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200 animate-fadeIn">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{bankUnlockError}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <button
                          type="submit"
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>Buka Kelola Soal Sekarang</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('mapel')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-5 rounded-2xl text-xs uppercase transition cursor-pointer"
                        >
                          Pilih Mapel Lain
                        </button>
                      </div>
                    </form>

                    <div className="text-center pt-3 border-t border-slate-100 space-y-1">
                      <p className="text-[11px] text-slate-400">
                        Admin sekolah juga dapat menggunakan Master Password Admin untuk membuka bank soal jika diperlukan.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Ingin ganti atau melihat password tiap guru? Buka tab <strong>Kelola Mapel</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Active Subject Context Bar with Unlock Badge & Security Controls */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-100 shrink-0">
                      {subjects.find((s) => s.id === activeSubjectId)?.kode || 'MAPEL'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Kelola Soal Terbuka</span>
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          {settings.mapel} — Kelola Soal ({questions.length} Butir Soal)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Guru Pengampu: <strong>{subjects.find((s) => s.id === activeSubjectId)?.guruPengampu || 'Belum disetel'}</strong> • Durasi: <strong>{settings.durasiMenit} Menit</strong> • Token: <strong className="text-indigo-600 font-mono font-black">{settings.token}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowAiGeneratorModal(true)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/25 active:scale-95"
                      title="Buat soal asesmen otomatis menggunakan Google Gemini AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                      <span>✨ Buat Soal AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChangePasswordModal(true)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Ganti password guru pembuat soal untuk mata pelajaran ini"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ubah Password Mapel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLockBankSoal(activeSubjectId)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Kunci kembali bank soal agar tidak dapat dilihat orang lain"
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Kunci Kembali</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyStudentLink(activeSubjectId)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Salin tautan ujian khusus siswa untuk mata pelajaran yang sedang aktif ini"
                    >
                      {copyLinkSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Link Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Salin Link Siswa</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('mapel')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ganti Mapel</span>
                    </button>
                  </div>
                </div>

            {/* Action Bar for Bulk Import & Templates */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-blue-800/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                    Fitur Baru
                  </span>
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-blue-400" />
                    <span>Impor Massal Soal (Word DOCX / CSV / JSON)</span>
                  </h2>
                </div>
                <p className="text-xs text-blue-200/80 font-medium max-w-2xl">
                  Unggah naskah soal sekaligus dari Microsoft Word (.docx), CSV, atau JSON. Mendukung Pilihan Ganda (PG), PG Kompleks (PGK), Benar-Salah (BS), Isian Singkat, dan Uraian/Essay.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Hidden File Inputs for Direct Synchronous Trigger */}
                <input
                  ref={directFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.json,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImportFileProcess(e.target.files[0], true);
                      e.target.value = '';
                    }
                  }}
                />
                <input
                  ref={excelFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImportFileProcess(e.target.files[0], true);
                      e.target.value = '';
                    }
                  }}
                />
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImportFileProcess(e.target.files[0], true);
                      e.target.value = '';
                    }
                  }}
                />
                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImportFileProcess(e.target.files[0], true);
                      e.target.value = '';
                    }
                  }}
                />

                {/* AI QUESTION GENERATOR BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowAiGeneratorModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-purple-600/30 active:scale-95 transition flex items-center gap-2 cursor-pointer border border-purple-400/40"
                  title="Buat butir soal otomatis menggunakan Google Gemini AI"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span>✨ Buat Soal AI (Gemini)</span>
                </button>

                {/* 1-CLICK DIRECT IMPORT BUTTON */}
                <button
                  type="button"
                  onClick={handleTriggerDirectFile}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition flex items-center gap-2 cursor-pointer border border-emerald-400/40"
                  title="Pilih berkas dari komputer (Excel, CSV, JSON, atau Word) dan langsung masukkan soal ke bank soal"
                >
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                  <span>⚡ Impor Langsung File</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerExcel}
                  className="px-3.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-teal-700/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                  title="Pilih dan unggah berkas Excel (.xlsx / .xls)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerCSV}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-emerald-600/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                  title="Pilih dan unggah berkas CSV (.csv)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerJSON}
                  className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-amber-600/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                  title="Pilih dan unggah berkas JSON (.json)"
                >
                  <FileCode className="w-4 h-4" />
                  <span>JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-blue-600/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                  title="Buka panel bantuan impor, preview soal, dan tempel teks"
                >
                  <Upload className="w-4 h-4" />
                  <span>Tinjau & Opsi</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="px-2.5 py-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Unduh Template Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
                    <span>Template Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadCSVTemplate}
                    className="px-2.5 py-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Unduh Template CSV (.csv)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadJSONTemplate}
                    className="px-2.5 py-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Unduh Template JSON (.json)"
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadWordTemplateGuide}
                    className="px-2.5 py-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Unduh Panduan Penulisan di Word (.docx)"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Word</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Success / Error Notification Banner */}
            {importNotification && (
              <div
                className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 animate-fadeIn shadow-sm ${
                  importNotification.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                      importNotification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {importNotification.type === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide">
                      {importNotification.type === 'success' ? 'Impor Soal Berhasil!' : 'Peringatan Impor'}
                    </h4>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">
                      {importNotification.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Lihat Riwayat / Opsi
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportNotification(null)}
                    className="w-8 h-8 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center text-slate-600 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input Soal */}
              <div
                ref={questionFormRef}
                className={`lg:col-span-5 bg-white p-6 rounded-3xl border shadow-sm space-y-4 transition-all duration-200 ${
                  editingQuestionId
                    ? 'border-amber-400 ring-4 ring-amber-400/20 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Active Edit Notice Banner */}
                {editingQuestionId && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-black text-amber-950 truncate">
                          Mode Edit: Soal #{questions.findIndex((q) => q.id === editingQuestionId) + 1}
                        </p>
                        <p className="text-[10px] text-amber-700 truncate">
                          Ubah isian lalu simpan perubahan
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEditInForm}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Batal
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                    {editingQuestionId ? (
                      <>
                        <Pencil className="w-4 h-4 text-amber-600" />
                        <span>Edit Butir Soal #{questions.findIndex((q) => q.id === editingQuestionId) + 1}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span>Tambah Soal Baru</span>
                      </>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAiGeneratorModal(true)}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      title="Buka AI Generator Soal"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>✨ Buat dengan AI</span>
                    </button>
                    <span className="text-[11px] font-bold text-slate-400">
                      Format Standar Edu Zone CBT
                    </span>
                  </div>
                </div>

                <form onSubmit={handleAddQuestion} className="space-y-4">
                  {/* Tipe & Tingkat Kesulitan */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                        Tipe Soal
                      </label>
                      <select
                        value={formTipe}
                        onChange={(e) => setFormTipe(e.target.value as QuestionType)}
                        className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl font-bold text-xs uppercase text-blue-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PG">Pilihan Ganda (PG)</option>
                        <option value="PGK">PG Kompleks (PGK)</option>
                        <option value="BS">Benar - Salah (BS)</option>
                        <option value="ISIAN">Isian Singkat (Short Answer)</option>
                        <option value="URAIAN">Uraian / Essay</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                        Tingkat Kesulitan
                      </label>
                      <select
                        value={formDifficulty}
                        onChange={(e) => setFormDifficulty(e.target.value as Difficulty)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="REGULER">REGULER</option>
                        <option value="HOTS">HOTS (Analisis Tinggi)</option>
                      </select>
                    </div>
                  </div>

                  {/* Content Pertanyaan */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                      Teks Soal / Pertanyaan
                    </label>
                    <textarea
                      rows={4}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Tuliskan teks butir soal lengkap di sini..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition"
                      required
                    />
                  </div>

                  {/* Gambar (Optional) */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 mb-1 flex items-center justify-between">
                      <span>Gambar / Ilustrasi (Opsional)</span>
                      <span className="text-[10px] text-slate-400 font-normal">URL atau Upload File</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://... atau biarkan kosong"
                        className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none"
                      />
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formImage && (
                      <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 relative inline-block">
                        <img src={formImage} alt="Preview" className="h-16 rounded-lg object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 text-[10px]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Options and Answers */}
                  {formTipe === 'PG' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-black uppercase text-slate-500">
                          Pilihan Jawaban & Kunci Tunggal
                        </label>
                        <span className="text-[10px] font-bold text-blue-600">Klik radio untuk kunci</span>
                      </div>
                      {formOptions.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <label className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border cursor-pointer hover:bg-blue-50 transition">
                              <input
                                type="radio"
                                name="pg-kunci"
                                checked={formAnswerSingle === letter}
                                onChange={() => setFormAnswerSingle(letter)}
                                className="accent-blue-600"
                              />
                              <span className="font-black text-xs text-blue-700">{letter}</span>
                            </label>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...formOptions];
                                newOpts[i] = e.target.value;
                                setFormOptions(newOpts);
                              }}
                              className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                              placeholder={`Pilihan ${letter}`}
                              required
                            />
                            {formOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionFromForm(i)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                                title={`Hapus Pilihan ${letter}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {formOptions.length < 6 && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddOptionToForm}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Pilihan {String.fromCharCode(65 + formOptions.length)}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {formTipe === 'PGK' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-black uppercase text-slate-500 flex items-center justify-between">
                        <span>Pilihan Jawaban & Kunci PG Kompleks</span>
                        <span className="text-indigo-600 font-bold">Bisa centang lebih dari 1</span>
                      </label>
                      {formOptions.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isChecked = formAnswerMulti.includes(letter);
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <label className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setFormAnswerMulti(formAnswerMulti.filter((k) => k !== letter));
                                  } else {
                                    setFormAnswerMulti([...formAnswerMulti, letter]);
                                  }
                                }}
                                className="accent-indigo-600"
                              />
                              <span className="font-black text-xs text-indigo-700">{letter}</span>
                            </label>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...formOptions];
                                newOpts[i] = e.target.value;
                                setFormOptions(newOpts);
                              }}
                              className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                              placeholder={`Pilihan ${letter}`}
                              required
                            />
                            {formOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionFromForm(i)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                                title={`Hapus Pilihan ${letter}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {formOptions.length < 6 && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddOptionToForm}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Pilihan {String.fromCharCode(65 + formOptions.length)}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {formTipe === 'BS' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-black uppercase text-slate-500">
                        Kunci Jawaban Pernyataan Benar / Salah
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Benar', 'Salah'].map((val) => (
                          <label
                            key={val}
                            className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer font-bold text-xs uppercase transition ${
                              formAnswerBS === val
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="bs-kunci"
                              checked={formAnswerBS === val}
                              onChange={() => setFormAnswerBS(val)}
                              className="hidden"
                            />
                            <span>{val}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {formTipe === 'ISIAN' && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-blue-600" />
                        <span>Kunci Jawaban Isian Singkat</span>
                      </label>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Tulis kata kunci atau frasa jawaban benar. Anda dapat menulis beberapa opsi variasi yang dipisahkan tanda koma (misal: "Ir. Soekarno, Soekarno, Sukarno").
                      </p>
                      <input
                        type="text"
                        value={formAnswerIsian}
                        onChange={(e) => setFormAnswerIsian(e.target.value)}
                        placeholder="Contoh: Ir. Soekarno, Soekarno"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition"
                        required
                      />
                    </div>
                  )}

                  {formTipe === 'URAIAN' && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Kunci / Rubrik Penilaian Uraian</span>
                      </label>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Tuliskan pedoman penskoran, poin penting yang harus ada, atau contoh jawaban ideal untuk koreksi guru.
                      </p>
                      <textarea
                        rows={3}
                        value={formAnswerUraian}
                        onChange={(e) => setFormAnswerUraian(e.target.value)}
                        placeholder="Contoh: Jawaban memuat tahapan evaporasi, kondensasi, presipitasi, dan infiltrasi..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition leading-relaxed"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    {editingQuestionId && (
                      <button
                        type="button"
                        onClick={handleCancelEditInForm}
                        className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold uppercase text-xs tracking-wider transition cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`flex-grow py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition cursor-pointer ${
                        editingQuestionId
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25'
                      }`}
                    >
                      {editingQuestionId ? 'Simpan Perubahan Soal' : 'Simpan & Tambah ke Bank Soal'}
                    </button>
                  </div>
                </form>
              </div>

            {/* List Bank Soal yang Sudah Ada */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800">
                    Daftar Butir Soal Terdaftar ({questions.length})
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Struktur Soal Sesuai Standar ANBK & AKM
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleTriggerDirectFile}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    title="Pilih berkas dari perangkat Anda dan langsung impor soal"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Impor Langsung</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerExcel}
                    className="px-2.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Unggah berkas Excel (.xlsx / .xls)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerCSV}
                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Unggah berkas CSV (.csv)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerJSON}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Unggah berkas JSON (.json)"
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateQuestions(ANBK_LITERASI_35_QUESTIONS);
                      setSaveSuccessMsg('✅ Berhasil mengimpor 35 Butir Soal Resmi ANBK Literasi Bahasa Indonesia ke Kelola Soal!');
                      setTimeout(() => setSaveSuccessMsg(''), 5000);
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer active:scale-95"
                    title="Impor 35 Butir Soal Resmi ANBK Literasi Bahasa Indonesia Kelas 6 SD ke Kelola Soal"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Impor 35 Soal ANBK Literasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Buka opsi impor, Word DOCX, preview soal, atau tempel teks"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Semua Format</span>
                  </button>
                </div>
              </div>

              {/* 35 Soal ANBK Literasi Quick Status & Import Banner */}
              <div className="mb-4 p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">
                        Bank Soal ANBK: 35 Soal Literasi Bahasa Indonesia
                      </span>
                      {questions.length === 35 && questions.some((q) => q.id === 'anbk-lit-35') ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          35 Soal Aktif Terpasang
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Saat Ini: {questions.length} Butir Soal
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Paket resmi Kemendikbudristek: 10 Wacana Sastra & Informasi, PG, PGK, Benar/Salah, dan Isian Singkat.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateQuestions(ANBK_LITERASI_35_QUESTIONS);
                    setSaveSuccessMsg('✅ Berhasil mengimpor 35 Butir Soal Resmi ANBK Literasi Bahasa Indonesia ke Kelola Soal!');
                    setTimeout(() => setSaveSuccessMsg(''), 5000);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer whitespace-nowrap"
                  title="Klik untuk mengimpor 35 soal literasi ke daftar kelola soal aktif"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-200" />
                  <span>{questions.length === 35 ? 'Muat Ulang 35 Soal ANBK' : 'Impor 35 Soal ke Kelola Soal'}</span>
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto flex-grow pr-1 custom-scrollbar max-h-[70vh]">
                {questions.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 italic text-sm">
                    Kelola soal masih kosong. Silakan gunakan formulir di samping untuk menambahkan soal atau gunakan tombol <strong>Impor 35 Soal ANBK Literasi</strong> di atas.
                  </div>
                ) : (
                  questions.map((q, idx) => {
                    const isBeingEditedInForm = editingQuestionId === q.id;
                    const answerArray = Array.isArray(q.answer)
                      ? q.answer
                      : typeof q.answer === 'string'
                      ? q.answer.split(',').map((s) => s.trim())
                      : [String(q.answer)];

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-4 rounded-2xl border text-xs transition-all duration-200 ${
                          isBeingEditedInForm
                            ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 flex-grow">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                #{idx + 1}
                              </span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                                  q.tipe === 'PG'
                                    ? 'bg-blue-100 text-blue-700'
                                    : q.tipe === 'PGK'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : q.tipe === 'BS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : q.tipe === 'ISIAN'
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {q.tipe === 'PG'
                                  ? 'Pilihan Ganda'
                                  : q.tipe === 'PGK'
                                  ? 'PG Kompleks'
                                  : q.tipe === 'BS'
                                  ? 'Benar-Salah'
                                  : q.tipe === 'ISIAN'
                                  ? 'Isian Singkat'
                                  : 'Uraian / Essay'}
                              </span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                                  q.difficulty === 'HOTS'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {q.difficulty}
                              </span>
                              {q.image && (
                                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                  <ImageIcon className="w-2.5 h-2.5" /> Bergambar
                                </span>
                              )}
                              {isBeingEditedInForm && (
                                <span className="bg-amber-500 text-white font-black px-2 py-0.5 rounded text-[10px] animate-pulse">
                                  Sedang Diedit di Form
                                </span>
                              )}
                            </div>

                            <p className="font-bold text-slate-800 text-sm leading-relaxed">
                              {q.content}
                            </p>

                            {/* Image Thumbnail if available */}
                            {q.image && (
                              <div className="pt-1">
                                <img
                                  src={q.image}
                                  alt="Ilustrasi Soal"
                                  className="max-h-24 max-w-xs rounded-xl border border-slate-200 object-contain bg-white p-1"
                                />
                              </div>
                            )}

                            {/* Options List for PG and PGK */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5">
                                {q.options.map((opt, oIdx) => {
                                  const letter = String.fromCharCode(65 + oIdx);
                                  const isCorrect =
                                    q.tipe === 'PG'
                                      ? q.answer === letter
                                      : answerArray.includes(letter);
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition ${
                                        isCorrect
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                          : 'bg-white border-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <span
                                        className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                                          isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}
                                      >
                                        {letter}
                                      </span>
                                      <span className="truncate flex-grow">{opt}</span>
                                      {isCorrect && (
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Answer summary */}
                            <div className="pt-1 text-[11px] text-slate-600 flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-500">
                                {q.tipe === 'URAIAN' ? 'Rubrik / Pedoman: ' : 'Kunci Jawaban: '}
                              </span>
                              <span
                                className={`font-black px-2.5 py-0.5 rounded-md border ${
                                  q.tipe === 'URAIAN'
                                    ? 'text-purple-700 bg-purple-50 border-purple-200'
                                    : q.tipe === 'ISIAN'
                                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                }`}
                              >
                                {Array.isArray(q.answer) ? q.answer.join(', ') : String(q.answer)}
                              </span>
                            </div>
                          </div>

                          {/* Actions: Edit Modal, Load into Form, Delete */}
                          <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditModal(q, idx)}
                              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                              title="Edit Butir Soal Ini"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEditInForm(q)}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded-xl transition cursor-pointer"
                              title="Muat ke formulir sebelah kiri"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition cursor-pointer"
                              title="Hapus Soal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )}

        {/* TAB 2: PENGATURAN ASESMEN */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {saveSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold">Tersimpan otomatis</span>
              </div>
            )}

            {/* Live Preview Card */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 text-white shadow-lg border border-blue-700/50">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                    Live Preview Kop & Portal Ujian Siswa
                  </span>
                </div>
                <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full font-bold uppercase text-yellow-300">
                  Tahun Ajaran: {setTahunAjaran || '2025/2026'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-md flex items-center justify-center shrink-0 border border-white/20">
                  {setLogoUrl ? (
                    <img
                      src={setLogoUrl}
                      alt="Logo Sekolah"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <School className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="inline-block bg-blue-500/30 text-blue-200 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase mb-1">
                    {setSekolah || 'NAMA SEKOLAH BELUM DIATUR'}
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                    {setJudul || 'JUDUL UJIAN BELUM DIATUR'}
                  </h4>
                  <p className="text-xs text-blue-200 font-semibold mt-1">
                    Mata Pelajaran: <span className="text-yellow-300 font-bold">{setMapel}</span>
                    {setGuruPengampu ? (
                      <> • Guru: <span className="text-emerald-300 font-bold">{setGuruPengampu}</span></>
                    ) : null}
                    {setKelas ? (
                      <> • <span className="text-blue-100 font-bold">{setKelas}</span></>
                    ) : null}
                    • Durasi: {setDurasi} Menit • Token: <span className="text-yellow-300 font-mono font-bold tracking-wider">{setToken}</span>
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* BAGIAN 1: IDENTITAS & LOGO SEKOLAH */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                      1. Identitas & Logo Satuan Pendidikan
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Atur logo resmi sekolah, nama sekolah, dan tahun ajaran aktif asesmen
                    </p>
                  </div>
                </div>

                {/* Sub-bagian Upload Logo */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Upload & Atur Logo Sekolah</span>
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setLogoInputTab('upload')}
                        className={`px-3 py-1 rounded-lg transition ${
                          logoInputTab === 'upload'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Unggah File
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoInputTab('url')}
                        className={`px-3 py-1 rounded-lg transition ${
                          logoInputTab === 'url'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tautan URL
                      </button>
                    </div>
                  </div>

                  {/* Mode Upload File */}
                  {logoInputTab === 'upload' ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(true);
                      }}
                      onDragLeave={() => setIsDraggingLogo(false)}
                      onDrop={handleLogoDrop}
                      onClick={() => logoFileInputRef.current?.click()}
                      className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                        isDraggingLogo
                          ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                          : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100 hover:border-blue-400'
                      }`}
                    >
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-800">
                          Klik untuk memilih file logo atau seret ke sini
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Format: PNG (transparan disarankan), JPG, SVG, WebP • Maks. 3MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Mode Tautan URL */
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={setLogoUrl}
                          onChange={(e) => setSetLogoUrl(e.target.value)}
                          placeholder="https://contoh-domain.sch.id/logo.png"
                          className="w-full p-3.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                        <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  {/* Logo Preview & Quick Reset Options */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                        {setLogoUrl ? (
                          <img
                            src={setLogoUrl}
                            alt="Pratinjau Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {setLogoUrl ? 'Logo Terpasang' : 'Belum Ada Logo'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {setLogoUrl.startsWith('data:')
                            ? 'Berkas gambar lokal (Base64)'
                            : setLogoUrl || 'Gunakan tombol di samping untuk mengatur logo'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSetLogoUrl(DEFAULT_TUT_WURI_LOGO)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 transition"
                        title="Gunakan Logo Tut Wuri Handayani Kemendikbud"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Logo Tut Wuri Handayani</span>
                      </button>

                      {setLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setSetLogoUrl('')}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[11px] font-bold text-rose-700 flex items-center gap-1.5 transition"
                          title="Hapus Logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-bagian Ubah Nama Sekolah & Tahun Ajaran */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Nama Sekolah / Satuan Pendidikan</span>
                    </label>
                    <input
                      type="text"
                      value={setSekolah}
                      onChange={(e) => setSetSekolah(e.target.value)}
                      placeholder="Contoh: SD Edu Zone"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                      required
                    />
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Nama resmi sekolah yang tercantum pada dokumen ujian dan portal peserta.
                    </p>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Tahun Ajaran</span>
                    </label>
                    <input
                      type="text"
                      value={setTahunAjaran}
                      onChange={(e) => setSetTahunAjaran(e.target.value)}
                      placeholder="2025/2026"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                      required
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['2024/2025', '2025/2026', '2026/2027', '2027/2028'].map((th) => (
                        <button
                          key={th}
                          type="button"
                          onClick={() => setSetTahunAjaran(th)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                            setTahunAjaran === th
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {th}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: JUDUL UJIAN & MATA PELAJARAN */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                      2. Judul Ujian & Informasi Asesmen
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Sesuaikan nama asesmen dan mata pelajaran yang diujikan
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Judul Asesmen / Ujian</span>
                    </label>
                    <input
                      type="text"
                      value={setJudul}
                      onChange={(e) => setSetJudul(e.target.value)}
                      placeholder="Contoh: Asesmen Sumatif Akhir Jenjang (ASAJ)"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                      required
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">
                        Pilihan Cepat:
                      </span>
                      {[
                        'Asesmen Sumatif Akhir Jenjang',
                        'Penilaian Akhir Semester (PAS)',
                        'Asesmen Nasional (ANBK)',
                        'Sumatif Tengah Semester (STS)',
                        'Try Out Ujian Sekolah',
                      ].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSetJudul(item)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                            setJudul === item
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                      Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      value={setMapel}
                      onChange={(e) => setSetMapel(e.target.value)}
                      placeholder="Contoh: Literasi & Numerasi (ANBK)"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span>Nama Guru Pengampu (Mapel Ini)</span>
                      </label>
                      <input
                        type="text"
                        value={setGuruPengampu}
                        onChange={(e) => setSetGuruPengampu(e.target.value)}
                        placeholder="Contoh: Dra. Siti Rahmawati, M.Pd."
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Nama guru pengampu mata pelajaran yang sedang aktif ini.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <School className="w-4 h-4 text-blue-600" />
                        <span>Sasaran Kelas / Rombel</span>
                      </label>
                      <input
                        type="text"
                        value={setKelas}
                        onChange={(e) => setSetKelas(e.target.value)}
                        placeholder="Contoh: Kelas 5"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Rombongan belajar atau kelas peserta ujian.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 3: PARAMETER PELAKSANAAN, TIMER GLOBAL & KEAMANAN */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                      3. Timer Global Ujian & Durasi Pengerjaan
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Atur hitung mundur global dengan fitur auto-submit otomatis saat waktu habis
                    </p>
                  </div>
                </div>

                {/* Card Konfigurasi Timer Global */}
                <div className="p-5 rounded-2xl border-2 border-blue-100 bg-blue-50/40 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Durasi Timer Global (Menit)</span>
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Waktu hitung mundur bersama yang berlaku untuk seluruh peserta sejak mulai mengerjakan
                      </p>
                    </div>

                    {/* Preview Jam:Menit:Detik */}
                    <div className="flex items-center gap-2 bg-slate-900 text-yellow-300 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black shadow-inner">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-sans">Preview:</span>
                      <span>
                        {String(Math.floor((Number(setDurasi) || 60) / 60)).padStart(2, '0')}:
                        {String((Number(setDurasi) || 60) % 60).padStart(2, '0')}:00
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                      <div className="relative">
                        <input
                          type="number"
                          value={setDurasi}
                          onChange={(e) => setSetDurasi(Math.max(1, Math.min(360, Number(e.target.value))))}
                          className="w-full p-3.5 bg-white border border-blue-200 rounded-xl font-black text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-sm"
                          min={1}
                          max={360}
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          Menit
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">
                        Pilihan Cepat:
                      </span>
                      {[
                        { label: '15 Menit', val: 15 },
                        { label: '30 Menit', val: 30 },
                        { label: '45 Menit', val: 45 },
                        { label: '60 Menit (1 Jam)', val: 60 },
                        { label: '90 Menit (1.5 Jam)', val: 90 },
                        { label: '120 Menit (2 Jam)', val: 120 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setSetDurasi(item.val)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                            setDurasi === item.val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-blue-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-Submit feature explanation banner */}
                  <div className="p-3.5 bg-white rounded-xl border border-blue-200 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-blue-900 uppercase text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Mekanisme Countdown & Auto-Submit Otomatis</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Hitung mundur waktu akan ditampilkan secara langsung di bagian atas layar ujian siswa. Saat sisa waktu <strong>&le; 5 menit</strong> indikator berubah kuning, saat <strong>&le; 1 menit</strong> berkedip merah peringatan, dan saat mencapai <strong>00:00:00</strong> sistem akan <strong>secara otomatis mengunci lembar ujian serta mengumpulkan seluruh jawaban siswa</strong> ke rekap nilai.
                    </p>
                  </div>
                </div>

                {/* Token Ujian & Password Guru */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>Token Masuk Ujian</span>
                    </label>
                    <input
                      type="text"
                      value={setToken}
                      onChange={(e) => setSetToken(e.target.value.toUpperCase())}
                      className="w-full p-3.5 bg-yellow-50 border border-yellow-300 rounded-xl font-black text-xs uppercase text-blue-950 tracking-widest text-center outline-none focus:border-yellow-500 focus:bg-yellow-100/70 transition"
                      required
                    />
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Token rahasia yang wajib dimasukkan siswa sebelum membuka soal ujian.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-slate-600" />
                      <span>Kata Sandi Panel Guru</span>
                    </label>
                    <input
                      type="text"
                      value={setAdminPass}
                      onChange={(e) => setSetAdminPass(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-center text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                      required
                    />
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Kunci akses untuk membuka panel bank soal dan rekap nilai ujian.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={setTampilkanNilai}
                      onChange={(e) => setSetTampilkanNilai(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Tampilkan Skor Nilai Langsung Kepada Siswa Setelah Ujian Berakhir
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Jika dinonaktifkan, siswa hanya akan melihat konfirmasi selesai tanpa melihat nilai akhir.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tombol Simpan Perubahan */}
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl active:scale-[0.99] transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Simpan Seluruh Pengaturan Ujian</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: REKAP HASIL NILAI */}
        {activeTab === 'results' && (
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Real-time Cloud Sync Banner */}
            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25">
                  <Globe className="w-6 h-6 text-emerald-100 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200"></span>
                    </span>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">
                      Sinkronisasi Cloud Realtime Aktif (Firebase Firestore)
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-100 font-medium mt-0.5">
                    Nilai siswa yang mengerjakan di HP atau laptop mana pun langsung terkirim dan muncul live di layar guru secara otomatis!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3.5 py-1.5 bg-black/20 backdrop-blur-md rounded-xl text-xs font-mono font-bold text-white border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{displayedResults.length} Nilai Terkumpul</span>
                </span>
              </div>
            </div>

            {/* Feedback notification banner */}
            {csvFeedback && (
              <div
                className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition shadow-sm ${
                  csvFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : csvFeedback.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {csvFeedback.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : csvFeedback.type === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                  <span>{csvFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCsvFeedback(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Summary Statistics Cards (Only shown if displayedResults > 0) */}
            {displayedResults.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Peserta</p>
                    <h4 className="text-2xl font-black text-slate-900">{displayedResults.length} Siswa</h4>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-Rata Nilai</p>
                    <h4 className="text-2xl font-black text-slate-900">
                      {(displayedResults.reduce((acc, r) => acc + r.nilai, 0) / displayedResults.length).toFixed(1)}
                    </h4>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nilai Tertinggi</p>
                    <h4 className="text-2xl font-black text-slate-900">
                      {Math.max(...displayedResults.map((r) => r.nilai))}
                      <span className="text-xs font-semibold text-slate-400 ml-1.5">
                        (Min: {Math.min(...displayedResults.map((r) => r.nilai))})
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ketuntasan (≥75)</p>
                    <h4 className="text-2xl font-black text-slate-900">
                      {Math.round((displayedResults.filter((r) => r.nilai >= 75).length / displayedResults.length) * 100)}%
                      <span className="text-xs font-semibold text-slate-400 ml-1.5">
                        ({displayedResults.filter((r) => r.nilai >= 75).length}/{displayedResults.length})
                      </span>
                    </h4>
                  </div>
                </div>
              </div>
            )}

            {/* Visualisasi Data Tren Nilai Siswa (Recharts) */}
            <ResultsAnalyticsCharts
              results={allResultsAcrossSubjects.length > 0 ? allResultsAcrossSubjects : displayedResults}
              activeSubjectName={
                resultsFilterSubjectId === 'all'
                  ? 'Semua Mata Pelajaran'
                  : subjects.find((s) => s.id === resultsFilterSubjectId)?.nama || currentActiveSubject?.nama || settings.mapel
              }
              onLoadSampleData={handleLoadSampleResults}
            />

            {/* Main Table Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <span>Laporan Hasil Asesmen Peserta</span>
                    </h3>
                    {/* Badge Nama Mapel yang Dikerjakan */}
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl text-xs font-black uppercase shadow-2xs">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Mapel:{' '}
                        {resultsFilterSubjectId === 'all'
                          ? 'Semua Mata Pelajaran'
                          : subjects.find((s) => s.id === resultsFilterSubjectId)?.nama || currentActiveSubject?.nama || settings.mapel}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mt-1">
                    {settings.judul} • Total {displayedResults.length} Peserta Selesai Mengerjakan
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={displayedResults.length === 0}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition active:scale-95 ${
                      displayedResults.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                    title={
                      displayedResults.length > 0
                        ? 'Unduh seluruh data nilai dalam format CSV'
                        : 'Belum ada data nilai untuk diunduh'
                    }
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Excel / CSV ({displayedResults.length})</span>
                  </button>

                  {selectedResultIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      disabled={isDeletingResults}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Terpilih ({selectedResultIds.length})</span>
                    </button>
                  )}

                  {displayedResults.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowClearAllModal(true)}
                      disabled={isDeletingResults}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Hapus Semua Data</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Filter Bar */}
              {subjects && subjects.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 mb-6">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Filter Mata Pelajaran:
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setResultsFilterSubjectId('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        resultsFilterSubjectId === 'all'
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Layers className={`w-3.5 h-3.5 ${resultsFilterSubjectId === 'all' ? 'text-white' : 'text-blue-500'}`} />
                      <span>Semua Mapel</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                          resultsFilterSubjectId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {allResultsAcrossSubjects.length}
                      </span>
                    </button>

                    {subjects.map((s) => {
                      const isSelected = resultsFilterSubjectId === s.id;
                      const sCount = allResultsAcrossSubjects.filter((r) => r.mapelId === s.id).length;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setResultsFilterSubjectId(s.id);
                            if (onSelectSubject && activeSubjectId !== s.id) {
                              onSelectSubject(s.id);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />
                          <span>{s.nama}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {sCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feedback Alert */}
              {csvFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold mb-5 flex items-center justify-between border ${
                    csvFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : csvFeedback.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {csvFeedback.type === 'success' && <Check className="w-4 h-4 text-emerald-600" />}
                    {csvFeedback.type === 'error' && <X className="w-4 h-4 text-rose-600" />}
                    {csvFeedback.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600" />}
                    <span>{csvFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCsvFeedback(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {displayedResults.length === 0 ? (
                <div className="text-center py-16 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black uppercase text-slate-800 mb-1">
                    Belum Ada Data Hasil Ujian Peserta
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                    Siswa yang telah menyelesaikan sesi ujian akan otomatis masuk ke tabel ini beserta catatan nama mata pelajaran, nilai, waktu pengerjaan, dan riwayat anti-cheat.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleLoadSampleResults}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Muat 4 Contoh Nilai Simulasi</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 uppercase text-[10px] font-black border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-3.5 text-center w-10">
                          <input
                            type="checkbox"
                            checked={selectedResultIds.length === displayedResults.length && displayedResults.length > 0}
                            onChange={handleToggleSelectAllResults}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                            title="Pilih semua"
                          />
                        </th>
                        <th className="p-3.5 text-center w-12">No</th>
                        <th className="p-3.5">Nama Lengkap</th>
                        <th className="p-3.5">Kelas</th>
                        <th className="p-3.5">Mata Pelajaran</th>
                        <th className="p-3.5 text-center">Nilai Akhir</th>
                        <th className="p-3.5 text-center">Benar / Total</th>
                        <th className="p-3.5 text-center">Persentase</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center">Waktu Selesai</th>
                        <th className="p-3.5 text-center">Pelanggaran Tab</th>
                        <th className="p-3.5 text-center w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {displayedResults.map((r, idx) => {
                        const rowId = r.id || `res_${idx}`;
                        const isSelected = selectedResultIds.includes(rowId);
                        const pct = r.totalSoal > 0 ? ((r.benar / r.totalSoal) * 100).toFixed(1) : '0';
                        const isTuntas = r.nilai >= 75;
                        const subjectName = r.mapelNama || currentActiveSubject?.nama || settings.mapel || 'Literasi & Numerasi';

                        return (
                          <tr
                            key={rowId}
                            className={`transition-colors ${
                              isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectResult(rowId)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                              />
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3.5 font-bold text-slate-900">{r.nama}</td>
                            <td className="p-3.5 uppercase">{r.kelas}</td>
                            <td className="p-3.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{subjectName}</span>
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                {r.nilai}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              {r.benar} / {r.totalSoal}
                            </td>
                            <td className="p-3.5 text-center text-slate-600">{pct}%</td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isTuntas
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isTuntas ? 'Tuntas' : 'Belum Tuntas'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center text-slate-500">{r.selesaiPada}</td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`font-bold px-2 py-0.5 rounded ${
                                  r.pelanggaran === 0
                                    ? 'text-emerald-700 bg-emerald-50'
                                    : 'text-amber-700 bg-amber-50'
                                }`}
                              >
                                {r.pelanggaran}x
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setResultToDelete(r)}
                                disabled={isDeletingResults}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 hover:text-rose-800 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                title={`Hapus hasil ujian ${r.nama}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* In-App Confirmation Modal: Delete One Result */}
              {resultToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">
                      Hapus Nilai Peserta?
                    </h3>
                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      Apakah Anda yakin ingin menghapus data nilai peserta <strong>{resultToDelete.nama}</strong> ({resultToDelete.kelas}) dengan nilai <strong>{resultToDelete.nilai}</strong>?
                    </p>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5 text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Mata Pelajaran:</span>
                        <span className="font-semibold text-slate-700">
                          {resultToDelete.mapelNama || currentActiveSubject?.nama || settings.mapel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Waktu Pengerjaan:</span>
                        <span className="font-semibold text-slate-700">{resultToDelete.selesaiPada}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jawaban Benar:</span>
                        <span className="font-semibold text-slate-700">{resultToDelete.benar} dari {resultToDelete.totalSoal} soal</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setResultToDelete(null)}
                        disabled={isDeletingResults}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeleteOne}
                        disabled={isDeletingResults}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isDeletingResults ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* In-App Confirmation Modal: Clear All Results */}
              {showClearAllModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">
                      Hapus Semua Riwayat Nilai?
                    </h3>
                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      Tindakan ini akan menghapus <strong>seluruh {results.length} data nilai peserta</strong> untuk mata pelajaran <strong>{settings.judul || 'ini'}</strong> dari server database dan memori perangkat. Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium mb-5">
                      💡 Tip: Pastikan Anda telah mengunduh berkas laporan Excel / CSV jika masih memerlukan arsip nilai ini.
                    </div>
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowClearAllModal(false)}
                        disabled={isDeletingResults}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmClearAll}
                        disabled={isDeletingResults}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isDeletingResults ? 'Menghapus...' : 'Ya, Hapus Semua'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BAGIKAN KE SISWA */}
        {activeTab === 'share' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-blue-200 border border-white/15">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Distribusi Khusus Peserta Didik</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                  Bagikan Ujian Tanpa Akses Guru
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                  Pilih cara termudah untuk memberikan ujian ke siswa. Seluruh metode di bawah ini telah dikonfigurasi secara otomatis agar <strong>Panel Guru, Bank Soal, dan Pengaturan Admin disembunyikan sepenuhnya</strong> dari pandangan siswa.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md text-center shrink-0 w-full sm:w-auto">
                <span className="text-[10px] text-blue-200 font-bold uppercase block tracking-wider mb-1">
                  Token Resmi Ujian
                </span>
                <span className="text-3xl font-black text-yellow-300 tracking-widest font-mono">
                  {settings.token}
                </span>
              </div>
            </div>

            {/* Subject Selector for Share Tab */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Pilih Tautan Ujian Tiap Mata Pelajaran
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAllMapelRecap}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedAllMapelRecap ? 'Rekap Tersalin!' : 'Salin Rekap Semua Mapel (WhatsApp)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {subjects && subjects.map((s) => {
                  const isSel = s.id === activeSubjectId;
                  const isCopied = copiedSubjectLinkId === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isSel
                          ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white text-indigo-800 border border-indigo-100">
                            {s.kode}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Token: {s.settings.token}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">{s.nama}</h4>
                        <p className="text-[11px] text-slate-500">
                          {s.questions.length} Soal • {s.settings.durasiMenit} Menit
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectSubject) onSelectSubject(s.id);
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                            isSel
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isSel ? '✓ Sedang Dipilih' : 'Pilih Mapel Ini'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopySubjectLink(s)}
                          className="p-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-xl transition cursor-pointer"
                          title="Salin Link Siswa untuk mapel ini"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Method 1: Direct Link */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left">
                <div>
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-4">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1">
                    1. Tautan Langsung Siswa (URL)
                  </h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed mb-3">
                    Bagikan tautan ini ke siswa. Tautan ini dilengkapi parameter <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold font-mono">?mode=siswa#siswa</code> yang otomatis menyembunyikan Panel Guru.
                  </p>

                  <div className="relative mb-3">
                    <input
                      type="text"
                      readOnly
                      value={getStudentShareUrl()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full bg-slate-50 border border-slate-300 p-3 pr-24 rounded-2xl text-[11px] font-mono text-blue-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      title="Klik untuk memilih seluruh tautan"
                    />
                    <button
                      onClick={() => handleCopyStudentLink()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 shadow-sm"
                    >
                      {copyLinkSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Link publik resmi (domain ais-pre-) dapat dibuka langsung oleh siapa saja / seluruh siswa tanpa izin akun Google.</span>
                    </p>
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium">
                      ⚠️ <strong>Perhatian:</strong> Jangan membagikan URL dari address bar browser jika bertuliskan <code className="font-mono font-bold text-rose-700">ais-dev-</code> karena itu link internal pengembang. Selalu gunakan tombol <strong>&quot;Salin Link Siswa&quot;</strong> di atas.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => handleCopyStudentLink()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {copyLinkSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Link Siswa Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Link Siswa</span>
                      </>
                    )}
                  </button>

                  <a
                    href={getStudentShareUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Uji Coba Tampilan</span>
                  </a>
                </div>
              </div>

              {/* Method 2: QR Code */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left">
                <div>
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mb-4">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1">
                    2. QR Code Proyektor & Papan Tulis
                  </h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4">
                    Tampilkan di layar proyektor kelas atau cetak kartu ujian. Siswa tinggal memindai menggunakan kamera HP / tablet tanpa perlu mengetik link.
                  </p>

                  <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        getStudentShareUrl()
                      )}`}
                      alt="QR Code Ujian Siswa"
                      className="w-36 h-36 object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                    />
                  </div>
                </div>

                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                    getStudentShareUrl()
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-yellow-300" />
                  <span>Buka QR Code Ukuran Besar</span>
                </a>
              </div>

              {/* Method 3: WhatsApp Broadcast Message */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left">
                <div>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1">
                    3. Format Pesan WhatsApp / Grup Kelas
                  </h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4">
                    Format pesan siap kirim yang memuat nama sekolah, judul ujian, durasi, token, serta instruksi singkat.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl mb-4 text-[11px] text-slate-700 whitespace-pre-line font-mono max-h-40 overflow-y-auto custom-scrollbar">
                    {getWaMessage()}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyWaMessage()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {copyWaSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Pesan WhatsApp Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Pesan WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

              {/* Method 4: Offline File (Laboratorium Komputer) */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left">
                <div>
                  <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mb-4">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1">
                    4. File HTML Khusus Siswa (Offline Lab)
                  </h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4">
                    Untuk komputer lab sekolah tanpa koneksi internet. File HTML ini <strong>TIDAK MEMILIKI</strong> kode Panel Guru maupun password admin di dalamnya. Siswa hanya bisa mengerjakan ujian.
                  </p>

                  <div className="bg-purple-50/60 border border-purple-200 p-3.5 rounded-2xl mb-4 text-xs text-purple-900 font-semibold space-y-1">
                    <p className="flex items-center gap-1.5 font-black uppercase">
                      <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                      <span>Keamanan Maksimal Terjamin:</span>
                    </p>
                    <p className="text-slate-600 font-medium">
                      Bisa dicopy ke flashdisk untuk dibagikan ke seluruh PC lab siswa tanpa khawatir siswa mengintip jawaban atau merubah soal.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadStudentOnlyHtml}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 px-4 rounded-xl font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File HTML Khusus Siswa</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXPORT STANDALONE HTML */}
        {activeTab === 'export' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-12 text-left">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileCode className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
                Export Berkas Mandiri (Standalone HTML)
              </h3>
              <p className="text-slate-500 text-sm max-w-xl mx-auto mb-8 font-medium">
                Pilih jenis berkas HTML yang ingin diunduh. Berkas mandiri dapat langsung dibuka di browser apa pun tanpa memerlukan instalasi server atau internet.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                {/* Option 1: Student Only HTML */}
                <div className="p-6 rounded-2xl border-2 border-purple-200 bg-purple-50/40 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Rekomendasi untuk Siswa</span>
                    </div>
                    <h4 className="text-base font-black uppercase text-slate-900 mb-2">
                      HTML Khusus Siswa (Aman)
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mb-6 leading-relaxed">
                      Kode Panel Guru dan password admin telah dihilangkan secara permanen dari file ini. Siswa hanya dapat memasukkan token dan mengerjakan soal.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadStudentOnlyHtml}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh HTML Siswa</span>
                  </button>
                </div>

                {/* Option 2: Complete HTML */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-slate-200 text-slate-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Arsip Guru & Proktor</span>
                    </div>
                    <h4 className="text-base font-black uppercase text-slate-900 mb-2">
                      HTML Lengkap (Guru + Siswa)
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mb-6 leading-relaxed">
                      Memuat seluruh aplikasi lengkap dengan Panel Guru, editor bank soal, pengaturan asesmen, dan rekap nilai.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadStandaloneHtml}
                      className="flex-1 bg-slate-900 hover:bg-black text-white py-3.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider shadow-md flex items-center justify-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh index.html</span>
                    </button>
                    <button
                      onClick={handleCopyStandaloneHtml}
                      className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 py-3.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider shadow-sm flex items-center justify-center transition"
                      title="Salin Kode HTML"
                    >
                      {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Option 3: Export CSV Nilai */}
                <div className="p-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Data Nilai Peserta</span>
                    </div>
                    <h4 className="text-base font-black uppercase text-slate-900 mb-2">
                      Rekap Nilai Siswa (CSV)
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mb-4 leading-relaxed">
                      Unduh seluruh data nilai peserta dalam format CSV (Excel & Google Sheets) lengkap dengan waktu pengerjaan dan status anti-cheat.
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-[11px] text-slate-600 mb-6 font-semibold flex items-center justify-between">
                      <span>Data Tersimpan:</span>
                      <strong className="text-emerald-700 font-black">{results.length} Siswa</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl font-black uppercase text-xs tracking-wider shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Berkas CSV</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 mt-6">
                <span className="font-black text-slate-800 uppercase block mb-1">
                  💡 Tips Pelaksanaan Ujian:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-500 font-medium">
                  <li>Gunakan <strong>HTML Khusus Siswa</strong> jika komputer lab tidak terkoneksi ke internet.</li>
                  <li>Jika menggunakan tautan web, gunakan fitur di tab <strong>Bagikan Ke Siswa</strong> agar lebih praktis via link atau QR Code.</li>
                  <li>Sistem Anti-Cheat tetap berjalan otomatis memantau siswa saat berganti tab atau meminimalkan browser.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </main>

      {/* MODAL BULK IMPORT SOAL (WORD DOCX, CSV, JSON) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight">
                    Impor Massal Soal Ujian
                  </h3>
                  <p className="text-xs text-blue-200/80 font-medium">
                    Mendukung berkas Microsoft Word (.docx), CSV, dan JSON
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedQuestions([]);
                  setImportErrors([]);
                  setImportFileName('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
              {/* Presets / Official Question Bank Card */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border-2 border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900">
                        Naskah Bank Soal Resmi: 35 Soal Literasi (ANBK) Bahasa Indonesia
                      </h4>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Standar Kemendikbud
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      35 butir lengkap: 10 Wacana Sastra & Informasi, PG, PGK, Benar/Salah, dan Isian Singkat.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateQuestions(ANBK_LITERASI_35_QUESTIONS);
                    setShowImportModal(false);
                    setSaveSuccessMsg('✅ Berhasil mengimpor 35 Butir Soal Resmi ANBK Literasi Bahasa Indonesia ke Kelola Soal!');
                    setTimeout(() => setSaveSuccessMsg(''), 5000);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 transition active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Klik untuk langsung mengimpor 35 butir soal ke lembar kelola soal"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Impor 35 Soal Sekarang</span>
                </button>
              </div>

              {/* Method Switcher Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setImportInputMethod('upload')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    importInputMethod === 'upload'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Unggah Berkas (CSV / JSON / Word)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportInputMethod('paste')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    importInputMethod === 'paste'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Tempel Data Teks (JSON / CSV)</span>
                </button>
              </div>

              {/* METHOD 1: UPLOAD FILE */}
              {importInputMethod === 'upload' && (
                <>
                  {/* Quick Format Filter Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => excelFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                      <span>Berkas Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => csvFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Berkas CSV (.csv)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => jsonFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileCode className="w-4 h-4 text-amber-600" />
                      <span>Berkas JSON (.json)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => importFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Berkas Word (.docx)</span>
                    </button>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImportFile(true);
                    }}
                    onDragLeave={() => setIsDraggingImportFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingImportFile(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImportFileProcess(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => importFileInputRef.current?.click()}
                    className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                      isDraggingImportFile
                        ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                        : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={importFileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.json,.csv,.txt,.docx,.doc"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImportFileProcess(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
                      <Upload className="w-7 h-7" />
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {importFileName ? (
                          <span className="text-blue-700 font-black">Berkas: {importFileName}</span>
                        ) : (
                          'Klik untuk memilih berkas atau seret berkas ke sini'
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Mendukung: <strong>.xlsx (Excel)</strong>, <strong>.csv (Spreadsheet)</strong>, <strong>.json (Struktur Data)</strong>, atau <strong>.docx (Word)</strong>
                      </p>
                    </div>
                  </div>

                  {/* Template quick downloads */}
                  <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-600">Unduh Format Contoh:</span>
                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                      <span>Template Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Template CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadJSONTemplate}
                      className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5 text-amber-600" />
                      <span>Template JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadWordTemplateGuide}
                      className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span>Panduan Word</span>
                    </button>
                  </div>
                </>
              )}

              {/* METHOD 2: PASTE TEXT (JSON OR CSV) */}
              {importInputMethod === 'paste' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Pilih Format Teks:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPastedFormat('csv')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          pastedFormat === 'csv'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Format CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPastedFormat('json')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          pastedFormat === 'json'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Format JSON</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={
                        pastedFormat === 'json'
                          ? '[\n  {\n    "tipe": "PG",\n    "content": "Ibukota Indonesia adalah...",\n    "options": ["Surabaya", "Jakarta", "Bandung", "Medan"],\n    "answer": "B",\n    "difficulty": "REGULER"\n  }\n]'
                          : 'tipe,content,opsi_a,opsi_b,opsi_c,opsi_d,kunci,difficulty\nPG,"Ibu kota Indonesia adalah...","Surabaya","Jakarta","Bandung","Medan","B","REGULER"'
                      }
                      className="w-full p-4 font-mono text-xs bg-slate-50 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {pastedFormat === 'json' ? 'Tempel array JSON valid atau objek dengan property "questions"' : 'Tempel baris CSV dengan baris pertama sebagai header'}
                    </span>
                    <button
                      type="button"
                      onClick={handleProcessPastedText}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Proses & Tinjau Teks</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Template Download Links */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">Belum memiliki berkas contoh?</span>
                  <span className="text-slate-500 text-[11px]">Gunakan template resmi untuk format yang presisi:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadCSVTemplate}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Template CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadJSONTemplate}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>Template JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadWordTemplateGuide}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Panduan Word</span>
                  </button>
                </div>
              </div>

              {/* Loading Indicator */}
              {importLoading && (
                <div className="p-6 text-center text-blue-700 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                  <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold">Sedang memproses dan mengekstrak naskah soal...</p>
                </div>
              )}

              {/* Error / Warning Notice */}
              {importErrors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Catatan Pemrosesan Berkas:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-2 font-medium">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Result Preview */}
              {parsedQuestions.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                    <div>
                      <h4 className="text-xs font-black text-emerald-900 uppercase flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Berhasil Mendeteksi {parsedQuestions.length} Butir Soal</span>
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Tinjau ringkasan soal sebelum dimasukkan ke dalam ujian aktif.
                      </p>
                    </div>

                    {/* Breakdown Badges */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                        PG: {parsedQuestions.filter((q) => q.tipe === 'PG').length}
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                        PGK: {parsedQuestions.filter((q) => q.tipe === 'PGK').length}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        BS: {parsedQuestions.filter((q) => q.tipe === 'BS').length}
                      </span>
                      <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
                        Isian: {parsedQuestions.filter((q) => q.tipe === 'ISIAN').length}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                        Uraian: {parsedQuestions.filter((q) => q.tipe === 'URAIAN').length}
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700">Metode Penambahan ke Bank Soal:</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="accent-blue-600"
                        />
                        <span className="font-bold text-slate-800 text-[11px]">Tambahkan (Append)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="accent-rose-600"
                        />
                        <span className="font-bold text-rose-700 text-[11px]">Ganti Semua (Replace)</span>
                      </label>
                    </div>
                  </div>

                  {/* Questions Preview List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {parsedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 hover:border-blue-300 transition shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                              #{idx + 1}
                            </span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                                q.tipe === 'PG'
                                  ? 'bg-blue-100 text-blue-700'
                                  : q.tipe === 'PGK'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : q.tipe === 'BS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : q.tipe === 'ISIAN'
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {q.tipe}
                            </span>
                            <span className="font-bold text-slate-400 text-[10px]">
                              {q.difficulty}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">
                            Kunci:{' '}
                            <strong className="text-blue-700">
                              {Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}
                            </strong>
                          </span>
                        </div>
                        <p className="font-medium text-slate-800 line-clamp-2">
                          {q.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedQuestions([]);
                  setImportErrors([]);
                  setImportFileName('');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={parsedQuestions.length === 0 || importLoading}
                onClick={handleApplyImport}
                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-md ${
                  parsedQuestions.length > 0 && !importLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {parsedQuestions.length > 0
                    ? `Terapkan & Simpan (${parsedQuestions.length}) Soal`
                    : 'Pilih Berkas Soal Terlebih Dahulu'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED EDIT QUESTION MODAL */}
      {modalEditingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-wide">
                      Edit Butir Soal #{modalEditIndex + 1}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                      ID: {modalEditingQuestion.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Perbarui teks, gambar, opsi pilihan, dan kunci jawaban soal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditingQuestion(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModalEdit} className="p-6 overflow-y-auto space-y-4 flex-grow custom-scrollbar">
              {/* Tipe & Tingkat Kesulitan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Tipe Soal
                  </label>
                  <select
                    value={modalEditTipe}
                    onChange={(e) => setModalEditTipe(e.target.value as QuestionType)}
                    className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl font-bold text-xs uppercase text-blue-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PG">Pilihan Ganda (PG)</option>
                    <option value="PGK">PG Kompleks (PGK)</option>
                    <option value="BS">Benar - Salah (BS)</option>
                    <option value="ISIAN">Isian Singkat (Short Answer)</option>
                    <option value="URAIAN">Uraian / Essay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={modalEditDifficulty}
                    onChange={(e) => setModalEditDifficulty(e.target.value as Difficulty)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="REGULER">REGULER</option>
                    <option value="HOTS">HOTS (Analisis Tinggi)</option>
                  </select>
                </div>
              </div>

              {/* Teks Soal / Pertanyaan */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Teks Soal / Pertanyaan
                </label>
                <textarea
                  rows={4}
                  value={modalEditContent}
                  onChange={(e) => setModalEditContent(e.target.value)}
                  placeholder="Tuliskan teks butir soal lengkap..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition"
                  required
                />
              </div>

              {/* Gambar / Ilustrasi */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1 flex items-center justify-between">
                  <span>Gambar / Ilustrasi (Opsional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">URL atau Upload File</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modalEditImage}
                    onChange={(e) => setModalEditImage(e.target.value)}
                    placeholder="https://... atau biarkan kosong"
                    className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none"
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleModalImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {modalEditImage && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 relative inline-block">
                    <img src={modalEditImage} alt="Preview" className="h-20 rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={() => setModalEditImage('')}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 text-[10px]"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Options & Answer for PG */}
              {modalEditTipe === 'PG' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black uppercase text-slate-500">
                      Pilihan Jawaban & Kunci Tunggal
                    </label>
                    <span className="text-[10px] font-bold text-blue-600">Klik radio untuk memilih kunci</span>
                  </div>
                  {modalEditOptions.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <label className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border cursor-pointer hover:bg-blue-50 transition">
                          <input
                            type="radio"
                            name="modal-pg-kunci"
                            checked={modalEditAnswerSingle === letter}
                            onChange={() => setModalEditAnswerSingle(letter)}
                            className="accent-blue-600"
                          />
                          <span className="font-black text-xs text-blue-700">{letter}</span>
                        </label>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...modalEditOptions];
                            newOpts[i] = e.target.value;
                            setModalEditOptions(newOpts);
                          }}
                          className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder={`Pilihan ${letter}`}
                          required
                        />
                        {modalEditOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionFromModal(i)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title={`Hapus Pilihan ${letter}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {modalEditOptions.length < 6 && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddOptionToModal}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pilihan {String.fromCharCode(65 + modalEditOptions.length)}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Options & Answer for PGK */}
              {modalEditTipe === 'PGK' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black uppercase text-slate-500">
                      Pilihan Jawaban & Kunci PG Kompleks
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600">Bisa centang lebih dari 1 kunci</span>
                  </div>
                  {modalEditOptions.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isChecked = modalEditAnswerMulti.includes(letter);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <label className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setModalEditAnswerMulti(modalEditAnswerMulti.filter((k) => k !== letter));
                              } else {
                                setModalEditAnswerMulti([...modalEditAnswerMulti, letter]);
                              }
                            }}
                            className="accent-indigo-600"
                          />
                          <span className="font-black text-xs text-indigo-700">{letter}</span>
                        </label>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...modalEditOptions];
                            newOpts[i] = e.target.value;
                            setModalEditOptions(newOpts);
                          }}
                          className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder={`Pilihan ${letter}`}
                          required
                        />
                        {modalEditOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionFromModal(i)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title={`Hapus Pilihan ${letter}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {modalEditOptions.length < 6 && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddOptionToModal}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pilihan {String.fromCharCode(65 + modalEditOptions.length)}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Answer for BS */}
              {modalEditTipe === 'BS' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-black uppercase text-slate-500">
                    Kunci Jawaban Pernyataan Benar / Salah
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Benar', 'Salah'].map((val) => (
                      <label
                        key={val}
                        className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer font-bold text-xs uppercase transition ${
                          modalEditAnswerBS === val
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="modal-bs-kunci"
                          checked={modalEditAnswerBS === val}
                          onChange={() => setModalEditAnswerBS(val)}
                          className="hidden"
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer for ISIAN */}
              {modalEditTipe === 'ISIAN' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kunci Jawaban Isian Singkat</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Tulis kata kunci jawaban benar (pisahkan dengan tanda koma jika ada alternatif ejaan).
                  </p>
                  <input
                    type="text"
                    value={modalEditAnswerIsian}
                    onChange={(e) => setModalEditAnswerIsian(e.target.value)}
                    placeholder="Contoh: Ir. Soekarno, Soekarno"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition"
                    required
                  />
                </div>
              )}

              {/* Answer for URAIAN */}
              {modalEditTipe === 'URAIAN' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kunci / Rubrik Penilaian Uraian</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Tuliskan pedoman penilaian atau poin kunci jawaban untuk panduan guru.
                  </p>
                  <textarea
                    rows={3}
                    value={modalEditAnswerUraian}
                    onChange={(e) => setModalEditAnswerUraian(e.target.value)}
                    placeholder="Contoh: Jawaban memuat langkah evaporasi, kondensasi..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition leading-relaxed"
                  />
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEditingQuestion(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-blue-600/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MATA PELAJARAN BARU */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">
                    Tambah Mata Pelajaran Baru
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Setiap mapel memiliki bank soal dan link ujian siswa sendiri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Nama Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubNama}
                    onChange={(e) => {
                      setNewSubNama(e.target.value);
                      if (!newSubKode) {
                        const words = e.target.value.trim().split(/\s+/);
                        if (words.length > 1) {
                          setNewSubKode(words.map((w) => w[0]).join('').slice(0, 4).toUpperCase());
                        } else {
                          setNewSubKode(e.target.value.slice(0, 3).toUpperCase());
                        }
                      }
                      if (!newSubToken && e.target.value.trim()) {
                        const code = e.target.value.slice(0, 3).toUpperCase();
                        setNewSubToken(`${code}2026`);
                      }
                    }}
                    placeholder="Contoh: Bahasa Inggris, IPA, Informatika"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Kode Singkat
                  </label>
                  <input
                    type="text"
                    value={newSubKode}
                    onChange={(e) => setNewSubKode(e.target.value.toUpperCase())}
                    placeholder="BIG / IPA"
                    maxLength={6}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-xs text-indigo-700 outline-none focus:border-indigo-600 focus:bg-white transition text-center uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Guru Pengampu
                  </label>
                  <input
                    type="text"
                    value={newSubGuru}
                    onChange={(e) => setNewSubGuru(e.target.value)}
                    placeholder="Contoh: Ibu Sarah, S.Pd"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Sasaran Kelas
                  </label>
                  <input
                    type="text"
                    value={newSubKelas}
                    onChange={(e) => setNewSubKelas(e.target.value)}
                    placeholder="Contoh: Kelas 5, Fase C"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Durasi Pengerjaan (Menit)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={newSubDurasi}
                    onChange={(e) => setNewSubDurasi(parseInt(e.target.value) || 60)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Token Masuk Ujian Siswa
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubToken}
                    onChange={(e) => setNewSubToken(e.target.value.toUpperCase())}
                    placeholder="Contoh: BIG2026"
                    className="w-full p-3 bg-amber-50 border border-amber-300 rounded-xl font-mono font-black text-xs text-amber-900 outline-none focus:border-amber-500 focus:bg-white transition uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700">
                  Deskripsi / Petunjuk Mata Pelajaran (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={newSubDeskripsi}
                  onChange={(e) => setNewSubDeskripsi(e.target.value)}
                  placeholder="Petunjuk khusus ujian untuk siswa..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Password Guru Pembuat Soal (Buka Bank Soal)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Wajib untuk akses naskah</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSubPassword}
                  onChange={(e) => setNewSubPassword(e.target.value)}
                  placeholder="Contoh: guru123 atau guru-ipa"
                  className="w-full p-3 bg-amber-50/50 border border-amber-300 rounded-xl font-mono font-bold text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-400">
                  Password khusus agar selain guru pengampu mapel ini tidak dapat melihat dan mengedit soal.
                </p>
              </div>

              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSubSeedTemplate}
                  onChange={(e) => setNewSubSeedTemplate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  Sertakan 3 butir contoh soal panduan (Pilihan Ganda, PG Kompleks, Isian Singkat)
                </span>
              </label>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-indigo-600/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Mata Pelajaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DATA MATA PELAJARAN */}
      {showEditSubjectModal && editingSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">
                    Edit Data Mata Pelajaran
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Memperbarui nama, guru, token, dan durasi untuk {editingSubject.nama}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditSubjectModal(false);
                  setEditingSubject(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubject} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Nama Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSubNama}
                    onChange={(e) => setEditSubNama(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Kode Singkat
                  </label>
                  <input
                    type="text"
                    value={editSubKode}
                    onChange={(e) => setEditSubKode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-xs text-indigo-700 outline-none focus:border-indigo-600 focus:bg-white transition text-center uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Guru Pengampu
                  </label>
                  <input
                    type="text"
                    value={editSubGuru}
                    onChange={(e) => setEditSubGuru(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Sasaran Kelas
                  </label>
                  <input
                    type="text"
                    value={editSubKelas}
                    onChange={(e) => setEditSubKelas(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Durasi Ujian (Menit)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={editSubDurasi}
                    onChange={(e) => setEditSubDurasi(parseInt(e.target.value) || 60)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-700">
                    Token Masuk Ujian Siswa
                  </label>
                  <input
                    type="text"
                    required
                    value={editSubToken}
                    onChange={(e) => setEditSubToken(e.target.value.toUpperCase())}
                    className="w-full p-3 bg-amber-50 border border-amber-300 rounded-xl font-mono font-black text-xs text-amber-900 outline-none focus:border-amber-500 focus:bg-white transition uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700">
                  Deskripsi / Petunjuk Mata Pelajaran
                </label>
                <textarea
                  rows={2}
                  value={editSubDeskripsi}
                  onChange={(e) => setEditSubDeskripsi(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Password Guru Pembuat Soal (Buka Bank Soal)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Kunci akses naskah</span>
                </label>
                <input
                  type="text"
                  required
                  value={editSubPassword}
                  onChange={(e) => setEditSubPassword(e.target.value)}
                  placeholder="Contoh: guru123"
                  className="w-full p-3 bg-amber-50/50 border border-amber-300 rounded-xl font-mono font-bold text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-400">
                  Hanya guru pengampu pemegang password ini yang dapat melihat dan mengedit soal mapel ini.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSubjectModal(false);
                    setEditingSubject(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-indigo-600/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Mapel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UBAH PASSWORD GURU PEMBUAT SOAL MAPEL INI */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white">
                    Ubah Password Bank Soal
                  </h3>
                  <p className="text-xs text-amber-100">
                    {subjects.find((s) => s.id === activeSubjectId)?.nama || settings.mapel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setNewSubjectPasswordInput('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangeSubjectPassword} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Keamanan Khusus Guru Pengampu</span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Guru pembuat soal mata pelajaran ini wajib mengingat password baru ini untuk membuka lembar kerja bank soal di masa mendatang.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700">
                  Password Baru Guru Pembuat Soal
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSubjectPasswordInput}
                  onChange={(e) => setNewSubjectPasswordInput(e.target.value)}
                  placeholder="Ketik password baru (contoh: ipa2026)..."
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-amber-500 rounded-2xl font-mono font-bold text-xs text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>

              {changePasswordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Password bank soal mapel ini berhasil diperbarui!</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setNewSubjectPasswordInput('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newSubjectPasswordInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-amber-500/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Password Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Question Generator Modal (Powered by Gemini AI) */}
      <AiQuestionGeneratorModal
        isOpen={showAiGeneratorModal}
        onClose={() => setShowAiGeneratorModal(false)}
        activeSubjectName={settings.mapel || 'Matematika'}
        activeSubjectClass={subjects.find((s) => s.id === activeSubjectId)?.kelas || 'Kelas 5 SD'}
        existingQuestionCount={questions.length}
        onAddQuestions={handleAddAiQuestions}
      />
    </div>
  );
};
