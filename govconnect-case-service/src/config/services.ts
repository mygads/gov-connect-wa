/**
 * Daftar Layanan Pemerintahan Kelurahan
 * Layanan ini sudah fix dan tidak bisa ditambah/dihapus oleh admin
 * Admin hanya bisa mengaktifkan/menonaktifkan layanan
 */

export interface ServiceDefinition {
  code: string;
  name: string;
  description: string;
  category: 'administrasi' | 'perizinan' | 'kependudukan' | 'sosial';
  requirements: string[];
  sop_steps: string[];
  estimated_duration: number; // dalam menit
  daily_quota: number;
  citizen_questions: CitizenQuestion[]; // pertanyaan spesifik per layanan
}

export interface CitizenQuestion {
  field: string;
  question: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[]; // untuk type select
}

// Pertanyaan data umum warga (WAJIB untuk semua layanan)
export const COMMON_CITIZEN_QUESTIONS: CitizenQuestion[] = [
  {
    field: 'nama_lengkap',
    question: 'Siapa nama lengkap Kakak sesuai KTP?',
    type: 'text',
    required: true,
  },
  {
    field: 'nik',
    question: 'Berapa NIK (Nomor Induk Kependudukan) Kakak?',
    type: 'text',
    required: true,
  },
  {
    field: 'alamat',
    question: 'Alamat tempat tinggal Kakak di mana?',
    type: 'text',
    required: true,
  },
  {
    field: 'no_hp',
    question: 'Nomor HP yang bisa dihubungi?',
    type: 'text',
    required: true,
  },
];

// Daftar layanan tetap kelurahan
export const GOVERNMENT_SERVICES: ServiceDefinition[] = [
  // ==================== ADMINISTRASI ====================
  {
    code: 'SKD',
    name: 'Surat Keterangan Domisili',
    description: 'Surat keterangan yang menyatakan seseorang berdomisili di wilayah kelurahan',
    category: 'administrasi',
    requirements: [
      'KTP asli dan fotokopi',
      'Kartu Keluarga (KK) asli dan fotokopi',
      'Surat Pengantar RT/RW',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan ke loket',
      'Tunggu verifikasi data',
      'Tanda tangan surat',
      'Ambil surat yang sudah jadi',
    ],
    estimated_duration: 15,
    daily_quota: 30,
    citizen_questions: [
      {
        field: 'keperluan',
        question: 'Surat domisili ini untuk keperluan apa?',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    code: 'SKU',
    name: 'Surat Keterangan Usaha',
    description: 'Surat keterangan untuk pelaku usaha mikro/kecil di wilayah kelurahan',
    category: 'administrasi',
    requirements: [
      'KTP asli dan fotokopi',
      'Kartu Keluarga (KK) fotokopi',
      'Surat Pengantar RT/RW',
      'Foto lokasi usaha',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data usaha',
      'Survey lokasi (jika diperlukan)',
      'Tanda tangan surat',
      'Ambil surat yang sudah jadi',
    ],
    estimated_duration: 20,
    daily_quota: 20,
    citizen_questions: [
      {
        field: 'nama_usaha',
        question: 'Apa nama usaha Kakak?',
        type: 'text',
        required: true,
      },
      {
        field: 'jenis_usaha',
        question: 'Jenis usahanya apa? (contoh: warung makan, toko kelontong)',
        type: 'text',
        required: true,
      },
      {
        field: 'alamat_usaha',
        question: 'Di mana alamat lokasi usahanya?',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    code: 'SKTM',
    name: 'Surat Keterangan Tidak Mampu',
    description: 'Surat keterangan untuk warga kurang mampu, biasanya untuk keperluan bantuan atau keringanan biaya',
    category: 'sosial',
    requirements: [
      'KTP asli dan fotokopi',
      'Kartu Keluarga (KK) asli dan fotokopi',
      'Surat Pengantar RT/RW',
      'Foto rumah tampak depan',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data',
      'Survey kondisi ekonomi (jika diperlukan)',
      'Tanda tangan surat',
      'Ambil surat yang sudah jadi',
    ],
    estimated_duration: 20,
    daily_quota: 15,
    citizen_questions: [
      {
        field: 'keperluan',
        question: 'SKTM ini untuk keperluan apa? (contoh: beasiswa, pengobatan)',
        type: 'text',
        required: true,
      },
      {
        field: 'pekerjaan',
        question: 'Apa pekerjaan Kakak saat ini?',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    code: 'SKBM',
    name: 'Surat Keterangan Belum Menikah',
    description: 'Surat keterangan yang menyatakan seseorang belum pernah menikah',
    category: 'administrasi',
    requirements: [
      'KTP asli dan fotokopi',
      'Kartu Keluarga (KK) asli dan fotokopi',
      'Surat Pengantar RT/RW',
      'Pas foto 3x4 (2 lembar)',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data',
      'Tanda tangan surat',
      'Ambil surat yang sudah jadi',
    ],
    estimated_duration: 15,
    daily_quota: 20,
    citizen_questions: [
      {
        field: 'keperluan',
        question: 'Surat ini untuk keperluan apa?',
        type: 'text',
        required: true,
      },
    ],
  },

  // ==================== PERIZINAN ====================
  {
    code: 'IKR',
    name: 'Izin Keramaian',
    description: 'Izin untuk mengadakan acara/keramaian di wilayah kelurahan',
    category: 'perizinan',
    requirements: [
      'KTP asli dan fotokopi penanggungjawab',
      'Surat Pengantar RT/RW',
      'Proposal acara (jika ada)',
      'Denah lokasi acara',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data acara',
      'Koordinasi dengan keamanan',
      'Tanda tangan izin',
      'Ambil surat izin',
    ],
    estimated_duration: 30,
    daily_quota: 10,
    citizen_questions: [
      {
        field: 'nama_acara',
        question: 'Apa nama acaranya?',
        type: 'text',
        required: true,
      },
      {
        field: 'jenis_acara',
        question: 'Jenis acaranya apa? (contoh: pernikahan, pengajian, sunatan)',
        type: 'text',
        required: true,
      },
      {
        field: 'tanggal_acara',
        question: 'Kapan tanggal pelaksanaan acaranya?',
        type: 'text',
        required: true,
      },
      {
        field: 'lokasi_acara',
        question: 'Di mana lokasi acaranya?',
        type: 'text',
        required: true,
      },
      {
        field: 'jumlah_tamu',
        question: 'Perkiraan jumlah tamu yang hadir berapa orang?',
        type: 'text',
        required: true,
      },
    ],
  },

  // ==================== KEPENDUDUKAN ====================
  {
    code: 'SPKTP',
    name: 'Surat Pengantar KTP',
    description: 'Surat pengantar untuk pembuatan/perpanjangan KTP di Disdukcapil',
    category: 'kependudukan',
    requirements: [
      'Kartu Keluarga (KK) asli dan fotokopi',
      'Surat Pengantar RT/RW',
      'KTP lama (jika perpanjangan)',
      'Pas foto 3x4 (2 lembar)',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data',
      'Tanda tangan surat',
      'Ambil surat pengantar',
      'Lanjut ke Disdukcapil',
    ],
    estimated_duration: 15,
    daily_quota: 25,
    citizen_questions: [
      {
        field: 'jenis_pengurusan',
        question: 'Ini untuk KTP baru atau perpanjangan?',
        type: 'select',
        required: true,
        options: ['KTP Baru', 'Perpanjangan', 'Penggantian Hilang/Rusak'],
      },
    ],
  },
  {
    code: 'SPKK',
    name: 'Surat Pengantar Kartu Keluarga',
    description: 'Surat pengantar untuk pembuatan/perubahan Kartu Keluarga',
    category: 'kependudukan',
    requirements: [
      'KTP asli dan fotokopi',
      'KK lama (jika perubahan)',
      'Surat Pengantar RT/RW',
      'Dokumen pendukung (akta nikah/cerai/kematian jika ada perubahan)',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data',
      'Tanda tangan surat',
      'Ambil surat pengantar',
      'Lanjut ke Disdukcapil',
    ],
    estimated_duration: 20,
    daily_quota: 20,
    citizen_questions: [
      {
        field: 'jenis_pengurusan',
        question: 'Ini untuk KK baru atau perubahan data?',
        type: 'select',
        required: true,
        options: ['KK Baru', 'Perubahan Data', 'Penggantian Hilang/Rusak'],
      },
      {
        field: 'alasan_perubahan',
        question: 'Kalau perubahan, perubahannya apa? (contoh: tambah anggota, pindah alamat)',
        type: 'text',
        required: false,
      },
    ],
  },
  {
    code: 'SPSKCK',
    name: 'Surat Pengantar SKCK',
    description: 'Surat pengantar untuk pembuatan SKCK di Kepolisian',
    category: 'kependudukan',
    requirements: [
      'KTP asli dan fotokopi',
      'Kartu Keluarga (KK) fotokopi',
      'Surat Pengantar RT/RW',
      'Pas foto 4x6 (6 lembar, latar merah)',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data',
      'Tanda tangan surat',
      'Ambil surat pengantar',
      'Lanjut ke Polsek/Polres',
    ],
    estimated_duration: 15,
    daily_quota: 25,
    citizen_questions: [
      {
        field: 'keperluan',
        question: 'SKCK ini untuk keperluan apa? (contoh: melamar kerja, beasiswa)',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    code: 'SPAKTA',
    name: 'Surat Pengantar Akta Kelahiran/Kematian',
    description: 'Surat pengantar untuk pembuatan akta kelahiran atau kematian',
    category: 'kependudukan',
    requirements: [
      'KTP asli dan fotokopi orang tua/pelapor',
      'Kartu Keluarga (KK) asli dan fotokopi',
      'Surat Pengantar RT/RW',
      'Surat keterangan lahir/kematian dari RS/Bidan/Dokter',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data',
      'Tanda tangan surat',
      'Ambil surat pengantar',
      'Lanjut ke Disdukcapil',
    ],
    estimated_duration: 20,
    daily_quota: 15,
    citizen_questions: [
      {
        field: 'jenis_akta',
        question: 'Ini untuk akta kelahiran atau akta kematian?',
        type: 'select',
        required: true,
        options: ['Akta Kelahiran', 'Akta Kematian'],
      },
      {
        field: 'nama_yang_bersangkutan',
        question: 'Siapa nama yang akan dibuatkan aktanya?',
        type: 'text',
        required: true,
      },
    ],
  },

  // ==================== SOSIAL ====================
  {
    code: 'SKK',
    name: 'Surat Keterangan Kematian',
    description: 'Surat keterangan kematian dari kelurahan',
    category: 'sosial',
    requirements: [
      'KTP asli almarhum/almarhumah',
      'Kartu Keluarga (KK) asli',
      'Surat keterangan kematian dari RS/Dokter/RT',
      'KTP pelapor',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data',
      'Tanda tangan surat',
      'Ambil surat keterangan',
    ],
    estimated_duration: 15,
    daily_quota: 10,
    citizen_questions: [
      {
        field: 'nama_almarhum',
        question: 'Siapa nama almarhum/almarhumah?',
        type: 'text',
        required: true,
      },
      {
        field: 'tanggal_meninggal',
        question: 'Kapan tanggal meninggalnya?',
        type: 'text',
        required: true,
      },
      {
        field: 'hubungan_pelapor',
        question: 'Kakak hubungannya apa dengan almarhum/almarhumah?',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    code: 'SPP',
    name: 'Surat Pengantar Pindah',
    description: 'Surat pengantar untuk pindah domisili ke kelurahan/kecamatan/kota lain',
    category: 'kependudukan',
    requirements: [
      'KTP asli semua anggota keluarga yang pindah',
      'Kartu Keluarga (KK) asli',
      'Surat Pengantar RT/RW',
      'Alamat tujuan pindah yang jelas',
    ],
    sop_steps: [
      'Ambil nomor antrian',
      'Serahkan berkas persyaratan',
      'Verifikasi data',
      'Tanda tangan surat',
      'Ambil surat pengantar pindah',
      'Lanjut ke Disdukcapil',
    ],
    estimated_duration: 25,
    daily_quota: 10,
    citizen_questions: [
      {
        field: 'alamat_tujuan',
        question: 'Mau pindah ke alamat mana?',
        type: 'text',
        required: true,
      },
      {
        field: 'jumlah_anggota_pindah',
        question: 'Berapa orang yang ikut pindah?',
        type: 'text',
        required: true,
      },
      {
        field: 'alasan_pindah',
        question: 'Alasan pindahnya apa? (contoh: pekerjaan, ikut keluarga)',
        type: 'text',
        required: true,
      },
    ],
  },
];

// Helper function untuk mendapatkan layanan berdasarkan kode
export function getServiceByCode(code: string): ServiceDefinition | undefined {
  return GOVERNMENT_SERVICES.find(s => s.code === code);
}

// Helper function untuk mendapatkan layanan berdasarkan kategori
export function getServicesByCategory(category: string): ServiceDefinition[] {
  return GOVERNMENT_SERVICES.filter(s => s.category === category);
}

// Helper function untuk mendapatkan semua pertanyaan untuk suatu layanan
export function getQuestionsForService(code: string): CitizenQuestion[] {
  const service = getServiceByCode(code);
  if (!service) return COMMON_CITIZEN_QUESTIONS;
  return [...COMMON_CITIZEN_QUESTIONS, ...service.citizen_questions];
}

// Default operating hours
export const DEFAULT_OPERATING_HOURS = {
  senin: { open: '08:00', close: '15:00' },
  selasa: { open: '08:00', close: '15:00' },
  rabu: { open: '08:00', close: '15:00' },
  kamis: { open: '08:00', close: '15:00' },
  jumat: { open: '08:00', close: '11:30' },
  sabtu: { open: '08:00', close: '12:00' },
  minggu: null, // tutup
};

// Time slots untuk reservasi (interval 30 menit)
export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
];
