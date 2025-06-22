import React, { useState, useRef } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, Paper, Alert, Grid, Divider, Card, CardContent, Chip, Stack } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';

// This is a simplified version. You can further modularize or enhance as needed.
export default function DashboardPage() {
  // --- WebRTC and admin state (from original App.tsx) ---
  const [log, setLog] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [room, setRoom] = useState('default');
  const [camera, setCamera] = useState('default');
  const [microphone, setMicrophone] = useState('default');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // --- UI Handlers (mocked for now) ---
  const connect = () => setConnectionStatus('connected');
  const disconnect = () => setConnectionStatus('disconnected');
  const sendOffer = () => setLog(l => [...l, 'Sent offer (mock)']);

  return (
    <Box p={3}>
      <Typography variant="h3" color="primary" gutterBottom fontWeight={700} letterSpacing={1}>
        <PeopleIcon fontSize="large" sx={{ verticalAlign: 'middle', mr: 1 }} /> Dashboard
      </Typography>
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <Chip label={`Room: ${room}`} color="info" variant="filled" size="medium" />
        <Chip label={`Status: ${connectionStatus}`} color={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'error' : 'warning'} icon={connectionStatus === 'connected' ? <VideocamIcon /> : <VideocamOffIcon />} />
        <Chip label={`Peer ID: ${peerId || 'N/A'}`} color="default" icon={<PersonIcon />} />
      </Stack>
      <Paper sx={{ p: 3, mb: 3, background: '#f8fafc' }} elevation={2}>
        <Typography variant="h6" fontWeight={600} gutterBottom>Connection Controls</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <TextField label="Room" value={room} onChange={e => setRoom(e.target.value)} size="small" />
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" onClick={connect} disabled={connectionStatus === 'connected'}>Connect</Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" color="secondary" onClick={disconnect} disabled={connectionStatus !== 'connected'}>Disconnect</Button>
          </Grid>
        </Grid>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: '#e3f2fd', borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>Local Video</Typography>
              <video ref={localVideoRef} autoPlay playsInline muted width="100%" height={240} style={{ background: '#222', borderRadius: 8, border: '2px solid #1976d2' }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: '#f3e5f5', borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" color="secondary" gutterBottom>Remote Video</Typography>
              <video ref={remoteVideoRef} autoPlay playsInline width="100%" height={240} style={{ background: '#222', borderRadius: 8, border: '2px solid #9c27b0' }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Paper sx={{ p: 3, mb: 3, background: '#f1f8e9' }} elevation={1}>
        <Typography variant="h6" fontWeight={600} gutterBottom>Streaming Controls</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <TextField label="Your Peer ID" value={peerId} size="small" disabled />
          </Grid>
          <Grid item>
            <TextField label="Remote Peer ID" value={remoteId} onChange={e => setRemoteId(e.target.value)} size="small" />
          </Grid>
          <Grid item>
            <Select value={camera} onChange={e => setCamera(e.target.value)} size="small">
              <MenuItem value="default">Default Camera</MenuItem>
              <MenuItem value="v4l2loopback">Virtual Camera (Linux)</MenuItem>
            </Select>
          </Grid>
          <Grid item>
            <Select value={microphone} onChange={e => setMicrophone(e.target.value)} size="small">
              <MenuItem value="default">Default Microphone</MenuItem>
              <MenuItem value="snd-aloop">Virtual Microphone (Linux)</MenuItem>
            </Select>
          </Grid>
          <Grid item>
            <Button variant="contained" color="success" onClick={sendOffer} disabled={connectionStatus !== 'connected'}>Send Offer</Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 3, background: '#fffde7' }} elevation={0}>
        <Typography variant="h6" fontWeight={600} gutterBottom>Logs</Typography>
        <pre style={{ background: '#f5f5f5', padding: 12, height: 140, overflow: 'auto', borderRadius: 6, fontSize: 14 }}>{log.join('\n')}</pre>
      </Paper>
    </Box>
  );
}
