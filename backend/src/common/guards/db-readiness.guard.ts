import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection as MongoConnection } from 'mongoose';

@Injectable()
export class DbReadinessGuard implements CanActivate {
  constructor(@InjectConnection() private readonly mongoConn: MongoConnection) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const path: string = (req?.originalUrl || req?.url || '') as string;

    // Allow health endpoints to pass through regardless of DB state
    if (path.startsWith('/api/v1/health')) {
      return true;
    }

    const ready = this.mongoConn?.readyState === 1;
    if (!ready) {
      throw new ServiceUnavailableException({
        ok: false,
        code: 'DB_DOWN',
        message: 'Dịch vụ đang bảo trì. Vui lòng thử lại sau.',
      });
    }
    return true;
  }
}












