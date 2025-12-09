export interface AIReplyEvent {
  wa_user_id: string;
  reply_text: string;
}

export interface ComplaintCreatedEvent {
  wa_user_id: string;
  complaint_id: string;
  kategori: string;
}

export interface ReservationCreatedEvent {
  wa_user_id: string;
  reservation_id: string;
  service_code: string;
  service_name: string;
  reservation_date: string;
  reservation_time: string;
}

export interface StatusUpdatedEvent {
  wa_user_id: string;
  complaint_id?: string;
  reservation_id?: string;
  status: string;
  admin_notes?: string;
}

export interface UrgentAlertEvent {
  type: string;
  complaint_id: string;
  kategori: string;
  deskripsi: string;
  alamat?: string;
  rt_rw?: string;
  wa_user_id: string;
  created_at: string;
}
