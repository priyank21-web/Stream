# Virtual Device Drivers

Platform-specific virtual camera and microphone drivers.

- Windows: DirectShow (camera), WDM Kernel Streaming (mic)
- macOS: AVFoundation (camera), CoreAudio HAL (mic)
- Linux: v4l2loopback (camera), snd-aloop (mic)
