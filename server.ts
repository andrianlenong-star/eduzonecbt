import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateFallbackQuestions(
  mapel: string,
  jenjang: string,
  topik: string | string[],
  jumlah: number,
  tipeSoal: string,
  tingkatKesulitan: string,
  stimulusText?: string
) {
  const result: any[] = [];
  const typesPool =
    tipeSoal === 'CAMPURAN'
      ? ['PG', 'PGK', 'BS', 'ISIAN', 'URAIAN']
      : [tipeSoal];

  const cleanMapel = mapel || 'Mata Pelajaran';
  const rawTopik = Array.isArray(topik) ? topik.join(', ') : (topik || 'Konsep Dasar');
  const topicsList = rawTopik
    .split(/[,;\n]+/)
    .map((t: string) => t.trim())
    .filter(Boolean);
  const activeTopics = topicsList.length > 0 ? topicsList : ['Konsep Dasar'];

  const hasStimulus = stimulusText && stimulusText.trim().length > 10;
  const stimulusPrefix = hasStimulus
    ? `[Berdasarkan Wacana: "${stimulusText!.trim().slice(0, 80)}..."]\n\n`
    : '';

  const pgTemplates = [
    {
      q: (t: string, m: string, j: string) =>
        `Manakah pernyataan yang paling tepat menggambarkan karakteristik utama dari "${t}" pada materi ${m} (${j})?`,
      opts: (t: string) => [
        `Memahami prinsip dasar serta fungsi terapan dari ${t} secara komprehensif`,
        `Hanya menghafalkan rumus tanpa memahami hubungan sebab-akibat`,
        `Mengabaikan keterkaitan antara pengamatan fakta dan kesimpulan`,
        `Membatasi penalaran pada satu sudut pandang tanpa verifikasi data`,
      ],
      ans: 'A',
      exp: (t: string) =>
        `Pilihan A tepat karena mencakup pemahaman prinsip dan aplikasi nyata materi ${t}.`,
    },
    {
      q: (t: string, m: string, j: string) =>
        `Dalam situasi nyata di lingkungan sekolah atau masyarakat, penerapan konsep "${t}" paling tepat dicontohkan oleh kegiatan...`,
      opts: (t: string) => [
        `Memanfaatkan prinsip ${t} untuk mengatasi hambatan kegiatan bersama secara efektif`,
        `Menghindari keterlibatan dalam perencanaan maupun evaluasi kelompok`,
        `Menyelesaikan persoalan secara tergesa-gesa tanpa memperhatikan pedoman`,
        `Mengambil keputusan berdasarkan dugaan tanpa rujukan data yang valid`,
      ],
      ans: 'A',
      exp: (t: string) =>
        `Pilihan A merupakan wujud penerapan kontekstual dari ${t} dalam kehidupan sehari-hari.`,
    },
    {
      q: (t: string, m: string, _j: string) =>
        `Seorang siswa melakukan penyelidikan terkait fenomena "${t}". Langkah pertama yang paling kritis dan sistematis untuk dilakukan adalah...`,
      opts: (t: string) => [
        `Mengidentifikasi masalah dan merumuskan pertanyaan penyelidikan tentang ${t}`,
        `Langsung menarik simpulan tanpa mengumpulkan data pendukung`,
        `Menyalin hasil temuan orang lain tanpa melakukan uji kebenaran`,
        `Mengubah data agar sesuai dengan dugaan awal sebelum diuji`,
      ],
      ans: 'A',
      exp: (_t: string) =>
        `Langkah awal metode ilmiah yang benar adalah identifikasi masalah dan perumusan pertanyaan.`,
    },
  ];

  for (let i = 0; i < jumlah; i++) {
    const qType = typesPool[i % typesPool.length];
    const cleanTopik = activeTopics[i % activeTopics.length];
    const isHots =
      tingkatKesulitan === 'HOTS'
        ? true
        : tingkatKesulitan === 'REGULER'
        ? false
        : i % 2 === 1;

    const diff = isHots ? 'HOTS' : 'REGULER';
    const id = `q-ai-fallback-${Date.now()}-${i + 1}-${Math.floor(100 + Math.random() * 900)}`;

    if (qType === 'PG') {
      const tmpl = pgTemplates[i % pgTemplates.length];
      result.push({
        id,
        tipe: 'PG',
        difficulty: diff,
        content: `${stimulusPrefix}${tmpl.q(cleanTopik, cleanMapel, jenjang)}`,
        image: null,
        options: tmpl.opts(cleanTopik),
        answer: tmpl.ans,
        explanation: tmpl.exp(cleanTopik),
      });
    } else if (qType === 'PGK') {
      result.push({
        id,
        tipe: 'PGK',
        difficulty: 'HOTS',
        content: `${stimulusPrefix}Perhatikan kajian tentang materi "${cleanTopik}". Pilihlah DUA pernyataan yang benar dan logis dalam menganalisis fenomena tersebut!`,
        image: null,
        options: [
          `Pemahaman mendalam mengenai kaidah ${cleanTopik} mempermudah pemecahan masalah terapan`,
          `Data yang dikumpulkan harus diuji keabsahan dan konsistensinya sebelum ditarik simpulan`,
          `Hasil analisis tidak memerlukan verifikasi atau pembandingan dengan teori yang relevan`,
          `Setiap simpulan dapat dibuat tanpa memerlukan bukti konkret atau pengamatan terukur`,
        ],
        answer: ['A', 'B'],
        explanation: `Pernyataan A dan B adalah dua kaidah ilmiah yang benar dalam mendalami materi ${cleanTopik}.`,
      });
    } else if (qType === 'BS') {
      const isTrue = i % 2 === 0;
      result.push({
        id,
        tipe: 'BS',
        difficulty: diff,
        content: isTrue
          ? `${stimulusPrefix}Dalam konsep materi "${cleanTopik}" (${cleanMapel}), penerapan prosedur ilmiah yang sistematis akan menghasilkan solusi yang valid dan dapat dipertanggungjawabkan.`
          : `${stimulusPrefix}Pada materi "${cleanTopik}", seluruh permasalahan dapat diselesaikan dengan mengabaikan data empiris dan fakta objektif.`,
        image: null,
        options: ['Benar', 'Salah'],
        answer: isTrue ? 'Benar' : 'Salah',
        explanation: isTrue
          ? `Pernyataan bernilai BENAR karena metode ilmiah yang sistematis merupakan fondasi materi ${cleanTopik}.`
          : `Pernyataan bernilai SALAH karena setiap analisis ilmiah wajib berlandaskan data dan fakta objektif.`,
      });
    } else if (qType === 'ISIAN') {
      result.push({
        id,
        tipe: 'ISIAN',
        difficulty: diff,
        content: `${stimulusPrefix}Sebutkan istilah ilmiah atau kata kunci utama yang mendasari proses pada pembelajaran materi "${cleanTopik}"!`,
        image: null,
        options: [],
        answer: cleanTopik.toLowerCase().split(' ')[0] || 'konsep dasar',
        explanation: `Kata kunci utama yang dicari berkaitan langsung dengan materi pokok ${cleanTopik}.`,
      });
    } else {
      // URAIAN
      result.push({
        id,
        tipe: 'URAIAN',
        difficulty: 'HOTS',
        content: `${stimulusPrefix}Jelaskan secara komprehensif bagaimana prinsip "${cleanTopik}" dapat diterapkan untuk menyelesaikan permasalahan nyata pada lingkungan sekitar peserta didik (${jenjang})!`,
        image: null,
        options: [],
        answer: `Rubrik Jawaban: 1. Penjelasan definisi dan konsep dasar (Bobot 30%); 2. Identifikasi masalah kontekstual yang relevan (Bobot 35%); 3. Langkah-langkah penyelesaian terstruktur dan simpulan logis (Bobot 35%).`,
        explanation: `Siswa diharapkan mampu menguraikan konsep, menyajikan contoh nyata, dan merumuskan solusi berbasis materi ${cleanTopik}.`,
      });
    }
  }

  return result;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Status & Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // AI Question Generator Endpoint
  app.post('/api/ai/generate-questions', async (req, res) => {
    const {
      mapel = 'Matematika',
      jenjangKelas = 'Kelas 5 SD',
      topik = 'Umum',
      jumlah = 5,
      tipeSoal = 'CAMPURAN',
      tingkatKesulitan = 'CAMPURAN',
      stimulusText = '',
      instruksiTambahan = '',
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Generating curriculum-aligned fallback questions.');
      const fallbackQuestions = generateFallbackQuestions(
        mapel,
        jenjangKelas,
        topik,
        Number(jumlah) || 5,
        tipeSoal,
        tingkatKesulitan,
        stimulusText
      );
      return res.json({
        success: true,
        isFallback: true,
        message: 'Kunci API Gemini belum diatur di secrets. Sistem menampilkan contoh butir soal kurikulum bermutu tinggi.',
        questions: fallbackQuestions,
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `Anda adalah pakar pendidik dan pembuat soal asesmen standar pendidikan nasional (Kurikulum Merdeka / CBT / ANBK) di Indonesia.
Tugas Anda adalah merumuskan butir-butir soal ujian yang bermutu tinggi, faktual, mendidik, memiliki kunci jawaban yang valid, dengan bahasa Indonesia baku yang sesuai dengan tingkat kognitif dan usia peserta didik.

Aturan Pembuatan Soal Berdasarkan Tipe:
1. 'PG' (Pilihan Ganda Tunggal):
   - options HARUS berisi tepat 4 pilihan (A, B, C, D) yang jelas, masuk akal, dan tidak ambigu.
   - answer HARUS berupa SATU huruf kapital: 'A', 'B', 'C', atau 'D'.
2. 'PGK' (Pilihan Ganda Kompleks):
   - options HARUS berisi tepat 4 pilihan (A, B, C, D).
   - Jawaban benar LEBIH DARI SATU (misalnya 2 atau 3 pilihan benar).
   - Sertakan petunjuk jelas di dalam teks soal, misalnya: "(Pilihlah DUA jawaban yang benar!)".
   - answer HARUS berupa huruf-huruf kapital dipisahkan koma, contoh: 'A, C' atau 'B, D'.
3. 'BS' (Benar - Salah):
   - options HARUS tepat: ["Benar", "Salah"].
   - answer HARUS salah satu dari kata "Benar" atau "Salah".
4. 'ISIAN' (Isian Singkat):
   - options HARUS array kosong [].
   - answer HARUS berupa kata/frasa kunci singkat (1-3 kata) yang pasti.
5. 'URAIAN' (Uraian / Essay):
   - options HARUS array kosong [].
   - answer HARUS berisi rubrik jawaban lengkap dan poin-poin penjelasan penting.

Aturan Tingkat Kesulitan:
- 'REGULER': Menguji pemahaman konsep, pengetahuan dasar, atau aplikasi langsung (C1-C3).
- 'HOTS' (Higher Order Thinking Skills): Menguji kemampuan analisis, evaluasi, penalaran kritis, pemecahan masalah konteks nyata, atau interpretasi data/kasus (C4-C6).

Pastikan kunci jawaban 100% akurat. Sertakan pembahasan singkat yang mendidik di kolom explanation.`;

      const rawTopikStr = Array.isArray(topik) ? topik.join(', ') : (topik || 'Umum');
      const isMultiTopic = rawTopikStr.includes(',');

      let userPrompt = `Buatlah tepat ${jumlah || 5} butir soal asesmen dengan spesifikasi berikut:
- Mata Pelajaran: ${mapel}
- Jenjang / Kelas: ${jenjangKelas}
- Topik / Pokok Bahasan Materi: ${rawTopikStr} ${
        isMultiTopic
          ? '(PENTING: Sebarkan butir-butir soal secara merata mencakup seluruh topik pokok bahasan yang dipilih di atas)'
          : ''
      }
- Tipe Soal yang Diminta: ${tipeSoal} ${
        tipeSoal === 'CAMPURAN'
          ? '(Kombinasikan beragam tipe: PG, PGK, BS, ISIAN, dan URAIAN)'
          : `(Semua soal bertipe ${tipeSoal})`
      }
- Tingkat Kesulitan: ${tingkatKesulitan} ${
        tingkatKesulitan === 'CAMPURAN'
          ? '(Proporsional seimbang antara REGULER dan HOTS)'
          : `(Tingkat kesulitan ${tingkatKesulitan})`
      }`;

      if (stimulusText && stimulusText.trim()) {
        userPrompt += `\n\nTEKS STIMULUS / BACAAN / WACANA (Wajib menjadi rujukan utama seluruh butir pertanyaan):\n"""\n${stimulusText.trim()}\n"""\nBuat soal-soal di atas berdasarkan stimulus/bacaan ini.`;
      }

      if (instruksiTambahan && instruksiTambahan.trim()) {
        userPrompt += `\n\nINSTRUKSI KHUSUS DARI GURU:\n${instruksiTambahan.trim()}`;
      }

      const genConfig = {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'Daftar butir soal asesmen yang digenerate',
          items: {
            type: Type.OBJECT,
            properties: {
              tipe: {
                type: Type.STRING,
                description: "Tipe soal: 'PG', 'PGK', 'BS', 'ISIAN', atau 'URAIAN'",
              },
              difficulty: {
                type: Type.STRING,
                description: "Tingkat kesulitan: 'REGULER' atau 'HOTS'",
              },
              content: {
                type: Type.STRING,
                description: 'Teks stimulus/cerita wacana (jika ada) dan pertanyaan soal',
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "Daftar opsi pilihan jawaban. 4 opsi untuk PG dan PGK, ['Benar', 'Salah'] untuk BS, kosong [] untuk ISIAN dan URAIAN.",
              },
              answer: {
                type: Type.STRING,
                description:
                  "Kunci jawaban: huruf tunggal 'A'/'B'/'C'/'D' untuk PG, daftar huruf 'A, C' untuk PGK, 'Benar'/'Salah' untuk BS, kata kunci untuk ISIAN, rubrik untuk URAIAN.",
              },
              explanation: {
                type: Type.STRING,
                description: 'Pembahasan ringkas kunci jawaban',
              },
            },
            required: ['tipe', 'difficulty', 'content', 'options', 'answer'],
          },
        },
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: genConfig,
        });
      } catch (firstErr: any) {
        console.warn('First Gemini attempt failed, retrying after 1.5s...', firstErr?.message);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: genConfig,
        });
      }

      const text = response.text || '[]';
      let rawList: any[] = [];
      try {
        rawList = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON response:', parseErr, text);
        throw new Error('Format respon AI tidak valid.');
      }

      if (!Array.isArray(rawList) || rawList.length === 0) {
        throw new Error('AI tidak menghasilkan butir soal.');
      }

      const formattedQuestions = rawList.map((item, idx) => {
        let tipe = (item.tipe || 'PG').toUpperCase();
        if (!['PG', 'PGK', 'BS', 'ISIAN', 'URAIAN'].includes(tipe)) {
          tipe = 'PG';
        }

        const difficulty = item.difficulty?.toUpperCase() === 'HOTS' ? 'HOTS' : 'REGULER';
        let options: string[] = Array.isArray(item.options) ? item.options : [];

        let answer: string | string[] = item.answer || 'A';

        if (tipe === 'BS') {
          options = ['Benar', 'Salah'];
          const ansStr = String(answer).toLowerCase();
          answer = ansStr.includes('benar') || ansStr === 'true' || ansStr === 'b' ? 'Benar' : 'Salah';
        } else if (tipe === 'ISIAN' || tipe === 'URAIAN') {
          options = [];
          answer = String(answer).trim();
        } else if (tipe === 'PGK') {
          if (Array.isArray(answer)) {
            answer = answer.map((a) => String(a).trim().toUpperCase());
          } else if (typeof answer === 'string') {
            const matches = answer.toUpperCase().match(/[A-E]/g);
            answer = matches && matches.length > 0 ? Array.from(new Set(matches)) : ['A', 'B'];
          } else {
            answer = ['A', 'B'];
          }
          if (options.length < 4) {
            const letters = ['A', 'B', 'C', 'D'];
            while (options.length < 4) {
              options.push(`Pilihan ${letters[options.length]}`);
            }
          }
        } else {
          // PG
          if (options.length < 4) {
            const letters = ['A', 'B', 'C', 'D'];
            while (options.length < 4) {
              options.push(`Pilihan ${letters[options.length]}`);
            }
          }
          if (typeof answer === 'string') {
            const match = answer.toUpperCase().match(/[A-D]/);
            answer = match ? match[0] : 'A';
          } else {
            answer = 'A';
          }
        }

        return {
          id: `q-ai-${Date.now()}-${idx + 1}-${Math.floor(100 + Math.random() * 900)}`,
          tipe,
          difficulty,
          content: item.content || `Pertanyaan ${idx + 1}`,
          image: null,
          options,
          answer,
          explanation: item.explanation || '',
        };
      });

      return res.json({
        success: true,
        questions: formattedQuestions,
        message: `Berhasil menghasilkan ${formattedQuestions.length} butir soal dengan Google Gemini AI.`,
      });
    } catch (apiError: any) {
      console.error('Error generating questions with Gemini:', apiError);
      const fallbackQuestions = generateFallbackQuestions(
        mapel,
        jenjangKelas,
        topik,
        Number(jumlah) || 5,
        tipeSoal,
        tingkatKesulitan,
        stimulusText
      );
      return res.json({
        success: true,
        isFallback: true,
        warning: apiError?.message || 'Terjadi kendala saat menghubungi AI',
        message: 'Menghasilkan butir soal kurikulum alternatif karena kendala koneksi AI.',
        questions: fallbackQuestions,
      });
    }
  });

  // Serve static files in production or mount Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
