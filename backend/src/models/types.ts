/**
 * Type definitions for the Conditional Digital Vault system
 * (Enums and interfaces are now defined in individual model files)
 */

export { User, type IUser } from './User';
export { Artifact, type IArtifact, ArtifactState, ArtifactCategory } from './Artifact';
export { Condition, type ICondition, ConditionType } from './Condition';
export { StateTransition, type IStateTransition } from './StateTransition';
export { AuditLog, type IAuditLog } from './AuditLog';
export { Notification, type INotification, type NotificationType } from './Notification';

// Type definitions for condition data
export interface TimeBasedConditionData {
  unlock_date?: string; // ISO date string
  unlock_duration_days?: number; // Days from creation
}

export interface BehaviorBasedConditionData {
  required_action: string; // Description of required action
  confirmation_required: boolean;
}

export interface InactivityBasedConditionData {
  days_of_inactivity: number;
  action_on_inactivity: 'archive' | 'destroy' | 'transform';
}

export interface ChainedConditionData {
  condition_ids: string[]; // ObjectIds of conditions that must be satisfied
}

