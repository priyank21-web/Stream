#include "SignalingClient.h"
#include <websocketpp/config/asio_no_tls_client.hpp>
#include <websocketpp/client.hpp>
#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <iostream>

using websocketpp::connection_hdl;
using message_ptr = websocketpp::config::asio_client::message_type::ptr;

namespace stream
{
    using ws_client = websocketpp::client<websocketpp::config::asio_client>;

    class WebSocketSignalingClient : public SignalingClient
    {
    public:
        WebSocketSignalingClient() : stop_flag_(false) {}
        ~WebSocketSignalingClient() override
        {
            stop_flag_ = true;
            if (ws_thread_.joinable())
                ws_thread_.join();
        }

        void connect(const std::string &url) override
        {
            ws_.init_asio();
            ws_.set_open_handler([this](connection_hdl hdl)
                                 {
            std::lock_guard<std::mutex> lock(mutex_);
            hdl_ = hdl;
            std::cout << "WebSocket connected\n"; });
            ws_.set_message_handler([this](connection_hdl, message_ptr msg)
                                    {
            std::lock_guard<std::mutex> lock(mutex_);
            if (on_message_) on_message_(msg->get_payload()); });
            ws_.set_fail_handler([](connection_hdl)
                                 { std::cerr << "WebSocket connection failed\n"; });
            ws_.set_close_handler([](connection_hdl)
                                  { std::cerr << "WebSocket closed\n"; });
            websocketpp::lib::error_code ec;
            auto con = ws_.get_connection(url, ec);
            if (ec)
            {
                std::cerr << "WebSocket connection error: " << ec.message() << "\n";
                return;
            }
            ws_.connect(con);
            ws_thread_ = std::thread([this]()
                                     { ws_.run(); });
        }

        void send(const std::string &msg) override
        {
            std::lock_guard<std::mutex> lock(mutex_);
            if (hdl_.lock())
            {
                websocketpp::lib::error_code ec;
                ws_.send(hdl_, msg, websocketpp::frame::opcode::text, ec);
                if (ec)
                    std::cerr << "WebSocket send error: " << ec.message() << "\n";
            }
        }

        void onMessage(std::function<void(const std::string &)> cb) override
        {
            std::lock_guard<std::mutex> lock(mutex_);
            on_message_ = std::move(cb);
        }

    private:
        ws_client ws_;
        connection_hdl hdl_;
        std::function<void(const std::string &)> on_message_;
        std::mutex mutex_;
        std::thread ws_thread_;
        std::atomic<bool> stop_flag_;
    };

    SignalingClient *createWebSocketSignalingClient() { return new WebSocketSignalingClient(); }
}
