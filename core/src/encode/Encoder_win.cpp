#include "Encoder.h"
#include <iostream>

// ⚠ NOTE: Requires NVIDIA Video Codec SDK installed and linked properly!
// This is a simplified interface stub. Full production encoder is larger.

class NVENCEncoder : public Encoder {
public:
    NVENCEncoder() {}
    ~NVENCEncoder() {}

    bool Start(int width, int height, int fps, EncodedCallback callback) override {
        callback_ = callback;
        // Initialize NVENC session here
        // Load NVENC DLL dynamically, create encoder session
        std::cout << "NVENC Start (" << width << "x" << height << "@" << fps << ")" << std::endl;
        return true;
    }

    void EncodeFrame(const uint8_t* data, int stride) override {
        // Send frame to NVENC and receive encoded packet
        // This is simplified — normally requires GPU memory buffers
        EncodedFrame encoded;
        encoded.data = std::vector<uint8_t>(data, data + stride); // placeholder only
        encoded.isKeyFrame = true;
        encoded.timestamp = 0;

        callback_(encoded);
    }

    void Stop() override {
        // Destroy NVENC session here
        std::cout << "NVENC stopped." << std::endl;
    }

private:
    EncodedCallback callback_;
};

extern "C" Encoder* CreateEncoder() {
    return new NVENCEncoder();
}
