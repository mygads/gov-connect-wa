import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GovConnect Case Service API',
      version: '1.0.0',
      description: `
# Case Service API

Case Service mengelola **Laporan Warga** dan **Tiket Layanan** dalam sistem GovConnect.

## Entities

### Laporan (Complaint)
- Pengaduan tentang masalah infrastruktur
- Kategori: jalan_rusak, lampu_mati, sampah, drainase, pohon_tumbang, fasilitas_rusak
- Status: baru → proses → selesai/ditolak

### Tiket (Ticket)
- Permohonan layanan administratif
- Jenis: surat_keterangan, surat_pengantar, izin_keramaian
- Status: pending → proses → selesai/ditolak

## Authentication
- Internal APIs: Header \`X-Internal-API-Key\`
      `,
      contact: {
        name: 'GovConnect Team',
        email: 'admin@govconnect.my.id',
      },
    },
    servers: [
      { url: 'http://localhost:3003', description: 'Development' },
      { url: 'https://api.govconnect.my.id/api/cases', description: 'Production' },
    ],
    tags: [
      { name: 'Laporan', description: 'Complaint/report management' },
      { name: 'Tiket', description: 'Service ticket management' },
      { name: 'Statistics', description: 'Dashboard statistics' },
      { name: 'User', description: 'User history' },
      { name: 'Health', description: 'Health checks' },
    ],
    components: {
      securitySchemes: {
        InternalApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Internal-API-Key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Complaint: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            complaint_id: { type: 'string', example: 'LAP-20251203-001' },
            wa_user_id: { type: 'string' },
            kategori: { type: 'string', enum: ['jalan_rusak', 'lampu_mati', 'sampah', 'drainase', 'pohon_tumbang', 'fasilitas_rusak'] },
            deskripsi: { type: 'string' },
            alamat: { type: 'string' },
            rt_rw: { type: 'string' },
            foto_url: { type: 'string' },
            status: { type: 'string', enum: ['baru', 'proses', 'selesai', 'ditolak'] },
            admin_notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateComplaintRequest: {
          type: 'object',
          required: ['wa_user_id', 'kategori', 'deskripsi'],
          properties: {
            wa_user_id: { type: 'string', example: '6281234567890' },
            kategori: { type: 'string', enum: ['jalan_rusak', 'lampu_mati', 'sampah', 'drainase', 'pohon_tumbang', 'fasilitas_rusak'] },
            deskripsi: { type: 'string', minLength: 10 },
            alamat: { type: 'string' },
            rt_rw: { type: 'string' },
            foto_url: { type: 'string' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            ticket_id: { type: 'string', example: 'TKT-20251203-001' },
            wa_user_id: { type: 'string' },
            jenis: { type: 'string', enum: ['surat_keterangan', 'surat_pengantar', 'izin_keramaian'] },
            data_json: { type: 'object' },
            status: { type: 'string', enum: ['pending', 'proses', 'selesai', 'ditolak'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateTicketRequest: {
          type: 'object',
          required: ['wa_user_id', 'jenis', 'data_json'],
          properties: {
            wa_user_id: { type: 'string' },
            jenis: { type: 'string', enum: ['surat_keterangan', 'surat_pengantar', 'izin_keramaian'] },
            data_json: { type: 'object' },
          },
        },
        Statistics: {
          type: 'object',
          properties: {
            totalLaporan: { type: 'integer' },
            totalTiket: { type: 'integer' },
            laporan: {
              type: 'object',
              properties: {
                baru: { type: 'integer' },
                proses: { type: 'integer' },
                selesai: { type: 'integer' },
                ditolak: { type: 'integer' },
                hariIni: { type: 'integer' },
              },
            },
            tiket: {
              type: 'object',
              properties: {
                pending: { type: 'integer' },
                proses: { type: 'integer' },
                selesai: { type: 'integer' },
                ditolak: { type: 'integer' },
                hariIni: { type: 'integer' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
