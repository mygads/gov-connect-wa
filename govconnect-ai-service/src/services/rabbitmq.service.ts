import amqplib from 'amqplib';
import logger from '../utils/logger';
import { config } from '../config/env';
import { RABBITMQ_CONFIG } from '../config/rabbitmq';
import { MessageReceivedEvent, AIReplyEvent, AIErrorEvent, MessageStatusEvent } from '../types/event.types';

let connection: any = null;
let channel: any = null;
let isReconnecting = false;
let reconnectAttempts = 0;
let messageHandler: ((event: MessageReceivedEvent) => Promise<void>) | null = null;

// Reconnection configuration with exponential backoff
const RECONNECT_CONFIG = {
  BASE_DELAY_MS: 1000,       // Initial delay: 1 second
  MAX_DELAY_MS: 30000,       // Max delay: 30 seconds  
  MAX_ATTEMPTS: 0,           // 0 = infinite attempts
  JITTER_FACTOR: 0.3,        // 30% random jitter
};

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateReconnectDelay(attempt: number): number {
  const exponentialDelay = RECONNECT_CONFIG.BASE_DELAY_MS * Math.pow(2, Math.min(attempt, 10)); // Cap exponent at 10
  const jitter = exponentialDelay * RECONNECT_CONFIG.JITTER_FACTOR * Math.random();
  return Math.min(RECONNECT_CONFIG.MAX_DELAY_MS, exponentialDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleepMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Flag to prevent reconnect during graceful shutdown
let isShuttingDown = false;

/**
 * Handle reconnection with exponential backoff
 */
async function handleReconnect(): Promise<void> {
  // Don't reconnect if we're shutting down
  if (isShuttingDown) {
    logger.info('🛑 Shutdown in progress, skipping reconnection');
    return;
  }
  
  if (isReconnecting) {
    logger.debug('Reconnection already in progress, skipping...');
    return;
  }
  
  isReconnecting = true;
  
  while (!isShuttingDown) {
    reconnectAttempts++;
    const delay = calculateReconnectDelay(reconnectAttempts);
    
    logger.warn(`🔄 Attempting RabbitMQ reconnection (attempt ${reconnectAttempts})`, {
      delayMs: delay,
      attempt: reconnectAttempts,
    });
    
    await sleepMs(delay);
    
    // Check again after sleep
    if (isShuttingDown) {
      logger.info('🛑 Shutdown detected during reconnect delay, aborting');
      isReconnecting = false;
      return;
    }
    
    try {
      await connectRabbitMQ();
      
      // Reconnect successful - restart consuming if handler was set
      if (messageHandler) {
        await startConsuming(messageHandler);
      }
      
      logger.info('✅ RabbitMQ reconnected successfully after ' + reconnectAttempts + ' attempts');
      reconnectAttempts = 0;
      isReconnecting = false;
      return;
    } catch (error: any) {
      logger.error('❌ RabbitMQ reconnection failed', {
        attempt: reconnectAttempts,
        error: error.message,
        nextDelayMs: calculateReconnectDelay(reconnectAttempts + 1),
      });
      
      // Check max attempts (0 = infinite)
      if (RECONNECT_CONFIG.MAX_ATTEMPTS > 0 && reconnectAttempts >= RECONNECT_CONFIG.MAX_ATTEMPTS) {
        logger.error('🚨 Max reconnection attempts reached, giving up');
        isReconnecting = false;
        throw new Error('RabbitMQ reconnection failed after max attempts');
      }
    }
  }
}

/**
 * ==================== MESSAGE BATCHING ====================
 * Collect multiple messages from same user and combine them
 */

interface PendingBatch {
  messages: MessageReceivedEvent[];
  timer: NodeJS.Timeout | null;
  firstMessageTime: number;
}

// Pending batches per user
const pendingBatches: Map<string, PendingBatch> = new Map();

/**
 * Add message to batch and process when ready
 */
async function addToBatch(
  event: MessageReceivedEvent,
  onProcess: (batchedEvent: MessageReceivedEvent) => Promise<void>,
  ackCallback: () => void
): Promise<void> {
  const { wa_user_id } = event;
  
  let batch = pendingBatches.get(wa_user_id);
  
  if (!batch) {
    // Create new batch
    batch = {
      messages: [],
      timer: null,
      firstMessageTime: Date.now(),
    };
    pendingBatches.set(wa_user_id, batch);
  }
  
  // Add message to batch
  batch.messages.push(event);
  
  // Clear existing timer
  if (batch.timer) {
    clearTimeout(batch.timer);
  }
  
  // Check if we should process immediately
  const shouldProcessNow = 
    batch.messages.length >= RABBITMQ_CONFIG.BATCHING.MAX_MESSAGES_PER_BATCH ||
    Date.now() - batch.firstMessageTime > RABBITMQ_CONFIG.BATCHING.BATCH_WINDOW_MS;
  
  if (shouldProcessNow) {
    await processBatch(wa_user_id, onProcess, ackCallback);
  } else {
    // Set timer to process batch after max wait time
    batch.timer = setTimeout(async () => {
      await processBatch(wa_user_id, onProcess, ackCallback);
    }, RABBITMQ_CONFIG.BATCHING.MAX_WAIT_MS);
  }
}

/**
 * Process a batch of messages for a user
 */
async function processBatch(
  wa_user_id: string,
  onProcess: (event: MessageReceivedEvent) => Promise<void>,
  ackCallback: () => void
): Promise<void> {
  const batch = pendingBatches.get(wa_user_id);
  if (!batch || batch.messages.length === 0) return;
  
  // Clear timer and remove from pending
  if (batch.timer) {
    clearTimeout(batch.timer);
  }
  pendingBatches.delete(wa_user_id);
  
  const messages = batch.messages;
  
  if (messages.length === 1) {
    // Single message - process normally
    logger.info('📨 Processing single message', {
      wa_user_id,
      message_id: messages[0].message_id,
    });
    await onProcess(messages[0]);
  } else {
    // Multiple messages - combine them
    logger.info('📦 Batching multiple messages', {
      wa_user_id,
      count: messages.length,
      message_ids: messages.map(m => m.message_id),
    });
    
    // Combine messages with context
    const combinedMessage = combineMessages(messages);
    
    // Create batched event
    const batchedEvent: MessageReceivedEvent = {
      wa_user_id,
      message: combinedMessage,
      message_id: messages[messages.length - 1].message_id, // Use latest message ID
      received_at: messages[messages.length - 1].received_at,
      is_batched: true,
      batched_message_ids: messages.map(m => m.message_id),
      original_messages: messages.map(m => m.message),
      // Take media from any message that has it
      has_media: messages.some(m => m.has_media),
      media_type: messages.find(m => m.has_media)?.media_type,
      media_url: messages.find(m => m.has_media)?.media_url,
      media_public_url: messages.find(m => m.has_media)?.media_public_url,
      media_caption: messages.find(m => m.has_media)?.media_caption,
    };
    
    await onProcess(batchedEvent);
  }
  
  // Acknowledge all messages in batch
  ackCallback();
}

/**
 * Combine multiple messages into a single message with context
 */
function combineMessages(messages: MessageReceivedEvent[]): string {
  if (messages.length === 1) {
    return messages[0].message;
  }
  
  // Format combined message
  const parts: string[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i].message.trim();
    if (msg) {
      // Add message with numbering if multiple
      if (messages.length > 2) {
        parts.push(`${i + 1}. ${msg}`);
      } else {
        parts.push(msg);
      }
    }
  }
  
  // Join messages naturally
  if (parts.length === 2) {
    return parts.join(' dan ');
  } else {
    return parts.join('\n');
  }
}

/**
 * ==================== RETRY QUEUE CONFIGURATION ====================
 */

interface QueuedMessage {
  payload: AIReplyEvent | AIErrorEvent | MessageStatusEvent;
  type: 'reply' | 'error' | 'status';
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

// In-memory retry queue for failed publishes
const retryQueue: QueuedMessage[] = [];
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;      // 5 seconds between retries
const MAX_QUEUE_SIZE = 1000;       // Prevent memory overflow
let retryIntervalId: NodeJS.Timeout | null = null;

/**
 * Start retry worker
 */
function startRetryWorker(): void {
  if (retryIntervalId) return;
  
  retryIntervalId = setInterval(async () => {
    if (retryQueue.length === 0) return;
    if (!isConnected()) {
      logger.warn('⏳ RabbitMQ not connected, retry worker waiting...');
      return;
    }
    
    // Process up to 10 messages per cycle
    const toProcess = retryQueue.splice(0, 10);
    
    for (const item of toProcess) {
      try {
        if (item.type === 'reply') {
          await publishAIReplyDirect(item.payload as AIReplyEvent);
          logger.info('✅ Retry successful for AI reply', {
            wa_user_id: (item.payload as AIReplyEvent).wa_user_id,
            attempts: item.attempts,
          });
        } else if (item.type === 'error') {
          await publishAIErrorDirect(item.payload as AIErrorEvent);
          logger.info('✅ Retry successful for AI error', {
            wa_user_id: (item.payload as AIErrorEvent).wa_user_id,
            attempts: item.attempts,
          });
        } else if (item.type === 'status') {
          await publishMessageStatusDirect(item.payload as MessageStatusEvent);
          logger.info('✅ Retry successful for message status', {
            wa_user_id: (item.payload as MessageStatusEvent).wa_user_id,
            attempts: item.attempts,
          });
        }
      } catch (error: any) {
        item.attempts++;
        item.lastAttempt = Date.now();
        
        if (item.attempts < MAX_RETRY_ATTEMPTS) {
          // Re-queue for later
          retryQueue.push(item);
          logger.warn('⚠️ Retry failed, re-queuing', {
            type: item.type,
            attempts: item.attempts,
            error: error.message,
          });
        } else {
          // Max retries exceeded - log and drop
          logger.error('❌ Max retries exceeded, dropping message', {
            type: item.type,
            payload: item.payload,
            attempts: item.attempts,
            firstAttempt: new Date(item.firstAttempt).toISOString(),
          });
        }
      }
    }
  }, RETRY_DELAY_MS);
  
  logger.info('🔄 Retry worker started');
}

/**
 * Stop retry worker
 */
function stopRetryWorker(): void {
  if (retryIntervalId) {
    clearInterval(retryIntervalId);
    retryIntervalId = null;
  }
}

/**
 * Add message to retry queue
 */
function addToRetryQueue(
  payload: AIReplyEvent | AIErrorEvent | MessageStatusEvent, 
  type: 'reply' | 'error' | 'status'
): void {
  if (retryQueue.length >= MAX_QUEUE_SIZE) {
    // Drop oldest message to make room
    const dropped = retryQueue.shift();
    logger.error('⚠️ Retry queue full, dropped oldest message', {
      droppedType: dropped?.type,
      queueSize: retryQueue.length,
    });
  }
  
  retryQueue.push({
    payload,
    type,
    attempts: 1,
    firstAttempt: Date.now(),
    lastAttempt: Date.now(),
  });
  
  logger.info('📥 Message added to retry queue', {
    type,
    queueSize: retryQueue.length,
  });
}

/**
 * Connect to RabbitMQ with auto-reconnect capability
 */
export async function connectRabbitMQ(): Promise<void> {
  try {
    // Close existing connections if any
    if (channel) {
      try { await channel.close(); } catch (e) { /* ignore */ }
      channel = null;
    }
    if (connection) {
      try { await connection.close(); } catch (e) { /* ignore */ }
      connection = null;
    }
    
    const conn: any = await amqplib.connect(config.rabbitmqUrl);
    connection = conn;
    channel = await conn.createChannel();
    
    // Assert exchange
    await channel.assertExchange(
      RABBITMQ_CONFIG.EXCHANGE_NAME,
      RABBITMQ_CONFIG.EXCHANGE_TYPE,
      { durable: true }
    );
    
    // Handle connection errors - trigger reconnect
    connection.on('error', (err: Error) => {
      logger.error('RabbitMQ connection error', { error: err.message });
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed unexpectedly');
      // Trigger reconnection if not shutting down gracefully
      if (!isReconnecting && connection !== null) {
        connection = null;
        channel = null;
        handleReconnect().catch(err => {
          logger.error('Failed to handle reconnection', { error: err.message });
        });
      }
    });
    
    // Handle channel errors
    channel.on('error', (err: Error) => {
      logger.error('RabbitMQ channel error', { error: err.message });
    });
    
    channel.on('close', () => {
      logger.warn('RabbitMQ channel closed');
    });
    
    // Start retry worker
    startRetryWorker();
    
    logger.info('✅ RabbitMQ connected successfully', {
      exchange: RABBITMQ_CONFIG.EXCHANGE_NAME,
    });
  } catch (error: any) {
    logger.error('❌ RabbitMQ connection failed', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Start consuming messages from queue
 */
export async function startConsuming(
  onMessage: (event: MessageReceivedEvent) => Promise<void>
): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  
  // Store handler for reconnection
  messageHandler = onMessage;
  
  try {
    // Assert queue
    const queue = await channel.assertQueue(
      RABBITMQ_CONFIG.QUEUE_NAME,
      RABBITMQ_CONFIG.QUEUE_OPTIONS
    );
    
    // Bind queue to exchange
    await channel.bindQueue(
      queue.queue,
      RABBITMQ_CONFIG.EXCHANGE_NAME,
      RABBITMQ_CONFIG.ROUTING_KEY_CONSUME
    );
    
    logger.info('🎧 Started consuming messages', {
      queue: queue.queue,
      routingKey: RABBITMQ_CONFIG.ROUTING_KEY_CONSUME,
    });
    
    // Set prefetch - allow more messages for batching
    await channel.prefetch(RABBITMQ_CONFIG.BATCHING.MAX_MESSAGES_PER_BATCH);
    
    // Store ack callbacks for batching
    const pendingAcks: Map<string, amqplib.ConsumeMessage[]> = new Map();
    
    // Start consuming
    await channel.consume(
      queue.queue,
      async (msg: amqplib.ConsumeMessage | null) => {
        if (!msg) return;
        
        try {
          const content = msg.content.toString();
          const event: MessageReceivedEvent = JSON.parse(content);
          
          logger.info('📨 Message received from queue', {
            wa_user_id: event.wa_user_id,
            message_id: event.message_id,
          });
          
          if (RABBITMQ_CONFIG.BATCHING.ENABLED) {
            // Track pending acks for this user
            const userAcks = pendingAcks.get(event.wa_user_id) || [];
            userAcks.push(msg);
            pendingAcks.set(event.wa_user_id, userAcks);
            
            // Add to batch
            await addToBatch(event, onMessage, () => {
              // Ack all messages for this user
              const acks = pendingAcks.get(event.wa_user_id) || [];
              for (const ack of acks) {
                channel!.ack(ack);
              }
              pendingAcks.delete(event.wa_user_id);
              
              logger.debug('✅ Batch acknowledged', {
                wa_user_id: event.wa_user_id,
                count: acks.length,
              });
            });
          } else {
            // Process immediately without batching
            await onMessage(event);
            channel!.ack(msg);
            
            logger.debug('✅ Message acknowledged', {
              message_id: event.message_id,
            });
          }
        } catch (error: any) {
          logger.error('❌ Error processing message', {
            error: error.message,
            stack: error.stack,
          });
          
          // Check if message has been redelivered too many times
          // If so, reject without requeue to prevent infinite loop
          const redelivered = msg.fields.redelivered;
          if (redelivered) {
            logger.warn('⚠️ Message already redelivered, rejecting without requeue', {
              messageId: msg.fields.deliveryTag,
            });
            channel!.nack(msg, false, false); // Don't requeue
          } else {
            // First failure - requeue for retry
            channel!.nack(msg, false, true);
          }
        }
      },
      RABBITMQ_CONFIG.CONSUME_OPTIONS
    );
  } catch (error: any) {
    logger.error('❌ Failed to start consuming', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Publish AI reply event (direct - used by retry worker)
 */
async function publishAIReplyDirect(payload: AIReplyEvent): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  
  const message = Buffer.from(JSON.stringify(payload));
  
  channel.publish(
    RABBITMQ_CONFIG.EXCHANGE_NAME,
    RABBITMQ_CONFIG.ROUTING_KEY_AI_REPLY,
    message,
    { persistent: true }
  );
}

/**
 * Publish AI error event (direct - used by retry worker)
 */
async function publishAIErrorDirect(payload: AIErrorEvent): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  
  const message = Buffer.from(JSON.stringify(payload));
  
  channel.publish(
    RABBITMQ_CONFIG.EXCHANGE_NAME,
    RABBITMQ_CONFIG.ROUTING_KEY_AI_ERROR,
    message,
    { persistent: true }
  );
}

/**
 * Publish message status event (direct - used by retry worker)
 */
async function publishMessageStatusDirect(payload: MessageStatusEvent): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  
  const message = Buffer.from(JSON.stringify(payload));
  
  channel.publish(
    RABBITMQ_CONFIG.EXCHANGE_NAME,
    RABBITMQ_CONFIG.ROUTING_KEY_MESSAGE_STATUS,
    message,
    { persistent: true }
  );
}

/**
 * Publish AI reply event with retry support
 */
export async function publishAIReply(payload: AIReplyEvent): Promise<void> {
  try {
    if (!channel) {
      // Channel not available, queue for retry
      logger.warn('⚠️ RabbitMQ channel not available, queuing for retry');
      addToRetryQueue(payload, 'reply');
      return;
    }
    
    await publishAIReplyDirect(payload);
    
    logger.info('📤 AI reply event published', {
      routingKey: RABBITMQ_CONFIG.ROUTING_KEY_AI_REPLY,
      wa_user_id: payload.wa_user_id,
    });
  } catch (error: any) {
    logger.error('❌ Failed to publish AI reply, queuing for retry', {
      error: error.message,
      wa_user_id: payload.wa_user_id,
    });
    
    // Add to retry queue
    addToRetryQueue(payload, 'reply');
  }
}

/**
 * Publish AI error event with retry support
 */
export async function publishAIError(payload: AIErrorEvent): Promise<void> {
  try {
    if (!channel) {
      logger.warn('⚠️ RabbitMQ channel not available, queuing for retry');
      addToRetryQueue(payload, 'error');
      return;
    }
    
    await publishAIErrorDirect(payload);
    
    logger.info('📤 AI error event published', {
      routingKey: RABBITMQ_CONFIG.ROUTING_KEY_AI_ERROR,
      wa_user_id: payload.wa_user_id,
      error: payload.error_message,
    });
  } catch (error: any) {
    logger.error('❌ Failed to publish AI error, queuing for retry', {
      error: error.message,
      wa_user_id: payload.wa_user_id,
    });
    
    // Add to retry queue
    addToRetryQueue(payload, 'error');
  }
}

/**
 * Publish message status event with retry support
 */
export async function publishMessageStatus(payload: MessageStatusEvent): Promise<void> {
  try {
    if (!channel) {
      logger.warn('⚠️ RabbitMQ channel not available, queuing for retry');
      addToRetryQueue(payload, 'status');
      return;
    }
    
    await publishMessageStatusDirect(payload);
    
    logger.info('📤 Message status event published', {
      routingKey: RABBITMQ_CONFIG.ROUTING_KEY_MESSAGE_STATUS,
      wa_user_id: payload.wa_user_id,
      status: payload.status,
    });
  } catch (error: any) {
    logger.error('❌ Failed to publish message status, queuing for retry', {
      error: error.message,
      wa_user_id: payload.wa_user_id,
    });
    
    addToRetryQueue(payload, 'status');
  }
}

/**
 * Gracefully disconnect from RabbitMQ
 * - Stops accepting new messages
 * - Waits for current processing to complete (with timeout)
 * - Cleans up resources properly
 */
export async function disconnectRabbitMQ(): Promise<void> {
  isShuttingDown = true;
  
  try {
    logger.info('🛑 Starting graceful RabbitMQ shutdown...');
    
    // Stop retry worker first
    stopRetryWorker();
    
    // Log any remaining items in retry queue
    if (retryQueue.length > 0) {
      logger.warn('⚠️ Disconnecting with items in retry queue', {
        queueSize: retryQueue.length,
      });
    }
    
    // Cancel consumers first (stop accepting new messages)
    if (channel) {
      try {
        // Give some time for in-flight messages to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        await channel.close();
        logger.info('✅ Channel closed gracefully');
      } catch (error: any) {
        // Channel might already be closed
        if (!error.message?.includes('Channel closed')) {
          logger.warn('⚠️ Error closing channel', { error: error.message });
        }
      }
      channel = null;
    }
    
    if (connection) {
      try {
        await connection.close();
        logger.info('✅ Connection closed gracefully');
      } catch (error: any) {
        // Connection might already be closed
        if (!error.message?.includes('Connection closed')) {
          logger.warn('⚠️ Error closing connection', { error: error.message });
        }
      }
      connection = null;
    }
    
    // Clear saved handler
    messageHandler = null;
    
    logger.info('🔌 RabbitMQ disconnected gracefully');
  } catch (error: any) {
    logger.error('Error during graceful disconnect', {
      error: error.message,
    });
  }
}

/**
 * Check if RabbitMQ is connected and ready
 * - Verifies both connection and channel exist
 * - Checks that connection is not closed
 */
export function isConnected(): boolean {
  if (!connection || !channel) {
    return false;
  }
  
  // Check if connection is actually open
  // amqplib connection has a 'connection' property with 'stream' that can tell us
  try {
    // Type assertion needed because amqplib types don't expose this
    const conn = connection as any;
    if (conn.connection && conn.connection.stream) {
      return !conn.connection.stream.destroyed;
    }
  } catch {
    // If we can't check, assume connected if objects exist
  }
  
  return true;
}

/**
 * Check if we're in shutdown mode
 */
export function isShuttingDownRabbitMQ(): boolean {
  return isShuttingDown;
}

/**
 * Get retry queue status (for monitoring)
 */
export function getRetryQueueStatus(): {
  queueSize: number;
  oldestItem: number | null;
} {
  return {
    queueSize: retryQueue.length,
    oldestItem: retryQueue.length > 0 ? retryQueue[0].firstAttempt : null,
  };
}
