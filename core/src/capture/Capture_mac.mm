#include "../../include/Capture.h"
#ifdef __APPLE__
// TODO: Implement ScreenCaptureKit-based screen capture
namespace stream {
class MacCapture : public Capture {
public:
    bool start() override { /* ScreenCaptureKit init */ return true; }
    void stop() override { /* cleanup */ }
};
std::unique_ptr<Capture> createPlatformCapture() { return std::make_unique<MacCapture>(); }
}
#endif
