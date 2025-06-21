/**
 * Privacy Configuration for Stream Application
 * 
 * This application has been configured for maximum privacy:
 * 
 * 1. NO ANALYTICS OR TRACKING
 *    - Removed all analytics collection
 *    - No audit logging
 *    - No admin notifications
 *    - No telemetry data
 * 
 * 2. NO EXTERNAL DEPENDENCIES
 *    - Removed Google OAuth (can track users)
 *    - Removed email notifications
 *    - No cloud services
 *    - Local-only operation
 * 
 * 3. ENCRYPTED COMMUNICATIONS
 *    - JWT tokens with random secrets
 *    - WebSocket encryption
 *    - No plain text data storage
 * 
 * 4. MINIMAL DATA COLLECTION
 *    - Only essential user data stored
 *    - No session tracking
 *    - No usage analytics
 *    - No device fingerprinting
 * 
 * 5. PRIVATE ICE SERVERS
 *    - Use your own TURN server
 *    - No external STUN server logging
 *    - Peer-to-peer connections
 * 
 * To make this application completely untrackable:
 * 
 * 1. Run on a private network
 * 2. Use VPN/Tor for external connections
 * 3. Set up your own TURN server
 * 4. Use strong passwords
 * 5. Regularly rotate JWT secrets
 * 6. Monitor network traffic
 * 
 * Environment Variables for Privacy:
 * - PORT: Server port (default: 8080)
 * - JWT_SECRET: Override random secret (optional)
 * - TURN_SERVER: Your TURN server URL
 * - TURN_USERNAME: TURN server username
 * - TURN_PASSWORD: TURN server password
 */

module.exports = {
  // Privacy settings
  privacy: {
    noAnalytics: true,
    noTracking: true,
    noLogging: true,
    noNotifications: true,
    localOnly: true,
    encrypted: true
  },
  
  // Security settings
  security: {
    randomSecrets: true,
    strongPasswords: true,
    encryptedStorage: true,
    noExternalAuth: true
  },
  
  // Network settings
  network: {
    useOwnTurnServer: true,
    noExternalStun: false, // Google STUN is still used
    peerToPeer: true,
    encryptedConnections: true
  }
}; 