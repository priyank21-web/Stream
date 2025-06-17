#include "../../include/Encoder.h"
#ifdef __linux__
// TODO: Implement VAAPI-based encoding
namespace stream {
class LinuxEncoder : public Encoder {
public:
    bool encode(const std::vector<uint8_t>& frame) override { /* VAAPI encode */ return true; }
};
std::unique_ptr<Encoder> createPlatformEncoder() { return std::make_unique<LinuxEncoder>(); }
}
#endif
