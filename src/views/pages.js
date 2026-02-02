// Import CSS from original file
import { CSS } from './css';
import { loginPageHTML } from './login';
import { monitorPageHTML } from './monitor';
import { dashboardPageHTML } from './dashboard';

export function renderPage(pageName, data = {}) {
  const pages = {
    login: loginPageHTML,
    monitor: monitorPageHTML,
    dashboard: dashboardPageHTML,
  };
  
  const pageContent = pages[pageName] || pages.monitor;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Monitor</title>
  ${CSS}
</head>
<body>
  ${pageContent(data)}
</body>
</html>
  `;
}
