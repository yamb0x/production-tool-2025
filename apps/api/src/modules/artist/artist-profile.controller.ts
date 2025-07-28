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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArtistProfileService } from './artist-profile.service';
import { CreateArtistProfileDto } from './dto/create-artist-profile.dto';
import { UpdateArtistProfileDto } from './dto/update-artist-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('artist-profiles')
@ApiBearerAuth()
@Controller('artist-profiles')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ArtistProfileController {
  constructor(private readonly artistProfileService: ArtistProfileService) {}

  @Post(':artistId')
  @ApiOperation({ summary: 'Create artist profile' })
  async create(
    @Param('artistId') artistId: string,
    @Body() createDto: CreateArtistProfileDto,
    @Req() req: RequestWithUser,
  ) {
    return this.artistProfileService.create(
      artistId,
      createDto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Get(':artistId')
  @ApiOperation({ summary: 'Get artist profile' })
  async findOne(
    @Param('artistId') artistId: string,
    @Req() req: RequestWithUser,
  ) {
    const profile = await this.artistProfileService.findByArtistId(
      artistId,
      req.user.tenantId,
    );
    
    if (!profile) {
      throw new NotFoundException('Artist profile not found');
    }

    // Check visibility permissions
    if (profile.visibility === 'private' && profile.artist.userId !== req.user.id) {
      throw new ForbiddenException('This profile is private');
    }

    return profile;
  }

  @Put(':artistId')
  @ApiOperation({ summary: 'Update artist profile' })
  async update(
    @Param('artistId') artistId: string,
    @Body() updateDto: UpdateArtistProfileDto,
    @Req() req: RequestWithUser,
  ) {
    // Only the artist or studio admins can update profiles
    const canUpdate = await this.artistProfileService.canUserUpdateProfile(
      artistId,
      req.user.id,
      req.user.tenantId,
      req.user.role,
    );

    if (!canUpdate) {
      throw new ForbiddenException('You cannot update this profile');
    }

    return this.artistProfileService.update(
      artistId,
      updateDto,
      req.user.tenantId,
    );
  }

  @Delete(':artistId')
  @ApiOperation({ summary: 'Delete artist profile' })
  async remove(
    @Param('artistId') artistId: string,
    @Req() req: RequestWithUser,
  ) {
    // Only studio admins can delete profiles
    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can delete profiles');
    }

    return this.artistProfileService.remove(artistId, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List artist profiles' })
  async findAll(
    @Query('visibility') visibility?: string,
    @Query('verified') verified?: boolean,
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('skills') skills?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Req() req?: RequestWithUser,
  ) {
    return this.artistProfileService.findAll({
      tenantId: req.user.tenantId,
      visibility,
      verified,
      type,
      location,
      skills: skills?.split(','),
      page,
      limit,
      userId: req.user.id,
      userRole: req.user.role,
    });
  }

  @Post(':artistId/verify')
  @ApiOperation({ summary: 'Verify artist profile' })
  async verify(
    @Param('artistId') artistId: string,
    @Req() req: RequestWithUser,
  ) {
    // Only studio admins can verify profiles
    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      throw new ForbiddenException('Only admins can verify profiles');
    }

    return this.artistProfileService.verifyProfile(
      artistId,
      req.user.tenantId,
    );
  }

  @Put(':artistId/portfolio')
  @ApiOperation({ summary: 'Update artist portfolio' })
  async updatePortfolio(
    @Param('artistId') artistId: string,
    @Body() portfolio: any[],
    @Req() req: RequestWithUser,
  ) {
    const canUpdate = await this.artistProfileService.canUserUpdateProfile(
      artistId,
      req.user.id,
      req.user.tenantId,
      req.user.role,
    );

    if (!canUpdate) {
      throw new ForbiddenException('You cannot update this portfolio');
    }

    return this.artistProfileService.updatePortfolio(
      artistId,
      portfolio,
      req.user.tenantId,
    );
  }

  @Put(':artistId/availability')
  @ApiOperation({ summary: 'Update artist availability' })
  async updateAvailability(
    @Param('artistId') artistId: string,
    @Body() availability: any,
    @Req() req: RequestWithUser,
  ) {
    const canUpdate = await this.artistProfileService.canUserUpdateProfile(
      artistId,
      req.user.id,
      req.user.tenantId,
      req.user.role,
    );

    if (!canUpdate) {
      throw new ForbiddenException('You cannot update availability');
    }

    return this.artistProfileService.updateAvailability(
      artistId,
      availability,
      req.user.tenantId,
    );
  }

  @Get(':artistId/stats')
  @ApiOperation({ summary: 'Get artist statistics' })
  async getStats(
    @Param('artistId') artistId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.artistProfileService.calculateStats(
      artistId,
      req.user.tenantId,
    );
  }
}