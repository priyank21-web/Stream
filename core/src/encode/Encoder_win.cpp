#include "../../include/Encoder.h"
#ifdef _WIN32
// TODO: Implement NVENC-based encoding
namespace stream {
class WinEncoder : public Encoder {
public:
    bool encode(const std::vector<uint8_t>& frame) override { /* NVENC encode */ return true; }
};
std::unique_ptr<Encoder> createPlatformEncoder() { return std::make_unique<WinEncoder>(); }
}
#endif
