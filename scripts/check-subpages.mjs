const routes = [
  'http://localhost:3000/',
  'http://localhost:3000/login',
  'http://localhost:3000/unauthorized',
  'http://localhost:3000/patient',
  'http://localhost:3000/patient/language',
  'http://localhost:3000/patient/consent',
  'http://localhost:3000/patient/complaint',
  'http://localhost:3000/patient/documents',
  'http://localhost:3000/patient/questions',
  'http://localhost:3000/patient/summary-preview',
  'http://localhost:3000/doctor',
  'http://localhost:3000/doctor/case',
  'http://localhost:3000/doctor/summary',
  'http://localhost:3000/admin-dashboard',
  'http://localhost:3000/admin/analytics',
  'http://localhost:3000/admin/audit',
  'http://localhost:3000/api/health'
];

async function checkRoutes() {
  console.log('Testing subpages with redirect: "follow"...\n');
  for (const url of routes) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const text = await res.text();
      const titleMatch = text.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'No title';
      console.log(`[${res.status}] ${url} -> final URL: ${res.url} | Title: "${title}"`);
    } catch (err) {
      console.log(`[ERR] ${url} -> ${err.message}`);
    }
  }
}

checkRoutes();
