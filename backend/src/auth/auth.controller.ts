import { Body, Controller, Post, Get, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express';
import { LoginRequestDto, LoginResponseDto, RefreshResponseDto, RegisterDto } from './dto/auth.dto';
import { UserDto } from '../user/dto/user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Helper function to get cookie names based on role
  private getCookieNames(role: string) {
    const rolePrefix = role.toLowerCase();
    return {
      accessToken: `${rolePrefix}_access_token`,
      refreshToken: `${rolePrefix}_refresh_token`,
      csrfToken: `${rolePrefix}_csrf_token`
    };
  }

  @Post('login')
  @ApiBody({ type: LoginRequestDto })
  @ApiCreatedResponse({ type: LoginResponseDto })
  async login(@Body() body: LoginRequestDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body.email, body.password);
    const cookieNames = this.getCookieNames(result.user.role);
    
    // Set role-specific access token cookie
    res.cookie(cookieNames.accessToken, result.access_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 60 * 1000,
      path: '/',
    });
    // Set generic access_token for backward compatibility (guards/middleware đọc cookie này)
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 60 * 1000,
      path: '/',
    });
    
    // Set role indicator cookie
    const roleCookie = `${result.user.role}_token`.toLowerCase();
    res.cookie(roleCookie, '1', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    
    return result;
  }

  @Post('refresh')
  @ApiCreatedResponse({ type: RefreshResponseDto })
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.rotateRefreshToken(req);
    
    // Get user role from the new access token
    const payload = await this.auth['jwt'].verifyAsync(result.access_token);
    const cookieNames = this.getCookieNames(payload.role);
    
    // Set role-specific cookies
    res.cookie(cookieNames.accessToken, result.access_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie(cookieNames.refreshToken, result.refresh_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
    res.cookie(cookieNames.csrfToken, result.csrf || '', {
      httpOnly: false,
      sameSite: 'none',
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
    
    return { access_token: result.access_token };
  }

  @Post('logout')
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean', example: true } } } })
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    // Clear all role-specific cookies
    const roles = ['customer', 'restaurant', 'driver', 'admin'];
    
    roles.forEach(role => {
      // Clear role-specific access tokens
      res.clearCookie(`${role}_access_token`, { path: '/' });
      res.clearCookie(`${role}_refresh_token`, { path: '/auth' });
      res.clearCookie(`${role}_csrf_token`, { path: '/auth' });
      // Clear role indicator cookies
      res.clearCookie(`${role}_token`, { path: '/' });
    });
    
    try { await this.auth.revokeCurrentRefreshToken(req); } catch {}
    return { success: true };
  }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: LoginResponseDto })
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(body.email, body.password, body.name, body.phone as any, body.role);
    const cookieNames = this.getCookieNames(result.user.role);
    
    // Set role-specific access token cookie
    res.cookie(cookieNames.accessToken, result.access_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 60 * 1000,
      path: '/',
    });
    
    // Set role indicator cookie
    const roleCookie = `${result.user.role}_token`.toLowerCase();
    res.cookie(roleCookie, '1', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserDto })
  async getProfile(@Request() req) {
    // Extract role from URL context (pathname)
    const pathname = req.url || req.path || '';
    let requiredRole: string | undefined;
    
    if (pathname.includes('/admin/')) {
      requiredRole = 'admin';
    } else if (pathname.includes('/customer/')) {
      requiredRole = 'customer';
    } else if (pathname.includes('/restaurant/')) {
      requiredRole = 'restaurant';
    } else if (pathname.includes('/driver/')) {
      requiredRole = 'driver';
    }
    
    // If you want strict JWT validation from cookie, verify in a guard or here
    return this.auth.getProfileFromCookie(req, requiredRole);
  }
}


