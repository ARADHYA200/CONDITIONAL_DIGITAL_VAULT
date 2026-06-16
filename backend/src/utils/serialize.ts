import { Types } from 'mongoose';
import { IUser } from '../models/User';
import { IArtifact } from '../models/Artifact';
import { ICondition } from '../models/Condition';
import { INotification } from '../models/Notification';

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

export function serializeUser(user: IUser) {
  return {
    id: user._id.toString(),
    email: user.email,
    created_at: user.created_at.toISOString(),
    last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null
  };
}

export function serializeArtifact(artifact: IArtifact) {
  return {
    id: artifact._id.toString(),
    user_id: artifact.user_id.toString(),
    title: artifact.title,
    content: artifact.content,
    category: artifact.category,
    state: artifact.state,
    created_at: artifact.created_at.toISOString(),
    unlocked_at: artifact.unlocked_at ? artifact.unlocked_at.toISOString() : null,
    transformed_at: artifact.transformed_at ? artifact.transformed_at.toISOString() : null,
    archived_at: artifact.archived_at ? artifact.archived_at.toISOString() : null,
    destroyed_at: artifact.destroyed_at ? artifact.destroyed_at.toISOString() : null,
    transformed_content: artifact.transformed_content ?? null
  };
}

export function serializeCondition(condition: ICondition) {
  return {
    id: condition._id.toString(),
    artifact_id: condition.artifact_id.toString(),
    condition_type: condition.condition_type,
    condition_data: condition.condition_data,
    sequence_order: condition.sequence_order,
    is_satisfied: condition.is_satisfied,
    satisfied_at: condition.satisfied_at ? condition.satisfied_at.toISOString() : null,
    created_at: condition.created_at.toISOString()
  };
}

export function serializeNotification(notification: INotification) {
  return {
    id: notification._id.toString(),
    user_id: notification.user_id.toString(),
    artifact_id: notification.artifact_id ? notification.artifact_id.toString() : null,
    message: notification.message,
    type: notification.type,
    is_read: notification.is_read,
    created_at: notification.created_at.toISOString()
  };
}

export type SerializedUser = ReturnType<typeof serializeUser>;
export type SerializedArtifact = ReturnType<typeof serializeArtifact>;
export type SerializedCondition = ReturnType<typeof serializeCondition>;
export type SerializedNotification = ReturnType<typeof serializeNotification>;
