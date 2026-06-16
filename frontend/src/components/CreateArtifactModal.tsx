import React, { useState } from 'react';
import { ArtifactCategory, ConditionType } from '../types';
import { artifactsAPI } from '../services/api';
import './CreateArtifactModal.css';

interface CreateArtifactModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateArtifactModal: React.FC<CreateArtifactModalProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ArtifactCategory>(ArtifactCategory.MESSAGE);
  const [conditions, setConditions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const addCondition = (type: ConditionType) => {
    const newCondition: any = { condition_type: type, condition_data: {} };
    
    if (type === ConditionType.TIME_BASED) {
      newCondition.condition_data = { unlock_duration_days: 1 };
    } else if (type === ConditionType.BEHAVIOR_BASED) {
      newCondition.condition_data = { required_action: '', confirmation_required: true };
    } else if (type === ConditionType.INACTIVITY_BASED) {
      newCondition.condition_data = { days_of_inactivity: 7, action_on_inactivity: 'archive' };
    }
    
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const updated = [...conditions];
    updated[index].condition_data[field] = value;
    setConditions(updated);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (conditions.length === 0) {
      setError('At least one condition is required');
      return;
    }

    if (!showWarning) {
      setShowWarning(true);
      return;
    }

    setLoading(true);

    try {
      await artifactsAPI.create({
        title,
        content,
        category,
        conditions
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create artifact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Artifact</h2>
        
        {showWarning && (
          <div className="warning-box">
            <h3>⚠️ Important Warning</h3>
            <p>Once created, conditions cannot be modified. State transitions are irreversible.</p>
            <ul>
              <li>Locked content cannot be viewed until conditions are met</li>
              <li>Destroyed artifacts cannot be recovered</li>
              <li>Transformed content replaces the original permanently</li>
            </ul>
            <p><strong>Are you sure you want to proceed?</strong></p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ArtifactCategory)}>
              {Object.values(ArtifactCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Conditions</label>
            <div className="condition-buttons">
              <button type="button" onClick={() => addCondition(ConditionType.TIME_BASED)}>
                + Time-Based
              </button>
              <button type="button" onClick={() => addCondition(ConditionType.BEHAVIOR_BASED)}>
                + Behavior-Based
              </button>
              <button type="button" onClick={() => addCondition(ConditionType.INACTIVITY_BASED)}>
                + Inactivity-Based
              </button>
            </div>

            {conditions.map((condition, index) => (
              <div key={index} className="condition-editor">
                <div className="condition-header">
                  <span>{condition.condition_type}</span>
                  <button type="button" onClick={() => removeCondition(index)}>Remove</button>
                </div>

                {condition.condition_type === ConditionType.TIME_BASED && (
                  <>
                    <input
                      type="number"
                      placeholder="Days until unlock"
                      value={condition.condition_data.unlock_duration_days || ''}
                      onChange={(e) => updateCondition(index, 'unlock_duration_days', parseInt(e.target.value))}
                      min="0"
                    />
                    <input
                      type="datetime-local"
                      placeholder="Or specific date"
                      onChange={(e) => updateCondition(index, 'unlock_date', new Date(e.target.value).toISOString())}
                    />
                  </>
                )}

                {condition.condition_type === ConditionType.BEHAVIOR_BASED && (
                  <input
                    type="text"
                    placeholder="Required action description"
                    value={condition.condition_data.required_action || ''}
                    onChange={(e) => updateCondition(index, 'required_action', e.target.value)}
                  />
                )}

                {condition.condition_type === ConditionType.INACTIVITY_BASED && (
                  <>
                    <input
                      type="number"
                      placeholder="Days of inactivity"
                      value={condition.condition_data.days_of_inactivity || ''}
                      onChange={(e) => updateCondition(index, 'days_of_inactivity', parseInt(e.target.value))}
                      min="1"
                    />
                    <select
                      value={condition.condition_data.action_on_inactivity || 'archive'}
                      onChange={(e) => updateCondition(index, 'action_on_inactivity', e.target.value)}
                    >
                      <option value="archive">Archive</option>
                      <option value="destroy">Destroy</option>
                      <option value="transform">Transform</option>
                    </select>
                  </>
                )}
              </div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating...' : showWarning ? 'Confirm Creation' : 'Review & Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateArtifactModal;
