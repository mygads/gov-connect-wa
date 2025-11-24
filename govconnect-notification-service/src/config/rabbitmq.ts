export const RABBITMQ_CONFIG = {
  exchange: 'govconnect.events',
  exchangeType: 'topic' as const,
  durable: true,
  queues: {
    notification: 'notification-service.events.#'
  },
  routingKeys: {
    aiReply: 'govconnect.ai.reply',
    complaintCreated: 'govconnect.complaint.created',
    ticketCreated: 'govconnect.ticket.created',
    statusUpdated: 'govconnect.status.updated'
  }
};
