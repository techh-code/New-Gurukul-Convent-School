const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, 'public');
const enquiriesFile = path.join(__dirname, 'data', 'enquiries.json');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const sessions = new Map();

function send(res, status, data, type = 'application/json') { res.writeHead(status, { 'Content-Type': type }); res.end(typeof data === 'string' ? data : JSON.stringify(data)); }
function readBody(req) { return new Promise((resolve, reject) => { let body = ''; req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); }); req.on('end', () => resolve(body)); req.on('error', reject); }); }
function isAdmin(req) { const token = req.headers.authorization?.replace('Bearer ', ''); return token && sessions.has(token); }

const port = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/admin/login') {
    try {
      const { password } = JSON.parse(await readBody(req));
      if (password !== adminPassword) return send(res, 401, { error: 'Incorrect password.' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, Date.now());
      return send(res, 200, { token });
    } catch { return send(res, 400, { error: 'Please enter the password.' }); }
  }
  if (req.method === 'GET' && req.url === '/api/admin/enquiries') {
    if (!isAdmin(req)) return send(res, 401, { error: 'Sign in required.' });
    const entries = fs.existsSync(enquiriesFile) ? JSON.parse(fs.readFileSync(enquiriesFile, 'utf8')) : [];
    return send(res, 200, entries.reverse());
  }
  if (req.method === 'DELETE' && req.url.startsWith('/api/admin/enquiries/')) {
    if (!isAdmin(req)) return send(res, 401, { error: 'Sign in required.' });
    const id = Number(req.url.split('/').pop());
    const entries = fs.existsSync(enquiriesFile) ? JSON.parse(fs.readFileSync(enquiriesFile, 'utf8')) : [];
    fs.writeFileSync(enquiriesFile, JSON.stringify(entries.filter(item => item.id !== id), null, 2));
    return send(res, 200, { ok: true });
  }
  if (req.method === 'POST' && req.url === '/api/enquiries') {
    try {
      const entry = JSON.parse(await readBody(req));
      if (!entry.name || !entry.phone || !entry.email || !entry.message) return send(res, 400, { error: 'Please complete all required fields.' });
      const existing = fs.existsSync(enquiriesFile) ? JSON.parse(fs.readFileSync(enquiriesFile, 'utf8')) : [];
      existing.push({ id: Date.now(), receivedAt: new Date().toISOString(), ...entry });
      fs.writeFileSync(enquiriesFile, JSON.stringify(existing, null, 2));
      return send(res, 201, { ok: true, message: 'Thank you. Your enquiry has been received.' });
    } catch { return send(res, 400, { error: 'We could not submit your enquiry. Please try again.' }); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
  let file = decodeURIComponent(req.url.split('?')[0]);
  if (file === '/') file = '/index.html';
  const target = path.normalize(path.join(root, file));
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) return send(res, 404, 'Page not found', 'text/plain');
  res.writeHead(200, { 'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(target).pipe(res);
}).listen(port, () => console.log(`New Gurukul School site: http://localhost:${port}`));
