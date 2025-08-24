import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({
  timestamps: true,
  collection: 'tenants',
})
export class Tenant {
  @Prop({ required: true, unique: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @Prop({ 
    type: String, 
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active',
    index: true 
  })
  status: string;

  @Prop({ 
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  })
  plan: string;

  @Prop({ type: Date })
  trialEndsAt: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

// Indexes
TenantSchema.index({ tenantId: 1 }, { unique: true });
TenantSchema.index({ status: 1 });
TenantSchema.index({ createdAt: -1 });