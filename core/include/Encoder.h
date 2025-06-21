#pragma once

#include <vector>
#include <functional>
#include <cstdint>
#include <memory>
#include <string>
#include <thread>
#include <chrono>
#include <fstream>

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
    // Session recording API
    virtual void startRecording(const std::string& filename) { (void)filename; }
    virtual void stopRecording() {}
    virtual bool isRecording() const { return false; }
    // Session playback API
    static void playRecording(const std::string& filename, EncodedCallback callback, int fps = 30) {
        std::ifstream file(filename, std::ios::binary);
        if (!file.is_open()) return;
        // NOTE: This is a simple demo for raw .h264 files with one NAL per frame.
        std::vector<uint8_t> buffer((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        size_t pos = 0;
        while (pos < buffer.size()) {
            // Find next NAL start code (0x00000001)
            size_t next = buffer.size();
            for (size_t i = pos + 4; i + 3 < buffer.size(); ++i) {
                if (buffer[i] == 0 && buffer[i+1] == 0 && buffer[i+2] == 0 && buffer[i+3] == 1) {
                    next = i;
                    break;
                }
            }
            EncodedFrame frame;
            frame.data.assign(buffer.begin() + pos, buffer.begin() + next);
            frame.isKeyFrame = (frame.data.size() > 4 && (frame.data[4] & 0x1F) == 5); // IDR NAL
            frame.timestamp = pos;
            callback(frame);
            std::this_thread::sleep_for(std::chrono::milliseconds(1000 / fps));
            pos = next;
        }
    }
};

// Factory function for platform encoder
std::unique_ptr<Encoder> createPlatformEncoder();
