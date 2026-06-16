import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  artifact_id?: mongoose.Types.ObjectId | null;
  user_id: mongoose.Types.ObjectId;
  action: string;
  details: Record<string, any>;
  created_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  artifact_id: { type: Schema.Types.ObjectId, ref: 'Artifact', default: null },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed, required: true },
  created_at: { type: Date, default: Date.now }
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
