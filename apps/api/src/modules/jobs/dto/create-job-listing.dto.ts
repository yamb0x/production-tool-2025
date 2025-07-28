import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  IsDate,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class JobMetadataDto {
  @ApiProperty({ required: false, enum: ['junior', 'mid', 'senior', 'lead', 'director'] })
  @IsOptional()
  @IsEnum(['junior', 'mid', 'senior', 'lead', 'director'])
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead' | 'director';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teamSize?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reportingTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

export class CreateJobListingDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responsibilities?: string;

  @ApiProperty({ enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship'] })
  @IsEnum(['full_time', 'part_time', 'contract', 'freelance', 'internship'])
  type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';

  @ApiProperty({ enum: ['3d_artist', 'animator', 'compositor', 'lighter', 'rigger', 'modeler', 'fx_artist', 'freelancer'] })
  @IsEnum(['3d_artist', 'animator', 'compositor', 'lighter', 'rigger', 'modeler', 'fx_artist', 'freelancer'])
  artistType: '3d_artist' | 'animator' | 'compositor' | 'lighter' | 'rigger' | 'modeler' | 'fx_artist' | 'freelancer';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  isRemote: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rateMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rateMax?: number;

  @ApiProperty({ required: false, enum: ['hourly', 'daily', 'project', 'annual'] })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'project', 'annual'])
  rateType?: 'hourly' | 'daily' | 'project' | 'annual';

  @ApiProperty({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  applicationDeadline?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => JobMetadataDto)
  metadata?: JobMetadataDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  @ApiProperty({ required: false, enum: ['draft', 'open'], default: 'draft' })
  @IsOptional()
  @IsEnum(['draft', 'open'])
  status?: 'draft' | 'open';
}