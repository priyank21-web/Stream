import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingPage from './pages/LoadingPage';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';

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

  // Auth state for routing
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Use real backend login/signup handlers
  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        setLoading(false);
        throw new Error('Login failed');
      }
      const data = await res.json();
      setToken(data.token);
      setRole(data.role);
      setIsLoggedIn(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoggedIn(false);
      setLoading(false);
      throw err;
    }
  };

  const handleSignup = async (username: string, password: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      if (!res.ok) {
        setLoading(false);
        throw new Error('Signup failed: ' + (await res.text()));
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setLoading(false);
      throw err;
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setRole(null);
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

  if (loading) return <LoadingPage />;

  return (
    <Router>
      <NavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onSignup={handleSignup} />} />
        <Route path="/dashboard" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
