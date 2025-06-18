#include "Encoder.h"
#include <iostream>
#include <vector>

// ⚠ NOTE: This is a high-level placeholder to demonstrate integration.
// In full production we would use libva + ffmpeg VAAPI encoder.

class VAAPIEncoder : public Encoder {
public:
    VAAPIEncoder() {}
    ~VAAPIEncoder() {}

    bool Start(int width, int height, int fps, EncodedCallback cb) override {
        callback_ = cb;
        std::cout << "VAAPI encoder start: " << width << "x" << height << "@" << fps << " fps" << std::endl;
        return true;
    }

    void EncodeFrame(const uint8_t* data, int stride) override {
        // Hardware accelerated encoding logic with VAAPI goes here.
        // This is a simplified dummy example.

        EncodedFrame encoded;
        encoded.data = std::vector<uint8_t>(data, data + stride); // placeholder
        encoded.isKeyFrame = true;
        encoded.timestamp = 0;

        callback_(encoded);
    }

    void Stop() override {
        std::cout << "VAAPI encoder stopped." << std::endl;
    }

private:
    EncodedCallback callback_;
};

extern "C" Encoder* CreateEncoder() {
    return new VAAPIEncoder();
}
