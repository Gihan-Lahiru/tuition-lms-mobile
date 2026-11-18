import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as webpush from 'web-push';
import { v4 as uuid } from 'uuid';
import { PushSubscription } from '../database/entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private isConfigured = false;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly pushSubRepo: Repository<PushSubscription>,
  ) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@mwtuition.lk';

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.isConfigured = true;
        this.logger.log('WebPush VAPID configured successfully');
      } catch (err: any) {
        this.logger.error(`Failed to set VAPID details: ${err?.message}`);
      }
    } else {
      this.logger.warn('VAPID keys not provided. WebPush notifications are disabled.');
    }
  }

  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  async saveSubscription(
    userId: string,
    subData: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ): Promise<PushSubscription> {
    const existing = await this.pushSubRepo.findOne({
      where: { endpoint: subData.endpoint },
    });

    if (existing) {
      existing.userId = userId;
      existing.p256dh = subData.keys.p256dh;
      existing.auth = subData.keys.auth;
      if (userAgent) existing.userAgent = userAgent;
      return this.pushSubRepo.save(existing);
    }

    const newSub = this.pushSubRepo.create({
      id: uuid(),
      userId,
      endpoint: subData.endpoint,
      p256dh: subData.keys.p256dh,
      auth: subData.keys.auth,
      userAgent,
    });

    return this.pushSubRepo.save(newSub);
  }

  async removeSubscription(endpoint: string): Promise<void> {
    await this.pushSubRepo.delete({ endpoint });
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<{ success: number; failed: number }> {
    const subs = await this.pushSubRepo.find({ where: { userId } });
    return this.dispatchToSubscriptions(subs, payload);
  }

  async sendToUsers(userIds: string[], payload: PushPayload): Promise<{ success: number; failed: number }> {
    if (!userIds || userIds.length === 0) return { success: 0, failed: 0 };
    const subs = await this.pushSubRepo.find({ where: { userId: In(userIds) } });
    return this.dispatchToSubscriptions(subs, payload);
  }

  async sendToAll(payload: PushPayload): Promise<{ success: number; failed: number }> {
    const subs = await this.pushSubRepo.find();
    return this.dispatchToSubscriptions(subs, payload);
  }

  private async dispatchToSubscriptions(
    subs: PushSubscription[],
    payload: PushPayload,
  ): Promise<{ success: number; failed: number }> {
    if (!this.isConfigured || subs.length === 0) {
      return { success: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/lms/icons/logo.png',
      badge: payload.badge || '/lms/icons/logo.png',
      url: payload.url || '/lms/notifications',
      tag: payload.tag || uuid(),
      data: {
        url: payload.url || '/lms/notifications',
        ...(payload.data || {}),
      },
    });

    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload,
          );
          success++;
        } catch (err: any) {
          failed++;
          const statusCode = err?.statusCode;
          // If subscription has expired or unsubscribed (404/410), clean it up
          if (statusCode === 404 || statusCode === 410) {
            this.logger.log(`Removing expired push subscription: ${sub.id}`);
            await this.pushSubRepo.delete({ id: sub.id });
          } else {
            this.logger.warn(`Push delivery error to ${sub.id}: ${err?.message || err}`);
          }
        }
      }),
    );

    return { success, failed };
  }
}
