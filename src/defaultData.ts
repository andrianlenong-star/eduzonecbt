import { Question, ExamSettings, SubjectPackage } from './types';
import { ANBK_LITERASI_35_QUESTIONS } from './anbkLiterasiData';

export const DEFAULT_SETTINGS: ExamSettings = {
  judul: "Asesmen Unity School",
  mapel: "Literasi (ANBK) Bahasa Indonesia",
  sekolah: "SD UNITY INTERNASIONAL",
  logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
  tahunAjaran: "2025/2026",
  durasiMenit: 75,
  token: "ANBK2026",
  adminPass: "112233",
  acakSoal: false,
  tampilkanNilai: true
};

export const DEFAULT_QUESTIONS: Question[] = ANBK_LITERASI_35_QUESTIONS;

export const DEFAULT_SUBJECTS: SubjectPackage[] = [
  {
    id: "literasi-numerasi",
    kode: "ANBK",
    nama: "Literasi (ANBK) Bahasa Indonesia",
    guruPengampu: "Tim Asesmen & Literasi ANBK",
    kelas: "Kelas 6 SD",
    passwordBankSoal: "guru123",
    color: "blue",
    deskripsi: "Asesmen Unity School dengan 35 butir soal standar kurikulum nasional.",
    settings: {
      judul: "Asesmen Unity School",
      mapel: "Literasi (ANBK) Bahasa Indonesia",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 75,
      token: "ANBK2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: DEFAULT_QUESTIONS,
    results: []
  },
  {
    id: "matematika",
    kode: "MTK",
    nama: "Matematika",
    guruPengampu: "Pak Budi Santoso, M.Pd",
    kelas: "Kelas 5 & 6",
    color: "emerald",
    deskripsi: "Penilaian Sumatif Matematika: Operasi Bilangan, Pecahan, Pengukuran, dan Bangun Ruang.",
    settings: {
      judul: "Penilaian Sumatif Akhir Semester Matematika",
      mapel: "Matematika",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 75,
      token: "MTK2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "mtk-1",
        tipe: "PG",
        content: "Hasil dari 3/4 + 1/2 - 2/5 dalam bentuk pecahan desimal paling sederhana adalah...",
        image: null,
        options: ["0.65", "0.85", "0.95", "1.15"],
        answer: "B",
        difficulty: "REGULER"
      },
      {
        id: "mtk-2",
        tipe: "PG",
        content: "Sebuah bak penampungan air berbentuk kubus dengan panjang rusuk bagian dalam 80 cm. Jika bak tersebut sudah terisi air 3/4 bagian, berapa liter air yang dibutuhkan agar bak terisi penuh?",
        image: null,
        options: ["128 liter", "256 liter", "384 liter", "512 liter"],
        answer: "A",
        difficulty: "HOTS"
      },
      {
        id: "mtk-3",
        tipe: "PGK",
        content: "Pilihlah DUA atau LEBIH sifat-sifat bangun datar jajargenjang yang BENAR di bawah ini!",
        image: null,
        options: [
          "Sisi-sisi yang berhadapan sejajar dan sama panjang",
          "Sudut-sudut yang berhadapan sama besar",
          "Kedua diagonalnya selalu berpotongan tegak lurus membentuk sudut 90 derajat",
          "Jumlah dua sudut yang berdekatan adalah 180 derajat"
        ],
        answer: ["A", "B", "D"],
        difficulty: "HOTS"
      },
      {
        id: "mtk-4",
        tipe: "BS",
        content: "Pernyataan: Bilangan prima genap satu-satunya di dunia adalah angka 2.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "mtk-5",
        tipe: "ISIAN",
        content: "Sebuah denah rumah digambar dengan skala 1 : 200. Jika panjang ruang tamu pada denah adalah 3 cm, berapakah panjang sebenarnya ruang tamu tersebut dalam satuan meter? (Tuliskan angkanya saja)",
        image: null,
        options: [],
        answer: "6",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "ipa",
    kode: "IPA",
    nama: "Ilmu Pengetahuan Alam (IPA)",
    guruPengampu: "Bu Siti Rahayu, S.Pd",
    kelas: "Kelas 5 & 6",
    color: "teal",
    deskripsi: "Penilaian Sumatif IPA: Ekosistem, Adaptasi Makhluk Hidup, Gaya & Energi, serta Tata Surya.",
    settings: {
      judul: "Asesmen Sumatif IPA & Lingkungan Hidup",
      mapel: "Ilmu Pengetahuan Alam (IPA)",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 60,
      token: "IPA2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "ipa-1",
        tipe: "PG",
        content: "Tumbuhan kaktus memiliki daun yang tereduksi menjadi duri dan batang tebal berlapis lilin. Fungsi utama adaptasi tersebut adalah untuk...",
        image: null,
        options: [
          "Mempercepat proses penguapan air",
          "Mengurangi penguapan air di habitat gurun yang kering",
          "Menyerap sinar matahari sebanyak-banyaknya",
          "Menarik serangga untuk membantu penyerbukan"
        ],
        answer: "B",
        difficulty: "REGULER"
      },
      {
        id: "ipa-2",
        tipe: "PGK",
        content: "Manakah dari perpindahan kalor berikut yang terjadi secara KONVEKSI? (Pilih semua yang benar)",
        image: null,
        options: [
          "Gerakan naik turunnya air saat mendidih di dalam panci",
          "Terjadinya angin darat dan angin laut di kawasan pesisir",
          "Ujung sendok logam terasa panas saat mengaduk teh hangat",
          "Panas api unggun yang terasa menghangatkan tubuh di malam hari"
        ],
        answer: ["A", "B"],
        difficulty: "HOTS"
      },
      {
        id: "ipa-3",
        tipe: "BS",
        content: "Pernyataan: Katak mengalami metamorfosis sempurna karena mengalami fase berudu (kecebong) yang bernapas dengan insang sebelum menjadi katak dewasa.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "ipa-4",
        tipe: "ISIAN",
        content: "Lapisan gas yang menyelimuti bumi dan berfungsi melindungi bumi dari radiasi sinar ultraviolet berbahaya serta hantaman meteor adalah...",
        image: null,
        options: [],
        answer: "atmosfer, lapisan atmosfer",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "bahasa-indonesia",
    kode: "BIN",
    nama: "Bahasa Indonesia",
    guruPengampu: "Bu Dewi Sartika, S.Pd",
    kelas: "Kelas 5 & 6",
    color: "indigo",
    deskripsi: "Penilaian Sumatif Bahasa Indonesia: Pemahaman Bacaan, Kalimat Utama, Ide Pokok, dan Teks Eksplanasi.",
    settings: {
      judul: "Asesmen Sumatif Bahasa Indonesia",
      mapel: "Bahasa Indonesia",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 60,
      token: "BIN2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "bin-1",
        tipe: "PG",
        content: "Bacalah teks berikut:\n'Hutan bakau memiliki peran krusial dalam menjaga keseimbangan garis pantai. Akar-akarnya yang kokoh mampu menahan gempuran ombak laut sehingga mencegah terjadinya abrasi pantai.'\nIde pokok paragraf tersebut adalah...",
        image: null,
        options: [
          "Jenis akar pada pohon bakau di pesisir",
          "Peran hutan bakau dalam mencegah abrasi pantai",
          "Penyebab terjadinya abrasi pantai di Indonesia",
          "Cara melestarikan hutan bakau bagi nelayan"
        ],
        answer: "B",
        difficulty: "REGULER"
      },
      {
        id: "bin-2",
        tipe: "BS",
        content: "Pernyataan: Baris pertama dan kedua pada pantun disebut sebagai isi, sedangkan baris ketiga dan keempat disebut sebagai sampiran.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Salah",
        difficulty: "REGULER"
      },
      {
        id: "bin-3",
        tipe: "PGK",
        content: "Pilihlah kalimat-kalimat berikut yang merupakan KALIMAT EFEKTIF dan baku sesuai PUEBI!",
        image: null,
        options: [
          "Para hadirin sekalian dimohon berdiri menyanyikan lagu Indonesia Raya.",
          "Siswa kelas 5 sedang berdiskusi menyelesaikan tugas kelompok di perpustakaan.",
          "Ibu membeli sayur-mayur, buah-buahan, dan bumbu dapur di pasar tradisional.",
          "Buku itu sangat amat tebal sekali sehingga butuh waktu lama membacanya."
        ],
        answer: ["B", "C"],
        difficulty: "HOTS"
      }
    ],
    results: []
  },
  {
    id: "pendidikan-pancasila",
    kode: "PPKN",
    nama: "Pendidikan Pancasila (PKn)",
    guruPengampu: "Pak Hendra Wijaya, S.Pd",
    kelas: "Kelas 5 & 6",
    color: "rose",
    deskripsi: "Penilaian Sumatif Pendidikan Pancasila: Nilai Moral Pancasila, Hak & Kewajiban, dan Keberagaman Bangsa.",
    settings: {
      judul: "Asesmen Sumatif Pendidikan Pancasila & Kewarganegaraan",
      mapel: "Pendidikan Pancasila / PKn",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 50,
      token: "PKN2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "pkn-1",
        tipe: "PG",
        content: "Mengambil keputusan bersama dengan cara bermusyawarah mufakat di lingkungan keluarga dan sekolah merupakan pengamalan sila Pancasila yang dilambangkan dengan...",
        image: null,
        options: [
          "Bintang emas",
          "Rantai emas",
          "Pohon beringin",
          "Kepala banteng"
        ],
        answer: "D",
        difficulty: "REGULER"
      },
      {
        id: "pkn-2",
        tipe: "PGK",
        content: "Manakah di bawah ini yang merupakan KEWAJIBAN anak sebagai siswa di lingkungan sekolah? (Pilih semua yang benar)",
        image: null,
        options: [
          "Mendapatkan bimbingan dan pengajaran yang baik dari bapak/ibu guru",
          "Mematuhi seluruh tata tertib dan disiplin sekolah yang berlaku",
          "Menjaga kebersihan dan ketertiban fasilitas umum sekolah",
          "Mendapatkan perlakuan yang adil tanpa diskriminasi"
        ],
        answer: ["B", "C"],
        difficulty: "HOTS"
      },
      {
        id: "pkn-3",
        tipe: "BS",
        content: "Pernyataan: Semboyan Bhinneka Tunggal Ika tertulis pada pita yang dicengkeram oleh burung Garuda Pancasila dan bermakna 'Berbeda-beda tetapi tetap satu jua'.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "ips",
    kode: "IPS",
    nama: "Ilmu Pengetahuan Sosial (IPS)",
    guruPengampu: "Pak Ahmad Fauzi, S.Pd",
    kelas: "Kelas 5 & 6",
    color: "amber",
    deskripsi: "Penilaian Sumatif IPS: Kenampakan Alam Nusantara, Aktivitas Ekonomi, Peninggalan Sejarah, dan Wawasan Peta Indonesia.",
    settings: {
      judul: "Asesmen Sumatif Ilmu Pengetahuan Sosial (IPS)",
      mapel: "Ilmu Pengetahuan Sosial (IPS)",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 60,
      token: "IPS2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "ips-1",
        tipe: "PG",
        content: "Secara geografis, wilayah kepulauan Indonesia berada di posisi silang strategis dunia, yaitu di antara dua benua dan dua samudra. Dua benua tersebut adalah...",
        image: null,
        options: [
          "Benua Asia dan Benua Australia",
          "Benua Asia dan Benua Afrika",
          "Benua Amerika dan Benua Eropa",
          "Benua Eropa dan Benua Australia"
        ],
        answer: "A",
        difficulty: "REGULER"
      },
      {
        id: "ips-2",
        tipe: "PGK",
        content: "Indonesia dikenal sebagai negara maritim. Pilihlah kegiatan-kegiatan ekonomi yang memanfaatkan potensi kemaritiman dan kelautan Indonesia! (Pilih semua yang benar)",
        image: null,
        options: [
          "Jasa pelabuhan dan transportasi antar-pulau",
          "Budidaya rumput laut dan mutiara air asin",
          "Penambangan batu bara di daerah pegunungan kapur",
          "Usaha penangkapan ikan laut dan pengolahan garam"
        ],
        answer: ["A", "B", "D"],
        difficulty: "HOTS"
      },
      {
        id: "ips-3",
        tipe: "BS",
        content: "Pernyataan: Candi Borobudur di Magelang, Jawa Tengah merupakan salah satu mahakarya peninggalan sejarah nusantara yang bercorak agama Buddha terbesar di dunia.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "ips-4",
        tipe: "ISIAN",
        content: "Garis khayal lintang 0 derajat yang membagi bumi secara horizontal menjadi belahan bumi utara dan selatan serta melintasi Kota Pontianak dinamakan garis...",
        image: null,
        options: [],
        answer: "khatulistiwa, ekuator",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "bahasa-inggris",
    kode: "BIG",
    nama: "Bahasa Inggris (English)",
    guruPengampu: "Ms. Jessica Taylor, S.Pd",
    kelas: "Kelas 5 & 6",
    color: "purple",
    deskripsi: "Summative Assessment English: Reading Comprehension, Grammar, Daily Vocabulary, and Functional Texts.",
    settings: {
      judul: "Summative Assessment English Language",
      mapel: "Bahasa Inggris",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 60,
      token: "BIG2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "big-1",
        tipe: "PG",
        content: "Complete the dialogue:\nRian: 'Good morning, Sarah! Where are you going?'\nSarah: 'Good morning! I am going to the ... to borrow an encyclopedia book.'",
        image: null,
        options: [
          "School canteen",
          "School library",
          "School clinic",
          "School yard"
        ],
        answer: "B",
        difficulty: "REGULER"
      },
      {
        id: "big-2",
        tipe: "PGK",
        content: "Which of the following words are classified as REGULAR past tense verbs? (Choose all correct answers)",
        image: null,
        options: [
          "Walked",
          "Bought",
          "Cleaned",
          "Played"
        ],
        answer: ["A", "C", "D"],
        difficulty: "HOTS"
      },
      {
        id: "big-3",
        tipe: "BS",
        content: "Statement: 'A cheetah can run much faster than a turtle.' Is this statement TRUE or FALSE?",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "big-4",
        tipe: "ISIAN",
        content: "Complete the sentence with the correct simple present verb: 'The earth ... around the sun every year.' (orbits / goes / revolves)",
        image: null,
        options: [],
        answer: "revolves, goes, orbits",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "pendidikan-agama",
    kode: "PABP",
    nama: "Pendidikan Agama & Budi Pekerti",
    guruPengampu: "Drs. H. Mulyadi, M.Pd.I",
    kelas: "Kelas 5 & 6",
    color: "emerald",
    deskripsi: "Penilaian Sumatif Pendidikan Agama: Akhlak Mulia, Nilai Kejujuran, Toleransi Keberagaman, dan Ibadah.",
    settings: {
      judul: "Asesmen Sumatif Pendidikan Agama & Budi Pekerti",
      mapel: "Pendidikan Agama & Budi Pekerti",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 60,
      token: "PABP2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "pabp-1",
        tipe: "PG",
        content: "Seorang anak menemukan uang saku terjatuh di lorong sekolah lalu menyerahkannya kepada bapak/ibu guru untuk diumumkan pemiliknya. Sikap terpuji tersebut mencerminkan sifat...",
        image: null,
        options: [
          "Kejujuran dan amanah",
          "Rasa sombong dan pamrih",
          "Keputusasaan",
          "Kecemburuan sosial"
        ],
        answer: "A",
        difficulty: "REGULER"
      },
      {
        id: "pabp-2",
        tipe: "PGK",
        content: "Manakah perbuatan berikut yang mencerminkan sikap toleransi dan moderasi beragama di lingkungan masyarakat majemuk? (Pilih semua yang benar)",
        image: null,
        options: [
          "Menghormati teman yang sedang menjalankan ibadah puasa atau doa",
          "Memaksa orang lain untuk mengikuti keyakinan agamanya",
          "Menjaga kerukunan dan saling membantu saat tetangga terkena musibah",
          "Menjaga ketenangan di sekitar rumah ibadah ketika sedang digunakan"
        ],
        answer: ["A", "C", "D"],
        difficulty: "HOTS"
      },
      {
        id: "pabp-3",
        tipe: "BS",
        content: "Pernyataan: Berbakti, menghormati, dan mendengarkan nasihat baik dari kedua orang tua serta guru merupakan kewajiban moral utama setiap peserta didik.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "pabp-4",
        tipe: "ISIAN",
        content: "Sikap saling menghormati dan tidak mencela perbedaan suku, ras, maupun keyakinan agama orang lain disebut dengan sikap...",
        image: null,
        options: [],
        answer: "toleransi, tasamuh",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "pjok",
    kode: "PJOK",
    nama: "PJOK (Penjasorkes)",
    guruPengampu: "Pak Rizky Pratama, S.Pd.Or",
    kelas: "Kelas 5 & 6",
    color: "orange",
    deskripsi: "Penilaian Sumatif PJOK: Gerak Dasar Lokomotor, Kebugaran Jasmani, Gizi Seimbang, dan Pola Hidup Bersih & Sehat (PHBS).",
    settings: {
      judul: "Asesmen Sumatif Pendidikan Jasmani, Olahraga, & Kesehatan",
      mapel: "PJOK",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 50,
      token: "PJOK2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "pjok-1",
        tipe: "PG",
        content: "Gerakan dalam olahraga yang ditandai dengan adanya perpindahan tubuh dari satu tempat ke tempat lain (seperti berjalan, berlari, dan melompat) disebut gerak...",
        image: null,
        options: [
          "Lokomotor",
          "Non-lokomotor",
          "Manipulatif",
          "Statis"
        ],
        answer: "A",
        difficulty: "REGULER"
      },
      {
        id: "pjok-2",
        tipe: "PGK",
        content: "Pilihlah DUA atau LEBIH manfaat utama melakukan aktivitas pemanasan (warming-up) sebelum melakukan olahraga berat!",
        image: null,
        options: [
          "Menaikkan suhu tubuh dan denyut jantung secara bertahap",
          "Mencegah risiko cedera otot dan sendi",
          "Menyebabkan tubuh langsung kelelahan sebelum pertandingan dimulai",
          "Mempersiapkan kelenturan persendian untuk bergerak optimal"
        ],
        answer: ["A", "B", "D"],
        difficulty: "HOTS"
      },
      {
        id: "pjok-3",
        tipe: "BS",
        content: "Pernyataan: Mengonsumsi makanan bergizi seimbang (karbohidrat, protein, sayur, buah) dan tidur cukup selama 8 jam sehari sangat penting untuk pertumbuhan dan daya tahan tubuh anak.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "pjok-4",
        tipe: "ISIAN",
        content: "Latihan kebugaran jasmani dengan melakukan gerakan push-up secara teratur dan benar bertujuan utama untuk melatih kekuatan otot...",
        image: null,
        options: [],
        answer: "lengan, dada, bahu, tangan",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "seni-budaya",
    kode: "SBDP",
    nama: "Seni Budaya & Prakarya (SBdP)",
    guruPengampu: "Ibu Ratna Juwita, S.Sn",
    kelas: "Kelas 5 & 6",
    color: "rose",
    deskripsi: "Penilaian Sumatif SBdP: Unsur Seni Rupa, Tangga Nada Musik Nusantara, Pola Lantai Tari Tradisional, dan Karya Kriya Prakarya.",
    settings: {
      judul: "Asesmen Sumatif Seni Budaya & Prakarya",
      mapel: "Seni Budaya & Prakarya (SBdP)",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 60,
      token: "SBDP2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "sbdp-1",
        tipe: "PG",
        content: "Karya seni rupa yang hanya memiliki dua dimensi yaitu panjang dan lebar, sehingga hanya dapat dinikmati keindahannya dari satu arah pandang depan (contohnya lukisan dan batik), disebut karya seni rupa...",
        image: null,
        options: [
          "Dua dimensi (2D)",
          "Tiga dimensi (3D)",
          "Empat dimensi (4D)",
          "Seni kriya terapan"
        ],
        answer: "A",
        difficulty: "REGULER"
      },
      {
        id: "sbdp-2",
        tipe: "PGK",
        content: "Tarian daerah tradisional di bawah ini yang menggunakan formasi pola lantai melingkar atau lengkung adalah... (Pilih semua yang benar)",
        image: null,
        options: [
          "Tari Kecak dari Bali",
          "Tari Saman dari Aceh",
          "Tari Randai dari Sumatera Barat",
          "Tari Piring formasi lurus dari Minangkabau"
        ],
        answer: ["A", "C"],
        difficulty: "HOTS"
      },
      {
        id: "sbdp-3",
        tipe: "BS",
        content: "Pernyataan: Tangga nada diatonis mayor memiliki susunan interval nada 1 - 1 - 1/2 - 1 - 1 - 1 - 1/2 dan biasanya menghasilkan lagu yang bertempo ceria, bersemangat, dan gembira.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "sbdp-4",
        tipe: "ISIAN",
        content: "Teknik membuat karya seni rupa dua dimensi dengan cara menempelkan berbagai bahan (seperti kertas warna, dedaunan kering, atau kain perca) pada bidang pola disebut teknik...",
        image: null,
        options: [],
        answer: "kolase, mozaik",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "informatika",
    kode: "TIK",
    nama: "Informatika & Literasi Digital",
    guruPengampu: "Pak Danang Wicaksono, S.Kom",
    kelas: "Kelas 5 & 6",
    color: "sky",
    deskripsi: "Penilaian Sumatif Informatika: Perangkat Komputer, Berpikir Komputasional, Etika Digital (Netiket), dan Keamanan Akun.",
    settings: {
      judul: "Asesmen Sumatif Informatika & Literasi Digital",
      mapel: "Informatika & Literasi Digital",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 50,
      token: "TIK2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "tik-1",
        tipe: "PG",
        content: "Perangkat keras (hardware) komputer yang berfungsi sebagai peranti masukan (input device) untuk mengetikkan karakter huruf, angka, dan perintah tombol adalah...",
        image: null,
        options: [
          "Keyboard (Papan Ketik)",
          "Monitor LCD",
          "Printer Inkjet",
          "Speaker Aktif"
        ],
        answer: "A",
        difficulty: "REGULER"
      },
      {
        id: "tik-2",
        tipe: "PGK",
        content: "Manakah kriteria pembuatan kata sandi (password) akun internet yang KUAT dan AMAN dari peretasan? (Pilih semua yang benar)",
        image: null,
        options: [
          "Memadukan huruf kapital, huruf kecil, angka, dan karakter simbol unik",
          "Menggunakan nama panggilan dan tanggal lahir sendiri",
          "Panjang kata sandi minimal 8 sampai 12 karakter",
          "Tidak membagikan kata sandi kepada orang lain atau sembarang situs"
        ],
        answer: ["A", "C", "D"],
        difficulty: "HOTS"
      },
      {
        id: "tik-3",
        tipe: "BS",
        content: "Pernyataan: Dalam berpikir komputasional (computational thinking), dekomposisi adalah teknik memecah masalah yang rumit/besar menjadi bagian-bagian yang lebih kecil sehingga lebih mudah diselesaikan.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "tik-4",
        tipe: "ISIAN",
        content: "Jaringan komputer global berskala dunia yang menghubungkan milyaran komputer, ponsel pintar, dan peladen informasi di seluruh dunia disebut...",
        image: null,
        options: [],
        answer: "internet",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "bahasa-daerah",
    kode: "BDER",
    nama: "Bahasa & Sastra Daerah (Mulok)",
    guruPengampu: "Ibu Ningsih Rahayu, S.Pd",
    kelas: "Kelas 5 & 6",
    color: "lime",
    deskripsi: "Penilaian Sumatif Muatan Lokal Bahasa Daerah: Tata Krama (Unggah-Ungguh), Cerita Rakyat, Peribahasa Daerah, dan Sastra Tradisional.",
    settings: {
      judul: "Asesmen Sumatif Bahasa & Sastra Daerah (Mulok)",
      mapel: "Bahasa Daerah",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 50,
      token: "BDER2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "bder-1",
        tipe: "PG",
        content: "Menggunakan tutur bahasa yang santun, nada bicara yang tenang, dan sikap merendah saat berbicara dengan orang yang lebih tua (seperti orang tua dan bapak/ibu guru) mencerminkan penerapan...",
        image: null,
        options: [
          "Tata krama dan unggah-ungguh basa yang luhur",
          "Kecemasan saat ditanya guru",
          "Ketiadaan rasa percaya diri",
          "Sikap acuh tak acuh"
        ],
        answer: "A",
        difficulty: "REGULER"
      },
      {
        id: "bder-2",
        tipe: "PGK",
        content: "Cerita rakyat tradisional nusantara (seperti Malin Kundang, Roro Jonggrang, dan Danau Toba) memiliki nilai pendidikan karakter luhur, antara lain... (Pilih semua yang benar)",
        image: null,
        options: [
          "Pentingnya berbakti dan tidak durhaka kepada orang tua",
          "Menghindari sifat serakah dan ingkar janji",
          "Mengajarkan membalas dendam kepada siapa saja yang tidak disukai",
          "Menjaga amanah serta kelestarian alam lingkungan sekitar"
        ],
        answer: ["A", "B", "D"],
        difficulty: "HOTS"
      },
      {
        id: "bder-3",
        tipe: "BS",
        content: "Pernyataan: Lagu-lagu dolanan atau tembang daerah tradisional nusantara sarat dengan pesan moral gotong royong, kegembiraan bersama teman, dan budi pekerti yang baik.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "bder-4",
        tipe: "ISIAN",
        content: "Ungkapan bahasa daerah yang berupa kiasan kata-kata bijak berisi nasihat, pedoman tingkah laku, dan ajaran kebaikan dinamakan ungkapan...",
        image: null,
        options: [],
        answer: "peribahasa, paribasan, bebasan",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "sejarah",
    kode: "SEJ",
    nama: "Sejarah & Wawasan Kebangsaan",
    guruPengampu: "Pak Bambang Irawan, M.Pd",
    kelas: "Kelas 5 & 6",
    color: "red",
    deskripsi: "Penilaian Sumatif Sejarah: Perjuangan Pahlawan Kemerdekaan, Kongres Sumpah Pemuda, Proklamasi 1945, dan Cinta Tanah Air.",
    settings: {
      judul: "Asesmen Sumatif Sejarah & Wawasan Kebangsaan",
      mapel: "Sejarah & Kebangsaan",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 60,
      token: "SEJ2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "sej-1",
        tipe: "PG",
        content: "Peristiwa bersejarah pembacaan Teks Proklamasi Kemerdekaan Republik Indonesia oleh Ir. Soekarno didampingi Drs. Mohammad Hatta dilaksanakan pada hari Jumat tanggal...",
        image: null,
        options: [
          "17 Agustus 1945 di Jalan Pegangsaan Timur No. 56 Jakarta",
          "28 Oktober 1928 di Lapangan Ikada Jakarta",
          "20 Mei 1908 di Gedung Stovia Jakarta",
          "10 November 1945 di Jembatan Merah Surabaya"
        ],
        answer: "A",
        difficulty: "REGULER"
      },
      {
        id: "sej-2",
        tipe: "PGK",
        content: "Pilihlah pahlawan-pahlawan nasional pejuang kemerdekaan yang memimpin perlawanan bersenjata rakyat di berbagai daerah nusantara! (Pilih semua yang benar)",
        image: null,
        options: [
          "Pangeran Diponegoro (Perang Jawa)",
          "Cut Nyak Dien (Perang Aceh)",
          "Kapitan Pattimura (Maluku)",
          "Cornelis de Houtman (Banten)"
        ],
        answer: ["A", "B", "C"],
        difficulty: "HOTS"
      },
      {
        id: "sej-3",
        tipe: "BS",
        content: "Pernyataan: Peristiwa Sumpah Pemuda pada 28 Oktober 1928 menjadi tonggak persatuan pemuda nusantara yang berikrar bertumpah darah satu, berbangsa satu, dan menjunjung bahasa persatuan bahasa Indonesia.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "sej-4",
        tipe: "ISIAN",
        content: "Tokoh pemuda yang mengetik naskah otentik Proklamasi Kemerdekaan Republik Indonesia setelah disempurnakan oleh Bung Karno dan Bung Hatta adalah...",
        image: null,
        options: [],
        answer: "Sayuti Melik, Mohamad Ibnu Sayuti",
        difficulty: "REGULER"
      }
    ],
    results: []
  },
  {
    id: "bimbingan-konseling",
    kode: "BK",
    nama: "Bimbingan Konseling & Karakter",
    guruPengampu: "Ibu Maya Anggraini, S.Psi, M.Pd",
    kelas: "Kelas 5 & 6",
    color: "teal",
    deskripsi: "Penilaian Karakter & Budi Pekerti: Regulasi Emosi, Komunikasi Asertif, Anti-Perundungan (Bullying), dan Minat Bakat Siswa.",
    settings: {
      judul: "Asesmen Karakter, Bimbingan Konseling & Anti-Bullying",
      mapel: "Bimbingan Konseling & Karakter",
      sekolah: "SD UNITY INTERNASIONAL",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png",
      tahunAjaran: "2025/2026",
      durasiMenit: 45,
      token: "BK2026",
      adminPass: "112233",
      acakSoal: false,
      tampilkanNilai: true
    },
    questions: [
      {
        id: "bk-1",
        tipe: "PG",
        content: "Ketika kamu melihat seorang teman baru di kelas disudutkan, diejek, atau dikucilkan oleh sekelompok siswa lainnya, tindakan terbaik yang harus segera kamu ambil adalah...",
        image: null,
        options: [
          "Mendekati teman tersebut dengan ramah dan segera melaporkan kejadian ke guru kelas/guru BK",
          "Ikut menertawakan agar tidak dianggap aneh oleh kelompok tersebut",
          "Merekam kejadian lalu mengunggahnya ke media sosial untuk bahan tontonan",
          "Pura-pura tidak melihat dan langsung pergi meninggalkan tempat"
        ],
        answer: "A",
        difficulty: "REGULER"
      },
      {
        id: "bk-2",
        tipe: "PGK",
        content: "Manakah cara-cara yang SEHAT dan POSITIF untuk meredakan emosi marah atau rasa sedih saat mengalami kegagalan? (Pilih semua yang benar)",
        image: null,
        options: [
          "Menarik napas dalam-dalam perlahan untuk menenangkan pikiran",
          "Menceritakan keluh kesah kepada orang tua, sahabat terpercaya, atau guru BK",
          "Membanting benda-benda di sekitar dan berteriak kepada teman",
          "Melakukan aktivitas positif seperti menggambar, mendengarkan musik, atau berolahraga"
        ],
        answer: ["A", "B", "D"],
        difficulty: "HOTS"
      },
      {
        id: "bk-3",
        tipe: "BS",
        content: "Pernyataan: Mengembangkan empati, yaitu kemampuan untuk memahami dan merasakan apa yang dirasakan oleh orang lain, merupakan kunci utama membangun lingkungan pertemanan sekolah yang aman dan menyenangkan.",
        image: null,
        options: ["Benar", "Salah"],
        answer: "Benar",
        difficulty: "REGULER"
      },
      {
        id: "bk-4",
        tipe: "ISIAN",
        content: "Perilaku agresif yang disengaja dan dilakukan secara berulang-ulang untuk menyakiti fisik, mengolok-olok, atau mempermalukan orang lain disebut tindakan...",
        image: null,
        options: [],
        answer: "perundungan, bullying",
        difficulty: "REGULER"
      }
    ],
    results: []
  }
];


