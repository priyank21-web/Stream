cmake_minimum_required(VERSION 3.15)
project(StreamCore)

set(CMAKE_CXX_STANDARD 20)

include_directories(include)

# Optional: Set WEBRTC_ROOT to your local WebRTC build
option(USE_WEBRTC "Enable Google WebRTC integration" ON)
if(USE_WEBRTC)
    set(WEBRTC_ROOT "${CMAKE_SOURCE_DIR}/third_party/webrtc/out/Default" CACHE PATH "Path to WebRTC")
    if(EXISTS "${WEBRTC_ROOT}/include")
        include_directories(${WEBRTC_ROOT}/include)
        link_directories(${WEBRTC_ROOT})
        message(STATUS "WebRTC enabled: ${WEBRTC_ROOT}")
    else()
        message(FATAL_ERROR "WebRTC not found at ${WEBRTC_ROOT}. Please run scripts/build_webrtc.sh and set WEBRTC_ROOT.")
    endif()
endif()

add_library(stream_core
    src/main.cpp
    src/capture/Capture_win.cpp
    src/capture/Capture_mac.mm
    src/capture/Capture_linux.cpp
    src/encode/Encoder_win.cpp
    src/encode/Encoder_mac.mm
    src/encode/Encoder_linux.cpp
    src/webrtc/WebRTCSession.cpp
    src/webrtc/SignalingClient_ws.cpp
    src/input/InputInjector_win.cpp
    src/input/InputInjector_mac.mm
    src/input/InputInjector_linux.cpp
    src/Logger.cpp
    src/HealthCheck.cpp
)

add_executable(stream_core_app src/main.cpp)
target_link_libraries(stream_core_app stream_core)

# Link WebRTC if available
if(USE_WEBRTC AND EXISTS "${WEBRTC_ROOT}")
    target_link_libraries(stream_core_app webrtc)
endif()
