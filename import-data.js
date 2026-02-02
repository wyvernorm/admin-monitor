// Import CSV data to D1 Database
// Run: node import-data.js

import fs from 'fs';

const csvData = `url,sum views,views,sum  likes,likes,status,chat_id,notified
https://www.youtube.com/watch?v=WGqjFeE0lyQ,1020,1294,51,68,done,,yes
https://www.youtube.com/watch?v=_OirweX-utA,10871,10875,453,453,done,1234,yes
https://www.youtube.com/watch?v=5KliTdGFJVQ,4289,4291,85,102,done,,yes
https://www.youtube.com/watch?v=7FH_WB9PkRo,2019,1415,116,64,running,,no
https://www.youtube.com/watch?v=5xtX6w6_ggE,25737,26170,0,156,done,,yes
https://www.youtube.com/watch?v=r1TWf8BM26k,24732,24623,0,44,running,,no
https://www.youtube.com/watch?v=m6oq656mJsU,31277,29735,0,40,running,,no
https://www.youtube.com/watch?v=rOTnqPYJwKs,2143,1815,51,1,running,,no
https://www.youtube.com/watch?v=JPkMu408usg,20154,20477,220,363,done,,yes
https://www.youtube.com/watch?v=Hv4fBI6Lh0Y,3012,3096,54,74,done,,yes
https://www.youtube.com/watch?v=Vrln6E0SyFA,3011,3011,0,4,done,,yes
https://www.youtube.com/watch?v=K9WdrFaVBS4,2195,2243,62,66,done,,yes
https://www.youtube.com/watch?v=IxIEZJ5yl2c,1004,1045,50,69,done,,yes
https://www.youtube.com/watch?v=pbCr4F5byGI,2030,2137,50,65,done,,yes
https://www.youtube.com/watch?v=wcajq7T4els,2057,2223,0,1,done,,yes
https://www.youtube.com/watch?v=ncwMvTmgeRQ,1079,1305,50,66,done,9294,yes
https://www.youtube.com/watch?v=db3WwTKVqdI,2008,2789,50,66,done,,yes
https://www.youtube.com/watch?v=ZdffbQvkYTo,2536,2938,105,121,done,,yes
https://www.youtube.com/watch?v=6iciBJqj6KM,2528,2928,0,54,done,,yes`;

// Parse CSV
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');

// Generate SQL INSERT statements
const sqlStatements = [];

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');
  const url = values[0];
  const viewTarget = values[1];
  const viewCurrent = values[2];
  const likeTarget = values[3];
  const likeCurrent = values[4];
  const status = values[5];
  const lineId = values[6] || '';
  const notified = values[7] || 'no';
  
  const sql = `INSERT INTO orders (url, view_target, view_current, like_target, like_current, status, line_id, notified, user_email) VALUES ('${url}', ${viewTarget}, ${viewCurrent}, ${likeTarget}, ${likeCurrent}, '${status}', '${lineId}', '${notified}', 'imported@admin.com');`;
  
  sqlStatements.push(sql);
}

// Write to SQL file
const sqlContent = sqlStatements.join('\n');
fs.writeFileSync('import-orders.sql', sqlContent);

console.log('✅ Generated import-orders.sql');
console.log('📝 Total orders:', lines.length - 1);
console.log('\n🚀 Run this command to import:');
console.log('npx wrangler d1 execute admin_monitor_db --file=./import-orders.sql');
