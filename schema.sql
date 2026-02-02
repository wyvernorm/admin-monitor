-- Admin Monitor Database Schema
-- Step 1: Drop existing tables
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS logs;

-- Step 2: Create Orders table
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  view_target INTEGER DEFAULT 0,
  view_current INTEGER DEFAULT 0,
  like_target INTEGER DEFAULT 0,
  like_current INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  line_id TEXT DEFAULT '',
  notified TEXT DEFAULT 'no',
  created_at TEXT,
  updated_at TEXT,
  completed_at TEXT
);

-- Step 3: Create Templates table
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  items TEXT DEFAULT '[]',
  created_at TEXT,
  updated_at TEXT
);

-- Step 4: Create Logs table
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_email TEXT,
  action TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  details TEXT,
  ip_address TEXT,
  created_at TEXT
);

-- Step 5: Insert TikTok templates
INSERT INTO templates (name, platform, items) VALUES ('วิว 10K + ไลค์ 1K', 'tiktok', '[{"type":"view","subType":"mix","amount":10000},{"type":"like","subType":"normal","amount":1000}]');
INSERT INTO templates (name, platform, items) VALUES ('วิว 5K TH', 'tiktok', '[{"type":"view","subType":"th","amount":5000}]');
INSERT INTO templates (name, platform, items) VALUES ('Follower 1K HQ', 'tiktok', '[{"type":"follower","subType":"hq","amount":1000}]');

-- Step 6: Insert Facebook templates
INSERT INTO templates (name, platform, items) VALUES ('ไลค์ 1K คละ', 'facebook', '[{"type":"like","subType":"mix","amount":1000}]');
INSERT INTO templates (name, platform, items) VALUES ('ผู้ติดตาม 5K ไทย', 'facebook', '[{"type":"follower","subType":"th","amount":5000}]');
INSERT INTO templates (name, platform, items) VALUES ('วิว 10K', 'facebook', '[{"type":"view","subType":"normal","amount":10000}]');

-- Step 7: Insert Instagram templates
INSERT INTO templates (name, platform, items) VALUES ('Like 1K #1', 'instagram', '[{"type":"like","subType":"1","amount":1000}]');
INSERT INTO templates (name, platform, items) VALUES ('Follower 5K TH', 'instagram', '[{"type":"follower","subType":"th","amount":5000}]');
INSERT INTO templates (name, platform, items) VALUES ('View 10K', 'instagram', '[{"type":"view","subType":"normal","amount":10000}]');
