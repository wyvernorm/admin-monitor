-- Activity Logs Table (Updated)
-- Run this to update your existing table

-- Option 1: If you want to recreate the table (will lose existing data)
DROP TABLE IF EXISTS activity_logs;

CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_email TEXT NOT NULL,
  admin_name TEXT DEFAULT '',
  admin_picture TEXT DEFAULT '',
  action TEXT NOT NULL,
  action_type TEXT DEFAULT 'other',  -- stats, summary, monitor_add, delete, other
  category TEXT DEFAULT 'other',      -- youtube, tiktok, facebook, instagram, monitor, other
  details TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_logs_email ON activity_logs(admin_email);
CREATE INDEX idx_logs_category ON activity_logs(category);
CREATE INDEX idx_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_logs_created ON activity_logs(created_at);

-- Option 2: If you want to keep existing data, run these ALTER statements instead:
-- ALTER TABLE activity_logs ADD COLUMN admin_name TEXT DEFAULT '';
-- ALTER TABLE activity_logs ADD COLUMN admin_picture TEXT DEFAULT '';
-- ALTER TABLE activity_logs ADD COLUMN action_type TEXT DEFAULT 'other';
