import { useState, useRef, useEffect } from "react";

export default function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [peerId, setPeerId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [camera, setCamera] = useState("default");
  const [microphone, setMicrophone] = useState("default");
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<'loggedout' | 'loggingin' | 'loggedin' | 'error'>('loggedout');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const wsRef = useRef<WebSocket | null>(null);

  // WebRTC state
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [room, setRoom] = useState('default');

  const [role, setRole] = useState<string | null>(null);
  const [registerMode, setRegisterMode] = useState(false);
  const [registerRole, setRegisterRole] = useState('user');

  const [adminData, setAdminData] = useState<{ users: string[]; rooms: string[] } | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);

  const [auditLog, setAuditLog] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);

  // On mount, check for ?token= in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setRole('user'); // role will be set after backend decodes token
      setLoginStatus('loggedin');
      setLog(l => [...l, 'Logged in with Google SSO']);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Fetch admin data after login if role is admin
  useEffect(() => {
    if (role === 'admin' && token) {
      fetch('http://localhost:8080/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setAdminData(data))
        .catch(() => setAdminData(null));
    } else {
      setAdminData(null);
    }
  }, [role, token]);

  // Fetch analytics for admin
  useEffect(() => {
    let interval: any;
    if (role === 'admin' && token) {
      const fetchAnalytics = () => {
        fetch('http://localhost:8080/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => setAnalytics(data))
          .catch(() => setAnalytics(null));
      };
      fetchAnalytics();
      interval = setInterval(fetchAnalytics, 5000);
    } else {
      setAnalytics(null);
    }
    return () => interval && clearInterval(interval);
  }, [role, token]);

  // Fetch audit log for admin
  useEffect(() => {
    let interval: any;
    if (role === 'admin' && token) {
      const fetchAudit = () => {
        fetch('http://localhost:8080/admin/audit', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.ok ? res.json() : [])
          .then(data => setAuditLog(data))
          .catch(() => setAuditLog([]));
      };
      fetchAudit();
      interval = setInterval(fetchAudit, 5000);
    } else {
      setAuditLog([]);
    }
    return () => interval && clearInterval(interval);
  }, [role, token]);

  // Registration handler
  const handleRegister = async () => {
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: registerRole })
      });
      if (!res.ok) {
        setError('Registration failed: ' + (await res.text()));
        return;
      }
      setRegisterMode(false);
      setError('Registration successful! Please log in.');
    } catch (err) {
      setError('Registration error');
    }
  };

  // Login handler
  const handleLogin = async () => {
    setLoginStatus('loggingin');
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        setLoginStatus('error');
        setError('Login failed');
        return;
      }
      const data = await res.json();
      setToken(data.token);
      setRole(data.role);
      setLoginStatus('loggedin');
      setLog(l => [...l, 'Login successful']);
    } catch (err) {
      setLoginStatus('error');
      setError('Login error');
    }
  };

  const connect = () => {
    if (!token) {
      setError('You must log in first');
      return;
    }
    setConnectionStatus('connecting');
    setError(null);
    try {
      const socket = new window.WebSocket(`ws://localhost:8080?token=${token}&room=${encodeURIComponent(room)}`);
      socket.onopen = () => {
        setConnectionStatus('connected');
        setLog(l => [...l, 'WebSocket connected']);
      };
      socket.onerror = (e) => {
        setConnectionStatus('error');
        setError('WebSocket connection error');
        setLog(l => [...l, 'WebSocket error']);
      };
      socket.onclose = () => {
        setConnectionStatus('disconnected');
        setLog(l => [...l, 'WebSocket disconnected']);
      };
      socket.onmessage = async (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "id") setPeerId(msg.id);
        if (msg.type === "offer") {
          setLog((l) => [...l, `Received offer from ${msg.from}`]);
          await handleOffer(msg.sdp, msg.from);
        }
        if (msg.type === "answer" && pc) {
          setLog((l) => [...l, `Received answer from ${msg.from}`]);
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.sdp }));
        }
        if (msg.type === "candidate" && pc) {
          setLog((l) => [...l, `Received candidate from ${msg.from}`]);
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
        setLog((l) => [...l, e.data]);
      };
      wsRef.current = socket;
      setWs(socket);
    } catch (err) {
      setConnectionStatus('error');
      setError('Failed to connect to signaling server');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWs(null);
      setConnectionStatus('disconnected');
      setLog((l) => [...l, 'WebSocket manually disconnected']);
    }
    if (pc) {
      pc.close();
      setPc(null);
      setLog((l) => [...l, 'PeerConnection closed']);
    }
  };

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setLog((l) => [...l, 'Local media started']);
    } catch (err) {
      setError('Failed to get local media');
      setLog((l) => [...l, 'Failed to get local media']);
    }
  };

  const createPeerConnection = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
    peer.onicecandidate = (event) => {
      if (event.candidate && wsRef.current && remoteId) {
        wsRef.current.send(JSON.stringify({
          to: remoteId,
          type: 'candidate',
          candidate: event.candidate,
        }));
      }
    };
    peer.onconnectionstatechange = () => {
      setLog((l) => [...l, `PeerConnection state: ${peer.connectionState}`]);
      if (peer.connectionState === 'connected') setConnectionStatus('connected');
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') setConnectionStatus('disconnected');
    };
    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current!);
      });
    }
    setPc(peer);
    return peer;
  };

  const sendOffer = async () => {
    if (!wsRef.current || !remoteId) return;
    await startMedia();
    const peer = createPeerConnection();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    wsRef.current.send(JSON.stringify({
      to: remoteId,
      type: 'offer',
      sdp: offer.sdp,
    }));
    setLog((l) => [...l, `Sent offer to ${remoteId}`]);
  };

  const handleOffer = async (sdp: string, from: string) => {
    await startMedia();
    setRemoteId(from);
    const peer = createPeerConnection();
    await peer.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        to: from,
        type: 'answer',
        sdp: answer.sdp,
      }));
    }
    setLog((l) => [...l, `Sent answer to ${from}`]);
  };

  // Remote control: send mouse/keyboard events
  const sendControlEvent = (event: any) => {
    if (!wsRef.current || !remoteId) return;
    wsRef.current.send(JSON.stringify({
      to: remoteId,
      type: 'control',
      control: event,
    }));
  };

  // Mouse event handlers for remote video
  const handleRemoteMouse = (e: React.MouseEvent<HTMLVideoElement>) => {
    const rect = (e.target as HTMLVideoElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width);
    const y = ((e.clientY - rect.top) / rect.height);
    sendControlEvent({ kind: 'mouse', action: e.type, x, y, button: e.button });
  };

  // Keyboard event handlers (window-level)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    sendControlEvent({ kind: 'keyboard', action: 'keydown', key: e.key, code: e.code });
  };
  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    sendControlEvent({ kind: 'keyboard', action: 'keyup', key: e.key, code: e.code });
  };

  // Remove user (admin only)
  const handleRemoveUser = async (username: string) => {
    if (!token) return;
    await fetch(`http://localhost:8080/admin/user/${encodeURIComponent(username)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    // Refresh admin data
    if (role === 'admin') {
      fetch('http://localhost:8080/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setAdminData(data))
        .catch(() => setAdminData(null));
    }
  };

  // Remove room (admin only)
  const handleRemoveRoom = async (roomName: string) => {
    if (!token) return;
    await fetch(`http://localhost:8080/admin/room/${encodeURIComponent(roomName)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    // Refresh admin data
    if (role === 'admin') {
      fetch('http://localhost:8080/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setAdminData(data))
        .catch(() => setAdminData(null));
    }
  };

  useEffect(() => {
    let ws: WebSocket | null = null;
    if (role === 'admin') {
      ws = new WebSocket('ws://localhost:8080/admin/notifications');
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          setNotifications((prev) => [msg, ...prev].slice(0, 100));
        } catch {}
      };
    }
    return () => { if (ws) ws.close(); };
  }, [role]);

  return (
    <div style={{ padding: 20 }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <h2>Stream UI (WebRTC Demo)</h2>
      {loginStatus !== 'loggedin' ? (
        <div style={{ marginBottom: 20 }}>
          {registerMode ? (
            <>
              <h4>Register</h4>
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <select value={registerRole} onChange={e => setRegisterRole(e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={handleRegister}>Register</button>
              <button onClick={() => setRegisterMode(false)} style={{ marginLeft: 10 }}>Back to Login</button>
            </>
          ) : (
            <>
              <h4>Login</h4>
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <button onClick={handleLogin} disabled={loginStatus === 'loggingin'}>Login</button>
              <button onClick={() => setRegisterMode(true)} style={{ marginLeft: 10 }}>Register</button>
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <button onClick={() => window.location.href = 'http://localhost:8080/auth/google'} style={{ background: '#4285F4', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>
              Sign in with Google
            </button>
          </div>
          {error && <span style={{ color: 'red', marginLeft: 10 }}>{error}</span>}
        </div>
      ) : null}
      <div style={{ marginBottom: 10 }}>
        <b>Status:</b> {connectionStatus}
        {role && <span style={{ marginLeft: 10 }}>[Role: <b>{role}</b>]</span>}
        {error && <span style={{ color: 'red', marginLeft: 10 }}>{error}</span>}
      </div>
      {/* Admin dashboard */}
      {role === 'admin' && adminData && (
        <div style={{ marginBottom: 20, color: 'purple', border: '1px solid #ccc', padding: 10 }}>
          <b>Admin Dashboard</b>
          <div>
            <b>Users:</b>
            {adminData.users.map(u => (
              <span key={u} style={{ marginRight: 10 }}>
                {u}
                {u !== 'admin' && (
                  <button style={{ marginLeft: 4 }} onClick={() => handleRemoveUser(u)}>Remove</button>
                )}
              </span>
            ))}
          </div>
          <div>
            <b>Rooms:</b>
            {adminData.rooms.map(r => (
              <span key={r} style={{ marginRight: 10 }}>
                {r}
                <button style={{ marginLeft: 4 }} onClick={() => handleRemoveRoom(r)}>Remove</button>
              </span>
            ))}
          </div>
          {analytics && (
            <div style={{ marginTop: 10, color: 'black' }}>
              <b>Analytics:</b>
              <div>Logins: {analytics.logins}</div>
              <div>Registrations: {analytics.registrations}</div>
              <div>Control Events: {analytics.controlEvents}</div>
              <div>Active Sessions: {analytics.activeSessions}</div>
              <div>Last Updated: {new Date(analytics.timestamp).toLocaleTimeString()}</div>
            </div>
          )}
          {/* Audit Log Viewer */}
          <div style={{ marginTop: 10, color: 'black' }}>
            <b>Audit Log (last {auditLog.length} events):</b>
            <div style={{ maxHeight: 200, overflow: 'auto', background: '#f9f9f9', border: '1px solid #ddd', padding: 6, fontSize: 12 }}>
              {auditLog.length === 0 && <div>No audit events.</div>}
              {auditLog.map((e, i) => (
                <div key={i} style={{ borderBottom: '1px solid #eee', padding: '2px 0' }}>
                  <span style={{ color: '#888' }}>{new Date(e.timestamp).toLocaleTimeString()} </span>
                  <b>{e.type}</b> {JSON.stringify(e.details)}
                </div>
              ))}
            </div>
          </div>
          {/* Real-time Notifications */}
          <div style={{ marginTop: 10, color: 'black' }}>
            <b>Notifications (real-time):</b>
            <div style={{ maxHeight: 200, overflow: 'auto', background: '#f9f9f9', border: '1px solid #ddd', padding: 6, fontSize: 12 }}>
              {notifications.length === 0 && <div>No notifications yet.</div>}
              {notifications.map((n, i) => (
                <div key={i} style={{ borderBottom: '1px solid #eee', padding: '2px 0', color: n.type === 'login_failed' || n.type.startsWith('admin_') ? 'red' : '#333' }}>
                  <span style={{ color: '#888' }}>{new Date(n.timestamp).toLocaleTimeString()} </span>
                  <b>{n.type}</b> {JSON.stringify(n.details)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <label>Room:</label>
        <input value={room} onChange={e => setRoom(e.target.value)} placeholder="Enter room name" />
        <span style={{ marginLeft: 10 }}>(Current room: <b>{room}</b>)</span>
      </div>
      <button onClick={connect} disabled={connectionStatus === 'connected' || connectionStatus === 'connecting' || loginStatus !== 'loggedin'}>Connect to Signaling</button>
      <button onClick={disconnect} disabled={connectionStatus !== 'connected'} style={{ marginLeft: 10 }}>Disconnect</button>
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
      <button onClick={sendOffer} disabled={!ws || !remoteId || connectionStatus !== 'connected'}>Send Offer (Start Streaming)</button>
      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
        <div>
          <h4>Local Video</h4>
          <video ref={localVideoRef} autoPlay playsInline muted width={320} height={240} style={{ background: '#222' }} />
        </div>
        <div>
          <h4>Remote Video</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            width={320}
            height={240}
            style={{ background: '#222', outline: '2px solid #0af' }}
            onMouseDown={handleRemoteMouse}
            onMouseUp={handleRemoteMouse}
            onMouseMove={handleRemoteMouse}
            onClick={handleRemoteMouse}
          />
        </div>
      </div>
      <pre style={{ background: '#eee', padding: 10, height: 200, overflow: 'auto', marginTop: 20 }}>{log.join('\n')}</pre>
      {role === 'admin' && (
        <div style={{ marginBottom: 10, color: 'purple' }}>
          <b>Admin features enabled.</b>
        </div>
      )}
    </div>
  );
}
