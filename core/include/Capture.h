#pragma once
#include <memory>

namespace stream {
class Capture {
public:
    virtual ~Capture() = default;
    virtual bool start() = 0;
    virtual void stop() = 0;
};
std::unique_ptr<Capture> createPlatformCapture();
}
