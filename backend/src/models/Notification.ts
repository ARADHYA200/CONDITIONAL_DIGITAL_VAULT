import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'state_change' | 'condition_met' | 'warning';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  artifact_id?: mongoose.Types.ObjectId | null;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  artifact_id: { type: Schema.Types.ObjectId, ref: 'Artifact', default: null },
  message: { type: String, required: true },
  type: { type: String, enum: ['state_change', 'condition_met', 'warning'], required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
