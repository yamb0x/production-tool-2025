import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export interface BookingDetails {
  location?: string;
  venue?: string;
  capacity?: number;
  soundCheck?: Date;
  loadIn?: Date;
  performanceTime?: Date;
  duration?: number; // in minutes
}

export interface BookingFinancials {
  fee?: number;
  deposit?: number;
  depositPaid?: boolean;
  depositPaidAt?: Date;
  balanceDue?: number;
  balancePaidAt?: Date;
  currency?: string;
  expenses?: Array<{
    description: string;
    amount: number;
    date: Date;
  }>;
}

@Schema({
  timestamps: true,
  collection: 'bookings',
})
export class Booking {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, ref: 'Project' })
  projectId: string;

  @Prop({ required: true, ref: 'Artist' })
  artistId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ 
    type: String,
    enum: ['pending', 'confirmed', 'tentative', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  })
  status: string;

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Object })
  details: BookingDetails;

  @Prop({ type: Object })
  financials: BookingFinancials;

  @Prop({ type: String })
  contractUrl: string;

  @Prop({ type: String })
  contractStatus: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: String })
  notes: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String, ref: 'User' })
  createdBy: string;

  @Prop({ type: String, ref: 'User' })
  assignedTo: string;

  @Prop({ type: Boolean, default: false })
  isRecurring: boolean;

  @Prop({ type: String })
  recurringPattern: string; // RRULE format

  @Prop({ type: String })
  parentBookingId: string; // For recurring bookings

  @Prop({ type: Date })
  confirmedAt: Date;

  @Prop({ type: Date })
  cancelledAt: Date;

  @Prop({ type: String })
  cancellationReason: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes for multi-tenancy and queries
BookingSchema.index({ tenantId: 1, status: 1 });
BookingSchema.index({ tenantId: 1, projectId: 1 });
BookingSchema.index({ tenantId: 1, artistId: 1 });
BookingSchema.index({ tenantId: 1, date: 1 });
BookingSchema.index({ tenantId: 1, createdBy: 1 });
BookingSchema.index({ tenantId: 1, assignedTo: 1 });
BookingSchema.index({ createdAt: -1 });