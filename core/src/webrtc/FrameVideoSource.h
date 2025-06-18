#pragma once

#include "api/video/video_frame.h"
#include "api/video/video_source_interface.h"
#include "api/media_stream_interface.h"
#include <mutex>
#include <queue>

// Minimal custom VideoTrackSource for raw frame injection
class FrameVideoSource : public rtc::AdaptedVideoTrackSource {
public:
    FrameVideoSource();
    ~FrameVideoSource() override;

    // Call this from your capture/encoder callback
    void PushFrame(const webrtc::VideoFrame& frame);

protected:
    // WebRTC will call this to get the next frame
    rtc::VideoSourceInterface<webrtc::VideoFrame>* source() override { return this; }
    bool is_screencast() const override { return true; }
    absl::optional<bool> needs_denoising() const override { return absl::nullopt; }

private:
    std::mutex mutex_;
    std::queue<webrtc::VideoFrame> frame_queue_;
};
