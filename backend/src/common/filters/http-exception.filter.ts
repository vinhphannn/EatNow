import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const timestamp = new Date().toISOString();
    const path = request?.url;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorName = 'Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as
        | { message?: string | string[]; error?: string }
        | string;
      if (typeof res === 'string') {
        message = res;
      } else {
        message = res.message ?? message;
        errorName = res.error ?? exception.name;
      }
    } else if (exception instanceof Error) {
      errorName = exception.name;
      message = exception.message;
    }

    this.logger.error(
      `${request?.method || ''} ${path} -> ${status} ${errorName}: ${
        Array.isArray(message) ? message.join(', ') : message
      }`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorName,
      message,
      path,
      timestamp,
    });
  }
}


