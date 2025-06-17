#include "../../include/Capture.h"
#ifdef __linux__
// TODO: Implement X11/Wayland-based screen capture
namespace stream {
class LinuxCapture : public Capture {
public:
    bool start() override { /* X11/Wayland init */ return true; }
    void stop() override { /* cleanup */ }
};
std::unique_ptr<Capture> createPlatformCapture() { return std::make_unique<LinuxCapture>(); }
}
#endif
