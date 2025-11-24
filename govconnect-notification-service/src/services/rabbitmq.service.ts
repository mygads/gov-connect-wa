import amqp, { Channel, ConsumeMessage } from 'amqplib';
import config from '../config/env';
import { RABBITMQ_CONFIG } from '../config/rabbitmq';
import logger from '../utils/logger';

let connection: any = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  try {
    logger.info('Connecting to RabbitMQ...', { url: config.rabbitmqUrl });

    const conn = await amqp.connect(config.rabbitmqUrl);
    connection = conn;
    channel = await connection.createChannel();

    // Assert exchange
    if (channel) {
      await channel.assertExchange(
        RABBITMQ_CONFIG.exchange,
        RABBITMQ_CONFIG.exchangeType,
        { durable: RABBITMQ_CONFIG.durable }
      );
    }

    logger.info('✅ RabbitMQ connected successfully');

    // Handle connection errors
    connection.on('error', (err: any) => {
      logger.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });

  } catch (error: any) {
    logger.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

export async function startConsumer(
  handler: (routingKey: string, message: any) => Promise<void>
): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  // Create queue for this service
  const queueName = 'notification-service-queue';
  
  await channel.assertQueue(queueName, {
    durable: true,
    arguments: {
      'x-message-ttl': 86400000 // 24 hours
    }
  });

  // Bind queue to exchange with routing keys
  const routingKeys = Object.values(RABBITMQ_CONFIG.routingKeys);
  
  for (const routingKey of routingKeys) {
    await channel.bindQueue(queueName, RABBITMQ_CONFIG.exchange, routingKey);
    logger.info(`Queue bound to routing key: ${routingKey}`);
  }

  // Set prefetch to process one message at a time
  await channel.prefetch(1);

  logger.info(`✅ Consumer started on queue: ${queueName}`);

  // Start consuming
  await channel.consume(
    queueName,
    async (msg: ConsumeMessage | null) => {
      if (!msg) {
        return;
      }

      const routingKey = msg.fields.routingKey;
      const content = msg.content.toString();

      try {
        const data = JSON.parse(content);
        
        logger.info('Received event', {
          routingKey,
          data
        });

        // Process message
        await handler(routingKey, data);

        // Acknowledge message
        channel!.ack(msg);
        
        logger.info('Event processed successfully', { routingKey });

      } catch (error: any) {
        logger.error('Error processing message', {
          routingKey,
          error: error.message,
          content
        });

        // Reject message and requeue if not a parsing error
        if (error instanceof SyntaxError) {
          // Don't requeue if JSON is invalid
          channel!.nack(msg, false, false);
          logger.warn('Message rejected (invalid JSON)', { routingKey });
        } else {
          // Requeue for retry
          channel!.nack(msg, false, true);
          logger.warn('Message requeued for retry', { routingKey });
        }
      }
    },
    { noAck: false }
  );
}

export async function disconnectRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      logger.info('RabbitMQ channel closed');
    }

    if (connection) {
      await connection.close();
      logger.info('RabbitMQ connection closed');
    }
  } catch (error: any) {
    logger.error('Error closing RabbitMQ connection:', error);
  }
}

export function isConnected(): boolean {
  return connection !== null && channel !== null;
}
