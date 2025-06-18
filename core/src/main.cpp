#include "../include/Capture.h"
#include "../include/Encoder.h"
#include "../include/WebRTCSession.h"
#include "../include/InputInjector.h"
#include "../include/SignalingClient.h"
#include "../include/Logger.h"
#include <fstream>
#include <nlohmann/json.hpp>
#include "../include/HealthCheck.h"

// Entry point for the native core engine
int main(int argc, char** argv) {
    // Load config
    nlohmann::json config;
    try {
        std::ifstream f("config.json");
        if (f) f >> config;
        else stream::log_info("No config.json found, using defaults");
    } catch (...) {
        stream::log_error("Failed to load config.json");
    }

    if (!stream::health_check()) {
        stream::log_error("Health check failed");
        return 1;
    }

    auto capture = createPlatformCapture();
    auto encoder = createPlatformEncoder();
    auto webrtc = createWebRTCSession();
    auto input = stream::createPlatformInputInjector();
    auto signaling = stream::createWebSocketSignalingClient();
    signaling->connect("ws://localhost:8080");
    signaling->onMessage([](const std::string& msg) {
        // TODO: Pass signaling messages to WebRTC session
    });
    // TODO: Wire up capture -> encode -> webrtc
    // TODO: Handle input injection from remote

    stream::log_info("Core started");
    return 0;
}
