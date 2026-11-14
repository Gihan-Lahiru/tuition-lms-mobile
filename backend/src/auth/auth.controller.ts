import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() data: any) {
    return this.authService.updateProfile(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}

