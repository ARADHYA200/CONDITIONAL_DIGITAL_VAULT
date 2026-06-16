import { Artifact, ArtifactState, ArtifactCategory } from '../models/Artifact';
import { Condition, ConditionType } from '../models/Condition';
import { StateTransition } from '../models/StateTransition';
import { AuditLog } from '../models/AuditLog';
import {
  TimeBasedConditionData,
  BehaviorBasedConditionData,
  InactivityBasedConditionData,
  ChainedConditionData
} from '../models/types';
import { notifyStateChange } from './notification.service';
import { serializeArtifact, SerializedArtifact } from '../utils/serialize';
import { isValidObjectId } from '../utils/serialize';

export interface CreateArtifactDTO {
  title: string;
  content: string;
  category: ArtifactCategory;
  conditions: CreateConditionDTO[];
}

export interface CreateConditionDTO {
  condition_type: ConditionType;
  condition_data: TimeBasedConditionData | BehaviorBasedConditionData | InactivityBasedConditionData | ChainedConditionData;
  sequence_order?: number;
}

function filterLockedContent(artifact: SerializedArtifact): SerializedArtifact {
  if (artifact.state === ArtifactState.LOCKED || artifact.state === ArtifactState.DESTROYED) {
    return {
      ...artifact,
      content: '[LOCKED]',
      transformed_content: null
    };
  }
  return artifact;
}

export async function createArtifact(
  userId: string,
  dto: CreateArtifactDTO
): Promise<SerializedArtifact> {
  if (!dto.conditions || dto.conditions.length === 0) {
    throw new Error('At least one condition is required');
  }

  const artifact = await Artifact.create({
    user_id: userId,
    title: dto.title,
    content: dto.content,
    category: dto.category,
    state: ArtifactState.LOCKED
  });

  for (let i = 0; i < dto.conditions.length; i++) {
    const condition = dto.conditions[i];
    await Condition.create({
      artifact_id: artifact._id,
      condition_type: condition.condition_type,
      condition_data: condition.condition_data,
      sequence_order: condition.sequence_order ?? i
    });
  }

  await logStateTransition(
    artifact._id.toString(),
    ArtifactState.LOCKED,
    ArtifactState.LOCKED,
    'Artifact created and locked',
    'system'
  );

  return serializeArtifact(artifact);
}

export async function getUserArtifacts(userId: string): Promise<SerializedArtifact[]> {
  const artifacts = await Artifact.find({ user_id: userId }).sort({ created_at: -1 });
  return artifacts.map(a => filterLockedContent(serializeArtifact(a)));
}

export async function getArtifactById(artifactId: string, userId: string): Promise<SerializedArtifact | null> {
  if (!isValidObjectId(artifactId)) {
    return null;
  }

  const artifact = await Artifact.findOne({ _id: artifactId, user_id: userId });
  if (!artifact) {
    return null;
  }

  return filterLockedContent(serializeArtifact(artifact));
}

export async function getArtifactConditions(artifactId: string) {
  const conditions = await Condition.find({ artifact_id: artifactId }).sort({ sequence_order: 1 });
  return conditions.map(c => ({
    id: c._id.toString(),
    artifact_id: c.artifact_id.toString(),
    condition_type: c.condition_type,
    condition_data: c.condition_data,
    sequence_order: c.sequence_order,
    is_satisfied: c.is_satisfied,
    satisfied_at: c.satisfied_at ? c.satisfied_at.toISOString() : null,
    created_at: c.created_at.toISOString()
  }));
}

export async function logStateTransition(
  artifactId: string,
  fromState: ArtifactState,
  toState: ArtifactState,
  reason: string,
  triggeredBy: 'system' | 'user' | 'condition'
): Promise<void> {
  await StateTransition.create({
    artifact_id: artifactId,
    from_state: fromState,
    to_state: toState,
    transition_reason: reason,
    triggered_by: triggeredBy
  });
}

export async function transitionArtifactState(
  artifactId: string,
  newState: ArtifactState,
  reason: string,
  triggeredBy: 'system' | 'user' | 'condition',
  transformedContent?: string
): Promise<SerializedArtifact> {
  const artifact = await Artifact.findById(artifactId);
  if (!artifact) {
    throw new Error('Artifact not found');
  }

  const currentState = artifact.state;

  if (!isValidTransition(currentState, newState)) {
    throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
  }

  artifact.state = newState;

  if (newState === ArtifactState.VISIBLE && !artifact.unlocked_at) {
    artifact.unlocked_at = new Date();
  } else if (newState === ArtifactState.TRANSFORMED && !artifact.transformed_at) {
    artifact.transformed_at = new Date();
    if (transformedContent) {
      artifact.transformed_content = transformedContent;
    }
  } else if (newState === ArtifactState.ARCHIVED && !artifact.archived_at) {
    artifact.archived_at = new Date();
  } else if (newState === ArtifactState.DESTROYED && !artifact.destroyed_at) {
    artifact.destroyed_at = new Date();
    artifact.content = '[DESTROYED]';
    artifact.transformed_content = undefined;
  }

  await artifact.save();
  await logStateTransition(artifactId, currentState, newState, reason, triggeredBy);

  const serialized = serializeArtifact(artifact);
  await notifyStateChange(serialized, newState);

  return serialized;
}

function isValidTransition(from: ArtifactState, to: ArtifactState): boolean {
  const allowedTransitions: Record<ArtifactState, ArtifactState[]> = {
    [ArtifactState.LOCKED]: [ArtifactState.VISIBLE, ArtifactState.DESTROYED],
    [ArtifactState.VISIBLE]: [ArtifactState.TRANSFORMED, ArtifactState.ARCHIVED, ArtifactState.DESTROYED],
    [ArtifactState.TRANSFORMED]: [ArtifactState.ARCHIVED, ArtifactState.DESTROYED],
    [ArtifactState.ARCHIVED]: [ArtifactState.DESTROYED],
    [ArtifactState.DESTROYED]: []
  };

  return allowedTransitions[from]?.includes(to) || false;
}

export async function createAuditLog(
  userId: string,
  artifactId: string | null,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  await AuditLog.create({
    user_id: userId,
    artifact_id: artifactId,
    action,
    details
  });
}
