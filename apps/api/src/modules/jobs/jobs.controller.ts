import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobListingDto } from './dto/create-job-listing.dto';
import { UpdateJobListingDto } from './dto/update-job-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard, TenantGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create job listing' })
  async create(
    @Body() createDto: CreateJobListingDto,
    @Req() req: RequestWithUser,
  ) {
    // Only studio admins can create job listings
    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can create job listings');
    }

    return this.jobsService.create({
      ...createDto,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List job listings' })
  async findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('artistType') artistType?: string,
    @Query('location') location?: string,
    @Query('remote') remote?: boolean,
    @Query('projectId') projectId?: string,
    @Query('skills') skills?: string,
    @Query('minRate') minRate?: number,
    @Query('maxRate') maxRate?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('includeExternal') includeExternal = false,
    @Req() req?: RequestWithUser,
  ) {
    return this.jobsService.findAll({
      tenantId: includeExternal ? undefined : req.user.tenantId,
      status,
      type,
      artistType,
      location,
      isRemote: remote,
      projectId,
      skills: skills?.split(','),
      minRate,
      maxRate,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job listing by ID' })
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const job = await this.jobsService.findOne(id);
    
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    // Check if user can view this job
    if (job.status === 'draft' && job.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Cannot view draft job listings from other studios');
    }

    // Increment view count if not from same tenant
    if (job.tenantId !== req.user.tenantId) {
      await this.jobsService.incrementViewCount(id);
    }

    return job;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job listing' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateJobListingDto,
    @Req() req: RequestWithUser,
  ) {
    const job = await this.jobsService.findOne(id);
    
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    // Only admins from the same tenant can update
    if (job.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Cannot update job listings from other studios');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can update job listings');
    }

    return this.jobsService.update(id, {
      ...updateDto,
      updatedBy: req.user.id,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job listing' })
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const job = await this.jobsService.findOne(id);
    
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    // Only admins from the same tenant can delete
    if (job.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Cannot delete job listings from other studios');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can delete job listings');
    }

    return this.jobsService.remove(id, req.user.tenantId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish job listing' })
  async publish(@Param('id') id: string, @Req() req: RequestWithUser) {
    const job = await this.jobsService.findOne(id);
    
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    if (job.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Cannot publish job listings from other studios');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can publish job listings');
    }

    if (job.status !== 'draft') {
      throw new BadRequestException('Only draft job listings can be published');
    }

    return this.jobsService.updateStatus(id, 'open', req.user.id);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close job listing' })
  async close(@Param('id') id: string, @Req() req: RequestWithUser) {
    const job = await this.jobsService.findOne(id);
    
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    if (job.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Cannot close job listings from other studios');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can close job listings');
    }

    if (job.status !== 'open') {
      throw new BadRequestException('Only open job listings can be closed');
    }

    return this.jobsService.updateStatus(id, 'closed', req.user.id);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save job listing for later' })
  async saveJob(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: RequestWithUser,
  ) {
    // Get artist profile for the user
    const artistId = await this.jobsService.getArtistIdForUser(
      req.user.id,
      req.user.tenantId,
    );

    if (!artistId) {
      throw new BadRequestException('You must have an artist profile to save jobs');
    }

    return this.jobsService.saveJob(id, artistId, body.notes);
  }

  @Delete(':id/save')
  @ApiOperation({ summary: 'Remove saved job' })
  async unsaveJob(@Param('id') id: string, @Req() req: RequestWithUser) {
    const artistId = await this.jobsService.getArtistIdForUser(
      req.user.id,
      req.user.tenantId,
    );

    if (!artistId) {
      throw new BadRequestException('You must have an artist profile to manage saved jobs');
    }

    return this.jobsService.unsaveJob(id, artistId);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved jobs' })
  async getSavedJobs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Req() req: RequestWithUser,
  ) {
    const artistId = await this.jobsService.getArtistIdForUser(
      req.user.id,
      req.user.tenantId,
    );

    if (!artistId) {
      return { data: [], total: 0, page, limit };
    }

    return this.jobsService.getSavedJobs(artistId, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job listing statistics' })
  async getStats(@Req() req: RequestWithUser) {
    // Only admins can view stats
    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can view job statistics');
    }

    return this.jobsService.getStats(req.user.tenantId);
  }
}