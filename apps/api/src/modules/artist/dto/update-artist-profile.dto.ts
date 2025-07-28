import { PartialType } from '@nestjs/swagger';
import { CreateArtistProfileDto } from './create-artist-profile.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateArtistProfileDto extends PartialType(CreateArtistProfileDto) {
  @IsOptional()
  @IsString()
  updatedBy?: string;
}