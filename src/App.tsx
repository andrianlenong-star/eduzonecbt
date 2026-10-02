import React, { useState, useEffect, useRef } from 'react';
import { ActiveView, Question, ExamSettings, ExamResult, SubjectPackage } from './types';
import { LogoShape, LogoFit } from './utils/logoHelper';
import { DEFAULT_SETTINGS, DEFAULT_QUESTIONS, DEFAULT_SUBJECTS } from './defaultData';
import { ANBK_LITERASI_35_QUESTIONS } from './anbkLiterasiData';
import { PortalView } from './components/PortalView';
import { LoginModal } from './components/LoginModal';
import { ExamView } from './components/ExamView';
import { ResultView } from './components/ResultView';
import { TeacherPanel } from './components/TeacherPanel';
import { AntiCheatOverlay } from './components/AntiCheatOverlay';
import {
  submitExamResultToCloud,
  subscribeToCloudResults,
  clearAllCloudResults,
  deleteCloudResult,
  saveGlobalSchoolConfigToCloud,
  subscribeToGlobalSchoolConfig,
} from './lib/firebase';

export default function App() {
  // Detect subject ID from URL parameters (?mapel=..., ?subject=..., or hash)
  const detectSubjectIdFromUrl = (allSubjects: SubjectPackage[]): string => {
    if (typeof window === 'undefined') return allSubjects[0]?.id || 'literasi-numerasi';
    try {
      const url = new URL(window.location.href);
      const rawParam =
        url.searchParams.get('mapel') ||
        url.searchParams.get('subject') ||
        url.searchParams.get('exam') ||
        url.searchParams.get('id');
      if (rawParam) {
        const param = decodeURIComponent(rawParam).trim().toLowerCase();
        const match = allSubjects.find(
          (s) =>
            s.id.toLowerCase() === param ||
            s.kode.toLowerCase() === param ||
            s.nama.toLowerCase() === param ||
            s.id.toLowerCase().replace(/-/g, '') === param.replace(/-/g, '')
        );
        if (match) return match.id;
      }
      const rawHash = window.location.hash;
      if (rawHash) {
        const hash = decodeURIComponent(rawHash).toLowerCase();
        const matchHash = allSubjects.find(
          (s) =>
            hash.includes(`mapel=${s.id.toLowerCase()}`) ||
            hash.includes(`mapel=${s.kode.toLowerCase()}`) ||
            hash.includes(`/${s.id.toLowerCase()}`)
        );
        if (matchHash) return matchHash.id;
      }
    } catch (e) {
      console.error(e);
    }
    const saved = localStorage.getItem('unity_active_subject_id');
    if (saved && allSubjects.some((s) => s.id === saved)) return saved;
    return allSubjects[0]?.id || 'literasi-numerasi';
  };

  // Check if URL specifies student-only mode
  const detectStudentOnly = () => {
    if (typeof window === 'undefined') return false;
    const href = window.location.href.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      search.includes('mode=siswa') ||
      search.includes('role=siswa') ||
      search.includes('siswa=1') ||
      search.includes('siswa=true') ||
      hash.includes('mode=siswa') ||
      hash.includes('role=siswa') ||
      hash.includes('siswa') ||
      href.includes('mode=siswa') ||
      href.includes('role=siswa')
    );
  };

  // Multi-Subject Packages State with automatic migration and synchronization
  const [subjects, setSubjects] = useState<SubjectPackage[]>(() => {
    try {
      const saved = localStorage.getItem('unity_subjects_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored subjects don't include all default subjects, automatically merge the missing default subjects
          const existingIds = new Set(parsed.map((s: SubjectPackage) => s.id));
          const missingDefaults = DEFAULT_SUBJECTS.filter((def) => !existingIds.has(def.id));
          const mergedList = missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;
          const normalized = mergedList.map((s: SubjectPackage) => ({
            ...s,
            passwordBankSoal: s.passwordBankSoal || 'guru123',
          }));
          const savedLogo = localStorage.getItem('unity_logo_v1');
          const savedLogoShape = (localStorage.getItem('unity_logo_shape_v1') as 'rounded' | 'circle' | 'square') || 'rounded';
          const savedLogoFit = (localStorage.getItem('unity_logo_fit_v1') as 'cover' | 'contain') || 'contain';
          const updatedList = normalized.map((s: SubjectPackage) => {
            const currentJudul = s.settings?.judul;
            const updatedJudul = (!currentJudul || currentJudul.toLowerCase().includes('unity') || currentJudul.includes('ANBK') || currentJudul.includes('Asesmen Nasional') || currentJudul.includes('Edu Zone') || currentJudul.toLowerCase().includes('candy'))
              ? "EduZone CBT"
              : currentJudul.replace(/Edu\s+Zone/gi, 'EduZone').replace(/Candy\s+CBT/gi, 'EduZone CBT');

            // Pastikan mata pelajaran Literasi (ANBK) memuat lengkap 35 butir soal resmi
            const isLiterasi = s.id === 'literasi-numerasi' || s.kode === 'ANBK' || s.nama.toLowerCase().includes('literasi');
            const shouldImport35 = isLiterasi && (!s.questions || s.questions.length < 35 || !s.questions.some(q => q.id === 'anbk-lit-35'));
            const finalQuestions = shouldImport35 ? ANBK_LITERASI_35_QUESTIONS : (s.questions || []);

            const currentSekolah = s.settings?.sekolah;
            const updatedSekolah = (!currentSekolah || currentSekolah.toLowerCase().includes('unity') || currentSekolah === 'Edu Zone')
              ? "EduZone"
              : currentSekolah.replace(/Edu\s+Zone/gi, 'EduZone');

            return {
              ...s,
              questions: finalQuestions,
              settings: {
                ...s.settings,
                judul: updatedJudul,
                sekolah: updatedSekolah,
                logoUrl: savedLogo || s.settings.logoUrl || DEFAULT_SETTINGS.logoUrl,
                logoShape: s.settings.logoShape || savedLogoShape,
                logoFit: s.settings.logoFit || savedLogoFit,
              }
            };
          });
          try {
            localStorage.setItem('unity_subjects_v4', JSON.stringify(updatedList));
          } catch (err) {
            console.error(err);
          }
          return updatedList;
        }
      }
      // Check legacy single-subject state
      const legacyQs = localStorage.getItem('unity_questions_v3');
      const legacySettings = localStorage.getItem('unity_settings_v3');
      const legacyResults = localStorage.getItem('unity_results_v3');
      const savedLogo = localStorage.getItem('unity_logo_v1');
      if (legacyQs || legacySettings) {
        const cloned: SubjectPackage[] = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
        if (legacyQs) {
          const parsedQs = JSON.parse(legacyQs);
          cloned[0].questions = Array.isArray(parsedQs) && parsedQs.length >= 35 ? parsedQs : ANBK_LITERASI_35_QUESTIONS;
        } else {
          cloned[0].questions = ANBK_LITERASI_35_QUESTIONS;
        }
        if (legacySettings) cloned[0].settings = { ...cloned[0].settings, ...JSON.parse(legacySettings) };
        if (legacyResults) cloned[0].results = JSON.parse(legacyResults);
        const savedLogoShape = (localStorage.getItem('unity_logo_shape_v1') as 'rounded' | 'circle' | 'square') || 'rounded';
        const savedLogoFit = (localStorage.getItem('unity_logo_fit_v1') as 'cover' | 'contain') || 'contain';
        cloned.forEach((c) => {
          c.settings.judul = (!c.settings.judul || c.settings.judul.toLowerCase().includes('unity') || c.settings.judul.includes('Edu Zone')) ? "Asesmen EduZone CBT" : c.settings.judul.replace(/Edu\s+Zone/gi, 'EduZone');
          if (!c.settings.sekolah || c.settings.sekolah.toLowerCase().includes('unity') || c.settings.sekolah === 'Edu Zone') {
            c.settings.sekolah = "EduZone";
          } else {
            c.settings.sekolah = c.settings.sekolah.replace(/Edu\s+Zone/gi, 'EduZone');
          }
          if (savedLogo) c.settings.logoUrl = savedLogo;
          c.settings.logoShape = c.settings.logoShape || savedLogoShape;
          c.settings.logoFit = c.settings.logoFit || savedLogoFit;
        });
        return cloned;
      }
    } catch (e) {
      console.error(e);
    }
    const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('unity_logo_v1') : null;
    const savedLogoShape = typeof window !== 'undefined' ? (localStorage.getItem('unity_logo_shape_v1') as 'rounded' | 'circle' | 'square') || 'rounded' : 'rounded';
    const savedLogoFit = typeof window !== 'undefined' ? (localStorage.getItem('unity_logo_fit_v1') as 'cover' | 'contain') || 'contain' : 'contain';
    if (savedLogo) {
      return DEFAULT_SUBJECTS.map((s) => ({
        ...s,
        settings: {
          ...s.settings,
          judul: (!s.settings.judul || s.settings.judul.toLowerCase().includes('unity') || s.settings.judul.includes('Edu Zone')) ? "Asesmen EduZone CBT" : s.settings.judul.replace(/Edu\s+Zone/gi, 'EduZone'),
          sekolah: (!s.settings.sekolah || s.settings.sekolah.toLowerCase().includes('unity') || s.settings.sekolah === 'Edu Zone') ? "EduZone" : s.settings.sekolah.replace(/Edu\s+Zone/gi, 'EduZone'),
          logoUrl: savedLogo,
          logoShape: s.settings.logoShape || savedLogoShape,
          logoFit: s.settings.logoFit || savedLogoFit,
        },
      }));
    }
    return DEFAULT_SUBJECTS;
  });

  const [activeSubjectId, setActiveSubjectId] = useState<string>(() => {
    return detectSubjectIdFromUrl(DEFAULT_SUBJECTS);
  });

  const [isSiswaOnly, setIsSiswaOnly] = useState<boolean>(detectStudentOnly);

  // Auto-verify and ensure 35 ANBK Literasi questions are present in Kelola Soal / Bank Soal
  useEffect(() => {
    setSubjects((prev) => {
      let updated = false;
      const newList = prev.map((s) => {
        const isLit = s.id === 'literasi-numerasi' || s.kode === 'ANBK' || s.nama.toLowerCase().includes('literasi');
        if (isLit && (!s.questions || s.questions.length < 35 || !s.questions.some((q) => q.id === 'anbk-lit-35'))) {
          updated = true;
          return { ...s, questions: ANBK_LITERASI_35_QUESTIONS };
        }
        return s;
      });
      if (updated) {
        try {
          localStorage.setItem('unity_subjects_v4', JSON.stringify(newList));
        } catch (e) {
          console.error(e);
        }
        return newList;
      }
      return prev;
    });
  }, []);

  // Sync state if URL changes (popstate or hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      setIsSiswaOnly(detectStudentOnly());
      const detectedId = detectSubjectIdFromUrl(subjects);
      if (detectedId && detectedId !== activeSubjectId) {
        setActiveSubjectId(detectedId);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [subjects, activeSubjectId]);

  const handleToggleSiswaOnly = (enable: boolean) => {
    setIsSiswaOnly(enable);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      if (enable) {
        url.searchParams.set('mode', 'siswa');
        url.hash = 'siswa';
      } else {
        url.searchParams.delete('mode');
        url.searchParams.delete('role');
        url.searchParams.delete('siswa');
        if (url.hash.includes('siswa')) {
          url.hash = '';
        }
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Active Subject Reference
  const activeSubject =
    subjects.find((s) => s.id === activeSubjectId) ||
    subjects[0] ||
    DEFAULT_SUBJECTS[0];

  const isLiterasiSubject =
    activeSubject.id === 'literasi-numerasi' ||
    activeSubject.kode === 'ANBK' ||
    activeSubject.nama?.toLowerCase().includes('literasi');

  const questions =
    activeSubject.questions && activeSubject.questions.length > 0
      ? activeSubject.questions
      : (isLiterasiSubject ? ANBK_LITERASI_35_QUESTIONS : (DEFAULT_QUESTIONS || []));
  const settings = activeSubject.settings || DEFAULT_SETTINGS;
  const results = activeSubject.results || [];

  // Subject Switcher Handler
  const handleSelectSubject = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    localStorage.setItem('unity_active_subject_id', subjectId);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('mapel', subjectId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Question, Settings, Results modifiers for the active subject
  const handleUpdateQuestions = (newQuestions: Question[]) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === activeSubjectId
          ? { ...s, questions: newQuestions, updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const handleUpdateSettings = (newSettings: ExamSettings) => {
    if (newSettings.logoUrl) {
      try {
        localStorage.setItem('unity_logo_v1', newSettings.logoUrl);
      } catch {}
    }
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === activeSubjectId
          ? {
              ...s,
              settings: newSettings,
              nama: newSettings.mapel || s.nama,
              updatedAt: new Date().toISOString(),
            }
          : {
              ...s,
              settings: {
                ...s.settings,
                logoUrl: newSettings.logoUrl || s.settings.logoUrl,
                sekolah: newSettings.sekolah || s.settings.sekolah,
              },
            }
      )
    );
    saveGlobalSchoolConfigToCloud({
      logoUrl: newSettings.logoUrl,
      sekolah: newSettings.sekolah,
      judul: newSettings.judul,
    });
  };

  const handleUpdateLogo = (newLogoUrl: string) => {
    try {
      localStorage.setItem('unity_logo_v1', newLogoUrl);
    } catch {}
    setSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        settings: {
          ...s.settings,
          logoUrl: newLogoUrl,
        },
        updatedAt: new Date().toISOString(),
      }))
    );
    saveGlobalSchoolConfigToCloud({
      logoUrl: newLogoUrl,
      sekolah: settings.sekolah,
      judul: settings.judul,
    });
  };

  const handleUpdateLogoShape = (newShape: LogoShape, newFit?: LogoFit) => {
    try {
      localStorage.setItem('unity_logo_shape_v1', newShape);
      if (newFit) localStorage.setItem('unity_logo_fit_v1', newFit);
    } catch {}
    setSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        settings: {
          ...s.settings,
          logoShape: newShape,
          logoFit: newFit !== undefined ? newFit : (s.settings.logoFit || 'contain'),
        },
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const handleUpdateResults = (newResults: ExamResult[]) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === activeSubjectId ? { ...s, results: newResults } : s))
    );
  };

  const getDeletedResultIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem('unity_deleted_result_ids');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  };

  const saveDeletedResultId = (id: string) => {
    try {
      const set = getDeletedResultIds();
      set.add(id);
      localStorage.setItem('unity_deleted_result_ids', JSON.stringify(Array.from(set)));
    } catch {}
  };

  const handleDeleteResult = async (resultId: string) => {
    saveDeletedResultId(resultId);

    // Update local state immediately
    setSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        results: (s.results || []).filter((r) => r.id !== resultId),
      }))
    );

    // Also remove from Firestore
    try {
      await deleteCloudResult(resultId);
    } catch (err) {
      console.warn('Gagal menghapus nilai dari Firestore:', err);
    }
  };

  const handleClearResults = async (targetSubjectId?: string) => {
    if (targetSubjectId === 'all') {
      subjects.forEach((s) => {
        (s.results || []).forEach((r) => {
          if (r.id) saveDeletedResultId(r.id);
        });
      });
      setSubjects((prev) => prev.map((s) => ({ ...s, results: [] })));
      try {
        await clearAllCloudResults();
      } catch (err) {
        console.warn('Gagal membersihkan data nilai di Firestore:', err);
      }
      return;
    }

    const subId = targetSubjectId || activeSubjectId;
    const targetSub = subjects.find((s) => s.id === subId);
    if (targetSub?.results) {
      targetSub.results.forEach((r) => {
        if (r.id) saveDeletedResultId(r.id);
      });
    }

    setSubjects((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, results: [] } : s))
    );

    try {
      await clearAllCloudResults(subId);
    } catch (err) {
      console.warn('Gagal membersihkan data nilai di Firestore:', err);
    }
  };

  const handleAddSubject = (newSubject: SubjectPackage) => {
    setSubjects((prev) => [...prev, newSubject]);
    handleSelectSubject(newSubject.id);
  };

  const handleUpdateSubject = (updated: SubjectPackage) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleUpdateAllSubjects = (newSubjects: SubjectPackage[]) => {
    setSubjects(newSubjects);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (subjects.length <= 1) {
      alert('Minimal harus ada 1 mata pelajaran.');
      return;
    }
    setSubjects((prev) => {
      const remaining = prev.filter((s) => s.id !== subjectId);
      if (activeSubjectId === subjectId && remaining.length > 0) {
        handleSelectSubject(remaining[0].id);
      }
      return remaining;
    });
  };

  // Navigation and Session States
  const [activeView, setActiveView] = useState<ActiveView>('portal');
  const [loginRole, setLoginRole] = useState<'siswa' | 'guru'>('siswa');
  const [currentSiswa, setCurrentSiswa] = useState({ nama: '', kelas: '' });
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [lastUserAnswers, setLastUserAnswers] = useState<Record<number, string | string[]>>({});

  // Anti-Cheat State
  const [antiCheatViolations, setAntiCheatViolations] = useState(0);
  const [showAntiCheatOverlay, setShowAntiCheatOverlay] = useState(false);
  const [antiCheatCountdown, setAntiCheatCountdown] = useState(10);
  const antiCheatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeViewRef = useRef(activeView);
  activeViewRef.current = activeView;
  const examMountTimeRef = useRef<number>(0);
  const blurDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Persist subjects data to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem('unity_subjects_v4', JSON.stringify(subjects));
      // Also sync legacy keys for backwards safety
      localStorage.setItem('unity_questions_v3', JSON.stringify(questions));
      localStorage.setItem('unity_settings_v3', JSON.stringify(settings));
      localStorage.setItem('unity_results_v3', JSON.stringify(results));
      if (settings.logoUrl) {
        localStorage.setItem('unity_logo_v1', settings.logoUrl);
      }
    } catch (err) {
      console.warn('Penyimpanan lokal penuh, mencoba simpan pengaturan esensial:', err);
      try {
        localStorage.setItem('unity_settings_v3', JSON.stringify(settings));
        if (settings.logoUrl) {
          localStorage.setItem('unity_logo_v1', settings.logoUrl);
        }
      } catch (innerErr) {
        console.error('Gagal menulis ke localStorage:', innerErr);
      }
    }
  }, [subjects, questions, settings, results]);

  // Migrasi otomatis jika masih ada cache judul/sekolah lama atau logoFit cover yang terpotong
  useEffect(() => {
    try {
      if (localStorage.getItem('unity_logo_fit_v1') === 'cover') {
        localStorage.setItem('unity_logo_fit_v1', 'contain');
      }
    } catch {}
    setSubjects((prev) => {
      let changed = false;
      const updated = prev.map((s) => {
        const isUnityJudul = !s.settings?.judul || s.settings.judul.toLowerCase().includes('unity') || s.settings.judul.includes('Edu Zone') || s.settings.judul.toLowerCase().includes('candy');
        const isUnitySekolah = !s.settings?.sekolah || s.settings.sekolah.toLowerCase().includes('unity') || s.settings.sekolah === 'Edu Zone' || s.settings.sekolah.includes('Edu Zone');
        const isCoverFit = s.settings?.logoFit === 'cover';
        if (isUnityJudul || isUnitySekolah || isCoverFit) {
          changed = true;
          return {
            ...s,
            settings: {
              ...s.settings,
              judul: isUnityJudul ? 'EduZone CBT' : s.settings.judul.replace(/Edu\s+Zone/gi, 'EduZone').replace(/Candy\s+CBT/gi, 'EduZone CBT'),
              sekolah: isUnitySekolah ? 'EduZone' : s.settings.sekolah.replace(/Edu\s+Zone/gi, 'EduZone'),
              logoFit: isCoverFit ? 'contain' : (s.settings.logoFit || 'contain'),
            },
          };
        }
        return s;
      });
      if (changed) {
        try {
          localStorage.setItem('unity_subjects_v4', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  }, []);

  // Real-time Cloud sync dengan Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCloudResults((cloudResults) => {
      const deletedIds = getDeletedResultIds();
      const validCloudResults = (cloudResults || []).filter((cr) => !deletedIds.has(cr.id));

      setSubjects((prevSubjects) => {
        return prevSubjects.map((sub) => {
          const matchingCloud = validCloudResults.filter(
            (cr) => cr.mapelId === sub.id || (!cr.mapelId && sub.id === prevSubjects[0]?.id)
          );

          // Local-only results (simulation/offline) that have not been deleted
          const cloudIds = new Set(matchingCloud.map((r) => r.id));
          const localOnly = (sub.results || []).filter(
            (r) => !cloudIds.has(r.id) && !deletedIds.has(r.id)
          );

          return {
            ...sub,
            results: [...matchingCloud, ...localOnly],
          };
        });
      });
    });

    return () => unsubscribe();
  }, []);

  // Real-time Cloud sync untuk Logo Sekolah & Profil dengan Firestore
  useEffect(() => {
    // Jika di browser ini sudah pernah tersimpan logo, broadcast ke cloud agar perangkat siswa langsung memilikinya
    try {
      const existingLogo = localStorage.getItem('unity_logo_v1');
      if (existingLogo && existingLogo.length > 50) {
        saveGlobalSchoolConfigToCloud({ logoUrl: existingLogo, sekolah: settings.sekolah, judul: settings.judul });
      }
    } catch {}

    const unsubscribe = subscribeToGlobalSchoolConfig((config) => {
      if (config.logoUrl) {
        try {
          localStorage.setItem('unity_logo_v1', config.logoUrl);
        } catch {}

        setSubjects((prev) =>
          prev.map((s) => ({
            ...s,
            settings: {
              ...s.settings,
              logoUrl: config.logoUrl || s.settings.logoUrl,
              sekolah: config.sekolah || s.settings.sekolah,
            },
          }))
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Anti-Cheat: blur & visibility detection with grace period and focus debounce
  useEffect(() => {
    const isExempt = () => {
      if (activeViewRef.current !== 'exam') return true;
      // 8-second startup grace period for camera authorization, DOM mount, fullscreen setup
      if (Date.now() - examMountTimeRef.current < 8000) return true;
      return false;
    };

    const triggerOverlayWarning = () => {
      if (isExempt()) return;
      // If strict auto-termination is enabled, ExamView handles proctoring and immediate auto-termination
      if (settings.akhiriOtomatisJikaCurang !== false) return;

      setAntiCheatViolations((prev) => prev + 1);
      setShowAntiCheatOverlay(true);
      setAntiCheatCountdown(10);

      if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
      antiCheatTimerRef.current = setInterval(() => {
        setAntiCheatCountdown((prev) => {
          if (prev <= 1) {
            if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
            setShowAntiCheatOverlay(false);
            // Force finish exam on countdown expiration
            handleFinishExam({}, antiCheatViolations + 1, true, 'Waktu Peringatan Pelanggaran Pindah Tab Habis');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleBlur = () => {
      if (isExempt()) return;
      if (blurDebounceTimerRef.current) clearTimeout(blurDebounceTimerRef.current);

      if (document.hidden) {
        triggerOverlayWarning();
        return;
      }

      // Debounce transient blurs (e.g. browser chrome clicks, system notifications)
      blurDebounceTimerRef.current = setTimeout(() => {
        if (!isExempt() && !document.hasFocus()) {
          triggerOverlayWarning();
        }
      }, 2500);
    };

    const handleFocus = () => {
      if (blurDebounceTimerRef.current) {
        clearTimeout(blurDebounceTimerRef.current);
        blurDebounceTimerRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (isExempt()) return;
      if (document.hidden) {
        triggerOverlayWarning();
      } else if (!document.hidden && blurDebounceTimerRef.current) {
        clearTimeout(blurDebounceTimerRef.current);
        blurDebounceTimerRef.current = null;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (activeViewRef.current === 'exam') {
        e.preventDefault();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      if (blurDebounceTimerRef.current) clearTimeout(blurDebounceTimerRef.current);
      if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
    };
  }, [antiCheatViolations, settings.akhiriOtomatisJikaCurang]);

  const handleDismissAntiCheat = () => {
    if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
    setShowAntiCheatOverlay(false);
  };

  // Role selection from Portal
  const handleSelectRole = (role: 'siswa' | 'guru') => {
    if (isSiswaOnly && role === 'guru') return;
    setLoginRole(role);
    setActiveView('login');
  };

  // Student Login Success
  const handleLoginSiswa = (nama: string, kelas: string) => {
    examMountTimeRef.current = Date.now();
    setCurrentSiswa({ nama, kelas });
    setAntiCheatViolations(0);
    setActiveView('exam');
  };

  // Teacher Login Success
  const handleLoginGuru = () => {
    setActiveView('guru');
  };

  // Exam Finish Calculation
  const handleFinishExam = (
    userAnswers: Record<number, string | string[]>,
    violations: number,
    isAutoTerminated: boolean = false,
    autoTerminationReason: string = '',
    proctoringPhotos: string[] = []
  ) => {
    setLastUserAnswers(userAnswers);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      if (!userAns) return;

      if (q.tipe === 'PGK') {
        const correctArr = Array.isArray(q.answer)
          ? q.answer
          : q.answer.split(',').map((s) => s.trim());
        if (Array.isArray(userAns)) {
          const s1 = [...userAns].sort().join(',');
          const s2 = [...correctArr].sort().join(',');
          if (s1 === s2) correctCount++;
        }
      } else if (q.tipe === 'ISIAN') {
        const accepted = Array.isArray(q.answer)
          ? q.answer.map((a) => a.trim().toLowerCase())
          : String(q.answer).split(/[,;/|]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
        const u = String(userAns).trim().toLowerCase();
        if (accepted.length > 0 ? accepted.includes(u) : u === String(q.answer).trim().toLowerCase()) {
          correctCount++;
        }
      } else if (q.tipe === 'URAIAN') {
        // For essay questions, count as correct/submitted if answer has substance (> 3 chars)
        if (String(userAns).trim().length > 3) {
          correctCount++;
        }
      } else {
        if (String(userAns).trim().toLowerCase() === String(q.answer).trim().toLowerCase()) {
          correctCount++;
        }
      }
    });

    const score = Math.round((correctCount / (questions.length || 1)) * 100);
    const newResult: ExamResult = {
      id: `res-${Date.now()}`,
      nama: currentSiswa.nama || 'Peserta Ujian',
      kelas: currentSiswa.kelas || '5',
      nilai: score,
      benar: correctCount,
      totalSoal: questions.length,
      selesaiPada: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      pelanggaran: violations,
      mapelId: activeSubjectId,
      mapelNama: activeSubject?.nama || settings.mapel,
      answers: userAnswers,
      isAutoTerminated,
      autoTerminationReason,
      proctoringPhotos,
    };

    setLastResult(newResult);

    // Prepend result to current active subject's results locally
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === activeSubjectId ? { ...s, results: [newResult, ...(s.results || [])] } : s
      )
    );

    // Kirim otomatis ke cloud database Firebase Firestore secara live!
    submitExamResultToCloud(newResult, {
      mapelId: activeSubjectId,
      mapelNama: activeSubject?.nama || settings.mapel,
      nisn: currentSiswa.nama,
    }).catch((err) => {
      console.warn('Gagal sync ke cloud:', err);
    });

    setLastResult(newResult);
    setActiveView('result');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* 1. Portal View */}
      {activeView === 'portal' && (
        <PortalView
          subjects={subjects}
          activeSubjectId={activeSubjectId}
          onSelectSubject={handleSelectSubject}
          settings={settings}
          activeSubject={activeSubject}
          totalQuestions={questions.length}
          onSelectRole={handleSelectRole}
          isSiswaOnly={isSiswaOnly}
          onToggleSiswaOnly={handleToggleSiswaOnly}
          onUpdateLogo={handleUpdateLogo}
          onUpdateLogoShape={handleUpdateLogoShape}
        />
      )}

      {/* 2. Login View */}
      {activeView === 'login' && (
        <LoginModal
          role={loginRole}
          settings={settings}
          onBack={() => setActiveView('portal')}
          onLoginSiswa={handleLoginSiswa}
          onLoginGuru={handleLoginGuru}
        />
      )}

      {/* 3. Exam View */}
      {activeView === 'exam' && (
        <ExamView
          questions={questions}
          settings={settings}
          siswaNama={currentSiswa.nama}
          siswaKelas={currentSiswa.kelas}
          onFinishExam={(answers, viols, isAutoTerm, reason, photos) =>
            handleFinishExam(answers, viols, isAutoTerm, reason, photos)
          }
          violations={antiCheatViolations}
        />
      )}

      {/* 4. Result View */}
      {activeView === 'result' && lastResult && (
        <ResultView
          result={lastResult}
          questions={questions}
          userAnswers={lastUserAnswers}
          settings={settings}
          onReturnToPortal={() => setActiveView('portal')}
        />
      )}

      {/* 5. Teacher Panel */}
      {activeView === 'guru' && (
        <TeacherPanel
          subjects={subjects}
          activeSubjectId={activeSubjectId}
          onSelectSubject={handleSelectSubject}
          onAddSubject={handleAddSubject}
          onUpdateSubject={handleUpdateSubject}
          onUpdateAllSubjects={handleUpdateAllSubjects}
          onDeleteSubject={handleDeleteSubject}
          questions={questions}
          settings={settings}
          results={results}
          onUpdateQuestions={handleUpdateQuestions}
          onUpdateSettings={handleUpdateSettings}
          onClearResults={handleClearResults}
          onDeleteResult={handleDeleteResult}
          onUpdateResults={handleUpdateResults}
          onExit={() => setActiveView('portal')}
        />
      )}

      {/* Anti-Cheat Warning Modal */}
      {showAntiCheatOverlay && activeView === 'exam' && (
        <AntiCheatOverlay
          countdown={antiCheatCountdown}
          violationCount={antiCheatViolations}
          onDismiss={handleDismissAntiCheat}
        />
      )}
    </div>
  );
}
