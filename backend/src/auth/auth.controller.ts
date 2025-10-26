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
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 1000,
      path: '/',
    });
    
    // Also set generic access_token for backward compatibility
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 1000,
      path: '/',
    });
    
    // Set role indicator cookie
    const roleCookie = `${result.user.role}_token`.toLowerCase();
    res.cookie(roleCookie, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
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
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie(cookieNames.refreshToken, result.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
    res.cookie(cookieNames.csrfToken, result.csrf || '', {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
    
    // Also set generic cookies for backward compatibility
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
    res.cookie('csrf_token', result.csrf || '', {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
    
    return { access_token: result.access_token };
  }

  @Post('logout')
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean', example: true } } } })
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    // Clear cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('admin_token', { path: '/' });
    res.clearCookie('restaurant_token', { path: '/' });
    res.clearCookie('customer_token', { path: '/' });
    res.clearCookie('driver_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth' });
    try { await this.auth.revokeCurrentRefreshToken(req); } catch {}
    return { success: true };
  }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: LoginResponseDto })
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(body.email, body.password, body.name, body.phone as any, body.role);
    
    // Set HttpOnly cookies
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 1000,
      path: '/',
    });
    
    // Set role-specific cookie
    const roleCookie = `${result.user.role}_token`.toLowerCase();
    res.cookie(roleCookie, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
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
    // If you want strict JWT validation from cookie, verify in a guard or here
    return this.auth.getProfileFromCookie(req);
  }
}


