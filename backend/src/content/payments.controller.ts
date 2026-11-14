import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { Payment } from '../database/entities/payment.entity';
import { User } from '../database/entities/user.entity';
import { Notification } from '../database/entities/notification.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ensureUploadSubdir,
  sanitizeFilename,
  validateUploadedFile,
} from '../common/utils/file-validation.util';

/**
 * Notice: Payments routes do NOT enforce DashboardAccessGuard on students so
 * overdue/unpaid students can still view their balance and upload a fee receipt!
 */
@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/payments')
export class PaymentsController {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  @Get('my-payments')
  async myPayments(@Req() req: any) {
    const user = await this.userRepo.findOne({ where: { id: req.user.id } });
    const payments = await this.paymentRepo.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    const dueDate = user?.paymentDueDate ? new Date(user.paymentDueDate) : null;
    const msLeft = dueDate ? dueDate.getTime() - now.getTime() : 0;
    const graceDaysRemaining =
      user?.paymentStatus === 'paid'
        ? null
        : dueDate
          ? Math.ceil(msLeft / (1000 * 60 * 60 * 24))
          : 0;

    return {
      status: {
        paymentStatus: user?.paymentStatus || 'unpaid',
        paymentDueDate: user?.paymentDueDate || null,
        dashboardAccess: user?.dashboardAccess ?? false,
        graceDaysRemaining,
        isLocked:
          user?.role === 'student' &&
          (!user.dashboardAccess ||
            Boolean(dueDate && user.paymentStatus !== 'paid' && now > dueDate)),
      },
      payments,
    };
  }

  @Post('upload-receipt')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      amount?: string;
      month?: string;
      year?: string;
      method?: string;
      classId?: string;
    },
    @Req() req: any,
  ) {
    validateUploadedFile(file);
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Valid positive fee amount is required');
    }

    const dir = ensureUploadSubdir('receipts');
    const storedName = `${uuid()}_${sanitizeFilename(file.originalname)}`;
    fs.writeFileSync(path.join(dir, storedName), file.buffer);

    const payment = this.paymentRepo.create({
      id: uuid(),
      userId: req.user.id,
      classId: body.classId,
      amount,
      month: body.month || new Date().toLocaleString('en-US', { month: 'long' }),
      year: body.year || String(new Date().getFullYear()),
      method: body.method || 'bank_transfer',
      status: 'pending',
      approvalStatus: 'pending',
      receiptUrl: `/uploads/receipts/${storedName}`,
    });
    const saved = await this.paymentRepo.save(payment);

    // Mark user pending verification (never unlock content automatically on client!)
    await this.userRepo.update(
      { id: req.user.id },
      { paymentStatus: 'pending_verification' },
    );

    return saved;
  }

  @Get('receipts/all')
  @Roles('teacher', 'admin')
  async listAllReceipts() {
    const list = await this.paymentRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return list.map((p) => ({
      id: p.id,
      userId: p.userId,
      studentName: p.user?.name || 'Student',
      studentGrade: p.user?.grade || '',
      amount: p.amount,
      month: p.month,
      year: p.year,
      method: p.method,
      status: p.status,
      approvalStatus: p.approvalStatus,
      reviewNotes: p.reviewNotes,
      hasReceiptFile: Boolean(p.receiptUrl),
      createdAt: p.createdAt,
    }));
  }

  @Get(':id/receipt')
  async getReceiptFile(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment || !payment.receiptUrl) {
      throw new NotFoundException('Receipt not found');
    }
    if (req.user.role === 'student' && payment.userId !== req.user.id) {
      throw new ForbiddenException('You can only view your own payment receipts');
    }
    const uploadRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const rel = payment.receiptUrl.split('/uploads/')[1];
    const abs = path.join(uploadRoot, rel || '');
    if (!rel || !fs.existsSync(abs)) {
      throw new NotFoundException('Receipt file missing from storage');
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(abs);
  }

  @Put(':id/approve')
  @Roles('teacher', 'admin')
  async approve(
    @Param('id') id: string,
    @Body() body: { reviewNotes?: string },
  ) {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');

    payment.approvalStatus = 'approved';
    payment.status = 'completed';
    payment.reviewNotes = body?.reviewNotes || 'Verified & approved';
    await this.paymentRepo.save(payment);

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 30);
    await this.userRepo.update(
      { id: payment.userId },
      {
        paymentStatus: 'paid',
        dashboardAccess: true,
        paymentDueDate: nextDue,
      },
    );

    await this.notifRepo.save(
      this.notifRepo.create({
        id: uuid(),
        userId: payment.userId,
        title: 'Payment Approved',
        message: `Your fee receipt for LKR ${payment.amount} (${payment.month} ${payment.year}) has been approved.`,
        type: 'payment',
      }),
    );

    return payment;
  }

  @Put(':id/reject')
  @Roles('teacher', 'admin')
  async reject(
    @Param('id') id: string,
    @Body() body: { reviewNotes?: string },
  ) {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');

    payment.approvalStatus = 'rejected';
    payment.status = 'failed';
    payment.reviewNotes = body?.reviewNotes || 'Receipt could not be verified';
    await this.paymentRepo.save(payment);

    await this.userRepo.update(
      { id: payment.userId },
      { paymentStatus: 'rejected' },
    );

    await this.notifRepo.save(
      this.notifRepo.create({
        id: uuid(),
        userId: payment.userId,
        title: 'Payment Receipt Rejected',
        message: `Your receipt for ${payment.month} ${payment.year} was rejected: ${payment.reviewNotes}`,
        type: 'payment',
      }),
    );

    return payment;
  }
}

