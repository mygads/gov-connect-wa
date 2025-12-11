/**
 * Adaptive Message Batcher Service
 * 
 * Intelligent batching that adjusts delay based on:
 * - User typing patterns
 * - Message length
 * - Time of day
 * - User history
 * 
 * Benefits:
 * - Faster response for quick typers
 * - Longer wait for slow typers (to capture full message)
 * - Reduced API calls while maintaining responsiveness
 */

import logger from '../utils/logger';

// ==================== TYPES ====================

export interface UserTypingStats {
  userId: string;
  avgTypingSpeed: number;      // chars per second
  avgMessageLength: number;    // average message length
  avgTimeBetweenMessages: number; // ms between messages
  messageCount: number;
  lastMessageTime: number;
  lastMessageLength: number;
}

export interface AdaptiveDelayConfig {
  minDelayMs: number;          // Minimum delay (default 1500ms)
  maxDelayMs: number;          // Maximum delay (default 5000ms)
  defaultDelayMs: number;      // Default delay for new users (default 3000ms)
}

// ==================== CONFIGURATION ====================

const DEFAULT_CONFIG: AdaptiveDelayConfig = {
  minDelayMs: 1500,            // 1.5 seconds minimum
  maxDelayMs: 5000,            // 5 seconds maximum
  defaultDelayMs: 3000,        // 3 seconds default
};

// ==================== STORAGE ====================

// User typing statistics
const userStats = new Map<string, UserTypingStats>();

// Cleanup old stats (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [userId, stats] of userStats.entries()) {
    if (now - stats.lastMessageTime > maxAge) {
      userStats.delete(userId);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

// ==================== CORE FUNCTIONS ====================

/**
 * Calculate adaptive delay for a user
 */
export function calculateAdaptiveDelay(
  userId: string,
  currentMessageLength: number,
  config: AdaptiveDelayConfig = DEFAULT_CONFIG
): number {
  const stats = userStats.get(userId);
  
  // New user - use default delay
  if (!stats || stats.messageCount < 3) {
    logger.debug('[AdaptiveBatcher] New user, using default delay', { 
      userId, 
      delay: config.defaultDelayMs 
    });
    return config.defaultDelayMs;
  }
  
  let delay = config.defaultDelayMs;
  
  // Factor 1: Typing speed
  // Fast typers (>5 chars/sec) get shorter delay
  // Slow typers (<2 chars/sec) get longer delay
  if (stats.avgTypingSpeed > 5) {
    delay -= 500; // Fast typer
  } else if (stats.avgTypingSpeed < 2) {
    delay += 500; // Slow typer
  }
  
  // Factor 2: Message length pattern
  // If current message is much shorter than average, user might be typing more
  if (currentMessageLength < stats.avgMessageLength * 0.5) {
    delay += 500; // Likely more messages coming
  } else if (currentMessageLength > stats.avgMessageLength * 1.5) {
    delay -= 300; // Long message, probably complete
  }
  
  // Factor 3: Time between messages
  // If user typically sends messages quickly, reduce delay
  if (stats.avgTimeBetweenMessages < 2000) {
    delay -= 300; // User sends rapid messages
  } else if (stats.avgTimeBetweenMessages > 5000) {
    delay += 300; // User takes time between messages
  }
  
  // Factor 4: Time of day (optional)
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 17) {
    // Business hours - slightly faster response
    delay -= 200;
  }
  
  // Clamp to min/max
  delay = Math.max(config.minDelayMs, Math.min(config.maxDelayMs, delay));
  
  logger.debug('[AdaptiveBatcher] Calculated adaptive delay', {
    userId,
    delay,
    avgTypingSpeed: stats.avgTypingSpeed.toFixed(2),
    avgMessageLength: stats.avgMessageLength.toFixed(0),
    currentMessageLength,
  });
  
  return delay;
}

/**
 * Record a message for typing stats
 */
export function recordMessage(
  userId: string,
  messageLength: number,
  typingDurationMs?: number
): void {
  const now = Date.now();
  let stats = userStats.get(userId);
  
  if (!stats) {
    stats = {
      userId,
      avgTypingSpeed: 3, // Default assumption
      avgMessageLength: 50,
      avgTimeBetweenMessages: 3000,
      messageCount: 0,
      lastMessageTime: now,
      lastMessageLength: messageLength,
    };
  }
  
  // Calculate typing speed if duration provided
  if (typingDurationMs && typingDurationMs > 0) {
    const typingSpeed = (messageLength / typingDurationMs) * 1000; // chars per second
    stats.avgTypingSpeed = updateRollingAverage(
      stats.avgTypingSpeed,
      typingSpeed,
      stats.messageCount
    );
  }
  
  // Update message length average
  stats.avgMessageLength = updateRollingAverage(
    stats.avgMessageLength,
    messageLength,
    stats.messageCount
  );
  
  // Update time between messages
  if (stats.lastMessageTime > 0) {
    const timeBetween = now - stats.lastMessageTime;
    if (timeBetween < 60000) { // Only count if within 1 minute
      stats.avgTimeBetweenMessages = updateRollingAverage(
        stats.avgTimeBetweenMessages,
        timeBetween,
        stats.messageCount
      );
    }
  }
  
  stats.messageCount++;
  stats.lastMessageTime = now;
  stats.lastMessageLength = messageLength;
  
  userStats.set(userId, stats);
}

/**
 * Get user typing stats
 */
export function getUserStats(userId: string): UserTypingStats | null {
  return userStats.get(userId) || null;
}

/**
 * Check if user is likely still typing
 * Based on pattern analysis
 */
export function isLikelyStillTyping(
  userId: string,
  currentMessageLength: number,
  timeSinceLastMessage: number
): boolean {
  const stats = userStats.get(userId);
  
  if (!stats || stats.messageCount < 3) {
    // Not enough data, assume might be typing if recent
    return timeSinceLastMessage < 3000;
  }
  
  // Check if message is unusually short
  const isShortMessage = currentMessageLength < stats.avgMessageLength * 0.4;
  
  // Check if time since last message is within typical pattern
  const isWithinTypingWindow = timeSinceLastMessage < stats.avgTimeBetweenMessages * 1.5;
  
  // Likely still typing if message is short AND within typical window
  return isShortMessage && isWithinTypingWindow;
}

// ==================== HELPERS ====================

/**
 * Update rolling average (exponential moving average)
 */
function updateRollingAverage(
  currentAvg: number,
  newValue: number,
  count: number,
  alpha: number = 0.3
): number {
  if (count === 0) return newValue;
  
  // Use exponential moving average for recent bias
  return currentAvg * (1 - alpha) + newValue * alpha;
}

/**
 * Get all user stats (for monitoring)
 */
export function getAllUserStats(): UserTypingStats[] {
  return Array.from(userStats.values());
}

/**
 * Get adaptive batcher statistics
 */
export function getAdaptiveBatcherStats(): {
  trackedUsers: number;
  avgTypingSpeed: number;
  avgMessageLength: number;
} {
  const allStats = Array.from(userStats.values());
  
  if (allStats.length === 0) {
    return {
      trackedUsers: 0,
      avgTypingSpeed: 0,
      avgMessageLength: 0,
    };
  }
  
  const totalTypingSpeed = allStats.reduce((sum, s) => sum + s.avgTypingSpeed, 0);
  const totalMessageLength = allStats.reduce((sum, s) => sum + s.avgMessageLength, 0);
  
  return {
    trackedUsers: allStats.length,
    avgTypingSpeed: totalTypingSpeed / allStats.length,
    avgMessageLength: totalMessageLength / allStats.length,
  };
}

// ==================== EXPORTS ====================

export default {
  calculateAdaptiveDelay,
  recordMessage,
  getUserStats,
  isLikelyStillTyping,
  getAllUserStats,
  getAdaptiveBatcherStats,
  DEFAULT_CONFIG,
};
