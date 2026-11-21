const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'TravelSaasClient', 'dist', 'travel-saas-client', 'browser');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  // Proxy API and uploads to backend
  if (req.url.startsWith('/api') || req.url.startsWith('/health') || req.url.startsWith('/uploads')) {
    const proxyReq = http.request({
      host: '127.0.0.1',
      port: 5000,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Backend unreachable: ' + err.message }));
    });
    req.pipe(proxyReq);
    return;
  }

  let reqPath = req.url.split('?')[0];
  let filePath = path.join(root, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    const indexPath = path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(4200, '127.0.0.1', () => {
  console.log('Frontend SPA server running on http://127.0.0.1:4200 (reverse proxying /api to :5000)');
});
