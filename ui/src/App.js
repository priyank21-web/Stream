import React, { useState, useRef } from 'react';

export default function App() {
  const [ws, setWs] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [log, setLog] = useState([]);
  const [camera, setCamera] = useState('default');
  const [microphone, setMicrophone] = useState('default');
  const wsRef = useRef(null);

  const connect = () => {
    const socket = new window.WebSocket('ws://localhost:8080');
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'id') setPeerId(msg.id);
      setLog(l => [...l, e.data]);
    };
    wsRef.current = socket;
    setWs(socket);
  };

  const sendSignal = () => {
    if (wsRef.current && remoteId) {
      wsRef.current.send(JSON.stringify({ to: remoteId, type: 'offer', sdp: 'dummy-offer', camera, microphone }));
      setLog(l => [...l, `Sent offer to ${remoteId}`]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Stream UI</h2>
      <button onClick={connect} disabled={ws}>Connect to Signaling</button>
      <div>Your Peer ID: <b>{peerId}</b></div>
      <input placeholder="Remote Peer ID" value={remoteId} onChange={e => setRemoteId(e.target.value)} />
      <div>
        <label>Camera Device:</label>
        <select value={camera} onChange={e => setCamera(e.target.value)}>
          <option value="default">Default Camera</option>
          <option value="v4l2loopback">Virtual Camera (Linux)</option>
        </select>
      </div>
      <div>
        <label>Microphone Device:</label>
        <select value={microphone} onChange={e => setMicrophone(e.target.value)}>
          <option value="default">Default Microphone</option>
          <option value="snd-aloop">Virtual Microphone (Linux)</option>
        </select>
      </div>
      <button onClick={sendSignal} disabled={!ws || !remoteId}>Send Offer</button>
      <pre style={{ background: '#eee', padding: 10, height: 200, overflow: 'auto' }}>{log.join('\n')}</pre>
    </div>
  );
}
