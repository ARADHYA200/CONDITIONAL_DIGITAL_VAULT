import { Notification } from '../models/Notification';
import { ArtifactState } from '../models/Artifact';
import { getUserById as getAuthUser } from './auth.service';
import { serializeNotification, SerializedArtifact } from '../utils/serialize';

export async function createNotification(
  userId: string,
  artifactId: string | null,
  message: string,
  type: 'state_change' | 'condition_met' | 'warning'
) {
  const notification = await Notification.create({
    user_id: userId,
    artifact_id: artifactId,
    message,
    type
  });

  return serializeNotification(notification);
}

export async function getUserNotifications(userId: string, unreadOnly: boolean = false) {
  const filter: Record<string, unknown> = { user_id: userId };
  if (unreadOnly) {
    filter.is_read = false;
  }

  const notifications = await Notification.find(filter).sort({ created_at: -1 });
  return notifications.map(serializeNotification);
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await Notification.updateOne(
    { _id: notificationId, user_id: userId },
    { is_read: true }
  );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await Notification.updateMany({ user_id: userId }, { is_read: true });
}

export async function notifyStateChange(artifact: SerializedArtifact, newState: ArtifactState): Promise<void> {
  const stateMessages: Record<ArtifactState, string> = {
    [ArtifactState.LOCKED]: 'Artifact is locked',
    [ArtifactState.VISIBLE]: 'Artifact is now visible',
    [ArtifactState.TRANSFORMED]: 'Artifact has been transformed',
    [ArtifactState.ARCHIVED]: 'Artifact has been archived',
    [ArtifactState.DESTROYED]: 'Artifact has been destroyed'
  };

  await createNotification(
    artifact.user_id,
    artifact.id,
    `"${artifact.title}" - ${stateMessages[newState]}`,
    'state_change'
  );
}

export async function getUserById(userId: string): Promise<{ last_login_at: string | null } | null> {
  const user = await getAuthUser(userId);
  return user ? { last_login_at: user.last_login_at } : null;
}
