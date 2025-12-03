export const RABBITMQ_CONFIG = {
  EXCHANGE_NAME: 'govconnect.events',
  EXCHANGE_TYPE: 'topic',
  
  // Consumer
  QUEUE_NAME: 'ai-service.whatsapp.message.#',
  ROUTING_KEY_CONSUME: 'whatsapp.message.received',
  
  // Publisher
  ROUTING_KEY_AI_REPLY: 'govconnect.ai.reply',
  ROUTING_KEY_AI_ERROR: 'govconnect.ai.error',
  ROUTING_KEY_MESSAGE_STATUS: 'govconnect.message.status',
  
  // Options
  QUEUE_OPTIONS: {
    durable: true,
    autoDelete: false,
  },
  
  CONSUME_OPTIONS: {
    noAck: false, // Manual acknowledgment
  },
  
  // Message batching configuration
  BATCHING: {
    ENABLED: true,
    MAX_WAIT_MS: 3000,          // Wait up to 3 seconds to batch messages
    MAX_MESSAGES_PER_BATCH: 10, // Max messages to combine
    BATCH_WINDOW_MS: 5000,      // Time window to collect messages for same user
  },
};
