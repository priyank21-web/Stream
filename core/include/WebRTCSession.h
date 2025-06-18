#pragma once

#include <memory>
#include <string>
#include <thread>
#include <mutex>
#include <queue>
#include <functional>

#include "Capture.h"
#include "Encoder.h"
#include "SignalingClient.h"

#include <memory>
#include <thread>
#include <atomic>

#include "api/peer_connection_interface.h"
#include "api/create_peerconnection_factory.h"
#include "api/media_stream_interface.h"
#include "api/video_track_source_proxy.h"
#include "api/audio_options.h"
#include "rtc_base/thread.h"
#include "rtc_base/logging.h"

class WebRTCSession : public webrtc::PeerConnectionObserver,
                      public webrtc::CreateSessionDescriptionObserver {
public:
    using OnOfferCreated = std::function<void(const std::string&)>;
    using OnIceCandidate = std::function<void(const std::string&)>;

    WebRTCSession();
    ~WebRTCSession();

    bool Init();
    void Close();

    bool Start(const std::string& signalingUrl, const std::string& streamId);
    void Stop();

    void CreateOffer();
    void SetRemoteDescription(const std::string& sdp);
    void AddRemoteIceCandidate(const std::string& candidate);

    void SetOnOfferCreated(OnOfferCreated callback);
    void SetOnIceCandidate(OnIceCandidate callback);

    // Connect Capture + Encoder Output
    void AddVideoSource(rtc::scoped_refptr<webrtc::VideoTrackSourceInterface> source);
    void AddAudioSource(rtc::scoped_refptr<webrtc::AudioSourceInterface> source);

private:
    rtc::scoped_refptr<webrtc::PeerConnectionFactoryInterface> peer_connection_factory_;
    rtc::scoped_refptr<webrtc::PeerConnectionInterface> peer_connection_;

    rtc::scoped_refptr<webrtc::AudioTrackInterface> audio_track_;
    rtc::scoped_refptr<webrtc::VideoTrackInterface> video_track_;

    rtc::Thread* signaling_thread_;
    rtc::Thread* worker_thread_;
    rtc::Thread* network_thread_;

    std::mutex mutex_;
    OnOfferCreated on_offer_created_;
    OnIceCandidate on_ice_candidate_;

    // PeerConnectionObserver
    void OnSignalingChange(webrtc::PeerConnectionInterface::SignalingState new_state) override;
    void OnIceConnectionChange(webrtc::PeerConnectionInterface::IceConnectionState new_state) override;
    void OnIceGatheringChange(webrtc::PeerConnectionInterface::IceGatheringState new_state) override;
    void OnIceCandidate(const webrtc::IceCandidateInterface* candidate) override;
    void OnDataChannel(rtc::scoped_refptr<webrtc::DataChannelInterface> channel) override;
    void OnRenegotiationNeeded() override;

    // CreateSessionDescriptionObserver
    void OnSuccess(webrtc::SessionDescriptionInterface* desc) override;
    void OnFailure(webrtc::RTCError error) override;

    bool CreatePeerConnection();

    std::unique_ptr<Capture> capture_;
    std::unique_ptr<Encoder> encoder_;
    std::unique_ptr<SignalingClient> signaling_;
    
    std::atomic<bool> running_;
    std::thread processingThread_;

    void CaptureAndSendLoop();

    void OnEncodedFrame(const EncodedFrame& frame);

};

