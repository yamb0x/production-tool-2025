import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ 
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member',
    index: true
  })
  role: string;

  @Prop({ 
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  })
  status: string;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ type: Object, default: {} })
  preferences: Record<string, any>;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  emailVerified: boolean;

  @Prop({ type: String })
  emailVerificationToken: string;

  @Prop({ type: Date })
  emailVerificationTokenExpiresAt: Date;

  @Prop({ type: String })
  passwordResetToken: string;

  @Prop({ type: Date })
  passwordResetTokenExpiresAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound indexes for multi-tenancy
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, status: 1 });
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.index({ createdAt: -1 });