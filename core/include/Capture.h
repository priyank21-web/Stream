#pragma once

#include <memory>
#include <vector>
#include <cstdint>
#include <functional>

struct FrameData {
    uint8_t* data;
    int width;
    int height;
    int stride;
    size_t size;
    uint64_t timestamp; // microseconds
};

class Capture {
public:
    using FrameCallback = std::function<void(const FrameData&)>;

    virtual ~Capture() = default;
    virtual bool Start(FrameCallback callback) = 0;
    virtual void Stop() = 0;
};

// Factory function for platform capture
std::unique_ptr<Capture> createPlatformCapture();
