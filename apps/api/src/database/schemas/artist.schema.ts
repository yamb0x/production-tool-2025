import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ArtistDocument = Artist & Document;

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  socialMedia?: Record<string, string>;
}

export interface AgentInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

@Schema({
  timestamps: true,
  collection: 'artists',
})
export class Artist {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  realName: string;

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ type: Object })
  contact: ContactInfo;

  @Prop({ type: Object })
  agent: AgentInfo;

  @Prop({ 
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  })
  status: string;

  @Prop({ type: Number, min: 0 })
  rating: number;

  @Prop({ type: String })
  bio: string;

  @Prop({ type: [String], default: [] })
  labels: string[];

  @Prop({ type: Object, default: {} })
  pricing: {
    currency?: string;
    minBookingFee?: number;
    maxBookingFee?: number;
    hourlyRate?: number;
  };

  @Prop({ type: Object, default: {} })
  availability: {
    blackoutDates?: Date[];
    preferredDays?: string[];
    advanceNotice?: number; // days
  };

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String })
  imageUrl: string;

  @Prop({ type: [String], ref: 'Project', default: [] })
  projectIds: string[];

  @Prop({ type: [String], ref: 'Booking', default: [] })
  bookingIds: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ArtistSchema = SchemaFactory.createForClass(Artist);

// Indexes for multi-tenancy and search
ArtistSchema.index({ tenantId: 1, status: 1 });
ArtistSchema.index({ tenantId: 1, name: 'text' });
ArtistSchema.index({ tenantId: 1, genres: 1 });
ArtistSchema.index({ tenantId: 1, tags: 1 });
ArtistSchema.index({ tenantId: 1, rating: -1 });
ArtistSchema.index({ createdAt: -1 });