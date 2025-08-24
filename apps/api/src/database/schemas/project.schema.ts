import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({
  timestamps: true,
  collection: 'projects',
})
export class Project {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ 
    type: String,
    enum: ['draft', 'active', 'completed', 'archived', 'cancelled'],
    default: 'draft',
    index: true
  })
  status: string;

  @Prop({ 
    type: String,
    enum: ['album', 'single', 'ep', 'tour', 'merchandise', 'other'],
    required: true,
    index: true
  })
  type: string;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Date })
  deadline: Date;

  @Prop({ type: Object, default: {} })
  budget: {
    total?: number;
    spent?: number;
    currency?: string;
  };

  @Prop({ type: String, ref: 'User' })
  ownerId: string;

  @Prop({ type: [String], ref: 'User', default: [] })
  memberIds: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ 
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  })
  priority: string;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progress: number;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isTemplate: boolean;

  @Prop({ type: String })
  templateId: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes for multi-tenancy and performance
ProjectSchema.index({ tenantId: 1, status: 1 });
ProjectSchema.index({ tenantId: 1, type: 1 });
ProjectSchema.index({ tenantId: 1, priority: 1 });
ProjectSchema.index({ tenantId: 1, ownerId: 1 });
ProjectSchema.index({ tenantId: 1, memberIds: 1 });
ProjectSchema.index({ tenantId: 1, tags: 1 });
ProjectSchema.index({ tenantId: 1, createdAt: -1 });
ProjectSchema.index({ tenantId: 1, deadline: 1 });