#pragma once
#include <memory>

namespace stream {
class InputInjector {
public:
    virtual ~InputInjector() = default;
    virtual void injectMouse(int x, int y, int button, bool down) = 0;
    virtual void injectKeyboard(int key, bool down) = 0;
};
std::unique_ptr<InputInjector> createPlatformInputInjector();
}
