#include "InputInjector.h"
#include <X11/Xlib.h>
#include <X11/extensions/XTest.h>

class LinuxInputInjector : public InputInjector {
public:
    LinuxInputInjector() {
        display_ = XOpenDisplay(NULL);
    }

    ~LinuxInputInjector() {
        if (display_) XCloseDisplay(display_);
    }

    void MoveMouse(int x, int y) override {
        XWarpPointer(display_, None, DefaultRootWindow(display_), 0, 0, 0, 0, x, y);
        XFlush(display_);
    }

    void MouseClick(bool down, int button) override {
        int buttonCode = (button == 1) ? 1 : 3;
        XTestFakeButtonEvent(display_, buttonCode, down, 0);
        XFlush(display_);
    }

    void KeyPress(bool down, int keycode) override {
        XTestFakeKeyEvent(display_, keycode, down, 0);
        XFlush(display_);
    }

private:
    Display* display_;
};

extern "C" InputInjector* CreateInputInjector() {
    return new LinuxInputInjector();
}
