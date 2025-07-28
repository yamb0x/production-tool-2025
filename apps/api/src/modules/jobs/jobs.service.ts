import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { JobListingRepository } from './repositories/job-listing.repository';
import { SavedJobRepository } from './repositories/saved-job.repository';
import { ArtistService } from '../artist/artist.service';
import { CreateJobListingDto } from './dto/create-job-listing.dto';
import { UpdateJobListingDto } from './dto/update-job-listing.dto';
import { DataVersionHistoryService } from '../common/services/data-version-history.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly jobListingRepository: JobListingRepository,
    private readonly savedJobRepository: SavedJobRepository,
    private readonly artistService: ArtistService,
    private readonly versionHistoryService: DataVersionHistoryService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createDto: CreateJobListingDto & { tenantId: string; createdBy: string }) {
    const jobListing = await this.jobListingRepository.create(createDto);

    // Record version history
    await this.versionHistoryService.recordChange({
      tenantId: createDto.tenantId,
      tableName: 'job_listings',
      recordId: jobListing.id,
      version: 1,
      operation: 'CREATE',
      data: jobListing,
      userId: createDto.createdBy,
    });

    return jobListing;
  }

  async findAll(filters: {
    tenantId?: string;
    status?: string;
    type?: string;
    artistType?: string;
    location?: string;
    isRemote?: boolean;
    projectId?: string;
    skills?: string[];
    minRate?: number;
    maxRate?: number;
    page: number;
    limit: number;
  }) {
    // If no tenantId provided, only show published jobs
    if (!filters.tenantId) {
      filters.status = 'open';
    }

    return this.jobListingRepository.findAll(filters);
  }

  async findOne(id: string) {
    return this.jobListingRepository.findOne(id);
  }

  async update(id: string, updateDto: UpdateJobListingDto & { updatedBy: string }) {
    const job = await this.findOne(id);
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    const previousData = { ...job };
    const updatedJob = await this.jobListingRepository.update(id, updateDto);

    // Record version history
    const currentVersion = await this.versionHistoryService.getCurrentVersion(
      'job_listings',
      id,
    );
    
    await this.versionHistoryService.recordChange({
      tenantId: job.tenantId,
      tableName: 'job_listings',
      recordId: id,
      version: currentVersion + 1,
      operation: 'UPDATE',
      data: updatedJob,
      delta: this.calculateDelta(previousData, updatedJob),
      userId: updateDto.updatedBy,
    });

    return updatedJob;
  }

  async remove(id: string, tenantId: string) {
    const job = await this.findOne(id);
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    await this.jobListingRepository.delete(id);

    // Record deletion in version history
    const currentVersion = await this.versionHistoryService.getCurrentVersion(
      'job_listings',
      id,
    );
    
    await this.versionHistoryService.recordChange({
      tenantId,
      tableName: 'job_listings',
      recordId: id,
      version: currentVersion + 1,
      operation: 'DELETE',
      data: job,
    });

    return { success: true };
  }

  async updateStatus(id: string, status: string, userId: string) {
    const job = await this.findOne(id);
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    const updatedJob = await this.jobListingRepository.update(id, {
      status,
      ...(status === 'open' ? { publishedAt: new Date() } : {}),
      ...(status === 'closed' ? { closedAt: new Date() } : {}),
      updatedBy: userId,
    });

    // Send notifications to saved job artists if job is published
    if (status === 'open') {
      await this.notifyArtistsAboutNewJob(job);
    }

    return updatedJob;
  }

  async incrementViewCount(id: string) {
    return this.jobListingRepository.incrementViewCount(id);
  }

  async saveJob(jobId: string, artistId: string, notes?: string) {
    const job = await this.findOne(jobId);
    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    // Check if already saved
    const existing = await this.savedJobRepository.findByArtistAndJob(
      artistId,
      jobId,
    );

    if (existing) {
      throw new ConflictException('Job already saved');
    }

    return this.savedJobRepository.create({
      artistId,
      jobListingId: jobId,
      notes,
    });
  }

  async unsaveJob(jobId: string, artistId: string) {
    const saved = await this.savedJobRepository.findByArtistAndJob(
      artistId,
      jobId,
    );

    if (!saved) {
      throw new NotFoundException('Saved job not found');
    }

    return this.savedJobRepository.delete(saved.id);
  }

  async getSavedJobs(artistId: string, page: number, limit: number) {
    return this.savedJobRepository.findByArtist(artistId, page, limit);
  }

  async getArtistIdForUser(userId: string, tenantId: string): Promise<string | null> {
    const artist = await this.artistService.findByUserId(userId, tenantId);
    return artist?.id || null;
  }

  async getStats(tenantId: string) {
    return this.jobListingRepository.getStats(tenantId);
  }

  private async notifyArtistsAboutNewJob(job: any) {
    // Find artists who match the job criteria
    const matchingArtists = await this.artistService.findMatchingArtists({
      type: job.artistType,
      skills: job.skills,
      location: job.location,
      isRemote: job.isRemote,
    });

    // Send notifications
    for (const artist of matchingArtists) {
      if (artist.userId) {
        await this.notificationService.createNotification({
          tenantId: job.tenantId,
          userId: artist.userId,
          type: 'new_job_match',
          channel: 'in-app',
          payload: {
            jobId: job.id,
            jobTitle: job.title,
            studioName: job.tenant?.name,
            matchReason: 'Your skills match this new job posting',
          },
        });
      }
    }
  }

  private calculateDelta(oldData: any, newData: any): any {
    const delta: any = {};
    
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        delta[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    }

    return delta;
  }
}