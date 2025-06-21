import express from 'express';
import { Server } from 'ws';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createHash } from 'crypto';

/**
 * SECURE REMOTE ACCESS FOR LEGITIMATE CROSS-BORDER WORK
 * 
 * This module provides secure remote access capabilities for:
 * - Legitimate work scenarios across different countries
 * - Secure access to your own systems remotely
 * - Privacy-focused design with minimal tracking
 * - Compliance with data protection regulations
 */

interface SecureSession {
    id: string;
    clientId: string;
    controllerId: string;
    startTime: number;
    lastActivity: number;
    permissions: string[];
    isActive: boolean;
    consentGiven: boolean;
    encryptedAuditLog: string[];
    sessionKey: string;
    location: {
        client: string;
        controller: string;
    };
}

interface SecureCommand {
    type: 'mouse' | 'keyboard' | 'audio' | 'video' | 'system' | 'file' | 'network';
    action: string;
    data: any;
    timestamp: number;
    sessionId: string;
    encrypted: boolean;
}

class SecureRemoteManager {
    private sessions: Map<string, SecureSession> = new Map();
    private activeConnections: Map<string, any> = new Map();
    private readonly SESSION_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours for work
    private readonly ACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour
    private readonly masterKey: string;

    constructor(private secret: string) {
        this.masterKey = crypto.randomBytes(32).toString('hex');
    }

    // Create a secure session with location awareness
    createSecureSession(
        clientId: string,
        controllerId: string,
        permissions: string[],
        clientLocation: string,
        controllerLocation: string
    ): SecureSession {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const sessionKey = crypto.randomBytes(32).toString('hex');

        const session: SecureSession = {
            id: sessionId,
            clientId,
            controllerId,
            startTime: Date.now(),
            lastActivity: Date.now(),
            permissions,
            isActive: true,
            consentGiven: false,
            encryptedAuditLog: [],
            sessionKey,
            location: {
                client: clientLocation,
                controller: controllerLocation
            }
        };

        this.sessions.set(sessionId, session);
        console.log(`[SECURE] Session created: ${sessionId} (${clientLocation} -> ${controllerLocation})`);

        return session;
    }

    // Encrypt sensitive data
    private encryptData(data: any, sessionKey: string): string {
        const cipher = crypto.createCipher('aes-256-cbc', sessionKey);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    // Decrypt sensitive data
    private decryptData(encryptedData: string, sessionKey: string): any {
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', sessionKey);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    // Secure audit logging with encryption
    private logSecureAudit(sessionId: string, event: string, details: any) {
        const session = this.sessions.get(sessionId);
        if (session) {
            const auditEntry = {
                timestamp: Date.now(),
                event,
                details: this.encryptData(details, session.sessionKey)
            };

            session.encryptedAuditLog.push(JSON.stringify(auditEntry));

            // Keep only last 1000 entries for privacy
            if (session.encryptedAuditLog.length > 1000) {
                session.encryptedAuditLog.shift();
            }
        }
    }

    // Give consent with location verification
    giveSecureConsent(sessionId: string, clientId: string, clientLocation: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session || session.clientId !== clientId) {
            return false;
        }

        // Verify location matches (basic verification)
        if (session.location.client !== clientLocation) {
            console.log(`[SECURE] Location mismatch: expected ${session.location.client}, got ${clientLocation}`);
            return false;
        }

        session.consentGiven = true;
        session.lastActivity = Date.now();
        console.log(`[SECURE] Consent given for session: ${sessionId}`);

        return true;
    }

    // Execute secure command with encryption
    executeSecureCommand(sessionId: string, command: SecureCommand): boolean {
        const session = this.sessions.get(sessionId);
        if (!session || !session.isActive || !session.consentGiven) {
            return false;
        }

        // Check permissions
        if (!session.permissions.includes(command.type)) {
            console.log(`[SECURE] Permission denied: ${command.type}`);
            return false;
        }

        // Check session timeout
        if (Date.now() - session.lastActivity > this.ACTIVITY_TIMEOUT) {
            this.terminateSecureSession(sessionId);
            return false;
        }

        session.lastActivity = Date.now();
        console.log(`[SECURE] Command executed: ${command.type} - ${command.action}`);

        // Encrypt command data if needed
        if (command.encrypted && command.data) {
            command.data = this.encryptData(command.data, session.sessionKey);
        }

        this.logSecureAudit(sessionId, 'command_executed', {
            type: command.type,
            action: command.action
        });

        // Send encrypted command to client
        const connection = this.activeConnections.get(session.clientId);
        if (connection && connection.readyState === 1) {
            const secureMessage = {
                type: 'secure_remote_command',
                sessionId,
                command: this.encryptData(command, session.sessionKey)
            };

            connection.send(JSON.stringify(secureMessage));
            return true;
        }

        return false;
    }

    // Terminate secure session
    terminateSecureSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.isActive = false;
        console.log(`[SECURE] Session terminated: ${sessionId}`);
        this.logSecureAudit(sessionId, 'session_terminated', {
            duration: Date.now() - session.startTime
        });

        // Notify client
        const connection = this.activeConnections.get(session.clientId);
        if (connection && connection.readyState === 1) {
            connection.send(JSON.stringify({
                type: 'session_terminated',
                sessionId
            }));
        }

        return true;
    }

    // Get minimal session info (privacy-focused)
    getSecureSessionInfo(sessionId: string): any {
        const session = this.sessions.get(sessionId);
        if (session) {
            return {
                id: session.id,
                isActive: session.isActive,
                consentGiven: session.consentGiven,
                startTime: session.startTime,
                lastActivity: session.lastActivity,
                permissions: session.permissions,
                location: session.location,
                // Don't expose audit logs for privacy
                auditCount: session.encryptedAuditLog.length
            };
        }
        return null;
    }

    // Clean up expired sessions
    cleanupSecureSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.startTime > this.SESSION_TIMEOUT) {
                this.terminateSecureSession(sessionId);
            }
        }
    }

    // Get session key for client
    getSessionKey(sessionId: string): string | null {
        const session = this.sessions.get(sessionId);
        return session ? session.sessionKey : null;
    }
}

// Express routes for secure remote access
export function setupSecureRemoteRoutes(app: express.Application, manager: SecureRemoteManager) {

    // Request secure remote session
    app.post('/secure-remote/request', (req, res) => {
        const { clientId, controllerId, permissions, clientLocation, controllerLocation } = req.body;

        if (!clientId || !controllerId || !permissions || !clientLocation || !controllerLocation) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const session = manager.createSecureSession(
            clientId,
            controllerId,
            permissions,
            clientLocation,
            controllerLocation
        );

        res.json({
            sessionId: session.id,
            message: 'Secure remote session created. Awaiting client consent.',
            sessionKey: session.sessionKey // For client-side encryption
        });
    });

    // Give secure consent
    app.post('/secure-remote/consent', (req, res) => {
        const { sessionId, clientId, clientLocation } = req.body;

        if (manager.giveSecureConsent(sessionId, clientId, clientLocation)) {
            res.json({
                success: true,
                message: 'Secure consent given for remote access',
                sessionKey: manager.getSessionKey(sessionId)
            });
        } else {
            res.status(400).json({ error: 'Invalid session, client ID, or location mismatch' });
        }
    });

    // Execute secure command
    app.post('/secure-remote/command', (req, res) => {
        const { sessionId, command } = req.body;

        if (manager.executeSecureCommand(sessionId, command)) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Secure command execution failed' });
        }
    });

    // Terminate secure session
    app.post('/secure-remote/terminate', (req, res) => {
        const { sessionId } = req.body;

        if (manager.terminateSecureSession(sessionId)) {
            res.json({ success: true, message: 'Secure session terminated' });
        } else {
            res.status(400).json({ error: 'Session not found' });
        }
    });

    // Get minimal session info (privacy-focused)
    app.get('/secure-remote/session/:sessionId', (req, res) => {
        const sessionInfo = manager.getSecureSessionInfo(req.params.sessionId);
        if (sessionInfo) {
            res.json(sessionInfo);
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
    });
}

export { SecureRemoteManager, SecureSession, SecureCommand }; 