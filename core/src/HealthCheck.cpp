#include "../include/HealthCheck.h"
#include "../include/Capture.h"
#include "../include/Encoder.h"
#include "../include/SignalingClient.h"
#include "../include/WebRTCSession.h"
#include "../include/Logger.h"
namespace stream {
bool health_check() {
    // Try to create all major modules and check for nullptr
    bool ok = true;
    if (!createPlatformCapture()) {
        log_error("HealthCheck: Failed to create capture");
        ok = false;
    }
    if (!createPlatformEncoder()) {
        log_error("HealthCheck: Failed to create encoder");
        ok = false;
    }
    if (!createWebSocketSignalingClient()) {
        log_error("HealthCheck: Failed to create signaling client");
        ok = false;
    }
    if (!createWebRTCSession()) {
        log_error("HealthCheck: Failed to create WebRTC session");
        ok = false;
    }
    return ok;
}
}
