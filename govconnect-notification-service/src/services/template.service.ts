export function buildAIReplyMessage(reply_text: string): string {
  return reply_text;
}

export function buildComplaintCreatedMessage(data: {
  complaint_id: string;
  kategori: string;
}): string {
  const kategoriText = formatKategori(data.kategori).toLowerCase();
  
  return `Halo Kak! 👋

Laporan ${kategoriText} Anda sudah kami terima dengan nomor *${data.complaint_id}*.

Kami akan segera menindaklanjuti laporan ini. Tenang saja, Kakak akan mendapat kabar update langsung di WhatsApp ini ya!

Terima kasih sudah melapor 🙏`;
}

export function buildTicketCreatedMessage(data: {
  ticket_id: string;
  jenis: string;
}): string {
  const jenisText = formatJenis(data.jenis).toLowerCase();
  
  return `Halo Kak! 👋

Permintaan ${jenisText} Anda sudah kami catat dengan nomor tiket *${data.ticket_id}*.

Silakan datang ke kantor kelurahan dengan menyebutkan nomor tiket ini ya. Jam pelayanan kami Senin-Jumat pukul 08:00-15:00.

Sampai jumpa di kantor kelurahan! 🏛️`;
}

export function buildStatusUpdatedMessage(data: {
  complaint_id?: string;
  ticket_id?: string;
  status: string;
  admin_notes?: string;
}): string {
  const id = data.complaint_id || data.ticket_id;
  const isComplaint = !!data.complaint_id;
  
  return buildNaturalStatusMessage(id!, data.status, data.admin_notes, isComplaint);
}

function buildNaturalStatusMessage(
  id: string, 
  status: string, 
  adminNotes?: string,
  isComplaint: boolean = true
): string {
  const type = isComplaint ? 'laporan' : 'tiket';
  
  switch (status) {
    case 'baru':
      return `Halo Kak! 👋\n\n${isComplaint ? 'Laporan' : 'Tiket'} *${id}* sudah kami terima dan akan segera kami proses.\n\nKami akan kabari perkembangannya ya! 📱`;
    
    case 'pending':
      let pendingMsg = `Halo Kak! 📋\n\nUntuk ${type} *${id}*, saat ini sedang dalam tahap verifikasi oleh tim kami.`;
      if (adminNotes) {
        pendingMsg += `\n\n💬 _"${adminNotes}"_`;
      }
      pendingMsg += `\n\nMohon ditunggu ya, kami akan segera mengabari! 🙏`;
      return pendingMsg;
    
    case 'proses':
      let prosesMsg = `Halo Kak! 🔔\n\nKabar baik! ${isComplaint ? 'Laporan' : 'Tiket'} *${id}* sudah dalam proses penanganan.`;
      if (adminNotes) {
        prosesMsg += `\n\n💬 Catatan dari petugas:\n_"${adminNotes}"_`;
      } else {
        prosesMsg += `\n\nTim kami sedang menindaklanjuti ${type} Kakak.`;
      }
      prosesMsg += `\n\nKami akan kabari lagi kalau sudah selesai ya! 👍`;
      return prosesMsg;
    
    case 'selesai':
      let selesaiMsg = `Halo Kak! ✅\n\nYeay! ${isComplaint ? 'Laporan' : 'Tiket'} *${id}* sudah selesai ditangani!`;
      if (adminNotes) {
        selesaiMsg += `\n\n💬 Catatan petugas:\n_"${adminNotes}"_`;
      }
      selesaiMsg += `\n\nTerima kasih sudah menggunakan layanan GovConnect. Jangan ragu untuk melapor lagi jika ada kendala lainnya ya! 🙏`;
      return selesaiMsg;
    
    case 'ditolak':
      let ditolakMsg = `Halo Kak 🙏\n\nMohon maaf, ${type} *${id}* tidak dapat kami proses.`;
      if (adminNotes) {
        ditolakMsg += `\n\n💬 Alasan:\n_"${adminNotes}"_`;
      }
      ditolakMsg += `\n\nJika ada pertanyaan, silakan hubungi kantor kelurahan langsung atau kirim pesan baru ke sini ya.`;
      return ditolakMsg;
    
    default:
      let defaultMsg = `Halo Kak! 📢\n\nAda update untuk ${type} *${id}* dengan status: ${status}.`;
      if (adminNotes) {
        defaultMsg += `\n\n💬 _"${adminNotes}"_`;
      }
      return defaultMsg;
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

function formatJenis(jenis: string): string {
  const map: Record<string, string> = {
    surat_keterangan: 'Surat Keterangan',
    surat_pengantar: 'Surat Pengantar',
    izin_keramaian: 'Izin Keramaian'
  };
  return map[jenis] || jenis;
}
