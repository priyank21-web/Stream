# Core Engine

Native C++ cross-platform engine for capture, encoding, WebRTC transport, and input injection.

- Windows: DXGI, NVENC, WinAPI
- macOS: ScreenCaptureKit, VideoToolbox, Quartz Event Services
- Linux: X11/Wayland, VAAPI, ALSA/PulseAudio

## WebRTC Integration Guide

1. Download and build the [Google WebRTC C++ library](https://webrtc.googlesource.com/src/) for your platform.
2. Set the `WEBRTC_ROOT` variable in `core/CMakeLists.txt` to your local WebRTC build path.
3. Ensure the include and lib directories are present:
   - `${WEBRTC_ROOT}/include`
   - `${WEBRTC_ROOT}/lib`
4. Enable the `USE_WEBRTC` option in CMake (default ON).
5. Build the project. The core will link against the WebRTC library if found.
6. Implement the `WebRTCSession` class in `src/webrtc/WebRTCSession.cpp` using the WebRTC C++ API.
7. Wire up signaling (see `SignalingClient`), capture, and encoder modules for real streaming.

## Build
See `../docs/BUILD_AND_RUN.md` for instructions.
