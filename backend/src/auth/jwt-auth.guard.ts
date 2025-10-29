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
      // Fallback to HttpOnly cookies - prefer role indicator cookie if present
      const cookies = req.cookies || {};

      const indicatorOrder = ['admin', 'driver', 'restaurant', 'customer'];
      let indicatedRole: string | undefined;
      for (const role of indicatorOrder) {
        if (cookies[`${role}_token`]) { indicatedRole = role; break; }
      }

      if (indicatedRole) {
        const name = `${indicatedRole}_access_token`;
        if (cookies[name]) {
          token = cookies[name];
          console.log(`🔒 JwtAuthGuard: Using ${indicatedRole}_access_token (by indicator)`);
        }
      }

      // Fallback by privilege order if no indicator or missing cookie
      if (!token) {
        for (const role of indicatorOrder) {
          const cookieName = `${role}_access_token`;
          if (cookies[cookieName]) {
            token = cookies[cookieName];
            console.log(`🔒 JwtAuthGuard: Using ${role}_access_token`);
            break;
          }
        }
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


