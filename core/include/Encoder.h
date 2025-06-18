#pragma once

#include <vector>
#include <functional>
#include <cstdint>

struct EncodedFrame {
    std::vector<uint8_t> data;
    bool isKeyFrame;
    uint64_t timestamp;
};

class Encoder {
public:
    using EncodedCallback = std::function<void(const EncodedFrame&)>;

    virtual ~Encoder() = default;
    virtual bool Start(int width, int height, int fps, EncodedCallback callback) = 0;
    virtual void EncodeFrame(const uint8_t* data, int stride) = 0;
    virtual void Stop() = 0;
};
