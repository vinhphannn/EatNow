import { Injectable, Logger } from '@nestjs/common';

interface ChatMessage {
  id: string;
  senderType: 'customer' | 'driver' | 'restaurant';
  senderId: string;
  message: string;
  timestamp: Date;
  orderId: string;
}

interface ChatRoom {
  orderId: string;
  messages: ChatMessage[];
  lastActivity: Date;
  participantCount: number;
}

@Injectable()
export class ChatManager {
  private readonly logger = new Logger(ChatManager.name);
  
  // LRU Cache với TTL
  private chatRooms = new Map<string, ChatRoom>();
  private readonly MAX_MESSAGES_PER_ROOM = 100;
  private readonly MAX_ROOMS = 1000;
  private readonly ROOM_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MESSAGE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  // Access order for LRU
  private accessOrder: string[] = [];
  
  // Metrics
  private metrics = {
    totalMessages: 0,
    totalRooms: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Add a message to a chat room
   */
  addMessage(orderId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const chatMessage: ChatMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
    };

    // Get or create room
    let room = this.chatRooms.get(orderId);
    if (!room) {
      room = this.createRoom(orderId);
    }

    // Add message with LRU eviction
    this.addMessageToRoom(room, chatMessage);
    
    // Update access order
    this.updateAccessOrder(orderId);
    
    this.metrics.totalMessages++;
    
    this.logger.debug(`Added message to room ${orderId}: ${chatMessage.id}`);
    
    return chatMessage;
  }

  /**
   * Get messages from a chat room
   */
  getMessages(orderId: string, limit: number = 50, offset: number = 0): ChatMessage[] {
    const room = this.chatRooms.get(orderId);
    if (!room) {
      this.metrics.cacheMisses++;
      return [];
    }

    this.metrics.cacheHits++;
    this.updateAccessOrder(orderId);
    
    // Return messages with pagination
    const startIndex = Math.max(0, room.messages.length - limit - offset);
    const endIndex = room.messages.length - offset;
    
    return room.messages.slice(startIndex, endIndex);
  }

  /**
   * Get recent messages (last N messages)
   */
  getRecentMessages(orderId: string, count: number = 20): ChatMessage[] {
    const room = this.chatRooms.get(orderId);
    if (!room) {
      this.metrics.cacheMisses++;
      return [];
    }

    this.metrics.cacheHits++;
    this.updateAccessOrder(orderId);
    
    return room.messages.slice(-count);
  }

  /**
   * Update participant count for a room
   */
  updateParticipantCount(orderId: string, count: number): void {
    const room = this.chatRooms.get(orderId);
    if (room) {
      room.participantCount = count;
      room.lastActivity = new Date();
    }
  }

  /**
   * Get room statistics
   */
  getRoomStats(orderId: string): { messageCount: number; lastActivity: Date; participantCount: number } | null {
    const room = this.chatRooms.get(orderId);
    if (!room) return null;

    return {
      messageCount: room.messages.length,
      lastActivity: room.lastActivity,
      participantCount: room.participantCount,
    };
  }

  /**
   * Get all active rooms
   */
  getActiveRooms(): Array<{ orderId: string; messageCount: number; lastActivity: Date; participantCount: number }> {
    return Array.from(this.chatRooms.entries()).map(([orderId, room]) => ({
      orderId,
      messageCount: room.messages.length,
      lastActivity: room.lastActivity,
      participantCount: room.participantCount,
    }));
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0 
      ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
      : 0;

    return {
      ...this.metrics,
      activeRooms: this.chatRooms.size,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      averageMessagesPerRoom: this.calculateAverageMessagesPerRoom(),
    };
  }

  /**
   * Create a new chat room
   */
  private createRoom(orderId: string): ChatRoom {
    // Check if we need to evict rooms
    if (this.chatRooms.size >= this.MAX_ROOMS) {
      this.evictLeastRecentlyUsedRoom();
    }

    const room: ChatRoom = {
      orderId,
      messages: [],
      lastActivity: new Date(),
      participantCount: 0,
    };

    this.chatRooms.set(orderId, room);
    this.metrics.totalRooms++;
    
    this.logger.debug(`Created new chat room: ${orderId}`);
    
    return room;
  }

  /**
   * Add message to room with LRU eviction
   */
  private addMessageToRoom(room: ChatRoom, message: ChatMessage): void {
    room.messages.push(message);
    room.lastActivity = new Date();

    // Evict old messages if limit exceeded
    if (room.messages.length > this.MAX_MESSAGES_PER_ROOM) {
      const messagesToRemove = room.messages.length - this.MAX_MESSAGES_PER_ROOM;
      room.messages.splice(0, messagesToRemove);
      
      this.logger.debug(`Evicted ${messagesToRemove} old messages from room ${room.orderId}`);
    }
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(orderId: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(orderId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(orderId);
  }

  /**
   * Evict least recently used room
   */
  private evictLeastRecentlyUsedRoom(): void {
    if (this.accessOrder.length === 0) return;

    const lruOrderId = this.accessOrder[0];
    const room = this.chatRooms.get(lruOrderId);
    
    if (room) {
      this.chatRooms.delete(lruOrderId);
      this.accessOrder.shift();
      
      this.logger.debug(`Evicted LRU room: ${lruOrderId} with ${room.messages.length} messages`);
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate average messages per room
   */
  private calculateAverageMessagesPerRoom(): number {
    if (this.chatRooms.size === 0) return 0;
    
    const totalMessages = Array.from(this.chatRooms.values())
      .reduce((sum, room) => sum + room.messages.length, 0);
    
    return totalMessages / this.chatRooms.size;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupStaleRooms();
      this.cleanupStaleMessages();
    }, 60_000); // Every minute
  }

  /**
   * Cleanup stale rooms
   */
  private cleanupStaleRooms(): void {
    const now = Date.now();
    const staleRooms: string[] = [];

    for (const [orderId, room] of this.chatRooms.entries()) {
      const timeSinceActivity = now - room.lastActivity.getTime();
      
      if (timeSinceActivity > this.ROOM_TTL) {
        staleRooms.push(orderId);
      }
    }

    // Remove stale rooms
    staleRooms.forEach(orderId => {
      this.chatRooms.delete(orderId);
      const index = this.accessOrder.indexOf(orderId);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    });

    if (staleRooms.length > 0) {
      this.logger.log(`Cleaned up ${staleRooms.length} stale chat rooms`);
    }
  }

  /**
   * Cleanup stale messages
   */
  private cleanupStaleMessages(): void {
    const now = Date.now();
    let totalCleanedMessages = 0;

    for (const room of this.chatRooms.values()) {
      const initialLength = room.messages.length;
      
      // Remove messages older than TTL
      room.messages = room.messages.filter(message => {
        const messageAge = now - message.timestamp.getTime();
        return messageAge <= this.MESSAGE_TTL;
      });
      
      const cleanedCount = initialLength - room.messages.length;
      totalCleanedMessages += cleanedCount;
    }

    if (totalCleanedMessages > 0) {
      this.logger.log(`Cleaned up ${totalCleanedMessages} stale messages`);
    }
  }

  /**
   * Search messages in a room
   */
  searchMessages(orderId: string, query: string, limit: number = 20): ChatMessage[] {
    const room = this.chatRooms.get(orderId);
    if (!room) return [];

    const searchTerm = query.toLowerCase();
    const matchingMessages = room.messages.filter(message =>
      message.message.toLowerCase().includes(searchTerm)
    );

    return matchingMessages.slice(-limit);
  }

  /**
   * Get message count for a room
   */
  getMessageCount(orderId: string): number {
    const room = this.chatRooms.get(orderId);
    return room ? room.messages.length : 0;
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.chatRooms.clear();
    this.accessOrder = [];
    this.metrics = {
      totalMessages: 0,
      totalRooms: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

