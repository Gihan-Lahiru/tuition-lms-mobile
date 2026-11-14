import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import {
  CreateAcademicTermDto,
  PublishTermResultsDto,
  SaveResultsDto,
} from './dto/result.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardAccessGuard } from '../common/guards/dashboard-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DashboardAccessGuard, RolesGuard)
@Controller('api')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('academic-terms')
  listTerms() {
    return this.resultsService.listTerms();
  }

  @Post('academic-terms')
  @Roles('teacher', 'admin')
  createTerm(@Body() dto: CreateAcademicTermDto) {
    return this.resultsService.createTerm(dto);
  }

  @Post('results')
  @Roles('teacher', 'admin')
  saveResults(@Body() dto: SaveResultsDto, @Req() req: any) {
    return this.resultsService.saveResults(dto, req.user.id);
  }

  @Patch('results/publish')
  @Roles('teacher', 'admin')
  publishResults(@Body() dto: PublishTermResultsDto) {
    return this.resultsService.publishResults(dto);
  }

  @Get('results/class/:classId')
  @Roles('teacher', 'admin')
  getClassSheet(
    @Param('classId') classId: string,
    @Query('termId') termId?: string,
  ) {
    return this.resultsService.getClassTermSheet(classId, termId);
  }

  @Get('results/me')
  @Roles('student')
  getMyResults(@Req() req: any) {
    return this.resultsService.getMyResults(req.user);
  }
}

