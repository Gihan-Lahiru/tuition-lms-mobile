import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  @Get()
  list(@Req() req: any) {
    return this.notifRepo.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
    });
  }

  @Patch('read-all')
  async markAllRead(@Req() req: any) {
    await this.notifRepo.update({ userId: req.user.id }, { isRead: true });
    return { updated: true };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    await this.notifRepo.update({ id, userId: req.user.id }, { isRead: true });
    return { updated: true };
  }
}

