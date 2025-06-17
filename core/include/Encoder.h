#pragma once
#include <memory>
#include <vector>

namespace stream {
class Encoder {
public:
    virtual ~Encoder() = default;
    virtual bool encode(const std::vector<uint8_t>& frame) = 0;
};
std::unique_ptr<Encoder> createPlatformEncoder();
}
