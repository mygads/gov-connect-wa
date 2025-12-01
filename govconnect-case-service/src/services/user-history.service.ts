import prisma from '../config/database';
import logger from '../utils/logger';

export interface HistoryItem {
  type: 'complaint' | 'ticket';
  id: string;
  display_id: string;
  description: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserHistoryResult {
  complaints: any[];
  tickets: any[];
  combined: HistoryItem[];
  total: number;
}

/**
 * Get user's complaint and ticket history
 */
export async function getUserHistory(wa_user_id: string): Promise<UserHistoryResult> {
  try {
    // Fetch complaints and tickets in parallel
    const [complaints, tickets] = await Promise.all([
      prisma.complaint.findMany({
        where: { wa_user_id },
        orderBy: { created_at: 'desc' },
        take: 20, // Limit to last 20 items
        select: {
          id: true,
          complaint_id: true,
          kategori: true,
          deskripsi: true,
          alamat: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.ticket.findMany({
        where: { wa_user_id },
        orderBy: { created_at: 'desc' },
        take: 20, // Limit to last 20 items
        select: {
          id: true,
          ticket_id: true,
          jenis: true,
          data_json: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    // Combine and sort by date
    const combined: HistoryItem[] = [
      ...complaints.map((c) => ({
        type: 'complaint' as const,
        id: c.id,
        display_id: c.complaint_id,
        description: c.deskripsi || getKategoriLabel(c.kategori),
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
      })),
      ...tickets.map((t) => ({
        type: 'ticket' as const,
        id: t.id,
        display_id: t.ticket_id,
        description: getTicketDescription(t.jenis, t.data_json),
        status: t.status,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
    ].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    logger.info('User history fetched', {
      wa_user_id,
      complaints: complaints.length,
      tickets: tickets.length,
    });

    return {
      complaints,
      tickets,
      combined,
      total: complaints.length + tickets.length,
    };
  } catch (error: any) {
    logger.error('Failed to fetch user history', {
      wa_user_id,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get readable label for complaint category
 */
function getKategoriLabel(kategori: string): string {
  const labels: Record<string, string> = {
    jalan_rusak: 'Jalan Rusak',
    lampu_mati: 'Lampu Mati',
    sampah: 'Sampah',
    drainase: 'Drainase',
    pohon_tumbang: 'Pohon Tumbang',
    fasilitas_rusak: 'Fasilitas Rusak',
    banjir: 'Banjir',
    lainnya: 'Lainnya',
  };
  return labels[kategori] || kategori;
}

/**
 * Get ticket description from jenis and data_json
 */
function getTicketDescription(jenis: string, data_json: any): string {
  // Try to get description from data_json first
  if (data_json && typeof data_json === 'object') {
    if (data_json.deskripsi) return data_json.deskripsi;
    if (data_json.keperluan) return data_json.keperluan;
  }

  // Fallback to jenis label
  const labels: Record<string, string> = {
    surat_keterangan: 'Surat Keterangan',
    surat_pengantar: 'Surat Pengantar',
    izin_keramaian: 'Izin Keramaian',
  };
  return labels[jenis] || jenis;
}
