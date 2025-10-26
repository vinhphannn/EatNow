import { Injectable, Logger } from '@nestjs/common';
import { ConnectionManager } from './connection-manager.service';
import { ChatManager } from './chat-manager.service';
import { LocationManager } from './location-manager.service';

export interface SystemMetrics {
  timestamp: Date;
  connections: {
    total: number;
    active: number;
    byRole: Record<string, number>;
    averagePerUser: number;
  };
  chat: {
    activeRooms: number;
    totalMessages: number;
    cacheHitRate: number;
    averageMessagesPerRoom: number;
  };
  location: {
    activeDrivers: number;
    activeOrders: number;
    clusters: number;
    throttlingRate: number;
    cacheHitRate: number;
  };
  performance: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    cpuUsage: number;
  };
  errors: {
    connectionErrors: number;
    rateLimitHits: number;
    throttledUpdates: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number; // milliseconds
  lastTriggered?: Date;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  
  // Metrics history
  private metricsHistory: SystemMetrics[] = [];
  private readonly MAX_HISTORY_SIZE = 1000; // Keep last 1000 metrics
  
  // Alert rules
  private alertRules: AlertRule[] = [];
  private alerts: Array<{ rule: AlertRule; timestamp: Date; resolved: boolean }> = [];
  
  // Performance tracking
  private startTime = Date.now();
  private connectionErrors = 0;
  private rateLimitHits = 0;
  private throttledUpdates = 0;
  
  // Monitoring interval
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL = 30_000; // 30 seconds

  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly chatManager: ChatManager,
    private readonly locationManager: LocationManager,
  ) {
    this.initializeAlertRules();
    this.startMonitoring();
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, this.MONITORING_INTERVAL);
    
    this.logger.log('Monitoring service started');
  }

  /**
   * Collect system metrics
   */
  private collectMetrics(): void {
    try {
      const connectionMetrics = this.connectionManager.getMetrics();
      const chatMetrics = this.chatManager.getMetrics();
      const locationMetrics = this.locationManager.getMetrics();
      
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        connections: {
          total: connectionMetrics.totalConnections,
          active: connectionMetrics.activeConnections,
          byRole: this.connectionManager.getConnectionStats().connectionDistribution,
          averagePerUser: connectionMetrics.averageConnectionsPerUser,
        },
        chat: {
          activeRooms: chatMetrics.activeRooms,
          totalMessages: chatMetrics.totalMessages,
          cacheHitRate: chatMetrics.cacheHitRate,
          averageMessagesPerRoom: chatMetrics.averageMessagesPerRoom,
        },
        location: {
          activeDrivers: locationMetrics.activeDrivers,
          activeOrders: locationMetrics.activeOrders,
          clusters: locationMetrics.clusters,
          throttlingRate: locationMetrics.throttlingRate,
          cacheHitRate: locationMetrics.cacheHitRate,
        },
        performance: {
          memoryUsage: process.memoryUsage(),
          uptime: Date.now() - this.startTime,
          cpuUsage: this.getCpuUsage(),
        },
        errors: {
          connectionErrors: this.connectionErrors,
          rateLimitHits: this.rateLimitHits,
          throttledUpdates: this.throttledUpdates,
        },
      };

      // Add to history
      this.metricsHistory.push(metrics);
      
      // Keep only recent metrics
      if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
        this.metricsHistory.shift();
      }

      this.logger.debug('Metrics collected successfully');
      
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1]
      : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 100): SystemMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    current: SystemMetrics | null;
    averages: Partial<SystemMetrics>;
    trends: Record<string, number>;
  } {
    const current = this.getCurrentMetrics();
    const recent = this.metricsHistory.slice(-10); // Last 10 measurements
    
    if (recent.length === 0) {
      return { current, averages: {}, trends: {} };
    }

    // Calculate averages
    const averages = {
      connections: {
        total: recent.reduce((sum, m) => sum + m.connections.total, 0) / recent.length,
        active: recent.reduce((sum, m) => sum + m.connections.active, 0) / recent.length,
        byRole: {} as Record<string, number>,
        averagePerUser: recent.reduce((sum, m) => sum + m.connections.averagePerUser, 0) / recent.length,
      },
      chat: {
        activeRooms: recent.reduce((sum, m) => sum + m.chat.activeRooms, 0) / recent.length,
        totalMessages: recent.reduce((sum, m) => sum + m.chat.totalMessages, 0) / recent.length,
        cacheHitRate: recent.reduce((sum, m) => sum + m.chat.cacheHitRate, 0) / recent.length,
        averageMessagesPerRoom: recent.reduce((sum, m) => sum + m.chat.averageMessagesPerRoom, 0) / recent.length,
      },
      location: {
        activeDrivers: recent.reduce((sum, m) => sum + m.location.activeDrivers, 0) / recent.length,
        activeOrders: recent.reduce((sum, m) => sum + m.location.activeOrders, 0) / recent.length,
        clusters: recent.reduce((sum, m) => sum + m.location.clusters, 0) / recent.length,
        throttlingRate: recent.reduce((sum, m) => sum + m.location.throttlingRate, 0) / recent.length,
        cacheHitRate: recent.reduce((sum, m) => sum + m.location.cacheHitRate, 0) / recent.length,
      },
    };

    // Calculate trends
    const trends = {
      connectionGrowth: this.calculateTrend(recent.map(m => m.connections.active)),
      chatGrowth: this.calculateTrend(recent.map(m => m.chat.activeRooms)),
      locationGrowth: this.calculateTrend(recent.map(m => m.location.activeDrivers)),
    };

    return { current, averages, trends };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Array<{ rule: AlertRule; timestamp: Date }> {
    return this.alerts
      .filter(alert => !alert.resolved)
      .map(alert => ({ rule: alert.rule, timestamp: alert.timestamp }));
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 50): Array<{ rule: AlertRule; timestamp: Date; resolved: boolean }> {
    return this.alerts.slice(-limit);
  }

  /**
   * Initialize alert rules
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_connection_count',
        name: 'High Connection Count',
        condition: (metrics) => metrics.connections.active > 8000,
        severity: 'high',
        message: 'Connection count is very high (>8000)',
        cooldown: 300_000, // 5 minutes
      },
      {
        id: 'memory_usage_high',
        name: 'High Memory Usage',
        condition: (metrics) => metrics.performance.memoryUsage.heapUsed > 500 * 1024 * 1024, // 500MB
        severity: 'medium',
        message: 'Memory usage is high (>500MB)',
        cooldown: 180_000, // 3 minutes
      },
      {
        id: 'low_cache_hit_rate',
        name: 'Low Cache Hit Rate',
        condition: (metrics) => metrics.chat.cacheHitRate < 0.7,
        severity: 'low',
        message: 'Chat cache hit rate is low (<70%)',
        cooldown: 600_000, // 10 minutes
      },
      {
        id: 'high_throttling_rate',
        name: 'High Throttling Rate',
        condition: (metrics) => metrics.location.throttlingRate > 0.5,
        severity: 'medium',
        message: 'Location throttling rate is high (>50%)',
        cooldown: 300_000, // 5 minutes
      },
      {
        id: 'connection_errors_high',
        name: 'High Connection Errors',
        condition: (metrics) => metrics.errors.connectionErrors > 100,
        severity: 'high',
        message: 'Connection errors are high (>100)',
        cooldown: 300_000, // 5 minutes
      },
      {
        id: 'uptime_low',
        name: 'Low Uptime',
        condition: (metrics) => metrics.performance.uptime < 60_000, // 1 minute
        severity: 'low',
        message: 'Service uptime is low (<1 minute)',
        cooldown: 60_000, // 1 minute
      },
    ];
  }

  /**
   * Check alert rules
   */
  private checkAlerts(): void {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) return;

    for (const rule of this.alertRules) {
      try {
        if (rule.condition(currentMetrics)) {
          this.triggerAlert(rule);
        }
      } catch (error) {
        this.logger.error(`Error checking alert rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule): void {
    const now = new Date();
    
    // Check cooldown
    if (rule.lastTriggered && now.getTime() - rule.lastTriggered.getTime() < rule.cooldown) {
      return;
    }

    // Check if alert is already active
    const activeAlert = this.alerts.find(alert => 
      alert.rule.id === rule.id && !alert.resolved
    );
    
    if (activeAlert) {
      return;
    }

    // Trigger alert
    rule.lastTriggered = now;
    this.alerts.push({
      rule,
      timestamp: now,
      resolved: false,
    });

    this.logger.warn(`Alert triggered: ${rule.name} - ${rule.message}`, {
      severity: rule.severity,
      ruleId: rule.id,
    });

    // Auto-resolve after cooldown period
    setTimeout(() => {
      this.resolveAlert(rule.id);
    }, rule.cooldown);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(ruleId: string): void {
    const alert = this.alerts.find(a => a.rule.id === ruleId && !a.resolved);
    if (alert) {
      alert.resolved = true;
      this.logger.log(`Alert resolved: ${alert.rule.name}`);
    }
  }

  /**
   * Get CPU usage (simplified)
   */
  private getCpuUsage(): number {
    // Simplified CPU usage calculation
    // In production, you might want to use a more sophisticated method
    const usage = process.cpuUsage();
    return usage.user + usage.system;
  }

  /**
   * Calculate trend (simple linear regression slope)
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return Math.round(slope * 100) / 100;
  }

  /**
   * Increment error counters
   */
  incrementConnectionErrors(): void {
    this.connectionErrors++;
  }

  incrementRateLimitHits(): void {
    this.rateLimitHits++;
  }

  incrementThrottledUpdates(): void {
    this.throttledUpdates++;
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: SystemMetrics | null;
  } {
    const current = this.getCurrentMetrics();
    const activeAlerts = this.getActiveAlerts();
    
    const criticalAlerts = activeAlerts.filter(alert => alert.rule.severity === 'critical');
    const highAlerts = activeAlerts.filter(alert => alert.rule.severity === 'high');
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const issues: string[] = [];
    
    if (criticalAlerts.length > 0) {
      status = 'critical';
      issues.push(...criticalAlerts.map(alert => alert.rule.message));
    } else if (highAlerts.length > 0) {
      status = 'warning';
      issues.push(...highAlerts.map(alert => alert.rule.message));
    }
    
    return { status, issues, metrics: current };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    summary: {
      uptime: number;
      totalConnections: number;
      totalMessages: number;
      totalLocationUpdates: number;
    };
    efficiency: {
      cacheHitRate: number;
      throttlingRate: number;
      averageConnectionsPerUser: number;
    };
    alerts: {
      active: number;
      resolved: number;
      critical: number;
    };
  } {
    const current = this.getCurrentMetrics();
    const chatMetrics = this.chatManager.getMetrics();
    const locationMetrics = this.locationManager.getMetrics();
    const connectionMetrics = this.connectionManager.getMetrics();
    
    const activeAlerts = this.getActiveAlerts();
    const resolvedAlerts = this.alerts.filter(alert => alert.resolved);
    const criticalAlerts = activeAlerts.filter(alert => alert.rule.severity === 'critical');
    
    return {
      summary: {
        uptime: current?.performance.uptime || 0,
        totalConnections: connectionMetrics.totalConnections,
        totalMessages: chatMetrics.totalMessages,
        totalLocationUpdates: locationMetrics.totalLocationUpdates,
      },
      efficiency: {
        cacheHitRate: current?.chat.cacheHitRate || 0,
        throttlingRate: current?.location.throttlingRate || 0,
        averageConnectionsPerUser: connectionMetrics.averageConnectionsPerUser,
      },
      alerts: {
        active: activeAlerts.length,
        resolved: resolvedAlerts.length,
        critical: criticalAlerts.length,
      },
    };
  }

  /**
   * Stop monitoring
   */
  onDestroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.logger.log('Monitoring service stopped');
  }
}
