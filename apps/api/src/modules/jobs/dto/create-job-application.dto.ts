import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  IsDate,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class ApplicationAttachmentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  type: string;
}

class ApplicationMetadataDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referral?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  questionnaire?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationAttachmentDto)
  attachments?: ApplicationAttachmentDto[];
}

export class CreateJobApplicationDto {
  @ApiProperty()
  @IsString()
  jobListingId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  availableFrom?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ApplicationMetadataDto)
  metadata?: ApplicationMetadataDto;
}