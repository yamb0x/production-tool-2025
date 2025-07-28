import { Module } from '@nestjs/common';
import { ArtistController } from './artist.controller';
import { ArtistService } from './artist.service';
import { ArtistProfileController } from './artist-profile.controller';
import { ArtistProfileService } from './artist-profile.service';
import { ArtistRepository } from './repositories/artist.repository';
import { ArtistProfileRepository } from './repositories/artist-profile.repository';
import { ArtistGateway } from './artist.gateway';

@Module({
  controllers: [ArtistController, ArtistProfileController],
  providers: [
    ArtistService,
    ArtistProfileService,
    ArtistRepository,
    ArtistProfileRepository,
    ArtistGateway,
  ],
  exports: [ArtistService, ArtistProfileService],
})
export class ArtistModule {}