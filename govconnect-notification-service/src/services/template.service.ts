export function buildAIReplyMessage(reply_text: string): string {
  return reply_text;
}

export function buildComplaintCreatedMessage(data: {
  complaint_id: string;
  kategori: string;
}): string {
  return `✅ *Laporan Diterima*

Nomor Laporan: ${data.complaint_id}
Kategori: ${formatKategori(data.kategori)}
Status: Baru

Laporan Anda sedang kami proses. Anda akan menerima update melalui WhatsApp ini.

Terima kasih telah menggunakan GovConnect! 🙏`;
}

export function buildTicketCreatedMessage(data: {
  ticket_id: string;
  jenis: string;
}): string {
  return `🎫 *Tiket Layanan Dibuat*

Nomor Tiket: ${data.ticket_id}
Jenis: ${formatJenis(data.jenis)}

Silakan datang ke kantor kelurahan dengan membawa tiket ini.

Jam Pelayanan: Senin-Jumat, 08:00-15:00`;
}

export function buildStatusUpdatedMessage(data: {
  complaint_id?: string;
  ticket_id?: string;
  status: string;
  admin_notes?: string;
}): string {
  const id = data.complaint_id || data.ticket_id;
  const type = data.complaint_id ? 'Laporan' : 'Tiket';
  
  return `📢 *Update Status ${type}*

Nomor: ${id}
Status: ${formatStatus(data.status)}

${data.admin_notes || 'Terima kasih atas kesabaran Anda.'}`;
}

function formatKategori(kategori: string): string {
  const map: Record<string, string> = {
    jalan_rusak: 'Jalan Rusak',
    lampu_mati: 'Lampu Jalan Mati',
    sampah: 'Sampah Menumpuk',
    drainase: 'Saluran Air Tersumbat',
    pohon_tumbang: 'Pohon Tumbang',
    fasilitas_rusak: 'Fasilitas Umum Rusak'
  };
  return map[kategori] || kategori;
}

function formatJenis(jenis: string): string {
  const map: Record<string, string> = {
    surat_keterangan: 'Surat Keterangan',
    surat_pengantar: 'Surat Pengantar',
    izin_keramaian: 'Izin Keramaian'
  };
  return map[jenis] || jenis;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    baru: 'Baru',
    pending: 'Menunggu',
    proses: 'Dalam Proses',
    selesai: 'Selesai',
    ditolak: 'Ditolak'
  };
  return map[status] || status;
}
