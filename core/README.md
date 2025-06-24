# Core Engine

Native C++ cross-platform engine for capture, encoding, WebRTC transport, and input injection.

- Windows: DXGI, NVENC, WinAPI
- macOS: ScreenCaptureKit, VideoToolbox, Quartz Event Services
- Linux: X11/Wayland, VAAPI, ALSA/PulseAudio

## WebRTC Installation (Windows Example)

1. **Download WebRTC Source:**

   - Follow the official guide: https://webrtc.googlesource.com/src/+/refs/heads/main/docs/native-code/development/index.md
   - Use depot_tools to fetch and sync the source code.

2. **Build WebRTC:**

   - Open a command prompt and run:
     ```
     fetch --nohooks webrtc
     gclient sync
     cd src
     gn gen out/Default --args="is_debug=false is_component_build=false target_cpu=\"x64\""
     ninja -C out/Default
     ```

3. **Copy Build Output:**

   - Copy the `out/Default` directory to `core/third_party/webrtc/out/Default` in this repo.
   - Ensure the following exist:
     - `core/third_party/webrtc/out/Default/include`
     - `core/third_party/webrtc/out/Default/*.lib` (or `.a` for Linux/macOS)

4. **Build This Project:**

   - From the `core` directory:
     ```
     mkdir build
     cd build
     cmake ..
     cmake --build . --config Release
     ```

5. **Troubleshooting:**
   - If CMake cannot find WebRTC, check that `WEBRTC_ROOT` is set correctly in `CMakeLists.txt` and the files are present.

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
