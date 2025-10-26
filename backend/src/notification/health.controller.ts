import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { MonitoringService, SystemMetrics, AlertRule } from './services/monitoring.service';
import { ConnectionManager } from './services/connection-manager.service';
import { ChatManager } from './services/chat-manager.service';
import { LocationManager } from './services/location-manager.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly connectionManager: ConnectionManager,
    private readonly chatManager: ChatManager,
    private readonly locationManager: LocationManager,
  ) {}

  @Get()
  getHealth(): {
    status: string;
    timestamp: string;
    uptime: number;
    issues: string[];
    metrics: SystemMetrics | null;
  } {
    const health = this.monitoringService.getHealthStatus();
    
    const statusCode = health.status === 'critical' 
      ? HttpStatus.SERVICE_UNAVAILABLE 
      : health.status === 'warning' 
        ? HttpStatus.OK 
        : HttpStatus.OK;

    return {
      status: health.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      issues: health.issues,
      metrics: health.metrics,
    };
  }

  @Get('metrics')
  getMetrics(): {
    current: SystemMetrics | null;
    summary: any;
    timestamp: string;
  } {
    const current = this.monitoringService.getCurrentMetrics();
    const summary = this.monitoringService.getMetricsSummary();
    
    return {
      current,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('performance')
  getPerformance() {
    const report = this.monitoringService.getPerformanceReport();
    
    return {
      ...report,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('alerts')
  getAlerts(): {
    active: Array<{ rule: AlertRule; timestamp: Date }>;
    history: Array<{ rule: AlertRule; timestamp: Date; resolved: boolean }>;
    timestamp: string;
  } {
    const active = this.monitoringService.getActiveAlerts();
    const history = this.monitoringService.getAlertHistory(20);
    
    return {
      active,
      history,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('connections')
  getConnections() {
    const stats = this.connectionManager.getConnectionStats();
    const metrics = this.connectionManager.getMetrics();
    
    return {
      stats,
      metrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('chat')
  getChatStats() {
    const metrics = this.chatManager.getMetrics();
    const activeRooms = this.chatManager.getActiveRooms();
    
    return {
      metrics,
      activeRooms: activeRooms.slice(0, 20), // Top 20 rooms
      timestamp: new Date().toISOString(),
    };
  }

  @Get('location')
  getLocationStats() {
    const metrics = this.locationManager.getMetrics();
    const stats = this.locationManager.getLocationStats();
    
    return {
      metrics,
      stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('detailed')
  getDetailedHealth(): {
    health: any;
    performance: any;
    connections: any;
    chat: any;
    location: any;
    system: any;
    timestamp: string;
  } {
    try {
      const health = this.monitoringService.getHealthStatus();
      const performance = this.monitoringService.getPerformanceReport();
      const connectionStats = this.connectionManager.getConnectionStats();
      const chatMetrics = this.chatManager.getMetrics();
      const locationStats = this.locationManager.getLocationStats();
      
      return {
        health,
        performance,
        connections: connectionStats,
        chat: chatMetrics,
        location: locationStats,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: process.memoryUsage(),
          uptime: process.uptime(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to get detailed health information',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
