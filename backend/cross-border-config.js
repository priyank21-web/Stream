/**
 * CROSS-BORDER REMOTE WORK CONFIGURATION
 * 
 * This configuration is designed for legitimate cross-border work scenarios
 * where you need to access your own systems remotely while maintaining privacy
 * and security.
 * 
 * LEGITIMATE USE CASES:
 * - Remote work from different countries
 * - Accessing your own systems while traveling
 * - Cross-border IT support for your own infrastructure
 * - Remote administration of your own servers
 */

module.exports = {
  // Privacy and Security Settings
  privacy: {
    // Minimal data collection - only essential for functionality
    minimalLogging: true,
    noAnalytics: true,
    noTracking: true,
    encryptedStorage: true,
    localOnly: false, // Allow cross-border connections
    sessionTimeout: 12 * 60 * 60 * 1000, // 12 hours for work sessions
    activityTimeout: 60 * 60 * 1000, // 1 hour inactivity timeout
  },

  // Cross-border specific settings
  crossBorder: {
    // Location verification for security
    locationVerification: true,
    allowedLocations: [
      'USA', 'India', 'Canada', 'UK', 'Germany', 'Australia', 'Japan'
      // Add other countries where you work
    ],
    
    // Time zone handling
    timezoneAware: true,
    workHours: {
      start: '09:00',
      end: '18:00',
      timezone: 'UTC'
    },
    
    // Network optimization for international connections
    networkOptimization: {
      compression: true,
      encryption: true,
      connectionPooling: true,
      retryAttempts: 3,
      timeout: 30000 // 30 seconds
    }
  },

  // Security features for remote access
  security: {
    // Authentication
    jwtSecretRotation: true,
    sessionKeyGeneration: true,
    locationBasedAuth: true,
    
    // Encryption
    dataEncryption: true,
    commandEncryption: true,
    sessionEncryption: true,
    
    // Access control
    permissionBasedAccess: true,
    sessionTimeouts: true,
    activityMonitoring: true,
    
    // Audit (minimal for privacy)
    minimalAudit: true,
    encryptedAuditLogs: true,
    auditRetention: 30 * 24 * 60 * 60 * 1000 // 30 days
  },

  // Remote control capabilities
  remoteControl: {
    // Allowed control types
    permissions: [
      'mouse',      // Mouse control
      'keyboard',   // Keyboard input
      'audio',      // Audio capture/playback
      'video',      // Video capture/display
      'system',     // System operations
      'file',       // File operations
      'network'     // Network operations
    ],
    
    // Control limitations for security
    limitations: {
      maxConcurrentSessions: 1,
      maxSessionDuration: 12 * 60 * 60 * 1000, // 12 hours
      requireConsent: true,
      allowTermination: true,
      activityMonitoring: true
    }
  },

  // Network and connectivity
  network: {
    // Connection settings
    websocket: {
      port: 8080,
      secure: false, // Set to true for HTTPS/WSS
      compression: true,
      maxPayload: 16 * 1024 * 1024 // 16MB
    },
    
    // ICE servers for WebRTC
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add your own TURN servers for better connectivity
      // {
      //   urls: 'turn:your-turn-server:3478',
      //   username: 'your-username',
      //   credential: 'your-password'
      // }
    ],
    
    // Proxy support for privacy
    proxy: {
      enabled: false,
      // Configure if using VPN/proxy
      // host: 'proxy.example.com',
      // port: 8080,
      // auth: {
      //   username: 'proxy-user',
      //   password: 'proxy-pass'
      // }
    }
  },

  // Compliance and legal
  compliance: {
    // Data protection
    gdprCompliant: true,
    dataMinimization: true,
    userConsent: true,
    rightToDelete: true,
    
    // Audit requirements
    auditTrail: true,
    encryptedAudit: true,
    auditRetention: 30 * 24 * 60 * 60 * 1000, // 30 days
    
    // Legal compliance
    termsOfService: true,
    privacyPolicy: true,
    userAgreement: true
  },

  // Environment variables
  environment: {
    // Required environment variables
    required: [
      'JWT_SECRET',           // JWT signing secret
      'SESSION_SECRET',       // Session encryption secret
      'CLIENT_LOCATION',      // Client system location
      'CONTROLLER_LOCATION'   // Controller system location
    ],
    
    // Optional environment variables
    optional: [
      'TURN_SERVER',          // TURN server URL
      'TURN_USERNAME',        // TURN server username
      'TURN_PASSWORD',        // TURN server password
      'PROXY_HOST',           // Proxy server host
      'PROXY_PORT',           // Proxy server port
      'PROXY_USERNAME',       // Proxy username
      'PROXY_PASSWORD'        // Proxy password
    ]
  },

  // Usage instructions
  instructions: {
    setup: [
      '1. Install the application on both systems',
      '2. Configure environment variables',
      '3. Set up your own TURN server for better connectivity',
      '4. Use VPN if needed for additional privacy',
      '5. Ensure both systems are in allowed locations'
    ],
    
    security: [
      '1. Use strong passwords and authentication',
      '2. Keep the application updated',
      '3. Monitor sessions regularly',
      '4. Terminate sessions when not in use',
      '5. Use encrypted connections (HTTPS/WSS)'
    ],
    
    privacy: [
      '1. Only access your own systems',
      '2. Get proper consent before connecting',
      '3. Use VPN for additional privacy',
      '4. Regularly rotate secrets',
      '5. Monitor network traffic'
    ]
  }
}; 