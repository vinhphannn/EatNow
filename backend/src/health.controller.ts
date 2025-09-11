import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection as MongoConnection } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService, @InjectConnection() private readonly mongoConn: MongoConnection) {}

  @Get()
  async health() {
    return {
      status: 'ok',
      mongo: this.mongoConn?.readyState === 1 ? 'up' : 'down',
      env: {
        node: process.version,
        port: this.config.get('PORT') || 3000,
      },
    };
  }
}



