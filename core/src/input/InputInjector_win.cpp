#include "InputInjector.h"
#include <Windows.h>

class WindowsInputInjector : public stream::InputInjector
{
public:
    void injectMouse(int x, int y, int button, bool down) override
    {
        SetCursorPos(x, y);
        DWORD flags = 0;
        if (button == 1)
            flags = down ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP;
        if (button == 2)
            flags = down ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP;
        if (flags)
            mouse_event(flags, 0, 0, 0, 0);
    }

    void injectKeyboard(int key, bool down) override
    {
        INPUT input = {0};
        input.type = INPUT_KEYBOARD;
        input.ki.wVk = key;
        input.ki.dwFlags = down ? 0 : KEYEVENTF_KEYUP;
        SendInput(1, &input, sizeof(INPUT));
    }
};

extern "C" std::unique_ptr<stream::InputInjector> createPlatformInputInjector()
{
    return std::make_unique<WindowsInputInjector>();
}
