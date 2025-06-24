cmake_minimum_required(VERSION 3.15)
project(StreamCore)

set(CMAKE_CXX_STANDARD 20)

include_directories(include)

# Optional: Set WEBRTC_ROOT to your local WebRTC build
option(USE_WEBRTC "Enable Google WebRTC integration" ON)
if(USE_WEBRTC)
    set(WEBRTC_ROOT "${CMAKE_SOURCE_DIR}/third_party/webrtc/out/Default" CACHE PATH "Path to WebRTC")
    include_directories(${WEBRTC_ROOT}/include)
    include_directories(${CMAKE_SOURCE_DIR}/third_party/webrtc/src/) # <-- Add this line to use headers from source
    link_directories(${WEBRTC_ROOT})
    message(STATUS "WebRTC enabled: ${WEBRTC_ROOT}")
    add_definitions(-DUSE_WEBRTC)
    include_directories(${CMAKE_SOURCE_DIR}/third_party/webrtc/src/)
endif()

include_directories(${CMAKE_SOURCE_DIR}/third_party/websocketpp) # <-- Add websocketpp include

set(SRC_FILES
    src/main.cpp
    src/HealthCheck.cpp
    src/Logger.cpp
    src/ColorConvert.cpp
)

if(WIN32)
    list(APPEND SRC_FILES
        src/capture/Capture_win.cpp
        src/encode/Encoder_win.cpp
        src/input/InputInjector_win.cpp
    )
elseif(APPLE)
    list(APPEND SRC_FILES
        src/capture/Capture_mac.mm
        src/encode/Encoder_mac.mm
        src/input/InputInjector_mac.mm
    )
else()
    list(APPEND SRC_FILES
        src/capture/Capture_linux.cpp
        src/encode/Encoder_linux.cpp
        src/input/InputInjector_linux.cpp
    )
endif()

list(APPEND SRC_FILES
    src/webrtc/SignalingClient_ws.cpp
    src/webrtc/WebRTCSession.cpp
    src/webrtc/FrameVideoSource.cpp
)

add_library(stream_core ${SRC_FILES})
add_executable(stream_core_app src/main.cpp)
target_link_libraries(stream_core_app stream_core)

# Link WebRTC if available
if(USE_WEBRTC AND EXISTS "${WEBRTC_ROOT}")
    target_link_libraries(stream_core_app webrtc)
endif()

# Add a test target for the core pipeline
enable_testing()
add_executable(test_core_pipeline tests/test_core_pipeline.cpp)
target_link_libraries(test_core_pipeline stream_core)
add_test(NAME CorePipelineTest COMMAND test_core_pipeline)
