import express from 'express';
import { createServer } from 'http';
import { Server } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';
import helmet from 'helmet';
import * as jwt from 'jsonwebtoken';
import fs from 'fs';
import nodemailer from 'nodemailer';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const SECRET = "supersecret";

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Add /metrics endpoint for health monitoring
app.get('/metrics', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activePeers: Object.keys(peers).length,
    timestamp: Date.now()
  });
});

// In-memory user store (for demo)
const users: { [username: string]: { password: string; role: string } } = {
  admin: { password: 'password', role: 'admin' }
};

// Basic analytics
const analytics = {
  logins: 0,
  registrations: 0,
  controlEvents: 0,
  get activeSessions() {
    return Object.values(rooms).reduce((sum, peers) => sum + Object.keys(peers).length, 0);
  }
};

// Load audit log from file on startup
const AUDIT_LOG_FILE = 'audit.log';
let auditLog: { timestamp: number; type: string; details: any }[] = [];
try {
  if (fs.existsSync(AUDIT_LOG_FILE)) {
    const lines = fs.readFileSync(AUDIT_LOG_FILE, 'utf-8').split('\n').filter(Boolean);
    auditLog = lines.map(line => JSON.parse(line)).slice(-1000);
  }
} catch (e) {
  console.error('Failed to load audit log:', e);
}

const ALERT_EMAIL = process.env.ALERT_EMAIL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let mailer: nodemailer.Transporter | null = null;
if (ALERT_EMAIL && SMTP_HOST && SMTP_USER && SMTP_PASS) {
  mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function sendAlert(subject: string, text: string) {
  if (!mailer || !ALERT_EMAIL) return;
  mailer.sendMail({
    from: `Stream App <${SMTP_USER}>`,
    to: ALERT_EMAIL,
    subject,
    text,
  }, (err) => {
    if (err) console.error('Failed to send alert email:', err);
  });
}

function rotateAuditLogIfNeeded() {
  try {
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const stats = fs.statSync(AUDIT_LOG_FILE);
      if (stats.size > 10 * 1024 * 1024) { // 10MB
        const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
        const archiveName = `audit-${ts}.log`;
        fs.renameSync(AUDIT_LOG_FILE, archiveName);
        // Remove old archives if more than 10
        const files = fs.readdirSync('.').filter(f => f.startsWith('audit-') && f.endsWith('.log'));
        if (files.length > 10) {
          files.sort(); // oldest first
          for (let i = 0; i < files.length - 10; ++i) {
            fs.unlinkSync(files[i]);
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to rotate audit log:', e);
  }
}

// --- Real-time admin notifications ---
const adminNotificationClients = new Set();
const adminNotificationWss = new Server({ noServer: true });
adminNotificationWss.on('connection', (client) => {
  adminNotificationClients.add(client);
  client.on('close', () => adminNotificationClients.delete(client));
});
function sendAdminNotification(type, details) {
  const msg = JSON.stringify({ type, details, timestamp: Date.now() });
  for (const client of adminNotificationClients) {
    if (client.readyState === Server.OPEN) client.send(msg);
  }
}

function logAudit(type: string, details: any) {
  rotateAuditLogIfNeeded();
  const entry = { timestamp: Date.now(), type, details };
  auditLog.push(entry);
  if (auditLog.length > 1000) auditLog.shift();
  try {
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
  // Send alerts for critical events
  if (type === 'login_failed') {
    sendAlert('Stream: Failed Login Attempt', `Failed login for user: ${details.username} at ${new Date(entry.timestamp).toISOString()}`);
    sendAdminNotification('login_failed', details);
  }
  if (type === 'admin_delete_user') {
    sendAlert('Stream: Admin Deleted User', `Admin ${details.admin} deleted user: ${details.username} at ${new Date(entry.timestamp).toISOString()}`);
    sendAdminNotification('admin_delete_user', details);
  }
  if (type === 'admin_delete_room') {
    sendAlert('Stream: Admin Deleted Room', `Admin ${details.admin} deleted room: ${details.room} at ${new Date(entry.timestamp).toISOString()}`);
    sendAdminNotification('admin_delete_room', details);
  }
  if (type === 'register') {
    sendAdminNotification('register', details);
  }
  if (type === 'login') {
    sendAdminNotification('login', details);
  }
  if (type === 'control') {
    sendAdminNotification('control', details);
  }
}
// --- End real-time notifications ---

// Registration endpoint
app.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).send('Missing fields');
  if (users[username]) return res.status(409).send('User already exists');
  users[username] = { password, role };
  analytics.registrations++;
  logAudit('register', { username, role });
  console.log(`[REGISTER] New user: ${username} (${role})`);
  res.json({ success: true });
});

// Updated login route
app.post('/login', function (req, res) {
  const { username, password } = req.body;
  console.log(`[LOGIN] Attempt: ${username}`);
  const user = users[username];
  if (user && user.password === password) {
    const token = jwt.sign({ username, role: user.role }, SECRET);
    analytics.logins++;
    logAudit('login', { username, role: user.role });
    console.log(`[LOGIN] Success: ${username}`);
    res.json({ token, role: user.role });
  } else {
    logAudit('login_failed', { username });
    console.log(`[LOGIN] Failed: ${username}`);
    res.status(401).send("Unauthorized");
  }
});

// Example admin-only endpoint
app.get('/admin', (req: any, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('No token');
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, SECRET) as any;
    if (payload.role !== 'admin') return res.status(403).send('Forbidden');
    res.json({ users: Object.keys(users), rooms: Object.keys(rooms) });
  } catch {
    res.status(401).send('Invalid token');
  }
});

// Admin: delete user
app.delete('/admin/user/:username', (req: any, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('No token');
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, SECRET) as any;
    if (payload.role !== 'admin') return res.status(403).send('Forbidden');
    const { username } = req.params;
    if (username === 'admin') return res.status(403).send('Cannot delete admin');
    if (!users[username]) return res.status(404).send('User not found');
    delete users[username];
    logAudit('admin_delete_user', { admin: payload.username, username });
    console.log(`[ADMIN] Deleted user: ${username}`);
    res.json({ success: true });
  } catch {
    res.status(401).send('Invalid token');
  }
});

// Admin: delete room
app.delete('/admin/room/:room', (req: any, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('No token');
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, SECRET) as any;
    if (payload.role !== 'admin') return res.status(403).send('Forbidden');
    const { room } = req.params;
    if (!rooms[room]) return res.status(404).send('Room not found');
    // Disconnect all peers in the room
    Object.values(rooms[room]).forEach((ws: any) => ws.close(4003, 'Room deleted by admin'));
    delete rooms[room];
    logAudit('admin_delete_room', { admin: payload.username, room });
    console.log(`[ADMIN] Deleted room: ${room}`);
    res.json({ success: true });
  } catch {
    res.status(401).send('Invalid token');
  }
});

// Admin: analytics endpoint
app.get('/admin/analytics', (req: any, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('No token');
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, SECRET) as any;
    if (payload.role !== 'admin') return res.status(403).send('Forbidden');
    res.json({
      logins: analytics.logins,
      registrations: analytics.registrations,
      controlEvents: analytics.controlEvents,
      activeSessions: analytics.activeSessions,
      timestamp: Date.now()
    });
  } catch {
    res.status(401).send('Invalid token');
  }
});

// Admin: audit log endpoint
app.get('/admin/audit', (req: any, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('No token');
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, SECRET) as any;
    if (payload.role !== 'admin') return res.status(403).send('Forbidden');
    res.json(auditLog.slice(-200).reverse()); // last 200 events, newest first
  } catch {
    res.status(401).send('Invalid token');
  }
});

// JWT auth middleware for protected routes
app.use((function (req: any, res: any, next: any) {
  if (req.path === '/login' || req.path === '/health' || req.path === '/') return next();
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send("No token");
  try {
    const token = auth.split(' ')[1];
    jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(401).send("Invalid token");
  }
}) as any);

app.get('/', function (req, res) { res.send('Stream backend running'); });
app.get('/health', function (req, res) { res.json({ status: 'ok', uptime: process.uptime() }); });

const server = createServer(app);
const wss = new Server({ server });

// Multi-room peer management
const rooms: { [room: string]: { [peerId: string]: any } } = {};

// --- JWT authentication for WebSocket connections ---
wss.on('connection', function (ws, req) {
  // Parse token and room from query string: ws://host:port?token=...&room=...
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  const room = url.searchParams.get('room') || 'default';
  if (!token) {
    console.log('[WS] Connection rejected: No token');
    ws.close(4001, 'No token');
    return;
  }
  try {
    jwt.verify(token, SECRET);
  } catch (err) {
    console.log('[WS] Connection rejected: Invalid token');
    ws.close(4002, 'Invalid token');
    return;
  }

  if (!rooms[room]) rooms[room] = {};
  const id = uuidv4();
  rooms[room][id] = ws;
  console.log(`[WS] Peer connected: ${id} in room: ${room}`);
  ws.send(JSON.stringify({ type: 'id', id, room }));

  ws.on('message', function (msg) {
    let data;
    try { data = JSON.parse(msg.toString()); } catch { return; }
    if (data && data.to && rooms[room][data.to]) {
      if (data.type === 'control') {
        analytics.controlEvents++;
        logAudit('control', { from: id, to: data.to, room, control: data.control });
      }
      console.log(`[WS] Signaling from ${id} to ${data.to} in room ${room}: ${data.type}`);
      rooms[room][data.to].send(JSON.stringify({ ...data, from: id, room }));
    }
  });

  ws.on('close', function () {
    console.log(`[WS] Peer disconnected: ${id} from room: ${room}`);
    delete rooms[room][id];
    if (Object.keys(rooms[room]).length === 0) delete rooms[room];
  });
});

server.listen(process.env.PORT || 8080, function () {
  console.log('Backend listening on :' + (process.env.PORT || 8080));
});

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:YOUR_TURN_SERVER_IP:3478',
    username: 'YOUR_TURN_USERNAME',
    credential: 'YOUR_TURN_PASSWORD'
  }
];

wss.on('connection', function (ws) {
  const id = uuidv4();
  console.log(`Client connected: ${id}`);

  ws.send(JSON.stringify({ type: 'ice-servers', payload: iceServers }));

  ws.on('message', function (message) {
    // signaling logic here (offer/answer/candidate exchange)
  });
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/auth/google/callback';

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
  }, (accessToken, refreshToken, profile, done) => {
    // Find or create user
    let user = users[profile.id];
    if (!user) {
      user = { password: null, role: 'user', googleId: profile.id, displayName: profile.displayName };
      users[profile.id] = user;
      analytics.registrations++;
      logAudit('register_google', { googleId: profile.id, displayName: profile.displayName });
    }
    return done(null, { username: profile.id, role: user.role, displayName: profile.displayName });
  }));
  app.use(passport.initialize());

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), (req: any, res) => {
    const { username, role, displayName } = req.user;
    const token = jwt.sign({ username, role, displayName }, SECRET);
    logAudit('login_google', { username, role, displayName });
    // Redirect to UI with token in URL fragment
    res.redirect(`http://localhost:5173/?token=${token}`);
  });
}

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/admin/notifications') {
    adminNotificationWss.handleUpgrade(req, socket, head, (ws) => {
      adminNotificationWss.emit('connection', ws, req);
    });
  }
});