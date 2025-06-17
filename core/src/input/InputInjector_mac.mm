#include "../../include/InputInjector.h"
#ifdef __APPLE__
// TODO: Implement Quartz Event Services input injection
namespace stream {
class MacInputInjector : public InputInjector {
public:
    void injectMouse(int x, int y, int button, bool down) override { /* Quartz mouse */ }
    void injectKeyboard(int key, bool down) override { /* Quartz keyboard */ }
};
std::unique_ptr<InputInjector> createPlatformInputInjector() { return std::make_unique<MacInputInjector>(); }
}
#endif
