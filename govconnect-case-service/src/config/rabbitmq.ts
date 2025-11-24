export const RABBITMQ_CONFIG = {
  EXCHANGE_NAME: 'govconnect.events',
  EXCHANGE_TYPE: 'topic',
  ROUTING_KEYS: {
    COMPLAINT_CREATED: 'govconnect.complaint.created',
    TICKET_CREATED: 'govconnect.ticket.created',
    STATUS_UPDATED: 'govconnect.status.updated',
  },
};
