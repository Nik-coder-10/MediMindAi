const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/patient/cases',
  method: 'GET',
  headers: {
    'x-user-id': 'pat-104-demo'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', data);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.end();
