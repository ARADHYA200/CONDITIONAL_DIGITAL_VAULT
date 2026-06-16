-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- Artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('message', 'memory', 'advice', 'confession', 'document')),
  state TEXT NOT NULL DEFAULT 'locked' CHECK(state IN ('locked', 'visible', 'transformed', 'archived', 'destroyed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unlocked_at DATETIME,
  transformed_at DATETIME,
  archived_at DATETIME,
  destroyed_at DATETIME,
  transformed_content TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conditions table
CREATE TABLE IF NOT EXISTS conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_id INTEGER NOT NULL,
  condition_type TEXT NOT NULL CHECK(condition_type IN ('time_based', 'behavior_based', 'inactivity_based', 'chained')),
  condition_data TEXT NOT NULL, -- JSON string
  sequence_order INTEGER DEFAULT 0, -- For chained conditions
  is_satisfied BOOLEAN DEFAULT 0,
  satisfied_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

-- State transitions table (immutable audit trail)
CREATE TABLE IF NOT EXISTS state_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_id INTEGER NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  transition_reason TEXT NOT NULL,
  triggered_by TEXT NOT NULL CHECK(triggered_by IN ('system', 'user', 'condition')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_id INTEGER,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  artifact_id INTEGER,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('state_change', 'condition_met', 'warning')),
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_state ON artifacts(state);
CREATE INDEX IF NOT EXISTS idx_conditions_artifact_id ON conditions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_conditions_is_satisfied ON conditions(is_satisfied);
CREATE INDEX IF NOT EXISTS idx_state_transitions_artifact_id ON state_transitions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
