export function buildAIReplyMessage(reply_text: string): string {
  return reply_text;
}

export function buildComplaintCreatedMessage(data: {
  complaint_id: string;
  kategori: string;
}): string {
  const kategoriText = formatKategori(data.kategori).toLowerCase();
  
  return `✅ *Laporan Diterima*

No: *${data.complaint_id}*
Kategori: ${kategoriText}

Kami akan segera menindaklanjuti. Anda akan dinotifikasi saat selesai.`;
}

export function buildReservationCreatedMessage(data: {
  reservation_id: string;
  service_name: string;
  reservation_date: string;
  reservation_time: string;
}): string {
  const dateFormatted = new Date(data.reservation_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  return `✅ *Reservasi Berhasil*

No: *${data.reservation_id}*
Layanan: ${data.service_name}
📅 ${dateFormatted}
🕐 ${data.reservation_time} WIB

Silakan datang ke kantor kelurahan sesuai jadwal.
📍 Senin-Jumat, 08:00-16:00`;
}

export function buildStatusUpdatedMessage(data: {
  complaint_id?: string;
  reservation_id?: string;
  status: string;
  admin_notes?: string;
}): string {
  const id = data.complaint_id || data.reservation_id;
  const isComplaint = !!data.complaint_id;
  
  return buildNaturalStatusMessage(id!, data.status, data.admin_notes, isComplaint);
}

function buildNaturalStatusMessage(
  id: string, 
  status: string, 
  adminNotes?: string,
  isComplaint: boolean = true
): string {
  const type = isComplaint ? 'Laporan' : 'Reservasi';
  
  // Only 'selesai' will be sent as notification (other statuses are skipped)
  // But keep other cases for internal use / future changes
  switch (status) {
    case 'selesai':
      let selesaiMsg = `✅ *${type} Selesai*\n\n*${id}* telah selesai ditangani.`;
      if (adminNotes) {
        selesaiMsg += `\n\n📝 _${adminNotes}_`;
      }
      selesaiMsg += `\n\nTerima kasih telah menggunakan layanan kami.`;
      return selesaiMsg;
    
    case 'baru':
      return `📥 *${type} Diterima*\n\n*${id}* sudah kami terima.`;
    
    case 'pending':
      let pendingMsg = `⏳ *${type} Pending*\n\n*${id}* sedang diverifikasi.`;
      if (adminNotes) {
        pendingMsg += `\n\n📝 _${adminNotes}_`;
      }
      return pendingMsg;
    
    case 'proses':
      let prosesMsg = `🔄 *${type} Diproses*\n\n*${id}* sedang ditangani.`;
      if (adminNotes) {
        prosesMsg += `\n\n📝 _${adminNotes}_`;
      }
      return prosesMsg;
    
    case 'ditolak':
      let ditolakMsg = `❌ *${type} Ditolak*\n\n*${id}* tidak dapat diproses.`;
      if (adminNotes) {
        ditolakMsg += `\n\n📝 Alasan: _${adminNotes}_`;
      }
      return ditolakMsg;
    
    case 'dibatalkan':
      return `🔴 *${type} Dibatalkan*\n\n*${id}* telah dibatalkan.`;
    
    default:
      return `📢 *Update ${type}*\n\n*${id}*: ${status}`;
  }
}

function formatKategori(kategori: string): string {
  const map: Record<string, string> = {
    jalan_rusak: 'Jalan Rusak',
    lampu_mati: 'Lampu Jalan Mati',
    sampah: 'Sampah Menumpuk',
    drainase: 'Saluran Air Tersumbat',
    pohon_tumbang: 'Pohon Tumbang',
    fasilitas_rusak: 'Fasilitas Umum Rusak',
    banjir: 'Banjir',
    lainnya: 'Lainnya'
  };
  return map[kategori] || kategori;
}

export function buildUrgentAlertMessage(data: {
  complaint_id: string;
  kategori: string;
  deskripsi: string;
  alamat?: string;
  rt_rw?: string;
  created_at: string;
}): string {
  const kategoriText = formatKategori(data.kategori);
  const waktu = new Date(data.created_at).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let message = `🚨 *LAPORAN DARURAT* 🚨

*ID:* ${data.complaint_id}
*Kategori:* ${kategoriText}
*Waktu:* ${waktu}`;

  if (data.alamat) {
    message += `\n*Alamat:* ${data.alamat}`;
  }
  
  if (data.rt_rw) {
    message += `\n*RT/RW:* ${data.rt_rw}`;
  }

  message += `\n\n*Deskripsi:*\n${data.deskripsi}`;
  
  message += `\n\n⚠️ *Mohon segera ditindaklanjuti!*`;
  message += `\n\nBuka dashboard: ${process.env.DASHBOARD_URL || 'http://localhost:3000'}/dashboard/laporan`;
  
  return message;
}
