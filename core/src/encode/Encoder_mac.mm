#include "../../include/Encoder.h"
#ifdef __APPLE__
// TODO: Implement VideoToolbox-based encoding
namespace stream {
class MacEncoder : public Encoder {
public:
    bool encode(const std::vector<uint8_t>& frame) override { /* VideoToolbox encode */ return true; }
};
std::unique_ptr<Encoder> createPlatformEncoder() { return std::make_unique<MacEncoder>(); }
}
#endif
