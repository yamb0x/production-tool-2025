import { Injectable, NotFoundException } from '@nestjs/common';
import { ArtistProfileRepository } from './repositories/artist-profile.repository';
import { ArtistRepository } from './repositories/artist.repository';
import { CreateArtistProfileDto } from './dto/create-artist-profile.dto';
import { UpdateArtistProfileDto } from './dto/update-artist-profile.dto';
import { DataVersionHistoryService } from '../common/services/data-version-history.service';

@Injectable()
export class ArtistProfileService {
  constructor(
    private readonly artistProfileRepository: ArtistProfileRepository,
    private readonly artistRepository: ArtistRepository,
    private readonly versionHistoryService: DataVersionHistoryService,
  ) {}

  async create(
    artistId: string,
    createDto: CreateArtistProfileDto,
    tenantId: string,
    userId: string,
  ) {
    // Verify artist exists and belongs to tenant
    const artist = await this.artistRepository.findOne(artistId, tenantId);
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    const profile = await this.artistProfileRepository.create({
      ...createDto,
      artistId,
    });

    // Record version history
    await this.versionHistoryService.recordChange({
      tenantId,
      tableName: 'artist_profiles',
      recordId: profile.id,
      version: 1,
      operation: 'CREATE',
      data: profile,
      userId,
    });

    return profile;
  }

  async findByArtistId(artistId: string, tenantId: string) {
    const artist = await this.artistRepository.findOne(artistId, tenantId);
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    return this.artistProfileRepository.findByArtistId(artistId);
  }

  async update(
    artistId: string,
    updateDto: UpdateArtistProfileDto,
    tenantId: string,
  ) {
    const profile = await this.findByArtistId(artistId, tenantId);
    if (!profile) {
      throw new NotFoundException('Artist profile not found');
    }

    const previousData = { ...profile };
    const updatedProfile = await this.artistProfileRepository.update(
      profile.id,
      updateDto,
    );

    // Record version history
    const currentVersion = await this.versionHistoryService.getCurrentVersion(
      'artist_profiles',
      profile.id,
    );
    
    await this.versionHistoryService.recordChange({
      tenantId,
      tableName: 'artist_profiles',
      recordId: profile.id,
      version: currentVersion + 1,
      operation: 'UPDATE',
      data: updatedProfile,
      delta: this.calculateDelta(previousData, updatedProfile),
      userId: updateDto.updatedBy,
    });

    return updatedProfile;
  }

  async remove(artistId: string, tenantId: string) {
    const profile = await this.findByArtistId(artistId, tenantId);
    if (!profile) {
      throw new NotFoundException('Artist profile not found');
    }

    await this.artistProfileRepository.delete(profile.id);

    // Record deletion in version history
    const currentVersion = await this.versionHistoryService.getCurrentVersion(
      'artist_profiles',
      profile.id,
    );
    
    await this.versionHistoryService.recordChange({
      tenantId,
      tableName: 'artist_profiles',
      recordId: profile.id,
      version: currentVersion + 1,
      operation: 'DELETE',
      data: profile,
    });

    return { success: true };
  }

  async canUserUpdateProfile(
    artistId: string,
    userId: string,
    tenantId: string,
    userRole: string,
  ): Promise<boolean> {
    // Admins can always update
    if (userRole === 'owner' || userRole === 'manager') {
      return true;
    }

    // Check if user is the artist
    const artist = await this.artistRepository.findOne(artistId, tenantId);
    return artist?.userId === userId;
  }

  async findAll(filters: {
    tenantId: string;
    visibility?: string;
    verified?: boolean;
    type?: string;
    location?: string;
    skills?: string[];
    page: number;
    limit: number;
    userId: string;
    userRole: string;
  }) {
    // Apply visibility rules based on user role
    const visibilityFilter = this.getVisibilityFilter(
      filters.visibility,
      filters.userRole,
    );

    return this.artistProfileRepository.findAll({
      ...filters,
      visibility: visibilityFilter,
    });
  }

  async verifyProfile(artistId: string, tenantId: string) {
    const profile = await this.findByArtistId(artistId, tenantId);
    if (!profile) {
      throw new NotFoundException('Artist profile not found');
    }

    return this.artistProfileRepository.update(profile.id, {
      isVerified: true,
      verifiedAt: new Date(),
    });
  }

  async updatePortfolio(
    artistId: string,
    portfolio: any[],
    tenantId: string,
  ) {
    const profile = await this.findByArtistId(artistId, tenantId);
    if (!profile) {
      throw new NotFoundException('Artist profile not found');
    }

    return this.artistProfileRepository.update(profile.id, {
      portfolio,
      updatedAt: new Date(),
    });
  }

  async updateAvailability(
    artistId: string,
    availability: any,
    tenantId: string,
  ) {
    const profile = await this.findByArtistId(artistId, tenantId);
    if (!profile) {
      throw new NotFoundException('Artist profile not found');
    }

    return this.artistProfileRepository.update(profile.id, {
      availability,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async calculateStats(artistId: string, tenantId: string) {
    const artist = await this.artistRepository.findOne(artistId, tenantId);
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    // Calculate stats from bookings, projects, etc.
    const stats = await this.artistProfileRepository.calculateStats(artistId);

    // Update profile with calculated stats
    const profile = await this.findByArtistId(artistId, tenantId);
    if (profile) {
      await this.artistProfileRepository.update(profile.id, { stats });
    }

    return stats;
  }

  private getVisibilityFilter(
    requestedVisibility: string | undefined,
    userRole: string,
  ): string[] {
    // Admins can see all profiles
    if (userRole === 'owner' || userRole === 'manager') {
      return requestedVisibility ? [requestedVisibility] : ['public', 'studio_only', 'private'];
    }

    // Regular users can only see public and studio_only profiles
    if (requestedVisibility === 'private') {
      return []; // Will return no results
    }

    return requestedVisibility ? [requestedVisibility] : ['public', 'studio_only'];
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