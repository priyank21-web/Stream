#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/videodev2.h>
#include <cstring>
#include <iostream>

class V4L2VirtualCamera {
public:
    V4L2VirtualCamera(const std::string& devicePath) : devicePath_(devicePath), fd_(-1) {}

    bool Open() {
        fd_ = open(devicePath_.c_str(), O_WRONLY);
        if (fd_ < 0) {
            perror("Failed to open v4l2loopback device");
            return false;
        }
        return true;
    }

    bool WriteFrame(const uint8_t* data, size_t size) {
        if (write(fd_, data, size) != (ssize_t)size) {
            perror("Failed to write frame to v4l2loopback");
            return false;
        }
        return true;
    }

    void Close() {
        if (fd_ >= 0)
            close(fd_);
        fd_ = -1;
    }

    ~V4L2VirtualCamera() {
        Close();
    }

private:
    std::string devicePath_;
    int fd_;
};
