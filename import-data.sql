-- Import existing monitor data
-- Run: wrangler d1 execute admin_monitor_db --remote --file=./import-data.sql

-- Clear existing templates first
DELETE FROM templates;

-- Import Monitor Orders
INSERT INTO orders (url, view_target, view_current, like_target, like_current, status, line_id, notified) VALUES
('https://www.youtube.com/watch?v=WGqjFeE0lyQ', 1020, 1294, 51, 68, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=_OirweX-utA', 10871, 10875, 453, 453, 'done', '1234', 'yes'),
('https://www.youtube.com/watch?v=5KliTdGFJVQ', 4289, 4291, 85, 102, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=7FH_WB9PkRo', 2019, 1415, 116, 64, 'running', '', 'no'),
('https://www.youtube.com/watch?v=5xtX6w6_ggE', 25737, 26170, 0, 156, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=r1TWf8BM26k', 24732, 24623, 0, 44, 'running', '', 'no'),
('https://www.youtube.com/watch?v=m6oq656mJsU', 31277, 29735, 0, 40, 'running', '', 'no'),
('https://www.youtube.com/watch?v=rOTnqPYJwKs', 2143, 1815, 51, 1, 'running', '', 'no'),
('https://www.youtube.com/watch?v=JPkMu408usg', 20154, 20477, 220, 363, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=Hv4fBI6Lh0Y', 3012, 3096, 54, 74, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=Vrln6E0SyFA', 3011, 3011, 0, 4, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=K9WdrFaVBS4', 2195, 2243, 62, 66, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=IxIEZJ5yl2c', 1004, 1045, 50, 69, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=pbCr4F5byGI', 2030, 2137, 50, 65, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=wcajq7T4els', 2057, 2223, 0, 1, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=ncwMvTmgeRQ', 1079, 1305, 50, 66, 'done', '9294', 'yes'),
('https://www.youtube.com/watch?v=db3WwTKVqdI', 2008, 2789, 50, 66, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=ZdffbQvkYTo', 2536, 2938, 105, 121, 'done', '', 'yes'),
('https://www.youtube.com/watch?v=6iciBJqj6KM', 2528, 2928, 0, 54, 'done', '', 'yes');

-- Import Templates
-- TikTok Templates
INSERT INTO templates (name, platform, items) VALUES 
('VIP Package', 'tiktok', '[{"type":"view","subType":"mix","amount":10000},{"type":"like","subType":"normal","amount":1000},{"type":"share","subType":"normal","amount":100}]'),
('Basic Package', 'tiktok', '[{"type":"view","subType":"mix","amount":5000},{"type":"like","subType":"normal","amount":500}]');

-- Instagram Templates
INSERT INTO templates (name, platform, items) VALUES 
('IG Standard', 'instagram', '[{"type":"like","subType":"1","amount":5000},{"type":"view","subType":"normal","amount":1000}]'),
('IG Premium', 'instagram', '[{"type":"like","subType":"2","amount":10000},{"type":"view","subType":"normal","amount":5000}]');

-- Facebook Templates
INSERT INTO templates (name, platform, items) VALUES 
('FB Standard', 'facebook', '[{"type":"like","subType":"mix","amount":1000},{"type":"share","subType":"normal","amount":100}]'),
('FB Premium', 'facebook', '[{"type":"like","subType":"th1","amount":5000},{"type":"view","subType":"normal","amount":10000},{"type":"share","subType":"normal","amount":500}]');
