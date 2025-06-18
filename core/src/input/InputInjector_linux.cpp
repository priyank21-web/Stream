#include "InputInjector.h"
#include <X11/Xlib.h>
#include <X11/extensions/XTest.h>
#include <memory>

namespace stream {
class LinuxInputInjector : public InputInjector {
public:
    LinuxInputInjector() {
        display_ = XOpenDisplay(NULL);
    }
    ~LinuxInputInjector() {
        if (display_) XCloseDisplay(display_);
    }
    void injectMouse(int x, int y, int button, bool down) override {
        XWarpPointer(display_, None, DefaultRootWindow(display_), 0, 0, 0, 0, x, y);
        XTestFakeButtonEvent(display_, button, down, 0);
        XFlush(display_);
    }
    void injectKeyboard(int key, bool down) override {
        XTestFakeKeyEvent(display_, key, down, 0);
        XFlush(display_);
    }
private:
    Display* display_;
};

std::unique_ptr<InputInjector> createPlatformInputInjector() {
    return std::make_unique<LinuxInputInjector>();
}
} // namespace stream
