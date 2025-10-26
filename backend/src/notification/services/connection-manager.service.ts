import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface ConnectionMetadata {
  userId: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: Set<string>;
}

interface RateLimitInfo {
  count: number;
  windowStart: number;
  blocked: boolean;
}

@Injectable()
export class ConnectionManager {
  private readonly logger = new Logger(ConnectionManager.name);
  
  // Connection tracking với metadata
  private connections = new Map<string, ConnectionMetadata>();
  private userConnections = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private roomOccupancy = new Map<string, Set<string>>(); // room -> Set<socketId>
  
  // Rate limiting per user
  private rateLimits = new Map<string, RateLimitInfo>();
  private readonly RATE_WINDOW = 60_000; // 1 minute
  private readonly MAX_CONNECTIONS_PER_USER = 3;
  private readonly MAX_EVENTS_PER_MINUTE = 100;
  
  // Connection limits
  private readonly MAX_TOTAL_CONNECTIONS = 10000;
  private readonly CONNECTION_TTL = 30 * 60 * 1000; // 30 minutes
  
  // Metrics
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    blockedConnections: 0,
    rateLimitedEvents: 0,
  };

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Register a new connection
   */
  registerConnection(socket: Socket, userId: string, role: string): boolean {
    // Check global connection limit
    if (this.connections.size >= this.MAX_TOTAL_CONNECTIONS) {
      this.logger.warn(`Connection limit reached: ${this.MAX_TOTAL_CONNECTIONS}`);
      return false;
    }

    // Check per-user connection limit
    const userSockets = this.userConnections.get(userId) || new Set();
    if (userSockets.size >= this.MAX_CONNECTIONS_PER_USER) {
      this.logger.warn(`User ${userId} connection limit reached: ${this.MAX_CONNECTIONS_PER_USER}`);
      return false;
    }

    // Cleanup existing connections for this user
    this.cleanupUserConnections(userId);

    // Create connection metadata
    const metadata: ConnectionMetadata = {
      userId,
      role,
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'] || 'unknown',
      connectedAt: new Date(),
      lastActivity: new Date(),
      rooms: new Set(),
    };

    // Register connection
    this.connections.set(socket.id, metadata);
    this.addUserConnection(userId, socket.id);
    
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    this.logger.debug(`Registered connection: ${socket.id} for user ${userId} (${role})`);
    return true;
  }

  /**
   * Unregister a connection
   */
  unregisterConnection(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    const { userId, rooms } = connection;

    // Leave all rooms
    rooms.forEach(room => {
      this.leaveRoom(socketId, room);
    });

    // Remove from tracking
    this.connections.delete(socketId);
    this.removeUserConnection(userId, socketId);
    
    this.metrics.activeConnections--;

    this.logger.debug(`Unregistered connection: ${socketId} for user ${userId}`);
  }

  /**
   * Join a room
   */
  joinRoom(socketId: string, room: string): boolean {
    const connection = this.connections.get(socketId);
    if (!connection) return false;

    connection.rooms.add(room);
    connection.lastActivity = new Date();

    // Track room occupancy
    if (!this.roomOccupancy.has(room)) {
      this.roomOccupancy.set(room, new Set());
    }
    this.roomOccupancy.get(room)!.add(socketId);

    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(socketId: string, room: string): boolean {
    const connection = this.connections.get(socketId);
    if (!connection) return false;

    connection.rooms.delete(room);

    // Update room occupancy
    const occupants = this.roomOccupancy.get(room);
    if (occupants) {
      occupants.delete(socketId);
      if (occupants.size === 0) {
        this.roomOccupancy.delete(room);
      }
    }

    return true;
  }

  /**
   * Check rate limit for a user
   */
  checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(userId) || { 
      count: 0, 
      windowStart: now, 
      blocked: false 
    };

    // Reset window if expired
    if (now - rateLimit.windowStart > this.RATE_WINDOW) {
      rateLimit.windowStart = now;
      rateLimit.count = 0;
      rateLimit.blocked = false;
    }

    // Check if user is blocked
    if (rateLimit.blocked) {
      this.metrics.rateLimitedEvents++;
      return false;
    }

    // Increment counter
    rateLimit.count++;
    this.rateLimits.set(userId, rateLimit);

    // Block if limit exceeded
    if (rateLimit.count > this.MAX_EVENTS_PER_MINUTE) {
      rateLimit.blocked = true;
      this.logger.warn(`Rate limit exceeded for user ${userId}`);
      return false;
    }

    return true;
  }

  /**
   * Get connection info
   */
  getConnection(socketId: string): ConnectionMetadata | undefined {
    return this.connections.get(socketId);
  }

  /**
   * Get user connections
   */
  getUserConnections(userId: string): string[] {
    return Array.from(this.userConnections.get(userId) || []);
  }

  /**
   * Get room occupants
   */
  getRoomOccupants(room: string): string[] {
    return Array.from(this.roomOccupancy.get(room) || []);
  }

  /**
   * Update activity timestamp
   */
  updateActivity(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      roomCount: this.roomOccupancy.size,
      userConnections: this.userConnections.size,
      averageConnectionsPerUser: this.calculateAverageConnectionsPerUser(),
    };
  }

  /**
   * Cleanup stale connections
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleConnections: string[] = [];

    for (const [socketId, connection] of this.connections.entries()) {
      const timeSinceActivity = now - connection.lastActivity.getTime();
      
      if (timeSinceActivity > this.CONNECTION_TTL) {
        staleConnections.push(socketId);
      }
    }

    // Disconnect stale connections
    staleConnections.forEach(socketId => {
      this.unregisterConnection(socketId);
      this.logger.debug(`Cleaned up stale connection: ${socketId}`);
    });

    if (staleConnections.length > 0) {
      this.logger.log(`Cleaned up ${staleConnections.length} stale connections`);
    }
  }

  /**
   * Cleanup user connections
   */
  private cleanupUserConnections(userId: string): void {
    const existingSockets = this.userConnections.get(userId);
    if (!existingSockets) return;

    for (const socketId of existingSockets) {
      this.unregisterConnection(socketId);
    }
  }

  /**
   * Add user connection
   */
  private addUserConnection(userId: string, socketId: string): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socketId);
  }

  /**
   * Remove user connection
   */
  private removeUserConnection(userId: string, socketId: string): void {
    const sockets = this.userConnections.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  /**
   * Calculate average connections per user
   */
  private calculateAverageConnectionsPerUser(): number {
    if (this.userConnections.size === 0) return 0;
    
    const totalConnections = Array.from(this.userConnections.values())
      .reduce((sum, sockets) => sum + sockets.size, 0);
    
    return totalConnections / this.userConnections.size;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupStaleConnections();
      this.cleanupStaleRateLimits();
    }, 60_000); // Every minute
  }

  /**
   * Cleanup stale rate limits
   */
  private cleanupStaleRateLimits(): void {
    const now = Date.now();
    const staleRateLimits: string[] = [];

    for (const [userId, rateLimit] of this.rateLimits.entries()) {
      if (now - rateLimit.windowStart > this.RATE_WINDOW * 2) {
        staleRateLimits.push(userId);
      }
    }

    staleRateLimits.forEach(userId => {
      this.rateLimits.delete(userId);
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const stats = {
      totalConnections: this.connections.size,
      activeConnections: this.metrics.activeConnections,
      roomCount: this.roomOccupancy.size,
      userCount: this.userConnections.size,
      topRooms: this.getTopRooms(10),
      connectionDistribution: this.getConnectionDistribution(),
    };

    return stats;
  }

  /**
   * Get top rooms by occupancy
   */
  private getTopRooms(limit: number): Array<{ room: string; count: number }> {
    return Array.from(this.roomOccupancy.entries())
      .map(([room, occupants]) => ({ room, count: occupants.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get connection distribution by role
   */
  private getConnectionDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const connection of this.connections.values()) {
      distribution[connection.role] = (distribution[connection.role] || 0) + 1;
    }
    
    return distribution;
  }
}

