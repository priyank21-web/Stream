#include "InputInjector.h"
#include <Windows.h>

class WindowsInputInjector : public InputInjector {
public:
    void MoveMouse(int x, int y) override {
        SetCursorPos(x, y);
    }

    void MouseClick(bool down, int button) override {
        DWORD flags = 0;
        if (button == 1) flags = down ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP;
        if (button == 2) flags = down ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP;
        mouse_event(flags, 0, 0, 0, 0);
    }

    void KeyPress(bool down, int keycode) override {
        INPUT input = { 0 };
        input.type = INPUT_KEYBOARD;
        input.ki.wVk = keycode;
        input.ki.dwFlags = down ? 0 : KEYEVENTF_KEYUP;
        SendInput(1, &input, sizeof(INPUT));
    }
};

extern "C" InputInjector* CreateInputInjector() {
    return new WindowsInputInjector();
}
