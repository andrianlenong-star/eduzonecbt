import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ExamResult } from '../types';

// Initialize Firebase App singleton
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the provisioned Firestore database instance
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

const RESULTS_COLLECTION = 'exam_results';

/**
 * Kirim hasil ujian siswa ke Firebase Firestore secara realtime
 */
export async function submitExamResultToCloud(
  result: ExamResult,
  extra?: { mapelId?: string; mapelNama?: string; nisn?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const docId = result.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const docRef = doc(db, RESULTS_COLLECTION, docId);

    const payload = {
      id: docId,
      nama: result.nama || 'Siswa',
      kelas: result.kelas || '-',
      nilai: Number(result.nilai) || 0,
      benar: Number(result.benar) || 0,
      totalSoal: Number(result.totalSoal) || 0,
      selesaiPada: result.selesaiPada || new Date().toLocaleString('id-ID'),
      pelanggaran: Number(result.pelanggaran) || 0,
      mapelId: extra?.mapelId || result.mapelId || 'literasi-numerasi',
      mapelNama: extra?.mapelNama || result.mapelNama || '',
      nisn: extra?.nisn || result.nisn || '',
      answers: result.answers || {},
      createdAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Gagal mengirim nilai ke Firebase Firestore:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Berlangganan (realtime listener) data nilai ujian siswa di Firestore
 * Setiap kali siswa selesai ujian di perangkat mana pun, callback onUpdate akan langsung dipanggil!
 */
export function subscribeToCloudResults(
  onUpdate: (results: ExamResult[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, RESULTS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ExamResult[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            nama: data.nama || 'Siswa',
            kelas: data.kelas || '-',
            nilai: Number(data.nilai) || 0,
            benar: Number(data.benar) || 0,
            totalSoal: Number(data.totalSoal) || 0,
            selesaiPada: data.selesaiPada || '-',
            pelanggaran: Number(data.pelanggaran) || 0,
            mapelId: data.mapelId,
            mapelNama: data.mapelNama,
            nisn: data.nisn,
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore subscription error (mungkin offline atau izin):', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Gagal membuat realtime subscription Firestore:', err);
    return () => {};
  }
}

/**
 * Hapus satu data nilai dari cloud
 */
export async function deleteCloudResult(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, RESULTS_COLLECTION, id));
    return true;
  } catch (err) {
    console.error('Gagal menghapus nilai dari Firestore:', err);
    return false;
  }
}

/**
 * Hapus seluruh data nilai dari cloud (atau untuk mapel tertentu)
 */
export async function clearAllCloudResults(mapelId?: string): Promise<boolean> {
  try {
    const colRef = collection(db, RESULTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) return true;

    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!mapelId || data.mapelId === mapelId) {
        batch.delete(docSnap.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error('Gagal membersihkan seluruh nilai di Firestore:', err);
    return false;
  }
}

const CONFIG_COLLECTION = 'app_config';
const GLOBAL_CONFIG_DOC = 'global_settings';

/**
 * Simpan logo dan pengaturan sekolah ke cloud Firestore agar siswa di perangkat apa pun otomatis melihat logo yang sama
 */
export async function saveGlobalSchoolConfigToCloud(config: {
  logoUrl?: string;
  sekolah?: string;
  judul?: string;
}): Promise<boolean> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, GLOBAL_CONFIG_DOC);
    await setDoc(
      docRef,
      {
        ...config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Gagal menyimpan logo/konfigurasi ke cloud:', err);
    return false;
  }
}

/**
 * Berlangganan perubahan logo dan pengaturan sekolah secara realtime dari Firestore
 */
export function subscribeToGlobalSchoolConfig(
  onUpdate: (config: { logoUrl?: string; sekolah?: string; judul?: string }) => void
): () => void {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, GLOBAL_CONFIG_DOC);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onUpdate({
            logoUrl: data.logoUrl,
            sekolah: data.sekolah,
            judul: data.judul,
          });
        }
      },
      (error) => {
        console.warn('Gagal membaca konfigurasi cloud:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Error saat subscribe konfigurasi:', err);
    return () => {};
  }
}

