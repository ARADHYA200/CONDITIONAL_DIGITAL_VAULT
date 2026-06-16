import mongoose, { Schema, Document } from 'mongoose';

export enum ConditionType {
  TIME_BASED = 'time_based',
  BEHAVIOR_BASED = 'behavior_based',
  INACTIVITY_BASED = 'inactivity_based',
  CHAINED = 'chained'
}

export interface ICondition extends Document {
  artifact_id: mongoose.Types.ObjectId;
  condition_type: ConditionType;
  condition_data: Record<string, any>;
  sequence_order: number;
  is_satisfied: boolean;
  satisfied_at?: Date;
  created_at: Date;
}

const ConditionSchema = new Schema<ICondition>({
  artifact_id: { type: Schema.Types.ObjectId, ref: 'Artifact', required: true },
  condition_type: { type: String, enum: Object.values(ConditionType), required: true },
  condition_data: { type: Schema.Types.Mixed, required: true },
  sequence_order: { type: Number, default: 1 },
  is_satisfied: { type: Boolean, default: false },
  satisfied_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

export const Condition = mongoose.model<ICondition>('Condition', ConditionSchema);
