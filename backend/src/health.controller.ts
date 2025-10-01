import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection as MongoConnection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { NotificationGateway } from './notification/notification.gateway';

@Controller('health')
export class HealthController {
  constructor(
    private readonly config: ConfigService,
    @InjectConnection() private readonly mongoConn: MongoConnection,
    private readonly gateway: NotificationGateway,
  ) {}

  @Get()
  async health() {
    return {
      status: 'ok',
      mongo: this.mongoConn?.readyState === 1 ? 'up' : 'down',
      redis: this.gateway ? (this.gateway as any).getMetricsSummary?.().redisEnabled === true ? 'up' : 'down' : 'unknown',
      env: {
        node: process.version,
        port: this.config.get('PORT') || 3000,
      },
    };
  }

  @Get('metrics')
  async metrics() {
    const summary = this.gateway?.getMetricsSummary?.();
    return summary || {};
  }

  @Get('ready')
  async ready() {
    const mongoUp = this.mongoConn?.readyState === 1;
    if (!mongoUp) {
      return {
        ok: false,
        status: 'down',
        mongo: 'down',
      };
    }
    return {
      ok: true,
      status: 'ready',
      mongo: 'up',
    };
  }
}



