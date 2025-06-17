# Deployment Guide for Stream

## SaaS (Cloud)
- Deploy backend (Node.js) using Docker or Kubernetes.
- Use managed TURN/STUN servers for NAT traversal.
- Use HTTPS and secure WebSocket (WSS) for signaling.
- Scale backend horizontally for high concurrency.

## On-Premises
- Build and deploy backend on local server (Linux/Windows/macOS).
- Use local TURN/STUN if needed for internal NAT traversal.
- Restrict access to trusted networks.

## Clients
- Distribute installers for Windows, macOS, Linux.
- Use code signing for all binaries and drivers.
