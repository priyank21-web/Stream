#pragma once
#include <memory>
#include <string>

namespace stream {
class WebRTCSession {
public:
    virtual ~WebRTCSession() = default;
    virtual bool start(const std::string& signalingUrl) = 0;
    virtual void stop() = 0;
};
std::unique_ptr<WebRTCSession> createWebRTCSession();
}
