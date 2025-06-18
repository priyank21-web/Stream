#include "FrameVideoSource.h"
#include "rtc_base/time_utils.h"

FrameVideoSource::FrameVideoSource() {}
FrameVideoSource::~FrameVideoSource() {}

void FrameVideoSource::PushFrame(const webrtc::VideoFrame& frame) {
    std::lock_guard<std::mutex> lock(mutex_);
    frame_queue_.push(frame);
    // Notify WebRTC that a new frame is available (if needed)
    // In a real implementation, you would call OnFrame(frame) or similar
    // For now, this is a stub for wiring
}
