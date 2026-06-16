import mongoose, { Schema, Document } from 'mongoose';

export enum ArtifactState {
  LOCKED = 'locked',
  VISIBLE = 'visible',
  TRANSFORMED = 'transformed',
  ARCHIVED = 'archived',
  DESTROYED = 'destroyed'
}

export enum ArtifactCategory {
  MESSAGE = 'message',
  MEMORY = 'memory',
  ADVICE = 'advice',
  CONFESSION = 'confession',
  DOCUMENT = 'document'
}

export interface IArtifact extends Document {
  user_id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: ArtifactCategory;
  state: ArtifactState;
  created_at: Date;
  unlocked_at?: Date;
  transformed_at?: Date;
  archived_at?: Date;
  destroyed_at?: Date;
  transformed_content?: string;
}

const ArtifactSchema = new Schema<IArtifact>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: Object.values(ArtifactCategory), required: true },
  state: { type: String, enum: Object.values(ArtifactState), default: ArtifactState.LOCKED },
  created_at: { type: Date, default: Date.now },
  unlocked_at: { type: Date, default: null },
  transformed_at: { type: Date, default: null },
  archived_at: { type: Date, default: null },
  destroyed_at: { type: Date, default: null },
  transformed_content: { type: String, default: null }
});

export const Artifact = mongoose.model<IArtifact>('Artifact', ArtifactSchema);
