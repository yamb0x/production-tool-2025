import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinksDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  linkedin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  artstation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  behance?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vimeo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  github?: string;
}

class PortfolioItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  projectType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  link?: string;
}

class ExperienceDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  company: string;

  @ApiProperty()
  @IsString()
  position: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty()
  @IsBoolean()
  current: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projects?: string[];
}

class EducationDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  institution: string;

  @ApiProperty()
  @IsString()
  degree: string;

  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty()
  @IsBoolean()
  current: boolean;
}

class CertificationDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  issuer: string;

  @ApiProperty()
  @IsString()
  issueDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  credentialId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  url?: string;
}

class LanguageDto {
  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty({ enum: ['native', 'fluent', 'professional', 'conversational', 'basic'] })
  @IsEnum(['native', 'fluent', 'professional', 'conversational', 'basic'])
  proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic';
}

class AvailabilityDto {
  @ApiProperty({ enum: ['available', 'busy', 'on_project', 'not_available'] })
  @IsEnum(['available', 'busy', 'on_project', 'not_available'])
  status: 'available' | 'busy' | 'on_project' | 'not_available';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nextAvailable?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preferredSchedule?: string;

  @ApiProperty()
  @IsBoolean()
  remoteWork: boolean;

  @ApiProperty()
  @IsBoolean()
  willingToTravel: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredLocations?: string[];
}

class PreferencesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectTypes?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  minimumDuration?: number;

  @ApiProperty({ required: false, enum: ['hourly', 'daily', 'project'] })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'project'])
  preferredRateType?: 'hourly' | 'daily' | 'project';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @ApiProperty({ required: false, enum: ['solo', 'small', 'medium', 'large'] })
  @IsOptional()
  @IsEnum(['solo', 'small', 'medium', 'large'])
  teamSize?: 'solo' | 'small' | 'medium' | 'large';
}

export class CreateArtistProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  portfolio?: PortfolioItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages?: LanguageDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AvailabilityDto)
  availability?: AvailabilityDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;

  @ApiProperty({
    required: false,
    enum: ['public', 'studio_only', 'private'],
    default: 'private',
  })
  @IsOptional()
  @IsEnum(['public', 'studio_only', 'private'])
  visibility?: 'public' | 'studio_only' | 'private';
}