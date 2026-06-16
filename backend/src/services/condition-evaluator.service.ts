import { Artifact, ArtifactState } from '../models/Artifact';
import { Condition, ConditionType } from '../models/Condition';
import {
  TimeBasedConditionData,
  BehaviorBasedConditionData,
  InactivityBasedConditionData,
  ChainedConditionData
} from '../models/types';
import { transitionArtifactState } from './artifact.service';
import { getUserById as getUserForCondition } from './notification.service';
import { ICondition } from '../models/Condition';
import { IArtifact } from '../models/Artifact';

function parseConditionData(data: unknown): Record<string, unknown> {
  if (typeof data === 'string') {
    return JSON.parse(data);
  }
  return data as Record<string, unknown>;
}

export async function evaluateArtifactConditions(artifactId: string): Promise<void> {
  const artifact = await Artifact.findById(artifactId);
  if (!artifact || artifact.state === ArtifactState.DESTROYED) {
    return;
  }

  const conditions = await Condition.find({ artifact_id: artifactId }).sort({ sequence_order: 1 });
  if (conditions.length === 0) {
    return;
  }

  for (const condition of conditions) {
    if (condition.is_satisfied) {
      continue;
    }

    const isSatisfied = await evaluateCondition(condition, artifact);

    if (isSatisfied) {
      condition.is_satisfied = true;
      condition.satisfied_at = new Date();
      await condition.save();

      const freshConditions = await Condition.find({ artifact_id: artifactId }).sort({ sequence_order: 1 });
      if (await allConditionsSatisfied(freshConditions)) {
        await triggerStateTransition(artifact, condition);
      }
    }
  }
}

async function evaluateCondition(condition: ICondition, artifact: IArtifact): Promise<boolean> {
  const conditionData = parseConditionData(condition.condition_data);

  switch (condition.condition_type) {
    case ConditionType.TIME_BASED:
      return evaluateTimeBasedCondition(conditionData as TimeBasedConditionData, artifact);

    case ConditionType.BEHAVIOR_BASED:
      return false;

    case ConditionType.INACTIVITY_BASED:
      return await evaluateInactivityBasedCondition(conditionData as unknown as InactivityBasedConditionData, artifact);

    case ConditionType.CHAINED:
      return await evaluateChainedCondition(conditionData as unknown as ChainedConditionData);

    default:
      return false;
  }
}

function evaluateTimeBasedCondition(data: TimeBasedConditionData, artifact: IArtifact): boolean {
  const now = new Date();

  if (data.unlock_date) {
    return now >= new Date(data.unlock_date);
  }

  if (data.unlock_duration_days !== undefined) {
    const createdDate = new Date(artifact.created_at);
    const unlockDate = new Date(createdDate);
    unlockDate.setDate(unlockDate.getDate() + data.unlock_duration_days);
    return now >= unlockDate;
  }

  return false;
}

async function evaluateInactivityBasedCondition(
  data: InactivityBasedConditionData,
  artifact: IArtifact
): Promise<boolean> {
  const user = await getUserForCondition(artifact.user_id.toString());
  if (!user) {
    return false;
  }

  if (!user.last_login_at) {
    const createdDate = new Date(artifact.created_at);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation >= data.days_of_inactivity) {
      await triggerInactivityAction(artifact, data.action_on_inactivity);
      return true;
    }
    return false;
  }

  const lastLogin = new Date(user.last_login_at);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin >= data.days_of_inactivity) {
    await triggerInactivityAction(artifact, data.action_on_inactivity);
    return true;
  }

  return false;
}

async function evaluateChainedCondition(data: ChainedConditionData): Promise<boolean> {
  if (!data.condition_ids || data.condition_ids.length === 0) {
    return false;
  }

  const conditions = await Condition.find({ _id: { $in: data.condition_ids } });
  return conditions.length === data.condition_ids.length && conditions.every(c => c.is_satisfied);
}

async function allConditionsSatisfied(conditions: ICondition[]): Promise<boolean> {
  const chainedConditions = conditions.filter(c => c.condition_type === ConditionType.CHAINED);

  if (chainedConditions.length > 0) {
    return chainedConditions.every(c => c.is_satisfied);
  }

  return conditions.every(c => c.is_satisfied);
}

async function triggerStateTransition(artifact: IArtifact, condition: ICondition): Promise<void> {
  if (artifact.state === ArtifactState.LOCKED) {
    await transitionArtifactState(
      artifact._id.toString(),
      ArtifactState.VISIBLE,
      `Condition satisfied: ${condition.condition_type}`,
      'condition'
    );
  }
}

async function triggerInactivityAction(
  artifact: IArtifact,
  action: 'archive' | 'destroy' | 'transform'
): Promise<void> {
  if (artifact.state === ArtifactState.DESTROYED) {
    return;
  }

  const artifactId = artifact._id.toString();

  switch (action) {
    case 'archive':
      await transitionArtifactState(artifactId, ArtifactState.ARCHIVED, 'User inactivity threshold reached', 'condition');
      break;
    case 'destroy':
      await transitionArtifactState(artifactId, ArtifactState.DESTROYED, 'User inactivity threshold reached', 'condition');
      break;
    case 'transform':
      await transitionArtifactState(
        artifactId,
        ArtifactState.TRANSFORMED,
        'User inactivity threshold reached',
        'condition',
        '[Content transformed due to inactivity]'
      );
      break;
  }
}

export async function satisfyBehaviorCondition(conditionId: string, artifactId: string): Promise<void> {
  const condition = await Condition.findOne({ _id: conditionId, artifact_id: artifactId });
  if (!condition || condition.condition_type !== ConditionType.BEHAVIOR_BASED) {
    throw new Error('Invalid behavior condition');
  }

  condition.is_satisfied = true;
  condition.satisfied_at = new Date();
  await condition.save();

  const artifact = await Artifact.findById(artifactId);
  if (!artifact) {
    throw new Error('Artifact not found');
  }

  const allConditions = await Condition.find({ artifact_id: artifactId });

  if (await allConditionsSatisfied(allConditions) && artifact.state === ArtifactState.LOCKED) {
    await transitionArtifactState(
      artifactId,
      ArtifactState.VISIBLE,
      'Behavior condition satisfied by user',
      'user'
    );
  }
}
