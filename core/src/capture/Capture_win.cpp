#include "../../include/Capture.h"
#ifdef _WIN32
#include <Windows.h>
// TODO: Implement DXGI-based screen capture
namespace stream {
class WinCapture : public Capture {
public:
    bool start() override { /* DXGI init */ return true; }
    void stop() override { /* cleanup */ }
};
std::unique_ptr<Capture> createPlatformCapture() { return std::make_unique<WinCapture>(); }
}
#endif
