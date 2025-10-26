import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Prefer Authorization header
    const auth = req.headers['authorization'] as string | undefined;
    let token: string | undefined;

    if (auth && auth.startsWith('Bearer ')) {
      token = auth.substring(7);
    } else {
      // Fallback to HttpOnly cookies - check role-specific cookies first
      const cookies = req.cookies || {};
      
      // Check role-specific cookies
      for (const role of ['customer', 'restaurant', 'driver', 'admin']) {
        const cookieName = `${role}_access_token`;
        if (cookies[cookieName]) {
          token = cookies[cookieName];
          break;
        }
      }
      
      // Fallback to generic access_token
      if (!token) {
        token = cookies['access_token'];
      }
    }

    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const payload = await this.jwt.verifyAsync(token);
      req.user = { sub: payload.sub, id: payload.sub, userId: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}


