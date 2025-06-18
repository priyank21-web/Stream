#include "InputInjector.h"
#import <ApplicationServices/ApplicationServices.h>

class MacInputInjector : public InputInjector {
public:
    void MoveMouse(int x, int y) override {
        CGPoint point = CGPointMake(x, y);
        CGWarpMouseCursorPosition(point);
    }

    void MouseClick(bool down, int button) override {
        CGEventType type;
        if (button == 1) type = down ? kCGEventLeftMouseDown : kCGEventLeftMouseUp;
        if (button == 2) type = down ? kCGEventRightMouseDown : kCGEventRightMouseUp;

        CGPoint loc = CGEventGetLocation(CGEventCreate(NULL));
        CGEventRef event = CGEventCreateMouseEvent(NULL, type, loc, button - 1);
        CGEventPost(kCGHIDEventTap, event);
        CFRelease(event);
    }

    void KeyPress(bool down, int keycode) override {
        CGEventRef event = CGEventCreateKeyboardEvent(NULL, keycode, down);
        CGEventPost(kCGHIDEventTap, event);
        CFRelease(event);
    }
};

extern "C" InputInjector* CreateInputInjector() {
    return new MacInputInjector();
}
