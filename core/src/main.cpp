#include "../include/Capture.h"
#include "../include/Encoder.h"
#include "../include/WebRTCSession.h"
#include "../include/InputInjector.h"
#include "../include/SignalingClient.h"
#include "../include/Logger.h"
#include <fstream>
#include <nlohmann/json.hpp>
#include "../include/HealthCheck.h"
#include <memory>
#include <thread>
#include <chrono>

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

    // Health check: try to create all major subsystems
    if (!stream::health_check()) {
        stream::log_error("Health check failed");
        return 1;
    }

    // Create platform modules
    auto capture = createPlatformCapture();
    if (!capture) {
        stream::log_error("Failed to create capture module");
        return 1;
    }
    auto encoder = createPlatformEncoder();
    if (!encoder) {
        stream::log_error("Failed to create encoder module");
        return 1;
    }
    auto input = stream::createPlatformInputInjector();
    if (!input) {
        stream::log_error("Failed to create input injector");
        return 1;
    }
    std::unique_ptr<stream::SignalingClient> signaling(stream::createWebSocketSignalingClient());
    if (!signaling) {
        stream::log_error("Failed to create signaling client");
        return 1;
    }
    auto webrtc = createWebRTCSession();
    if (!webrtc) {
        stream::log_error("Failed to create WebRTC session");
        return 1;
    }

    // Connect signaling events to WebRTC
    webrtc->SetOnOfferCreated([&](const std::string& offerSdp) {
        stream::log_info("Sending offer to signaling server");
        signaling->send(std::string("offer:") + offerSdp);
    });
    webrtc->SetOnIceCandidate([&](const std::string& candidate) {
        stream::log_info("Sending ICE candidate to signaling server");
        signaling->send(std::string("candidate:") + candidate);
    });
    signaling->onMessage([&](const std::string& msg) {
        // Parse and route signaling messages (offer/answer/candidate)
        if (msg.rfind("answer:", 0) == 0) {
            std::string sdp = msg.substr(7);
            webrtc->SetRemoteDescription(sdp);
            stream::log_info("Received and set remote answer");
        } else if (msg.rfind("candidate:", 0) == 0) {
            std::string candidate = msg.substr(10);
            webrtc->AddRemoteIceCandidate(candidate);
            stream::log_info("Received and added remote ICE candidate");
        } else if (msg.rfind("offer:", 0) == 0) {
            // For completeness: handle incoming offer (if acting as callee)
            std::string sdp = msg.substr(6);
            webrtc->SetRemoteDescription(sdp);
            stream::log_info("Received and set remote offer");
            // Optionally create and send answer here
        } else {
            stream::log_info("Received signaling message: " + msg);
        }
    });
    signaling->connect("ws://localhost:8080");

    // Wire up capture -> encode -> webrtc
    bool encoderStarted = encoder->Start(1280, 720, 30, [&](const EncodedFrame& frame) {
        // Push encoded frame to WebRTC
        webrtc->PushEncodedFrame(frame);
        stream::log_info("Encoded frame ready, timestamp: " + std::to_string(frame.timestamp));
    });
    if (!encoderStarted) {
        stream::log_error("Failed to start encoder");
        return 1;
    }
    bool captureStarted = capture->Start([&](const FrameData& frame) {
        encoder->EncodeFrame(frame.data, frame.stride);
    });
    if (!captureStarted) {
        stream::log_error("Failed to start capture");
        return 1;
    }

    stream::log_info("Core started. Running main loop...");
    // Main loop (simulate running)
    for (int i = 0; i < 1000; ++i) {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        // Poll signaling, handle input injection, etc.
        // If your signaling client has a poll/process method, call it here:
        // signaling->poll();
        // Example: handle input injection from remote (pseudo-code):
        // if (signaling->hasInputEvent()) {
        //     auto event = signaling->getInputEvent();
        //     if (event.type == "mouse") input->injectMouse(event.x, event.y, event.button, event.down);
        //     if (event.type == "keyboard") input->injectKeyboard(event.key, event.down);
        // }
    }

    // Cleanup
    capture->Stop();
    encoder->Stop();
    stream::log_info("Core stopped.");
    return 0;
}
