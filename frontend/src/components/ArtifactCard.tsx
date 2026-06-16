import React, { useState, useEffect, useCallback } from 'react';
import { Artifact, ArtifactState, Condition } from '../types';
import { artifactsAPI } from '../services/api';
import './ArtifactCard.css';

interface ArtifactCardProps {
  artifact: Artifact;
  onUpdate: () => void;
}

function parseConditionData(data: Condition['condition_data']): Record<string, unknown> {
  if (typeof data === 'string') {
    return JSON.parse(data);
  }
  return data;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onUpdate }) => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadConditions = useCallback(async () => {
    try {
      const data = await artifactsAPI.getConditions(artifact.id);
      setConditions(data);
    } catch (error) {
      console.error('Failed to load conditions:', error);
    }
  }, [artifact.id]);

  const updateTimeRemaining = useCallback(() => {
    const timeBasedCondition = conditions.find(
      c => c.condition_type === 'time_based' && !c.is_satisfied
    );

    if (timeBasedCondition && artifact.state === ArtifactState.LOCKED) {
      const data = parseConditionData(timeBasedCondition.condition_data);
      if (data.unlock_date) {
        const unlockDate = new Date(data.unlock_date as string);
        const now = new Date();
        const diff = unlockDate.getTime() - now.getTime();

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setTimeRemaining(`${minutes}m`);
          }
        } else {
          setTimeRemaining('Unlocking soon...');
        }
      }
    } else {
      setTimeRemaining('');
    }
  }, [conditions, artifact.state]);

  useEffect(() => {
    loadConditions();
  }, [loadConditions]);

  useEffect(() => {
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [updateTimeRemaining]);

  const handleSatisfyCondition = async (conditionId: string) => {
    if (!window.confirm('Are you sure you want to satisfy this condition? This action cannot be undone.')) {
      return;
    }

    setActionError('');
    try {
      await artifactsAPI.satisfyCondition(artifact.id, conditionId);
      await loadConditions();
      onUpdate();
    } catch (error: any) {
      setActionError(error.response?.data?.error || 'Failed to satisfy condition');
    }
  };

  const handleTransition = async (newState: ArtifactState, reason: string, transformedContent?: string) => {
    if (!window.confirm(`Are you sure you want to transition this artifact to "${newState}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      await artifactsAPI.transitionState(artifact.id, newState, reason, transformedContent);
      onUpdate();
    } catch (error: any) {
      setActionError(error.response?.data?.error || 'Failed to transition artifact');
    } finally {
      setActionLoading(false);
    }
  };

  const getStateColor = (state: ArtifactState) => {
    const colors: Record<ArtifactState, string> = {
      [ArtifactState.LOCKED]: '#ff6b6b',
      [ArtifactState.VISIBLE]: '#51cf66',
      [ArtifactState.TRANSFORMED]: '#ffd43b',
      [ArtifactState.ARCHIVED]: '#74c0fc',
      [ArtifactState.DESTROYED]: '#868e96'
    };
    return colors[state];
  };

  const canViewContent = artifact.state === ArtifactState.VISIBLE ||
                         artifact.state === ArtifactState.TRANSFORMED ||
                         artifact.state === ArtifactState.ARCHIVED;

  return (
    <div className="artifact-card" style={{ borderLeftColor: getStateColor(artifact.state) }}>
      <div className="artifact-header">
        <h3>{artifact.title}</h3>
        <span className={`state-badge state-${artifact.state}`}>
          {artifact.state}
        </span>
      </div>

      <div className="artifact-meta">
        <span className="category">{artifact.category}</span>
        <span className="date">
          {new Date(artifact.created_at).toLocaleDateString()}
        </span>
      </div>

      {artifact.state === ArtifactState.LOCKED && timeRemaining && (
        <div className="time-remaining">
          ⏰ Unlocks in: {timeRemaining}
        </div>
      )}

      <div className="artifact-content">
        {canViewContent ? (
          <p>{artifact.state === ArtifactState.TRANSFORMED
            ? artifact.transformed_content || artifact.content
            : artifact.content}
          </p>
        ) : (
          <p className="locked-content">🔒 Content is locked</p>
        )}
      </div>

      {showDetails && (
        <div className="artifact-conditions">
          <h4>Conditions:</h4>
          {conditions.map(condition => (
            <div key={condition.id} className="condition-item">
              <span className="condition-type">{condition.condition_type}</span>
              {condition.is_satisfied ? (
                <span className="condition-status satisfied">✓ Satisfied</span>
              ) : condition.condition_type === 'behavior_based' ? (
                <button
                  className="satisfy-button"
                  onClick={() => handleSatisfyCondition(condition.id)}
                >
                  Mark as Satisfied
                </button>
              ) : (
                <span className="condition-status pending">Pending</span>
              )}
            </div>
          ))}
        </div>
      )}

      {artifact.state === ArtifactState.VISIBLE && (
        <div className="artifact-actions">
          <button
            disabled={actionLoading}
            onClick={() => handleTransition(ArtifactState.ARCHIVED, 'User archived artifact')}
          >
            Archive
          </button>
          <button
            disabled={actionLoading}
            onClick={() => handleTransition(
              ArtifactState.TRANSFORMED,
              'User transformed artifact',
              artifact.content
            )}
          >
            Transform
          </button>
          <button
            disabled={actionLoading}
            className="destroy-button"
            onClick={() => handleTransition(ArtifactState.DESTROYED, 'User destroyed artifact')}
          >
            Destroy
          </button>
        </div>
      )}

      {actionError && <div className="error-message">{actionError}</div>}

      <button
        className="details-button"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Hide' : 'Show'} Details
      </button>
    </div>
  );
};

export default ArtifactCard;
