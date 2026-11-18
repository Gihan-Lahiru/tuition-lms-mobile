import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Notification } from '../database/entities/notification.entity';
import { User } from '../database/entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PushNotificationService } from './push-notification.service';

class SubscribePushDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class BroadcastNotificationDto {
  title: string;
  message: string;
  type?: string; // 'info' | 'quiz' | 'assignment' | 'result' | 'payment' | 'announcement'
  grade?: string; // e.g. 'Grade 10' or 'all'
  url?: string; // e.g. '/lms/papers' or '/lms/quizzes'
}

class DirectNotificationDto {
  studentId: string;
  title: string;
  message: string;
  type?: string;
  url?: string;
}

@ApiTags('Notifications')
@Controller('api/notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly pushService: PushNotificationService,
  ) {}

  @Get('vapid-key')
  getVapidPublicKey() {
    return {
      publicKey: this.pushService.getPublicKey(),
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    return this.notifRepo.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  async markAllRead(@Req() req: any) {
    await this.notifRepo.update({ userId: req.user.id }, { isRead: true });
    return { updated: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    await this.notifRepo.update({ id, userId: req.user.id }, { isRead: true });
    return { updated: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  async subscribe(
    @Body() dto: SubscribePushDto,
    @Req() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    if (!dto.endpoint || !dto.keys?.p256dh || !dto.keys?.auth) {
      return { success: false, message: 'Invalid subscription payload' };
    }

    const sub = await this.pushService.saveSubscription(req.user.id, dto, userAgent);
    return { success: true, subscriptionId: sub.id };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('unsubscribe')
  async unsubscribe(@Body('endpoint') endpoint: string) {
    if (endpoint) {
      await this.pushService.removeSubscription(endpoint);
    }
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('test-push')
  async testPush(@Req() req: any) {
    const res = await this.pushService.sendToUser(req.user.id, {
      title: 'MW Tuition Alert',
      body: 'Your mobile notifications are working perfectly! You will now receive class alerts.',
      url: '/lms/notifications',
    });
    return { success: true, ...res };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('broadcast')
  async broadcast(@Body() dto: BroadcastNotificationDto, @Req() req: any) {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw new UnauthorizedException('Only teachers and admins can broadcast notifications');
    }

    // Find recipient students
    const query: any = { role: 'student' };
    if (dto.grade && dto.grade !== 'all') {
      query.grade = dto.grade;
    }
    const students = await this.userRepo.find({ where: query });
    const studentIds = students.map((s) => s.id);

    // 1. Create in-app notification for each student
    if (studentIds.length > 0) {
      const records = studentIds.map((sid) =>
        this.notifRepo.create({
          id: uuid(),
          userId: sid,
          title: dto.title,
          message: dto.message,
          type: dto.type || 'announcement',
          isRead: false,
        }),
      );
      await this.notifRepo.save(records);
    }

    // 2. Dispatch push notification to their physical devices
    const pushResult = await this.pushService.sendToUsers(studentIds, {
      title: dto.title,
      body: dto.message,
      url: dto.url || '/lms/notifications',
      data: { type: dto.type || 'announcement' },
    });

    return {
      success: true,
      recipientsCount: studentIds.length,
      pushDelivered: pushResult.success,
      pushFailed: pushResult.failed,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('send-direct')
  async sendDirect(@Body() dto: DirectNotificationDto, @Req() req: any) {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw new UnauthorizedException('Only teachers and admins can send notifications');
    }

    // 1. Save in-app notification
    const record = await this.notifRepo.save(
      this.notifRepo.create({
        id: uuid(),
        userId: dto.studentId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'info',
        isRead: false,
      }),
    );

    // 2. Dispatch push notification to student device
    const pushResult = await this.pushService.sendToUser(dto.studentId, {
      title: dto.title,
      body: dto.message,
      url: dto.url || '/lms/notifications',
    });

    return {
      success: true,
      notification: record,
      pushDelivered: pushResult.success,
    };
  }
}
