export enum ArtifactState {
  LOCKED = 'locked',
  VISIBLE = 'visible',
  TRANSFORMED = 'transformed',
  ARCHIVED = 'archived',
  DESTROYED = 'destroyed'
}

export enum ConditionType {
  TIME_BASED = 'time_based',
  BEHAVIOR_BASED = 'behavior_based',
  INACTIVITY_BASED = 'inactivity_based',
  CHAINED = 'chained'
}

export enum ArtifactCategory {
  MESSAGE = 'message',
  MEMORY = 'memory',
  ADVICE = 'advice',
  CONFESSION = 'confession',
  DOCUMENT = 'document'
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_login_at: string | null;
}

export interface Artifact {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: ArtifactCategory;
  state: ArtifactState;
  created_at: string;
  unlocked_at: string | null;
  transformed_at: string | null;
  archived_at: string | null;
  destroyed_at: string | null;
  transformed_content: string | null;
}

export interface Condition {
  id: string;
  artifact_id: string;
  condition_type: ConditionType;
  condition_data: Record<string, unknown> | string;
  sequence_order: number;
  is_satisfied: boolean;
  satisfied_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  artifact_id: string | null;
  message: string;
  type: 'state_change' | 'condition_met' | 'warning';
  is_read: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
