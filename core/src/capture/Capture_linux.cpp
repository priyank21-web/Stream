#include "Capture.h"
#include <X11/Xlib.h>
#include <X11/extensions/XShm.h>
#include <sys/ipc.h>
#include <sys/shm.h>
#include <unistd.h>
#include <cstring>
#include <iostream>
#include <thread>
#include <chrono>

class LinuxCapture : public Capture {
public:
    LinuxCapture() : running_(false) {}
    ~LinuxCapture() { Stop(); }

    bool Start(FrameCallback callback) override {
        callback_ = callback;
        running_ = true;
        capture_thread_ = std::thread(&LinuxCapture::CaptureLoop, this);
        return true;
    }

    void Stop() override {
        running_ = false;
        if (capture_thread_.joinable())
            capture_thread_.join();
    }

private:
    bool running_;
    FrameCallback callback_;
    std::thread capture_thread_;

    void CaptureLoop() {
        Display* display = XOpenDisplay(nullptr);
        if (!display) {
            std::cerr << "Failed to open X display" << std::endl;
            return;
        }

        Window root = DefaultRootWindow(display);
        XWindowAttributes gwa;
        XGetWindowAttributes(display, root, &gwa);
        int width = gwa.width;
        int height = gwa.height;

        XShmSegmentInfo shminfo;
        XImage* image = XShmCreateImage(display, DefaultVisual(display, 0), DefaultDepth(display, 0),
                                        ZPixmap, nullptr, &shminfo, width, height);
        shminfo.shmid = shmget(IPC_PRIVATE, image->bytes_per_line * image->height, IPC_CREAT | 0777);
        shminfo.shmaddr = (char*)shmat(shminfo.shmid, nullptr, 0);
        image->data = shminfo.shmaddr;
        shminfo.readOnly = False;

        if (!XShmAttach(display, &shminfo)) {
            std::cerr << "Failed to attach shared memory" << std::endl;
            return;
        }

        while (running_) {
            XShmGetImage(display, root, image, 0, 0, AllPlanes);

            FrameData frame;
            frame.data = (uint8_t*)image->data;
            frame.width = width;
            frame.height = height;
            frame.stride = image->bytes_per_line;
            frame.size = image->bytes_per_line * height;
            frame.timestamp = std::chrono::duration_cast<std::chrono::microseconds>(
                                  std::chrono::steady_clock::now().time_since_epoch()).count();

            callback_(frame);

            std::this_thread::sleep_for(std::chrono::milliseconds(16)); // ~60 FPS
        }

        // Cleanup
        XShmDetach(display, &shminfo);
        image->f.destroy_image(image);
        shmdt(shminfo.shmaddr);
        shmctl(shminfo.shmid, IPC_RMID, 0);
        XCloseDisplay(display);
    }
};

extern "C" Capture* CreateCapture() {
    return new LinuxCapture();
}
