import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobApplicationsService } from './job-applications.service';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('job-applications')
@ApiBearerAuth()
@Controller('job-applications')
@UseGuards(JwtAuthGuard, TenantGuard)
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Apply for a job' })
  async create(
    @Body() createDto: CreateJobApplicationDto,
    @Req() req: RequestWithUser,
  ) {
    // Get artist profile for the user
    const artistId = await this.jobApplicationsService.getArtistIdForUser(
      req.user.id,
      req.user.tenantId,
    );

    if (!artistId) {
      throw new ForbiddenException('You must have an artist profile to apply for jobs');
    }

    // Check if already applied
    const existing = await this.jobApplicationsService.findByArtistAndJob(
      artistId,
      createDto.jobListingId,
    );

    if (existing) {
      throw new ConflictException('You have already applied for this job');
    }

    return this.jobApplicationsService.create({
      ...createDto,
      artistId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List job applications' })
  async findAll(
    @Query('jobListingId') jobListingId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Req() req?: RequestWithUser,
  ) {
    // If user is an artist, show their applications
    const artistId = await this.jobApplicationsService.getArtistIdForUser(
      req.user.id,
      req.user.tenantId,
    );

    if (artistId && req.user.role === 'freelancer') {
      return this.jobApplicationsService.findByArtist(artistId, page, limit);
    }

    // If user is admin, show applications for their job listings
    if (req.user.role === 'owner' || req.user.role === 'manager') {
      return this.jobApplicationsService.findByTenant({
        tenantId: req.user.tenantId,
        jobListingId,
        status,
        page,
        limit,
      });
    }

    throw new ForbiddenException('You do not have access to view applications');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job application by ID' })
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const application = await this.jobApplicationsService.findOne(id);
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    const canView = await this.jobApplicationsService.canUserViewApplication(
      application,
      req.user.id,
      req.user.tenantId,
      req.user.role,
    );

    if (!canView) {
      throw new ForbiddenException('You cannot view this application');
    }

    return application;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job application' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateJobApplicationDto,
    @Req() req: RequestWithUser,
  ) {
    const application = await this.jobApplicationsService.findOne(id);
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only admins from the job's tenant can update applications
    if (application.jobListing.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('You cannot update this application');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can update applications');
    }

    return this.jobApplicationsService.update(id, {
      ...updateDto,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update application status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @Req() req: RequestWithUser,
  ) {
    const application = await this.jobApplicationsService.findOne(id);
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only admins from the job's tenant can update status
    if (application.jobListing.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('You cannot update this application');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can update application status');
    }

    return this.jobApplicationsService.updateStatus(
      id,
      body.status,
      req.user.id,
      body.reason,
    );
  }

  @Put(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw job application' })
  async withdraw(@Param('id') id: string, @Req() req: RequestWithUser) {
    const application = await this.jobApplicationsService.findOne(id);
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only the applicant can withdraw
    const artistId = await this.jobApplicationsService.getArtistIdForUser(
      req.user.id,
      req.user.tenantId,
    );

    if (application.artistId !== artistId) {
      throw new ForbiddenException('You can only withdraw your own applications');
    }

    return this.jobApplicationsService.updateStatus(
      id,
      'withdrawn',
      req.user.id,
    );
  }

  @Post(':id/schedule-interview')
  @ApiOperation({ summary: 'Schedule interview for application' })
  async scheduleInterview(
    @Param('id') id: string,
    @Body() body: { interviewDate: Date; notes?: string },
    @Req() req: RequestWithUser,
  ) {
    const application = await this.jobApplicationsService.findOne(id);
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only admins from the job's tenant can schedule interviews
    if (application.jobListing.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('You cannot schedule interviews for this application');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can schedule interviews');
    }

    return this.jobApplicationsService.scheduleInterview(
      id,
      body.interviewDate,
      req.user.id,
      body.notes,
    );
  }

  @Post(':id/make-offer')
  @ApiOperation({ summary: 'Make offer to applicant' })
  async makeOffer(
    @Param('id') id: string,
    @Body() body: { offerDetails: any },
    @Req() req: RequestWithUser,
  ) {
    const application = await this.jobApplicationsService.findOne(id);
    
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only admins from the job's tenant can make offers
    if (application.jobListing.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('You cannot make offers for this application');
    }

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can make offers');
    }

    return this.jobApplicationsService.makeOffer(
      id,
      body.offerDetails,
      req.user.id,
    );
  }

  @Get('stats/:jobListingId')
  @ApiOperation({ summary: 'Get application statistics for a job' })
  async getStats(
    @Param('jobListingId') jobListingId: string,
    @Req() req: RequestWithUser,
  ) {
    // Verify the job belongs to the user's tenant
    const canView = await this.jobApplicationsService.canUserViewJobStats(
      jobListingId,
      req.user.tenantId,
      req.user.role,
    );

    if (!canView) {
      throw new ForbiddenException('You cannot view statistics for this job');
    }

    return this.jobApplicationsService.getApplicationStats(jobListingId);
  }
}