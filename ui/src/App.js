import React, { useState, useRef } from 'react';
import { logInfo, logError } from './logger';

export default function App() {
  const [ws, setWs] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [log, setLog] = useState([]);
  const wsRef = useRef(null);

  const connect = () => {
    const url = process.env.REACT_APP_SIGNALING_URL || 'ws://localhost:8080';
    const socket = new window.WebSocket(url);
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'id') setPeerId(msg.id);
      setLog(l => [...l, e.data]);
      logInfo(e.data);
    };
    socket.onerror = (e) => logError('WebSocket error');
    wsRef.current = socket;
    setWs(socket);
  };

  const sendSignal = () => {
    if (wsRef.current && remoteId) {
      wsRef.current.send(JSON.stringify({ to: remoteId, type: 'offer', sdp: 'dummy-offer' }));
      logInfo('Sent offer to ' + remoteId);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Stream UI Prototype</h2>
      <button onClick={connect} disabled={ws}>Connect to Signaling</button>
      <div>Your Peer ID: <b>{peerId}</b></div>
      <input placeholder="Remote Peer ID" value={remoteId} onChange={e => setRemoteId(e.target.value)} />
      <button onClick={sendSignal} disabled={!ws || !remoteId}>Send Offer</button>
      <pre style={{ background: '#eee', padding: 10, height: 200, overflow: 'auto' }}>{log.join('\n')}</pre>
    </div>
  );
}
