#include "webrtc/WebRTCSession.h"
#include <iostream>
#include "WebRTCSession.h"
#include "Capture.h"
#include "Encoder.h"
#include "Logger.h"
#include "SignalingClient.h"
#include <chrono>
#include <thread>

extern "C" Capture* CreateCapture();
extern "C" Encoder* CreateEncoder();

WebRTCSession::WebRTCSession()
    
    : signaling_thread_(rtc::Thread::Create().release()),
      worker_thread_(rtc::Thread::Create().release()),
      network_thread_(rtc::Thread::Create().release()) {}

    : running_(false) {}

WebRTCSession::~WebRTCSession() {
    Close();
    Stop();
}

bool WebRTCSession::Init() {
    signaling_thread_->Start();
    worker_thread_->Start();
    network_thread_->Start();

    peer_connection_factory_ = webrtc::CreatePeerConnectionFactory(
        network_thread_, worker_thread_, signaling_thread_,
        nullptr, webrtc::CreateBuiltinAudioEncoderFactory(),
        webrtc::CreateBuiltinAudioDecoderFactory(),
        webrtc::CreateBuiltinVideoEncoderFactory(),
        webrtc::CreateBuiltinVideoDecoderFactory(), nullptr, nullptr);

    if (!peer_connection_factory_) {
        std::cerr << "Failed to create PeerConnectionFactory" << std::endl;
        return false;
    }

    return CreatePeerConnection();
}

void WebRTCSession::Close() {
    if (peer_connection_) {
        peer_connection_ = nullptr;
    }
    peer_connection_factory_ = nullptr;
}

bool WebRTCSession::CreatePeerConnection() {
    webrtc::PeerConnectionInterface::RTCConfiguration config;
    config.sdp_semantics = webrtc::SdpSemantics::kUnifiedPlan;
    webrtc::PeerConnectionInterface::IceServer stun_server;
    stun_server.uri = "stun:stun.l.google.com:19302";
    config.servers.push_back(stun_server);

    peer_connection_ = peer_connection_factory_->CreatePeerConnection(
        config, nullptr, nullptr, this);
    return peer_connection_ != nullptr;
}

void WebRTCSession::SetOnOfferCreated(OnOfferCreated callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    on_offer_created_ = callback;
}

void WebRTCSession::SetOnIceCandidate(OnIceCandidate callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    on_ice_candidate_ = callback;
}

void WebRTCSession::CreateOffer() {
    webrtc::PeerConnectionInterface::RTCOfferAnswerOptions options;
    peer_connection_->CreateOffer(this, options);
}

void WebRTCSession::OnSuccess(webrtc::SessionDescriptionInterface* desc) {
    peer_connection_->SetLocalDescription(
        std::unique_ptr<webrtc::SessionDescriptionInterface>(desc),
        nullptr);
    
    std::string sdp;
    desc->ToString(&sdp);
    if (on_offer_created_) {
        on_offer_created_(sdp);
    }
}

void WebRTCSession::OnFailure(webrtc::RTCError error) {
    std::cerr << "Failed to create offer: " << error.message() << std::endl;
}

void WebRTCSession::SetRemoteDescription(const std::string& sdp) {
    webrtc::SdpParseError error;
    auto session_desc = webrtc::CreateSessionDescription(webrtc::SdpType::kAnswer, sdp, &error);
    if (!session_desc) {
        std::cerr << "Failed to parse remote SDP: " << error.description << std::endl;
        return;
    }

    peer_connection_->SetRemoteDescription(
        std::move(session_desc),
        nullptr
    );
}

void WebRTCSession::AddRemoteIceCandidate(const std::string& candidate) {
    webrtc::SdpParseError error;
    std::unique_ptr<webrtc::IceCandidateInterface> ice_candidate(
        webrtc::CreateIceCandidate("0", 0, candidate, &error));
    if (!ice_candidate) {
        std::cerr << "Failed to parse ICE candidate: " << error.description << std::endl;
        return;
    }
    peer_connection_->AddIceCandidate(ice_candidate.get());
}

void WebRTCSession::OnSignalingChange(webrtc::PeerConnectionInterface::SignalingState new_state) {}
void WebRTCSession::OnIceConnectionChange(webrtc::PeerConnectionInterface::IceConnectionState new_state) {}
void WebRTCSession::OnIceGatheringChange(webrtc::PeerConnectionInterface::IceGatheringState new_state) {}

void WebRTCSession::OnIceCandidate(const webrtc::IceCandidateInterface* candidate) {
    std::string sdp;
    candidate->ToString(&sdp);
    if (on_ice_candidate_) {
        on_ice_candidate_(sdp);
    }
}

void WebRTCSession::OnDataChannel(rtc::scoped_refptr<webrtc::DataChannelInterface> channel) {}
void WebRTCSession::OnRenegotiationNeeded() {}

void WebRTCSession::AddVideoSource(rtc::scoped_refptr<webrtc::VideoTrackSourceInterface> source) {
    video_track_ = peer_connection_factory_->CreateVideoTrack("video", source);
    auto result = peer_connection_->AddTrack(video_track_, {"stream_id"});
    if (!result.ok()) {
        std::cerr << "Failed to add video track." << std::endl;
    }
}

void WebRTCSession::AddAudioSource(rtc::scoped_refptr<webrtc::AudioSourceInterface> source) {
    audio_track_ = peer_connection_factory_->CreateAudioTrack("audio", source);
    auto result = peer_connection_->AddTrack(audio_track_, {"stream_id"});
    if (!result.ok()) {
        std::cerr << "Failed to add audio track." << std::endl;
    }
}

bool WebRTCSession::Start(const std::string& signalingUrl, const std::string& streamId) {
    Logger::Info("WebRTC Session starting...");

    // Create modules
    capture_ = std::unique_ptr<Capture>(CreateCapture());
    encoder_ = std::unique_ptr<Encoder>(CreateEncoder());
    signaling_ = std::make_unique<SignalingClient>(signalingUrl, streamId);

    if (!signaling_->Connect()) {
        Logger::Error("Failed to connect signaling");
        return false;
    }

    if (!encoder_->Start(1920, 1080, 30, 
        [this](const EncodedFrame& frame) { this->OnEncodedFrame(frame); })) {
        Logger::Error("Failed to start encoder");
        return false;
    }

    if (!capture_->Start([this](const FrameData& frame) {
        encoder_->EncodeFrame(frame.data, frame.stride);
    })) {
        Logger::Error("Failed to start capture");
        return false;
    }

    running_ = true;
    processingThread_ = std::thread(&WebRTCSession::CaptureAndSendLoop, this);
    return true;
}

void WebRTCSession::Stop() {
    running_ = false;
    if (processingThread_.joinable())
        processingThread_.join();

    if (capture_) capture_->Stop();
    if (encoder_) encoder_->Stop();
    if (signaling_) signaling_->Disconnect();

    Logger::Info("WebRTC Session stopped.");
}

void WebRTCSession::CaptureAndSendLoop() {
    while (running_) {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        signaling_->ProcessMessages();
    }
}

void WebRTCSession::OnEncodedFrame(const EncodedFrame& frame) {
    signaling_->SendEncodedFrame(frame);
}