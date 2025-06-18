import express from 'express';
import { createServer } from 'http';
import { Server } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';

const SECRET = "supersecret";

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Public login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ username }, SECRET);
        res.json({ token });
    } else {
        res.status(401).send("Unauthorized");
    }
});

// JWT auth middleware for protected routes
app.use((req, res, next) => {
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
});

app.get('/', (req, res) => res.send('Stream backend running'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

const server = createServer(app);
const wss = new Server({ server });

// Simple in-memory signaling for demo
const peers: Record<string, any> = {};

wss.on('connection', ws => {
  const id = uuidv4();
  peers[id] = ws;
  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', msg => {
    let data;
    try { data = JSON.parse(msg.toString()); } catch { return; }
    if (data && data.to && peers[data.to]) {
      peers[data.to].send(JSON.stringify({ ...data, from: id }));
    }
  });

  ws.on('close', () => { delete peers[id]; });
});

server.listen(process.env.PORT || 8080, () => {
  console.log('Backend listening on :' + (process.env.PORT || 8080));
});


const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' }
];

wss.on('connection', (ws) => {
    const id = uuidv4();
    console.log(`Client connected: ${id}`);

    ws.send(JSON.stringify({ type: 'ice-servers', payload: iceServers }));

    ws.on('message', (message) => {
        // signaling logic here (offer/answer/candidate exchange)
    });
});