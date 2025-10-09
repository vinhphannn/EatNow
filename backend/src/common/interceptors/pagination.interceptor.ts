import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((response: any) => {
        if (!response || typeof response !== 'object') return response;
        const { data, page, limit, total, ...rest } = response;
        if (!Array.isArray(data) || typeof page === 'undefined' || typeof limit === 'undefined' || typeof total === 'undefined') {
          return response;
        }
        return {
          data,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil((Number(total) || 0) / (Number(limit) || 1)),
          },
          ...rest.meta ? { extra: rest.meta } : {},
        } as any;
      }),
    );
  }
}


