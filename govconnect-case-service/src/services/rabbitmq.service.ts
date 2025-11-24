import amqplib from 'amqplib';
import logger from '../utils/logger';
import { config } from '../config/env';
import { RABBITMQ_CONFIG } from '../config/rabbitmq';

let connection: any = null;
let channel: any = null;

/**
 * Connect to RabbitMQ and assert exchange
 */
export async function connectRabbitMQ(): Promise<void> {
  try {
    const conn: any = await amqplib.connect(config.rabbitmqUrl);
    connection = conn;
    channel = await conn.createChannel();
    
    // Assert exchange
    await channel.assertExchange(
      RABBITMQ_CONFIG.EXCHANGE_NAME,
      RABBITMQ_CONFIG.EXCHANGE_TYPE,
      { durable: true }
    );
    
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
 * Publish event to RabbitMQ
 */
export async function publishEvent(routingKey: string, data: any): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  
  try {
    const message = Buffer.from(JSON.stringify(data));
    
    channel.publish(
      RABBITMQ_CONFIG.EXCHANGE_NAME,
      routingKey,
      message,
      { persistent: true }
    );
    
    logger.info('📤 Event published', {
      routingKey,
      data,
    });
  } catch (error: any) {
    logger.error('❌ Failed to publish event', {
      routingKey,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Disconnect from RabbitMQ
 */
export async function disconnectRabbitMQ(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    
    logger.info('🔌 RabbitMQ disconnected');
  } catch (error: any) {
    logger.error('Error disconnecting RabbitMQ', {
      error: error.message,
    });
  }
}

/**
 * Check if RabbitMQ is connected
 */
export function isConnected(): boolean {
  return connection !== null && channel !== null;
}
