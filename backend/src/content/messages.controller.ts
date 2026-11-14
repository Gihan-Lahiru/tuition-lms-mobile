import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Message } from '../database/entities/message.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/messages')
export class MessagesController {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  @Post()
  @Roles('student')
  async createMessage(@Req() req: any, @Body('message') text: string) {
    const msg = this.messageRepo.create({
      id: uuid(),
      studentId: req.user.id,
      message: text,
      status: 'unread',
    });
    return this.messageRepo.save(msg);
  }

  @Get('my-messages')
  @Roles('student')
  async getMyMessages(@Req() req: any) {
    return this.messageRepo.find({
      where: { studentId: req.user.id },
      order: { createdAt: 'DESC' },
    });
  }

  @Get()
  @Roles('teacher', 'admin')
  async getAllMessages() {
    return this.messageRepo.find({
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  @Put(':id/reply')
  @Roles('teacher', 'admin')
  async replyMessage(@Param('id') id: string, @Body('reply') reply: string) {
    const msg = await this.messageRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    msg.adminReply = reply;
    msg.status = 'replied';
    return this.messageRepo.save(msg);
  }
}
