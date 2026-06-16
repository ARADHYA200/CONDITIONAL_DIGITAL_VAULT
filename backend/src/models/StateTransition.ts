import mongoose, { Schema, Document } from 'mongoose';
import { ArtifactState } from './Artifact';

export interface IStateTransition extends Document {
  artifact_id: mongoose.Types.ObjectId;
  from_state: ArtifactState;
  to_state: ArtifactState;
  transition_reason: string;
  triggered_by: 'system' | 'user' | 'condition';
  created_at: Date;
}

const StateTransitionSchema = new Schema<IStateTransition>({
  artifact_id: { type: Schema.Types.ObjectId, ref: 'Artifact', required: true },
  from_state: { type: String, required: true },
  to_state: { type: String, required: true },
  transition_reason: { type: String, required: true },
  triggered_by: { type: String, enum: ['system', 'user', 'condition'], required: true },
  created_at: { type: Date, default: Date.now }
});

export const StateTransition = mongoose.model<IStateTransition>('StateTransition', StateTransitionSchema);
