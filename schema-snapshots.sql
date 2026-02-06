-- Order Snapshots Table
-- เก็บ snapshot ทุกครั้งที่ cron/check-all เช็ค เพื่อดู trend ย้อนหลัง

CREATE TABLE IF NOT EXISTS order_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  view_current INTEGER DEFAULT 0,
  like_current INTEGER DEFAULT 0,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_order ON order_snapshots(order_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_time ON order_snapshots(checked_at);
