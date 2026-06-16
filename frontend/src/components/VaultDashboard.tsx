import React, { useState, useEffect } from 'react';
import { Artifact, ArtifactState } from '../types';
import { artifactsAPI } from '../services/api';
import ArtifactCard from './ArtifactCard';
import CreateArtifactModal from './CreateArtifactModal';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../context/AuthContext';
import './VaultDashboard.css';

const VaultDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<ArtifactState | 'all'>('all');

  useEffect(() => {
    loadArtifacts();
    // Refresh every 30 seconds to check for state changes
    const interval = setInterval(loadArtifacts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadArtifacts = async () => {
    try {
      const data = await artifactsAPI.getAll();
      setArtifacts(data);
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtifacts = filter === 'all' 
    ? artifacts 
    : artifacts.filter(a => a.state === filter);

  const getStateCounts = () => {
    return {
      locked: artifacts.filter(a => a.state === ArtifactState.LOCKED).length,
      visible: artifacts.filter(a => a.state === ArtifactState.VISIBLE).length,
      transformed: artifacts.filter(a => a.state === ArtifactState.TRANSFORMED).length,
      archived: artifacts.filter(a => a.state === ArtifactState.ARCHIVED).length,
      destroyed: artifacts.filter(a => a.state === ArtifactState.DESTROYED).length
    };
  };

  const counts = getStateCounts();

  if (loading) {
    return <div className="loading">Loading your vault...</div>;
  }

  return (
    <div className="vault-dashboard">
      <header className="vault-header">
        <h1>Your Digital Vault</h1>
        <div className="header-actions">
          <button 
            className="create-button"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Artifact
          </button>
          <button 
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <NotificationPanel onUpdate={loadArtifacts} />

      <div className="state-filters">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({artifacts.length})
        </button>
        <button
          className={`filter-button ${filter === ArtifactState.LOCKED ? 'active' : ''}`}
          onClick={() => setFilter(ArtifactState.LOCKED)}
        >
          🔒 Locked ({counts.locked})
        </button>
        <button
          className={`filter-button ${filter === ArtifactState.VISIBLE ? 'active' : ''}`}
          onClick={() => setFilter(ArtifactState.VISIBLE)}
        >
          👁️ Visible ({counts.visible})
        </button>
        <button
          className={`filter-button ${filter === ArtifactState.TRANSFORMED ? 'active' : ''}`}
          onClick={() => setFilter(ArtifactState.TRANSFORMED)}
        >
          ✨ Transformed ({counts.transformed})
        </button>
        <button
          className={`filter-button ${filter === ArtifactState.ARCHIVED ? 'active' : ''}`}
          onClick={() => setFilter(ArtifactState.ARCHIVED)}
        >
          📦 Archived ({counts.archived})
        </button>
        <button
          className={`filter-button ${filter === ArtifactState.DESTROYED ? 'active' : ''}`}
          onClick={() => setFilter(ArtifactState.DESTROYED)}
        >
          💀 Destroyed ({counts.destroyed})
        </button>
      </div>

      <div className="artifacts-grid">
        {filteredArtifacts.length === 0 ? (
          <div className="empty-state">
            <p>No artifacts found in this category.</p>
            <button onClick={() => setShowCreateModal(true)}>
              Create your first artifact
            </button>
          </div>
        ) : (
          filteredArtifacts.map(artifact => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              onUpdate={loadArtifacts}
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateArtifactModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadArtifacts();
          }}
        />
      )}
    </div>
  );
};

export default VaultDashboard;
