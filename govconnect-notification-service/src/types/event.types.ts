export interface AIReplyEvent {
  wa_user_id: string;
  reply_text: string;
}

export interface ComplaintCreatedEvent {
  wa_user_id: string;
  complaint_id: string;
  kategori: string;
}

export interface TicketCreatedEvent {
  wa_user_id: string;
  ticket_id: string;
  jenis: string;
}

export interface StatusUpdatedEvent {
  wa_user_id: string;
  complaint_id?: string;
  ticket_id?: string;
  status: string;
  admin_notes?: string;
}
