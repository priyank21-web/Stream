#include "../../include/InputInjector.h"
#ifdef _WIN32
// TODO: Implement WinAPI input injection
namespace stream {
class WinInputInjector : public InputInjector {
public:
    void injectMouse(int x, int y, int button, bool down) override { /* WinAPI mouse */ }
    void injectKeyboard(int key, bool down) override { /* WinAPI keyboard */ }
};
std::unique_ptr<InputInjector> createPlatformInputInjector() { return std::make_unique<WinInputInjector>(); }
}
#endif
