import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paper } from '../database/entities/paper.entity';
import { Note } from '../database/entities/note.entity';
import { Video } from '../database/entities/video.entity';
import { Payment } from '../database/entities/payment.entity';
import { Notification } from '../database/entities/notification.entity';
import { PushSubscription } from '../database/entities/push-subscription.entity';
import { Message } from '../database/entities/message.entity';
import { User } from '../database/entities/user.entity';
import { ContentController } from './content.controller';
import { VideosController } from './videos.controller';
import { PaymentsController } from './payments.controller';
import { NotificationsController } from './notifications.controller';
import { MessagesController } from './messages.controller';
import { PdfWatermarkService } from '../common/services/pdf-watermark.service';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paper,
      Note,
      Video,
      Payment,
      Notification,
      PushSubscription,
      Message,
      User,
    ]),
  ],
  controllers: [
    ContentController,
    VideosController,
    PaymentsController,
    NotificationsController,
    MessagesController,
  ],
  providers: [PdfWatermarkService, PushNotificationService],
  exports: [PdfWatermarkService, PushNotificationService],
})
export class ContentModule {}
