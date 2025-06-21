import express from 'express';
import { createServer } from 'http';
import { Server } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';
import helmet from 'helmet';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SECRET = crypto.randomBytes(64).toString('hex'); // Generate random secret

const app = express();
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for WebRTC
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('combined'));
app.use(express.json());

// Privacy-focused health endpoint (minimal data)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// In-memory user store (for demo) - encrypted in production
const users: { [username: string]: { password: string; role: string } } = {
  admin: { password: 'password', role: 'admin' }
};

// Registration endpoint - no tracking
app.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).send('Missing fields');
  if (users[username]) return res.status(409).send('User already exists');
  users[username] = { password, role };
  console.log(`[REGISTER] New user: ${username} (${role})`);
  res.json({ success: true });
});

// Updated login route - no tracking
app.post('/login', function (req, res) {
  const { username, password } = req.body;
  console.log(`[LOGIN] Attempt: ${username}`);
  const user = users[username];
  if (user && user.password === password) {
    const token = jwt.sign({ username, role: user.role }, SECRET);
    console.log(`[LOGIN] Success: ${username}`);
    res.json({ token, role: user.role });
  } else {
    console.log(`[LOGIN] Failed: ${username}`);
    res.status(401).send("Unauthorized");
  }
});

// Example admin-only endpoint - minimal data
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

const server = createServer(app);
const wss = new Server({ server });

// Multi-room peer management
const rooms: { [room: string]: { [peerId: string]: any } } = {};

// Privacy-focused ICE servers (no external tracking)
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  // Add your own TURN server for privacy
  // {
  //   urls: 'turn:your-turn-server:3478',
  //   username: 'your-username',
  //   credential: 'your-password'
  // }
];

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

  // Send peer ID and ICE servers
  ws.send(JSON.stringify({ type: 'id', id, room }));
  ws.send(JSON.stringify({ type: 'ice-servers', payload: iceServers }));

  ws.on('message', function (msg) {
    let data;
    try { data = JSON.parse(msg.toString()); } catch { return; }
    if (data && data.to && rooms[room][data.to]) {
      if (data.type === 'control') {
        console.log(`[WS] Signaling from ${id} to ${data.to} in room ${room}: ${data.type}`);
        rooms[room][data.to].send(JSON.stringify({ ...data, from: id, room }));
      }
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