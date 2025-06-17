#include "../../include/InputInjector.h"
#ifdef __linux__
// TODO: Implement XTest/X11 input injection
namespace stream {
class LinuxInputInjector : public InputInjector {
public:
    void injectMouse(int x, int y, int button, bool down) override { /* XTest mouse */ }
    void injectKeyboard(int key, bool down) override { /* XTest keyboard */ }
};
std::unique_ptr<InputInjector> createPlatformInputInjector() { return std::make_unique<LinuxInputInjector>(); }
}
#endif
