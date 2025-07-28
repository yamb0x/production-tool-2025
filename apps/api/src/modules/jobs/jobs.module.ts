import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobApplicationsController } from './job-applications.controller';
import { JobApplicationsService } from './job-applications.service';
import { JobListingRepository } from './repositories/job-listing.repository';
import { JobApplicationRepository } from './repositories/job-application.repository';
import { SavedJobRepository } from './repositories/saved-job.repository';
import { JobsGateway } from './jobs.gateway';
import { ArtistModule } from '../artist/artist.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ArtistModule, NotificationModule],
  controllers: [JobsController, JobApplicationsController],
  providers: [
    JobsService,
    JobApplicationsService,
    JobListingRepository,
    JobApplicationRepository,
    SavedJobRepository,
    JobsGateway,
  ],
  exports: [JobsService, JobApplicationsService],
})
export class JobsModule {}