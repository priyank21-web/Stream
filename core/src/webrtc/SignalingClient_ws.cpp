#include "SignalingClient.h"
#include <websocketpp/config/asio_no_tls_client.hpp>
#include <websocketpp/client.hpp>
#include <thread>
#include <queue>
#include <mutex>

using websocketpp::connection_hdl;
using message_ptr = websocketpp::config::asio_client::message_type::ptr;

namespace stream {
class WebSocketSignalingClient : public SignalingClient {
    // ...implementation stub...
public:
    void connect(const std::string& url) override { /* TODO: Connect to backend */ }
    void send(const std::string& msg) override { /* TODO: Send message */ }
    void onMessage(std::function<void(const std::string&)>) override { /* TODO: Set callback */ }
};
SignalingClient* createWebSocketSignalingClient() { return new WebSocketSignalingClient(); }
}
