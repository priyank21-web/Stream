#pragma once
#include <string>
#include <functional>

namespace stream {
class SignalingClient {
public:
    virtual ~SignalingClient() = default;
    virtual void connect(const std::string& url) = 0;
    virtual void send(const std::string& msg) = 0;
    virtual void onMessage(std::function<void(const std::string&)> cb) = 0;
};
SignalingClient* createWebSocketSignalingClient();
}
